import { describe, it, expect } from 'vitest';
import {
  resolveRegionalRelease,
  generateReleaseTag,
  parseDateHeader,
  getLocalTodayString,
} from '../schedule';
import type { TMDBCountryReleaseDates } from '../tmdb';

describe('Schedule Release Date & Badge Resolution', () => {
  // 1. Verity Test Case: IN theatrical release is 2026-10-02 (type 3)
  it('correctly resolves Verity to 2026-10-02 (IN theatrical, In Theatre badge)', () => {
    const verityFixture: { results: TMDBCountryReleaseDates[] } = {
      results: [
        {
          iso_3166_1: 'FR',
          release_dates: [
            {
              certification: '',
              note: 'Grand Rex Paris',
              release_date: '2026-09-21T00:00:00.000Z',
              type: 1, // Premiere (must be ignored)
            },
            {
              certification: 'TP',
              release_date: '2026-09-30T00:00:00.000Z',
              type: 3,
            },
          ],
        },
        {
          iso_3166_1: 'US',
          release_dates: [
            {
              certification: 'R',
              note: 'Lincoln Square',
              release_date: '2026-09-29T00:00:00.000Z',
              type: 1, // Premiere
            },
            {
              certification: 'R',
              release_date: '2026-10-02T00:00:00.000Z',
              type: 3,
            },
          ],
        },
        {
          iso_3166_1: 'IN',
          release_dates: [
            {
              certification: 'UA 16+',
              release_date: '2026-10-02T00:00:00.000Z',
              type: 3, // Theatrical in India
            },
          ],
        },
      ],
    };

    const resolved = resolveRegionalRelease(verityFixture, '2026-09-30', 'IN');

    // Expected: India theatrical release date is Oct 2, 2026, type 3, regional
    expect(resolved.release_date).toBe('2026-10-02');
    expect(resolved.release_type).toBe(3);
    expect(resolved.isRegional).toBe(true);

    const tag = generateReleaseTag({
      release_date: resolved.release_date,
      release_type: resolved.release_type,
      media_type: 'movie',
    });
    expect(tag).toBe('In Theatre • 2026');
  });

  // 2. Linkin Park: Unshatter Test Case: theatrical release 2026-09-30 (type 2), not OTT
  it('correctly resolves Linkin Park: Unshatter to 2026-09-30 (theatrical, not OTT)', () => {
    const unshatterFixture: { results: TMDBCountryReleaseDates[] } = {
      results: [
        {
          iso_3166_1: 'US',
          release_dates: [
            {
              certification: '',
              note: 'AMC The Grove 14 Premiere',
              release_date: '2026-09-24T00:00:00.000Z',
              type: 1, // Premiere (must be ignored for calendar placement)
            },
            {
              certification: 'NR',
              release_date: '2026-09-30T00:00:00.000Z',
              type: 2, // Theatrical limited
            },
          ],
        },
        {
          iso_3166_1: 'DE',
          release_dates: [
            {
              certification: '12',
              release_date: '2026-09-30T00:00:00.000Z',
              type: 2,
            },
          ],
        },
        {
          iso_3166_1: 'GB',
          release_dates: [
            {
              certification: '15',
              release_date: '2026-09-30T00:00:00.000Z',
              type: 2,
            },
          ],
        },
      ],
    };

    // Region is 'IN' which has no entry; should fall back to earliest global type 2/3 (2026-09-30)
    const resolved = resolveRegionalRelease(unshatterFixture, '2026-09-30', 'IN');

    expect(resolved.release_date).toBe('2026-09-30');
    expect(resolved.release_type).toBe(2); // Theatrical limited
    expect(resolved.isRegional).toBe(false); // Global fallback
    expect(resolved.note).toBe('Date may differ in your region');

    const tag = generateReleaseTag({
      release_date: resolved.release_date,
      release_type: resolved.release_type,
      media_type: 'movie',
    });
    // Crucial requirement: Theatrical type 2 must be labeled "In Theatre", NEVER "OTT Release"
    expect(tag).toBe('In Theatre • 2026');
    expect(tag).not.toContain('OTT');
  });

  // 3. Release badge derivation rules
  describe('generateReleaseTag', () => {
    it('labels type 2 and type 3 as In Theatre', () => {
      expect(generateReleaseTag({ release_date: '2026-10-02', release_type: 3, media_type: 'movie' })).toBe('In Theatre • 2026');
      expect(generateReleaseTag({ release_date: '2026-09-30', release_type: 2, media_type: 'movie' })).toBe('In Theatre • 2026');
    });

    it('labels type 4 as OTT Release', () => {
      expect(generateReleaseTag({ release_date: '2026-11-15', release_type: 4, media_type: 'movie' })).toBe('OTT Release • 2026');
    });

    it('labels type 6 as TV', () => {
      expect(generateReleaseTag({ release_date: '2026-12-01', release_type: 6, media_type: 'movie' })).toBe('TV • 2026');
    });

    it('never defaults to OTT when release type is missing or unknown', () => {
      const tagNoType = generateReleaseTag({ release_date: '2026-10-10', release_type: undefined, media_type: 'movie' });
      expect(tagNoType).toBe('Release • 2026');
      expect(tagNoType).not.toContain('OTT');
    });

    it('labels TV shows appropriately without inferring OTT from genre', () => {
      expect(generateReleaseTag({ first_air_date: '2026-04-10', media_type: 'tv' }, 'tv')).toBe('New Show • 2026');
      expect(generateReleaseTag({ first_air_date: '2024-04-10', release_date: '2026-04-10', media_type: 'tv' }, 'tv')).toBe('New Season • 2026');
    });
  });

  // 4. Timezone & Today marker accuracy
  describe('Timezone & Date Header Parsing', () => {
    it('compares today as exact YYYY-MM-DD strings without UTC off-by-one shifting', () => {
      const todayStr = '2026-10-01';

      // On Oct 1, Sep 30 is NOT today
      const headerSep30 = parseDateHeader('2026-09-30', todayStr);
      expect(headerSep30.isToday).toBe(false);
      expect(headerSep30.dayNumber).toBe('30');
      expect(headerSep30.monthName).toBe('SEP');

      // Oct 1 is today
      const headerOct01 = parseDateHeader('2026-10-01', todayStr);
      expect(headerOct01.isToday).toBe(true);
      expect(headerOct01.dayNumber).toBe('01');
      expect(headerOct01.monthName).toBe('OCT');

      // Oct 2 is not today
      const headerOct02 = parseDateHeader('2026-10-02', todayStr);
      expect(headerOct02.isToday).toBe(false);
      expect(headerOct02.dayNumber).toBe('02');
      expect(headerOct02.monthName).toBe('OCT');
    });

    it('formats local today string correctly for Asia/Kolkata', () => {
      const today = getLocalTodayString('Asia/Kolkata');
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
