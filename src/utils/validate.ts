const VIDEO_URL_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?m\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?music\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
];

const PLAYLIST_URL_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?.*list=([a-zA-Z0-9_-]+)/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*list=([a-zA-Z0-9_-]+)/,
];

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function validateURL(url: string): boolean {
  return VIDEO_URL_PATTERNS.some((pattern) => pattern.test(url));
}

export function validatePlaylistURL(url: string): boolean {
  return PLAYLIST_URL_PATTERNS.some((pattern) => pattern.test(url));
}

export function extractVideoId(url: string): string | null {
  if (VIDEO_ID_REGEX.test(url)) return url;

  for (const pattern of VIDEO_URL_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function extractPlaylistId(url: string): string | null {
  for (const pattern of PLAYLIST_URL_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function isVideoURL(input: string): boolean {
  return validateURL(input) || VIDEO_ID_REGEX.test(input);
}

export function isPlaylistURL(input: string): boolean {
  return validatePlaylistURL(input);
}

const UNSAFE_FILENAME_CHARS = /[/\\:*?"<>|]/g;

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(UNSAFE_FILENAME_CHARS, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}
