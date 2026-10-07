// src/pages/CatalogPage.tsx — Unified Minimalist & Elegant Movies & TV Catalog
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie } from '@/services/tmdb';
import { WEB_CHANNELS, type WebChannel } from '@/services/webChannels';
import {
  Flame,
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react';

export type MediaType = 'movie' | 'tv';

export type SortKey = 'trending' | 'popular' | 'topRated' | 'latest';

interface GenreFilter {
  id: string;
  label: string;
  movieGenreId?: number;
  tvGenreId?: number;
}

const UNIFIED_GENRES: GenreFilter[] = [
  { id: 'all', label: 'All Genres' },
  { id: 'action', label: 'Action & Adventure', movieGenreId: 28, tvGenreId: 10759 },
  { id: 'comedy', label: 'Comedy', movieGenreId: 35, tvGenreId: 35 },
  { id: 'drama', label: 'Drama', movieGenreId: 18, tvGenreId: 18 },
  { id: 'scifi', label: 'Sci-Fi & Fantasy', movieGenreId: 878, tvGenreId: 10765 },
  { id: 'crime', label: 'Crime & Mystery', movieGenreId: 80, tvGenreId: 80 },
  { id: 'animation', label: 'Animation', movieGenreId: 16, tvGenreId: 16 },
  { id: 'horror', label: 'Horror & Thriller', movieGenreId: 27, tvGenreId: 9648 },
  { id: 'romance', label: 'Romance', movieGenreId: 10749, tvGenreId: 18 },
  { id: 'documentary', label: 'Documentary', movieGenreId: 99, tvGenreId: 99 },
];

const SORT_OPTIONS: { key: SortKey; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: 'trending', label: 'Trending', Icon: Flame },
  { key: 'popular', label: 'Popular', Icon: TrendingUp },
  { key: 'topRated', label: 'Top Rated', Icon: Award },
  { key: 'latest', label: 'Latest', Icon: Calendar },
];

interface CatalogPageProps {
  defaultMediaType?: MediaType;
}

export default function CatalogPage({ defaultMediaType }: CatalogPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine media type from URL or prop
  const currentPathType: MediaType = location.pathname.startsWith('/tv') ? 'tv' : 'movie';
  const initialType: MediaType = defaultMediaType || currentPathType;

  const [mediaType, setMediaType] = useState<MediaType>(initialType);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [activeSort, setActiveSort] = useState<SortKey>('trending');

  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Synchronize state when URL changes (e.g. user navigated /movies <-> /tv via Navbar)
  useEffect(() => {
    const isTV = location.pathname.startsWith('/tv');
    const newType: MediaType = isTV ? 'tv' : 'movie';
    if (newType !== mediaType) {
      setMediaType(newType);
      setPage(1);
      setItems([]);
    }
  }, [location.pathname]);

  // Handle switching between Movies & TV
  const handleMediaTypeChange = (type: MediaType) => {
    if (type === mediaType) return;
    setMediaType(type);
    setPage(1);
    setItems([]);
    navigate(type === 'tv' ? '/tv' : '/movies', { replace: true });
  };

  // Build query and load items
  const fetchItems = useCallback(
    async (currentPage: number, append: boolean = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const isMovie = mediaType === 'movie';
        const activeGenreObj = UNIFIED_GENRES.find((g) => g.id === selectedGenre);
        const genreId = isMovie ? activeGenreObj?.movieGenreId : activeGenreObj?.tvGenreId;

        const channelObj = selectedNetwork
          ? WEB_CHANNELS.find((ch) => ch.id === selectedNetwork)
          : null;

        // If no custom network/genre filter and on page 1, we can use fast curated endpoints
        if (!selectedNetwork && selectedGenre === 'all' && currentPage === 1) {
          let data: any;
          if (activeSort === 'trending') {
            data = await tmdb.getTrending(mediaType, 'week');
          } else if (activeSort === 'popular') {
            data = await tmdb.getPopular(mediaType);
          } else if (activeSort === 'topRated') {
            data = await tmdb.getTopRated(mediaType);
          } else {
            // Latest releases
            const dateField = isMovie ? 'primary_release_date.desc' : 'first_air_date.desc';
            data = await tmdb.discover(
              mediaType,
              `sort_by=${dateField}&page=${currentPage}&vote_count.gte=10`
            );
          }

          const results = data.results || [];
          setItems(results);
          setHasMore(results.length >= 18);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        // Advanced Discover query for filtered or paginated states
        const queryParts: string[] = [`page=${currentPage}`];

        // Sort Mapping
        if (activeSort === 'trending' || activeSort === 'popular') {
          queryParts.push('sort_by=popularity.desc');
        } else if (activeSort === 'topRated') {
          queryParts.push('sort_by=vote_average.desc&vote_count.gte=200');
        } else if (activeSort === 'latest') {
          const dateField = isMovie ? 'primary_release_date.desc' : 'first_air_date.desc';
          queryParts.push(`sort_by=${dateField}`);
        }

        // Genre filter
        if (genreId) {
          queryParts.push(`with_genres=${genreId}`);
        }

        // Network / Provider filter
        if (channelObj) {
          queryParts.push(`with_watch_providers=${channelObj.providerId}&watch_region=US`);
        }

        const data = await tmdb.discover(mediaType, queryParts.join('&'));
        const newResults = data.results || [];

        if (append) {
          setItems((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const unique = newResults.filter((m: Movie) => !existingIds.has(m.id));
            return [...prev, ...unique];
          });
        } else {
          setItems(newResults);
        }

        setHasMore(newResults.length > 0 && currentPage < (data.total_pages || 50));
      } catch (err) {
        console.error('Error fetching catalog data:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [mediaType, selectedNetwork, selectedGenre, activeSort]
  );

  // Trigger fetch whenever filter changes
  useEffect(() => {
    setPage(1);
    fetchItems(1, false);
  }, [fetchItems]);

  // Load more pagination
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(nextPage, true);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedNetwork(null);
    setSelectedGenre('all');
    setActiveSort('trending');
  };

  const hasActiveFilters = selectedNetwork !== null || selectedGenre !== 'all' || activeSort !== 'trending';

  return (
    <div className="relative min-h-screen bg-[#07080b] text-white overflow-x-hidden selection:bg-white selection:text-black">
      {/* Subtle monochrome ambient light */}
      <div 
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255, 255, 255, 0.05) 0%, rgba(7, 8, 11, 0) 70%)'
        }}
      />
      {/* Curtain subtle vignette */}
      <div className="pointer-events-none fixed inset-y-0 left-0 w-24 bg-gradient-to-r from-black/80 to-transparent z-10" />
      <div className="pointer-events-none fixed inset-y-0 right-0 w-24 bg-gradient-to-l from-black/80 to-transparent z-10" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-32">
        {/* ── 1. Minimalist Header & Media Switcher (Movies vs TV) ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 font-mono mb-2">
              Curated Catalog
            </p>
            <div className="flex items-center gap-8 sm:gap-10">
              {/* Movies Tab Switcher */}
              <button
                onClick={() => handleMediaTypeChange('movie')}
                className={`relative py-1 font-display text-3xl sm:text-5xl font-black tracking-tight transition-all duration-300 ${
                  mediaType === 'movie' ? 'text-white' : 'text-white/35 hover:text-white/70'
                }`}
              >
                Movies
                {mediaType === 'movie' && (
                  <span className="absolute left-0 right-0 -bottom-[25px] h-[3px] bg-white rounded-full shadow-[0_0_16px_rgba(255,255,255,0.7)] animate-in fade-in zoom-in-95 duration-200" />
                )}
              </button>

              {/* TV Shows Tab Switcher */}
              <button
                onClick={() => handleMediaTypeChange('tv')}
                className={`relative py-1 font-display text-3xl sm:text-5xl font-black tracking-tight transition-all duration-300 ${
                  mediaType === 'tv' ? 'text-white' : 'text-white/35 hover:text-white/70'
                }`}
              >
                TV Shows
                {mediaType === 'tv' && (
                  <span className="absolute left-0 right-0 -bottom-[25px] h-[3px] bg-white rounded-full shadow-[0_0_16px_rgba(255,255,255,0.7)] animate-in fade-in zoom-in-95 duration-200" />
                )}
              </button>
            </div>
          </div>

          {/* Sort / Vibes Tiers */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl self-start md:self-end overflow-x-auto max-w-full">
            {SORT_OPTIONS.map((opt) => {
              const active = activeSort === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setActiveSort(opt.key)}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
                    active
                      ? 'bg-white text-black font-black shadow-[0_2px_12px_rgba(255,255,255,0.25)]'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <opt.Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. Streamlined Filter Ribbon: Streaming Networks & Genres ── */}
        <div className="py-6 space-y-4">
          {/* Streaming Network Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 touch-pan-x">
            <button
              onClick={() => setSelectedNetwork(null)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 ${
                selectedNetwork === null
                  ? 'bg-white text-black border-white shadow-md'
                  : 'border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              All Networks
            </button>

            {WEB_CHANNELS.map((ch) => {
              const isActive = selectedNetwork === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedNetwork(isActive ? null : ch.id)}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'border-white/40 text-white shadow-[0_0_18px_rgba(255,255,255,0.15)]'
                      : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20'
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: `${ch.color}22`, borderColor: ch.color }
                      : undefined
                  }
                >
                  <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0 bg-black/50 p-0.5">
                    <img src={ch.logoUrl} alt={ch.name} className="w-full h-full object-contain" />
                  </div>
                  <span>{ch.name}</span>
                </button>
              );
            })}
          </div>

          {/* Genre Quick Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 touch-pan-x">
            {UNIFIED_GENRES.map((g) => {
              const isActive = selectedGenre === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGenre(g.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-white/15 text-white border-white/30 shadow-sm font-semibold'
                      : 'border-white/[0.06] bg-transparent text-white/40 hover:text-white/80 hover:border-white/15'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. Active filter indicators & Title Count ── */}
        <div className="flex items-center justify-between gap-4 mb-6 pt-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
            <span className="font-semibold text-white/90">
              {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
            </span>
            {selectedNetwork && (
              <>
                <span>•</span>
                <span className="text-white font-semibold capitalize">
                  {WEB_CHANNELS.find((c) => c.id === selectedNetwork)?.name || selectedNetwork}
                </span>
              </>
            )}
            {selectedGenre !== 'all' && (
              <>
                <span>•</span>
                <span className="text-white/80 font-medium">
                  {UNIFIED_GENRES.find((g) => g.id === selectedGenre)?.label}
                </span>
              </>
            )}

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="ml-2 inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {!loading && (
            <span className="text-xs font-mono text-white/40">
              {items.length} titles
            </span>
          )}
        </div>

        {/* ── 4. Main Catalog Content Grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div
                  className="aspect-[2/3] rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.05]"
                  style={{ animationDelay: `${i * 45}ms` }}
                />
                <div className="h-4 w-3/4 rounded-md bg-white/[0.03] animate-pulse" />
                <div className="h-3 w-1/2 rounded-md bg-white/[0.03] animate-pulse" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center rounded-3xl border border-white/[0.06] bg-white/[0.015]">
            <p className="text-base font-semibold text-white/60 mb-2">No titles found</p>
            <p className="text-xs text-white/40 max-w-sm mx-auto mb-6">
              Try choosing another streaming network or genre combination.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 transition-colors"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {items.map((item) => (
                <MovieCard
                  key={`${item.id}_${mediaType}`}
                  movie={item}
                  type={mediaType}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-14 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-full border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/25 text-white/80 hover:text-white text-xs font-black uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading titles…' : 'Load More Titles'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
