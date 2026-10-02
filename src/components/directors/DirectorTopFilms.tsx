// src/components/directors/DirectorTopFilms.tsx — Top Films Carousel (simplified)
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from '@/components/MovieCard';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { type DirectorMovie } from '@/hooks/useDirector';

interface DirectorTopFilmsProps {
  movies: DirectorMovie[];
  directorName: string;
}

const arrowClass =
  'w-7 h-7 rounded-full bg-white/[0.06] text-white/70 hover:text-[#f5c542] hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542] disabled:opacity-20 disabled:pointer-events-none';

export const DirectorTopFilms: React.FC<DirectorTopFilmsProps> = ({ movies, directorName }) => {
  const { containerRef, canScrollLeft, canScrollRight, scrollToDirection, handlers } =
    useSmoothScroll<HTMLDivElement>({
      enableWheel: true,
      enableDrag: true,
      scrollStepRatio: 0.75,
    });

  if (!movies || movies.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex items-end justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h2 className="font-display font-bold tracking-tight text-lg sm:text-xl text-white">
            Top films
          </h2>
          <p className="mt-0.5 text-xs text-white/45 truncate">
            Highest rated by {directorName}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollToDirection('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={arrowClass}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToDirection('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={arrowClass}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        {...handlers}
        className="flex gap-3 sm:gap-3.5 overflow-x-auto scrollbar-hide select-none touch-pan-x overscroll-x-contain pb-2 pt-0.5"
      >
        {movies.map((movie) => (
          <div key={movie.id} className="w-[115px] sm:w-[130px] md:w-[145px] lg:w-[155px] shrink-0">
            <MovieCard movie={movie} type="movie" />
          </div>
        ))}
      </div>
    </section>
  );
};