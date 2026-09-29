import { useEffect, useState } from 'react';
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
}

export const MovieRow = ({
  title,
  accent,
  subtitle,
  icon: Icon,
  fetchData,
  type = 'movie',
  onViewMore,
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
              <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.15)] flex-shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="flex items-baseline gap-2.5 truncate">
              <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-white/90 to-red-300 bg-clip-text text-transparent">
                {title}
                {accent && (
                  <>
                    {' '}
                    <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent">
                      {accent}
                    </span>
                  </>
                )}
              </h2>
              {subtitle && (
                <span className="hidden sm:inline text-xs sm:text-sm text-white/40 truncate">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onViewMore && (
              <button
                onClick={onViewMore}
                className="text-xs font-semibold text-red-500/80 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-600/10"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

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