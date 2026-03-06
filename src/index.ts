import { VideoDownloader } from './core/downloader';
import { getVideoInfo, getPlaylistInfo } from './core/info';
import {
  filterFormats,
  getBestFormat,
  getVideoAndAudioFormats,
  getAudioOnlyFormats,
  getVideoOnlyFormats,
  getFormatByItag,
  listQualities,
} from './core/format';
import { search } from './core/search';
import { resetClient } from './core/client';
import {
  validateURL,
  validatePlaylistURL,
  extractVideoId,
  extractPlaylistId,
  isVideoURL,
  isPlaylistURL,
  sanitizeFilename,
} from './utils/validate';
import { formatBytes, formatDuration, formatSpeed } from './utils/helpers';
import type {
  VideoInfo,
  VideoFormat,
  Thumbnail,
  Chapter,
  SubtitleTrack,
  PlaylistInfo,
  PlaylistItem,
  SearchResult,
  DownloadOptions,
  AudioDownloadOptions,
  PlaylistDownloadOptions,
  DownloadProgress,
  DownloadResult,
  PlaylistDownloadResult,
  DownloadEvents,
  FormatFilter,
  YtdlPlusOptions,
} from './types';

/**
 * Create a new YtdlPlus downloader instance.
 */
function createClient(options?: YtdlPlusOptions): VideoDownloader {
  return new VideoDownloader(options);
}

/**
 * Default client instance for quick usage.
 */
const defaultClient = new VideoDownloader();

/**
 * Quick download — download a video with default settings.
 */
async function download(
  urlOrId: string,
  options?: DownloadOptions
): Promise<DownloadResult> {
  return defaultClient.download(urlOrId, options);
}

/**
 * Quick audio download — extract audio from a video.
 */
async function downloadAudio(
  urlOrId: string,
  options?: AudioDownloadOptions
): Promise<DownloadResult> {
  return defaultClient.downloadAudio(urlOrId, options);
}

/**
 * Quick playlist download.
 */
async function downloadPlaylist(
  urlOrId: string,
  options?: PlaylistDownloadOptions
): Promise<PlaylistDownloadResult> {
  return defaultClient.downloadPlaylist(urlOrId, options);
}

/**
 * Get a readable stream for a video.
 */
async function getStream(urlOrId: string, options?: DownloadOptions) {
  return defaultClient.getStream(urlOrId, options);
}

// Main namespace-style export
const ytdl = {
  // Core
  createClient,
  download,
  downloadAudio,
  downloadPlaylist,
  getStream,
  getVideoInfo,
  getPlaylistInfo,
  search,
  resetClient,

  // Format utilities
  filterFormats,
  getBestFormat,
  getVideoAndAudioFormats,
  getAudioOnlyFormats,
  getVideoOnlyFormats,
  getFormatByItag,
  listQualities,

  // URL utilities
  validateURL,
  validatePlaylistURL,
  extractVideoId,
  extractPlaylistId,
  isVideoURL,
  isPlaylistURL,
  sanitizeFilename,

  // Formatting helpers
  formatBytes,
  formatDuration,
  formatSpeed,
};

export { ytdl };
export default ytdl;

// Named exports for tree-shaking
export {
  VideoDownloader,
  createClient,
  download,
  downloadAudio,
  downloadPlaylist,
  getStream,
  getVideoInfo,
  getPlaylistInfo,
  search,
  resetClient,
  filterFormats,
  getBestFormat,
  getVideoAndAudioFormats,
  getAudioOnlyFormats,
  getVideoOnlyFormats,
  getFormatByItag,
  listQualities,
  validateURL,
  validatePlaylistURL,
  extractVideoId,
  extractPlaylistId,
  isVideoURL,
  isPlaylistURL,
  sanitizeFilename,
  formatBytes,
  formatDuration,
  formatSpeed,
};

// Type exports
export type {
  VideoInfo,
  VideoFormat,
  Thumbnail,
  Chapter,
  SubtitleTrack,
  PlaylistInfo,
  PlaylistItem,
  SearchResult,
  DownloadOptions,
  AudioDownloadOptions,
  PlaylistDownloadOptions,
  DownloadProgress,
  DownloadResult,
  PlaylistDownloadResult,
  DownloadEvents,
  FormatFilter,
  YtdlPlusOptions,
};
