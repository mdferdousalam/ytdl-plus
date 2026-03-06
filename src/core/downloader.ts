import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import * as path from 'path';
import { EventEmitter } from 'events';
import { getInnertube } from './client';
import { getVideoInfo } from './info';
import { getBestFormat, getAudioOnlyFormats } from './format';
import { ProgressTracker } from '../utils/progress';
import { sanitizeFilename } from '../utils/validate';
import { ensureDir, parseFilenameTemplate, pLimit } from '../utils/helpers';
import type {
  DownloadOptions,
  AudioDownloadOptions,
  PlaylistDownloadOptions,
  DownloadResult,
  PlaylistDownloadResult,
  DownloadProgress,
  DownloadEvents,
  VideoFormat,
  VideoInfo,
  YtdlPlusOptions,
} from '../types';

export class VideoDownloader extends EventEmitter {
  private readonly options: YtdlPlusOptions;

  constructor(options?: YtdlPlusOptions) {
    super();
    this.options = options ?? {};
  }

  on<K extends keyof DownloadEvents>(event: K, listener: DownloadEvents[K]): this {
    return super.on(event, listener);
  }

  emit<K extends keyof DownloadEvents>(event: K, ...args: Parameters<DownloadEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  async download(urlOrId: string, downloadOptions?: DownloadOptions): Promise<DownloadResult> {
    const info = await getVideoInfo(urlOrId, this.options);
    const format = this.selectFormat(info, downloadOptions);

    if (!format) {
      throw new Error('No suitable format found for the given quality/format preferences');
    }

    this.emit('start', { title: info.title, format });

    const outputDir = downloadOptions?.outputDir ?? process.cwd();
    await ensureDir(outputDir);

    const ext = this.getExtension(format, downloadOptions?.format);
    const filename = this.resolveFilename(info, format, ext, downloadOptions?.filename);
    const filePath = path.join(outputDir, filename);

    await this.downloadStream(urlOrId, format, filePath);

    const result: DownloadResult = {
      filePath,
      title: info.title,
      duration: info.duration,
      fileSize: format.contentLength ?? 0,
      format: ext,
      quality: format.qualityLabel || format.quality,
    };

    this.emit('end', result);
    return result;
  }

  async downloadAudio(urlOrId: string, downloadOptions?: AudioDownloadOptions): Promise<DownloadResult> {
    const info = await getVideoInfo(urlOrId, this.options);

    const audioFormats = getAudioOnlyFormats(info.formats);
    let format: VideoFormat | null = null;

    if (audioFormats.length > 0) {
      format = getBestFormat(audioFormats, downloadOptions?.quality ?? 'highestaudio');
    }

    if (!format) {
      format = getBestFormat(info.formats, downloadOptions?.quality ?? 'highestaudio');
    }

    if (!format) {
      throw new Error('No audio format available for this video');
    }

    this.emit('start', { title: info.title, format });

    const outputDir = downloadOptions?.outputDir ?? process.cwd();
    await ensureDir(outputDir);

    const ext = downloadOptions?.format ?? this.getAudioExtension(format);
    const filename = this.resolveFilename(info, format, ext, downloadOptions?.filename);
    const filePath = path.join(outputDir, filename);

    await this.downloadStream(urlOrId, format, filePath);

    const result: DownloadResult = {
      filePath,
      title: info.title,
      duration: info.duration,
      fileSize: format.contentLength ?? 0,
      format: ext,
      quality: format.qualityLabel || format.quality,
    };

    this.emit('end', result);
    return result;
  }

  async downloadPlaylist(
    urlOrId: string,
    downloadOptions?: PlaylistDownloadOptions
  ): Promise<PlaylistDownloadResult> {
    const { getPlaylistInfo } = await import('./info');
    const playlistInfo = await getPlaylistInfo(urlOrId, this.options);

    const startIdx = downloadOptions?.startIndex ?? 0;
    const endIdx = downloadOptions?.endIndex ?? playlistInfo.videos.length;
    const concurrency = downloadOptions?.concurrency ?? 3;
    const videosToDownload = playlistInfo.videos.slice(startIdx, endIdx);

    const results: PlaylistDownloadResult['results'] = [];
    let completed = 0;
    let failed = 0;

    const limit = pLimit(concurrency);

    const tasks = videosToDownload.map((video) => {
      return limit(async () => {
        downloadOptions?.onVideoStart?.(video, video.index);

        try {
          const result = await this.download(video.id, {
            quality: downloadOptions?.quality,
            format: downloadOptions?.format,
            outputDir: downloadOptions?.outputDir,
            overwrite: downloadOptions?.overwrite,
          });

          completed++;
          downloadOptions?.onVideoComplete?.(video, video.index, result.filePath);
          results.push({ video, result, error: null });
        } catch (err) {
          failed++;
          const error = err instanceof Error ? err : new Error(String(err));
          downloadOptions?.onVideoError?.(video, video.index, error);
          results.push({ video, result: null, error });
        }
      });
    });

    await Promise.all(tasks);

    return {
      playlistTitle: playlistInfo.title,
      totalVideos: videosToDownload.length,
      completed,
      failed,
      results,
    };
  }

  async getStream(urlOrId: string, downloadOptions?: DownloadOptions): Promise<{
    stream: ReadableStream<Uint8Array>;
    info: VideoInfo;
    format: VideoFormat;
  }> {
    const info = await getVideoInfo(urlOrId, this.options);
    const format = this.selectFormat(info, downloadOptions);

    if (!format) {
      throw new Error('No suitable format found');
    }

    const innertube = await getInnertube(this.options);
    const stream = await innertube.download(info.id, {
      type: format.hasVideo ? 'video+audio' : 'audio',
      quality: format.qualityLabel || undefined,
    });

    if (!stream) {
      throw new Error('Failed to get download stream');
    }

    return { stream, info, format };
  }

  private selectFormat(info: VideoInfo, options?: DownloadOptions): VideoFormat | null {
    const quality = options?.quality ?? 'highest';

    let filteredFormats = info.formats;
    if (options?.format) {
      const containerMap: Record<string, string> = {
        mp4: 'mp4',
        webm: 'webm',
        mp3: 'mp4',
        m4a: 'mp4',
        opus: 'webm',
        flac: 'webm',
        wav: 'webm',
      };
      const targetContainer = containerMap[options.format];
      if (targetContainer) {
        const containerFiltered = filteredFormats.filter((f) => f.container === targetContainer);
        if (containerFiltered.length > 0) {
          filteredFormats = containerFiltered;
        }
      }
    }

    return getBestFormat(filteredFormats, quality);
  }

  private async downloadStream(urlOrId: string, format: VideoFormat, filePath: string): Promise<void> {
    const innertube = await getInnertube(this.options);

    const info = await innertube.getBasicInfo(urlOrId);
    const stream = await info.download({
      type: format.hasVideo ? 'video+audio' : 'audio',
      quality: format.qualityLabel || undefined,
    });

    if (!stream) {
      throw new Error('Failed to get download stream');
    }

    const totalBytes = format.contentLength ?? 0;
    const tracker = new ProgressTracker(totalBytes);

    const nodeStream = Readable.fromWeb(stream as Parameters<typeof Readable.fromWeb>[0]);

    let downloaded = 0;
    nodeStream.on('data', (chunk: Buffer) => {
      downloaded += chunk.length;
      if (totalBytes > 0) {
        const progress: DownloadProgress = tracker.update(downloaded);
        this.emit('progress', progress);
      }
    });

    const writeStream = createWriteStream(filePath);
    await pipeline(nodeStream, writeStream);
  }

  private getExtension(format: VideoFormat, preferredFormat?: string): string {
    if (preferredFormat) {
      const audioFormats = ['mp3', 'm4a', 'opus', 'flac', 'wav'];
      if (audioFormats.includes(preferredFormat)) return preferredFormat;
      return preferredFormat;
    }
    return format.container || 'mp4';
  }

  private getAudioExtension(format: VideoFormat): string {
    if (format.container === 'webm') return 'opus';
    if (format.container === 'mp4') return 'm4a';
    return format.container || 'm4a';
  }

  private resolveFilename(
    info: VideoInfo,
    format: VideoFormat,
    ext: string,
    template?: string
  ): string {
    const vars: Record<string, string> = {
      title: sanitizeFilename(info.title),
      id: info.id,
      ext,
      quality: format.qualityLabel || format.quality || 'unknown',
      channel: sanitizeFilename(info.channel.name),
    };

    if (template) {
      const name = parseFilenameTemplate(template, vars);
      return name.endsWith(`.${ext}`) ? name : `${name}.${ext}`;
    }

    return `${vars.title}.${ext}`;
  }
}
