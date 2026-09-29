// components/MoviesShelves.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight, Sparkles, Flame } from 'lucide-react';
import { trakt } from '@/services/trakt';
import { tmdb, type Movie } from '@/services/tmdb';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

type Period = 'daily' | 'weekly' | 'monthly';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This week' },
  { id: 'monthly', label: 'This month' },
];

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090f]';

/* ---------- Poster card ---------- */
const ShelfCard: React.FC<{ movie: Movie; rank?: number; isDragging?: boolean }> = ({ movie, rank, isDragging }) => {
  const navigate = useNavigate();
  const poster = movie.poster_path
    ? movie.poster_path.startsWith('http')
      ? movie.poster_path
      : tmdb.getImageUrl(movie.poster_path, 'w500')
    : '/placeholder.svg';
  const year = movie.release_date ? movie.release_date.slice(0, 4) : '';

  return (
    <button
      type="button"
      onClick={() => navigate(`/movie/${movie.id}`)}
      aria-label={`${rank ? `Number ${rank}: ` : ''}${movie.title}${year ? `, ${year}` : ''}`}
      className={`group w-40 flex-none rounded-2xl text-left sm:w-48 ${ring} ${
        isDragging ? 'pointer-events-none' : ''
      }`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10 transition duration-300 group-hover:ring-white/30 motion-safe:group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/60">
        <img
          src={poster}
          alt=""
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105 pointer-events-none select-none"
        />
        {rank && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
            <span className="pointer-events-none absolute bottom-1 left-3 font-display text-5xl font-black leading-none text-white/95">
              {rank}
            </span>
          </>
        )}
        {movie.vote_average > 0 && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-md">
            <Star className="h-3 w-3 fill-red-500 text-red-500" />
            {movie.vote_average.toFixed(1)}
          </span>
        )}
      </div>
      <div className="mt-3 px-0.5">
        <h3 className="truncate font-display text-sm font-semibold text-white/95 group-hover:text-white">
          {movie.title}
        </h3>
        {year && <p className="mt-0.5 text-xs text-white/45">{year}</p>}
      </div>
    </button>
  );
};

/* ---------- Scrollable row with arrows ---------- */
const Shelf: React.FC<{ loading: boolean; empty: string; children: (isDragging: boolean) => React.ReactNode; count: number }> = ({
  loading,
  empty,
  children,
  count,
}) => {
  const {
    containerRef,
    canScrollLeft,
    canScrollRight,
    isDragging,
    scrollToDirection,
    handlers,
  } = useSmoothScroll<HTMLDivElement>({
    enableWheel: true,
    enableDrag: true,
    scrollStepRatio: 0.75,
  });

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden py-1" aria-busy="true" aria-label="Loading">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-[2/3] w-40 flex-none animate-pulse rounded-2xl bg-white/[0.05] sm:w-48" />
        ))}
      </div>
    );
  }

  if (count === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 py-14 text-center text-sm text-white/45">
        {empty}
      </p>
    );
  }

  return (
    <div className="group/shelf relative">
      <div
        ref={containerRef}
        {...handlers}
        className={`scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-3 pt-1 touch-pan-x select-none overscroll-x-contain sm:gap-4 [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)] ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children(isDragging)}
      </div>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollToDirection('left')}
          aria-label="Scroll left"
          className={`absolute top-[38%] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/85 text-white backdrop-blur-md transition-all hover:bg-red-600 hover:scale-105 active:scale-95 lg:flex -left-3 ${ring}`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollToDirection('right')}
          aria-label="Scroll right"
          className={`absolute top-[38%] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/85 text-white backdrop-blur-md transition-all hover:bg-red-600 hover:scale-105 active:scale-95 lg:flex -right-3 ${ring}`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

/* ---------- Section heading ---------- */
const ShelfHeader: React.FC<{ icon?: React.ComponentType<{ className?: string }>; title: string; highlightWord?: string; subtitle: string; children?: React.ReactNode }> = ({
  icon: Icon,
  title,
  highlightWord,
  subtitle,
  children,
}) => (
  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl flex items-center gap-2.5">
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.15)] flex-shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
        <span>{title} </span>
        {highlightWord && (
          <span className="bg-gradient-to-r from-red-500 via-white to-red-400 bg-clip-text text-transparent">
            {highlightWord}
          </span>
        )}
      </h2>
      <p className="mt-1 text-sm text-white/45">{subtitle}</p>
    </div>
    {children}
  </div>
);

export const MoviesShelves: React.FC = () => {
  const [anticipated, setAnticipated] = useState<Movie[]>([]);
  const [watched, setWatched] = useState<Movie[]>([]);
  const [watchedPeriod, setWatchedPeriod] = useState<Period>('weekly');
  const [loadingAnticipated, setLoadingAnticipated] = useState(true);
  const [loadingWatched, setLoadingWatched] = useState(true);

  // Most anticipated
  useEffect(() => {
    let isMounted = true;
    setLoadingAnticipated(true);
    trakt
      .getMostAnticipatedMovies(10)
      .then((data) => isMounted && setAnticipated(data))
      .catch((err) => console.warn('Error loading anticipated movies:', err))
      .finally(() => isMounted && setLoadingAnticipated(false));
    return () => {
      isMounted = false;
    };
  }, []);

  // Most watched (reacts to period)
  useEffect(() => {
    let isMounted = true;
    setLoadingWatched(true);
    trakt
      .getMostWatchedMovies(watchedPeriod, 10)
      .then((data) => isMounted && setWatched(data))
      .catch((err) => console.warn('Error loading watched movies:', err))
      .finally(() => isMounted && setLoadingWatched(false));
    return () => {
      isMounted = false;
    };
  }, [watchedPeriod]);

  return (
    <div className="my-10 w-full min-w-0 max-w-full space-y-14">
      <section>
        <ShelfHeader
          icon={Sparkles}
          title="Most"
          highlightWord="Anticipated"
          subtitle="Movies people are waiting for the most."
        />
        <Shelf loading={loadingAnticipated} count={anticipated.length} empty="No anticipated movies to show right now.">
          {(isDragging) =>
            anticipated.map((m) => (
              <ShelfCard key={m.id} movie={m} isDragging={isDragging} />
            ))
          }
        </Shelf>
      </section>

      <section>
        <ShelfHeader
          icon={Flame}
          title="Most"
          highlightWord="Watched"
          subtitle="What everyone is watching, ranked."
        >
          <div role="group" aria-label="Time period" className="flex w-fit gap-1 rounded-full bg-white/[0.04] p-1">
            {PERIODS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={watchedPeriod === id}
                onClick={() => setWatchedPeriod(id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${ring} ${watchedPeriod === id ? 'bg-white text-black' : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </ShelfHeader>
        <Shelf loading={loadingWatched} count={watched.length} empty="No chart data for this period yet.">
          {(isDragging) =>
            watched.map((m, i) => (
              <ShelfCard key={m.id} movie={m} rank={i + 1} isDragging={isDragging} />
            ))
          }
        </Shelf>
      </section>
    </div>
  );
};