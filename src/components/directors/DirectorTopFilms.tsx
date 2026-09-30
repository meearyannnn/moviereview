// src/components/directors/DirectorTopFilms.tsx — Top Films Admission Ticket Carousel
import React from 'react';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { MovieCard } from '@/components/MovieCard';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { type DirectorMovie } from '@/hooks/useDirector';

interface DirectorTopFilmsProps {
  movies: DirectorMovie[];
  directorName: string;
}

export const DirectorTopFilms: React.FC<DirectorTopFilmsProps> = ({ movies, directorName }) => {
  const {
    containerRef,
    canScrollLeft,
    canScrollRight,
    scrollToDirection,
    handlers,
  } = useSmoothScroll<HTMLDivElement>({
    enableWheel: true,
    enableDrag: true,
    scrollStepRatio: 0.75,
  });

  if (!movies || movies.length === 0) return null;

  return (
    <section className="w-full">
      {/* ── Section Header with Rounded-Square Gold Badge & Carousel Controls ── */}
      <div className="flex items-center justify-between mb-4 px-0.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] flex items-center justify-center shadow-[0_0_12px_rgba(245,197,66,0.2)] shrink-0">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-black text-lg sm:text-xl tracking-tight text-white flex items-baseline gap-2">
              <span>Top Films</span>
              <span className="text-[#f5c542] hidden sm:inline">Signature Works</span>
            </h2>
            <p className="text-[11px] text-[#c9a24b]/70 font-mono mt-0.5 truncate">
              Highest rated masterpieces directed by {directorName}
            </p>
          </div>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollToDirection('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollToDirection('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Carousel Scroll Track ── */}
      <div
        ref={containerRef}
        {...handlers}
        className="flex gap-3.5 sm:gap-4 overflow-x-auto scrollbar-hide select-none touch-pan-x overscroll-x-contain pb-3 pt-0.5"
      >
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="w-[155px] sm:w-[175px] md:w-[195px] shrink-0"
          >
            <MovieCard movie={movie} type="movie" />
          </div>
        ))}
      </div>
    </section>
  );
};
