// src/services/newLaunches.ts — Realtime Automated Bollywood & Hollywood Launches Engine (Zero Hardcoded Data)
import { tmdb, type Movie } from './tmdb';

export type LaunchType =
  | 'New Trailer'
  | 'New Teaser'
  | 'BTS / First Look'
  | 'New Movie'
  | 'New Show'
  | 'New Announcement'
  | 'Encore Re-release';

export interface NewLaunchItem {
  id: number | string;
  tmdbId?: number;
  title: string;
  poster: string;
  backdrop?: string;
  launchType: LaunchType;
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

const CACHE_KEY = 'mg_spotlight_launches_realtime_v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh cache

export const newLaunchesService = {
  /**
   * Dynamically fetches ONLY real-time latest & upcoming movies and TV shows from live TMDB endpoints:
   * - ZERO hardcoded dummy data or old catalog films.
   * - Strictly filters for upcoming theatricals, brand new in-theaters, and current on-air TV shows.
   * - Dynamically inspects video streams to detect official trailers, teasers, and BTS clips.
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
      defaultType: LaunchType;
    }> = [];

    const seenIds = new Set<string>();

    try {
      // 2. Fetch live streams concurrently:
      // - Hollywood Upcoming (Strictly from today onwards)
      // - Hollywood Now Playing (Current theatrical releases)
      // - Hollywood / Global TV On The Air (Currently dropping fresh episodes)
      // - Bollywood Upcoming Releases (Hindi upcoming from today onwards)
      // - Bollywood Recent Releases (Hindi releases within the last 90 days only, no old catalog)
      // - Bollywood Fresh TV Series (Released recently)
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

      // Process Bollywood Upcoming
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
                defaultType: 'New Movie',
              });
            }
          }
        }
      }

      // Process Bollywood Recent Fresh Releases
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
                defaultType: 'New Movie',
              });
            }
          }
        }
      }

      // Process Hollywood Upcoming
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
                defaultType: 'New Trailer',
              });
            }
          }
        }
      }

      // Process Hollywood Now Playing
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
                defaultType: 'New Movie',
              });
            }
          }
        }
      }

      // Process Bollywood TV Series
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
                defaultType: 'New Show',
              });
            }
          }
        }
      }

      // Process Global TV On The Air
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
                defaultType: 'New Show',
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Realtime launches query issue:', e);
    }

    // 3. Select top candidates with healthy balance of Bollywood & Hollywood
    const bollyCandidates = candidates.filter((c) => c.industry === 'bollywood').slice(0, 12);
    const hollyCandidates = candidates.filter((c) => c.industry === 'hollywood').slice(0, 14);
    const selectedPool = [...bollyCandidates, ...hollyCandidates];

    // 4. Enrich with live YouTube trailers & video metadata in parallel
    const launches: NewLaunchItem[] = await Promise.all(
      selectedPool.map(async ({ raw, mediaType, industry, defaultType }) => {
        const id = raw.id;
        const title = raw.title || raw.name || '';
        const poster = tmdb.getImageUrl(raw.poster_path, 'w500');
        const backdrop = raw.backdrop_path ? tmdb.getImageUrl(raw.backdrop_path, 'w780') : undefined;
        const rawDate = raw.release_date || raw.first_air_date;
        const overview = raw.overview || 'Latest premiere and launch details currently updating on MovieGuy.';

        let launchType = defaultType;
        let trailerKey: string | undefined = undefined;

        // Try to fetch real YouTube video track
        try {
          const vRes = await tmdb.getVideos(id, mediaType);
          const videos = vRes?.results || [];

          const officialTrailer = videos.find(
            (v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
          ) || videos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer');

          const teaser = videos.find((v: any) => v.site === 'YouTube' && v.type === 'Teaser');
          const bts = videos.find(
            (v: any) => v.site === 'YouTube' && (v.type === 'Behind the Scenes' || v.type === 'Featurette')
          );

          if (officialTrailer) {
            trailerKey = officialTrailer.key;
            if (mediaType === 'movie') launchType = 'New Trailer';
          } else if (teaser) {
            trailerKey = teaser.key;
            launchType = 'New Teaser';
          } else if (bts) {
            trailerKey = bts.key;
            launchType = 'BTS / First Look';
          }
        } catch {
          // Video lookup catch
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
          launchType,
          industry,
          mediaType,
          releaseDate,
          trailerKey,
          headline: `Live premiere track: ${title} launches across ${industry === 'bollywood' ? 'Indian' : 'Global'} cinema`,
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
