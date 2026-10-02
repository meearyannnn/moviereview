// src/components/directors/DirectorRow.tsx — Curated Director Row (simplified)
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
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
const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

export const DirectorRow: React.FC<DirectorRowProps> = ({
  id,
  fallbackName,
  era,
  initialData,
}) => {
  const hasInitialData = Boolean(initialData?.topFilms?.length);

  // With preloaded data, skip the network request entirely
  const { data: dynamicDirector, isLoading } = useDirector(id, {
    enabled: !hasInitialData,
  });

  if (!hasInitialData && isLoading) {
    return (
      <div className="py-8 border-b border-white/[0.06] animate-pulse">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/[0.06]" />
          <div className="h-10 w-56 rounded-lg bg-white/[0.08]" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`aspect-[2/3] rounded-xl bg-white/[0.04] ${i >= 4 ? 'hidden md:block' : i >= 2 ? 'hidden sm:block' : ''
                }`}
            />
          ))}
        </div>
      </div>
    );
  }

  const name = dynamicDirector?.name || fallbackName || 'Director';

  const rawPhoto = dynamicDirector?.profile_path || initialData?.profilePath;
  const photoUrl = rawPhoto ? tmdb.getImageUrl(rawPhoto, 'w500') : FALLBACK_PORTRAIT;

  const totalFilms =
    dynamicDirector?.stats.totalFilms ||
    initialData?.totalFilms ||
    initialData?.topFilms?.length ||
    0;

  const topFive =
    dynamicDirector?.topFilms.slice(0, 5) ||
    initialData?.topFilms?.slice(0, 5).map((f) => ({
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

  const meta = [era, totalFilms > 0 ? `${totalFilms} films` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="py-8 sm:py-10 border-b border-white/[0.07] last:border-b-0">
      {/* Header: round portrait + one-line name */}
      <Link
        to={`/director/${id}`}
        aria-label={`View ${name}'s filmography`}
        className="group flex items-center gap-5 sm:gap-6 mb-6 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]"
      >
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_PORTRAIT;
          }}
          className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full object-cover grayscale ring-1 ring-[#c9a24b]/30 transition duration-500 group-hover:grayscale-0 group-hover:ring-[#f5c542] group-hover:shadow-[0_0_30px_rgba(245,197,66,0.3)]"
        />

        <div className="min-w-0 flex-1">
          <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-5xl text-white leading-none truncate transition-colors group-hover:text-[#f5c542]">
            {name}
          </h2>
          {meta && <p className="mt-2 text-sm text-white/50">{meta}</p>}
        </div>

        <ChevronRight className="hidden sm:block w-6 h-6 text-white/30 transition group-hover:text-[#f5c542] group-hover:translate-x-1" />
      </Link>

      {/* Posters */}
      {topFive.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
          {topFive.map((movie, i) => {
            const poster = movie.poster_path
              ? tmdb.getImageUrl(movie.poster_path, 'w500')
              : FALLBACK_POSTER;
            const year = movie.release_date?.slice(0, 4);
            const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;

            return (
              <Link
                key={movie.id}
                to={`/movie/${movie.id}`}
                title={year ? `${movie.title} (${year})` : movie.title}
                className={`group/poster block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542] ${i >= 4 ? 'hidden md:block' : i >= 2 ? 'hidden sm:block' : ''
                  }`}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#140a0d] ring-1 ring-white/10 transition duration-300 group-hover/poster:ring-[#f5c542] group-hover/poster:-translate-y-1 group-hover/poster:shadow-[0_12px_30px_rgba(245,197,66,0.25)]">
                  <img
                    src={poster}
                    alt={movie.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_POSTER;
                    }}
                    className="w-full h-full object-cover"
                  />
                  {rating && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[#f5c542] text-[11px] font-semibold">
                      <Star className="w-3 h-3 fill-current stroke-none" />
                      {rating}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-white/90 truncate group-hover/poster:text-[#f5c542] transition-colors">
                  {movie.title}
                </h3>
                {year && <p className="text-xs text-white/40">{year}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </article>
  );
};