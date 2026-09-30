// components/TraktAnticipatedShelf.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Star, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { trakt } from '@/services/trakt';
import { tmdb, type Movie } from '@/services/tmdb';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { MovieCard } from './MovieCard';

export const TraktAnticipatedShelf: React.FC = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

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
    setLoading(true);

    trakt.getMostAnticipatedMovies(10)
      .then((data) => {
        if (isMounted) setMovies(data);
      })
      .catch((err) => {
        console.warn('Error loading Trakt anticipated:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [movies, updateScrollState]);

  if (!loading && movies.length === 0) return null;

  return (
    <section className="relative group/shelf my-10 w-full max-w-full min-w-0">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#c9a24b]/15 text-[#f5c542] border border-[#c9a24b]/30 font-mono">
              Hype Radar
            </span>
            <span className="text-xs text-[#f5c542] font-extrabold flex items-center gap-1 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-[#f5c542] text-[#f5c542]" />
              Community Anticipated
            </span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight uppercase">
            <span>Most Anticipated </span>
            <span className="bg-gradient-to-r from-[#f5c542] via-white to-[#c9a24b] bg-clip-text text-transparent">
              Movies
            </span>
          </h2>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scrollToDirection('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollToDirection('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-hidden py-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-none w-44 sm:w-48 aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div
          ref={containerRef}
          {...handlers}
          className={`flex gap-4 overflow-x-auto scrollbar-hide pb-3 pt-0.5 touch-pan-x select-none overscroll-x-contain ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className={`flex-none w-44 sm:w-48 ${
                isDragging ? 'pointer-events-none' : ''
              }`}
            >
              <MovieCard movie={movie} type="movie" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
