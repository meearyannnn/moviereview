// src/components/directors/DirectorRow.tsx — Curated Director Row matching Figma layout
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Film, ChevronRight } from 'lucide-react';
import { useDirector } from '@/hooks/useDirector';
import { tmdb } from '@/services/tmdb';

export interface InitialDirectorData {
  profilePath?: string;
  totalFilms?: number;
  topFilms?: {
    id: number;
    title: string;
    year: string;
    poster: string;
    rating: number;
  }[];
}

interface DirectorRowProps {
  id: number;
  fallbackName?: string;
  era?: string;
  initialData?: InitialDirectorData;
}

const FALLBACK_PORTRAIT =
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80';

export const DirectorRow: React.FC<DirectorRowProps> = ({
  id,
  fallbackName,
  era,
  initialData,
}) => {
  const hasInitialData = Boolean(
    initialData && initialData.topFilms && initialData.topFilms.length > 0
  );

  // If initialData is available, skip network request entirely for instant 0ms rendering
  const { data: dynamicDirector, isLoading } = useDirector(id, {
    enabled: !hasInitialData,
  });

  // Skeleton only shown if no initialData is preloaded and dynamic fetch is in progress
  if (!hasInitialData && isLoading) {
    return (
      <div className="py-8 border-b border-white/[0.06] animate-pulse">
        {/* Row Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
          <div className="w-28 h-36 sm:w-36 sm:h-48 md:w-44 md:h-56 rounded-2xl bg-white/[0.05] border border-white/[0.08] shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="h-10 sm:h-14 w-48 sm:w-72 bg-white/[0.08] rounded-lg" />
            <div className="h-10 sm:h-14 w-40 sm:w-60 bg-white/[0.08] rounded-lg" />
            <div className="h-4 w-36 bg-white/[0.05] rounded mt-2" />
          </div>
        </div>

        {/* Poster Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`aspect-[2/3] rounded-xl bg-white/[0.04] border border-white/[0.06] ${
                i >= 4 ? 'hidden md:block' : i >= 2 ? 'hidden sm:block' : ''
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Resolve director info from either initialData or dynamic fetch
  const name =
    dynamicDirector?.name || fallbackName || 'Director';

  const nameParts = name.trim().split(' ');
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : name;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  const rawPhoto =
    dynamicDirector?.profile_path || initialData?.profilePath;
  const photoUrl = rawPhoto
    ? tmdb.getImageUrl(rawPhoto, 'w500')
    : FALLBACK_PORTRAIT;

  const totalFilmsCount =
    dynamicDirector?.stats.totalFilms ||
    initialData?.totalFilms ||
    initialData?.topFilms?.length ||
    0;

  const topFive = dynamicDirector?.topFilms.slice(0, 5) ||
    initialData?.topFilms?.slice(0, 5)?.map((f) => ({
      id: f.id,
      title: f.title,
      release_date: f.year ? `${f.year}-01-01` : '',
      poster_path: f.poster,
      vote_average: f.rating,
      backdrop_path: '',
      overview: '',
      genre_ids: [],
    })) ||
    [];

  return (
    <article className="group/row py-8 sm:py-10 border-b border-white/[0.07] last:border-b-0 transition-colors">
      {/* ── Row Header: Director Photo + Large Wide-Tracked Name ── */}
      <Link
        to={`/director/${id}`}
        aria-label={`View ${name}'s filmography`}
        className="group flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 mb-6 sm:mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542] rounded-2xl p-1"
      >
        {/* Portrait Photo (Grayscale by default, colorizes with golden border on hover) */}
        <div className="relative w-28 h-36 sm:w-36 sm:h-48 md:w-44 md:h-56 shrink-0 overflow-hidden rounded-2xl bg-[#140a0d] border border-[#c9a24b]/25 group-hover:border-[#f5c542] group-hover:shadow-[0_0_30px_rgba(245,197,66,0.3)] transition-all duration-500">
          <img
            src={photoUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover grayscale contrast-[1.05] brightness-95 group-hover:grayscale-0 group-hover:brightness-105 group-hover:scale-105 transition-all duration-700 ease-out"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_PORTRAIT;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

          {/* Quick badge */}
          {totalFilmsCount > 0 && (
            <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-[#c9a24b]/30 text-[9px] font-mono text-[#f5c542]">
              <Film className="w-2.5 h-2.5" />
              <span>{totalFilmsCount} films</span>
            </div>
          )}
        </div>

        {/* Large Wide-Tracked Name Heading */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#f5c542]">
              Director {era ? `· ${era}` : ''}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-white/40">
              <Star className="w-3 h-3 fill-[#f5c542] text-[#f5c542]" />
              Master of Cinema
            </span>
          </div>

          <h2 className="font-display font-extrabold uppercase tracking-[0.15em] text-3xl sm:text-5xl md:text-6xl text-white group-hover:text-[#f5c542] transition-colors leading-[1.05] flex flex-col">
            <span className="truncate">{firstName}</span>
            {lastName && <span className="truncate">{lastName}</span>}
          </h2>

          <p className="mt-2.5 flex items-center gap-2 text-xs sm:text-sm font-mono text-[#c9a24b]/80 group-hover:text-[#f5c542] transition-colors">
            <span>Explore full filmography</span>
            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </p>
        </div>
      </Link>

      {/* ── Top Movie Posters Row ── */}
      {topFive.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[11px] font-mono uppercase tracking-wider text-white/40">
              Key Works &amp; Masterpieces
            </p>
            <Link
              to={`/director/${id}`}
              className="text-[11px] font-mono text-[#c9a24b]/70 hover:text-[#f5c542] transition-colors"
            >
              All {totalFilmsCount} films →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
            {topFive.map((movie) => {
              const poster = movie.poster_path
                ? tmdb.getImageUrl(movie.poster_path, 'w500')
                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
              const year = movie.release_date ? movie.release_date.slice(0, 4) : '';
              const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;

              return (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.id}`}
                  className="group/poster block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542] rounded-xl"
                  title={`${movie.title} (${year})`}
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#140a0d] border border-white/[0.10] transition-all duration-300 group-hover/poster:border-[#f5c542] group-hover/poster:shadow-[0_10px_25px_rgba(245,197,66,0.25)] group-hover/poster:-translate-y-1.5">
                    <img
                      src={poster}
                      alt={movie.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/poster:scale-105"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none opacity-80 group-hover/poster:opacity-60 transition-opacity" />

                    {rating && Number(rating) > 0 && (
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/75 backdrop-blur-sm border border-[#c9a24b]/40 text-[#f5c542] text-[9px] font-mono font-bold">
                        <Star className="w-2.5 h-2.5 fill-[#f5c542]" />
                        <span>{rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 px-0.5">
                    <h3 className="font-display font-bold text-xs text-white/90 truncate group-hover/poster:text-[#f5c542] transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-[10px] font-mono text-[#c9a24b]/70 mt-0.5 truncate">
                      {year || 'Cinema'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
};
