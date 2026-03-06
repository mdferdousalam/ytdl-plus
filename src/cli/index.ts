#!/usr/bin/env node

import { VideoDownloader } from '../core/downloader';
import { getVideoInfo, getPlaylistInfo } from '../core/info';
import { search } from '../core/search';
import { listQualities } from '../core/format';
import { validateURL, validatePlaylistURL } from '../utils/validate';
import { formatBytes, formatDuration, formatSpeed } from '../utils/helpers';
import type { DownloadProgress } from '../types';

const args = process.argv.slice(2);

function printHelp(): void {
  console.log(`
ytdl-plus - A comprehensive YouTube downloader

USAGE:
  ytdl-plus <command> [options]

COMMANDS:
  download <url>         Download a video
  audio <url>            Download audio only
  info <url>             Get video information
  playlist <url>         Download a playlist
  search <query>         Search YouTube
  formats <url>          List available formats
  help                   Show this help message

OPTIONS:
  -q, --quality <q>      Quality: highest, lowest, or itag number (default: highest)
  -f, --format <fmt>     Format: mp4, webm, mp3, m4a, opus (default: mp4)
  -o, --output <dir>     Output directory (default: current directory)
  -n, --name <template>  Filename template: {title}, {id}, {ext}, {quality}, {channel}
  --overwrite            Overwrite existing files
  -c, --concurrency <n>  Parallel downloads for playlists (default: 3)
  --limit <n>            Limit search results (default: 10)

EXAMPLES:
  ytdl-plus download "https://youtube.com/watch?v=dQw4w9WgXcQ"
  ytdl-plus audio "https://youtube.com/watch?v=dQw4w9WgXcQ" -f mp3
  ytdl-plus info "https://youtube.com/watch?v=dQw4w9WgXcQ"
  ytdl-plus playlist "https://youtube.com/playlist?list=PLxxxxxx" -c 5
  ytdl-plus search "javascript tutorial" --limit 5
  ytdl-plus formats "https://youtube.com/watch?v=dQw4w9WgXcQ"
`);
}

function parseArgs(args: string[]): { command: string; target: string; flags: Record<string, string> } {
  const command = args[0] ?? 'help';
  const flags: Record<string, string> = {};
  let target = '';

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith('-')) {
      const key = arg.replace(/^-+/, '');
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        flags[key] = value;
        i++;
      } else {
        flags[key] = 'true';
      }
    } else if (!target) {
      target = arg;
    }
  }

  return { command, target, flags };
}

function getFlag(flags: Record<string, string>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (flags[key]) return flags[key];
  }
  return undefined;
}

function createProgressBar(progress: DownloadProgress): string {
  const width = 30;
  const filled = Math.round((progress.percent / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `\r[${bar}] ${progress.percent.toFixed(1)}% | ${formatBytes(progress.downloaded)}/${formatBytes(progress.total)} | ${formatSpeed(progress.speed)} | ETA: ${progress.eta}s`;
}

async function main(): Promise<void> {
  const { command, target, flags } = parseArgs(args);

  if (command === 'help' || flags['h'] || flags['help']) {
    printHelp();
    return;
  }

  if (!target && command !== 'help') {
    console.error('Error: URL or search query is required');
    process.exit(1);
  }

  const quality = getFlag(flags, 'q', 'quality') ?? 'highest';
  const format = getFlag(flags, 'f', 'format');
  const outputDir = getFlag(flags, 'o', 'output');
  const filename = getFlag(flags, 'n', 'name');
  const overwrite = flags['overwrite'] === 'true';
  const concurrency = parseInt(getFlag(flags, 'c', 'concurrency') ?? '3', 10);
  const limit = parseInt(getFlag(flags, 'limit') ?? '10', 10);

  const downloader = new VideoDownloader();

  switch (command) {
    case 'download':
    case 'd': {
      if (!validateURL(target)) {
        console.error('Error: Invalid YouTube URL');
        process.exit(1);
      }

      console.log('Fetching video info...');
      const parsedQuality = isNaN(Number(quality)) ? quality as 'highest' | 'lowest' : Number(quality);

      downloader.on('progress', (p) => {
        process.stdout.write(createProgressBar(p));
      });

      downloader.on('start', (info) => {
        console.log(`Downloading: ${info.title}`);
        console.log(`Format: ${info.format.qualityLabel || info.format.quality} (${info.format.container})`);
      });

      const result = await downloader.download(target, {
        quality: parsedQuality,
        format: format as DownloadOptions['format'],
        outputDir,
        filename,
        overwrite,
      });

      console.log(`\nDone! Saved to: ${result.filePath}`);
      console.log(`Size: ${formatBytes(result.fileSize)} | Duration: ${formatDuration(result.duration)}`);
      break;
    }

    case 'audio':
    case 'a': {
      if (!validateURL(target)) {
        console.error('Error: Invalid YouTube URL');
        process.exit(1);
      }

      console.log('Fetching video info...');

      downloader.on('progress', (p) => {
        process.stdout.write(createProgressBar(p));
      });

      downloader.on('start', (info) => {
        console.log(`Downloading audio: ${info.title}`);
      });

      const audioResult = await downloader.downloadAudio(target, {
        format: (format ?? 'm4a') as AudioDownloadOptions['format'],
        outputDir,
        filename,
        overwrite,
      });

      console.log(`\nDone! Saved to: ${audioResult.filePath}`);
      console.log(`Size: ${formatBytes(audioResult.fileSize)} | Duration: ${formatDuration(audioResult.duration)}`);
      break;
    }

    case 'info':
    case 'i': {
      if (!validateURL(target)) {
        console.error('Error: Invalid YouTube URL');
        process.exit(1);
      }

      console.log('Fetching video info...');
      const info = await getVideoInfo(target);

      console.log(`\nTitle:       ${info.title}`);
      console.log(`Channel:     ${info.channel.name}`);
      console.log(`Duration:    ${formatDuration(info.duration)}`);
      console.log(`Views:       ${info.viewCount.toLocaleString()}`);
      console.log(`ID:          ${info.id}`);
      console.log(`Live:        ${info.isLive ? 'Yes' : 'No'}`);
      console.log(`Tags:        ${info.tags.slice(0, 5).join(', ')}`);
      console.log(`Formats:     ${info.formats.length} available`);
      console.log(`Subtitles:   ${info.subtitles.length} tracks`);
      console.log(`Chapters:    ${info.chapters.length}`);

      if (info.chapters.length > 0) {
        console.log('\nChapters:');
        for (const ch of info.chapters) {
          console.log(`  ${formatDuration(ch.startTime)} - ${ch.title}`);
        }
      }
      break;
    }

    case 'formats':
    case 'f': {
      if (!validateURL(target)) {
        console.error('Error: Invalid YouTube URL');
        process.exit(1);
      }

      console.log('Fetching formats...');
      const fmtInfo = await getVideoInfo(target);
      const qualities = listQualities(fmtInfo.formats);

      console.log(`\nAvailable qualities: ${qualities.join(', ')}\n`);
      console.log('itag  | Quality    | Container | Codec          | Audio | Video | Size');
      console.log('------|------------|-----------|----------------|-------|-------|--------');

      for (const f of fmtInfo.formats) {
        const size = f.contentLength ? formatBytes(f.contentLength) : 'N/A';
        console.log(
          `${String(f.itag).padEnd(6)}| ${(f.qualityLabel || f.quality || '').padEnd(11)}| ${f.container.padEnd(10)}| ${(f.codec || '').padEnd(15)}| ${f.hasAudio ? 'Yes' : 'No '}   | ${f.hasVideo ? 'Yes' : 'No '}   | ${size}`
        );
      }
      break;
    }

    case 'playlist':
    case 'p': {
      if (!validatePlaylistURL(target)) {
        console.error('Error: Invalid YouTube playlist URL');
        process.exit(1);
      }

      console.log('Fetching playlist info...');
      const playlistInfo = await getPlaylistInfo(target);
      console.log(`Playlist: ${playlistInfo.title} (${playlistInfo.videoCount} videos)`);
      console.log(`Downloading with concurrency: ${concurrency}\n`);

      const parsedQ = isNaN(Number(quality)) ? quality as 'highest' | 'lowest' : Number(quality);

      const playlistResult = await downloader.downloadPlaylist(target, {
        quality: parsedQ,
        format: format as DownloadOptions['format'],
        outputDir,
        concurrency,
        overwrite,
        onVideoStart: (video, idx) => {
          console.log(`[${idx + 1}/${playlistInfo.videoCount}] Starting: ${video.title}`);
        },
        onVideoComplete: (_video, idx, filePath) => {
          console.log(`[${idx + 1}/${playlistInfo.videoCount}] Done: ${filePath}`);
        },
        onVideoError: (video, idx, error) => {
          console.error(`[${idx + 1}/${playlistInfo.videoCount}] Failed: ${video.title} - ${error.message}`);
        },
      });

      console.log(`\nPlaylist download complete!`);
      console.log(`Completed: ${playlistResult.completed}/${playlistResult.totalVideos}`);
      if (playlistResult.failed > 0) {
        console.log(`Failed: ${playlistResult.failed}`);
      }
      break;
    }

    case 'search':
    case 's': {
      console.log(`Searching for: "${target}"...\n`);
      const results = await search(target, { limit });

      for (const r of results) {
        if (r.type === 'video') {
          console.log(`[VIDEO] ${r.title}`);
          console.log(`        ${r.url}`);
          console.log(`        Duration: ${r.duration ? formatDuration(r.duration) : 'N/A'} | Views: ${r.viewCount?.toLocaleString() ?? 'N/A'} | Channel: ${r.channel?.name ?? 'N/A'}`);
          console.log();
        } else if (r.type === 'playlist') {
          console.log(`[PLAYLIST] ${r.title}`);
          console.log(`           ${r.url}`);
          console.log(`           Videos: ${r.videoCount ?? 'N/A'}`);
          console.log();
        } else if (r.type === 'channel') {
          console.log(`[CHANNEL] ${r.title}`);
          console.log(`          ${r.url}`);
          console.log(`          Subscribers: ${r.subscribers ?? 'N/A'}`);
          console.log();
        }
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

// Import types needed for the CLI
type DownloadOptions = import('../types').DownloadOptions;
type AudioDownloadOptions = import('../types').AudioDownloadOptions;

main().catch((err: Error) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
