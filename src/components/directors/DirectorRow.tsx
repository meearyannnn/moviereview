// src/components/directors/DirectorRow.tsx — Director row with a 6-film mini grid (mobile-first)
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

const FILM_COUNT = 6;

const FALLBACK_PORTRAIT =
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80';
const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80';

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]/70';

// Mobile: 3 columns x 2 rows. Tablet and up: all 6 in one row.
const GRID = 'grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3';

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
      <div className="border-b border-white/[0.06] py-6 sm:py-8" aria-busy="true">
        <div className="mb-4 flex items-center gap-3 sm:gap-4">
          <div className="h-14 w-14 animate-pulse rounded-full bg-white/[0.06] motion-reduce:animate-none sm:h-20 sm:w-20" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-white/[0.08] motion-reduce:animate-none" />
        </div>
        <div className={GRID}>
          {Array.from({ length: FILM_COUNT }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-white/[0.05] motion-reduce:animate-none" />
          ))}
        </div>
      </div>
    );
  }

  const name = dynamicDirector?.name || fallbackName || 'Director';

  const rawPhoto = dynamicDirector?.profile_path || initialData?.profilePath;
  const photoUrl = rawPhoto ? tmdb.getImageUrl(rawPhoto, 'w342') : FALLBACK_PORTRAIT;

  const totalFilms =
    dynamicDirector?.stats.totalFilms ||
    initialData?.totalFilms ||
    initialData?.topFilms?.length ||
    0;

  const films =
    dynamicDirector?.topFilms.slice(0, FILM_COUNT) ||
    initialData?.topFilms?.slice(0, FILM_COUNT).map((f) => ({
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

  const meta = [era, totalFilms > 0 ? `${totalFilms} films` : null].filter(Boolean).join(' · ');

  return (
    <article className="border-b border-white/[0.07] py-6 [contain-intrinsic-size:auto_300px] [content-visibility:auto] last:border-b-0 sm:py-8">
      {/* Header: portrait + name */}
      <Link
        to={`/director/${id}`}
        aria-label={`View ${name}'s filmography`}
        className={`group mb-4 flex items-center gap-3 rounded-2xl sm:gap-4 ${ring}`}
      >
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_PORTRAIT;
          }}
          className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-[#c9a24b]/30 transition duration-500 group-hover:ring-[#f5c542] sm:h-20 sm:w-20 sm:grayscale sm:group-hover:grayscale-0"
        />

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-2xl font-extrabold leading-tight tracking-tight text-white transition-colors group-hover:text-[#f5c542] sm:text-4xl">
            {name}
          </h2>
          {meta && <p className="mt-0.5 text-sm text-white/45">{meta}</p>}
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-[#f5c542] sm:h-6 sm:w-6" />
      </Link>

      {/* Six films */}
      {films.length > 0 && (
        <div className={GRID}>
          {films.map((movie) => {
            const poster = movie.poster_path
              ? tmdb.getImageUrl(movie.poster_path, 'w342')
              : FALLBACK_POSTER;
            const year = movie.release_date?.slice(0, 4);
            const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;

            return (
              <Link
                key={movie.id}
                to={`/movie/${movie.id}`}
                title={year ? `${movie.title} (${year})` : movie.title}
                className={`group/poster block min-w-0 rounded-lg ${ring}`}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[#140a0d] ring-1 ring-white/10 transition duration-300 group-hover/poster:-translate-y-0.5 group-hover/poster:ring-[#f5c542] group-active/poster:scale-[0.98]">
                  <img
                    src={poster}
                    alt={movie.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_POSTER;
                    }}
                    className="h-full w-full object-cover"
                  />
                  {rating && (
                    <span className="absolute right-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-[#f5c542] backdrop-blur-sm">
                      <Star className="h-2.5 w-2.5 fill-current stroke-none" />
                      {rating}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 truncate text-xs font-medium text-white/85 transition-colors group-hover/poster:text-[#f5c542]">
                  {movie.title}
                </p>
                {year && <p className="text-[11px] text-white/40">{year}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </article>
  );
};