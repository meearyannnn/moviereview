import { tmdb, type TMDBCountryReleaseDates } from './tmdb';
import { trakt } from './trakt';

export interface ScheduleItem {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  release_date: string; // YYYY-MM-DD
  media_type: 'movie' | 'tv';
  hypeScore: number;
  releaseTag: string;
  vote_average?: number;
  overview?: string;
  release_type?: number;
  isRegional?: boolean;
  note?: string;
  certification?: string;
}

export interface DateGroupedSchedule {
  dateKey: string; // YYYY-MM-DD
  dayName: string; // e.g. WED
  dayNumber: string; // e.g. 16
  monthName: string; // e.g. SEP
  isToday: boolean;
  items: ScheduleItem[];
}

export interface RegionalReleaseResult {
  release_date: string; // YYYY-MM-DD
  release_type?: number;
  isRegional: boolean;
  note?: string;
  certification?: string;
}

const scheduleCache = new Map<string, any>();
const regionalReleaseCache = new Map<string, RegionalReleaseResult>();

// Calculate realistic hype score matching screenshots (e.g. 267, 209, 78, 62, 15, 9)
function calculateHypeScore(item: any): number {
  const pop = Number(item.popularity) || 0;
  const votes = Number(item.vote_count) || 0;
  const raw = Math.round(pop * 3.2 + votes / 8);
  if (raw < 5) {
    return (item.id % 25) + 4;
  }
  return Math.min(raw, 350);
}

/**
 * Resolves release date and type for a movie based on user's region (default "IN").
 * - Release types: 1=Premiere, 2=Theatrical (limited), 3=Theatrical, 4=Digital, 5=Physical, 6=TV.
 * - Prefer type 3, then 2, for "In Theatre" date. Ignore type 1 (premieres) for calendar placement.
 * - If region has no entry, fall back to earliest type 2/3 date globally, and mark as isRegional = false.
 * - If no type 2/3 globally, fall back to other non-premiere types (4, 6, 5), or fallbackDate.
 */
export function resolveRegionalRelease(
  releaseDatesResult: { results?: TMDBCountryReleaseDates[] } | null | undefined,
  fallbackDate: string = '',
  region: string = 'IN'
): RegionalReleaseResult {
  const results = releaseDatesResult?.results || [];
  const targetRegion = (region || 'IN').toUpperCase();
  const fallbackClean = (fallbackDate || '').slice(0, 10);

  // 1. Search for user's target region
  const regionEntry = results.find(
    (r) => r.iso_3166_1 && r.iso_3166_1.toUpperCase() === targetRegion
  );

  if (regionEntry?.release_dates?.length) {
    // Filter out premiere dates (type 1) and missing dates
    const valid = regionEntry.release_dates.filter(
      (r) => r && r.release_date && r.type !== 1
    );

    // Prefer type 3 (Theatrical), then type 2 (Theatrical limited)
    const type3List = valid.filter((r) => r.type === 3);
    const type2List = valid.filter((r) => r.type === 2);
    const type4List = valid.filter((r) => r.type === 4); // Digital
    const otherList = valid.filter((r) => r.type === 6 || r.type === 5);

    const pickEarliest = (list: typeof valid) => {
      if (!list.length) return null;
      return [...list].sort((a, b) =>
        a.release_date.slice(0, 10).localeCompare(b.release_date.slice(0, 10))
      )[0];
    };

    const chosen =
      pickEarliest(type3List) ||
      pickEarliest(type2List) ||
      pickEarliest(type4List) ||
      pickEarliest(otherList);

    if (chosen) {
      return {
        release_date: chosen.release_date.slice(0, 10),
        release_type: chosen.type,
        isRegional: true,
        certification: chosen.certification,
        note: chosen.note,
      };
    }
  }

  // 2. Fallback: earliest type 2/3 date globally across all countries
  const globalTheatrical: { date: string; type: number; cert?: string; note?: string }[] = [];
  const globalDigitalOrTv: { date: string; type: number; cert?: string; note?: string }[] = [];

  for (const country of results) {
    for (const rel of country.release_dates || []) {
      if (!rel || !rel.release_date || rel.type === 1) continue;
      const datePart = rel.release_date.slice(0, 10);
      if (rel.type === 2 || rel.type === 3) {
        globalTheatrical.push({
          date: datePart,
          type: rel.type,
          cert: rel.certification,
          note: rel.note,
        });
      } else if (rel.type === 4 || rel.type === 6 || rel.type === 5) {
        globalDigitalOrTv.push({
          date: datePart,
          type: rel.type,
          cert: rel.certification,
          note: rel.note,
        });
      }
    }
  }

  if (globalTheatrical.length > 0) {
    globalTheatrical.sort((a, b) => a.date.localeCompare(b.date));
    const earliest = globalTheatrical[0];
    return {
      release_date: earliest.date,
      release_type: earliest.type,
      isRegional: false,
      certification: earliest.cert,
      note: 'Date may differ in your region',
    };
  }

  if (globalDigitalOrTv.length > 0) {
    globalDigitalOrTv.sort((a, b) => a.date.localeCompare(b.date));
    const earliest = globalDigitalOrTv[0];
    return {
      release_date: earliest.date,
      release_type: earliest.type,
      isRegional: false,
      certification: earliest.cert,
      note: 'Date may differ in your region',
    };
  }

  return {
    release_date: fallbackClean,
    release_type: undefined,
    isRegional: false,
    note: 'Date may differ in your region',
  };
}

/**
 * Generate tag:
 * - TV: New Show • {year} or New Season • {year}
 * - Movies: derived ONLY from the release type:
 *   type 2/3 -> "In Theatre • {year}"
 *   type 4 -> "OTT Release • {year}"
 *   type 6 -> "TV • {year}"
 *   type 5 -> "Physical • {year}"
 *   otherwise -> "Release • {year}" (NEVER defaults to OTT)
 */
export function generateReleaseTag(
  item: { release_date?: string; first_air_date?: string; release_type?: number; media_type?: 'movie' | 'tv' },
  type: 'movie' | 'tv' = item.media_type || 'movie'
): string {
  const dateStr = item.release_date || item.first_air_date || '';
  const year = dateStr.slice(0, 4) || new Date().getFullYear().toString();

  if (type === 'tv') {
    const isNew = item.first_air_date?.startsWith(year);
    return isNew ? `New Show • ${year}` : `New Season • ${year}`;
  }

  if (item.release_type === 2 || item.release_type === 3) {
    return `In Theatre • ${year}`;
  }
  if (item.release_type === 4) {
    return `OTT Release • ${year}`;
  }
  if (item.release_type === 6) {
    return `TV • ${year}`;
  }
  if (item.release_type === 5) {
    return `Physical • ${year}`;
  }

  return `Release • ${year}`;
}

export function getLocalTodayString(timeZone: string = 'Asia/Kolkata'): string {
  try {
    const tz = timeZone || (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'Asia/Kolkata';
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Formats as YYYY-MM-DD
  } catch {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function parseDateHeader(
  dateStr: string,
  todayStr: string
): { dayName: string; dayNumber: string; monthName: string; isToday: boolean } {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      // Construct date in local time to avoid UTC parsing shift
      const d = new Date(year, monthIndex, day);
      return {
        dayName: DAY_NAMES[d.getDay()] || 'TUE',
        dayNumber: String(day).padStart(2, '0'),
        monthName: MONTH_NAMES[monthIndex] || 'SEP',
        isToday: dateStr === todayStr,
      };
    }
  } catch { }
  return { dayName: 'TUE', dayNumber: '15', monthName: 'SEP', isToday: dateStr === todayStr };
}

async function batchResolveRegionalReleases(
  movies: any[],
  region: string = 'IN'
): Promise<Map<number, RegionalReleaseResult>> {
  const result = new Map<number, RegionalReleaseResult>();
  const uniqueMovies = Array.from(new Map(movies.map((m) => [m.id, m])).values());

  const CHUNK_SIZE = 8;
  for (let i = 0; i < uniqueMovies.length; i += CHUNK_SIZE) {
    const chunk = uniqueMovies.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (m) => {
        const cacheKey = `${m.id}_${region}`;
        if (regionalReleaseCache.has(cacheKey)) {
          result.set(m.id, regionalReleaseCache.get(cacheKey)!);
          return;
        }

        try {
          const relData = await tmdb.getMovieReleaseDates(m.id);
          const resolved = resolveRegionalRelease(relData, m.release_date, region);
          regionalReleaseCache.set(cacheKey, resolved);
          result.set(m.id, resolved);
        } catch {
          const fallbackResolved: RegionalReleaseResult = {
            release_date: (m.release_date || '').slice(0, 10),
            release_type: undefined,
            isRegional: false,
            note: 'Date may differ in your region',
          };
          regionalReleaseCache.set(cacheKey, fallbackResolved);
          result.set(m.id, fallbackResolved);
        }
      })
    );
  }

  return result;
}

export const scheduleService = {
  /**
   * Get Upcoming Releases grouped by Date (starting directly from TODAY's date)
   */
  getUpcomingSchedule: async (
    year?: number,
    month?: number,
    mediaType: 'all' | 'movie' | 'tv' = 'all',
    region: string = 'IN'
  ): Promise<DateGroupedSchedule[]> => {
    const today = getLocalTodayString();
    const currentYear = parseInt(today.slice(0, 4), 10);
    const currentMonth = parseInt(today.slice(5, 7), 10);

    const cacheKey = `upcoming_${year || 'curr'}_${month || 'all'}_${mediaType}_${region}_${today}`;
    if (scheduleCache.has(cacheKey)) return scheduleCache.get(cacheKey);

    let startDate: string;
    let endDate: string;

    if (year && month) {
      const mStr = String(month).padStart(2, '0');
      // If current year and month, anchor strictly to today
      if (year === currentYear && month === currentMonth) {
        startDate = today;
      } else {
        startDate = `${year}-${mStr}-01`;
      }
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${year}-${mStr}-${lastDay}`;
    } else if (year && year > currentYear) {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else {
      // Default: START STRICTLY FROM TODAY
      startDate = today;
      const [currY, currM, currD] = today.split('-').map(Number);
      const future = new Date(currY, currM - 1, currD + 45);
      const fY = future.getFullYear();
      const fM = String(future.getMonth() + 1).padStart(2, '0');
      const fD = String(future.getDate()).padStart(2, '0');
      endDate = `${fY}-${fM}-${fD}`;
    }

    try {
      // 1. Try Trakt Calendar & Hype Map
      let traktHypeMap = new Map<string, number>();
      try {
        traktHypeMap = await trakt.getHypeMap();
        const [traktMovies, traktShows] = await Promise.all([
          (mediaType === 'all' || mediaType === 'movie') ? trakt.getCalendarMovies(startDate, 14) : null,
          (mediaType === 'all' || mediaType === 'tv') ? trakt.getCalendarShows(startDate, 14) : null,
        ]);
        if (Array.isArray(traktMovies)) {
          traktMovies.forEach((entry) => {
            if (entry.movie?.ids?.tmdb) {
              traktHypeMap.set(`movie_${entry.movie.ids.tmdb}`, entry.list_count || entry.watchers || 0);
            }
          });
        }
        if (Array.isArray(traktShows)) {
          traktShows.forEach((entry) => {
            if (entry.show?.ids?.tmdb) {
              traktHypeMap.set(`tv_${entry.show.ids.tmdb}`, entry.list_count || entry.watchers || 0);
            }
          });
        }
      } catch { }

      // 2. Discover day-by-day releases via TMDB
      // Pass region=IN and with_release_type=2|3 (and 4 for digital)
      const moviePromises: Promise<any>[] = [];
      const tvPromises: Promise<any>[] = [];

      if (mediaType === 'all' || mediaType === 'movie') {
        // Theatrical releases (type 2 & 3)
        moviePromises.push(
          tmdb.discover(
            'movie',
            `region=${region}&with_release_type=2|3&release_date.gte=${startDate}&release_date.lte=${endDate}&sort_by=popularity.desc&page=1`
          )
        );
        moviePromises.push(
          tmdb.discover(
            'movie',
            `region=${region}&with_release_type=2|3&release_date.gte=${startDate}&release_date.lte=${endDate}&sort_by=popularity.desc&page=2`
          )
        );
        // Digital releases (type 4)
        moviePromises.push(
          tmdb.discover(
            'movie',
            `region=${region}&with_release_type=4&release_date.gte=${startDate}&release_date.lte=${endDate}&sort_by=popularity.desc&page=1`
          )
        );
        // Also fallback discover on primary release dates so movies without regional flags aren't omitted
        moviePromises.push(
          tmdb.discover(
            'movie',
            `primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}&sort_by=popularity.desc&page=1`
          )
        );
      }

      if (mediaType === 'all' || mediaType === 'tv') {
        tvPromises.push(
          tmdb.discover(
            'tv',
            `first_air_date.gte=${startDate}&first_air_date.lte=${endDate}&sort_by=first_air_date.asc,popularity.desc&page=1`
          )
        );
        tvPromises.push(
          tmdb.discover(
            'tv',
            `first_air_date.gte=${startDate}&first_air_date.lte=${endDate}&sort_by=first_air_date.asc,popularity.desc&page=2`
          )
        );
        tvPromises.push(
          tmdb.discover(
            'tv',
            `air_date.gte=${startDate}&air_date.lte=${endDate}&sort_by=popularity.desc&page=1`
          )
        );
      }

      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises),
      ]);

      // Collect raw movies
      const rawMovies: any[] = [];
      movieResponses.forEach((res) => {
        (res?.results || []).forEach((m: any) => {
          if (m?.id && m.poster_path) rawMovies.push(m);
        });
      });

      // Resolve regional dates and release types for movies
      const movieReleaseMap = await batchResolveRegionalReleases(rawMovies, region);

      const allItems: ScheduleItem[] = [];
      const seenIds = new Set<string>();

      // Process movies
      rawMovies.forEach((item) => {
        const resolved = movieReleaseMap.get(item.id) || {
          release_date: (item.release_date || '').slice(0, 10),
          release_type: undefined,
          isRegional: false,
        };

        const dateStr = resolved.release_date || item.release_date?.slice(0, 10) || '';
        if (!dateStr || dateStr.length < 10) return;
        // Group by region-specific date: must be within range
        if (dateStr < startDate || dateStr > endDate) return;

        const uniqueKey = `movie_${item.id}_${dateStr}`;
        if (seenIds.has(uniqueKey)) return;
        seenIds.add(uniqueKey);

        const traktScore =
          traktHypeMap.get(`movie_${item.id}`) ||
          traktHypeMap.get(`title_${(item.title || '').toLowerCase().trim()}`);

        const itemObj: ScheduleItem = {
          id: item.id,
          title: item.title,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: dateStr,
          media_type: 'movie',
          hypeScore: traktScore && traktScore > 0 ? traktScore : calculateHypeScore(item),
          releaseTag: generateReleaseTag(
            { release_date: dateStr, release_type: resolved.release_type, media_type: 'movie' },
            'movie'
          ),
          vote_average: item.vote_average,
          overview: item.overview,
          release_type: resolved.release_type,
          isRegional: resolved.isRegional,
          note: resolved.note,
          certification: resolved.certification,
        };

        allItems.push(itemObj);
      });

      // Process TV shows
      tvResponses.forEach((res) => {
        const list = res?.results || [];
        list.forEach((item: any) => {
          if (!item.poster_path) return;
          const dateStr = (item.first_air_date || item.air_date || '').slice(0, 10);
          if (!dateStr || dateStr.length < 10) return;
          if (dateStr < startDate || dateStr > endDate) return;

          const uniqueKey = `tv_${item.id}_${dateStr}`;
          if (seenIds.has(uniqueKey)) return;
          seenIds.add(uniqueKey);

          const traktScore =
            traktHypeMap.get(`tv_${item.id}`) ||
            traktHypeMap.get(`title_${(item.name || '').toLowerCase().trim()}`);

          allItems.push({
            id: item.id,
            title: item.name,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            release_date: dateStr,
            media_type: 'tv',
            hypeScore: traktScore && traktScore > 0 ? traktScore : calculateHypeScore(item),
            releaseTag: generateReleaseTag(item, 'tv'),
            vote_average: item.vote_average,
            overview: item.overview,
            isRegional: true,
          });
        });
      });

      // Group by regional date
      const groupMap = new Map<string, ScheduleItem[]>();
      allItems.forEach((item) => {
        if (!groupMap.has(item.release_date)) {
          groupMap.set(item.release_date, []);
        }
        groupMap.get(item.release_date)!.push(item);
      });

      // Sort dates chronologically starting from startDate / today
      const sortedDates = Array.from(groupMap.keys())
        .filter((d) => d >= startDate)
        .sort();

      const result: DateGroupedSchedule[] = sortedDates.map((dateKey) => {
        const items = groupMap.get(dateKey)!;
        items.sort((a, b) => b.hypeScore - a.hypeScore);
        const header = parseDateHeader(dateKey, today);
        return {
          dateKey,
          dayName: header.dayName,
          dayNumber: header.dayNumber,
          monthName: header.monthName,
          isToday: header.isToday,
          items,
        };
      });

      scheduleCache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('Error fetching upcoming schedule:', err);
      return [];
    }
  },

  /**
   * Get Recently Released items grouped by Date (descending from Today)
   */
  getReleasedSchedule: async (
    mediaType: 'all' | 'movie' | 'tv' = 'all',
    region: string = 'IN'
  ): Promise<DateGroupedSchedule[]> => {
    const today = getLocalTodayString();
    const cacheKey = `released_${mediaType}_${region}_${today}`;
    if (scheduleCache.has(cacheKey)) return scheduleCache.get(cacheKey);

    const [currY, currM, currD] = today.split('-').map(Number);
    const past = new Date(currY, currM - 1, currD - 21);
    const pY = past.getFullYear();
    const pM = String(past.getMonth() + 1).padStart(2, '0');
    const pD = String(past.getDate()).padStart(2, '0');
    const startDate = `${pY}-${pM}-${pD}`;

    try {
      const moviePromises: Promise<any>[] = [];
      const tvPromises: Promise<any>[] = [];

      if (mediaType === 'all' || mediaType === 'movie') {
        moviePromises.push(
          tmdb.discover(
            'movie',
            `region=${region}&with_release_type=2|3&release_date.gte=${startDate}&release_date.lte=${today}&sort_by=release_date.desc,popularity.desc&page=1`
          )
        );
        moviePromises.push(
          tmdb.discover(
            'movie',
            `region=${region}&with_release_type=4&release_date.gte=${startDate}&release_date.lte=${today}&sort_by=release_date.desc,popularity.desc&page=1`
          )
        );
        moviePromises.push(
          tmdb.discover(
            'movie',
            `primary_release_date.gte=${startDate}&primary_release_date.lte=${today}&sort_by=primary_release_date.desc,popularity.desc&page=1`
          )
        );
      }

      if (mediaType === 'all' || mediaType === 'tv') {
        tvPromises.push(
          tmdb.discover(
            'tv',
            `air_date.gte=${startDate}&air_date.lte=${today}&sort_by=popularity.desc&page=1`
          )
        );
        tvPromises.push(
          tmdb.discover(
            'tv',
            `first_air_date.gte=${startDate}&first_air_date.lte=${today}&sort_by=first_air_date.desc,popularity.desc&page=1`
          )
        );
      }

      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises),
      ]);

      const rawMovies: any[] = [];
      movieResponses.forEach((res) => {
        (res?.results || []).forEach((m: any) => {
          if (m?.id && m.poster_path) rawMovies.push(m);
        });
      });

      const movieReleaseMap = await batchResolveRegionalReleases(rawMovies, region);
      const allItems: ScheduleItem[] = [];
      const seenIds = new Set<string>();

      rawMovies.forEach((item) => {
        const resolved = movieReleaseMap.get(item.id) || {
          release_date: (item.release_date || '').slice(0, 10),
          release_type: undefined,
          isRegional: false,
        };

        const dateStr = resolved.release_date || item.release_date?.slice(0, 10) || '';
        if (!dateStr || dateStr.length < 10) return;
        if (dateStr > today || dateStr < startDate) return;

        const uniqueKey = `movie_${item.id}_${dateStr}`;
        if (seenIds.has(uniqueKey)) return;
        seenIds.add(uniqueKey);

        allItems.push({
          id: item.id,
          title: item.title,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: dateStr,
          media_type: 'movie',
          hypeScore: calculateHypeScore(item),
          releaseTag: generateReleaseTag(
            { release_date: dateStr, release_type: resolved.release_type, media_type: 'movie' },
            'movie'
          ),
          vote_average: item.vote_average,
          overview: item.overview,
          release_type: resolved.release_type,
          isRegional: resolved.isRegional,
          note: resolved.note,
          certification: resolved.certification,
        });
      });

      tvResponses.forEach((res) => {
        (res?.results || []).forEach((item: any) => {
          if (!item.poster_path) return;
          const dateStr = (item.first_air_date || item.air_date || '').slice(0, 10);
          if (!dateStr || dateStr.length < 10) return;
          if (dateStr > today || dateStr < startDate) return;

          const uniqueKey = `tv_${item.id}_${dateStr}`;
          if (seenIds.has(uniqueKey)) return;
          seenIds.add(uniqueKey);

          allItems.push({
            id: item.id,
            title: item.name,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            release_date: dateStr,
            media_type: 'tv',
            hypeScore: calculateHypeScore(item),
            releaseTag: generateReleaseTag(item, 'tv'),
            vote_average: item.vote_average,
            overview: item.overview,
            isRegional: true,
          });
        });
      });

      const groupMap = new Map<string, ScheduleItem[]>();
      allItems.forEach((item) => {
        if (!groupMap.has(item.release_date)) {
          groupMap.set(item.release_date, []);
        }
        groupMap.get(item.release_date)!.push(item);
      });

      // Sort dates descending (today first, then yesterday, etc.)
      const sortedDates = Array.from(groupMap.keys())
        .filter((d) => d <= today)
        .sort((a, b) => b.localeCompare(a));

      const result: DateGroupedSchedule[] = sortedDates.map((dateKey) => {
        const items = groupMap.get(dateKey)!;
        items.sort((a, b) => b.hypeScore - a.hypeScore);
        const header = parseDateHeader(dateKey, today);
        return {
          dateKey,
          dayName: header.dayName,
          dayNumber: header.dayNumber,
          monthName: header.monthName,
          isToday: header.isToday,
          items,
        };
      });

      scheduleCache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('Error fetching released schedule:', err);
      return [];
    }
  },

  /**
   * Get Announced Releases (Future Big Budget & Anticipated)
   */
  getAnnouncedSchedule: async (
    year = 2026,
    mediaType: 'all' | 'movie' | 'tv' = 'all',
    region: string = 'IN'
  ): Promise<ScheduleItem[]> => {
    const cacheKey = `announced_${year}_${mediaType}_${region}`;
    if (scheduleCache.has(cacheKey)) return scheduleCache.get(cacheKey);

    try {
      const promises: Promise<any>[] = [];

      if (mediaType === 'all' || mediaType === 'movie') {
        promises.push(
          tmdb.discover(
            'movie',
            `region=${region}&with_release_type=2|3&primary_release_year=${year}&sort_by=popularity.desc&page=1`
          )
        );
        promises.push(
          tmdb.discover(
            'movie',
            `primary_release_year=${year}&sort_by=popularity.desc&page=1`
          )
        );
      }

      if (mediaType === 'all' || mediaType === 'tv') {
        promises.push(
          tmdb.discover(
            'tv',
            `first_air_date_year=${year}&sort_by=popularity.desc&page=1`
          )
        );
      }

      const responses = await Promise.all(promises);
      const rawMovies: any[] = [];
      const rawShows: any[] = [];
      const seenIds = new Set<string>();

      responses.forEach((res, index) => {
        const isTv = mediaType === 'tv' || (mediaType === 'all' && index === 2);
        (res?.results || []).forEach((item: any) => {
          if (!item.poster_path) return;
          const key = `${isTv ? 'tv' : 'movie'}_${item.id}`;
          if (seenIds.has(key)) return;
          seenIds.add(key);
          if (isTv) {
            rawShows.push(item);
          } else {
            rawMovies.push(item);
          }
        });
      });

      const movieReleaseMap = await batchResolveRegionalReleases(rawMovies, region);
      const allItems: ScheduleItem[] = [];

      rawMovies.forEach((item) => {
        const resolved = movieReleaseMap.get(item.id) || {
          release_date: (item.release_date || `${year}-01-01`).slice(0, 10),
          release_type: undefined,
          isRegional: false,
        };

        allItems.push({
          id: item.id,
          title: item.title,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: resolved.release_date || `${year}-01-01`,
          media_type: 'movie',
          hypeScore: calculateHypeScore(item),
          releaseTag: generateReleaseTag(
            { release_date: resolved.release_date, release_type: resolved.release_type, media_type: 'movie' },
            'movie'
          ),
          vote_average: item.vote_average,
          overview: item.overview,
          release_type: resolved.release_type,
          isRegional: resolved.isRegional,
          note: resolved.note,
          certification: resolved.certification,
        });
      });

      rawShows.forEach((item) => {
        allItems.push({
          id: item.id,
          title: item.name,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: item.first_air_date || `${year}-01-01`,
          media_type: 'tv',
          hypeScore: calculateHypeScore(item),
          releaseTag: generateReleaseTag(item, 'tv'),
          vote_average: item.vote_average,
          overview: item.overview,
          isRegional: true,
        });
      });

      // Sort by hype score
      allItems.sort((a, b) => b.hypeScore - a.hypeScore);
      scheduleCache.set(cacheKey, allItems);
      return allItems;
    } catch (err) {
      console.warn('Error fetching announced schedule:', err);
      return [];
    }
  },
};
