import { describe, it, expect } from 'vitest';
import {
  filterFormats,
  getBestFormat,
  getVideoAndAudioFormats,
  getAudioOnlyFormats,
  getVideoOnlyFormats,
  getFormatByItag,
  listQualities,
} from '../src/core/format';
import type { VideoFormat } from '../src/types';

function createFormat(overrides: Partial<VideoFormat>): VideoFormat {
  return {
    itag: 18,
    url: '',
    mimeType: 'video/mp4',
    codec: 'avc1.42001E, mp4a.40.2',
    container: 'mp4',
    quality: 'medium',
    qualityLabel: '360p',
    width: 640,
    height: 360,
    fps: 30,
    bitrate: 500000,
    audioBitrate: 128000,
    audioCodec: 'mp4a.40.2',
    videoCodec: 'avc1.42001E',
    hasAudio: true,
    hasVideo: true,
    contentLength: 10000000,
    isLive: false,
    ...overrides,
  };
}

const sampleFormats: VideoFormat[] = [
  createFormat({ itag: 18, qualityLabel: '360p', height: 360, bitrate: 500000, hasAudio: true, hasVideo: true }),
  createFormat({ itag: 22, qualityLabel: '720p', height: 720, bitrate: 2000000, hasAudio: true, hasVideo: true }),
  createFormat({ itag: 137, qualityLabel: '1080p', height: 1080, bitrate: 4000000, hasAudio: false, hasVideo: true }),
  createFormat({ itag: 140, qualityLabel: '', quality: 'tiny', height: null, width: null, bitrate: 128000, hasAudio: true, hasVideo: false, container: 'mp4', mimeType: 'audio/mp4' }),
  createFormat({ itag: 251, qualityLabel: '', quality: 'tiny', height: null, width: null, bitrate: 160000, hasAudio: true, hasVideo: false, container: 'webm', mimeType: 'audio/webm' }),
];

describe('filterFormats', () => {
  it('filters by hasAudio', () => {
    const result = filterFormats(sampleFormats, { hasAudio: true });
    expect(result.every((f) => f.hasAudio)).toBe(true);
  });

  it('filters by container', () => {
    const result = filterFormats(sampleFormats, { container: 'webm' });
    expect(result.every((f) => f.container === 'webm')).toBe(true);
  });

  it('filters by minHeight', () => {
    const result = filterFormats(sampleFormats, { minHeight: 720 });
    expect(result.every((f) => f.height !== null && f.height >= 720)).toBe(true);
  });
});

describe('getVideoAndAudioFormats', () => {
  it('returns only formats with both audio and video', () => {
    const result = getVideoAndAudioFormats(sampleFormats);
    expect(result.length).toBe(2);
    expect(result.every((f) => f.hasAudio && f.hasVideo)).toBe(true);
  });
});

describe('getAudioOnlyFormats', () => {
  it('returns only audio formats', () => {
    const result = getAudioOnlyFormats(sampleFormats);
    expect(result.length).toBe(2);
    expect(result.every((f) => f.hasAudio && !f.hasVideo)).toBe(true);
  });
});

describe('getVideoOnlyFormats', () => {
  it('returns only video formats', () => {
    const result = getVideoOnlyFormats(sampleFormats);
    expect(result.length).toBe(1);
    expect(result.every((f) => !f.hasAudio && f.hasVideo)).toBe(true);
  });
});

describe('getBestFormat', () => {
  it('returns highest quality video+audio', () => {
    const result = getBestFormat(sampleFormats, 'highest');
    expect(result?.itag).toBe(22);
  });

  it('returns lowest quality video+audio', () => {
    const result = getBestFormat(sampleFormats, 'lowest');
    expect(result?.itag).toBe(18);
  });

  it('returns highest audio', () => {
    const result = getBestFormat(sampleFormats, 'highestaudio');
    expect(result?.itag).toBe(251);
  });

  it('returns format by itag', () => {
    const result = getBestFormat(sampleFormats, 137);
    expect(result?.itag).toBe(137);
  });

  it('returns null for non-existent itag', () => {
    const result = getBestFormat(sampleFormats, 999);
    expect(result).toBeNull();
  });
});

describe('getFormatByItag', () => {
  it('finds format by itag', () => {
    expect(getFormatByItag(sampleFormats, 22)?.qualityLabel).toBe('720p');
  });

  it('returns null for missing itag', () => {
    expect(getFormatByItag(sampleFormats, 999)).toBeNull();
  });
});

describe('listQualities', () => {
  it('returns unique quality labels', () => {
    const qualities = listQualities(sampleFormats);
    expect(qualities).toContain('360p');
    expect(qualities).toContain('720p');
    expect(qualities).toContain('1080p');
  });
});
