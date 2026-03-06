import { getInnertube } from './client';
import type { SearchResult, YtdlPlusOptions } from '../types';

export async function search(
  query: string,
  options?: YtdlPlusOptions & { limit?: number }
): Promise<SearchResult[]> {
  const innertube = await getInnertube(options);
  const searchResults = await innertube.search(query, { type: 'all' });

  const results: SearchResult[] = [];
  const limit = options?.limit ?? 20;

  if (!searchResults.results) return results;

  for (const item of searchResults.results) {
    if (results.length >= limit) break;

    const typed = item as unknown as Record<string, unknown>;
    const itemType = typed['type'] as string | undefined;

    if (itemType === 'Video') {
      const thumbnails = typed['thumbnails'] as Array<{ url: string; width: number; height: number }> | undefined;
      const titleObj = typed['title'] as Record<string, unknown> | string | undefined;
      const title = typeof titleObj === 'string' ? titleObj : (titleObj?.['text'] as string) ?? '';
      const authorObj = typed['author'] as Record<string, unknown> | undefined;
      const durationObj = typed['duration'] as Record<string, unknown> | undefined;
      const viewCountObj = typed['view_count'] as Record<string, unknown> | undefined;
      const publishedObj = typed['published'] as Record<string, unknown> | undefined;

      results.push({
        type: 'video',
        id: (typed['id'] as string) ?? '',
        title,
        url: `https://www.youtube.com/watch?v=${(typed['id'] as string) ?? ''}`,
        thumbnail: thumbnails?.[0]
          ? { url: thumbnails[0].url, width: thumbnails[0].width, height: thumbnails[0].height }
          : null,
        duration: (durationObj?.['seconds'] as number) ?? undefined,
        viewCount: parseViewCount((viewCountObj?.['text'] as string) ?? ''),
        uploadDate: (publishedObj?.['text'] as string) ?? undefined,
        channel: authorObj
          ? { name: (authorObj['name'] as string) ?? '', id: (authorObj['id'] as string) ?? '' }
          : undefined,
      });
    } else if (itemType === 'Playlist') {
      const titleObj = typed['title'] as Record<string, unknown> | string | undefined;
      const title = typeof titleObj === 'string' ? titleObj : (titleObj?.['text'] as string) ?? '';
      const thumbnails = typed['thumbnails'] as Array<{ url: string; width: number; height: number }> | undefined;

      results.push({
        type: 'playlist',
        id: (typed['id'] as string) ?? '',
        title,
        url: `https://www.youtube.com/playlist?list=${(typed['id'] as string) ?? ''}`,
        thumbnail: thumbnails?.[0]
          ? { url: thumbnails[0].url, width: thumbnails[0].width, height: thumbnails[0].height }
          : null,
        videoCount: (typed['video_count'] as number) ?? undefined,
      });
    } else if (itemType === 'Channel') {
      const titleObj = typed['title'] as Record<string, unknown> | string | undefined;
      const title = typeof titleObj === 'string' ? titleObj : (titleObj?.['text'] as string) ?? '';
      const thumbnails = typed['thumbnails'] as Array<{ url: string; width: number; height: number }> | undefined;
      const subscriberObj = typed['subscriber_count'] as Record<string, unknown> | undefined;

      results.push({
        type: 'channel',
        id: (typed['id'] as string) ?? '',
        title,
        url: `https://www.youtube.com/channel/${(typed['id'] as string) ?? ''}`,
        thumbnail: thumbnails?.[0]
          ? { url: thumbnails[0].url, width: thumbnails[0].width, height: thumbnails[0].height }
          : null,
        subscribers: (subscriberObj?.['text'] as string) ?? undefined,
      });
    }
  }

  return results;
}

function parseViewCount(text: string): number | undefined {
  if (!text) return undefined;
  const cleaned = text.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? undefined : num;
}
