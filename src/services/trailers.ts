// src/services/trailers.ts — Realtime Official MOVIE TRAILERS Only (No Promos, No First Looks, No Teasers, No TV)
import { tmdb } from './tmdb';

export interface CinemaTrailer {
  id: string;
  mediaId: number;
  mediaType: 'movie';
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
  categoryTag: 'Upcoming Movies' | 'In Theaters' | 'Popular';
  badgeText: string;
  streamer?: 'netflix' | 'disney' | 'max' | 'apple' | 'paramount' | 'universal' | 'warner';
  entities?: string[];
  releaseDate?: string;
  overview?: string;
}

const CACHE_KEY = 'mg_realtime_movie_trailers_only_v1';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Helper to format relative time
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Recently';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 60) return `${Math.max(1, mins)} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hrs ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} days ago`;
  return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// Detect movie studio / distributor
function detectDistributor(text: string): CinemaTrailer['streamer'] | undefined {
  const t = text.toLowerCase();
  if (t.includes('netflix')) return 'netflix';
  if (t.includes('disney') || t.includes('marvel studios')) return 'disney';
  if (t.includes('warner bros') || t.includes('hbo') || t.includes('max')) return 'warner';
  if (t.includes('paramount')) return 'paramount';
  if (t.includes('universal')) return 'universal';
  if (t.includes('apple original') || t.includes('apple tv')) return 'apple';
  return undefined;
}

export const trailersService = {
  /**
   * Strictly fetches official MOVIE TRAILERS from TMDB and YouTube.
   * Completely excludes TV shows, promos, teasers, first looks, BTS, and clips.
   */
  async getTrailers(filter: 'all' | 'upcoming' | 'theaters' | 'popular' = 'all'): Promise<CinemaTrailer[]> {
    // 1. Session Cache check
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL && Array.isArray(parsed.items) && parsed.items.length > 0) {
          return this.applyFilter(parsed.items, filter);
        }
      }
    } catch {
      // Ignore
    }

    try {
      // 2. Query ONLY Movies from TMDB: Upcoming movies, In Theaters (Now Playing), and Popular movies
      const [upcomingRes, nowPlayingRes, popularRes] = await Promise.allSettled([
        tmdb.getUpcoming(),
        tmdb.getNowPlaying(),
        tmdb.getPopular('movie'),
      ]);

      const moviePool: Array<{
        id: number;
        title: string;
        overview: string;
        backdrop_path: string;
        poster_path: string;
        release_date: string;
        categoryTag: CinemaTrailer['categoryTag'];
      }> = [];

      // Add Upcoming Movies
      if (upcomingRes.status === 'fulfilled' && upcomingRes.value?.results) {
        for (const m of upcomingRes.value.results) {
          if (m.id && (m.title || m.original_title) && (m.backdrop_path || m.poster_path)) {
            moviePool.push({
              id: m.id,
              title: m.title || m.original_title,
              overview: m.overview || '',
              backdrop_path: m.backdrop_path,
              poster_path: m.poster_path,
              release_date: m.release_date || 'Coming Soon',
              categoryTag: 'Upcoming Movies',
            });
          }
        }
      }

      // Add In Theaters Movies
      if (nowPlayingRes.status === 'fulfilled' && nowPlayingRes.value?.results) {
        for (const m of nowPlayingRes.value.results) {
          if (m.id && (m.title || m.original_title) && (m.backdrop_path || m.poster_path)) {
            moviePool.push({
              id: m.id,
              title: m.title || m.original_title,
              overview: m.overview || '',
              backdrop_path: m.backdrop_path,
              poster_path: m.poster_path,
              release_date: m.release_date || 'In Theaters',
              categoryTag: 'In Theaters',
            });
          }
        }
      }

      // Add Popular Movies
      if (popularRes.status === 'fulfilled' && popularRes.value?.results) {
        for (const m of popularRes.value.results.slice(0, 10)) {
          if (m.id && (m.title || m.original_title) && (m.backdrop_path || m.poster_path)) {
            moviePool.push({
              id: m.id,
              title: m.title || m.original_title,
              overview: m.overview || '',
              backdrop_path: m.backdrop_path,
              poster_path: m.poster_path,
              release_date: m.release_date || 'Popular',
              categoryTag: 'Popular',
            });
          }
        }
      }

      // Deduplicate movies by ID
      const uniqueMovies: typeof moviePool = [];
      const seenMovieIds = new Set<number>();
      for (const m of moviePool) {
        if (!seenMovieIds.has(m.id)) {
          seenMovieIds.add(m.id);
          uniqueMovies.push(m);
        }
      }

      // 3. For each movie, query TMDB videos and strictly filter ONLY official movie trailers
      const trailerPromises = uniqueMovies.slice(0, 24).map(async (movie) => {
        try {
          const vids = await tmdb.getVideos(movie.id, 'movie');
          const results = vids?.results || [];
          if (!Array.isArray(results) || results.length === 0) return null;

          // STRICT FILTER: Must be YouTube, Type must be 'Trailer'
          // Exclude anything with teaser, promo, bts, clip, first look, sneak peek
          const movieTrailers = results.filter((v: any) => {
            if (v.site !== 'YouTube' || !v.key) return false;
            if (v.type !== 'Trailer') return false;

            const name = (v.name || '').toLowerCase();
            const forbiddenKeywords = [
              'teaser',
              'promo',
              'first look',
              'behind the scenes',
              'bts',
              'featurette',
              'clip',
              'sneak peek',
              'tv spot',
              'interview',
              'bloopers',
              'bruh',
            ];
            if (forbiddenKeywords.some((w) => name.includes(w))) return false;

            return true;
          });

          if (movieTrailers.length === 0) return null;

          // Pick the official trailer or main trailer
          const selectedTrailer =
            movieTrailers.find((v: any) => v.official && /official/i.test(v.name)) ||
            movieTrailers.find((v: any) => /main/i.test(v.name) || /trailer 1/i.test(v.name)) ||
            movieTrailers[0];

          if (!selectedTrailer?.key) return null;

          const backdropUrl = movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
            : `https://img.youtube.com/vi/${selectedTrailer.key}/maxresdefault.jpg`;

          // Format clean, official movie trailer headline
          const cleanTitle = `The official trailer for ${movie.title} has been released.`;
          const badgeText = /trailer 2/i.test(selectedTrailer.name) ? 'OFFICIAL TRAILER 2' : 'OFFICIAL TRAILER';
          const streamer = detectDistributor(`${movie.title} ${selectedTrailer.name} ${movie.overview}`);

          const trailerItem: CinemaTrailer = {
            id: `tmdb-movie-trailer-${movie.id}-${selectedTrailer.key}`,
            mediaId: movie.id,
            mediaType: 'movie',
            movieTitle: movie.title,
            title: cleanTitle,
            subtitle: movie.overview ? `${movie.overview.slice(0, 120)}...` : undefined,
            author: 'MovieGuy Official',
            timeAgo: formatRelativeTime(selectedTrailer.published_at),
            commentsCount: 0,
            likesCount: 0,
            thumbnail: backdropUrl,
            youtubeId: selectedTrailer.key,
            topic: 'Cinema',
            categoryTag: movie.categoryTag,
            badgeText,
            streamer,
            entities: [movie.title, 'official trailer'],
            releaseDate: movie.release_date,
            overview: movie.overview,
          };

          return trailerItem;
        } catch {
          return null;
        }
      });

      const fetchedTrailers = (await Promise.all(trailerPromises)).filter(Boolean) as CinemaTrailer[];

      // Deduplicate by YouTube ID
      const uniqueTrailers: CinemaTrailer[] = [];
      const seenYt = new Set<string>();
      for (const t of fetchedTrailers) {
        if (!seenYt.has(t.youtubeId)) {
          seenYt.add(t.youtubeId);
          uniqueTrailers.push(t);
        }
      }

      // Cache results
      try {
        if (uniqueTrailers.length > 0) {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), items: uniqueTrailers })
          );
        }
      } catch {
        // Ignore
      }

      return this.applyFilter(uniqueTrailers, filter);
    } catch {
      return [];
    }
  },

  applyFilter(items: CinemaTrailer[], filter: string): CinemaTrailer[] {
    const f = filter.toLowerCase();
    if (f === 'all') return items;
    if (f === 'upcoming') return items.filter((it) => it.categoryTag === 'Upcoming Movies');
    if (f === 'theaters' || f === 'now') return items.filter((it) => it.categoryTag === 'In Theaters');
    if (f === 'popular') return items.filter((it) => it.categoryTag === 'Popular');
    return items;
  },
};
