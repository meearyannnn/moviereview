// src/services/franchises.ts — Mega Franchises & Cinematic Universes Engine
import { tmdb } from './tmdb';

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
  isUpcoming?: boolean; // release date is after today
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
  {
    id: 'fast-and-furious',
    name: 'Fast & Furious Saga',
    shortName: 'Fast & Furious',
    tagline: 'Quarter Mile at a Time, Brotherhood & High-Octane Global Heists',
    studio: 'Universal Pictures',
    badge: 'Fast Saga',
    accentColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    bgGradient: 'from-orange-950/40 via-amber-900/10 to-transparent',
    collectionId: 9485, // Fast & Furious Collection
    curatedIds: [9799, 584, 9615, 13804, 51497, 82992, 168259, 337339, 384018, 385128, 385687],
  },
  {
    id: 'transformers',
    name: 'Transformers Universe',
    shortName: 'Transformers',
    tagline: 'More Than Meets the Eye. The War Between Autobots & Decepticons.',
    studio: 'Paramount Pictures',
    badge: 'Cybertron Saga',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    bgGradient: 'from-sky-950/40 via-cyan-900/10 to-transparent',
    collectionId: 8650, // Transformers Collection
    curatedIds: [1858, 8373, 38356, 91314, 335988, 424785, 667538, 698687],
  },
  {
    id: 'jurassic',
    name: 'Jurassic Park & World',
    shortName: 'Jurassic Park',
    tagline: 'Life Finds a Way. 65 Million Years in the Making.',
    studio: 'Universal Pictures / Amblin',
    badge: 'InGen Files',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    bgGradient: 'from-emerald-950/40 via-green-900/10 to-transparent',
    collectionId: 328, // Jurassic Park Collection
    curatedIds: [329, 330, 331, 135397, 351286, 507086],
  },
  {
    id: 'john-wick',
    name: 'John Wick: High Table Universe',
    shortName: 'John Wick',
    tagline: 'The Baba Yaga, the Continental & the Rules of the High Table',
    studio: 'Lionsgate',
    badge: 'Continental Files',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    bgGradient: 'from-purple-950/40 via-fuchsia-900/10 to-transparent',
    collectionId: 404609, // John Wick Collection
    curatedIds: [245891, 324552, 458156, 603692, 541134],
  },
  {
    id: 'monsterverse',
    name: 'Godzilla & Kong MonsterVerse',
    shortName: 'MonsterVerse',
    tagline: 'Ancient Titans Walk the Earth. Hollow Earth & King of the Monsters.',
    studio: 'Legendary / Warner Bros.',
    badge: 'Monarch Archive',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    bgGradient: 'from-cyan-950/40 via-teal-900/10 to-transparent',
    collectionId: 535313,
    curatedIds: [143370, 293167, 373571, 399566, 823464],
  },
  {
    id: 'pirates',
    name: 'Pirates of the Caribbean',
    shortName: 'Pirates of the Caribbean',
    tagline: 'Drink Up Me Hearties Yo Ho. Captain Jack Sparrow\'s Legendary Voyages.',
    studio: 'Walt Disney Pictures',
    badge: 'Black Pearl Log',
    accentColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    bgGradient: 'from-amber-950/40 via-yellow-900/10 to-transparent',
    collectionId: 295, // Pirates of the Caribbean Collection
    curatedIds: [22, 58, 285, 1865, 166426],
  },
];

const CACHE_PREFIX = 'mg_franchise_movies_v3_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MIN_FILL = 8; // below this many films, top up from the studio's catalogue
const DISCOVER_TAKE = 15;
const MAX_ITEMS = 30;

/* ───────────── Helpers ───────────── */

interface TmdbMovieRaw {
  id?: number;
  title?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  overview?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const localYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** One normaliser for every source (collection, details, discover). Returns null for unusable rows. */
function toMovie(p: TmdbMovieRaw | null | undefined, todayStr: string): FranchiseMovie | null {
  if (!p?.id || !p.title || !p.poster_path) return null;
  const date = p.release_date || undefined; // TMDB sends '' for unknown dates
  // A 9.0 from 3 votes is noise; only show ratings with some weight behind them
  const rated = !!p.vote_average && (p.vote_count === undefined || p.vote_count >= 10);
  return {
    id: p.id,
    title: p.title,
    poster_path: p.poster_path,
    backdrop_path: p.backdrop_path || undefined,
    release_date: date,
    releaseYear: date?.split('-')[0],
    vote_average: rated ? Number(p.vote_average!.toFixed(1)) : undefined,
    overview: p.overview || undefined,
    media_type: 'movie',
    isUpcoming: date ? date > todayStr : false, // YYYY-MM-DD compares correctly as a string
  };
}

/** Release order, with undated films last (an empty string used to sort them first). */
const byRelease = (a: FranchiseMovie, b: FranchiseMovie) =>
  (a.release_date ?? '9999').localeCompare(b.release_date ?? '9999') || a.title.localeCompare(b.title);

/* ───────────── Cache ───────────── */

function readCache(key: string): FranchiseMovie[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_TTL && Array.isArray(parsed.data) && parsed.data.length > 0) {
      return parsed.data;
    }
  } catch {
    /* storage unavailable or corrupt */
  }
  return null;
}

function writeCache(key: string, data: FranchiseMovie[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    /* storage full or unavailable */
  }
}

/* ───────────── Loader ───────────── */

/**
 * Sources are merged, not used as fallbacks of each other:
 *   1. the TMDB collection (ordered, complete for its own series),
 *   2. curated IDs the collection doesn't already cover (spin-offs, crossovers),
 *   3. the studio catalogue, only when the franchise is still thin.
 */
async function load(config: FranchiseMeta): Promise<FranchiseMovie[]> {
  const today = localYMD();
  const found = new Map<number, FranchiseMovie>();
  const add = (raw: TmdbMovieRaw | null | undefined) => {
    const m = toMovie(raw, today);
    if (m && !found.has(m.id)) found.set(m.id, m);
  };

  // 1. Collection
  if (config.collectionId) {
    try {
      const col = await tmdb.getCollection(config.collectionId);
      (col?.parts as TmdbMovieRaw[] | undefined)?.forEach(add);
    } catch (err) {
      console.warn(`[franchises] collection ${config.collectionId} failed for ${config.id}:`, err);
    }
  }

  // 2. Curated IDs not already in hand (no repeat requests for what the collection returned)
  const missing = (config.curatedIds ?? []).filter((id) => !found.has(id));
  if (missing.length > 0) {
    const res = await Promise.allSettled(missing.map((id) => tmdb.getDetails(id, 'movie')));
    res.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value?.id) add(r.value as TmdbMovieRaw);
      else console.warn(`[franchises] ${config.id}: TMDB id ${missing[i]} could not be loaded; check it`);
    });
  }

  // 3. Studio catalogue top-up. Sorted by vote count so it surfaces the big films,
  //    and filtered so obscure titles from the same studio don't leak in.
  if (found.size < MIN_FILL && config.companyId) {
    try {
      const disc = await tmdb.discoverMovies(
        `with_companies=${config.companyId}&sort_by=vote_count.desc&vote_count.gte=300&include_adult=false`
      );
      (disc?.results as TmdbMovieRaw[] | undefined)?.slice(0, DISCOVER_TAKE).forEach(add);
    } catch (err) {
      console.warn(`[franchises] company ${config.companyId} discover failed for ${config.id}:`, err);
    }
  }

  return [...found.values()].sort(byRelease).slice(0, MAX_ITEMS);
}

// One request per franchise at a time (rapid tab switching, StrictMode double mounts)
const inflight = new Map<string, Promise<FranchiseMovie[]>>();

export const franchiseService = {
  getFranchises(): FranchiseMeta[] {
    return FRANCHISES_CONFIG;
  },

  getFranchise(franchiseId: string): FranchiseMeta | undefined {
    return FRANCHISES_CONFIG.find((f) => f.id === franchiseId);
  },

  async getFranchiseMovies(franchiseId: string): Promise<FranchiseMovie[]> {
    // An unknown id used to silently return Marvel; now it returns nothing
    const config = this.getFranchise(franchiseId);
    if (!config) {
      console.warn(`[franchises] unknown franchise id "${franchiseId}"`);
      return [];
    }

    const cacheKey = `${CACHE_PREFIX}${config.id}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    let pending = inflight.get(config.id);
    if (!pending) {
      pending = load(config)
        .then((movies) => {
          if (movies.length > 0) writeCache(cacheKey, movies);
          return movies;
        })
        .catch((err) => {
          console.error(`[franchises] failed loading ${config.id}:`, err);
          return [] as FranchiseMovie[];
        })
        .finally(() => inflight.delete(config.id));
      inflight.set(config.id, pending);
    }
    return pending;
  },
};