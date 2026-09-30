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
    const loadMovies = async () => {
      try {
        const data = await fetchData();
        if (isMounted) {
          setMovies(data.results || []);
        }
      } catch (err) {
        console.error('Failed to load movie row:', err);
      }
    };
    loadMovies();
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  useEffect(() => {
    updateScrollState();
  }, [movies, updateScrollState]);

  if (movies.length === 0) return null;

  return (
    <div className="relative group/row my-3 w-full max-w-full min-w-0">
      {/* Header if title is provided */}
      {title && title.trim() !== '' && (
        <div className="flex items-center justify-between mb-4 px-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="w-7 h-7 rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] flex items-center justify-center shadow-[0_0_12px_rgba(245,197,66,0.15)] flex-shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="flex items-baseline gap-2.5 truncate">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-baseline gap-1.5">
                <span>{title}</span>
                {accent && (
                  <span className="text-[#f5c542] font-semibold text-lg sm:text-xl">
                    {accent}
                  </span>
                )}
              </h2>
              {subtitle && (
                <span className="hidden sm:inline text-xs sm:text-sm font-mono text-white/40 truncate">
                  • {subtitle}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {viewAllLink ? (
              <Link
                to={viewAllLink}
                className="text-xs font-mono font-bold text-[#f5c542] hover:text-[#ffd875] transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#c9a24b]/15"
              >
                <span>See all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : onViewMore ? (
              <button
                onClick={onViewMore}
                className="text-xs font-mono font-bold text-[#f5c542] hover:text-[#ffd875] transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#c9a24b]/15"
              >
                <span>See all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}

            {/* Header Arrow Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollToDirection('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToDirection('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movies Horizontal Scroll Container */}
      <div
        ref={containerRef}
        {...handlers}
        className={`flex gap-3.5 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide select-none touch-pan-x overscroll-x-contain pb-3 pt-0.5 px-0.5 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {movies.map((movie) => (
          <div
            key={movie.id}
            className={`flex-none w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] ${
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