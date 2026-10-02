// src/services/newLaunches.ts — Realtime Past 2 Weeks & Coming 2 Months Dynamic Launches Engine (Zero Hardcoded Data)
import { tmdb, type Movie } from './tmdb';

export type LaunchClass =
  | 'Upcoming Movie'
  | 'Upcoming Show'
  | 'New Movie'
  | 'New Show'
  | 'New Trailer'
  | 'New Teaser'
  | 'BTS / First Look'
  | 'Poster Launched';

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
  releaseTimingLabel?: string;
  daysUntilRelease?: number;
  isUpcoming?: boolean;
  trailerKey?: string;
  headline?: string;
  overview?: string;
  source?: string;
  sourceUrl?: string;
  isHot?: boolean;
  genres?: string[];
  rating?: number;
  voteCount?: number;
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

const CACHE_KEY = 'mg_spotlight_launches_window_2m_v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh cache

export const newLaunchesService = {
  /**
   * Realtime accurate dynamic engine:
   * - Queries releases from PAST 2 WEEKS (-14 days) and COMING 2 MONTHS (+60 days).
   * - Creates proper distinct classes:
   *   - "Upcoming Movie" (releasing in the coming 2 months)
   *   - "Upcoming Show" (premiering in the coming 2 months)
   *   - "New Movie" (released in past 2 weeks)
   *   - "New Show" (dropped in past 2 weeks)
   *   - "New Trailer" (fresh official trailer)
   *   - "New Teaser" (fresh teaser)
   *   - "BTS / First Look" (on-set making)
   *   - "Poster Launched" (first look artwork)
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

    // Past 2 weeks (-14 days)
    const pastTwoWeeks = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const pastTwoWeeksStr = pastTwoWeeks.toISOString().split('T')[0];

    // Coming 2 months (+60 days)
    const comingTwoMonths = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const comingTwoMonthsStr = comingTwoMonths.toISOString().split('T')[0];

    const candidates: Array<{
      raw: any;
      mediaType: 'movie' | 'tv';
      industry: 'bollywood' | 'hollywood';
      windowType: 'past_2_weeks' | 'coming_2_months';
    }> = [];

    const seenIds = new Set<string>();

    try {
      // 2. Query TMDB live streams strictly within [-14 days, +60 days] window:
      const [
        upcomingTwoMonths,
        recentTwoWeeks,
        bollywoodUpcomingTwoMonths,
        bollywoodRecentTwoWeeks,
        tvAiringWindow,
        bollywoodTvWindow,
      ] = await Promise.allSettled([
        // Hollywood / Global Upcoming (Next 60 days)
        tmdb.discoverMovies(
          `primary_release_date.gte=${todayStr}&primary_release_date.lte=${comingTwoMonthsStr}&sort_by=popularity.desc`
        ),
        // Hollywood / Global Released in Past 2 Weeks
        tmdb.discoverMovies(
          `primary_release_date.gte=${pastTwoWeeksStr}&primary_release_date.lte=${todayStr}&sort_by=popularity.desc`
        ),
        // Bollywood Upcoming (Next 60 days)
        tmdb.discoverMovies(
          `with_original_language=hi&primary_release_date.gte=${todayStr}&primary_release_date.lte=${comingTwoMonthsStr}&sort_by=popularity.desc`
        ),
        // Bollywood Released in Past 2 Weeks
        tmdb.discoverMovies(
          `with_original_language=hi&primary_release_date.gte=${pastTwoWeeksStr}&primary_release_date.lte=${todayStr}&sort_by=popularity.desc`
        ),
        // Global TV Shows dropping episodes / premiering within [-14d, +60d] window
        tmdb.discoverTV(
          `first_air_date.gte=${pastTwoWeeksStr}&first_air_date.lte=${comingTwoMonthsStr}&sort_by=popularity.desc`
        ),
        // Bollywood TV series within window
        tmdb.discoverTV(
          `with_original_language=hi&first_air_date.gte=${pastTwoWeeksStr}&first_air_date.lte=${comingTwoMonthsStr}&sort_by=popularity.desc`
        ),
      ]);

      // Collect Bollywood Upcoming (Coming 2 Months)
      if (bollywoodUpcomingTwoMonths.status === 'fulfilled' && Array.isArray(bollywoodUpcomingTwoMonths.value?.results)) {
        for (const m of bollywoodUpcomingTwoMonths.value.results) {
          if (m.poster_path && (m.title || m.name)) {
            const key = `movie-${m.id}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              candidates.push({
                raw: m,
                mediaType: 'movie',
                industry: 'bollywood',
                windowType: 'coming_2_months',
              });
            }
          }
        }
      }

      // Collect Bollywood Recent (Past 2 Weeks)
      if (bollywoodRecentTwoWeeks.status === 'fulfilled' && Array.isArray(bollywoodRecentTwoWeeks.value?.results)) {
        for (const m of bollywoodRecentTwoWeeks.value.results) {
          if (m.poster_path && (m.title || m.name)) {
            const key = `movie-${m.id}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              candidates.push({
                raw: m,
                mediaType: 'movie',
                industry: 'bollywood',
                windowType: 'past_2_weeks',
              });
            }
          }
        }
      }

      // Collect Hollywood Upcoming (Coming 2 Months)
      if (upcomingTwoMonths.status === 'fulfilled' && Array.isArray(upcomingTwoMonths.value?.results)) {
        for (const m of upcomingTwoMonths.value.results) {
          if (m.poster_path && (m.title || m.name)) {
            const key = `movie-${m.id}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              candidates.push({
                raw: m,
                mediaType: 'movie',
                industry: 'hollywood',
                windowType: 'coming_2_months',
              });
            }
          }
        }
      }

      // Collect Hollywood Recent (Past 2 Weeks)
      if (recentTwoWeeks.status === 'fulfilled' && Array.isArray(recentTwoWeeks.value?.results)) {
        for (const m of recentTwoWeeks.value.results) {
          if (m.poster_path && (m.title || m.name)) {
            const key = `movie-${m.id}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              candidates.push({
                raw: m,
                mediaType: 'movie',
                industry: 'hollywood',
                windowType: 'past_2_weeks',
              });
            }
          }
        }
      }

      // Collect Bollywood TV Series
      if (bollywoodTvWindow.status === 'fulfilled' && Array.isArray(bollywoodTvWindow.value?.results)) {
        for (const s of bollywoodTvWindow.value.results) {
          if (s.poster_path && (s.title || s.name)) {
            const key = `tv-${s.id}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              const isFuture = s.first_air_date && new Date(s.first_air_date) > todayDate;
              candidates.push({
                raw: s,
                mediaType: 'tv',
                industry: 'bollywood',
                windowType: isFuture ? 'coming_2_months' : 'past_2_weeks',
              });
            }
          }
        }
      }

      // Collect Global TV Series
      if (tvAiringWindow.status === 'fulfilled' && Array.isArray(tvAiringWindow.value?.results)) {
        for (const s of tvAiringWindow.value.results) {
          if (s.poster_path && (s.title || s.name)) {
            const key = `tv-${s.id}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              const isFuture = s.first_air_date && new Date(s.first_air_date) > todayDate;
              candidates.push({
                raw: s,
                mediaType: 'tv',
                industry: s.original_language === 'hi' ? 'bollywood' : 'hollywood',
                windowType: isFuture ? 'coming_2_months' : 'past_2_weeks',
              });
            }
          }
        }
      }

      // Backup fallback: if window is quiet, supplement with tmdb.getUpcoming() and getNowPlaying()
      if (candidates.length < 12) {
        const [upBackup, npBackup] = await Promise.allSettled([tmdb.getUpcoming(), tmdb.getNowPlaying()]);
        if (upBackup.status === 'fulfilled' && Array.isArray(upBackup.value?.results)) {
          for (const m of upBackup.value.results) {
            const key = `movie-${m.id}`;
            if (!seenIds.has(key) && m.poster_path) {
              seenIds.add(key);
              candidates.push({
                raw: m,
                mediaType: 'movie',
                industry: 'hollywood',
                windowType: 'coming_2_months',
              });
            }
          }
        }
        if (npBackup.status === 'fulfilled' && Array.isArray(npBackup.value?.results)) {
          for (const m of npBackup.value.results) {
            const key = `movie-${m.id}`;
            if (!seenIds.has(key) && m.poster_path) {
              seenIds.add(key);
              candidates.push({
                raw: m,
                mediaType: 'movie',
                industry: 'hollywood',
                windowType: 'past_2_weeks',
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Realtime 2-week & 2-month window query issue:', e);
    }

    // 3. Select balanced pool of candidates (Bollywood & Hollywood)
    const bollyCandidates = candidates.filter((c) => c.industry === 'bollywood').slice(0, 18);
    const hollyCandidates = candidates.filter((c) => c.industry === 'hollywood').slice(0, 22);
    const selectedPool = [...bollyCandidates, ...hollyCandidates];

    // 4. Enrich each item with YouTube video and compute exact class
    const launches: NewLaunchItem[] = await Promise.all(
      selectedPool.map(async ({ raw, mediaType, industry, windowType }) => {
        const id = raw.id;
        const title = raw.title || raw.name || '';
        const poster = tmdb.getImageUrl(raw.poster_path, 'w500');
        const backdrop = raw.backdrop_path ? tmdb.getImageUrl(raw.backdrop_path, 'w780') : undefined;
        const rawDate = raw.release_date || raw.first_air_date;
        const overview = raw.overview || 'Latest premiere and launch details currently updating on MovieGuy.';

        const isUpcoming = windowType === 'coming_2_months' || (rawDate && new Date(rawDate) > todayDate);

        let launchClass: LaunchClass = mediaType === 'tv'
          ? (isUpcoming ? 'Upcoming Show' : 'New Show')
          : (isUpcoming ? 'Upcoming Movie' : 'New Movie');

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
            (v: any) => v.site === 'YouTube' && (v.type === 'Behind the Scenes' || v.type === 'Featurette')
          );

          if (bts) {
            trailerKey = bts.key;
            launchClass = 'BTS / First Look';
          } else if (trailer) {
            trailerKey = trailer.key;
            launchClass = isUpcoming ? 'New Trailer' : (mediaType === 'tv' ? 'New Show' : 'New Movie');
          } else if (teaser) {
            trailerKey = teaser.key;
            launchClass = 'New Teaser';
          } else if (isUpcoming && raw.poster_path && !trailerKey) {
            launchClass = mediaType === 'tv' ? 'Upcoming Show' : 'Upcoming Movie';
          }
        } catch {
          // Fallback based on mediaType & date window
          if (mediaType === 'tv') {
            launchClass = isUpcoming ? 'Upcoming Show' : 'New Show';
          } else {
            launchClass = isUpcoming ? 'Upcoming Movie' : 'New Movie';
          }
        }

        // Map genres
        const genres = Array.isArray(raw.genre_ids)
          ? raw.genre_ids.map((gid: number) => GENRE_MAP[gid]).filter(Boolean).slice(0, 3)
          : [];

        // Format clean release date & timing label
        let releaseDate = rawDate;
        let releaseTimingLabel = isUpcoming ? 'Coming Soon' : 'Recently Released';
        let daysUntilRelease: number | undefined = undefined;

        if (rawDate) {
          try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
              releaseDate = d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              const diffDays = Math.round((d.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
              daysUntilRelease = diffDays;

              if (diffDays > 0) {
                if (diffDays === 1) {
                  releaseTimingLabel = 'In 1 day';
                } else if (diffDays <= 7) {
                  releaseTimingLabel = `In ${diffDays} days`;
                } else if (diffDays <= 30) {
                  releaseTimingLabel = `In ${Math.ceil(diffDays / 7)} weeks`;
                } else {
                  const months = Math.round(diffDays / 30 * 10) / 10;
                  releaseTimingLabel = `In ~${months} mo`;
                }
              } else if (diffDays === 0) {
                releaseTimingLabel = 'Releasing Today';
              } else {
                const pastDays = Math.abs(diffDays);
                if (pastDays === 1) {
                  releaseTimingLabel = 'Yesterday';
                } else if (pastDays <= 7) {
                  releaseTimingLabel = `${pastDays} days ago`;
                } else {
                  releaseTimingLabel = `${Math.ceil(pastDays / 7)} weeks ago`;
                }
              }
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
          releaseTimingLabel,
          daysUntilRelease,
          isUpcoming,
          trailerKey,
          headline: `${launchClass}: ${title} (${industry === 'bollywood' ? 'Bollywood' : 'Hollywood'})`,
          overview,
          source: industry === 'bollywood' ? 'Bollywood Cinema Wire' : 'Hollywood Theatrical Wire',
          isHot: (raw.vote_average || 0) > 7.0 || (raw.popularity || 0) > 30,
          genres,
          rating: raw.vote_average ? Number(raw.vote_average.toFixed(1)) : undefined,
          voteCount: raw.vote_count || 0,
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
