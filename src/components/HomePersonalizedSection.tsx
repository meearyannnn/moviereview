// src/components/HomePersonalizedSection.tsx
// Dedicated Collection Showcase Shelf redesigned in a unique, sexy grid form with filter tabs for different collections

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookmarkCheck,
  LayoutGrid,
  Rows3,
  ArrowRight,
  FolderHeart,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie } from '@/services/tmdb';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { userLibraryService, type UserCollection, type UserCollectionItem } from '@/services/userLibrary';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

async function fetchRecommendationsForCollection(
  items: UserCollectionItem[]
): Promise<Movie[]> {
  if (!items || items.length === 0) return [];

  // Seed using top 2 items to get a diverse, curated blend
  const seeds = items.slice(0, 2);
  const results: Movie[] = [];
  const seenIds = new Set<number>(items.map((i) => i.media_id));

  for (const seed of seeds) {
    try {
      const res = await tmdb.getRecommendations(seed.media_id, seed.media_type || 'movie');
      if (res?.results) {
        for (const m of res.results) {
          if (!seenIds.has(m.id)) {
            seenIds.add(m.id);
            results.push(m);
          }
        }
      }
    } catch {}
  }

  // If fewer than 12 recommendations, supplement with popular
  if (results.length < 12) {
    try {
      const popular = await tmdb.getPopular('movie');
      if (popular?.results) {
        for (const m of popular.results) {
          if (!seenIds.has(m.id)) {
            seenIds.add(m.id);
            results.push(m);
          }
          if (results.length >= 18) break;
        }
      }
    } catch {}
  }

  return results.slice(0, 18);
}

export const HomePersonalizedSection = () => {
  const { collections, savedCollections, loading: libraryLoading } = useUserLibrary();

  // Combine user collections & saved collections (deduplicated)
  const allCollections = useMemo(() => {
    const list = [...collections, ...savedCollections];
    const seen = new Set<string>();
    return list.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [collections, savedCollections]);

  // Map of loaded items per collection
  const [collectionItemsMap, setCollectionItemsMap] = useState<Record<string, UserCollectionItem[]>>({});
  const [activeCollectionId, setActiveCollectionId] = useState<string>('');

  // View mode: 'grid' (unique 6-col responsive grid) vs 'carousel' (smooth row)
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');
  const [displayLimit, setDisplayLimit] = useState<number>(12);

  // Recommendations state for the active collection
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(true);

  // Carousel smooth scroll ref
  const {
    containerRef: carouselRef,
    canScrollLeft,
    canScrollRight,
    isDragging,
    scrollToDirection,
    handlers: carouselHandlers,
  } = useSmoothScroll<HTMLDivElement>({
    enableWheel: true,
    enableDrag: true,
    scrollStepRatio: 0.75,
  });

  // Load items for all collections to find which ones have content
  useEffect(() => {
    let active = true;
    const loadItems = async () => {
      const map: Record<string, UserCollectionItem[]> = {};
      for (const col of allCollections) {
        try {
          const items = await userLibraryService.getCollectionItems(col.id);
          if (items && items.length > 0) {
            map[col.id] = items;
          }
        } catch {}
      }
      if (active) {
        setCollectionItemsMap(map);
      }
    };

    if (allCollections.length > 0) {
      loadItems();
    }
    return () => {
      active = false;
    };
  }, [allCollections]);

  // Collections that have items or preview posters
  const validCollections = useMemo(() => {
    return allCollections.filter((col) => {
      const items = collectionItemsMap[col.id];
      return (items && items.length > 0) || col.items_count > 0 || (col.preview_posters && col.preview_posters.length > 0);
    });
  }, [allCollections, collectionItemsMap]);

  // Set initial active collection
  useEffect(() => {
    if (!activeCollectionId && validCollections.length > 0) {
      setActiveCollectionId(validCollections[0].id);
    } else if (validCollections.length > 0 && !validCollections.some((c) => c.id === activeCollectionId)) {
      setActiveCollectionId(validCollections[0].id);
    }
  }, [validCollections, activeCollectionId]);

  const activeCollection = useMemo(() => {
    return validCollections.find((c) => c.id === activeCollectionId) || validCollections[0] || null;
  }, [validCollections, activeCollectionId]);

  // Fetch recommendations when active collection changes
  useEffect(() => {
    let active = true;
    const loadRecs = async () => {
      if (!activeCollection) {
        setRecommendations([]);
        setLoadingRecs(false);
        return;
      }

      setLoadingRecs(true);
      const items = collectionItemsMap[activeCollection.id] || [];
      const recs = await fetchRecommendationsForCollection(items);

      if (active) {
        setRecommendations(recs);
        setLoadingRecs(false);
      }
    };

    loadRecs();
    return () => {
      active = false;
    };
  }, [activeCollection, collectionItemsMap]);

  // If user has zero collections yet
  if (!libraryLoading && validCollections.length === 0) {
    return null;
  }

  return (
    <section
      id="for-you"
      aria-label="Inspired by your collection"
      className="scroll-mt-20 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#180e15]/70 via-[#10080e]/80 to-[#0a0508]/90 p-3.5 sm:p-5 backdrop-blur-xl shadow-xl"
    >
      {/* ── Section Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-white/[0.06]">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-base sm:text-lg font-bold tracking-tight text-white">
            <BookmarkCheck className="h-4 w-4 shrink-0 text-[#f5c542]" />
            <span>Inspired by your collection</span>
            {activeCollection?.title && (
              <span className="truncate text-[#f5c542]">{activeCollection.title}</span>
            )}
          </h2>
          <p className="mt-0.5 text-xs text-white/50 truncate">
            {activeCollection?.description ||
              `Personalized cinema recommendations matching the mood of "${activeCollection?.title || 'your list'}"`}
          </p>
        </div>

        {/* Controls: Grid/Row View Toggle + Manage Lists link */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-black/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid View"
              title="Grid View"
              className={`flex h-6 w-6 items-center justify-center rounded text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#f5c542] text-[#140c10] shadow-sm font-semibold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('carousel')}
              aria-label="Row Carousel View"
              title="Row Carousel View"
              className={`flex h-6 w-6 items-center justify-center rounded text-xs transition-colors ${
                viewMode === 'carousel'
                  ? 'bg-[#f5c542] text-[#140c10] shadow-sm font-semibold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Rows3 className="h-3 w-3" />
            </button>
          </div>

          <Link
            to="/library?tab=collections"
            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/70 transition-colors hover:border-[#f5c542]/40 hover:text-[#f5c542]"
          >
            Manage <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* ── Collection Filter Pills (User-friendly switching) ── */}
      {validCollections.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-white/40 mr-1">
            Collections:
          </span>
          {validCollections.map((col) => {
            const isActive = col.id === activeCollection?.id;
            const count = (collectionItemsMap[col.id]?.length || col.items_count) ?? 0;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => {
                  setActiveCollectionId(col.id);
                  setDisplayLimit(12);
                }}
                className={`group shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#f5c542] text-[#140c10] shadow-[0_0_12px_rgba(245,197,66,0.3)] scale-[1.02]'
                    : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white border border-white/[0.08]'
                }`}
              >
                <span>{col.title}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono transition-colors ${
                      isActive ? 'bg-[#140c10]/20 text-[#140c10]' : 'bg-white/10 text-white/50 group-hover:text-white'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Grid Form Display ── */}
      {viewMode === 'grid' ? (
        <div className="pt-2 space-y-4">
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {loadingRecs
              ? Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.04]" />
                ))
              : recommendations.slice(0, displayLimit).map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
          </div>

          {/* Show More / Show Less Button */}
          {!loadingRecs && recommendations.length > 14 && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => (prev >= recommendations.length ? 14 : prev + 7))}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-[#f5c542]/50 hover:bg-white/[0.08] hover:text-[#f5c542]"
              >
                {displayLimit >= recommendations.length ? 'Show Less' : `Show More (${recommendations.length - displayLimit} more)`}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Carousel Row Track ── */
        <div className="relative pt-1.5">
          {/* Scroll arrow buttons for carousel */}
          <div className="absolute -top-9 right-0 hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollToDirection('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] text-white transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-25"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => scrollToDirection('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] text-white transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-25"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div
            ref={carouselRef}
            {...carouselHandlers}
            className={`scrollbar-hide flex touch-pan-x select-none gap-3 overflow-x-auto overscroll-x-contain pb-2 pt-1 sm:gap-3.5 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {loadingRecs
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-[115px] sm:w-[130px] md:w-[145px] lg:w-[155px] shrink-0 aspect-[2/3] animate-pulse rounded-xl bg-white/[0.04]" />
                ))
              : recommendations.map((movie) => (
                  <div key={movie.id} className="w-[115px] sm:w-[130px] md:w-[145px] lg:w-[155px] shrink-0">
                    <MovieCard movie={movie} />
                  </div>
                ))}
          </div>
        </div>
      )}
    </section>
  );
};
