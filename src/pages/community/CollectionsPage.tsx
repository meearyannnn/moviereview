// src/pages/community/CollectionsPage.tsx — Curated, daily-rotating collections powered by Supabase & TMDB
import { useState, useRef, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  Film,
  Layers,
  Shuffle,
  Star,
  ArrowUpRight,
  Check,
  X,
  Users,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { Avatar, Spinner } from '@/components/community/communityUtils';
import { CollectionDetailModal } from '@/components/library/CollectionDetailModal';
import { collectionsService } from '@/services/collections';
import { type UserCollection, type UserCollectionItem } from '@/services/userLibrary';
import { tmdb, type Movie } from '@/services/tmdb';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CollectionItem {
  id: number;
  title: string;
  type: 'Movie' | 'TV';
  year: string;
  poster: string;
  rating?: string;
}

interface CuratedCollectionRow {
  id: string;
  title: string;
  tagline?: string;
  topic: string;
  creator: { username: string; avatarUrl?: string };
  commentsCount: number;
  community?: boolean;
  items: CollectionItem[];
}

// ─── Glass tokens ──────────────────────────────────────────────────────────────

const GLASS =
  'border border-white/[0.1] bg-white/[0.045] backdrop-blur-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)]';
const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

// ─── Editorial shelf definitions ───────────────────────────────────────────────
// Each shelf has its own voice and its own TMDB query. Which shelves lead, which TMDB
// page they pull from, and which film lands on which shelf all change with the seed.

type Loader = (page: number) => Promise<{ results?: Movie[] } | undefined>;

interface ShelfDef {
  id: string;
  topic: string;
  title: string;
  tagline: string;
  curator: string;
  load: Loader;
}

const discover = (query: string): Loader => (page) => tmdb.discoverMovies(`${query}&page=${page}`);

const SHELVES: ShelfDef[] = [
  {
    id: 'trending',
    topic: 'Trending Now',
    title: 'Everyone Is Talking About These',
    tagline: 'This week’s biggest conversations in cinema.',
    curator: 'movieguy_editorial',
    load: () => tmdb.getTrending('movie', 'week'),
  },
  {
    id: 'canon',
    topic: 'Essential Classics',
    title: 'The Films That Built the Canon',
    tagline: 'If you have only seen a few, start here.',
    curator: 'criterion_archivist',
    load: (page) => tmdb.getTopRated('movie', page),
  },
  {
    id: 'hidden-gems',
    topic: 'Hidden Gems',
    title: 'Great Films Nobody Told You About',
    tagline: 'Highly rated, rarely mentioned.',
    curator: 'reel_scout',
    load: discover('sort_by=vote_average.desc&vote_count.gte=300&vote_count.lte=2500&vote_average.gte=7.3'),
  },
  {
    id: 'mind-benders',
    topic: 'Mind-Benders',
    title: 'Movies That Rewire Your Brain',
    tagline: 'Sci-fi and mystery that reward a second watch.',
    curator: 'astro_cinephile',
    load: discover('with_genres=878,9648&vote_count.gte=800&sort_by=vote_average.desc'),
  },
  {
    id: 'noir',
    topic: 'Crime & Noir',
    title: 'Shadows, Schemes and Last Confessions',
    tagline: 'Crime stories where nobody is quite innocent.',
    curator: 'midnight_detective',
    load: discover('with_genres=80,53&vote_count.gte=1000&sort_by=vote_average.desc'),
  },
  {
    id: 'horror',
    topic: 'Late Night Horror',
    title: 'Lights Off. Volume Up.',
    tagline: 'Well-reviewed scares for after midnight.',
    curator: 'crypt_keeper_club',
    load: discover('with_genres=27&vote_count.gte=1000&vote_average.gte=6.4&sort_by=vote_average.desc'),
  },
  {
    id: 'feel-good',
    topic: 'Feel-Good',
    title: 'Comfort Watches for Rough Days',
    tagline: 'Warm, funny and easy to love.',
    curator: 'sunday_screening',
    load: discover('with_genres=35,10749&vote_count.gte=1000&sort_by=vote_average.desc'),
  },
  {
    id: 'animation',
    topic: 'Animation',
    title: 'Animation Isn’t Just for Kids',
    tagline: 'Hand-drawn and digital worlds worth getting lost in.',
    curator: 'cel_and_pixel',
    load: discover('with_genres=16&vote_count.gte=2000&sort_by=vote_average.desc'),
  },
  {
    id: 'korea',
    topic: 'World Cinema',
    title: 'The Korean Wave, Frame by Frame',
    tagline: 'Thrillers, dramas and dark comedies from Seoul.',
    curator: 'seoul_station',
    load: discover('with_original_language=ko&vote_count.gte=400&sort_by=vote_average.desc'),
  },
  {
    id: 'japan',
    topic: 'World Cinema',
    title: 'Japan, From Samurai to Studio Ghibli',
    tagline: 'A century of storytelling in one shelf.',
    curator: 'kyoto_projector',
    load: discover('with_original_language=ja&vote_count.gte=400&sort_by=vote_average.desc'),
  },
  {
    id: 'france',
    topic: 'World Cinema',
    title: 'Paris at 24 Frames a Second',
    tagline: 'New Wave to now, in French.',
    curator: 'cafe_cinema',
    load: discover('with_original_language=fr&vote_count.gte=400&sort_by=vote_average.desc'),
  },
  {
    id: 'nineties',
    topic: 'Time Machine',
    title: 'Rewind: The 90s Were Something Else',
    tagline: 'Video-store favourites that still hold up.',
    curator: 'vhs_vault',
    load: discover(
      'primary_release_date.gte=1990-01-01&primary_release_date.lte=1999-12-31&vote_count.gte=2000&sort_by=vote_average.desc'
    ),
  },
  {
    id: 'new-hollywood',
    topic: 'Time Machine',
    title: 'New Hollywood: When Directors Took Over',
    tagline: 'The gritty, risky 1970s.',
    curator: 'grindhouse_historian',
    load: discover(
      'primary_release_date.gte=1970-01-01&primary_release_date.lte=1979-12-31&vote_count.gte=1000&sort_by=vote_average.desc'
    ),
  },
  {
    id: 'docs',
    topic: 'Documentaries',
    title: 'True Stories, Told Beautifully',
    tagline: 'Documentaries that play like thrillers.',
    curator: 'real_life_reel',
    load: discover('with_genres=99&vote_count.gte=300&sort_by=vote_average.desc'),
  },
  {
    id: 'upcoming',
    topic: 'Coming Soon',
    title: 'Mark Your Calendar',
    tagline: 'Upcoming releases worth planning around.',
    curator: 'marquee_insider',
    load: () => tmdb.getUpcomingMovies(1),
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Small seeded RNG so the lineup is stable within a day but changes every day
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const shuffled = <T,>(arr: T[], rand: () => number) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const dayNumber = () => Math.floor(Date.now() / 86_400_000);

const ITEMS_PER_SHELF = 10;
const MIN_ITEMS = 5;
const SHELVES_SHOWN = 9;

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CollectionsPage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<CuratedCollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState('All Topics');
  const [showTopicsMenu, setShowTopicsMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shuffleKey, setShuffleKey] = useState(0);

  const [selectedCollection, setSelectedCollection] = useState<UserCollection | null>(null);
  const [selectedItems, setSelectedItems] = useState<UserCollectionItem[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    let cancelled = false;

    async function loadCollections() {
      setLoading(true);
      try {
        const seed = dayNumber() * 1000 + shuffleKey;
        const rand = mulberry32(seed);
        const rows: CuratedCollectionRow[] = [];

        // 1. Community collections from Supabase (fetched in parallel)
        try {
          const publicCols = await collectionsService.getPublicCollections(10);
          const withItems = await Promise.all(
            publicCols.map(async (col) => ({
              col,
              items: await collectionsService.getItems(col.id).catch(() => []),
            }))
          );
          for (const { col, items } of withItems) {
            if (items.length === 0) continue;
            rows.push({
              id: col.id,
              title: col.title,
              tagline: 'Made by a fellow cinephile.',
              topic: 'Community Picks',
              community: true,
              creator: { username: col.username || 'Cinephile', avatarUrl: col.avatar_url },
              commentsCount: col.items_count || items.length,
              items: items.map((it) => ({
                id: it.media_id,
                title: it.media_title,
                type: it.media_type === 'tv' ? 'TV' : 'Movie',
                year: '',
                poster: it.media_poster ? tmdb.getImageUrl(it.media_poster, 'w342') : '/placeholder.svg',
              })),
            });
          }
        } catch (supabaseErr) {
          console.warn('Supabase public collections check:', supabaseErr);
        }

        // 2. Pick a fresh lineup of editorial shelves for today
        const lineup = shuffled(SHELVES, rand).slice(0, SHELVES_SHOWN);
        const results = await Promise.allSettled(
          lineup.map((shelf) => shelf.load(1 + Math.floor(rand() * 3)))
        );

        // 3. Each film appears on one shelf only, so no two lists feel the same
        const seen = new Set<number>();
        lineup.forEach((shelf, i) => {
          const res = results[i];
          if (res.status !== 'fulfilled' || !res.value?.results?.length) return;

          const picks: CollectionItem[] = [];
          for (const m of shuffled(res.value.results, rand)) {
            if (picks.length >= ITEMS_PER_SHELF) break;
            if (!m.poster_path || seen.has(m.id)) continue;
            seen.add(m.id);
            const vote = (m as Movie & { vote_average?: number }).vote_average;
            picks.push({
              id: m.id,
              title: m.title,
              type: 'Movie',
              year: m.release_date ? m.release_date.slice(0, 4) : '',
              poster: tmdb.getImageUrl(m.poster_path, 'w342'),
              rating: vote ? vote.toFixed(1) : undefined,
            });
          }

          if (picks.length >= MIN_ITEMS) {
            rows.push({
              id: `shelf-${shelf.id}`,
              title: shelf.title,
              tagline: shelf.tagline,
              topic: shelf.topic,
              creator: { username: shelf.curator },
              commentsCount: 0,
              items: picks,
            });
          }
        });

        if (!cancelled) {
          setCollections(rows);
          setActiveTopic('All Topics');
        }
      } catch (err) {
        console.error('Failed to load collections:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCollections();
    return () => {
      cancelled = true;
    };
  }, [shuffleKey]);

  const topics = useMemo(
    () => ['All Topics', ...Array.from(new Set(collections.map((c) => c.topic)))],
    [collections]
  );

  const scrollRow = (key: string, dir: -1 | 1) => {
    scrollRefs.current[key]?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  const handleOpenCollection = (row: CuratedCollectionRow) => {
    const col: UserCollection = {
      id: row.id,
      user_id: user?.id || 'public-showcase',
      title: row.title,
      description: row.tagline || `Curated cinema showcase by @${row.creator.username}`,
      cover_image: row.items[0]?.poster,
      is_public: true,
      items_count: row.items.length,
      likes_count: row.commentsCount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSelectedCollection(col);
    setSelectedItems(
      row.items.map((it) => ({
        id: `${row.id}-${it.id}`,
        collection_id: row.id,
        media_id: it.id,
        media_type: it.type === 'TV' ? 'tv' : 'movie',
        media_title: it.title,
        media_poster: it.poster,
        release_year: it.year || undefined,
        vote_average: it.rating ? Number(it.rating) : undefined,
        added_at: new Date().toISOString(),
      }))
    );
    setIsDetailModalOpen(true);
  };

  const filteredRows = collections.filter((row) => {
    if (activeTopic !== 'All Topics' && row.topic !== activeTopic) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return row.title.toLowerCase().includes(q) || row.items.some((it) => it.title.toLowerCase().includes(q));
  });

  // The first shelf becomes a spotlight when nothing is filtered
  const showSpotlight = activeTopic === 'All Topics' && !searchQuery.trim() && filteredRows.length > 0;
  const spotlight = showSpotlight ? filteredRows[0] : null;
  const shelves = showSpotlight ? filteredRows.slice(1) : filteredRows;

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      <div className="relative isolate">
        {/* Ambient light the glass refracts */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#f5c542]/[0.09] blur-[110px]" />
          <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-[#9b1c3c]/[0.20] blur-[130px]" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-[#5b2a86]/[0.14] blur-[120px]" />
        </div>

        {/* ── Top bar ── */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="relative">
            <button
              onClick={() => setShowTopicsMenu((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={showTopicsMenu}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] ${GLASS} ${FOCUS}`}
            >
              <SlidersHorizontal className="h-4 w-4 text-[#f5c542]" />
              <span className="max-w-[140px] truncate sm:max-w-none">{activeTopic}</span>
              <span className="text-white/40">{topics.length - 1}</span>
            </button>

            {showTopicsMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowTopicsMenu(false)} aria-hidden />
                <div
                  role="listbox"
                  className="absolute left-0 top-full z-30 mt-2 max-h-80 w-64 space-y-0.5 overflow-y-auto rounded-3xl border border-white/[0.12] bg-[#140a0e]/85 p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
                >
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      role="option"
                      aria-selected={activeTopic === topic}
                      onClick={() => {
                        setActiveTopic(topic);
                        setShowTopicsMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-left text-sm transition-colors ${activeTopic === topic
                          ? 'bg-[#f5c542] font-semibold text-[#1c120c]'
                          : 'text-white/75 hover:bg-white/[0.07] hover:text-white'
                        }`}
                    >
                      <span>{topic}</span>
                      {activeTopic === topic && <Check className="h-4 w-4" strokeWidth={2.5} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {searchOpen ? (
              <div className={`flex items-center gap-1 rounded-full py-1 pl-4 pr-1.5 ${GLASS}`}>
                <Search className="h-4 w-4 text-white/45" />
                <input
                  type="text"
                  autoFocus
                  aria-label="Search collections or movies"
                  placeholder="Search lists or films…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-36 bg-transparent px-2 py-1.5 text-sm text-white placeholder-white/35 focus:outline-none sm:w-60"
                />
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchOpen(false);
                  }}
                  aria-label="Close search"
                  className={`rounded-full p-2 text-white/55 transition hover:bg-white/[0.08] hover:text-white ${FOCUS}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShuffleKey((k) => k + 1)}
                  disabled={loading}
                  aria-label="Shuffle collections"
                  title="Get a fresh set of collections"
                  className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-white/80 transition hover:text-[#f5c542] disabled:opacity-40 ${GLASS} ${FOCUS}`}
                >
                  <Shuffle className="h-4 w-4" />
                  <span className="hidden sm:inline">Shuffle</span>
                </button>
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search collections"
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:text-[#f5c542] ${GLASS} ${FOCUS}`}
                >
                  <Search className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="space-y-8" aria-busy="true" aria-label="Loading collections">
            <div className={`h-64 animate-pulse rounded-[32px] ${GLASS}`} />
            {[0, 1].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 w-1/2 animate-pulse rounded-full bg-white/[0.06]" />
                <div className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="aspect-[2/3] w-36 shrink-0 animate-pulse rounded-2xl bg-white/[0.05] sm:w-44" />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 text-sm text-white/45">
              <Spinner className="h-4 w-4 animate-spin text-[#f5c542]" />
              Picking today’s collections…
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className={`rounded-[28px] px-6 py-16 text-center ${GLASS}`}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
              <Layers className="h-6 w-6 text-[#f5c542]/80" strokeWidth={1.5} />
            </div>
            <p className="font-medium text-white/85">No collections match</p>
            <p className="mt-1 text-sm text-white/45">Try another topic or clear your search.</p>
            <button
              onClick={() => {
                setActiveTopic('All Topics');
                setSearchQuery('');
                setSearchOpen(false);
              }}
              className={`mt-6 rounded-full bg-[#f5c542] px-5 py-2.5 text-sm font-semibold text-[#1c120c] transition hover:bg-[#ffd25e] ${FOCUS}`}
            >
              Show all collections
            </button>
          </div>
        ) : (
          <div className="space-y-12 pb-16">
            {/* Spotlight */}
            {spotlight && (
              <section
                aria-label="Today's spotlight"
                className={`relative overflow-hidden rounded-[32px] ${GLASS}`}
              >
                <img
                  src={spotlight.items[0]?.poster}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-3xl"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#140a0e]/40 via-transparent to-[#140a0e]/80" />
                <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                  <div className="min-w-0 space-y-3 sm:max-w-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f5c542]/30 bg-[#f5c542]/10 px-3 py-1 text-[11px] font-medium text-[#f5c542]">
                      {spotlight.community ? <Users className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                      Today’s spotlight
                    </span>
                    <h2 className="font-display text-2xl font-bold leading-snug text-white sm:text-3xl">
                      {spotlight.title}
                    </h2>
                    {spotlight.tagline && <p className="text-sm text-white/65">{spotlight.tagline}</p>}
                    <button
                      onClick={() => handleOpenCollection(spotlight)}
                      className={`mt-2 inline-flex items-center gap-2 rounded-full bg-[#f5c542] px-5 py-2.5 text-sm font-semibold text-[#1c120c] shadow-[0_8px_24px_-8px_rgba(245,197,66,0.6)] transition hover:bg-[#ffd25e] ${FOCUS}`}
                    >
                      Open collection
                      <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>

                  {/* Fanned posters */}
                  <div className="flex shrink-0 -space-x-8 self-start sm:self-center">
                    {spotlight.items.slice(0, 4).map((it, i) => (
                      <img
                        key={it.id}
                        src={it.poster}
                        alt={it.title}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                        style={{ transform: `rotate(${(i - 1.5) * 4}deg)`, zIndex: 4 - i }}
                        className="aspect-[2/3] w-24 rounded-2xl border border-white/20 object-cover shadow-2xl sm:w-28"
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Shelves */}
            {shelves.map((collection) => (
              <section key={collection.id} className="space-y-4" aria-label={collection.title}>
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-lg font-bold text-white sm:text-2xl">
                      {collection.title}
                    </h2>
                    {collection.tagline && (
                      <p className="mt-0.5 truncate text-sm text-white/50">{collection.tagline}</p>
                    )}
                  </div>
                  <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    {(['left', 'right'] as const).map((side) => (
                      <button
                        key={side}
                        onClick={() => scrollRow(collection.id, side === 'left' ? -1 : 1)}
                        aria-label={side === 'left' ? 'Previous titles' : 'Next titles'}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-white/65 transition hover:text-[#f5c542] ${GLASS} ${FOCUS}`}
                      >
                        {side === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posters */}
                <div
                  ref={(el) => {
                    scrollRefs.current[collection.id] = el;
                  }}
                  className="-mx-1 flex snap-x gap-4 overflow-x-auto overscroll-x-contain px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {collection.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleOpenCollection(collection)}
                      aria-label={`${item.title}${item.year ? `, ${item.year}` : ''}. Open collection`}
                      className={`group w-36 shrink-0 snap-start rounded-2xl text-left sm:w-44 ${FOCUS}`}
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/[0.1] bg-black/60 shadow-lg">
                        <img
                          src={item.poster}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                        {item.rating && (
                          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
                            <Star className="h-3 w-3 fill-[#f5c542] text-[#f5c542]" />
                            {item.rating}
                          </span>
                        )}
                      </div>
                      <div className="mt-2.5 px-0.5">
                        <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-[#f5c542]">
                          {item.title}
                        </h3>
                        {item.year && <p className="mt-0.5 text-xs text-white/45">{item.year}</p>}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-between gap-3 rounded-full py-2 pl-3 pr-2 ${GLASS}`}>
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar src={collection.creator.avatarUrl} name={collection.creator.username} size="sm" />
                    <span className="truncate text-xs text-white/65">
                      @{collection.creator.username}
                      <span className="text-white/35"> • {collection.items.length} titles</span>
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenCollection(collection)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-medium text-white/85 transition hover:border-[#f5c542]/50 hover:text-[#f5c542] ${FOCUS}`}
                  >
                    Open collection
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Collection Detail Modal integration */}
      {selectedCollection && (
        <CollectionDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedCollection(null);
            setSelectedItems([]);
          }}
          collection={selectedCollection}
          initialItems={selectedItems}
          onUpdate={() => { }}
        />
      )}
    </CommunityLayout>
  );
}