// src/services/franchises.ts — Mega Franchises & Cinematic Universes Engine
import { tmdb, type Movie } from './tmdb';

export interface FranchiseMeta {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  studio: string;
  badge: string;
  accentColor: string;
  glowColor: string;
  bgGradient: string;
  collectionId?: number;
  companyId?: number;
  curatedIds?: number[];
  backdropHint?: string;
}

export interface FranchiseMovie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  release_date?: string;
  releaseYear?: string;
  vote_average?: number;
  overview?: string;
  media_type: 'movie';
}

export const FRANCHISES_CONFIG: FranchiseMeta[] = [
  {
    id: 'marvel',
    name: 'Marvel Cinematic Universe',
    shortName: 'Marvel / MCU',
    tagline: 'Earth\'s Mightiest Heroes, the Infinity Saga & the Multiverse',
    studio: 'Marvel Studios',
    badge: 'MCU Canon',
    accentColor: '#ed1d24',
    glowColor: 'rgba(237, 29, 36, 0.4)',
    bgGradient: 'from-red-950/40 via-red-900/10 to-transparent',
    companyId: 420,
    curatedIds: [299536, 299534, 284054, 284053, 634649, 102899, 1726, 1724, 24428, 99861, 315635, 505642],
  },
  {
    id: 'harry-potter',
    name: 'Wizarding World of Harry Potter',
    shortName: 'Harry Potter',
    tagline: 'The Boy Who Lived, Hogwarts & the Secrets of Magic',
    studio: 'Warner Bros. Pictures',
    badge: 'Wizarding World',
    accentColor: '#d4af37',
    glowColor: 'rgba(212, 175, 55, 0.4)',
    bgGradient: 'from-amber-950/40 via-amber-900/10 to-transparent',
    collectionId: 1241, // TMDB Harry Potter Collection (all 8 movies in order)
  },
  {
    id: 'dc',
    name: 'DC Universe & Gotham',
    shortName: 'DC Universe',
    tagline: 'Gods Among Men, the Justice League & the Dark Knight',
    studio: 'DC Films',
    badge: 'DC Universe',
    accentColor: '#0078f0',
    glowColor: 'rgba(0, 120, 240, 0.4)',
    bgGradient: 'from-blue-950/40 via-cyan-900/10 to-transparent',
    companyId: 429,
    curatedIds: [155, 272, 49026, 414906, 49521, 297762, 791373, 297761],
  },
  {
    id: 'star-wars',
    name: 'Star Wars Saga',
    shortName: 'Star Wars',
    tagline: 'A Long Time Ago in a Galaxy Far, Far Away',
    studio: 'Lucasfilm',
    badge: 'Skywalker Saga',
    accentColor: '#ffe81f',
    glowColor: 'rgba(255, 232, 31, 0.35)',
    bgGradient: 'from-yellow-950/30 via-amber-900/10 to-transparent',
    collectionId: 10, // Star Wars Collection
    curatedIds: [11, 1891, 1892, 1893, 1894, 1895, 140607, 181808, 181812, 330459],
  },
  {
    id: 'lotr',
    name: 'The Lord of the Rings & Middle-earth',
    shortName: 'Middle-earth',
    tagline: 'One Ring to Rule Them All, One Ring to Find Them',
    studio: 'New Line Cinema',
    badge: 'Tolkien Universe',
    accentColor: '#e5a93c',
    glowColor: 'rgba(229, 169, 60, 0.4)',
    bgGradient: 'from-amber-950/40 via-yellow-900/10 to-transparent',
    collectionId: 119, // The Lord of the Rings Collection
    curatedIds: [120, 121, 122, 49051, 57158, 122917],
  },
  {
    id: 'mission-impossible',
    name: 'Mission: Impossible',
    shortName: 'Mission: Impossible',
    tagline: 'Your Mission, Should You Choose to Accept It',
    studio: 'Paramount Pictures',
    badge: 'IMF Dossier',
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    bgGradient: 'from-red-950/30 via-rose-900/10 to-transparent',
    collectionId: 87359, // Mission: Impossible Collection
  },
  {
    id: 'james-bond',
    name: 'James Bond 007',
    shortName: 'James Bond 007',
    tagline: 'Licensed to Kill. The World\'s Greatest Secret Agent.',
    studio: 'Eon Productions',
    badge: '007 Archives',
    accentColor: '#c5a059',
    glowColor: 'rgba(197, 160, 89, 0.35)',
    bgGradient: 'from-stone-900/50 via-amber-950/10 to-transparent',
    collectionId: 645, // James Bond Collection
    curatedIds: [37724, 36557, 206647, 370172, 646, 682],
  },
  {
    id: 'yrf-spy',
    name: 'YRF Spy Universe',
    shortName: 'YRF Spy Universe',
    tagline: 'India\'s Premier Cinematic Espionage Universe',
    studio: 'Yash Raj Films',
    badge: 'RAW & ISI Files',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    bgGradient: 'from-amber-950/40 via-orange-950/10 to-transparent',
    curatedIds: [868759, 803700, 585268, 455075, 119054], // Pathaan, Tiger 3, War, Tiger Zinda Hai, Ek Tha Tiger
  },
];

const CACHE_PREFIX = 'mg_franchise_movies_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache

export const franchiseService = {
  getFranchises(): FranchiseMeta[] {
    return FRANCHISES_CONFIG;
  },

  async getFranchiseMovies(franchiseId: string): Promise<FranchiseMovie[]> {
    const config = FRANCHISES_CONFIG.find((f) => f.id === franchiseId) || FRANCHISES_CONFIG[0];
    const cacheKey = `${CACHE_PREFIX}${config.id}`;

    // 1. Session Storage cache check
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Date.now() - parsed.timestamp < CACHE_TTL && Array.isArray(parsed.data) && parsed.data.length > 0) {
            return parsed.data;
          }
        }
      } catch {}
    }

    let movies: FranchiseMovie[] = [];

    try {
      // 2. Strategy A: Collection ID fetch (e.g. Harry Potter, LOTR, Mission Impossible, Bond)
      if (config.collectionId) {
        try {
          const colData = await tmdb.getCollection(config.collectionId);
          if (colData && Array.isArray(colData.parts) && colData.parts.length > 0) {
            movies = colData.parts
              .filter((p: any) => p.poster_path && p.title)
              .map((p: any) => ({
                id: p.id,
                title: p.title,
                poster_path: p.poster_path,
                backdrop_path: p.backdrop_path,
                release_date: p.release_date,
                releaseYear: p.release_date ? p.release_date.split('-')[0] : undefined,
                vote_average: p.vote_average ? Number(p.vote_average.toFixed(1)) : undefined,
                overview: p.overview,
                media_type: 'movie' as const,
              }));

            // Sort Harry Potter, Mission Impossible, etc. in release order
            movies.sort((a, b) => {
              const da = a.release_date || '';
              const db = b.release_date || '';
              return da.localeCompare(db);
            });
          }
        } catch (err) {
          console.warn(`Failed fetching collection ${config.collectionId}:`, err);
        }
      }

      // 3. Strategy B: Curated TMDB IDs (e.g. Marvel top canon, DC Dark Knight + DCEU, YRF Spy)
      if (movies.length === 0 && config.curatedIds && config.curatedIds.length > 0) {
        const fetched = await Promise.allSettled(
          config.curatedIds.map((id) => tmdb.getDetails(id, 'movie'))
        );

        movies = fetched
          .filter((res): res is PromiseFulfilledResult<any> => res.status === 'fulfilled' && Boolean(res.value?.id))
          .map((res) => {
            const p = res.value;
            return {
              id: p.id,
              title: p.title,
              poster_path: p.poster_path,
              backdrop_path: p.backdrop_path,
              release_date: p.release_date,
              releaseYear: p.release_date ? p.release_date.split('-')[0] : undefined,
              vote_average: p.vote_average ? Number(p.vote_average.toFixed(1)) : undefined,
              overview: p.overview,
              media_type: 'movie' as const,
            };
          });
      }

      // 4. Strategy C: Company Discover Fallback (Marvel 420, DC 429)
      if (movies.length === 0 && config.companyId) {
        const disc = await tmdb.discoverMovies(`with_companies=${config.companyId}&sort_by=popularity.desc`);
        if (disc && Array.isArray(disc.results)) {
          movies = disc.results
            .filter((p: any) => p.poster_path && p.title)
            .slice(0, 15)
            .map((p: any) => ({
              id: p.id,
              title: p.title,
              poster_path: p.poster_path,
              backdrop_path: p.backdrop_path,
              release_date: p.release_date,
              releaseYear: p.release_date ? p.release_date.split('-')[0] : undefined,
              vote_average: p.vote_average ? Number(p.vote_average.toFixed(1)) : undefined,
              overview: p.overview,
              media_type: 'movie' as const,
            }));
        }
      }
    } catch (err) {
      console.error(`Error loading franchise movies for ${config.id}:`, err);
    }

    // Cache the result
    if (movies.length > 0 && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data: movies, timestamp: Date.now() }));
      } catch {}
    }

    return movies;
  },
};
