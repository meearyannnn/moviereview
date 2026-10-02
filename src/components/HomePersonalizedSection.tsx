// src/components/HomePersonalizedSection.tsx — "Inspired by your collection" (mobile-first)
import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Rows3, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie } from '@/services/tmdb';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { userLibraryService, type UserCollectionItem } from '@/services/userLibrary';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

const INITIAL_LIMIT = 12;
const LIMIT_STEP = 6;

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]/70';

// Phone: swipeable carousel. Tablet and up: grid.
const defaultView = (): 'grid' | 'carousel' =>
  typeof window !== 'undefined' && window.matchMedia?.('(min-width: 640px)').matches
    ? 'grid'
    : 'carousel';

async function fetchRecommendationsForCollection(items: UserCollectionItem[]): Promise<Movie[]> {
  if (!items || items.length === 0) return [];

  const seenIds = new Set<number>(items.map((i) => i.media_id));
  const results: Movie[] = [];

  const add = (list?: Movie[]) => {
    for (const m of list ?? []) {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        results.push(m);
      }
    }
  };

  // Seed from the top 2 items, fetched in parallel
  const responses = await Promise.all(
    items.slice(0, 2).map((seed) =>
      tmdb.getRecommendations(seed.media_id, seed.media_type || 'movie').catch(() => null)
    )
  );
  responses.forEach((res) => add(res?.results));

  // Top up with popular titles if recommendations are thin
  if (results.length < 12) {
    try {
      const popular = await tmdb.getPopular('movie');
      add(popular?.results);
    } catch { }
  }

  return results.slice(0, 18);
}

export const HomePersonalizedSection = () => {
  const { collections, savedCollections, loading: libraryLoading } = useUserLibrary();

  // User + saved collections, deduplicated
  const allCollections = useMemo(() => {
    const list = [...collections, ...savedCollections];
    const seen = new Set<string>();
    return list.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [collections, savedCollections]);

  // Items are loaded lazily, only for the collection being shown, then cached
  const [itemsMap, setItemsMap] = useState<Record<string, UserCollectionItem[]>>({});
  const requestedItems = useRef<Set<string>>(new Set());
  const recsCache = useRef<Record<string, Movie[]>>({});

  const [activeCollectionId, setActiveCollectionId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>(defaultView);
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_LIMIT);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(true);

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

  const validCollections = useMemo(
    () =>
      allCollections.filter(
        (col) =>
          col.items_count > 0 ||
          (col.preview_posters && col.preview_posters.length > 0) ||
          (itemsMap[col.id] && itemsMap[col.id].length > 0)
      ),
    [allCollections, itemsMap]
  );

  // Keep the active collection valid
  useEffect(() => {
    if (validCollections.length > 0 && !validCollections.some((c) => c.id === activeCollectionId)) {
      setActiveCollectionId(validCollections[0].id);
    }
  }, [validCollections, activeCollectionId]);

  const activeCollection = useMemo(
    () => validCollections.find((c) => c.id === activeCollectionId) || validCollections[0] || null,
    [validCollections, activeCollectionId]
  );
  const activeId = activeCollection?.id;
  const activeItems = activeId ? itemsMap[activeId] : undefined;

  // 1) Load items for the active collection (once)
  useEffect(() => {
    if (!activeId || requestedItems.current.has(activeId)) return;
    requestedItems.current.add(activeId);

    userLibraryService
      .getCollectionItems(activeId)
      .then((items) => setItemsMap((prev) => ({ ...prev, [activeId]: items ?? [] })))
      .catch(() => setItemsMap((prev) => ({ ...prev, [activeId]: [] })));
  }, [activeId]);

  // 2) Recommendations for the active collection (cached per collection)
  useEffect(() => {
    if (!activeId) {
      setRecommendations([]);
      setLoadingRecs(false);
      return;
    }

    const cached = recsCache.current[activeId];
    if (cached) {
      setRecommendations(cached);
      setLoadingRecs(false);
      return;
    }

    setLoadingRecs(true);
    if (activeItems === undefined) return; // items still loading

    let active = true;
    fetchRecommendationsForCollection(activeItems).then((recs) => {
      recsCache.current[activeId] = recs;
      if (active) {
        setRecommendations(recs);
        setLoadingRecs(false);
      }
    });
    return () => {
      active = false;
    };
  }, [activeId, activeItems]);

  // Library finished loading and there is nothing to show
  if (!libraryLoading && validCollections.length === 0) return null;

  const toggle = (active: boolean) =>
    `flex h-9 w-9 items-center justify-center rounded-full transition-colors ${ring} ${active ? 'bg-white text-black' : 'text-white/50 hover:text-white'
    }`;

  const arrow = `flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition-colors hover:bg-white/10 hover:text-[#f5c542] disabled:pointer-events-none disabled:opacity-20 ${ring}`;

  const showSkeleton = libraryLoading || loadingRecs;

  // Shared poster widths for carousel + skeleton (~3.2 visible on a phone, hints at scroll)
  const posterW = 'w-28 sm:w-32 md:w-36 lg:w-40';

  return (
    <section id="for-you" aria-label="Inspired by your collection" className="scroll-mt-20">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-white/45">Inspired by your collection</p>
          {libraryLoading && !activeCollection ? (
            <div className="mt-1.5 h-7 w-44 animate-pulse rounded-lg bg-white/[0.06] motion-reduce:animate-none" />
          ) : (
            <h2 className="mt-0.5 truncate font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {activeCollection?.title || 'Your list'}
            </h2>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {viewMode === 'carousel' && (
            <div className="hidden items-center gap-2 sm:flex">
              <button type="button" onClick={() => scrollToDirection('left')} disabled={!canScrollLeft} aria-label="Scroll left" className={arrow}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => scrollToDirection('right')} disabled={!canScrollRight} aria-label="Scroll right" className={arrow}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex gap-0.5 rounded-full bg-white/[0.06] p-0.5">
            <button type="button" onClick={() => setViewMode('grid')} aria-label="Grid view" aria-pressed={viewMode === 'grid'} className={toggle(viewMode === 'grid')}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setViewMode('carousel')} aria-label="Carousel view" aria-pressed={viewMode === 'carousel'} className={toggle(viewMode === 'carousel')}>
              <Rows3 className="h-4 w-4" />
            </button>
          </div>

          {/* Phone: icon only. Larger screens: text link */}
          <Link
            to="/library?tab=collections"
            aria-label="Manage collections"
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition-colors hover:text-[#f5c542] sm:h-auto sm:w-auto sm:gap-1 sm:bg-transparent sm:text-sm sm:font-medium sm:text-white/60 ${ring}`}
          >
            <span className="hidden sm:inline">Manage</span>
            <ArrowRight className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </Link>
        </div>
      </div>

      {/* Collection switcher — bleeds to the screen edge on phones */}
      {validCollections.length > 1 && (
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {validCollections.map((col) => {
            const isActive = col.id === activeCollection?.id;
            return (
              <button
                key={col.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setActiveCollectionId(col.id);
                  setDisplayLimit(INITIAL_LIMIT);
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${ring} ${isActive
                    ? 'bg-[#f5c542] font-semibold text-[#140c10]'
                    : 'bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {col.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="mt-5" aria-busy={showSkeleton}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {showSkeleton
              ? Array.from({ length: INITIAL_LIMIT }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.05] motion-reduce:animate-none" />
              ))
              : recommendations.slice(0, displayLimit).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
          </div>

          {!showSkeleton && recommendations.length > INITIAL_LIMIT && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  setDisplayLimit((prev) =>
                    prev >= recommendations.length ? INITIAL_LIMIT : prev + LIMIT_STEP
                  )
                }
                className={`w-full rounded-full bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-[#f5c542] sm:w-auto sm:py-2 ${ring}`}
              >
                {displayLimit >= recommendations.length ? 'Show less' : 'Show more'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          ref={carouselRef}
          {...carouselHandlers}
          aria-busy={showSkeleton}
          className={`scrollbar-hide -mx-4 mt-5 flex touch-pan-x snap-x snap-proximity gap-2.5 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-2 select-none sm:mx-0 sm:scroll-px-0 sm:gap-3.5 sm:px-0 ${isDragging ? 'sm:cursor-grabbing' : 'sm:cursor-grab'
            }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {showSkeleton
            ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`aspect-[2/3] ${posterW} shrink-0 animate-pulse rounded-xl bg-white/[0.05] motion-reduce:animate-none`} />
            ))
            : recommendations.map((movie) => (
              <div key={movie.id} className={`${posterW} shrink-0 snap-start`}>
                <MovieCard movie={movie} />
              </div>
            ))}
        </div>
      )}

      {!showSkeleton && recommendations.length === 0 && (
        <p className="mt-5 text-sm text-white/45">No recommendations yet. Add a few titles to this collection.</p>
      )}
    </section>
  );
};