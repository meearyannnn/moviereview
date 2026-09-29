// services/omdb.ts
// OMDb API service providing IMDb, Rotten Tomatoes, and Metacritic ratings, content ratings, awards, and box office stats.

const OMDB_API_KEY = 'f560f92f';
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

export interface OmdbRatingItem {
  source: string;
  value: string;
}

export interface OmdbMovieData {
  title: string;
  year: string;
  rated: string; // "PG-13", "R", "TV-MA", "PG", "G", "N/A"
  released: string;
  runtime: string;
  genre: string;
  director: string;
  writer: string;
  actors: string;
  plot: string;
  language: string;
  country: string;
  awards: string;
  poster: string;
  ratings: OmdbRatingItem[];
  metascore: number | null;
  imdbRating: number | null;
  imdbVotes: string | null;
  imdbId: string;
  boxOffice: string | null;
  rottenTomatoesScore: string | null; // e.g. "85%"
  rottenTomatoesNum: number | null; // e.g. 85
  type: 'movie' | 'series' | 'episode';
}

// In-memory cache for fast lookups
const memoryCache = new Map<string, OmdbMovieData>();

// Helper to get from storage cache
const getCachedData = (key: string): OmdbMovieData | null => {
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!;
  }
  try {
    const raw = sessionStorage.getItem(`omdb_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache.set(key, parsed);
      return parsed;
    }
  } catch {
    // Storage access might be restricted in some environments
  }
  return null;
};

// Helper to save to storage cache
const setCachedData = (key: string, data: OmdbMovieData) => {
  memoryCache.set(key, data);
  try {
    sessionStorage.setItem(`omdb_${key}`, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
};

const parseOmdbResponse = (raw: any): OmdbMovieData | null => {
  if (!raw || raw.Response !== 'True') return null;

  // Extract Rotten Tomatoes
  let rtScore: string | null = null;
  let rtNum: number | null = null;
  if (Array.isArray(raw.Ratings)) {
    const rtItem = raw.Ratings.find(
      (r: any) => r.Source === 'Rotten Tomatoes' || r.Source?.toLowerCase().includes('rotten')
    );
    if (rtItem && rtItem.Value) {
      rtScore = rtItem.Value;
      const parsed = parseInt(rtItem.Value.replace('%', '').trim(), 10);
      if (!isNaN(parsed)) rtNum = parsed;
    }
  }

  // Extract Metascore
  let metascoreNum: number | null = null;
  if (raw.Metascore && raw.Metascore !== 'N/A') {
    const parsed = parseInt(raw.Metascore, 10);
    if (!isNaN(parsed)) metascoreNum = parsed;
  } else if (Array.isArray(raw.Ratings)) {
    const metaItem = raw.Ratings.find((r: any) => r.Source?.toLowerCase().includes('metacritic'));
    if (metaItem?.Value) {
      const parsed = parseInt(metaItem.Value.split('/')[0].trim(), 10);
      if (!isNaN(parsed)) metascoreNum = parsed;
    }
  }

  // Extract IMDb Rating
  let imdbRatingNum: number | null = null;
  if (raw.imdbRating && raw.imdbRating !== 'N/A') {
    const parsed = parseFloat(raw.imdbRating);
    if (!isNaN(parsed)) imdbRatingNum = parsed;
  }

  return {
    title: raw.Title || '',
    year: raw.Year || '',
    rated: raw.Rated && raw.Rated !== 'N/A' ? raw.Rated : '',
    released: raw.Released && raw.Released !== 'N/A' ? raw.Released : '',
    runtime: raw.Runtime && raw.Runtime !== 'N/A' ? raw.Runtime : '',
    genre: raw.Genre && raw.Genre !== 'N/A' ? raw.Genre : '',
    director: raw.Director && raw.Director !== 'N/A' ? raw.Director : '',
    writer: raw.Writer && raw.Writer !== 'N/A' ? raw.Writer : '',
    actors: raw.Actors && raw.Actors !== 'N/A' ? raw.Actors : '',
    plot: raw.Plot && raw.Plot !== 'N/A' ? raw.Plot : '',
    language: raw.Language && raw.Language !== 'N/A' ? raw.Language : '',
    country: raw.Country && raw.Country !== 'N/A' ? raw.Country : '',
    awards: raw.Awards && raw.Awards !== 'N/A' ? raw.Awards : '',
    poster: raw.Poster && raw.Poster !== 'N/A' ? raw.Poster : '',
    ratings: Array.isArray(raw.Ratings)
      ? raw.Ratings.map((r: any) => ({ source: r.Source, value: r.Value }))
      : [],
    metascore: metascoreNum,
    imdbRating: imdbRatingNum,
    imdbVotes: raw.imdbVotes && raw.imdbVotes !== 'N/A' ? raw.imdbVotes : null,
    imdbId: raw.imdbID || '',
    boxOffice: raw.BoxOffice && raw.BoxOffice !== 'N/A' ? raw.BoxOffice : null,
    rottenTomatoesScore: rtScore,
    rottenTomatoesNum: rtNum,
    type: raw.Type === 'series' ? 'series' : raw.Type === 'episode' ? 'episode' : 'movie',
  };
};

export interface FetchOmdbParams {
  imdbId?: string | null;
  title?: string;
  year?: number | string;
  type?: 'movie' | 'series';
}

export const getOmdbDetails = async ({
  imdbId,
  title,
  year,
  type,
}: FetchOmdbParams): Promise<OmdbMovieData | null> => {
  // 1. Try lookup by IMDb ID if available
  if (imdbId && imdbId.startsWith('tt')) {
    const cacheKey = `id_${imdbId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${OMDB_BASE_URL}?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}`);
      if (res.ok) {
        const raw = await res.json();
        const parsed = parseOmdbResponse(raw);
        if (parsed) {
          setCachedData(cacheKey, parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('OMDb lookup by IMDb ID failed:', e);
    }
  }

  // 2. Fallback to Title & Year lookup
  if (title) {
    const cleanTitle = title.trim();
    const cacheKey = `title_${cleanTitle}_${year || ''}_${type || ''}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      let url = `${OMDB_BASE_URL}?t=${encodeURIComponent(cleanTitle)}&apikey=${OMDB_API_KEY}`;
      if (year) {
        const y = String(year).slice(0, 4);
        url += `&y=${encodeURIComponent(y)}`;
      }
      if (type) {
        url += `&type=${encodeURIComponent(type)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const raw = await res.json();
        const parsed = parseOmdbResponse(raw);
        if (parsed) {
          setCachedData(cacheKey, parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('OMDb lookup by title failed:', e);
    }
  }

  return null;
};

// Per-episode IMDb ratings for a season
export interface OmdbSeasonEpisode {
  title: string;
  episode: number;
  imdbRating: number | null;
  imdbId: string;
  released: string;
}

export const getOmdbSeasonEpisodes = async (
  imdbId: string,
  seasonNumber: number
): Promise<OmdbSeasonEpisode[] | null> => {
  if (!imdbId?.startsWith('tt')) return null;
  const cacheKey = `omdb_season_${imdbId}_${seasonNumber}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore */ }
  try {
    const res = await fetch(
      `${OMDB_BASE_URL}?i=${encodeURIComponent(imdbId)}&Season=${seasonNumber}&apikey=${OMDB_API_KEY}`
    );
    if (!res.ok) return null;
    const raw = await res.json();
    if (raw.Response !== 'True' || !Array.isArray(raw.Episodes)) return null;
    const eps: OmdbSeasonEpisode[] = raw.Episodes.map((e: any) => ({
      title: e.Title || '',
      episode: parseInt(e.Episode, 10),
      imdbRating: e.imdbRating && e.imdbRating !== 'N/A' ? parseFloat(e.imdbRating) : null,
      imdbId: e.imdbID || '',
      released: e.Released || '',
    }));
    try { sessionStorage.setItem(cacheKey, JSON.stringify(eps)); } catch { /* ignore */ }
    return eps;
  } catch { return null; }
};

// React hook for convenience
import { useEffect, useState } from 'react';

export const useOmdb = (params: FetchOmdbParams | null) => {
  const [data, setData] = useState<OmdbMovieData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!params || (!params.imdbId && !params.title)) {
      setData(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    getOmdbDetails(params)
      .then((res) => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch(() => {
        if (isMounted) setData(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [params?.imdbId, params?.title, params?.year, params?.type]);

  return { data, isLoading };
};
