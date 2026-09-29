// components/TraktAnticipatedShelf.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Star, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { trakt } from '@/services/trakt';
import { tmdb, type Movie } from '@/services/tmdb';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

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
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-600 text-white">
              Hype Radar
            </span>
            <span className="text-xs text-red-500 font-extrabold flex items-center gap-1 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-red-500" />
              Community Anticipated
            </span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight uppercase">
            <span>Most Anticipated </span>
            <span className="bg-gradient-to-r from-red-500 via-white to-red-400 bg-clip-text text-transparent">
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
          {movies.map((movie) => {
            const poster = movie.poster_path
              ? movie.poster_path.startsWith('http')
                ? movie.poster_path
                : tmdb.getImageUrl(movie.poster_path, 'w500')
              : '/placeholder.svg';

            const year = movie.release_date ? movie.release_date.slice(0, 4) : '';
            const isReleased = movie.release_date ? new Date(movie.release_date) <= new Date() : true;

            return (
              <div
                key={movie.id}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className={`group flex-none w-44 sm:w-48 cursor-pointer flex flex-col ${
                  isDragging ? 'pointer-events-none' : ''
                }`}
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#12080b] border border-white/10 group-hover:border-white/25 shadow-xl transition-colors duration-200">
                  <img
                    src={poster}
                    alt={movie.title}
                    draggable={false}
                    className="w-full h-full object-cover pointer-events-none select-none"
                    loading="lazy"
                  />
                  {isReleased ? (
                    movie.vote_average > 0 && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-red-500 border border-white/15">
                        <Star className="w-3 h-3 fill-red-500" />
                        <span className="text-white">{movie.vote_average.toFixed(1)}</span>
                      </span>
                    )
                  ) : (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-600/30 backdrop-blur-md text-white border border-red-500/50 text-[9px] font-black uppercase tracking-wider">
                      Upcoming
                    </span>
                  )}
                </div>

                <div className="mt-2.5 px-0.5">
                  <h3 className="font-display font-bold text-sm text-white group-hover:text-red-400 transition-colors truncate">
                    {movie.title}
                  </h3>
                  {year && (
                    <span className="text-xs text-white/50 font-semibold flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-white/40" />
                      {year}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
