// components/TraktAnticipatedShelf.tsx
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { trakt } from '@/services/trakt';
import { tmdb, type Movie } from '@/services/tmdb';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { MovieCard } from './MovieCard';

export const TraktAnticipatedShelf: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const { containerRef, canScrollLeft, canScrollRight, isDragging, scrollToDirection, updateScrollState, handlers } =
    useSmoothScroll<HTMLDivElement>({ enableWheel: true, enableDrag: true, scrollStepRatio: 0.75 });

  useEffect(() => {
    let isMounted = true;
    trakt.getMostAnticipatedMovies(10)
      .then((data) => { if (isMounted) setMovies(data); })
      .catch((err) => console.warn('Trakt anticipated:', err))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => { updateScrollState(); }, [movies, updateScrollState]);

  if (!loading && movies.length === 0) return null;

  return (
    <div className="relative w-full max-w-full min-w-0">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[#f5c542] to-[#c9a24b] flex-shrink-0 shadow-[0_0_8px_rgba(245,197,66,0.4)]" />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#c9a24b]/60 uppercase">Trakt · Hype Radar</span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight leading-none">
              Most Anticipated{' '}
              <span className="bg-gradient-to-r from-[#f5c542] to-[#c9a24b] bg-clip-text text-transparent">
                Movies
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => scrollToDirection('left')} disabled={!canScrollLeft} aria-label="Scroll left"
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-[#c9a24b]/15 border border-white/[0.07] hover:border-[#c9a24b]/35 text-white/40 hover:text-[#f5c542] flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scrollToDirection('right')} disabled={!canScrollRight} aria-label="Scroll right"
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-[#c9a24b]/15 border border-white/[0.07] hover:border-[#c9a24b]/35 text-white/40 hover:text-[#f5c542] flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden py-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-none w-44 aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.05]" />
          ))}
        </div>
      ) : (
        <div
          ref={containerRef}
          {...handlers}
          className={`flex gap-4 overflow-x-auto scrollbar-hide pb-3 pt-0.5 touch-pan-x select-none overscroll-x-contain ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {movies.map((movie) => (
            <div key={movie.id} className={`flex-none w-44 sm:w-48 ${isDragging ? 'pointer-events-none' : ''}`}>
              <MovieCard movie={movie} type="movie" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
