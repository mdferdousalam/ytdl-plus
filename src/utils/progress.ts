import type { DownloadProgress } from '../types';

interface SpeedSample {
  time: number;
  bytes: number;
}

export class ProgressTracker {
  private readonly totalBytes: number;
  private samples: SpeedSample[] = [];
  private readonly sampleWindow = 3000; // 3 seconds

  constructor(totalBytes: number) {
    this.totalBytes = totalBytes;
  }

  update(downloadedBytes: number): DownloadProgress {
    const now = Date.now();
    this.samples.push({ time: now, bytes: downloadedBytes });

    // Keep only samples within the window
    const cutoff = now - this.sampleWindow;
    this.samples = this.samples.filter((s) => s.time >= cutoff);

    const speed = this.calculateSpeed();
    const remaining = this.totalBytes - downloadedBytes;
    const eta = speed > 0 ? Math.round(remaining / speed) : 0;
    const percent = this.totalBytes > 0
      ? Math.min(100, (downloadedBytes / this.totalBytes) * 100)
      : 0;

    return {
      percent,
      downloaded: downloadedBytes,
      total: this.totalBytes,
      speed,
      eta,
    };
  }

  reset(): void {
    this.samples = [];
  }

  private calculateSpeed(): number {
    if (this.samples.length < 2) return 0;

    const oldest = this.samples[0]!;
    const newest = this.samples[this.samples.length - 1]!;
    const timeDiff = (newest.time - oldest.time) / 1000; // seconds

    if (timeDiff <= 0) return 0;

    const bytesDiff = newest.bytes - oldest.bytes;
    return bytesDiff / timeDiff;
  }
}
