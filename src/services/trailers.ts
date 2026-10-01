// src/services/trailers.ts — Realtime TMDB & YouTube Trailer Fetcher (100% Dynamic, Zero Dummy Data)
import { tmdb } from './tmdb';

export type TrailerType = 'Trailer' | 'Promo' | 'BTS' | 'Teaser';

export interface CinemaTrailer {
  id: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  movieTitle: string;
  title: string;
  subtitle?: string;
  author: string;
  timeAgo: string;
  commentsCount: number;
  likesCount?: number;
  thumbnail: string;
  youtubeId: string;
  topic: string;
  categoryTag: 'Latest Released' | 'Upcoming Movies' | 'Shows on Air' | 'Trending';
  videoType: TrailerType;
  badgeText?: string;
  streamer?: 'netflix' | 'disney' | 'max' | 'apple' | 'paramount' | 'universal' | 'warner';
  entities?: string[];
  releaseDate?: string;
  overview?: string;
}

const CACHE_KEY = 'mg_realtime_trailers_live_v1';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Helper to determine relative time from video publish date or fallback
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Recent';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 60) return `${Math.max(1, mins)} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hrs ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} days ago`;
  return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// Detect streamer / network from title or overview
function detectStreamer(text: string): CinemaTrailer['streamer'] | undefined {
  const t = text.toLowerCase();
  if (t.includes('netflix')) return 'netflix';
  if (t.includes('disney+') || t.includes('disney plus') || t.includes('marvel studios')) return 'disney';
  if (t.includes('hbo') || t.includes('max original') || t.includes('warner')) return 'max';
  if (t.includes('apple tv') || t.includes('apple original')) return 'apple';
  if (t.includes('paramount')) return 'paramount';
  if (t.includes('universal')) return 'universal';
  return undefined;
}

export const trailersService = {
  /**
   * Fetches real-time upcoming movies, in-theater movies, and airing shows from TMDB,
   * queries their actual video catalogs, and classifies them into Trailers, Promos, BTS, and Teasers.
   * Completely live: zero hardcoded dummy arrays.
   */
  async getTrailers(filter: 'all' | 'trailers' | 'promos' | 'bts' | 'teasers' | 'upcoming' = 'all'): Promise<CinemaTrailer[]> {
    // 1. Check local session cache to prevent rapid API rate exhaustion
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL && Array.isArray(parsed.items) && parsed.items.length > 0) {
          return this.applyFilter(parsed.items, filter);
        }
      }
    } catch {
      // Ignore cache error
    }

    try {
      // 2. Fetch live media pools in parallel from TMDB API
      const [upcomingRes, nowPlayingRes, tvRes] = await Promise.allSettled([
        tmdb.getUpcoming(),
        tmdb.getNowPlaying(),
        tmdb.getOnTheAir(),
      ]);

      const pool: Array<{
        mediaId: number;
        mediaType: 'movie' | 'tv';
        movieTitle: string;
        overview: string;
        backdrop_path: string;
        releaseDate: string;
        categoryTag: CinemaTrailer['categoryTag'];
      }> = [];

      // Process Upcoming Movies
      if (upcomingRes.status === 'fulfilled' && upcomingRes.value?.results) {
        for (const m of upcomingRes.value.results.slice(0, 10)) {
          if (m.id && (m.title || m.original_title)) {
            pool.push({
              mediaId: m.id,
              mediaType: 'movie',
              movieTitle: m.title || m.original_title,
              overview: m.overview || '',
              backdrop_path: m.backdrop_path || m.poster_path || '',
              releaseDate: m.release_date || 'Coming Soon',
              categoryTag: 'Upcoming Movies',
            });
          }
        }
      }

      // Process Now Playing Movies
      if (nowPlayingRes.status === 'fulfilled' && nowPlayingRes.value?.results) {
        for (const m of nowPlayingRes.value.results.slice(0, 8)) {
          if (m.id && (m.title || m.original_title)) {
            pool.push({
              mediaId: m.id,
              mediaType: 'movie',
              movieTitle: m.title || m.original_title,
              overview: m.overview || '',
              backdrop_path: m.backdrop_path || m.poster_path || '',
              releaseDate: m.release_date || 'In Theaters',
              categoryTag: 'Latest Released',
            });
          }
        }
      }

      // Process Airing TV Shows
      if (tvRes.status === 'fulfilled' && tvRes.value?.results) {
        for (const s of tvRes.value.results.slice(0, 8)) {
          if (s.id && (s.name || s.original_name)) {
            pool.push({
              mediaId: s.id,
              mediaType: 'tv',
              movieTitle: s.name || s.original_name,
              overview: s.overview || '',
              backdrop_path: s.backdrop_path || s.poster_path || '',
              releaseDate: s.first_air_date || 'Streaming Now',
              categoryTag: 'Shows on Air',
            });
          }
        }
      }

      // 3. For each real movie/show, query TMDB video API to fetch real YouTube videos
      const videoFetchPromises = pool.map(async (item) => {
        try {
          const vids = await tmdb.getVideos(item.mediaId, item.mediaType);
          const results = vids?.results || [];
          if (!Array.isArray(results) || results.length === 0) return [];

          const itemsForMedia: CinemaTrailer[] = [];

          for (const v of results) {
            if (v.site !== 'YouTube' || !v.key) continue;

            const name = v.name || '';
            const nameLower = name.toLowerCase();

            let videoType: TrailerType = 'Trailer';
            let badgeText = 'OFFICIAL TRAILER';

            if (
              v.type === 'Behind the Scenes' ||
              v.type === 'Featurette' ||
              /bts|behind the scenes|making of|featurette|inside look/i.test(nameLower)
            ) {
              videoType = 'BTS';
              badgeText = 'BTS';
            } else if (
              /promo|finale|episode|sneak peek|clip/i.test(nameLower) ||
              v.type === 'Clip'
            ) {
              videoType = 'Promo';
              badgeText = /finale/i.test(nameLower) ? 'FINALE PROMO HD' : 'PROMO HD';
            } else if (v.type === 'Teaser' || /teaser/i.test(nameLower)) {
              videoType = 'Teaser';
              badgeText = 'TEASER';
            } else if (/trailer 2/i.test(nameLower)) {
              badgeText = 'OFFICIAL TRAILER 2';
            }

            const thumbnail = item.backdrop_path
              ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
              : `https://img.youtube.com/vi/${v.key}/maxresdefault.jpg`;

            // Clean headline
            const title = name.toLowerCase().includes(item.movieTitle.toLowerCase())
              ? name
              : `${item.movieTitle} | ${name}`;

            const streamer = detectStreamer(`${item.movieTitle} ${item.overview} ${name}`);

            itemsForMedia.push({
              id: `tmdb-${item.mediaType}-${item.mediaId}-${v.key}`,
              mediaId: item.mediaId,
              mediaType: item.mediaType,
              movieTitle: item.movieTitle,
              title,
              subtitle: item.overview ? `${item.overview.slice(0, 110)}...` : undefined,
              author: 'MovieGuy Official',
              timeAgo: formatRelativeTime(v.published_at),
              commentsCount: 0,
              likesCount: 0,
              thumbnail,
              youtubeId: v.key,
              topic: item.categoryTag === 'Shows on Air' ? 'Series' : item.categoryTag === 'Upcoming Movies' ? 'Upcoming' : 'Cinema',
              categoryTag: item.categoryTag,
              videoType,
              badgeText,
              streamer,
              entities: [item.movieTitle, videoType],
              releaseDate: item.releaseDate,
              overview: item.overview,
            });
          }

          return itemsForMedia;
        } catch {
          return [];
        }
      });

      const nestedResults = await Promise.all(videoFetchPromises);
      const allFetched = nestedResults.flat();

      // Deduplicate by youtubeId
      const unique: CinemaTrailer[] = [];
      const seen = new Set<string>();
      for (const t of allFetched) {
        if (!seen.has(t.youtubeId)) {
          seen.add(t.youtubeId);
          unique.push(t);
        }
      }

      // Save to session cache
      try {
        if (unique.length > 0) {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), items: unique })
          );
        }
      } catch {
        // Ignore
      }

      return this.applyFilter(unique, filter);
    } catch {
      return [];
    }
  },

  applyFilter(items: CinemaTrailer[], filter: string): CinemaTrailer[] {
    const f = filter.toLowerCase();
    if (f === 'all') return items;
    if (f === 'trailers' || f === 'trailer') return items.filter((it) => it.videoType === 'Trailer');
    if (f === 'promos' || f === 'promo') return items.filter((it) => it.videoType === 'Promo');
    if (f === 'bts') return items.filter((it) => it.videoType === 'BTS');
    if (f === 'teasers' || f === 'teaser') return items.filter((it) => it.videoType === 'Teaser');
    if (f === 'upcoming') return items.filter((it) => it.categoryTag === 'Upcoming Movies');
    return items;
  },
};
