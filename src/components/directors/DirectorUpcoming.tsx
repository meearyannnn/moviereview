// src/components/directors/DirectorUpcoming.tsx — Upcoming Releases by Director
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Film, Sparkles } from 'lucide-react';
import { tmdb } from '@/services/tmdb';
import { type DirectorMovie } from '@/hooks/useDirector';

interface DirectorUpcomingProps {
  movies: DirectorMovie[];
}

const formatDateBadge = (dateStr: string) => {
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'TBA';
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  return `${month} ${day}`;
};

const formatFullDate = (dateStr: string) => {
  if (!dateStr) return 'Release Date TBA';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const DirectorUpcoming: React.FC<DirectorUpcomingProps> = ({ movies }) => {
  const navigate = useNavigate();

  if (!movies || movies.length === 0) return null;

  return (
    <section className="w-full">
      {/* ── Section Header with Rounded-Square Gold Badge ── */}
      <div className="flex items-center justify-between mb-4 px-0.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] flex items-center justify-center shadow-[0_0_12px_rgba(245,197,66,0.2)] shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
              <span>Upcoming Releases</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-[#f5c542] bg-[#c9a24b]/15 border border-[#c9a24b]/30">
                <Sparkles className="w-2.5 h-2.5" />
                Coming Soon
              </span>
            </h2>
            <p className="text-[11px] text-[#c9a24b]/70 font-mono mt-0.5">
              Future cinematic projects &amp; announced premieres
            </p>
          </div>
        </div>
      </div>

      {/* Cards list */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-2 px-0.5 select-none touch-pan-x">
        {movies.map((movie) => {
          const dateBadge = formatDateBadge(movie.release_date || '');
          const fullDate = formatFullDate(movie.release_date || '');
          const posterUrl = movie.poster_path
            ? tmdb.getImageUrl(movie.poster_path, 'w500')
            : null;

          return (
            <div
              key={movie.id}
              onClick={() => navigate(`/movie/${movie.id}`)}
              className="flex-none w-36 sm:w-44 group cursor-pointer"
            >
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

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                {/* Release Date Pill */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/80 border border-[#c9a24b]/40 text-white backdrop-blur-md shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f5c542] animate-pulse" />
                    {dateBadge}
                  </span>
                </div>

                {/* Bottom Tag */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                  <span className="block truncate text-[10px] font-mono font-bold text-[#f3e9d2] bg-black/75 border border-[#c9a24b]/30 backdrop-blur-md px-2 py-0.5 rounded-md text-center">
                    Upcoming Feature
                  </span>
                </div>
              </div>

              <div className="mt-2.5 px-0.5">
                <h3 className="font-display font-bold text-xs sm:text-sm text-white/90 group-hover:text-[#f5c542] transition-colors truncate">
                  {movie.title}
                </h3>
                <p className="text-[11px] text-[#c9a24b]/60 font-mono mt-0.5 truncate">
                  {fullDate}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
