// services/fanart.ts
// Multi-source High-Definition Title Logo Service (Fanart.tv + TMDB Logo fallback & Preloader)
import { tmdb } from './tmdb';

const FANART_API_KEY = 'f29de98b9ebdb880b5dd27c570ca2b54';
const BASE_URL = 'https://webservice.fanart.tv/v3';

export interface FanartImage {
  id: string;
  url: string;
  lang: string;
  likes: string;
}

export interface MovieArt {
  logo?: string;
  backdrop?: string;
  banner?: string;
  disc?: string;
}

export interface TVArt {
  logo?: string;
  backdrop?: string;
  banner?: string;
}

class FanartService {
  private cache = new Map<string, any>();
  private preloadedUrls = new Set<string>();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  private getCached(key: string): any | null {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    try {
      const raw = localStorage.getItem(`art_${key}`);
      if (raw) {
        const item = JSON.parse(raw);
        if (Date.now() - item.time < this.CACHE_TTL_MS) {
          this.cache.set(key, item.data);
          return item.data;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return null;
  }

  private setCached(key: string, data: any) {
    this.cache.set(key, data);
    try {
      localStorage.setItem(
        `art_${key}`,
        JSON.stringify({ time: Date.now(), data })
      );
    } catch {
      // Ignore localStorage quota limits
    }
  }

  /**
   * Preload an image URL in memory so it renders 100% instantly without partial rendering
   */
  async preloadImage(url: string): Promise<boolean> {
    if (!url) return false;
    if (this.preloadedUrls.has(url)) return true;

    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      if (img.complete) {
        this.preloadedUrls.add(url);
        resolve(true);
        return;
      }
      img.onload = () => {
        this.preloadedUrls.add(url);
        resolve(true);
      };
      img.onerror = () => {
        resolve(false);
      };
    });
  }

  /**
   * Get TMDB Logo for a movie or TV show (ultra-fast Cloudflare CDN)
   */
  async getTmdbLogo(id: number | string, type: 'movie' | 'tv' = 'movie'): Promise<string | null> {
    const cacheKey = `tmdb_logo_${type}_${id}`;
    const cached = this.getCached(cacheKey);
    if (cached !== null) return cached || null;

    try {
      const data = await tmdb.getImages(Number(id), type);
      const logos = data.logos || [];
      // Prefer English logos
      const enLogo = logos.find((l: any) => l.iso_639_1 === 'en') || logos[0];
      if (enLogo?.file_path) {
        const url = `https://image.tmdb.org/t/p/w500${enLogo.file_path}`;
        this.setCached(cacheKey, url);
        return url;
      }
    } catch {
      // Silent fallback
    }
    this.setCached(cacheKey, '');
    return null;
  }

  /**
   * Fetch complete artwork set for a movie by TMDB ID from Fanart.tv
   */
  async getMovieArt(tmdbId: number | string): Promise<MovieArt> {
    const cacheKey = `movie_${tmdbId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(`${BASE_URL}/movies/${tmdbId}?api_key=${FANART_API_KEY}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        this.setCached(cacheKey, {});
        return {};
      }

      const data = await res.json();
      const logos: FanartImage[] = data.hdmovielogo || data.movielogo || [];
      const bestLogo = logos.find((l) => l.lang === 'en') || logos[0];

      const backgrounds: FanartImage[] = data.moviebackground || [];
      const bestBg = backgrounds.find((b) => b.lang === 'en' || !b.lang) || backgrounds[0];

      const banners: FanartImage[] = data.moviebanner || [];
      const bestBanner = banners.find((b) => b.lang === 'en') || banners[0];

      const discs: FanartImage[] = data.moviedisc || [];
      const bestDisc = discs[0];

      const result: MovieArt = {
        logo: bestLogo?.url,
        backdrop: bestBg?.url,
        banner: bestBanner?.url,
        disc: bestDisc?.url,
      };

      this.setCached(cacheKey, result);
      return result;
    } catch (err) {
      this.setCached(cacheKey, {});
      return {};
    }
  }

  /**
   * Fetch complete artwork set for a TV show by TVDB ID from Fanart.tv
   */
  async getTVArt(tvdbId: number | string): Promise<TVArt> {
    const cacheKey = `tv_${tvdbId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${BASE_URL}/tv/${tvdbId}?api_key=${FANART_API_KEY}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        this.setCached(cacheKey, {});
        return {};
      }

      const data = await res.json();
      const logos: FanartImage[] = data.hdtvlogo || data.clearlogo || [];
      const bestLogo = logos.find((l) => l.lang === 'en') || logos[0];

      const backgrounds: FanartImage[] = data.showbackground || [];
      const bestBg = backgrounds.find((b) => b.lang === 'en' || !b.lang) || backgrounds[0];

      const banners: FanartImage[] = data.tvbanner || [];
      const bestBanner = banners.find((b) => b.lang === 'en') || banners[0];

      const result: TVArt = {
        logo: bestLogo?.url,
        backdrop: bestBg?.url,
        banner: bestBanner?.url,
      };

      this.setCached(cacheKey, result);
      return result;
    } catch (err) {
      this.setCached(cacheKey, {});
      return {};
    }
  }

  /**
   * Get the best logo available for a movie or TV show.
   * Checks TMDB (lightning fast) + Fanart.tv, pre-verifies and caches it.
   */
  async getBestLogo(id: number | string, type: 'movie' | 'tv' = 'movie'): Promise<string | null> {
    const cacheKey = `best_logo_${type}_${id}`;
    const cached = this.getCached(cacheKey);
    if (cached !== null) return cached || null;

    // 1. Try TMDB logos first (fastest & high uptime)
    const tmdbLogo = await this.getTmdbLogo(id, type);
    if (tmdbLogo) {
      this.setCached(cacheKey, tmdbLogo);
      return tmdbLogo;
    }

    // 2. Fallback to Fanart.tv
    if (type === 'movie') {
      const movieArt = await this.getMovieArt(id);
      if (movieArt.logo) {
        this.setCached(cacheKey, movieArt.logo);
        return movieArt.logo;
      }
    } else {
      try {
        const ext = await tmdb.getExternalIds(Number(id), 'tv');
        if (ext?.tvdb_id) {
          const tvArt = await this.getTVArt(ext.tvdb_id);
          if (tvArt.logo) {
            this.setCached(cacheKey, tvArt.logo);
            return tvArt.logo;
          }
        }
      } catch {
        // Ignore
      }
    }

    this.setCached(cacheKey, '');
    return null;
  }

  async getMovieLogoByTMDB(tmdbId: number | string): Promise<string | null> {
    return this.getBestLogo(tmdbId, 'movie');
  }

  async getMovieLogo(tmdbId: number | string): Promise<string | null> {
    return this.getBestLogo(tmdbId, 'movie');
  }

  async getTVLogoByTMDB(tmdbId: number | string): Promise<string | null> {
    return this.getBestLogo(tmdbId, 'tv');
  }

  async getTVLogo(tmdbId: number | string): Promise<string | null> {
    return this.getBestLogo(tmdbId, 'tv');
  }
}

export const fanart = new FanartService();
