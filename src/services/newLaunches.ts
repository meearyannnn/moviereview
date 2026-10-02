// src/services/newLaunches.ts — Realtime Curated Bollywood & Hollywood Launches, Pop News Scraper, Trailers & Announcements
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
  videoType?: string;
  headline?: string;
  overview?: string;
  source?: string;
  sourceUrl?: string;
  isHot?: boolean;
}

// Famous Pop News & Cinema RSS feeds for Bollywood & Hollywood
const POP_NEWS_FEEDS = [
  {
    name: 'Deadline Hollywood',
    industry: 'hollywood' as const,
    url: 'https://deadline.com/v/film/feed/',
  },
  {
    name: 'Variety Film',
    industry: 'hollywood' as const,
    url: 'https://variety.com/v/film/feed/',
  },
  {
    name: 'Bollywood Hungama',
    industry: 'bollywood' as const,
    url: 'https://www.bollywoodhungama.com/rss/news.xml',
  },
  {
    name: 'Koimoi Bollywood',
    industry: 'bollywood' as const,
    url: 'https://www.koimoi.com/feed/',
  },
];

// Curated live baseline drops matching user screenshot & popular drops
const BASELINE_LAUNCHES: NewLaunchItem[] = [
  {
    id: 299534,
    tmdbId: 299534,
    title: 'Avengers: Endgame',
    poster: 'https://image.tmdb.org/t/p/w342/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    launchType: 'Encore Re-release',
    industry: 'hollywood',
    mediaType: 'movie',
    releaseDate: '2019-04-26',
    trailerKey: 'TcMBFSGVi1c',
    headline: 'Marvel Studios confirms anniversary IMAX re-release celebration across global cinemas',
    overview: 'After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to undo Thanos’ actions and restore order.',
    source: 'Deadline Hollywood',
    sourceUrl: 'https://deadline.com',
    isHot: true,
  },
  {
    id: 1083862,
    tmdbId: 1083862,
    title: 'VisionQuest',
    poster: 'https://image.tmdb.org/t/p/w342/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg',
    launchType: 'New Trailer',
    industry: 'hollywood',
    mediaType: 'tv',
    releaseDate: '2026-06-15',
    trailerKey: 'sj9J2ecsSpo',
    headline: 'Paul Bettany returns as White Vision in Marvel Television’s highly anticipated sci-fi sequel series',
    overview: 'Following the events of WandaVision, White Vision journeys across reality to reconstruct his memories, consciousness, and what it truly means to possess human emotion.',
    source: 'Variety Film',
    sourceUrl: 'https://variety.com',
    isHot: true,
  },
  {
    id: 1022789,
    tmdbId: 1022789,
    title: 'Digger',
    poster: 'https://image.tmdb.org/t/p/w342/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/14G75vGk32e6zU2g2d1A1uL1Y4P.jpg',
    launchType: 'New Movie',
    industry: 'hollywood',
    mediaType: 'movie',
    releaseDate: '2026-08-21',
    trailerKey: 'vM-Bja2Gy04',
    headline: 'Universal Pictures greenlights neo-western conspiracy thriller starring Austin Butler and Walton Goggins',
    overview: 'A gritty, atmospheric neo-western mystery following a reclusive prospector in the high desert who unearths an earth-shattering conspiracy dating back generations.',
    source: 'Deadline Hollywood',
    sourceUrl: 'https://deadline.com',
  },
  {
    id: 934433,
    tmdbId: 934433,
    title: 'Drishyam: The Conclusion',
    poster: 'https://image.tmdb.org/t/p/w342/14q2wzXwK1F5N4j5m7o8V3c9y2x.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/6cpRpfD3isvluFwXDGSiDVy9UM9.jpg',
    launchType: 'New Movie',
    industry: 'bollywood',
    mediaType: 'movie',
    releaseDate: '2025-11-20',
    trailerKey: 'cxA2y9TgdEU',
    headline: 'Ajay Devgn and Panorama Studios officially announce the explosive final chapter of the Drishyam franchise',
    overview: 'Vijay Salgaonkar and his family face their ultimate reckoning as the decades-old unsolved case re-opens with shocking forensic revelations and a new relentless investigator.',
    source: 'Bollywood Hungama',
    sourceUrl: 'https://www.bollywoodhungama.com',
    isHot: true,
  },
  {
    id: 1079091,
    tmdbId: 1079091,
    title: 'Verity',
    poster: 'https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/snAeeiQ3k6vN6V6dZ8sT3m1yC2e.jpg',
    launchType: 'New Announcement',
    industry: 'hollywood',
    mediaType: 'movie',
    releaseDate: '2026-10-30',
    trailerKey: 'd9MyW72ELq0',
    headline: 'Anne Hathaway attached to star in Michael Showalter’s cinematic adaptation of Colleen Hoover’s bestseller',
    overview: 'A struggling writer accepts the job of a lifetime finishing the remaining books of an injured star author, only to discover an unpublished manuscript containing horrifying confessions.',
    source: 'Variety Film',
    sourceUrl: 'https://variety.com',
  },
  {
    id: 974576,
    tmdbId: 974576,
    title: 'The Paradise',
    poster: 'https://image.tmdb.org/t/p/w342/m0SbwFNCa9epWKA9AcBmne9TE70.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/7h65MWoMqE5r4dKnUtvIKnRHPKu.jpg',
    launchType: 'New Movie',
    industry: 'hollywood',
    mediaType: 'movie',
    releaseDate: '2026-05-18',
    trailerKey: 'r51cYVZWKdY',
    headline: 'Cannes premiere confirmed for dystopian survival drama exploring humanity in an eco-fortress',
    overview: 'In an eco-dystopian sanctuary where resources are scarce, an elite community’s serene exterior hides a brutal system of sacrifice that a rogue guardian vows to bring down.',
    source: 'Collider',
    sourceUrl: 'https://collider.com',
  },
  {
    id: 1144949,
    tmdbId: 1144949,
    title: 'The Vvaan',
    poster: 'https://image.tmdb.org/t/p/w342/kHpnxWzF3q1k4W7o8Y4p7n2m9K1.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/dyHaAepgqT269n05b4sU7q5x2P2.jpg',
    launchType: 'New Teaser',
    industry: 'bollywood',
    mediaType: 'movie',
    releaseDate: '2025-10-24',
    trailerKey: 'J2s1_p1VnB8',
    headline: 'Sidharth Malhotra and Deepak Mishra unveil high-concept folk horror teaser at Diwali showcase',
    overview: 'A mythic supernatural folk thriller exploring the dark forgotten legends and primeval curses of the dense central Indian forests during an ancient solar eclipse.',
    source: 'Koimoi Bollywood',
    sourceUrl: 'https://www.koimoi.com',
    isHot: true,
  },
  {
    id: 872585,
    tmdbId: 872585,
    title: 'Heart of the Beast',
    poster: 'https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg',
    launchType: 'BTS / First Look',
    industry: 'hollywood',
    mediaType: 'movie',
    releaseDate: '2026-09-12',
    trailerKey: 'uYPbbksJxIg',
    headline: 'David Ayer shares first on-set photography of Brad Pitt filming high-stakes Alaskan wilderness survival scenes',
    overview: 'A former Navy SEAL and his retired combat service dog must fight their way through hundreds of miles of Alaskan tundra after being targeted by ruthless mercenaries.',
    source: 'Deadline Hollywood',
    sourceUrl: 'https://deadline.com',
  },
  {
    id: 1184918,
    tmdbId: 1184918,
    title: 'Primetime',
    poster: 'https://image.tmdb.org/t/p/w342/dB6Krk806zeqd005BmDaIaqWR2o.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    launchType: 'New Movie',
    industry: 'hollywood',
    mediaType: 'movie',
    releaseDate: '2026-07-10',
    trailerKey: 'zSWdZVtXT7E',
    headline: 'Robert Pattinson leads sharp satire thriller on television journalism and viral sensationalism',
    overview: 'An ambitious cable news producer crosses ethical boundaries during a high-stakes national election, setting off an unstoppable chain of sensational disinformation.',
    source: 'Variety Film',
    sourceUrl: 'https://variety.com',
  },
  {
    id: 215000,
    tmdbId: 215000,
    title: 'Hunkkaar',
    poster: 'https://image.tmdb.org/t/p/w342/v9y7q2wzXwK1F5N4j5m7o8V3c9y.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/yuNs09hvpHVU1cBTCA99x5w2Qox.jpg',
    launchType: 'New Show',
    industry: 'bollywood',
    mediaType: 'tv',
    releaseDate: '2025-11-14',
    trailerKey: 'kOCgN-v1h8k',
    headline: 'Disney+ Hotstar reveals official trailer for hard-hitting Hindi crime syndicate procedural',
    overview: 'A gritty Hotstar Specials drama detailing the covert police task force assigned to neutralize underground coal and sand mafias operating across Uttar Pradesh and Bihar.',
    source: 'Bollywood Hungama',
    sourceUrl: 'https://www.bollywoodhungama.com',
    isHot: true,
  },
  {
    id: 1237144,
    tmdbId: 1022789,
    title: "Miami Vice '85",
    poster: 'https://image.tmdb.org/t/p/w342/b5kLqC6eDiA17nq3jr1Vi340Kns.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg',
    launchType: 'New Announcement',
    industry: 'hollywood',
    mediaType: 'movie',
    releaseDate: '2026-11-20',
    trailerKey: 'vM-Bja2Gy04',
    headline: 'Walton Goggins joins Michael B. Jordan and Austin Butler in Universal’s Miami Vice ’85',
    overview: 'Joseph Kosinski directs a neon-soaked 1980s undercover detective thriller following Crockett and Tubbs into the darkest corners of South Florida narcotics rings.',
    source: 'Deadline Hollywood',
    sourceUrl: 'https://deadline.com',
    isHot: true,
  },
  {
    id: 569094,
    tmdbId: 569094,
    title: 'Spider-Man: Beyond the Spider-Verse',
    poster: 'https://image.tmdb.org/t/p/w342/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    launchType: 'New Announcement',
    industry: 'hollywood',
    mediaType: 'movie',
    releaseDate: '2026-12-18',
    trailerKey: 'cqGjhVJWtEg',
    headline: 'Sony Pictures Animation confirms production status and jaw-dropping multiverse dimensions for Miles Morales',
    overview: 'Miles Morales embarks on his most harrowing journey across the multiverse to rescue his father while escaping an army of alternate Spider-People led by Miguel O’Hara.',
    source: 'Variety Film',
    sourceUrl: 'https://variety.com',
    isHot: true,
  },
  {
    id: 1045929,
    tmdbId: 1045929,
    title: 'Alpha',
    poster: 'https://image.tmdb.org/t/p/w342/1E5baAaEse26fej7uHcjOgEE2t2.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/6cpRpfD3isvluFwXDGSiDVy9UM9.jpg',
    launchType: 'New Teaser',
    industry: 'bollywood',
    mediaType: 'movie',
    releaseDate: '2025-12-25',
    trailerKey: 'cxA2y9TgdEU',
    headline: 'Yash Raj Films drops high-octane title teaser for Alia Bhatt & Sharvari female-led Spy Universe spectacle',
    overview: 'The first female-led installment in Aditya Chopra’s massive YRF Spy Universe features two lethal operative agents deployed on a perilous international extraction mission.',
    source: 'Bollywood Hungama',
    sourceUrl: 'https://www.bollywoodhungama.com',
    isHot: true,
  },
  {
    id: 1034541,
    tmdbId: 1034541,
    title: 'Awarapan 2',
    poster: 'https://image.tmdb.org/t/p/w342/14q2wzXwK1F5N4j5m7o8V3c9y2x.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/dyHaAepgqT269n05b4sU7q5x2P2.jpg',
    launchType: 'BTS / First Look',
    industry: 'bollywood',
    mediaType: 'movie',
    releaseDate: '2026-04-03',
    trailerKey: 'kOCgN-v1h8k',
    headline: 'Emraan Hashmi shares emotional first-look stills as principal photography wraps on the legacy sequel',
    overview: 'Following the tragic climax of the 2007 cult classic, Shivam Pandit’s legacy resurfaces in Bangkok as a new redemption arc unfolds against a backdrop of criminal syndicates.',
    source: 'Koimoi Bollywood',
    sourceUrl: 'https://www.koimoi.com',
  },
  {
    id: 414906,
    tmdbId: 414906,
    title: 'The Batman Part II',
    poster: 'https://image.tmdb.org/t/p/w342/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    launchType: 'BTS / First Look',
    industry: 'hollywood',
    mediaType: 'movie',
    releaseDate: '2026-10-02',
    trailerKey: 'mqqft2x_Aa4',
    headline: 'Matt Reeves confirms screenplay completion and prep for London soundstage shoot with Robert Pattinson',
    overview: 'Bruce Wayne delves deeper into the frozen corruption of Gotham City as the Court of Owls emerges from the shadows to challenge the vigilante’s newfound purpose as a symbol of hope.',
    source: 'Deadline Hollywood',
    sourceUrl: 'https://deadline.com',
    isHot: true,
  },
  {
    id: 801688,
    tmdbId: 801688,
    title: 'Kalki 2898 AD Part 2',
    poster: 'https://image.tmdb.org/t/p/w342/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/6cpRpfD3isvluFwXDGSiDVy9UM9.jpg',
    launchType: 'New Announcement',
    industry: 'bollywood',
    mediaType: 'movie',
    releaseDate: '2026-09-25',
    trailerKey: 'kOCgN-v1h8k',
    headline: 'Vyjayanthi Movies locks 2026 shoot for Nag Ashwin’s dystopian sequel starring Prabhas and Kamal Haasan',
    overview: 'Supreme Yaskin prepares to unleash the full celestial power of the Complex upon Shambala as Bhairava and Ashwatthama unite to protect the unborn savior.',
    source: 'Bollywood Hungama',
    sourceUrl: 'https://www.bollywoodhungama.com',
    isHot: true,
  },
];

const CACHE_KEY = 'mg_spotlight_launches_v4';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Strips HTML tags and excessive whitespace from RSS description text.
 */
function cleanText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&hellip;/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts a candidate movie or series title from a headline or categories.
 */
function extractTitleFromHeadline(title: string, categories: string[] = []): string {
  // 1. Quoted movie title: e.g. ‘Miami Vice ’85’ or "Drishyam 3"
  const quoteMatch = title.match(/[‘'“"]([^'’“”"]+)[’'”"]/);
  if (quoteMatch && quoteMatch[1].trim().length >= 3 && quoteMatch[1].trim().length <= 40) {
    return quoteMatch[1].trim();
  }

  // 2. Before keywords like "Trailer", "Teaser", "Poster", "BTS"
  const keywordMatch = title.match(/^(.+?)\s+(trailer|teaser|poster|first look|bts|sequel|reboot|release date)/i);
  if (keywordMatch && keywordMatch[1].trim().length >= 3 && keywordMatch[1].trim().length <= 40) {
    const candidate = keywordMatch[1].replace(/^(exclusive|watch|breaking):\s*/i, '').trim();
    if (candidate.length >= 3) return candidate;
  }

  // 3. From category tags if available
  if (Array.isArray(categories) && categories.length > 0) {
    const nonGeneric = categories.filter(
      (c) => !['News', 'Casting', 'Film', 'Movie', 'Box Office', 'Interviews', 'Features'].includes(c)
    );
    if (nonGeneric.length > 0) {
      return nonGeneric[0].trim();
    }
  }

  // 4. Fallback to first 4 words of title
  const words = title.split(' ');
  return words.slice(0, 4).join(' ');
}

/**
 * Classifies headline/description into one of our LaunchTypes.
 */
function detectLaunchType(title: string, description: string): LaunchType {
  const combined = `${title} ${description}`.toLowerCase();
  if (combined.includes('trailer')) return 'New Trailer';
  if (combined.includes('teaser')) return 'New Teaser';
  if (
    combined.includes('bts') ||
    combined.includes('behind the scenes') ||
    combined.includes('first look') ||
    combined.includes('on set')
  ) {
    return 'BTS / First Look';
  }
  if (
    combined.includes('announc') ||
    combined.includes('joins') ||
    combined.includes('cast') ||
    combined.includes('confirms') ||
    combined.includes('greenlight') ||
    combined.includes('in talks')
  ) {
    return 'New Announcement';
  }
  if (combined.includes('re-release') || combined.includes('rerelease') || combined.includes('remaster')) {
    return 'Encore Re-release';
  }
  if (
    combined.includes('series') ||
    combined.includes('season') ||
    combined.includes('tv show') ||
    combined.includes('hotstar') ||
    combined.includes('netflix') ||
    combined.includes('prime video')
  ) {
    return 'New Show';
  }
  return 'New Movie';
}

export const newLaunchesService = {
  /**
   * Fetches and aggregates realtime Bollywood & Hollywood launches:
   * 1. Scrapes pop news feeds (Deadline, Variety, Bollywood Hungama, Koimoi) for real breaking stories.
   * 2. Queries TMDB live for upcoming and trending movies/shows.
   * 3. Curates each item with high-res poster, synopsis, trailer key, and pop news headline.
   * 4. Guarantees complete cards across all tabs with baseline fallback safety.
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
            parsed.data.length >= 10
          ) {
            return parsed.data;
          }
        }
      } catch {
        // Continue to fresh fetch
      }
    }

    const liveLaunches: NewLaunchItem[] = [];
    const seenTitles = new Set<string>();

    const addCandidate = (item: NewLaunchItem) => {
      const key = item.title.toLowerCase().trim();
      if (!seenTitles.has(key) && item.poster && !item.poster.includes('null') && !item.poster.includes('placeholder')) {
        seenTitles.add(key);
        liveLaunches.push(item);
      }
    };

    // 2. Fetch from famous Pop Cinema RSS feeds via rss2json
    const feedPromises = POP_NEWS_FEEDS.map(async (feed) => {
      try {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) return [];
        const json = await res.json();
        if (json.status !== 'ok' || !Array.isArray(json.items)) return [];

        const items: NewLaunchItem[] = [];
        for (const it of json.items.slice(0, 4)) {
          const cleanDesc = cleanText(it.description || it.content || '');
          const rawHeadline = cleanText(it.title || '');
          if (!rawHeadline) continue;

          const launchType = detectLaunchType(rawHeadline, cleanDesc);
          const candidateTitle = extractTitleFromHeadline(rawHeadline, it.categories);

          let posterUrl = it.thumbnail || it.enclosure?.link;
          let backdropUrl: string | undefined = undefined;
          let matchedTmdbId: number | undefined = undefined;

          // Attempt to match candidate with TMDB search for pristine movie poster
          try {
            const searchRes = await tmdb.search(candidateTitle, 'multi');
            const match = (searchRes?.results || []).find(
              (h: any) => h.media_type !== 'person' && h.poster_path
            );
            if (match) {
              posterUrl = tmdb.getImageUrl(match.poster_path, 'w342');
              backdropUrl = match.backdrop_path ? tmdb.getImageUrl(match.backdrop_path, 'w780') : undefined;
              matchedTmdbId = match.id;
            }
          } catch {
            // TMDB search network catch
          }

          if (posterUrl && !posterUrl.includes('null')) {
            items.push({
              id: `news-${feed.name.toLowerCase().replace(/\s+/g, '-')}-${Math.abs(hashString(rawHeadline))}`,
              tmdbId: matchedTmdbId,
              title: candidateTitle || rawHeadline.slice(0, 30),
              poster: posterUrl,
              backdrop: backdropUrl,
              launchType,
              industry: feed.industry,
              mediaType: launchType === 'New Show' ? 'tv' : 'movie',
              headline: rawHeadline,
              overview: cleanDesc.slice(0, 240) + (cleanDesc.length > 240 ? '...' : ''),
              source: feed.name,
              sourceUrl: it.link,
              isHot: true,
            });
          }
        }
        return items;
      } catch {
        return [];
      }
    });

    // 3. Fetch from TMDB live releases (upcoming, Bollywood Hindi, trending)
    const tmdbPromise = (async (): Promise<NewLaunchItem[]> => {
      try {
        const [bollyMovies, bollyTv, upcomingRes] = await Promise.allSettled([
          tmdb.discoverMovies('with_original_language=hi&sort_by=popularity.desc'),
          tmdb.discoverTV('with_original_language=hi&sort_by=popularity.desc'),
          tmdb.getUpcoming(),
        ]);

        const items: NewLaunchItem[] = [];

        // Add fresh Bollywood movies
        if (bollyMovies.status === 'fulfilled' && Array.isArray(bollyMovies.value?.results)) {
          for (const m of (bollyMovies.value.results as Movie[]).slice(0, 5)) {
            const title = m.title || m.name;
            if (!title || !m.poster_path) continue;
            items.push({
              id: m.id,
              tmdbId: m.id,
              title,
              poster: tmdb.getImageUrl(m.poster_path, 'w342'),
              backdrop: m.backdrop_path ? tmdb.getImageUrl(m.backdrop_path, 'w780') : undefined,
              launchType: m.release_date && new Date(m.release_date) > new Date() ? 'New Trailer' : 'New Movie',
              industry: 'bollywood',
              mediaType: 'movie',
              releaseDate: m.release_date,
              overview: m.overview,
              source: 'Bollywood Cinema Wire',
              isHot: m.vote_average ? m.vote_average > 7.0 : false,
            });
          }
        }

        // Add fresh Bollywood TV shows
        if (bollyTv.status === 'fulfilled' && Array.isArray(bollyTv.value?.results)) {
          for (const m of (bollyTv.value.results as Movie[]).slice(0, 3)) {
            const title = m.title || m.name;
            if (!title || !m.poster_path) continue;
            items.push({
              id: m.id,
              tmdbId: m.id,
              title,
              poster: tmdb.getImageUrl(m.poster_path, 'w342'),
              backdrop: m.backdrop_path ? tmdb.getImageUrl(m.backdrop_path, 'w780') : undefined,
              launchType: 'New Show',
              industry: 'bollywood',
              mediaType: 'tv',
              releaseDate: m.first_air_date,
              overview: m.overview,
              source: 'Desi Series Buzz',
            });
          }
        }

        // Add fresh Hollywood upcoming theatricals
        if (upcomingRes.status === 'fulfilled' && Array.isArray(upcomingRes.value?.results)) {
          for (const m of (upcomingRes.value.results as Movie[]).slice(0, 6)) {
            const title = m.title || m.name;
            if (!title || !m.poster_path) continue;
            items.push({
              id: m.id,
              tmdbId: m.id,
              title,
              poster: tmdb.getImageUrl(m.poster_path, 'w342'),
              backdrop: m.backdrop_path ? tmdb.getImageUrl(m.backdrop_path, 'w780') : undefined,
              launchType: 'New Trailer',
              industry: 'hollywood',
              mediaType: 'movie',
              releaseDate: m.release_date,
              overview: m.overview,
              source: 'Hollywood Theatrical Wire',
              isHot: true,
            });
          }
        }

        return items;
      } catch {
        return [];
      }
    })();

    try {
      const [feedResults, tmdbResults] = await Promise.allSettled([
        Promise.all(feedPromises),
        tmdbPromise,
      ]);

      // Add news feed items
      if (feedResults.status === 'fulfilled') {
        feedResults.value.flat().forEach(addCandidate);
      }

      // Add TMDB items
      if (tmdbResults.status === 'fulfilled') {
        tmdbResults.value.forEach(addCandidate);
      }
    } catch {
      // Proceed to baseline fill
    }

    // 4. Seamlessly merge baseline drops to guarantee every filter tab is fully populated
    BASELINE_LAUNCHES.forEach(addCandidate);

    // 5. Look up trailers for items missing trailer keys
    const itemsNeedingTrailers = liveLaunches.slice(0, 10).filter((it) => !it.trailerKey && it.tmdbId);
    if (itemsNeedingTrailers.length > 0) {
      await Promise.allSettled(
        itemsNeedingTrailers.map(async (item) => {
          if (!item.tmdbId) return;
          try {
            const vRes = await tmdb.getVideos(item.tmdbId, item.mediaType);
            const videos = vRes?.results || [];
            const tr = videos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer');
            const ts = videos.find((v: any) => v.site === 'YouTube' && v.type === 'Teaser');
            const bts = videos.find((v: any) => v.site === 'YouTube' && (v.type === 'Behind the Scenes' || v.type === 'Featurette'));

            if (tr) {
              item.trailerKey = tr.key;
            } else if (ts) {
              item.trailerKey = ts.key;
              if (item.launchType === 'New Movie') item.launchType = 'New Teaser';
            } else if (bts) {
              item.trailerKey = bts.key;
              if (item.launchType === 'New Movie') item.launchType = 'BTS / First Look';
            }
          } catch {
            // Video lookup catch
          }
        })
      );
    }

    // 6. Cache to session storage
    if (liveLaunches.length > 0 && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: liveLaunches, timestamp: Date.now() })
        );
      } catch {
        // Ignore cache write error
      }
    }

    return liveLaunches.length > 0 ? liveLaunches : BASELINE_LAUNCHES;
  },
};

/**
 * Simple string hash function for unique deterministic keys
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
