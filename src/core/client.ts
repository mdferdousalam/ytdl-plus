import { Innertube, UniversalCache } from 'youtubei.js';
import type { YtdlPlusOptions } from '../types';

let innertubeInstance: Innertube | null = null;

export async function getInnertube(options?: YtdlPlusOptions): Promise<Innertube> {
  if (innertubeInstance) return innertubeInstance;

  innertubeInstance = await Innertube.create({
    cache: new UniversalCache(false),
    lang: options?.lang ?? 'en',
    location: options?.geo,
    generate_session_locally: true,
  });

  return innertubeInstance;
}

export function resetClient(): void {
  innertubeInstance = null;
}
