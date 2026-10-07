// src/services/curatedShelves.ts
// Dynamic Curated Shelves with 6-Hour Automated Rotation Engine
import { tmdb, type Movie } from './tmdb';

export interface CuratedShelfItem {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  media_type: 'movie' | 'tv';
  release_date?: string;
  year?: string | number;
  customSubtitle?: string;
  vote_average?: number;
}

export interface CuratedShelfConfig {
  id: string;
  title: string;
  logoSrc?: string;
  iconEmoji?: string;
  items: CuratedShelfItem[];
}

export interface SixHourSlotInfo {
  epoch: number;
  slotIndex: number; // 0: 00:00-06:00, 1: 06:00-12:00, 2: 12:00-18:00, 3: 18:00-24:00
  slotName: string;
  nextRotationMs: number;
  formattedSlotRange: string;
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export function get6HourSlotInfo(timestamp = Date.now()): SixHourSlotInfo {
  const epoch = Math.floor(timestamp / SIX_HOURS_MS);
  const date = new Date(timestamp);
  const slotIndex = Math.floor(date.getHours() / 6);
  const slotNames = [
    'Midnight Vault & Late Night Picks',
    'Morning Drop & Fresh Cinema',
    'Afternoon Matinee & Binge Radar',
    'Prime-Time & Evening Watchparty',
  ];
  const ranges = ['00:00 – 06:00', '06:00 – 12:00', '12:00 – 18:00', '18:00 – 24:00'];
  return {
    epoch,
    slotIndex,
    slotName: slotNames[slotIndex],
    nextRotationMs: (epoch + 1) * SIX_HOURS_MS,
    formattedSlotRange: ranges[slotIndex],
  };
}

// Pseudo-random deterministic seeded number generator
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Deterministically permute/rotate array based on 6-hour epoch & shelf salt
function rotatePoolBySlot<T>(items: T[], epoch: number, salt: number): T[] {
  if (!items || items.length === 0) return [];
  const copy = [...items];
  const offset = (epoch * 7 + salt) % copy.length;
  // Rotate by offset
  const rotated = [...copy.slice(offset), ...copy.slice(0, offset)];

  // Deterministically shuffle slightly while preserving high relevance
  for (let i = rotated.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(epoch * 101 + salt + i) * (i + 1));
    [rotated[i], rotated[j]] = [rotated[j], rotated[i]];
  }
  return rotated;
}

// In-session slot caching to prevent repeated TMDB queries within the same 6-hour period
function getCachedShelf(key: string, epoch: number): CuratedShelfItem[] | null {
  try {
    const raw = sessionStorage.getItem(`mg_shelf_${key}_slot_${epoch}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

function setCachedShelf(key: string, epoch: number, data: CuratedShelfItem[]) {
  try {
    sessionStorage.setItem(`mg_shelf_${key}_slot_${epoch}`, JSON.stringify(data));
  } catch {}
}

function formatItemSubtitle(item: any, defaultType: 'movie' | 'tv'): string {
  const typeStr = (item.media_type || defaultType) === 'tv' ? 'Show' : 'Movie';
  const rawDate = item.release_date || item.first_air_date || '';
  const year = rawDate ? new Date(rawDate).getFullYear() : '';
  return year && !isNaN(year) ? `${typeStr} • ${year}` : typeStr;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rich Curated Pools (Rotating every 6 hours across distinct cinema vibes)
// ─────────────────────────────────────────────────────────────────────────────

const DISTRICT_CURATED_POOLS: CuratedShelfItem[][] = [
  // Slot 0: Late Night Pan-India Action & High Voltage
  [
    { id: 1475799, title: 'Haiwaan', poster_path: '/ykXYDPPvoPhTaBeQ90OibCaCOWX.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1378537, title: 'Mirzapur: The Movie', poster_path: '/cdDKdCRyq6BYuNblpKUYqRPWvEg.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1213243, title: 'Toxic: A Fairy Tale for Grown-ups', poster_path: '/oiIPU4lvnI0Ag2K9cyAi44eCaoE.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1101412, title: 'Fall 2: Deadpoint', poster_path: '/fgSm5ylwiXbIHn8UbUXDjk9RRu4.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1250502, title: "I'm Game", poster_path: '/h1ezPKcMYv5FHbHDuHcZfTbWTY5.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1284046, title: 'Onslaught', poster_path: '/cOGtvhc6Ij9KvzM6jZsfQyg0B0O.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
  ],
  // Slot 1: Edge-of-Seat Thrillers & Survival Sensation
  [
    { id: 1101412, title: 'Fall 2: Deadpoint', poster_path: '/fgSm5ylwiXbIHn8UbUXDjk9RRu4.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1284046, title: 'Onslaught', poster_path: '/cOGtvhc6Ij9KvzM6jZsfQyg0B0O.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1475799, title: 'Haiwaan', poster_path: '/ykXYDPPvoPhTaBeQ90OibCaCOWX.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 977942, title: 'The Uprising', poster_path: '/7TUl15TOsIvndKlgMWTtLgtEzZP.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1381071, title: 'Godzilla Minus Zero', poster_path: '/hSmIJluOJmTWvJs4d7kHRxjc8s8.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1250502, title: "I'm Game", poster_path: '/h1ezPKcMYv5FHbHDuHcZfTbWTY5.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
  ],
  // Slot 2: Mind-Benders, Indie Discoveries & Fan Obsessions
  [
    { id: 1213243, title: 'Toxic: A Fairy Tale for Grown-ups', poster_path: '/oiIPU4lvnI0Ag2K9cyAi44eCaoE.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1400940, title: 'Clayface', poster_path: '/5jCpQnWPikggmQZoDp1eAi6BI6w.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1378537, title: 'Mirzapur: The Movie', poster_path: '/cdDKdCRyq6BYuNblpKUYqRPWvEg.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 656908, title: 'Ramayana: Part One', poster_path: '/f3yZZw7zIsWo6m9xJStfjDauIZX.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 249863, title: 'The Revolutionaries', poster_path: '/7oikzZ6QgHsTjZ2JqkmKH1NRS9A.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 1475799, title: 'Haiwaan', poster_path: '/ykXYDPPvoPhTaBeQ90OibCaCOWX.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
  ],
  // Slot 3: Epic Franchise Titans & Prime-Time Blockbusters
  [
    { id: 1381071, title: 'Godzilla Minus Zero', poster_path: '/hSmIJluOJmTWvJs4d7kHRxjc8s8.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 656908, title: 'Ramayana: Part One', poster_path: '/f3yZZw7zIsWo6m9xJStfjDauIZX.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1378537, title: 'Mirzapur: The Movie', poster_path: '/cdDKdCRyq6BYuNblpKUYqRPWvEg.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1250502, title: "I'm Game", poster_path: '/h1ezPKcMYv5FHbHDuHcZfTbWTY5.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1213243, title: 'Toxic: A Fairy Tale for Grown-ups', poster_path: '/oiIPU4lvnI0Ag2K9cyAi44eCaoE.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 1101412, title: 'Fall 2: Deadpoint', poster_path: '/fgSm5ylwiXbIHn8UbUXDjk9RRu4.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
  ],
];

const NETFLIX_CURATED_POOLS: CuratedShelfItem[][] = [
  // Slot 0: Dark Thrillers & Gripping Drama
  [
    { id: 244244, title: 'Run Away', poster_path: '/frKxKytEHIA2vXg4RAz14Sc0UmS.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 69557, title: 'Fauda', poster_path: '/bc6XIKP1TrnugYMzIIUz9YCL8VM.jpg', media_type: 'tv', year: '2015', customSubtitle: 'Show • 2015' },
    { id: 1227136, title: 'Bhakshak', poster_path: '/2eCELoyf0l3njFKfn3oddo3JaRG.jpg', media_type: 'movie', year: '2024', customSubtitle: 'Movie • 2024' },
    { id: 153217, title: 'Sparks of Tomorrow', poster_path: '/yDTcX4l5D3OFeYGsQVI5Jqxx1D7.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 1466115, title: 'Even If This Love Disappears Tonight', poster_path: '/5eNN8KLDPUXDqIkTdCbmn1gx5P7.jpg', media_type: 'movie', year: '2025', customSubtitle: 'Movie • 2025' },
  ],
  // Slot 1: High Energy, Action & Asian Sensation
  [
    { id: 153217, title: 'Sparks of Tomorrow', poster_path: '/yDTcX4l5D3OFeYGsQVI5Jqxx1D7.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 1466115, title: 'Even If This Love Disappears Tonight', poster_path: '/5eNN8KLDPUXDqIkTdCbmn1gx5P7.jpg', media_type: 'movie', year: '2025', customSubtitle: 'Movie • 2025' },
    { id: 244244, title: 'Run Away', poster_path: '/frKxKytEHIA2vXg4RAz14Sc0UmS.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 1227136, title: 'Bhakshak', poster_path: '/2eCELoyf0l3njFKfn3oddo3JaRG.jpg', media_type: 'movie', year: '2024', customSubtitle: 'Movie • 2024' },
    { id: 69557, title: 'Fauda', poster_path: '/bc6XIKP1TrnugYMzIIUz9YCL8VM.jpg', media_type: 'tv', year: '2015', customSubtitle: 'Show • 2015' },
  ],
  // Slot 2: Impactful Cinema & Groundbreaking Originals
  [
    { id: 1227136, title: 'Bhakshak', poster_path: '/2eCELoyf0l3njFKfn3oddo3JaRG.jpg', media_type: 'movie', year: '2024', customSubtitle: 'Movie • 2024' },
    { id: 244244, title: 'Run Away', poster_path: '/frKxKytEHIA2vXg4RAz14Sc0UmS.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 69557, title: 'Fauda', poster_path: '/bc6XIKP1TrnugYMzIIUz9YCL8VM.jpg', media_type: 'tv', year: '2015', customSubtitle: 'Show • 2015' },
    { id: 1466115, title: 'Even If This Love Disappears Tonight', poster_path: '/5eNN8KLDPUXDqIkTdCbmn1gx5P7.jpg', media_type: 'movie', year: '2025', customSubtitle: 'Movie • 2025' },
    { id: 153217, title: 'Sparks of Tomorrow', poster_path: '/yDTcX4l5D3OFeYGsQVI5Jqxx1D7.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
  ],
  // Slot 3: Prime-Time Global Hits & Binge Favorites
  [
    { id: 69557, title: 'Fauda', poster_path: '/bc6XIKP1TrnugYMzIIUz9YCL8VM.jpg', media_type: 'tv', year: '2015', customSubtitle: 'Show • 2015' },
    { id: 1466115, title: 'Even If This Love Disappears Tonight', poster_path: '/5eNN8KLDPUXDqIkTdCbmn1gx5P7.jpg', media_type: 'movie', year: '2025', customSubtitle: 'Movie • 2025' },
    { id: 244244, title: 'Run Away', poster_path: '/frKxKytEHIA2vXg4RAz14Sc0UmS.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 153217, title: 'Sparks of Tomorrow', poster_path: '/yDTcX4l5D3OFeYGsQVI5Jqxx1D7.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 1227136, title: 'Bhakshak', poster_path: '/2eCELoyf0l3njFKfn3oddo3JaRG.jpg', media_type: 'movie', year: '2024', customSubtitle: 'Movie • 2024' },
  ],
];

const JIOHOTSTAR_CURATED_POOLS: CuratedShelfItem[][] = [
  // Slot 0: Supernatural, Mystery & Drama
  [
    { id: 131142, title: 'Love Story', poster_path: '/qp67ixTkVd4MEhMZhGorFoOXRxl.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 226529, title: 'Light Shop', poster_path: '/iRgH73xibpeNZ8zzPDkIpxuoKgC.jpg', media_type: 'tv', year: '2024', customSubtitle: 'Show • 2024' },
    { id: 1119269, title: 'Good Luck', poster_path: '/4ftway1721hCR4t8HrvFfQzWtRJ.jpg', media_type: 'movie', year: '2024', customSubtitle: 'Movie • 2024' },
    { id: 1122099, title: 'The Ballad of Wallis Island', poster_path: '/haS6bnqDqZoi5sYcCPJWaj2yMbB.jpg', media_type: 'movie', year: '2025', customSubtitle: 'Movie • 2025' },
  ],
  // Slot 1: Atmospheric Asian Mystery & Acclaimed Drama
  [
    { id: 226529, title: 'Light Shop', poster_path: '/iRgH73xibpeNZ8zzPDkIpxuoKgC.jpg', media_type: 'tv', year: '2024', customSubtitle: 'Show • 2024' },
    { id: 1122099, title: 'The Ballad of Wallis Island', poster_path: '/haS6bnqDqZoi5sYcCPJWaj2yMbB.jpg', media_type: 'movie', year: '2025', customSubtitle: 'Movie • 2025' },
    { id: 131142, title: 'Love Story', poster_path: '/qp67ixTkVd4MEhMZhGorFoOXRxl.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 1119269, title: 'Good Luck', poster_path: '/4ftway1721hCR4t8HrvFfQzWtRJ.jpg', media_type: 'movie', year: '2024', customSubtitle: 'Movie • 2024' },
  ],
  // Slot 2: Critically Acclaimed Cinema & Masterpieces
  [
    { id: 1119269, title: 'Good Luck', poster_path: '/4ftway1721hCR4t8HrvFfQzWtRJ.jpg', media_type: 'movie', year: '2024', customSubtitle: 'Movie • 2024' },
    { id: 131142, title: 'Love Story', poster_path: '/qp67ixTkVd4MEhMZhGorFoOXRxl.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 1122099, title: 'The Ballad of Wallis Island', poster_path: '/haS6bnqDqZoi5sYcCPJWaj2yMbB.jpg', media_type: 'movie', year: '2025', customSubtitle: 'Movie • 2025' },
    { id: 226529, title: 'Light Shop', poster_path: '/iRgH73xibpeNZ8zzPDkIpxuoKgC.jpg', media_type: 'tv', year: '2024', customSubtitle: 'Show • 2024' },
  ],
  // Slot 3: Evening Prime-Time Highlights
  [
    { id: 1122099, title: 'The Ballad of Wallis Island', poster_path: '/haS6bnqDqZoi5sYcCPJWaj2yMbB.jpg', media_type: 'movie', year: '2025', customSubtitle: 'Movie • 2025' },
    { id: 226529, title: 'Light Shop', poster_path: '/iRgH73xibpeNZ8zzPDkIpxuoKgC.jpg', media_type: 'tv', year: '2024', customSubtitle: 'Show • 2024' },
    { id: 1119269, title: 'Good Luck', poster_path: '/4ftway1721hCR4t8HrvFfQzWtRJ.jpg', media_type: 'movie', year: '2024', customSubtitle: 'Movie • 2024' },
    { id: 131142, title: 'Love Story', poster_path: '/qp67ixTkVd4MEhMZhGorFoOXRxl.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
  ],
];

const PRIME_CURATED_POOLS: CuratedShelfItem[][] = [
  // Slot 0: Hard-Hitting Action & Thrillers
  [
    { id: 108978, title: 'Reacher', poster_path: '/f1VCQIG2iCyOookdgOzwtUpwWC0.jpg', media_type: 'tv', year: '2022', customSubtitle: 'Show • 2022' },
    { id: 858067, title: 'Thiruchitrambalam', poster_path: '/pBRkO5GHJqDB9D0fbumL5235JfJ.jpg', media_type: 'movie', year: '2022', customSubtitle: 'Movie • 2022' },
    { id: 249863, title: 'The Revolutionaries', poster_path: '/7oikzZ6QgHsTjZ2JqkmKH1NRS9A.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 1699574, title: 'Deool Band 2', poster_path: '/89n9cfc5dm0kdkABmDJalzveEwU.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 610150, title: 'Dragon Ball Super: Super Hero', poster_path: '/pi0iZOEHeA3ih4p1IwAG4x2DZNH.jpg', media_type: 'movie', year: '2022', customSubtitle: 'Movie • 2022' },
  ],
  // Slot 1: Heartwarming Regional Masterpieces
  [
    { id: 858067, title: 'Thiruchitrambalam', poster_path: '/pBRkO5GHJqDB9D0fbumL5235JfJ.jpg', media_type: 'movie', year: '2022', customSubtitle: 'Movie • 2022' },
    { id: 1699574, title: 'Deool Band 2', poster_path: '/89n9cfc5dm0kdkABmDJalzveEwU.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 108978, title: 'Reacher', poster_path: '/f1VCQIG2iCyOookdgOzwtUpwWC0.jpg', media_type: 'tv', year: '2022', customSubtitle: 'Show • 2022' },
    { id: 610150, title: 'Dragon Ball Super: Super Hero', poster_path: '/pi0iZOEHeA3ih4p1IwAG4x2DZNH.jpg', media_type: 'movie', year: '2022', customSubtitle: 'Movie • 2022' },
    { id: 249863, title: 'The Revolutionaries', poster_path: '/7oikzZ6QgHsTjZ2JqkmKH1NRS9A.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
  ],
  // Slot 2: Fan-Favorite Global Action & Anime
  [
    { id: 610150, title: 'Dragon Ball Super: Super Hero', poster_path: '/pi0iZOEHeA3ih4p1IwAG4x2DZNH.jpg', media_type: 'movie', year: '2022', customSubtitle: 'Movie • 2022' },
    { id: 249863, title: 'The Revolutionaries', poster_path: '/7oikzZ6QgHsTjZ2JqkmKH1NRS9A.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 108978, title: 'Reacher', poster_path: '/f1VCQIG2iCyOookdgOzwtUpwWC0.jpg', media_type: 'tv', year: '2022', customSubtitle: 'Show • 2022' },
    { id: 858067, title: 'Thiruchitrambalam', poster_path: '/pBRkO5GHJqDB9D0fbumL5235JfJ.jpg', media_type: 'movie', year: '2022', customSubtitle: 'Movie • 2022' },
    { id: 1699574, title: 'Deool Band 2', poster_path: '/89n9cfc5dm0kdkABmDJalzveEwU.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
  ],
  // Slot 3: Big Screen Blockbusters & Epic Series
  [
    { id: 249863, title: 'The Revolutionaries', poster_path: '/7oikzZ6QgHsTjZ2JqkmKH1NRS9A.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Show • 2026' },
    { id: 108978, title: 'Reacher', poster_path: '/f1VCQIG2iCyOookdgOzwtUpwWC0.jpg', media_type: 'tv', year: '2022', customSubtitle: 'Show • 2022' },
    { id: 1699574, title: 'Deool Band 2', poster_path: '/89n9cfc5dm0kdkABmDJalzveEwU.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Movie • 2026' },
    { id: 858067, title: 'Thiruchitrambalam', poster_path: '/pBRkO5GHJqDB9D0fbumL5235JfJ.jpg', media_type: 'movie', year: '2022', customSubtitle: 'Movie • 2022' },
    { id: 610150, title: 'Dragon Ball Super: Super Hero', poster_path: '/pi0iZOEHeA3ih4p1IwAG4x2DZNH.jpg', media_type: 'movie', year: '2022', customSubtitle: 'Movie • 2022' },
  ],
];

const TALK_OF_TOWN_BASE: CuratedShelfItem[] = [
  { id: 1475799, title: 'Haiwaan', poster_path: '/ykXYDPPvoPhTaBeQ90OibCaCOWX.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Trending Movie' },
  { id: 95350, title: 'Lanterns', poster_path: '/gpC7h43xPMEV3goYMQShfJbTtLq.jpg', media_type: 'tv', year: '2026', customSubtitle: 'Season 1 Episode 5' },
  { id: 656908, title: 'Ramayana: Part One', poster_path: '/f3yZZw7zIsWo6m9xJStfjDauIZX.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Featured Poster' },
  { id: 1378537, title: 'Mirzapur: The Movie', poster_path: '/cdDKdCRyq6BYuNblpKUYqRPWvEg.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Hot Anticipation' },
  { id: 249863, title: 'The Revolutionaries', poster_path: '/7oikzZ6QgHsTjZ2JqkmKH1NRS9A.jpg', media_type: 'tv', year: '2026', customSubtitle: 'New Show' },
  { id: 1400940, title: 'Clayface', poster_path: '/5jCpQnWPikggmQZoDp1eAi6BI6w.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Trending Movie' },
  { id: 1381071, title: 'Godzilla Minus Zero', poster_path: '/hSmIJluOJmTWvJs4d7kHRxjc8s8.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Trending Movie' },
  { id: 213562, title: 'Crystal Lake', poster_path: '/3ENhExiD2fcjk5FX0AcAXcvLu9N.jpg', media_type: 'tv', year: '2026', customSubtitle: 'New Show' },
  { id: 1101412, title: 'Fall 2: Deadpoint', poster_path: '/fgSm5ylwiXbIHn8UbUXDjk9RRu4.jpg', media_type: 'movie', year: '2026', customSubtitle: 'Trending Movie' },
];

export const curatedShelvesService = {
  getSlotInfo: get6HourSlotInfo,

  /**
   * 1. Trending Worldwide / Talk Of The Town (Rotates dynamically every 6 hours)
   */
  getTalkOfTheTown: async (): Promise<CuratedShelfItem[]> => {
    const { epoch, slotIndex } = get6HourSlotInfo();
    const cached = getCachedShelf('talkOfTheTown', epoch);
    if (cached) return cached;

    try {
      const timeWindow = slotIndex % 2 === 0 ? 'day' : 'week';
      const live = await tmdb.getTrending('all', timeWindow as 'day' | 'week');
      const liveItems: CuratedShelfItem[] = (live.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 14)
        .map((x: any) => {
          const rawDate = x.release_date || x.first_air_date || '';
          const yr = rawDate ? new Date(rawDate).getFullYear() : '';
          const mType = (x.media_type || (x.first_air_date ? 'tv' : 'movie')) as 'movie' | 'tv';
          return {
            id: x.id,
            title: x.title || x.name || 'Untitled',
            poster_path: x.poster_path,
            backdrop_path: x.backdrop_path,
            media_type: mType,
            year: yr,
            customSubtitle: `${mType === 'tv' ? 'Show' : 'Movie'} • ${yr || '2026'}`,
            vote_average: x.vote_average,
          };
        });

      const rotatedCurated = rotatePoolBySlot(TALK_OF_TOWN_BASE, epoch, 11);
      const seenIds = new Set(rotatedCurated.map((i) => i.id));
      const filteredLive = liveItems.filter((i) => !seenIds.has(i.id));

      // Interleave curated highlights with fresh live trending
      const combined = [...rotatedCurated.slice(0, 4), ...filteredLive.slice(0, 8), ...rotatedCurated.slice(4)];
      setCachedShelf('talkOfTheTown', epoch, combined);
      return combined;
    } catch {
      return rotatePoolBySlot(TALK_OF_TOWN_BASE, epoch, 11);
    }
  },

  /**
   * 2. Worth Watching on Prime (Rotates dynamically every 6 hours)
   */
  getPrimeWorthWatching: async (): Promise<CuratedShelfItem[]> => {
    const { epoch, slotIndex } = get6HourSlotInfo();
    const cached = getCachedShelf('prime', epoch);
    if (cached) return cached;

    const curatedPool = PRIME_CURATED_POOLS[slotIndex % PRIME_CURATED_POOLS.length];
    const rotatedCurated = rotatePoolBySlot(curatedPool, epoch, 23);

    try {
      const page = (slotIndex % 3) + 1;
      const [tvRes, movieRes] = await Promise.all([
        tmdb.discover('tv', `with_networks=1024&sort_by=popularity.desc&page=${page}`),
        tmdb.discover('movie', `with_watch_providers=9|119&watch_region=US&sort_by=popularity.desc&page=${page}`),
      ]);

      const liveShows: CuratedShelfItem[] = (tvRes.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.name || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'tv' as const,
          customSubtitle: formatItemSubtitle(x, 'tv'),
          vote_average: x.vote_average,
        }));

      const liveMovies: CuratedShelfItem[] = (movieRes.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.title || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'movie' as const,
          customSubtitle: formatItemSubtitle(x, 'movie'),
          vote_average: x.vote_average,
        }));

      const seenIds = new Set(rotatedCurated.map((i) => i.id));
      const moreItems = [...liveShows, ...liveMovies].filter((i) => !seenIds.has(i.id));
      const combined = [...rotatedCurated, ...moreItems];
      setCachedShelf('prime', epoch, combined);
      return combined;
    } catch {
      return rotatedCurated;
    }
  },

  /**
   * 3. Don't Miss These on Netflix (Rotates dynamically every 6 hours)
   */
  getNetflixDontMiss: async (): Promise<CuratedShelfItem[]> => {
    const { epoch, slotIndex } = get6HourSlotInfo();
    const cached = getCachedShelf('netflix', epoch);
    if (cached) return cached;

    const curatedPool = NETFLIX_CURATED_POOLS[slotIndex % NETFLIX_CURATED_POOLS.length];
    const rotatedCurated = rotatePoolBySlot(curatedPool, epoch, 47);

    try {
      // Dynamic query variation per 6-hour slot
      const page = (slotIndex % 3) + 1;
      const tvQuery = slotIndex === 2
        ? `with_networks=213&sort_by=vote_average.desc&vote_count.gte=250&page=1`
        : `with_networks=213&sort_by=popularity.desc&page=${page}`;
      const movieQuery = slotIndex === 3
        ? `with_watch_providers=8&watch_region=US&sort_by=vote_average.desc&vote_count.gte=300&page=1`
        : `with_watch_providers=8&watch_region=US&sort_by=popularity.desc&page=${page}`;

      const [tvRes, movieRes] = await Promise.all([
        tmdb.discover('tv', tvQuery),
        tmdb.discover('movie', movieQuery),
      ]);

      const liveShows: CuratedShelfItem[] = (tvRes.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.name || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'tv' as const,
          customSubtitle: formatItemSubtitle(x, 'tv'),
          vote_average: x.vote_average,
        }));

      const liveMovies: CuratedShelfItem[] = (movieRes.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.title || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'movie' as const,
          customSubtitle: formatItemSubtitle(x, 'movie'),
          vote_average: x.vote_average,
        }));

      const seenIds = new Set(rotatedCurated.map((i) => i.id));
      const moreItems = [...liveShows, ...liveMovies].filter((i) => !seenIds.has(i.id));
      const combined = [...rotatedCurated, ...moreItems];
      setCachedShelf('netflix', epoch, combined);
      return combined;
    } catch {
      return rotatedCurated;
    }
  },

  /**
   * 4. Don't Miss These on JioHotstar (Rotates dynamically every 6 hours)
   */
  getJioHotstarDontMiss: async (): Promise<CuratedShelfItem[]> => {
    const { epoch, slotIndex } = get6HourSlotInfo();
    const cached = getCachedShelf('jiohotstar', epoch);
    if (cached) return cached;

    const curatedPool = JIOHOTSTAR_CURATED_POOLS[slotIndex % JIOHOTSTAR_CURATED_POOLS.length];
    const rotatedCurated = rotatePoolBySlot(curatedPool, epoch, 71);

    try {
      const page = (slotIndex % 3) + 1;
      const [tvRes, movieRes] = await Promise.all([
        tmdb.discover('tv', `with_networks=2739|3919&sort_by=popularity.desc&page=${page}`),
        tmdb.discover('movie', `with_watch_providers=337|122&watch_region=IN&sort_by=popularity.desc&page=${page}`),
      ]);

      const liveShows: CuratedShelfItem[] = (tvRes.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.name || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'tv' as const,
          customSubtitle: formatItemSubtitle(x, 'tv'),
          vote_average: x.vote_average,
        }));

      const liveMovies: CuratedShelfItem[] = (movieRes.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.title || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'movie' as const,
          customSubtitle: formatItemSubtitle(x, 'movie'),
          vote_average: x.vote_average,
        }));

      const seenIds = new Set(rotatedCurated.map((i) => i.id));
      const moreItems = [...liveShows, ...liveMovies].filter((i) => !seenIds.has(i.id));
      const combined = [...rotatedCurated, ...moreItems];
      setCachedShelf('jiohotstar', epoch, combined);
      return combined;
    } catch {
      return rotatedCurated;
    }
  },

  /**
   * 5. Watch It With District (Rotates dynamically every 6 hours)
   * Curated by the District community with rotating theme highlights
   */
  getDistrictCollection: async (): Promise<CuratedShelfItem[]> => {
    const { epoch, slotIndex } = get6HourSlotInfo();
    const cached = getCachedShelf('district', epoch);
    if (cached) return cached;

    // Pick the theme pool dedicated to this 6-hour slot
    const curatedPool = DISTRICT_CURATED_POOLS[slotIndex % DISTRICT_CURATED_POOLS.length];
    const rotatedCurated = rotatePoolBySlot(curatedPool, epoch, 89);

    try {
      // Dynamic community buzz query from TMDB based on the 6-hour slot
      const page = (slotIndex % 3) + 1;
      const cinemaBuzz = await tmdb.discover(
        'movie',
        `sort_by=popularity.desc&primary_release_date.gte=2024-01-01&page=${page}`
      );
      const liveItems: CuratedShelfItem[] = (cinemaBuzz.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 10)
        .map((x: any) => ({
          id: x.id,
          title: x.title || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'movie' as const,
          customSubtitle: formatItemSubtitle(x, 'movie'),
          vote_average: x.vote_average,
        }));

      const seenIds = new Set(rotatedCurated.map((i) => i.id));
      const moreItems = liveItems.filter((i) => !seenIds.has(i.id));
      const combined = [...rotatedCurated, ...moreItems];
      setCachedShelf('district', epoch, combined);
      return combined;
    } catch {
      return rotatedCurated;
    }
  },
};
