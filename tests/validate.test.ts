import { describe, it, expect } from 'vitest';
import {
  validateURL,
  validatePlaylistURL,
  extractVideoId,
  extractPlaylistId,
  isVideoURL,
  isPlaylistURL,
  sanitizeFilename,
} from '../src/utils/validate';

describe('validateURL', () => {
  it('accepts standard youtube.com watch URLs', () => {
    expect(validateURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(validateURL('http://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(validateURL('https://youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toBe(true);
  });

  it('accepts youtu.be short URLs', () => {
    expect(validateURL('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('accepts shorts URLs', () => {
    expect(validateURL('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
  });

  it('accepts embed URLs', () => {
    expect(validateURL('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
  });

  it('accepts mobile URLs', () => {
    expect(validateURL('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('accepts music.youtube.com URLs', () => {
    expect(validateURL('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(validateURL('https://www.google.com')).toBe(false);
    expect(validateURL('not a url')).toBe(false);
    expect(validateURL('')).toBe(false);
    expect(validateURL('https://youtube.com/watch')).toBe(false);
  });
});

describe('validatePlaylistURL', () => {
  it('accepts playlist URLs', () => {
    expect(validatePlaylistURL('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')).toBe(true);
  });

  it('accepts video URLs with playlist', () => {
    expect(validatePlaylistURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOei')).toBe(true);
  });

  it('rejects non-playlist URLs', () => {
    expect(validatePlaylistURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    expect(validatePlaylistURL('https://google.com')).toBe(false);
  });
});

describe('extractVideoId', () => {
  it('extracts from standard URLs', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts from short URLs', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts from shorts URLs', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns raw ID if already an ID', () => {
    expect(extractVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for invalid input', () => {
    expect(extractVideoId('not a valid url at all')).toBeNull();
    expect(extractVideoId('https://google.com')).toBeNull();
  });
});

describe('extractPlaylistId', () => {
  it('extracts playlist ID', () => {
    expect(extractPlaylistId('https://www.youtube.com/playlist?list=PLrAXtmErZgOei')).toBe('PLrAXtmErZgOei');
  });

  it('returns null for non-playlist URLs', () => {
    expect(extractPlaylistId('https://youtube.com/watch?v=abc')).toBeNull();
  });
});

describe('isVideoURL', () => {
  it('returns true for URLs and raw IDs', () => {
    expect(isVideoURL('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isVideoURL('dQw4w9WgXcQ')).toBe(true);
  });

  it('returns false for invalid input', () => {
    expect(isVideoURL('not-valid')).toBe(false);
  });
});

describe('isPlaylistURL', () => {
  it('returns true for playlist URLs', () => {
    expect(isPlaylistURL('https://youtube.com/playlist?list=PLxxx')).toBe(true);
  });

  it('returns false for non-playlist', () => {
    expect(isPlaylistURL('https://youtube.com/watch?v=abc')).toBe(false);
  });
});

describe('sanitizeFilename', () => {
  it('removes unsafe characters', () => {
    expect(sanitizeFilename('hello/world')).toBe('hello_world');
    expect(sanitizeFilename('file:name*test')).toBe('file_name_test');
  });

  it('trims whitespace', () => {
    expect(sanitizeFilename('  hello world  ')).toBe('hello world');
  });

  it('truncates to 200 characters', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeFilename(long).length).toBe(200);
  });

  it('handles empty strings', () => {
    expect(sanitizeFilename('')).toBe('');
  });
});
