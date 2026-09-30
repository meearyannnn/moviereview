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

  const {
    containerRef,
    canScrollLeft,
    canScrollRight,
    isDragging,
    scrollToDirection,
    updateScrollState,
    handlers,
  } = useSmoothScroll<HTMLDivElement>({
    enableWheel: true,
    enableDrag: true,
    scrollStepRatio: 0.75,
  });

  useEffect(() => {
    let isMounted = true;
    fetchData()
      .then((data) => { if (isMounted) setMovies(data.results || []); })
      .catch(console.error);
    return () => { isMounted = false; };
  }, [fetchData]);

  useEffect(() => { updateScrollState(); }, [movies, updateScrollState]);

  if (movies.length === 0) return null;

  return (
    <div className="w-full max-w-full min-w-0">
      {/* Header */}
      {title && title.trim() !== '' && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-baseline gap-2">
                <span>{title}</span>
                {accent && <span className="text-[#f5c542]">{accent}</span>}
              </h2>
              {subtitle && (
                <p className="text-[11px] font-mono text-white/30 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {viewAllLink && (
              <Link
                to={viewAllLink}
                className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-white/40 hover:text-[#f5c542] transition-colors mr-1"
              >
                See all <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            {onViewMore && !viewAllLink && (
              <button
                onClick={onViewMore}
                className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-white/40 hover:text-[#f5c542] transition-colors mr-1"
              >
                See all <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => scrollToDirection('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToDirection('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Scroll track */}
      <div
        ref={containerRef}
        {...handlers}
        className={`flex gap-3.5 sm:gap-4 overflow-x-auto scrollbar-hide select-none touch-pan-x overscroll-x-contain pb-3 pt-0.5 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {movies.map((movie) => (
          <div
            key={movie.id}
            className={`flex-none w-[140px] sm:w-[165px] md:w-[185px] lg:w-[205px] ${
              isDragging ? 'pointer-events-none' : ''
            }`}
          >
            <MovieCard movie={movie} type={type} />
          </div>
        ))}
      </div>
    </div>
  );
};