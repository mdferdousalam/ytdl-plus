import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatDuration,
  formatSpeed,
  parseFilenameTemplate,
  pLimit,
} from '../src/utils/helpers';

describe('formatBytes', () => {
  it('formats zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(30)).toBe('0:30');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(605)).toBe('10:05');
  });

  it('formats hours', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(7200)).toBe('2:00:00');
  });

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});

describe('formatSpeed', () => {
  it('formats bytes per second', () => {
    expect(formatSpeed(1048576)).toBe('1.0 MB/s');
    expect(formatSpeed(512)).toBe('512 B/s');
  });
});

describe('parseFilenameTemplate', () => {
  it('replaces template variables', () => {
    const result = parseFilenameTemplate('{title} - {quality}', {
      title: 'My Video',
      quality: '1080p',
    });
    expect(result).toBe('My Video - 1080p');
  });

  it('keeps unknown variables as-is', () => {
    const result = parseFilenameTemplate('{title} - {unknown}', { title: 'Test' });
    expect(result).toBe('Test - unknown');
  });
});

describe('pLimit', () => {
  it('limits concurrency', async () => {
    let running = 0;
    let maxRunning = 0;
    const limit = pLimit(2);

    const task = () =>
      limit(async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise((r) => setTimeout(r, 50));
        running--;
        return running;
      });

    await Promise.all([task(), task(), task(), task(), task()]);
    expect(maxRunning).toBe(2);
  });

  it('returns results correctly', async () => {
    const limit = pLimit(3);
    const results = await Promise.all([
      limit(() => Promise.resolve(1)),
      limit(() => Promise.resolve(2)),
      limit(() => Promise.resolve(3)),
    ]);
    expect(results).toEqual([1, 2, 3]);
  });
});
