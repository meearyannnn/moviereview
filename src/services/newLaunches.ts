// src/services/newLaunches.ts — Realtime Automated Bollywood & Hollywood Launches with Clear Dynamic Classes
import { tmdb, type Movie } from './tmdb';

export type LaunchClass =
  | 'Trailer'
  | 'Teaser'
  | 'BTS'
  | 'Poster Launched'
  | 'New Movie'
  | 'New Show';

// Backward compatibility alias
export type LaunchType = LaunchClass;

export interface NewLaunchItem {
  id: number | string;
  tmdbId?: number;
  title: string;
  poster: string;
  backdrop?: string;
  launchType: LaunchClass;
  launchClass: LaunchClass;
  industry: 'bollywood' | 'hollywood';
  mediaType: 'movie' | 'tv';
  releaseDate?: string;
  trailerKey?: string;
  headline?: string;
  overview?: string;
  source?: string;
  sourceUrl?: string;
  isHot?: boolean;
}

const CACHE_KEY = 'mg_spotlight_launches_classified_v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh cache

export const newLaunchesService = {
  /**
   * Dynamically fetches ONLY real-time latest & upcoming movies and TV shows from live TMDB endpoints:
   * - ZERO hardcoded dummy data or old catalog films.
   * - Classifies into clear, user-friendly categories:
   *   1. Trailer (Official Trailer Drops)
   *   2. Teaser (Official Teasers)
   *   3. BTS (Behind The Scenes / Featurettes)
   *   4. Poster Launched (Official Poster Reveals)
   *   5. New Movie (Upcoming & New Theatrical Releases)
   *   6. New Show (Brand New TV Series Drops)
   */
  async getLaunches(): Promise<NewLaunchItem[]> {
    // 1. Session Storage cache check
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            Date.now() - parsed.timestamp < CACHE_TTL_MS &&
            Array.isArray(parsed.data) &&
            parsed.data.length > 0
          ) {
            return parsed.data;
          }
        }
      } catch {
        // Continue to fresh fetch
      }
    }

    const todayDate = new Date();
    const todayStr = todayDate.toISOString().split('T')[0];

    // 90 days window for freshly released movies
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const currentYear = todayDate.getFullYear();

    const candidates: Array<{
      raw: any;
      mediaType: 'movie' | 'tv';
      industry: 'bollywood' | 'hollywood';
      initialIntent: 'trailer' | 'teaser' | 'bts' | 'poster' | 'movie' | 'show';
    }> = [];

    const seenIds = new Set<string>();

    try {
      // 2. Query TMDB live streams concurrently:
      const [
        hollywoodUpcoming,
        hollywoodNowPlaying,
        globalTvOnAir,
        bollywoodUpcoming,
        bollywoodRecent,
        bollywoodTv,
      ] = await Promise.allSettled([
        tmdb.getUpcoming(),
        tmdb.getNowPlaying(),
        tmdb.getOnTheAir(),
        tmdb.discoverMovies(`with_original_language=hi&primary_release_date.gte=${todayStr}&sort_by=popularity.desc`),
        tmdb.discoverMovies(`with_original_language=hi&primary_release_date.gte=${ninetyDaysAgo}&sort_by=primary_release_date.desc`),
        tmdb.discoverTV(`with_original_language=hi&first_air_date.gte=${currentYear - 1}-01-01&sort_by=popularity.desc`),
      ]);

      // Bollywood Upcoming Releases (Poster & Trailer Drops)
      if (bollywoodUpcoming.status === 'fulfilled' && Array.isArray(bollywoodUpcoming.value?.results)) {
        for (const m of bollywoodUpcoming.value.results) {
          if (m.poster_path && (m.title || m.name)) {
            const key = `movie-${m.id}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              candidates.push({
                raw: m,
                mediaType: 'movie',
                industry: 'bollywood',
                initialIntent: 'poster',
              });
            }
          }
        }
      }

      // Bollywood Recent Fresh Theatrical Drops
      if (bollywoodRecent.status === 'fulfilled' && Array.isArray(bollywoodRecent.value?.results)) {
        for (const m of bollywoodRecent.value.results) {
          if (m.poster_path && (m.title || m.name)) {
            const key = `movie-${m.id}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              candidates.push({
                raw: m,
                mediaType: 'movie',
                industry: 'bollywood',
                initialIntent: 'movie',
              });
            }
          }
        }
      }

      // Hollywood Upcoming Releases (Trailers & Teasers)
      if (hollywoodUpcoming.status === 'fulfilled' && Array.isArray(hollywoodUpcoming.value?.results)) {
        for (const m of hollywoodUpcoming.value.results) {
          if (m.poster_path && (m.title || m.name)) {
            const key = `movie-${m.id}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              candidates.push({
                raw: m,
                mediaType: 'movie',
                industry: 'hollywood',
                initialIntent: 'trailer',
              });
            }
          }
        }
      }

      // Hollywood Now Playing (Fresh Theatrical Releases)
      if (hollywoodNowPlaying.status === 'fulfilled' && Array.isArray(hollywoodNowPlaying.value?.results)) {
        for (const m of hollywoodNowPlaying.value.results) {
          if (m.poster_path && (m.title || m.name)) {
            const key = `movie-${m.id}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              candidates.push({
                raw: m,
                mediaType: 'movie',
                industry: 'hollywood',
                initialIntent: 'movie',
              });
            }
          }
        }
      }

      // Bollywood TV Series
      if (bollywoodTv.status === 'fulfilled' && Array.isArray(bollywoodTv.value?.results)) {
        for (const s of bollywoodTv.value.results) {
          if (s.poster_path && (s.title || s.name)) {
            const key = `tv-${s.id}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              candidates.push({
                raw: s,
                mediaType: 'tv',
                industry: 'bollywood',
                initialIntent: 'show',
              });
            }
          }
        }
      }

      // Global TV On The Air
      if (globalTvOnAir.status === 'fulfilled' && Array.isArray(globalTvOnAir.value?.results)) {
        for (const s of globalTvOnAir.value.results) {
          if (s.poster_path && (s.title || s.name)) {
            const key = `tv-${s.id}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              candidates.push({
                raw: s,
                mediaType: 'tv',
                industry: s.original_language === 'hi' ? 'bollywood' : 'hollywood',
                initialIntent: 'show',
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Realtime launches query issue:', e);
    }

    // 3. Select balanced pool of candidates
    const bollyCandidates = candidates.filter((c) => c.industry === 'bollywood').slice(0, 14);
    const hollyCandidates = candidates.filter((c) => c.industry === 'hollywood').slice(0, 16);
    const selectedPool = [...bollyCandidates, ...hollyCandidates];

    // 4. Enrich each item with video classification: Trailer, Teaser, BTS, Poster Launched, New Movie, New Show
    const launches: NewLaunchItem[] = await Promise.all(
      selectedPool.map(async ({ raw, mediaType, industry, initialIntent }) => {
        const id = raw.id;
        const title = raw.title || raw.name || '';
        const poster = tmdb.getImageUrl(raw.poster_path, 'w500');
        const backdrop = raw.backdrop_path ? tmdb.getImageUrl(raw.backdrop_path, 'w780') : undefined;
        const rawDate = raw.release_date || raw.first_air_date;
        const overview = raw.overview || 'Latest premiere and launch details currently updating on MovieGuy.';

        let launchClass: LaunchClass = mediaType === 'tv' ? 'New Show' : 'New Movie';
        let trailerKey: string | undefined = undefined;

        // Inspect TMDB videos stream to classify accurately
        try {
          const vRes = await tmdb.getVideos(id, mediaType);
          const videos = vRes?.results || [];

          const trailer = videos.find(
            (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
          );
          const teaser = videos.find(
            (v: any) => v.site === 'YouTube' && v.type === 'Teaser'
          );
          const bts = videos.find(
            (v: any) => v.site === 'YouTube' && (v.type === 'Behind the Scenes' || v.type === 'Featurette' || v.type === 'Clip')
          );

          if (bts && initialIntent === 'bts') {
            trailerKey = bts.key;
            launchClass = 'BTS';
          } else if (trailer) {
            trailerKey = trailer.key;
            launchClass = 'Trailer';
          } else if (teaser) {
            trailerKey = teaser.key;
            launchClass = 'Teaser';
          } else if (bts) {
            trailerKey = bts.key;
            launchClass = 'BTS';
          } else if (mediaType === 'tv') {
            launchClass = 'New Show';
          } else if (raw.release_date && new Date(raw.release_date) > new Date()) {
            launchClass = 'Poster Launched';
          } else {
            launchClass = 'New Movie';
          }
        } catch {
          if (mediaType === 'tv') {
            launchClass = 'New Show';
          } else if (raw.release_date && new Date(raw.release_date) > new Date()) {
            launchClass = 'Poster Launched';
          } else {
            launchClass = 'New Movie';
          }
        }

        // Format clean release date string
        let releaseDate = rawDate;
        if (rawDate) {
          try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
              releaseDate = d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
            }
          } catch {}
        }

        return {
          id,
          tmdbId: id,
          title,
          poster,
          backdrop,
          launchType: launchClass,
          launchClass,
          industry,
          mediaType,
          releaseDate,
          trailerKey,
          headline: `Live premiere track: ${title} launches as ${launchClass} in ${industry === 'bollywood' ? 'Bollywood' : 'Hollywood'}`,
          overview,
          source: industry === 'bollywood' ? 'Bollywood Theatrical Wire' : 'Hollywood Theatrical Wire',
          isHot: (raw.vote_average || 0) > 7.0 || (raw.popularity || 0) > 40,
        };
      })
    );

    // 5. Cache result
    if (launches.length > 0 && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: launches, timestamp: Date.now() })
        );
      } catch {
        // Storage catch
      }
    }

    return launches;
  },
};
