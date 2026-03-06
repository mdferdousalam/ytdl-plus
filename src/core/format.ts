import type { VideoFormat, FormatFilter } from '../types';

export function filterFormats(formats: VideoFormat[], filter: FormatFilter): VideoFormat[] {
  return formats.filter((f) => {
    if (filter.hasAudio !== undefined && f.hasAudio !== filter.hasAudio) return false;
    if (filter.hasVideo !== undefined && f.hasVideo !== filter.hasVideo) return false;
    if (filter.container && f.container !== filter.container) return false;
    if (filter.minHeight && (f.height === null || f.height < filter.minHeight)) return false;
    if (filter.maxHeight && f.height !== null && f.height > filter.maxHeight) return false;
    if (filter.minBitrate && (f.bitrate === null || f.bitrate < filter.minBitrate)) return false;
    if (filter.maxBitrate && f.bitrate !== null && f.bitrate > filter.maxBitrate) return false;
    return true;
  });
}

export function getVideoAndAudioFormats(formats: VideoFormat[]): VideoFormat[] {
  return filterFormats(formats, { hasAudio: true, hasVideo: true });
}

export function getAudioOnlyFormats(formats: VideoFormat[]): VideoFormat[] {
  return filterFormats(formats, { hasAudio: true, hasVideo: false });
}

export function getVideoOnlyFormats(formats: VideoFormat[]): VideoFormat[] {
  return filterFormats(formats, { hasAudio: false, hasVideo: true });
}

export function getBestFormat(
  formats: VideoFormat[],
  preference: 'highest' | 'lowest' | 'highestaudio' | 'lowestaudio' | 'highestvideo' | 'lowestvideo' | number
): VideoFormat | null {
  if (typeof preference === 'number') {
    return formats.find((f) => f.itag === preference) ?? null;
  }

  let candidates: VideoFormat[];

  switch (preference) {
    case 'highest': {
      candidates = getVideoAndAudioFormats(formats);
      if (candidates.length === 0) candidates = formats.filter((f) => f.hasVideo);
      return sortByQuality(candidates, 'desc')[0] ?? null;
    }
    case 'lowest': {
      candidates = getVideoAndAudioFormats(formats);
      if (candidates.length === 0) candidates = formats.filter((f) => f.hasVideo);
      return sortByQuality(candidates, 'asc')[0] ?? null;
    }
    case 'highestaudio': {
      candidates = getAudioOnlyFormats(formats);
      if (candidates.length === 0) candidates = formats.filter((f) => f.hasAudio);
      return sortByBitrate(candidates, 'desc')[0] ?? null;
    }
    case 'lowestaudio': {
      candidates = getAudioOnlyFormats(formats);
      if (candidates.length === 0) candidates = formats.filter((f) => f.hasAudio);
      return sortByBitrate(candidates, 'asc')[0] ?? null;
    }
    case 'highestvideo': {
      candidates = getVideoOnlyFormats(formats);
      if (candidates.length === 0) candidates = formats.filter((f) => f.hasVideo);
      return sortByQuality(candidates, 'desc')[0] ?? null;
    }
    case 'lowestvideo': {
      candidates = getVideoOnlyFormats(formats);
      if (candidates.length === 0) candidates = formats.filter((f) => f.hasVideo);
      return sortByQuality(candidates, 'asc')[0] ?? null;
    }
  }
}

function sortByQuality(formats: VideoFormat[], order: 'asc' | 'desc'): VideoFormat[] {
  return [...formats].sort((a, b) => {
    const aHeight = a.height ?? 0;
    const bHeight = b.height ?? 0;
    const aRate = a.bitrate ?? 0;
    const bRate = b.bitrate ?? 0;

    if (aHeight !== bHeight) {
      return order === 'desc' ? bHeight - aHeight : aHeight - bHeight;
    }
    return order === 'desc' ? bRate - aRate : aRate - bRate;
  });
}

function sortByBitrate(formats: VideoFormat[], order: 'asc' | 'desc'): VideoFormat[] {
  return [...formats].sort((a, b) => {
    const aRate = a.bitrate ?? a.audioBitrate ?? 0;
    const bRate = b.bitrate ?? b.audioBitrate ?? 0;
    return order === 'desc' ? bRate - aRate : aRate - bRate;
  });
}

export function getFormatByItag(formats: VideoFormat[], itag: number): VideoFormat | null {
  return formats.find((f) => f.itag === itag) ?? null;
}

export function listQualities(formats: VideoFormat[]): string[] {
  const qualities = new Set<string>();
  for (const f of formats) {
    if (f.qualityLabel) qualities.add(f.qualityLabel);
  }
  return [...qualities];
}
