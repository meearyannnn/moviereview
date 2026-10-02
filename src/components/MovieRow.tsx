// src/components/MovieRow.tsx — Horizontal shelf of movie cards
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { type Movie } from '@/services/tmdb';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

interface MovieRowProps {
  title?: string;
  accent?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  fetchData: () => Promise<{ results: Movie[] }>;
  type?: 'movie' | 'tv';
  onViewMore?: () => void;
  viewAllLink?: string;
}

// One width scale, shared by real cards and skeletons so nothing jumps when data arrives
const CARD_WIDTH = 'w-[115px] sm:w-[130px] md:w-[145px] lg:w-[155px]';

export const MovieRow = ({
  title,
  accent,
  subtitle,
  icon: Icon,
  fetchData,
  type = 'movie',
  onViewMore,
  viewAllLink,
}: MovieRowProps) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const { containerRef, canScrollLeft, canScrollRight, isDragging, scrollToDirection, updateScrollState, handlers } =
    useSmoothScroll<HTMLDivElement>({
      enableWheel: true,
      enableDrag: true,
      scrollStepRatio: 0.75,
    });

  // Note: pass a stable fetchData (useCallback or a module-level function),
  // otherwise an inline arrow refetches on every parent render.
  useEffect(() => {
    let active = true;
    fetchData()
      .then((data) => {
        if (active) setMovies(data.results || []);
      })
      .catch((err) => {
        console.error('MovieRow failed to load:', err);
        if (active) setMovies([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchData]);

  useEffect(() => {
    updateScrollState();
  }, [movies, loading, updateScrollState]);

  // Nothing to show after loading: render nothing rather than an empty heading
  if (!loading && movies.length === 0) return null;

  const hasHeader = Boolean(title?.trim());
  const seeAllClass =
    'mr-1 inline-flex items-center gap-1 text-xs text-white/50 transition-colors hover:text-[#f5c542]';

  return (
    <section className="w-full min-w-0 max-w-full" aria-label={title || undefined} aria-busy={loading}>
      {hasHeader && (
        <header className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-display text-base sm:text-lg font-bold tracking-tight text-white">
              {Icon && <Icon className="h-4 w-4 shrink-0 text-white/50" />}
              <span className="truncate">{title}</span>
              {accent && <span className="shrink-0 text-[#f5c542]">{accent}</span>}
            </h2>
            {subtitle && <p className="mt-0.5 truncate text-xs text-white/45">{subtitle}</p>}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* One "See all" control, visible on mobile too (it used to be hidden below sm) */}
            {viewAllLink ? (
              <Link to={viewAllLink} className={seeAllClass}>
                See all <ArrowRight className="h-3 w-3" />
              </Link>
            ) : onViewMore ? (
              <button type="button" onClick={onViewMore} className={seeAllClass}>
                See all <ArrowRight className="h-3 w-3" />
              </button>
            ) : null}

            <div className="hidden gap-1 sm:flex">
              {(['left', 'right'] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => scrollToDirection(dir)}
                  disabled={dir === 'left' ? !canScrollLeft : !canScrollRight}
                  aria-label={dir === 'left' ? 'Scroll left' : 'Scroll right'}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.05] text-white transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-25"
                >
                  {dir === 'left' ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </header>
      )}

      <div
        ref={containerRef}
        {...handlers}
        className={`scrollbar-hide flex touch-pan-x select-none gap-3.5 overflow-x-auto overscroll-x-contain pb-3 pt-0.5 sm:gap-4 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`flex-none ${CARD_WIDTH}`}>
              <div className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.04]" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-white/[0.05]" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
            </div>
          ))
          : movies.map((movie) => (
            // Cards ignore pointer events mid-drag so releasing a drag never opens a movie
            <div key={movie.id} className={`flex-none ${CARD_WIDTH} ${isDragging ? 'pointer-events-none' : ''}`}>
              <MovieCard movie={movie} type={type} />
            </div>
          ))}
      </div>
    </section>
  );
};