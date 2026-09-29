// components/TraktShowsShelves.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Eye, Star, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { trakt } from '@/services/trakt';
import { tmdb, type Movie } from '@/services/tmdb';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

const TraktShelfRow: React.FC<{
  shows: Movie[];
  loading: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  handlers: any;
  isDragging: boolean;
}> = ({ shows, loading, containerRef, handlers, isDragging }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-hidden py-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex-none w-44 sm:w-48 aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      {...handlers}
      className={`flex gap-4 overflow-x-auto scrollbar-hide pb-3 pt-0.5 touch-pan-x select-none overscroll-x-contain ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {shows.map((show) => {
        const poster = show.poster_path
          ? show.poster_path.startsWith('http')
            ? show.poster_path
            : tmdb.getImageUrl(show.poster_path, 'w500')
          : '/placeholder.svg';
        const year = show.first_air_date ? show.first_air_date.slice(0, 4) : '';

        return (
          <div
            key={show.id}
            onClick={() => navigate(`/tv/${show.id}`)}
            className={`group flex-none w-44 sm:w-48 cursor-pointer flex flex-col ${
              isDragging ? 'pointer-events-none' : ''
            }`}
          >
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 border border-white/[0.06] group-hover:border-white/25 shadow-xl transition-colors duration-200">
              <img
                src={poster}
                alt={show.name || show.title}
                draggable={false}
                className="w-full h-full object-cover pointer-events-none select-none"
                loading="lazy"
              />
              {show.vote_average > 0 && (
                <span className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-red-500 border border-white/10">
                  <Star className="w-3 h-3 fill-red-500" />
                  {show.vote_average.toFixed(1)}
                </span>
              )}
            </div>

            <div className="mt-2.5 px-0.5">
              <h3 className="font-display font-bold text-sm text-white group-hover:text-red-400 transition-colors truncate">
                {show.name || show.title}
              </h3>
              {year && (
                <span className="text-xs text-white/40 font-medium flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {year}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const TraktShowsShelves: React.FC = () => {
  const [anticipated, setAnticipated] = useState<Movie[]>([]);
  const [watched, setWatched] = useState<Movie[]>([]);
  const [watchedPeriod, setWatchedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [loadingAnticipated, setLoadingAnticipated] = useState(true);
  const [loadingWatched, setLoadingWatched] = useState(true);

  const scrollAnticipated = useSmoothScroll<HTMLDivElement>({
    enableWheel: true,
    enableDrag: true,
    scrollStepRatio: 0.75,
  });

  const scrollWatched = useSmoothScroll<HTMLDivElement>({
    enableWheel: true,
    enableDrag: true,
    scrollStepRatio: 0.75,
  });

  // Load Most Anticipated Shows
  useEffect(() => {
    let isMounted = true;
    setLoadingAnticipated(true);

    trakt.getMostAnticipatedShows(10)
      .then((data) => {
        if (isMounted) setAnticipated(data);
      })
      .catch((err) => {
        console.warn('Error loading Trakt anticipated shows:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingAnticipated(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load Most Watched Shows (reactive to period change)
  useEffect(() => {
    let isMounted = true;
    setLoadingWatched(true);

    trakt.getMostWatchedShows(watchedPeriod, 10)
      .then((data) => {
        if (isMounted) setWatched(data);
      })
      .catch((err) => {
        console.warn('Error loading Trakt watched shows:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingWatched(false);
      });

    return () => {
      isMounted = false;
    };
  }, [watchedPeriod]);

  useEffect(() => {
    scrollAnticipated.updateScrollState();
  }, [anticipated, scrollAnticipated]);

  useEffect(() => {
    scrollWatched.updateScrollState();
  }, [watched, scrollWatched]);

  return (
    <div className="space-y-12 my-10 w-full max-w-full min-w-0">
      {/* ── 1. Most Anticipated Shows ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold">
                Upcoming Hype
              </span>
              <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-red-500" />
                Most Anticipated
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
              <span>Most Anticipated </span>
              <span className="bg-gradient-to-r from-red-500 via-white to-red-400 bg-clip-text text-transparent">
                TV Series
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollAnticipated.scrollToDirection('left')}
              disabled={!scrollAnticipated.canScrollLeft}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollAnticipated.scrollToDirection('right')}
              disabled={!scrollAnticipated.canScrollRight}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <TraktShelfRow
          shows={anticipated}
          loading={loadingAnticipated}
          canScrollLeft={scrollAnticipated.canScrollLeft}
          canScrollRight={scrollAnticipated.canScrollRight}
          containerRef={scrollAnticipated.containerRef}
          handlers={scrollAnticipated.handlers}
          isDragging={scrollAnticipated.isDragging}
        />
      </section>

      {/* ── 2. Most Watched Shows with Period Selector ── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold">
                Top Charts
              </span>
              <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Most Watched Series
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
              <span>Most Watched </span>
              <span className="bg-gradient-to-r from-red-500 via-white to-red-400 bg-clip-text text-transparent">
                Shows
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector Tabs */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setWatchedPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
                    watchedPeriod === period
                      ? 'bg-red-600 text-white font-extrabold shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollWatched.scrollToDirection('left')}
                disabled={!scrollWatched.canScrollLeft}
                aria-label="Scroll left"
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollWatched.scrollToDirection('right')}
                disabled={!scrollWatched.canScrollRight}
                aria-label="Scroll right"
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <TraktShelfRow
          shows={watched}
          loading={loadingWatched}
          canScrollLeft={scrollWatched.canScrollLeft}
          canScrollRight={scrollWatched.canScrollRight}
          containerRef={scrollWatched.containerRef}
          handlers={scrollWatched.handlers}
          isDragging={scrollWatched.isDragging}
        />
      </section>
    </div>
  );
};
