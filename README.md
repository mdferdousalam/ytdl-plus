# ytdl-plus

A comprehensive, type-safe YouTube downloader for Node.js. Download videos, audio, playlists, search YouTube, and more.

## Features

- Download videos in any quality/format
- Extract audio (m4a, opus, webm)
- Playlist downloads with concurrency control
- YouTube search
- Video info & metadata (chapters, subtitles, formats)
- Real-time download progress tracking
- Format filtering & selection
- Fully typed with TypeScript
- CLI included
- Zero binary dependencies — pure JavaScript

## Install

```bash
npm install ytdl-plus
```

## Quick Start

```ts
import { ytdl } from 'ytdl-plus';

// Get video info
const info = await ytdl.getVideoInfo('https://youtube.com/watch?v=dQw4w9WgXcQ');
console.log(info.title, info.duration, info.channel.name);

// Download video
const result = await ytdl.download('https://youtube.com/watch?v=dQw4w9WgXcQ', {
  quality: 'highest',
  format: 'mp4',
  outputDir: './downloads',
});
console.log(`Saved to: ${result.filePath}`);

// Download audio only
await ytdl.downloadAudio('https://youtube.com/watch?v=dQw4w9WgXcQ', {
  format: 'm4a',
  outputDir: './audio',
});

// Search YouTube
const results = await ytdl.search('javascript tutorial');
results.forEach(r => console.log(r.title, r.url));
```

## API

### `ytdl.getVideoInfo(urlOrId, options?)`

Fetch video metadata including title, duration, formats, subtitles, chapters.

```ts
const info = await ytdl.getVideoInfo('dQw4w9WgXcQ');
// info.title, info.duration, info.formats, info.subtitles, info.chapters
```

### `ytdl.download(urlOrId, options?)`

Download a video to disk.

```ts
const result = await ytdl.download(url, {
  quality: 'highest',        // 'highest' | 'lowest' | 'highestvideo' | itag number
  format: 'mp4',             // 'mp4' | 'webm'
  outputDir: './downloads',
  filename: '{title} - {quality}', // template with {title}, {id}, {ext}, {quality}, {channel}
  overwrite: false,
});
```

### `ytdl.downloadAudio(urlOrId, options?)`

Download audio only.

```ts
await ytdl.downloadAudio(url, {
  format: 'm4a',   // 'm4a' | 'opus' | 'mp3' | 'wav' | 'flac'
  quality: 'highestaudio',
  outputDir: './audio',
});
```

### `ytdl.downloadPlaylist(urlOrId, options?)`

Download an entire playlist.

```ts
const result = await ytdl.downloadPlaylist(playlistUrl, {
  quality: 'highest',
  concurrency: 3,        // parallel downloads
  startIndex: 0,
  endIndex: 10,
  onVideoStart: (video, idx) => console.log(`Starting ${video.title}`),
  onVideoComplete: (video, idx, path) => console.log(`Done: ${path}`),
  onVideoError: (video, idx, err) => console.error(`Failed: ${err.message}`),
});
console.log(`Completed: ${result.completed}/${result.totalVideos}`);
```

### `ytdl.getStream(urlOrId, options?)`

Get a readable stream instead of saving to disk.

```ts
const { stream, info, format } = await ytdl.getStream(url, { quality: 'highest' });
```

### `ytdl.search(query, options?)`

Search YouTube.

```ts
const results = await ytdl.search('node.js tutorial', { limit: 10 });
// results: Array<{ type: 'video'|'playlist'|'channel', title, url, ... }>
```

### `ytdl.getPlaylistInfo(urlOrId, options?)`

Get playlist metadata and video list.

```ts
const playlist = await ytdl.getPlaylistInfo(playlistUrl);
console.log(playlist.title, playlist.videoCount);
playlist.videos.forEach(v => console.log(v.title));
```

### Format Utilities

```ts
// Filter formats
const mp4Formats = ytdl.filterFormats(info.formats, { container: 'mp4', hasAudio: true });
const hd = ytdl.filterFormats(info.formats, { minHeight: 720 });

// Get best format
const best = ytdl.getBestFormat(info.formats, 'highest');
const bestAudio = ytdl.getBestFormat(info.formats, 'highestaudio');
const specific = ytdl.getBestFormat(info.formats, 137); // by itag

// Categorize formats
const videoAndAudio = ytdl.getVideoAndAudioFormats(info.formats);
const audioOnly = ytdl.getAudioOnlyFormats(info.formats);
const videoOnly = ytdl.getVideoOnlyFormats(info.formats);

// List available qualities
const qualities = ytdl.listQualities(info.formats); // ['1080p', '720p', '360p', ...]
```

### URL Utilities

```ts
ytdl.validateURL('https://youtube.com/watch?v=dQw4w9WgXcQ'); // true
ytdl.validatePlaylistURL('https://youtube.com/playlist?list=PLxxx'); // true
ytdl.extractVideoId('https://youtu.be/dQw4w9WgXcQ'); // 'dQw4w9WgXcQ'
ytdl.extractPlaylistId(url); // playlist ID or null
ytdl.isVideoURL(input); // validates URL or raw 11-char ID
ytdl.sanitizeFilename('My Video: Episode 1/2'); // 'My Video_ Episode 1_2'
```

### Progress Tracking

```ts
import { VideoDownloader } from 'ytdl-plus';

const downloader = new VideoDownloader();

downloader.on('start', ({ title, format }) => {
  console.log(`Downloading: ${title} (${format.qualityLabel})`);
});

downloader.on('progress', (progress) => {
  console.log(`${progress.percent.toFixed(1)}% | ${progress.speed} B/s | ETA: ${progress.eta}s`);
});

downloader.on('end', (result) => {
  console.log(`Saved to: ${result.filePath}`);
});

await downloader.download(url, { quality: 'highest' });
```

### Client Options

```ts
import { createClient } from 'ytdl-plus';

const client = createClient({
  lang: 'en',     // content language
  geo: 'US',      // geolocation
  cookies: '...',  // cookie string for age-restricted content
  proxy: '...',    // proxy URL
});

await client.download(url);
```

## CLI

```bash
# Install globally
npm install -g ytdl-plus

# Download video
ytdl-plus download "https://youtube.com/watch?v=dQw4w9WgXcQ"

# Download audio
ytdl-plus audio "https://youtube.com/watch?v=dQw4w9WgXcQ" -f m4a

# Get video info
ytdl-plus info "https://youtube.com/watch?v=dQw4w9WgXcQ"

# List available formats
ytdl-plus formats "https://youtube.com/watch?v=dQw4w9WgXcQ"

# Download playlist
ytdl-plus playlist "https://youtube.com/playlist?list=PLxxx" -c 5

# Search YouTube
ytdl-plus search "javascript tutorial" --limit 5

# Custom output
ytdl-plus download URL -q 720 -o ./videos -n "{channel} - {title}"
```

## Supported URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`
- `https://music.youtube.com/watch?v=VIDEO_ID`
- `https://www.youtube.com/playlist?list=PLAYLIST_ID`
- Raw video ID (11 characters)

## License

MIT

## Disclaimer

This tool is for educational and personal use. Respect YouTube's Terms of Service and copyright laws.
