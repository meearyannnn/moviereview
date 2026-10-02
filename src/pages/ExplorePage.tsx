// src/pages/ExplorePage.tsx — Unified explore catalog
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ArrowUp, Search, RotateCcw, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ExploreSmartShelves } from '@/components/explore/ExploreSmartShelves';
import { FeatureCard } from '@/components/explore/FeatureCard';
import {
  FilterRail,
  EXPLORE_GENRES,
  type ExploreType,
  type ExploreSort,
} from '@/components/explore/FilterRail';
import { MovieCard } from '@/components/MovieCard';
import { ActiveFilterChips } from '@/components/explore/ActiveFilterChips';
import { tmdb, type Movie } from '@/services/tmdb';
import { WEB_CHANNELS } from '@/services/webChannels';

const WATCH_REGION = 'US'; // streaming-provider availability is per region
const SORTS: ExploreSort[] = ['trending', 'popular', 'top_rated', 'latest'];

type Kind = 'movie' | 'tv';
type ExploreFilters = {
  type: ExploreType;
  sort: ExploreSort;
  networks: string[];
  genres: string[];
  q: string;
};

const splitList = (s: string) => s.split(',').filter(Boolean);
const pad = (n: number) => String(n).padStart(2, '0');
const localYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const itemKey = (m: Movie) => `${m.media_type || 'm'}_${m.id}`;

/**
 * Builds one TMDB discover query. Returns null when the person picked networks or genres
 * that don't exist for this media type, so that type is skipped. (Before, the missing
 * filter was silently dropped and the grid showed unfiltered results.)
 */
function buildQuery(
  kind: Kind,
  o: { page: number; sort: ExploreSort; networks: string[]; genres: string[]; today: string }
): string | null {
  const dateField = kind === 'movie' ? 'primary_release_date' : 'first_air_date';
  const parts = [`page=${o.page}`, 'include_adult=false'];

  if (o.sort === 'top_rated') parts.push('sort_by=vote_average.desc', 'vote_count.gte=100');
  else if (o.sort === 'latest') parts.push(`sort_by=${dateField}.desc`, `${dateField}.lte=${o.today}`); // no unreleased titles
  else parts.push('sort_by=popularity.desc');

  if (o.networks.length > 0) {
    const channels = o.networks.map((id) => WEB_CHANNELS.find((c) => c.id === id));
    const ids = channels.map((c) => (kind === 'movie' ? c?.providerId : c?.networkId)).filter(Boolean);
    if (ids.length === 0) return null;
    parts.push(
      kind === 'movie' ? `with_watch_providers=${ids.join('|')}&watch_region=${WATCH_REGION}` : `with_networks=${ids.join('|')}`
    );
  }

  if (o.genres.length > 0) {
    const ids = o.genres
      .map((id) => EXPLORE_GENRES.find((g) => g.id === id))
      .map((g) => (kind === 'movie' ? g?.movieGenreId : g?.tvGenreId))
      .filter(Boolean);
    if (ids.length === 0) return null;
    parts.push(`with_genres=${ids.join('|')}`);
  }

  return parts.join('&');
}

/** TMDB can repeat a title across pages, so merge by media type + id. */
const mergeUnique = (prev: Movie[], next: Movie[]) => {
  const seen = new Set(prev.map(itemKey));
  return [...prev, ...next.filter((m) => !seen.has(itemKey(m)))];
};

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── Filters live in the URL and nowhere else ──
     Back/forward, shared links and navbar links all work, and there is no
     second copy of the state to drift out of sync. */
  const rawType = searchParams.get('type');
  const rawSort = searchParams.get('sort') as ExploreSort | null;
  const networksRaw = searchParams.get('networks') ?? '';
  const genresRaw = searchParams.get('genres') ?? '';

  const type: ExploreType = rawType === 'movie' || rawType === 'tv' ? rawType : 'all';
  const sort: ExploreSort = rawSort && SORTS.includes(rawSort) ? rawSort : 'trending';
  const networks = useMemo(() => splitList(networksRaw), [networksRaw]);
  const genres = useMemo(() => splitList(genresRaw), [genresRaw]);
  const q = (searchParams.get('q') ?? '').trim();

  const commit = useCallback(
    (patch: Partial<ExploreFilters>) => {
      const next: ExploreFilters = { type, sort, networks, genres, q, ...patch };
      const params = new URLSearchParams();
      if (next.type !== 'all') params.set('type', next.type);
      if (next.sort !== 'trending') params.set('sort', next.sort);
      if (next.networks.length) params.set('networks', next.networks.join(','));
      if (next.genres.length) params.set('genres', next.genres.join(','));
      if (next.q.trim()) params.set('q', next.q.trim());
      setSearchParams(params, { replace: true });
    },
    [type, sort, networks, genres, q, setSearchParams]
  );

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleTypeChange = (t: ExploreType) => commit({ type: t });
  const handleSortChange = (s: ExploreSort) => commit({ sort: s });
  const handleToggleNetwork = (id: string) => commit({ networks: toggle(networks, id) });
  const handleToggleGenre = (id: string) => commit({ genres: toggle(genres, id) });
  const handleClearAll = () => commit({ type: 'all', sort: 'trending', networks: [], genres: [], q: '' });

  // Search box: a draft that is committed on submit, re-synced if the URL changes elsewhere
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    commit({ q: draft });
  };

  const isSearching = q.length > 0;
  const hasFilters = type !== 'all' || sort !== 'trending' || networks.length > 0 || genres.length > 0;
  const hasActiveFilters = hasFilters || isSearching;
  const activeCount =
    (type !== 'all' ? 1 : 0) + (sort !== 'trending' ? 1 : 0) + networks.length + genres.length + (isSearching ? 1 : 0);
  const showShelves = !hasActiveFilters;

  /* ── Data ── */
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);

  const requestRef = useRef(0); // only the latest request may write state
  const pageRef = useRef(1);

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      const reqId = ++requestRef.current;
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(false);
      }

      try {
        let results: Movie[] = [];
        let more = false;

        if (q) {
          const res = await tmdb.search(q, type === 'all' ? 'multi' : type);
          results = ((res.results || []) as any[])
            .filter((it) => it.poster_path && it.media_type !== 'person')
            .map((it) => ({ ...it, media_type: it.media_type || type }));
        } else {
          const today = localYMD();
          const kinds: Kind[] = type === 'all' ? ['movie', 'tv'] : [type];
          const jobs = kinds
            .map((kind) => ({ kind, query: buildQuery(kind, { page, sort, networks, genres, today }) }))
            .filter((j): j is { kind: Kind; query: string } => j.query !== null);

          const responses = await Promise.all(jobs.map((j) => tmdb.discover(j.kind, j.query)));
          const lists = responses.map((res, i) =>
            ((res.results || []) as any[]).map((r) => ({ ...r, media_type: jobs[i].kind as Kind }))
          );

          // Interleave movies and shows so "All" doesn't read as two blocks
          const longest = Math.max(0, ...lists.map((l) => l.length));
          for (let i = 0; i < longest; i++) lists.forEach((l) => l[i] && results.push(l[i]));

          results = results.filter((it) => Boolean(it.poster_path));
          const totalPages = Math.max(1, ...responses.map((r) => r.total_pages || 1));
          more = results.length > 0 && page < totalPages;
        }

        if (reqId !== requestRef.current) return; // a newer request took over
        pageRef.current = page;
        setItems((prev) => (append ? mergeUnique(prev, results) : results));
        setHasMore(more);
      } catch (err) {
        if (reqId !== requestRef.current) return;
        console.error('Failed to load explore feed:', err);
        if (!append) {
          setItems([]);
          setError(true);
        }
        setHasMore(false);
      } finally {
        if (reqId === requestRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [type, sort, networks, genres, q]
  );

  // Any filter change refetches from page 1
  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchPage(pageRef.current + 1, true);
  }, [loading, loadingMore, hasMore, fetchPage]);

  // Infinite scroll: the button below stays as a fallback
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && loadMoreRef.current(), {
      rootMargin: '600px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, items.length, loading]);

  /* ── Page chrome ── */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Drawer: Escape closes it and the page behind stops scrolling
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const railProps = {
    type,
    onTypeChange: handleTypeChange,
    sort,
    onSortChange: handleSortChange,
    selectedNetworks: networks,
    onToggleNetwork: handleToggleNetwork,
    selectedGenres: genres,
    onToggleGenre: handleToggleGenre,
    onClearAll: handleClearAll,
    hasActiveFilters,
  };

  const countLabel = `${items.length}${hasMore ? '+' : ''} titles`;

  return (
    // overflow-x-clip, not -hidden: hidden would break the sticky filter rail
    <div className="relative min-h-screen overflow-x-clip bg-[#0a0608] font-sans text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-32 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        {/* ── Header ── */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-4xl font-black leading-none tracking-tight text-white sm:text-5xl">
            Explore
          </h1>

          <form onSubmit={submitSearch} role="search" className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search movies and shows"
              aria-label="Search movies and shows"
              className="w-full rounded-full bg-white/[0.06] py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/40 transition-colors focus:bg-white/[0.09] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]"
            />
            {draft && (
              <button
                type="button"
                onClick={() => {
                  setDraft('');
                  commit({ q: '' });
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </header>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[250px_1fr] xl:grid-cols-[260px_1fr]">
          {/* ── Filters (desktop) ── */}
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <FilterRail {...railProps} className="max-h-[calc(100vh-7rem)]" />
          </aside>

          <main className="min-w-0">
            {showShelves && <ExploreSmartShelves />}

            {/* Heading: what you're looking at, and how to get back */}
            {showShelves ? (
              <div className="mb-6 mt-12 flex items-baseline justify-between gap-4 border-t border-white/[0.08] pt-8">
                <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">Browse everything</h2>
                {!loading && items.length > 0 && <span className="text-sm text-white/45">{countLabel}</span>}
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                    {isSearching ? `Results for “${q}”` : 'Filtered results'}
                    {!loading && items.length > 0 && (
                      <span className="ml-3 text-sm font-normal text-white/45">{countLabel}</span>
                    )}
                  </h2>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-[#f5c542]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Clear all
                  </button>
                </div>

                {isSearching && (sort !== 'trending' || networks.length > 0 || genres.length > 0) && (
                  <p className="mt-1 text-sm text-white/40">Search ignores sort, genre and network filters.</p>
                )}

                {hasFilters && (
                  <div className="mt-3">
                    <ActiveFilterChips
                      type={type}
                      onClearType={() => handleTypeChange('all')}
                      sort={sort}
                      onResetSort={() => handleSortChange('trending')}
                      selectedNetworks={networks}
                      onRemoveNetwork={handleToggleNetwork}
                      selectedGenres={genres}
                      onRemoveGenre={handleToggleGenre}
                      onClearAll={handleClearAll}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Grid ── */}
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i}>
                    <div className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.04]" />
                    <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-white/[0.05]" />
                    <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="mx-auto max-w-md py-24 text-center">
                <p className="font-display text-xl font-bold text-white">
                  {error ? 'Couldn’t load titles' : 'Nothing matches'}
                </p>
                <p className="mt-1.5 text-sm text-white/50">
                  {error ? 'Check your connection and try again.' : 'Try removing a filter or searching for something else.'}
                </p>
                <button
                  type="button"
                  onClick={error ? () => fetchPage(1, false) : handleClearAll}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f5c542] px-5 py-2.5 text-sm font-bold text-[#1c120c] transition-colors hover:bg-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  {error ? 'Try again' : 'Reset filters'}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 xl:grid-cols-5">
                  {items.map((item, index) => {
                    // Every 11th title with a backdrop becomes a wide feature card
                    const isFeature = index > 0 && index % 11 === 0 && item.backdrop_path;
                    const typeOverride = type !== 'all' ? type : undefined;
                    return isFeature ? (
                      <FeatureCard key={itemKey(item)} item={item} typeOverride={typeOverride} />
                    ) : (
                      <MovieCard key={itemKey(item)} movie={item} type={typeOverride} />
                    );
                  })}
                </div>

                {hasMore && (
                  <div ref={sentinelRef} className="mt-12 flex justify-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-60"
                    >
                      {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loadingMore ? 'Loading' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <footer className="relative z-10 border-t border-white/[0.06] pb-28 md:pb-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]">
              <img
                src="/assets/branding/movieguy-hero-tight.png"
                alt="MovieGuy"
                className="h-[18px] w-auto object-contain opacity-80 transition-opacity hover:opacity-100 sm:h-[20px]"
              />
            </Link>
            <span className="text-xs text-white/30">The unified cinema catalog</span>
          </div>
          <span className="text-xs text-white/25">© {new Date().getFullYear()} MovieGuy · Data from TMDB &amp; Trakt</span>
        </div>
      </footer>

      {/* ── Back to top ── */}
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="fixed bottom-24 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white hover:text-black active:scale-95 animate-in fade-in duration-200"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* ── Mobile: filters button ── */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open filters"
        className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#f5c542] px-5 py-2.5 text-sm font-bold text-[#1c120c] shadow-xl shadow-black/60 transition active:scale-95 lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="rounded-full bg-[#1c120c] px-1.5 text-[11px] font-bold tabular-nums text-[#f5c542]">
            {activeCount}
          </span>
        )}
      </button>

      {/* ── Mobile: filters sheet ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-10 flex w-full max-w-[340px] flex-col bg-[#0c090e] p-5 shadow-2xl animate-in slide-in-from-right duration-200 sm:max-w-sm">
            <div className="mb-4 flex shrink-0 items-center justify-between border-b border-white/[0.08] pb-4">
              <h2 className="font-display text-base font-bold text-white">
                Filters
                {activeCount > 0 && <span className="ml-2 text-sm font-normal text-white/45">{activeCount} active</span>}
              </h2>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button type="button" onClick={handleClearAll} className="text-sm text-white/55 transition-colors hover:text-[#f5c542]">
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close filters"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <FilterRail {...railProps} isDrawer onCloseMobileDrawer={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;