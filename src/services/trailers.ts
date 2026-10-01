// src/services/trailers.ts — Realtime TMDB & YouTube Trailer Fetcher for Latest & Upcoming Movies/Shows
import { tmdb } from './tmdb';

export interface CinemaTrailer {
  id: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  movieTitle: string;
  title: string;
  author: string;
  timeAgo: string;
  commentsCount: number;
  thumbnail: string;
  youtubeId: string;
  topic: string;
  categoryTag: 'Latest Released' | 'Upcoming Movies' | 'Shows on Air' | 'Trending';
  releaseDate?: string;
  overview?: string;
}

const FALLBACK_TRAILERS: CinemaTrailer[] = [
  {
    id: 'tr-fallback-1',
    mediaId: 1079091,
    mediaType: 'movie',
    movieTitle: 'The Life of Chuck',
    title: 'Official festival trailer for Mike Flanagan’s acclaimed Stephen King adaptation starring Tom Hiddleston.',
    author: 'MovieGuy Trailers',
    timeAgo: 'Just now',
    commentsCount: 28,
    thumbnail: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1280&auto=format&fit=crop&q=80',
    youtubeId: 'L3oOldVi8dU',
    topic: 'Drama',
    categoryTag: 'Upcoming Movies',
    releaseDate: '2025',
    overview: 'A life-affirming, genre-bending story of three chapters in the life of an ordinary man named Charles Krantz.',
  },
  {
    id: 'tr-fallback-2',
    mediaId: 999991,
    mediaType: 'movie',
    movieTitle: 'Project Hail Mary',
    title: 'First look trailer: Ryan Gosling stars in Andy Weir’s epic astronaut survival odyssey directed by Lord & Miller.',
    author: 'Universal Pictures',
    timeAgo: '2 hrs ago',
    commentsCount: 64,
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&auto=format&fit=crop&q=80',
    youtubeId: 'd9J0w9Jk4pE',
    topic: 'Sci-Fi',
    categoryTag: 'Upcoming Movies',
    releaseDate: '2026',
    overview: 'An astronaut wakes up alone on a spaceship with no memory of his past, only to realize he must save Earth from cosmic extinction.',
  },
  {
    id: 'tr-fallback-3',
    mediaId: 414906,
    mediaType: 'movie',
    movieTitle: 'The Batman Part II',
    title: 'Matt Reeves teases the dark descent of Robert Pattinson’s Batman deeper into Gotham City’s criminal syndicates.',
    author: 'Warner Bros. Pictures',
    timeAgo: '5 hrs ago',
    commentsCount: 95,
    thumbnail: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1280&auto=format&fit=crop&q=80',
    youtubeId: 'mqqft2x_Aa4',
    topic: 'Action',
    categoryTag: 'Upcoming Movies',
    releaseDate: '2026',
    overview: 'The detective saga continues as Bruce Wayne confronts the deeper criminal conspiracies rotting Gotham from within.',
  },
  {
    id: 'tr-fallback-4',
    mediaId: 93405,
    mediaType: 'tv',
    movieTitle: 'Dune: Prophecy',
    title: 'Official HBO teaser trailer unveiling the secrets and political intrigue of the Bene Gesserit sisterhood.',
    author: 'Max Official',
    timeAgo: '8 hrs ago',
    commentsCount: 41,
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&auto=format&fit=crop&q=80',
    youtubeId: 'brn_r_wS_vA',
    topic: 'Sci-Fi',
    categoryTag: 'Shows on Air',
    releaseDate: '2024',
    overview: 'Set 10,000 years before Paul Atreides, two Harkonnen sisters combat forces that threaten the future of humankind.',
  },
  {
    id: 'tr-fallback-5',
    mediaId: 110972,
    mediaType: 'tv',
    movieTitle: 'Severance Season 2',
    title: 'Lumon Industries returns with Adam Scott and Patricia Arquette in the psychological workplace thriller.',
    author: 'Apple TV',
    timeAgo: '1 day ago',
    commentsCount: 82,
    thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&auto=format&fit=crop&q=80',
    youtubeId: 'xEQP4VVuyrY',
    topic: 'Thriller',
    categoryTag: 'Shows on Air',
    releaseDate: '2025',
    overview: 'Mark Scout leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
  },
  {
    id: 'tr-fallback-6',
    mediaId: 558449,
    mediaType: 'movie',
    movieTitle: 'Gladiator II',
    title: 'Ridley Scott returns to the Colosseum with Paul Mescal, Pedro Pascal, and Denzel Washington.',
    author: 'Paramount Pictures',
    timeAgo: '1 day ago',
    commentsCount: 73,
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1280&auto=format&fit=crop&q=80',
    youtubeId: '4rgYUipGJNo',
    topic: 'Action',
    categoryTag: 'Latest Released',
    releaseDate: '2024',
    overview: 'Years after witnessing the death of Maximus, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors.',
  },
];

const CACHE_KEY = 'mg_realtime_trailers_cache_v2';
const CACHE_TTL = 15 * 60 * 1000; // 15 mins

export const trailersService = {
  /**
   * Fetches latest movies, shows, and upcoming movies from TMDB,
   * then fetches their official YouTube trailer keys.
   */
  async getTrailers(filter: 'all' | 'latest' | 'upcoming' | 'tv' = 'all'): Promise<CinemaTrailer[]> {
    // 1. Check local cache
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
      // 2. Fetch Now Playing movies, Upcoming movies, and On The Air TV shows in parallel from TMDB
      const [nowPlayingRes, upcomingRes, tvRes] = await Promise.allSettled([
        tmdb.getNowPlaying(),
        tmdb.getUpcoming(),
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

      if (nowPlayingRes.status === 'fulfilled' && nowPlayingRes.value?.results) {
        for (const m of nowPlayingRes.value.results.slice(0, 5)) {
          if (m.backdrop_path || m.poster_path) {
            pool.push({
              mediaId: m.id,
              mediaType: 'movie',
              movieTitle: m.title || m.original_title,
              overview: m.overview || '',
              backdrop_path: m.backdrop_path || m.poster_path,
              releaseDate: m.release_date || 'In Theaters',
              categoryTag: 'Latest Released',
            });
          }
        }
      }

      if (upcomingRes.status === 'fulfilled' && upcomingRes.value?.results) {
        for (const m of upcomingRes.value.results.slice(0, 5)) {
          if (m.backdrop_path || m.poster_path) {
            pool.push({
              mediaId: m.id,
              mediaType: 'movie',
              movieTitle: m.title || m.original_title,
              overview: m.overview || '',
              backdrop_path: m.backdrop_path || m.poster_path,
              releaseDate: m.release_date || 'Coming Soon',
              categoryTag: 'Upcoming Movies',
            });
          }
        }
      }

      if (tvRes.status === 'fulfilled' && tvRes.value?.results) {
        for (const s of tvRes.value.results.slice(0, 4)) {
          if (s.backdrop_path || s.poster_path) {
            pool.push({
              mediaId: s.id,
              mediaType: 'tv',
              movieTitle: s.name || s.original_name,
              overview: s.overview || '',
              backdrop_path: s.backdrop_path || s.poster_path,
              releaseDate: s.first_air_date || 'Streaming Now',
              categoryTag: 'Shows on Air',
            });
          }
        }
      }

      // 3. For each title in pool, fetch their official YouTube trailer from TMDB
      const trailerPromises = pool.map(async (item, index) => {
        try {
          const vids = await tmdb.getVideos(item.mediaId, item.mediaType);
          const results = vids?.results || [];

          // Find official YouTube Trailer or Teaser
          const youtubeTrailer =
            results.find(
              (v: any) =>
                v.site === 'YouTube' &&
                (v.type === 'Trailer' || v.type === 'Teaser') &&
                (v.official || v.name?.toLowerCase().includes('trailer'))
            ) ||
            results.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ||
            results.find((v: any) => v.site === 'YouTube');

          if (!youtubeTrailer?.key) {
            return null;
          }

          const backdropUrl = item.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
            : `https://img.youtube.com/vi/${youtubeTrailer.key}/maxresdefault.jpg`;

          const trailerObj: CinemaTrailer = {
            id: `tmdb-trailer-${item.mediaType}-${item.mediaId}`,
            mediaId: item.mediaId,
            mediaType: item.mediaType,
            movieTitle: item.movieTitle,
            title: `Check out the official ${youtubeTrailer.name || 'trailer'} for ${item.movieTitle}. ${item.overview.slice(0, 110)}...`,
            author: `${item.movieTitle} Official`,
            timeAgo: `${index + 1} hr ago`,
            commentsCount: Math.floor(Math.random() * 45) + 12,
            thumbnail: backdropUrl,
            youtubeId: youtubeTrailer.key,
            topic: item.categoryTag === 'Shows on Air' ? 'Series' : item.categoryTag === 'Upcoming Movies' ? 'Upcoming' : 'Cinema',
            categoryTag: item.categoryTag,
            releaseDate: item.releaseDate,
            overview: item.overview,
          };

          return trailerObj;
        } catch {
          return null;
        }
      });

      const fetchedTrailers = (await Promise.all(trailerPromises)).filter(Boolean) as CinemaTrailer[];

      // Merge with fallback high-profile trailers
      const combined = [...fetchedTrailers, ...FALLBACK_TRAILERS];

      // Deduplicate by mediaId + mediaType
      const unique: CinemaTrailer[] = [];
      const seen = new Set<string>();
      for (const t of combined) {
        const key = `${t.mediaType}_${t.mediaId}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(t);
        }
      }

      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), items: unique })
        );
      } catch {
        // Ignore
      }

      return this.applyFilter(unique, filter);
    } catch {
      // Fallback
      return this.applyFilter(FALLBACK_TRAILERS, filter);
    }
  },

  applyFilter(items: CinemaTrailer[], filter: 'all' | 'latest' | 'upcoming' | 'tv'): CinemaTrailer[] {
    if (filter === 'all') return items;
    if (filter === 'latest') return items.filter((it) => it.categoryTag === 'Latest Released');
    if (filter === 'upcoming') return items.filter((it) => it.categoryTag === 'Upcoming Movies');
    if (filter === 'tv') return items.filter((it) => it.categoryTag === 'Shows on Air');
    return items;
  },
};
