// src/pages/ExplorePage.tsx — "The Box Office" Unified Explore Catalog
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  X,
  ArrowUp,
  Search,
  RotateCcw,
  Ticket,
  Film,
  Armchair,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ExploreSmartShelves } from '@/components/explore/ExploreSmartShelves';
import { FeatureCard } from '@/components/explore/FeatureCard';
import {
  FilterRail,
  EXPLORE_GENRES,
  SHOWTIME_ITEMS,
  type ExploreType,
  type ExploreSort,
} from '@/components/explore/FilterRail';
import { PosterCard } from '@/components/explore/PosterCard';
import { ActiveFilterChips } from '@/components/explore/ActiveFilterChips';
import { tmdb, type Movie } from '@/services/tmdb';
import { WEB_CHANNELS } from '@/services/webChannels';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL state
  const typeParam = searchParams.get('type') as ExploreType | null;
  const sortParam = searchParams.get('sort') as ExploreSort | null;
  const networksParam = searchParams.get('networks');
  const genresParam = searchParams.get('genres');
  const searchParam = searchParams.get('q') || '';

  const [type, setType] = useState<ExploreType>(
    typeParam === 'movie' || typeParam === 'tv' ? typeParam : 'all'
  );
  const [sort, setSort] = useState<ExploreSort>(
    sortParam === 'popular' || sortParam === 'top_rated' || sortParam === 'latest'
      ? sortParam
      : 'trending'
  );
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(
    networksParam ? networksParam.split(',').filter(Boolean) : []
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    genresParam ? genresParam.split(',').filter(Boolean) : []
  );
  const [searchQuery, setSearchQuery] = useState(searchParam);

  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Mobile drawer & back-to-top state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scroll listener for back-to-top
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync state with URL params
  const updateUrlParams = useCallback(
    (
      newType: ExploreType,
      newSort: ExploreSort,
      newNetworks: string[],
      newGenres: string[],
      newQ?: string
    ) => {
      const params = new URLSearchParams();
      if (newType !== 'all') params.set('type', newType);
      if (newSort !== 'trending') params.set('sort', newSort);
      if (newNetworks.length > 0) params.set('networks', newNetworks.join(','));
      if (newGenres.length > 0) params.set('genres', newGenres.join(','));
      if (newQ && newQ.trim()) params.set('q', newQ.trim());
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // Filter handlers
  const handleTypeChange = (newType: ExploreType) => {
    setType(newType);
    updateUrlParams(newType, sort, selectedNetworks, selectedGenres, searchQuery);
  };

  const handleSortChange = (newSort: ExploreSort) => {
    setSort(newSort);
    updateUrlParams(type, newSort, selectedNetworks, selectedGenres, searchQuery);
  };

  const handleToggleNetwork = (netId: string) => {
    const updated = selectedNetworks.includes(netId)
      ? selectedNetworks.filter((id) => id !== netId)
      : [...selectedNetworks, netId];
    setSelectedNetworks(updated);
    updateUrlParams(type, sort, updated, selectedGenres, searchQuery);
  };

  const handleToggleGenre = (gId: string) => {
    const updated = selectedGenres.includes(gId)
      ? selectedGenres.filter((id) => id !== gId)
      : [...selectedGenres, gId];
    setSelectedGenres(updated);
    updateUrlParams(type, sort, selectedNetworks, updated, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams(type, sort, selectedNetworks, selectedGenres, searchQuery);
  };

  const handleClearAll = () => {
    setType('all');
    setSort('trending');
    setSelectedNetworks([]);
    setSelectedGenres([]);
    setSearchQuery('');
    updateUrlParams('all', 'trending', [], [], '');
  };

  const hasActiveFilters =
    type !== 'all' ||
    sort !== 'trending' ||
    selectedNetworks.length > 0 ||
    selectedGenres.length > 0 ||
    Boolean(searchQuery.trim());

  const activeFiltersCount =
    (type !== 'all' ? 1 : 0) +
    (sort !== 'trending' ? 1 : 0) +
    selectedNetworks.length +
    selectedGenres.length +
    (searchQuery.trim() ? 1 : 0);

  // Fetch explore feed items
  const fetchExploreItems = useCallback(
    async (currentPage: number, append: boolean = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        if (searchQuery.trim()) {
          const res = await tmdb.search(searchQuery.trim(), type === 'all' ? 'multi' : type);
          const results: Movie[] = (res.results || []).filter(
            (item: any) => item.poster_path && item.media_type !== 'person'
          );
          setItems(results);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        // ── Movie Query Builder ───────────────────────────────────────────
        const movieQueryParts: string[] = [`page=${currentPage}`];
        if (sort === 'trending' || sort === 'popular') {
          movieQueryParts.push('sort_by=popularity.desc');
        } else if (sort === 'top_rated') {
          movieQueryParts.push('sort_by=vote_average.desc&vote_count.gte=100');
        } else if (sort === 'latest') {
          movieQueryParts.push('sort_by=primary_release_date.desc');
        }

        if (selectedNetworks.length > 0) {
          const providerIds = selectedNetworks
            .map((id) => WEB_CHANNELS.find((ch) => ch.id === id)?.providerId)
            .filter(Boolean);
          if (providerIds.length > 0) {
            movieQueryParts.push(`with_watch_providers=${providerIds.join('|')}&watch_region=US`);
          }
        }

        if (selectedGenres.length > 0) {
          const movieGenreIds = selectedGenres
            .map((id) => EXPLORE_GENRES.find((g) => g.id === id)?.movieGenreId)
            .filter(Boolean);
          if (movieGenreIds.length > 0) {
            movieQueryParts.push(`with_genres=${movieGenreIds.join('|')}`);
          }
        }

        // ── TV Query Builder ──────────────────────────────────────────────
        const tvQueryParts: string[] = [`page=${currentPage}`];
        if (sort === 'trending' || sort === 'popular') {
          tvQueryParts.push('sort_by=popularity.desc');
        } else if (sort === 'top_rated') {
          tvQueryParts.push('sort_by=vote_average.desc&vote_count.gte=100');
        } else if (sort === 'latest') {
          tvQueryParts.push('sort_by=first_air_date.desc');
        }

        if (selectedNetworks.length > 0) {
          const networkIds = selectedNetworks
            .map((id) => WEB_CHANNELS.find((ch) => ch.id === id)?.networkId)
            .filter(Boolean);
          if (networkIds.length > 0) {
            tvQueryParts.push(`with_networks=${networkIds.join('|')}`);
          }
        }

        if (selectedGenres.length > 0) {
          const tvGenreIds = selectedGenres
            .map((id) => EXPLORE_GENRES.find((g) => g.id === id)?.tvGenreId)
            .filter(Boolean);
          if (tvGenreIds.length > 0) {
            tvQueryParts.push(`with_genres=${tvGenreIds.join('|')}`);
          }
        }

        const movieQueryString = movieQueryParts.join('&');
        const tvQueryString = tvQueryParts.join('&');
        let rawResults: Movie[] = [];
        let totalPages = 1;

        if (type === 'all') {
          const [movieRes, tvRes] = await Promise.all([
            tmdb.discover('movie', movieQueryString),
            tmdb.discover('tv', tvQueryString),
          ]);

          const movies = (movieRes.results || []).map((m: any) => ({ ...m, media_type: 'movie' as const }));
          const tvs = (tvRes.results || []).map((t: any) => ({ ...t, media_type: 'tv' as const }));

          const interleaved: Movie[] = [];
          const maxLen = Math.max(movies.length, tvs.length);
          for (let i = 0; i < maxLen; i++) {
            if (movies[i]) interleaved.push(movies[i]);
            if (tvs[i]) interleaved.push(tvs[i]);
          }

          rawResults = interleaved.filter((item) => Boolean(item.poster_path));
          totalPages = Math.max(movieRes.total_pages || 1, tvRes.total_pages || 1);
        } else if (type === 'movie') {
          const movieRes = await tmdb.discover('movie', movieQueryString);
          rawResults = (movieRes.results || []).map((m: any) => ({ ...m, media_type: 'movie' as const })).filter((item: any) => Boolean(item.poster_path));
          totalPages = movieRes.total_pages || 1;
        } else {
          const tvRes = await tmdb.discover('tv', tvQueryString);
          rawResults = (tvRes.results || []).map((t: any) => ({ ...t, media_type: 'tv' as const })).filter((item: any) => Boolean(item.poster_path));
          totalPages = tvRes.total_pages || 1;
        }

        if (append) {
          setItems((prev) => {
            const seen = new Set(prev.map((p) => `${p.media_type || 'm'}_${p.id}`));
            const deduplicated = rawResults.filter((item) => !seen.has(`${item.media_type || 'm'}_${item.id}`));
            return [...prev, ...deduplicated];
          });
        } else {
          setItems(rawResults);
        }

        setHasMore(rawResults.length > 0 && currentPage < totalPages);
      } catch (err) {
        console.error('Failed to load explore feed:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [type, sort, selectedNetworks, selectedGenres, searchQuery]
  );

  // Trigger query fetch
  useEffect(() => {
    setPage(1);
    fetchExploreItems(1, false);
  }, [fetchExploreItems]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExploreItems(nextPage, true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0608] text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c] relative overflow-x-hidden font-sans">
      <Navbar />

      {/* ── 1. The Cinema Lobby Ambient Elements ── */}
      {/* Soft Radial Projector Light from top center */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-[radial-gradient(ellipse_at_top,_rgba(245,197,66,0.08)_0%,_rgba(201,162,75,0.03)_40%,_transparent_75%)] z-0" />

      {/* Faint Velvet Curtain-Fold Gradients at left & right edges */}
      <div className="pointer-events-none fixed inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-black/90 via-[#140a0d]/40 to-transparent z-0" />
      <div className="pointer-events-none fixed inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-black/90 via-[#140a0d]/40 to-transparent z-0" />

      {/* Faint Film Grain Texture */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.035] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] z-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        {/* ── 2. The Box Office Marquee Header ── */}
        <header className="pt-4 pb-6 mb-8 relative">
          {/* Subtle Twinkling Marquee Bulbs Row */}
          <div className="flex items-center justify-center gap-3 mb-4 opacity-35 overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-[#f5c542] shrink-0 animate-pulse"
                style={{
                  animationDelay: `${(i % 6) * 250}ms`,
                  animationDuration: '2.5s',
                }}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              {/* Eyebrow: NOW SHOWING with MovieGuy Ticket Emblem */}
              <div className="flex items-center gap-2 mb-2">
                <img
                  src="/assets/branding/movieguy-logo-tight.png"
                  alt="MovieGuy"
                  className="h-3.5 w-auto object-contain"
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-[#c9a24b]">
                  MOVIEGUY BOX OFFICE
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#f5c542] shadow-[0_0_8px_rgba(245,197,66,0.9)]" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">NOW SHOWING</span>
              </div>

              {/* Title in project's font-display */}
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-none">
                Explore
              </h1>
            </div>

            {/* Right: Box Office Window Search & Live Tonight Count */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#c9a24b]/70" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Box Office window…"
                  className="pl-9 pr-4 py-2.5 rounded-xl bg-black/40 border border-[#c9a24b]/25 hover:border-[#c9a24b]/50 focus:border-[#f5c542] text-xs text-white placeholder-white/40 focus:outline-none transition-all w-full sm:w-64"
                />
              </form>

              {!loading && (
                <div className="hidden sm:flex flex-col items-end pl-3 border-l border-[#c9a24b]/20">
                  <span className="text-[11px] font-mono font-bold text-[#f5c542] tracking-wider uppercase">
                    {items.length} SHOWS TONIGHT
                  </span>
                  <span className="text-[9px] font-mono text-white/40 uppercase">
                    ADMISSION READY
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Thin Brass Double-Line Divider beneath Header */}
          <div className="w-full mt-4 flex flex-col gap-[3px]">
            <div className="w-full border-t border-[#c9a24b]/35" />
            <div className="w-full border-t border-[#c9a24b]/15" />
          </div>
        </header>

        {/* ── 3. Two-Column Layout: Ticket Booth (Left) + The Screens (Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] xl:grid-cols-[260px_1fr] gap-8 items-start">
          {/* Left Column: Sticky Ticket Booth on Desktop */}
          <aside className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] flex flex-col">
            <FilterRail
              type={type}
              onTypeChange={handleTypeChange}
              sort={sort}
              onSortChange={handleSortChange}
              selectedNetworks={selectedNetworks}
              onToggleNetwork={handleToggleNetwork}
              selectedGenres={selectedGenres}
              onToggleGenre={handleToggleGenre}
              onClearAll={handleClearAll}
              hasActiveFilters={hasActiveFilters}
              className="max-h-[calc(100vh-7rem)]"
            />
          </aside>

          {/* Right Column: Main Cinema Showcase Grid */}
          <main className="min-w-0">
            {/* ── Smart Movies Shelves (Top 10 Numbered Row, Streaming Platforms, Top Movies, Trending Shows, Top Rated TV) ── */}
            {!hasActiveFilters && !searchQuery.trim() && (
              <ExploreSmartShelves />
            )}

            {/* Active Ticket Stubs Filter Bar when filtering */}
            {hasActiveFilters && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#f5c542] shadow-[0_0_8px_rgba(245,197,66,0.8)]" />
                    <h2 className="font-display font-extrabold text-xl text-white">
                      Filtered Box Office Releases
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-mono text-[#c9a24b] hover:text-[#f5c542] underline flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Back to Curated Shelves</span>
                  </button>
                </div>
                <ActiveFilterChips
                  type={type}
                  onClearType={() => handleTypeChange('all')}
                  sort={sort}
                  onResetSort={() => handleSortChange('trending')}
                  selectedNetworks={selectedNetworks}
                  onRemoveNetwork={handleToggleNetwork}
                  selectedGenres={selectedGenres}
                  onRemoveGenre={handleToggleGenre}
                  onClearAll={handleClearAll}
                />
              </div>
            )}

            {/* Catalog Section Header when browsing without active filters */}
            {!hasActiveFilters && !searchQuery.trim() && (
              <div className="flex items-center justify-between pt-8 pb-5 mb-6 border-t border-[#c9a24b]/20">
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-5 h-5 text-[#f5c542]" />
                  <div>
                    <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white tracking-tight">
                      All Box Office Admissions
                    </h2>
                    <p className="text-xs font-mono text-[#f3e9d2]/50 mt-0.5">
                      Explore the complete multi-screen theater catalog
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#f5c542] tracking-wider uppercase bg-[#c9a24b]/15 px-3 py-1 rounded-full border border-[#c9a24b]/30">
                  {items.length} SHOWS
                </span>
              </div>
            )}

            {/* Main Admission Ticket Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5 lg:gap-6">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-2xl overflow-hidden border border-[#c9a24b]/15 bg-[#140c10] animate-pulse"
                  >
                    <div className="aspect-[2/3] bg-white/[0.04]" />
                    <div className="h-3 bg-[#f3e9d2]/15 border-t border-dashed border-[#c9a24b]/20" />
                    <div className="p-3 bg-[#f3e9d2]/10 space-y-2">
                      <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
                      <div className="h-2.5 w-1/2 rounded bg-white/[0.04]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              /* Empty State: House Lights On */
              <div className="py-24 px-4 text-center rounded-2xl border border-[#c9a24b]/20 bg-[#0c090e]/80 backdrop-blur-md max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-full bg-[#c9a24b]/10 text-[#f5c542] flex items-center justify-center mx-auto mb-4 border border-[#c9a24b]/25">
                  <Armchair className="w-7 h-7 stroke-[1.5]" />
                </div>
                <h3 className="font-display font-extrabold text-xl text-white">
                  House lights on. No shows match.
                </h3>
                <p className="mt-1.5 text-xs font-mono text-white/50 max-w-sm mx-auto">
                  The screen is dark for this combination. Tear up your active stubs to return to the catalog.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAll}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-display font-bold bg-gradient-to-r from-[#c9a24b] to-[#e5b95a] text-[#1c120c] shadow-lg shadow-[#c9a24b]/20 hover:brightness-110 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset filters</span>
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5 lg:gap-6">
                  {items.map((item, index) => {
                    // Bento rhythm: every 11th item with a backdrop becomes a wide feature card spanning 2 columns
                    const isBentoSpot = index > 0 && index % 11 === 0 && item.backdrop_path;

                    if (isBentoSpot) {
                      return (
                        <FeatureCard
                          key={`feature_${item.id}_${index}`}
                          item={item}
                          typeOverride={type !== 'all' ? type : undefined}
                        />
                      );
                    }

                    return (
                      <PosterCard
                        key={`${item.media_type || 'm'}_${item.id}_${index}`}
                        item={item}
                        typeOverride={type !== 'all' ? type : undefined}
                      />
                    );
                  })}
                </div>

                {/* Load More Fallback Button */}
                {hasMore && (
                  <div className="mt-16 mb-6 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 rounded-xl border border-[#c9a24b]/30 bg-[#0c090e] hover:bg-[#c9a24b]/10 text-[#f5c542] text-xs font-mono font-bold uppercase tracking-widest transition-all disabled:opacity-40 shadow-xl shadow-black/80 flex items-center gap-2"
                    >
                      <Film className="w-4 h-4 text-[#c9a24b]" />
                      <span>{loadingMore ? 'Printing more tickets…' : 'Load more shows'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <footer className="safe-bottom-content border-t border-[#c9a24b]/20 bg-[#0a0608] pb-28 md:pb-10 relative z-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Link to="/" className="inline-block group focus:outline-none">
              <img
                src="/assets/branding/movieguy-hero-tight.png"
                alt="MovieGuy"
                className="h-6 sm:h-7 w-auto object-contain transition-all group-hover:brightness-125 group-hover:drop-shadow-[0_0_12px_rgba(245,197,66,0.4)]"
              />
            </Link>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="font-mono text-xs text-white/40">The unified cinema catalog &amp; box office window</span>
          </div>
          <div className="font-mono text-xs text-white/40">© {new Date().getFullYear()} MovieGuy · Data from TMDB &amp; Trakt</div>
        </div>
      </footer>

      {/* ── 4. Floating Back to Top Button ── */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-24 right-6 z-40 w-11 h-11 rounded-full bg-[#c9a24b] hover:bg-[#e5b95a] text-[#1c120c] shadow-xl shadow-black/80 flex items-center justify-center transition-all animate-in fade-in zoom-in-95 duration-200 active:scale-95"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      {/* ── 5. Mobile Floating "Tickets" Button ── */}
      <button
        type="button"
        onClick={() => setMobileDrawerOpen(true)}
        aria-label="Open Ticket Booth"
        className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#c9a24b] to-[#e5b95a] text-[#1c120c] font-display font-extrabold text-xs shadow-[0_8px_25px_rgba(0,0,0,0.8),0_0_15px_rgba(201,162,75,0.4)] flex items-center gap-2 active:scale-95 transition-all border border-amber-300/40"
      >
        <img src="/assets/branding/movieguy-logo-tight.png" alt="" className="h-3.5 w-auto object-contain brightness-0" />
        <span>Ticket Booth</span>
        {activeFiltersCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#8c1c2b] text-[#f3e9d2] border border-[#c9a24b]/40">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* ── 6. Mobile Ticket Booth Slide-Over Sheet ── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 right-0 w-full max-w-[340px] sm:max-w-sm bg-[#0c090e] border-l border-[#c9a24b]/20 p-5 flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-250">
            <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-[#c9a24b]/25 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <img src="/assets/branding/movieguy-logo-tight.png" alt="" className="h-4 w-auto object-contain" />
                <span className="font-display font-bold text-sm text-white">Ticket Booth</span>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#c9a24b]/20 text-[#f5c542] border border-[#c9a24b]/30">
                    {activeFiltersCount} stubs
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-mono uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                  aria-label="Close ticket booth"
                >
                  <X className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            <FilterRail
              type={type}
              onTypeChange={handleTypeChange}
              sort={sort}
              onSortChange={handleSortChange}
              selectedNetworks={selectedNetworks}
              onToggleNetwork={handleToggleNetwork}
              selectedGenres={selectedGenres}
              onToggleGenre={handleToggleGenre}
              onClearAll={handleClearAll}
              hasActiveFilters={hasActiveFilters}
              isDrawer={true}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
