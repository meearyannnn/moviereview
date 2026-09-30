// src/components/MovieScheduleShelf.tsx — Movie Release Schedule Shelf
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, ArrowRight, Sparkles, Film } from 'lucide-react';
import { scheduleService, type ScheduleItem } from '@/services/schedule';
import { tmdb } from '@/services/tmdb';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

const formatDateBadge = (dateStr: string) => {
  if (!dateStr) return 'TBA';
  try {
    const d = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return dateStr;
  }
};

const formatFullDate = (dateStr: string) => {
  if (!dateStr) return 'Coming soon';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const MovieScheduleShelf: React.FC = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadSchedule() {
      try {
        const grouped = await scheduleService.getUpcomingSchedule(undefined, undefined, 'movie');
        if (isMounted && grouped.length > 0) {
          const list: ScheduleItem[] = [];
          const seenIds = new Set<number>();
          grouped.forEach((group) => {
            group.items.forEach((item) => {
              if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                list.push(item);
              }
            });
          });
          if (list.length > 0) {
            setMovies(list.slice(0, 24));
            setLoading(false);
            return;
          }
        }

        // Fallback: discover upcoming movies directly
        const today = new Date().toISOString().split('T')[0];
        const res = await tmdb.discover(
          'movie',
          `primary_release_date.gte=${today}&sort_by=primary_release_date.asc,popularity.desc&page=1`
        );
        if (isMounted) {
          const fallbackList: ScheduleItem[] = (res.results || []).map((m: any) => ({
            id: m.id,
            title: m.title,
            poster_path: m.poster_path,
            backdrop_path: m.backdrop_path,
            release_date: m.release_date,
            media_type: 'movie',
            hypeScore: Math.round(m.popularity || 50),
            releaseTag: 'In Theatres',
            vote_average: m.vote_average,
            overview: m.overview,
          }));
          setMovies(fallbackList);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Error loading movie schedule shelf:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadSchedule();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && movies.length === 0) return null;

  return (
    <section className="relative w-full max-w-full my-8 group/shelf">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-0.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] flex items-center justify-center shadow-[0_0_12px_rgba(245,197,66,0.2)] flex-shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
              <span>Movie Release Schedule</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-[#f5c542] bg-[#c9a24b]/15 border border-[#c9a24b]/30">
                <Sparkles className="w-2.5 h-2.5" />
                Upcoming
              </span>
            </h2>
            <p className="text-[11px] text-[#c9a24b]/70 font-mono mt-0.5">
              Theatrical premieres & streaming release calendar
            </p>
          </div>
        </div>

        {/* Navigation & See all */}
        <div className="flex items-center gap-2">
          <Link
            to="/schedule"
            className="text-xs font-bold text-[#f5c542] hover:text-white transition-colors flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-[#c9a24b]/15 mr-1"
          >
            <span>Full schedule</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scrollToDirection('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollToDirection('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={containerRef}
        {...handlers}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-2 px-0.5 select-none touch-pan-x"
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-none w-36 sm:w-44 flex flex-col gap-2">
              <div className="aspect-[2/3] rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.05]" />
              <div className="h-3 w-3/4 rounded bg-white/[0.03] animate-pulse" />
              <div className="h-2.5 w-1/2 rounded bg-white/[0.03] animate-pulse" />
            </div>
          ))
        ) : (
          movies.map((movie) => {
            const dateBadge = formatDateBadge(movie.release_date);
            const fullDate = formatFullDate(movie.release_date);
            const posterUrl = movie.poster_path
              ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
              : null;

            return (
              <div
                key={movie.id}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="flex-none w-36 sm:w-44 group cursor-pointer"
              >
                {/* Poster container */}
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-[#c9a24b]/20 bg-[#140a0d] group-hover:border-[#f5c542]/60 group-hover:shadow-[0_8px_30px_rgba(245,197,66,0.25)] transition-all duration-300 transform group-hover:-translate-y-1">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={movie.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                      <Film className="w-8 h-8 text-white/20" />
                    </div>
                  )}

                  {/* Gradient vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Release Date Pill */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/75 border border-[#c9a24b]/30 text-white backdrop-blur-md shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f5c542] animate-pulse" />
                      {dateBadge}
                    </span>
                  </div>

                  {/* Bottom Release Tag */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                    <span className="block truncate text-[10px] font-bold text-[#f3e9d2] bg-black/70 border border-[#c9a24b]/30 backdrop-blur-md px-2 py-0.5 rounded-md text-center">
                      {movie.releaseTag || 'In Theatres'}
                    </span>
                  </div>
                </div>

                {/* Movie Title & Date */}
                <div className="mt-2.5 px-0.5">
                  <h3 className="font-display font-bold text-xs sm:text-sm text-white/90 group-hover:text-[#f5c542] transition-colors line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-[11px] text-[#c9a24b]/60 font-mono mt-0.5 line-clamp-1">
                    {fullDate}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
