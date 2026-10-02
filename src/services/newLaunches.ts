// src/services/newLaunches.ts — Past 14 days & coming 60 days launches engine
import { tmdb } from './tmdb';

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
  videoKind?: 'trailer' | 'teaser' | 'bts'; // what trailerKey actually points to
  headline?: string;
  overview?: string;
  source?: string;
  sourceUrl?: string;
  isHot?: boolean;
  genres?: string[];
  rating?: number;
  voteCount?: number;
}

type MediaType = 'movie' | 'tv';
type Industry = 'bollywood' | 'hollywood';
type VideoKind = 'trailer' | 'teaser' | 'bts';

interface TmdbRaw {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  original_language?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
}

interface TmdbVideo {
  site: string;
  type: string;
  key: string;
  official?: boolean;
  published_at?: string;
}

interface Candidate {
  raw: TmdbRaw;
  mediaType: MediaType;
  industry: Industry;
  date: string; // YYYY-MM-DD
  days: number; // whole days from today (negative = past)
  score: number;
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};

const WINDOW_PAST_DAYS = 14;
const WINDOW_FUTURE_DAYS = 60;
const FRESH_VIDEO_DAYS = 14; // a trailer/teaser counts as "new" for this long
const MIN_POOL = 12; // below this, top up from TMDB's own upcoming / now-playing lists
const VIDEO_CONCURRENCY = 8;

// Items kept per industry and window, so neither side crowds the other out
const QUOTA: Record<Industry, { upcoming: number; recent: number }> = {
  bollywood: { upcoming: 10, recent: 8 },
  hollywood: { upcoming: 12, recent: 10 },
};

const CACHE_KEY = 'mg_spotlight_launches_window_v3';
const CACHE_TTL_MS = 5 * 60 * 1000;

/* ───────────── Date helpers (all LOCAL time, so "today" matches the viewer's day) ───────────── */

const pad = (n: number) => String(n).padStart(2, '0');
const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const parseYMD = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const dayDiff = (ymd: string, today: Date) =>
  Math.round((parseYMD(ymd).getTime() - today.getTime()) / 86_400_000);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function timingLabel(days: number): string {
  if (days === 0) return 'Out today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1 && days <= 14) return `In ${days} days`;
  if (days > 14 && days <= 45) return `In ${plural(Math.round(days / 7), 'week')}`;
  if (days > 45) return `In ${plural(Math.round(days / 30), 'month')}`;
  const past = Math.abs(days);
  return past <= 6 ? `${past} days ago` : `${plural(Math.round(past / 7), 'week')} ago`;
}

/* ───────────── Small utilities ───────────── */

const q = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join('&');

/** Run `fn` over items with at most `limit` in flight, keeping result order. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/* ───────────── Cache ───────────── */

function readCache(todayStr: string): NewLaunchItem[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const fresh = Date.now() - parsed.timestamp < CACHE_TTL_MS;
    // Day check: relative labels ("Tomorrow", "2 days ago") are wrong after midnight
    if (fresh && parsed.day === todayStr && Array.isArray(parsed.data) && parsed.data.length > 0) {
      return parsed.data;
    }
  } catch {
    /* storage unavailable or corrupt: fetch fresh */
  }
  return null;
}

function writeCache(todayStr: string, data: NewLaunchItem[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, day: todayStr, timestamp: Date.now() }));
  } catch {
    /* storage full or unavailable */
  }
}

/* ───────────── Video picking ───────────── */

const byOfficialThenNewest = (a: TmdbVideo, b: TmdbVideo) =>
  Number(!!b.official) - Number(!!a.official) ||
  (Date.parse(b.published_at || '') || 0) - (Date.parse(a.published_at || '') || 0);

/**
 * Picks the video to play and decides whether it deserves a "new" label.
 * The label follows the video: if a fresh teaser is labelled "New Teaser",
 * the teaser is what plays, not an older trailer.
 */
function pickVideo(videos: TmdbVideo[], today: Date) {
  const yt = videos.filter((v) => v.site === 'YouTube' && v.key);
  const best = (types: string[]) => yt.filter((v) => types.includes(v.type)).sort(byOfficialThenNewest)[0];

  const ordered: Array<{ video?: TmdbVideo; label: LaunchClass; kind: VideoKind }> = [
    { video: best(['Trailer']), label: 'New Trailer', kind: 'trailer' },
    { video: best(['Teaser']), label: 'New Teaser', kind: 'teaser' },
    { video: best(['Behind the Scenes', 'Featurette']), label: 'BTS / First Look', kind: 'bts' },
  ];

  const isFresh = (v: TmdbVideo) => {
    const t = Date.parse(v.published_at || '');
    return !isNaN(t) && (today.getTime() - t) / 86_400_000 <= FRESH_VIDEO_DAYS;
  };

  const fresh = ordered.find((o) => o.video && isFresh(o.video));
  if (fresh) return { key: fresh.video!.key, kind: fresh.kind, freshLabel: fresh.label };

  const fallback = ordered.find((o) => o.video);
  return { key: fallback?.video?.key, kind: fallback?.kind, freshLabel: undefined };
}

/* ───────────── Engine ───────────── */

async function load(): Promise<NewLaunchItem[]> {
  const today = startOfToday();
  const todayStr = toYMD(today);

  const cached = readCache(todayStr);
  if (cached) return cached;

  const fromStr = toYMD(addDays(today, -WINDOW_PAST_DAYS));
  const toStr = toYMD(addDays(today, WINDOW_FUTURE_DAYS));

  // 1. Discover: split into recent and upcoming so each window is guaranteed representation.
  //    A separate Hindi query keeps Bollywood from being buried by global popularity.
  const base = 'include_adult=false&sort_by=popularity.desc';
  const ranges: Array<[string, string]> = [
    [fromStr, todayStr],
    [todayStr, toStr],
  ];
  const jobs: Array<{ type: MediaType; promise: Promise<unknown> }> = [];

  for (const [gte, lte] of ranges) {
    for (const lang of [undefined, 'with_original_language=hi']) {
      jobs.push({
        type: 'movie',
        promise: tmdb.discoverMovies(
          q(base, lang, `primary_release_date.gte=${gte}`, `primary_release_date.lte=${lte}`)
        ),
      });
      jobs.push({
        type: 'tv',
        promise: tmdb.discoverTV(
          // No news or talk shows: they premiere constantly and aren't "launches"
          q(base, lang, `first_air_date.gte=${gte}`, `first_air_date.lte=${lte}`, 'without_genres=10763,10767')
        ),
      });
    }
  }

  const raws = new Map<string, { raw: TmdbRaw; mediaType: MediaType }>();
  const collect = (results: unknown, mediaType: MediaType) => {
    const list = (results as { results?: TmdbRaw[] } | undefined)?.results;
    if (!Array.isArray(list)) return;
    for (const raw of list) {
      const key = `${mediaType}-${raw.id}`;
      if (!raws.has(key)) raws.set(key, { raw, mediaType });
    }
  };

  const settled = await Promise.allSettled(jobs.map((j) => j.promise));
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') collect(r.value, jobs[i].type);
    else console.warn('Launch discover query failed:', r.reason);
  });

  // 2. Top up from TMDB's curated lists when the window is quiet
  if (raws.size < MIN_POOL) {
    const [up, now] = await Promise.allSettled([tmdb.getUpcoming(), tmdb.getNowPlaying()]);
    if (up.status === 'fulfilled') collect(up.value, 'movie');
    if (now.status === 'fulfilled') collect(now.value, 'movie');
  }

  // 3. Normalise into candidates. Anything without a poster, title or date, or
  //    outside the window, is dropped (this also trims the top-up lists).
  const candidates: Array<Omit<Candidate, 'score'> & { popularity: number }> = [];
  for (const { raw, mediaType } of raws.values()) {
    const date = mediaType === 'tv' ? raw.first_air_date : raw.release_date;
    if (!raw.poster_path || !(raw.title || raw.name) || !date) continue;
    const days = dayDiff(date, today);
    if (days < -WINDOW_PAST_DAYS || days > WINDOW_FUTURE_DAYS) continue;
    candidates.push({
      raw,
      mediaType,
      // Industry from the film's own language, not from which query found it
      industry: raw.original_language === 'hi' ? 'bollywood' : 'hollywood',
      date,
      days,
      popularity: raw.popularity || 0,
    });
  }

  // 4. Select per (industry x window) bucket by popularity, and score for display order.
  //    Popularity is ranked within each bucket so Bollywood isn't outranked by raw TMDB numbers.
  const pool: Candidate[] = [];
  for (const industry of ['bollywood', 'hollywood'] as Industry[]) {
    for (const window of ['upcoming', 'recent'] as const) {
      const bucket = candidates
        .filter((c) => c.industry === industry && (window === 'upcoming' ? c.days > 0 : c.days <= 0))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, QUOTA[industry][window]);

      bucket.forEach((c, i) => {
        const percentile = 1 - i / bucket.length;
        const proximity = 1 / (1 + Math.abs(c.days) / 21); // closer to today ranks higher
        pool.push({ ...c, score: percentile * 0.6 + proximity * 0.4 });
      });
    }
  }

  // 5. Enrich with videos (bounded concurrency, not 40 requests at once)
  const launches = await mapLimit(pool, VIDEO_CONCURRENCY, (c) => enrich(c, today));

  // Best first: popular within its bucket AND close to today
  const scoreOf = new Map(pool.map((c) => [`${c.mediaType}-${c.raw.id}`, c.score]));
  launches.sort(
    (a, b) => (scoreOf.get(`${b.mediaType}-${b.id}`) || 0) - (scoreOf.get(`${a.mediaType}-${a.id}`) || 0)
  );

  if (launches.length > 0) writeCache(todayStr, launches);
  return launches;
}

async function enrich(c: Candidate, today: Date): Promise<NewLaunchItem> {
  const { raw, mediaType, industry, date, days } = c;
  const title = raw.title || raw.name || '';
  const isUpcoming = days > 0;

  let launchClass: LaunchClass =
    mediaType === 'tv' ? (isUpcoming ? 'Upcoming Show' : 'New Show') : isUpcoming ? 'Upcoming Movie' : 'New Movie';

  let trailerKey: string | undefined;
  let videoKind: VideoKind | undefined;
  try {
    const res = (await tmdb.getVideos(raw.id, mediaType)) as { results?: TmdbVideo[] } | undefined;
    const picked = pickVideo(res?.results || [], today);
    trailerKey = picked.key;
    videoKind = picked.kind;
    // A video that dropped in the last 14 days (trailer, teaser or BTS) wins the label,
    // whether the title is upcoming or already out. Otherwise the date-based class stays.
    if (picked.freshLabel) launchClass = picked.freshLabel;
  } catch {
    /* no video data: keep the date-based class */
  }

  const voteCount = raw.vote_count || 0;
  const hasRating = voteCount >= 5 && !!raw.vote_average; // a 9.0 from 3 votes is noise
  const rating = hasRating ? Number(raw.vote_average!.toFixed(1)) : undefined;

  return {
    id: raw.id,
    tmdbId: raw.id,
    title,
    poster: tmdb.getImageUrl(raw.poster_path!, 'w500'),
    backdrop: raw.backdrop_path ? tmdb.getImageUrl(raw.backdrop_path, 'w780') : undefined,
    launchType: launchClass,
    launchClass,
    industry,
    mediaType,
    releaseDate: parseYMD(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    releaseTimingLabel: timingLabel(days),
    daysUntilRelease: days,
    isUpcoming,
    trailerKey,
    videoKind,
    headline: `${launchClass}: ${title} (${industry === 'bollywood' ? 'Bollywood' : 'Hollywood'})`,
    overview: raw.overview?.trim() || undefined, // the UI shows its own fallback text
    source: industry === 'bollywood' ? 'Bollywood Cinema Wire' : 'Hollywood Theatrical Wire',
    isHot: (voteCount >= 100 && (raw.vote_average || 0) >= 7.5) || (raw.popularity || 0) > 50,
    genres: (raw.genre_ids || []).map((g) => GENRE_MAP[g]).filter(Boolean).slice(0, 3),
    rating,
    voteCount,
  };
}

// Share one request between callers (React StrictMode mounts effects twice in dev)
let inflight: Promise<NewLaunchItem[]> | null = null;

export const newLaunchesService = {
  getLaunches(): Promise<NewLaunchItem[]> {
    if (!inflight) {
      inflight = load().finally(() => {
        inflight = null;
      });
    }
    return inflight;
  },
};