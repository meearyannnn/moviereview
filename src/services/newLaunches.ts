// src/services/newLaunches.ts — Realtime Bollywood & Hollywood Launches, Trailers, Teasers, Announcements & BTS
import { tmdb, type Movie } from './tmdb';
import { cinemaNewsService } from './cinemaNews';

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
  videoType?: string;
  tagline?: string;
  overview?: string;
  isHot?: boolean;
}

const CACHE_KEY = 'mg_new_launches_feed_v1';
const CACHE_TTL_MS = 6 * 60 * 1000; // 6 minutes cache

export const newLaunchesService = {
  async getLaunches(): Promise<NewLaunchItem[]> {
    // 1. Check in-memory / session storage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data?.length > 0) {
            return parsed.data;
          }
        }
      } catch {
        // Continue to fresh fetch
      }
    }

    try {
      const launches: NewLaunchItem[] = [];
      const seenIds = new Set<string>();

      // 2. Fetch live data in parallel from Bollywood and Hollywood streams
      const [
        bollywoodPopularRes,
        bollywoodUpcomingRes,
        bollywoodShowsRes,
        hollywoodUpcomingRes,
        hollywoodNowPlayingRes,
        hollywoodShowsRes,
        newsScoops,
      ] = await Promise.allSettled([
        // Bollywood / Desi cinema popular movies
        tmdb.discoverMovies('with_original_language=hi&sort_by=popularity.desc'),
        // Bollywood upcoming / recent releases
        tmdb.discoverMovies('with_original_language=hi&primary_release_date.gte=2024-01-01&sort_by=primary_release_date.desc'),
        // Bollywood Hindi Series
        tmdb.discoverTV('with_original_language=hi&sort_by=popularity.desc'),
        // Hollywood / Global Upcoming movies
        tmdb.getUpcomingMovies(1),
        // Hollywood / Global Now Playing movies
        tmdb.getNowPlaying(1),
        // Global trending TV shows
        tmdb.getTrending('tv', 'day'),
        // Breaking cinema news / announcements
        cinemaNewsService.getRealtimeNews(false).catch(() => []),
      ]);

      const newsTitles = new Set(
        (newsScoops.status === 'fulfilled' ? newsScoops.value : [])
          .map((n) => n.title.toLowerCase())
      );

      // Helper to push unique launch item
      const addLaunch = (item: NewLaunchItem) => {
        const key = `${item.mediaType}-${item.id}`;
        if (!seenIds.has(key) && item.poster && !item.poster.includes('null')) {
          seenIds.add(key);
          launches.push(item);
        }
      };

      // 3. Process Bollywood Movies
      const bollywoodMovies: Movie[] = [];
      if (bollywoodUpcomingRes.status === 'fulfilled' && bollywoodUpcomingRes.value?.results) {
        bollywoodMovies.push(...bollywoodUpcomingRes.value.results.slice(0, 10));
      }
      if (bollywoodPopularRes.status === 'fulfilled' && bollywoodPopularRes.value?.results) {
        bollywoodMovies.push(...bollywoodPopularRes.value.results.slice(0, 10));
      }

      // 4. Process Bollywood TV Shows
      const bollywoodShows: Movie[] = [];
      if (bollywoodShowsRes.status === 'fulfilled' && bollywoodShowsRes.value?.results) {
        bollywoodShows.push(...bollywoodShowsRes.value.results.slice(0, 8));
      }

      // 5. Process Hollywood Movies
      const hollywoodMovies: Movie[] = [];
      if (hollywoodUpcomingRes.status === 'fulfilled' && hollywoodUpcomingRes.value?.results) {
        hollywoodMovies.push(...hollywoodUpcomingRes.value.results.slice(0, 10));
      }
      if (hollywoodNowPlayingRes.status === 'fulfilled' && hollywoodNowPlayingRes.value?.results) {
        hollywoodMovies.push(...hollywoodNowPlayingRes.value.results.slice(0, 10));
      }

      // 6. Process Hollywood Shows
      const hollywoodShows: Movie[] = [];
      if (hollywoodShowsRes.status === 'fulfilled' && hollywoodShowsRes.value?.results) {
        hollywoodShows.push(...hollywoodShowsRes.value.results.slice(0, 8));
      }

      // 7. Select top candidates for video/trailer inspection
      const candidates = [
        ...bollywoodMovies.slice(0, 6).map((m) => ({ m, industry: 'bollywood' as const, mediaType: 'movie' as const })),
        ...hollywoodMovies.slice(0, 6).map((m) => ({ m, industry: 'hollywood' as const, mediaType: 'movie' as const })),
        ...bollywoodShows.slice(0, 3).map((m) => ({ m, industry: 'bollywood' as const, mediaType: 'tv' as const })),
        ...hollywoodShows.slice(0, 3).map((m) => ({ m, industry: 'hollywood' as const, mediaType: 'tv' as const })),
      ];

      // Fetch trailers/videos for candidates in parallel
      const videoLookups = await Promise.allSettled(
        candidates.map(async ({ m, mediaType }) => {
          try {
            const vRes = await tmdb.getVideos(m.id, mediaType);
            const videos: any[] = vRes.results || [];
            // Look for trailer, teaser, or BTS
            const trailer = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer');
            const teaser = videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');
            const bts = videos.find(
              (v) => v.site === 'YouTube' && (v.type === 'Behind the Scenes' || v.type === 'Featurette')
            );
            return {
              id: m.id,
              trailerKey: trailer?.key || teaser?.key || bts?.key,
              videoType: trailer ? 'Trailer' : teaser ? 'Teaser' : bts ? 'BTS' : undefined,
            };
          } catch {
            return { id: m.id, trailerKey: undefined, videoType: undefined };
          }
        })
      );

      const videoMap = new Map<number, { trailerKey?: string; videoType?: string }>();
      videoLookups.forEach((res) => {
        if (res.status === 'fulfilled' && res.value) {
          videoMap.set(res.value.id, {
            trailerKey: res.value.trailerKey,
            videoType: res.value.videoType,
          });
        }
      });

      // 8. Assemble combined launches with authentic launch tags
      candidates.forEach(({ m, industry, mediaType }, index) => {
        const title = m.title || m.name || 'Untitled';
        const vInfo = videoMap.get(m.id);

        let launchType: LaunchType = mediaType === 'tv' ? 'New Show' : 'New Movie';

        if (vInfo?.videoType === 'Trailer') {
          launchType = 'New Trailer';
        } else if (vInfo?.videoType === 'Teaser') {
          launchType = 'New Teaser';
        } else if (vInfo?.videoType === 'BTS') {
          launchType = 'BTS / First Look';
        } else if (m.release_date && new Date(m.release_date).getFullYear() < new Date().getFullYear() - 3) {
          launchType = 'Encore Re-release';
        } else if (newsTitles.has(title.toLowerCase())) {
          launchType = 'New Announcement';
        }

        addLaunch({
          id: m.id,
          tmdbId: m.id,
          title,
          poster: tmdb.getImageUrl(m.poster_path, 'w342'),
          backdrop: m.backdrop_path ? tmdb.getImageUrl(m.backdrop_path, 'w780') : undefined,
          launchType,
          industry,
          mediaType,
          releaseDate: m.release_date || m.first_air_date,
          trailerKey: vInfo?.trailerKey,
          videoType: vInfo?.videoType,
          overview: m.overview,
          isHot: index < 4,
        });
      });

      // Cache fresh data
      if (launches.length > 0 && typeof window !== 'undefined' && window.sessionStorage) {
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: launches, timestamp: Date.now() })
          );
        } catch {
          // ignore quota issues
        }
      }

      return launches;
    } catch (err) {
      console.error('Failed to load new launches:', err);
      return [];
    }
  },
};
