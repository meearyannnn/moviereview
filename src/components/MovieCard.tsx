import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { memo, useState, useCallback } from 'react';

interface MovieCardProps {
  movie: Movie;
  type?: 'movie' | 'tv';
}

const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#060810]';

export const MovieCard = memo(
  ({ movie, type = 'movie' }: MovieCardProps) => {
    const navigate = useNavigate();
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const mediaType = movie.media_type || type;

    const title = movie.title || movie.name || 'Untitled';
    const releaseDate = movie.release_date || movie.first_air_date;
    const isReleased = releaseDate ? new Date(releaseDate) <= new Date() : true;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
    const hasRating = !!rating && Number(rating) > 0;

    const handleNavigate = useCallback(() => {
      navigate(`/${mediaType}/${movie.id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [navigate, mediaType, movie.id]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNavigate();
      }
    };

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.src = FALLBACK_POSTER;
      setIsImageLoaded(true);
    }, []);

    return (
      <div
        role="link"
        tabIndex={0}
        aria-label={`${title}${year ? `, ${year}` : ''}`}
        onClick={handleNavigate}
        onKeyDown={handleKeyDown}
        className={`group relative flex cursor-pointer select-none flex-col touch-manipulation ${ring}`}
      >
        {/* ── Poster ── */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-900 border border-white/[0.06] group-hover:border-white/25 transition-colors duration-200">
          {/* Skeleton while loading */}
          {!isImageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-white/[0.05]" />
          )}

          <img
            src={tmdb.getImageUrl(movie.poster_path, 'w342')}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={handleImageError}
            onLoad={() => setIsImageLoaded(true)}
            className={`h-full w-full object-cover pointer-events-none select-none transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
          />

          {/* Top-right badge: rating or upcoming */}
          <div className="pointer-events-none absolute right-2 top-2">
            {isReleased ? (
              hasRating && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-sm font-display border border-white/10">
                  <Star className="h-2.5 w-2.5 fill-red-500 text-red-500" />
                  {rating}
                </span>
              )
            ) : (
              <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[9px] font-black text-white font-display uppercase tracking-wide shadow-sm">
                Upcoming
              </span>
            )}
          </div>
        </div>

        {/* ── Metadata ── */}
        <div className="mt-2 px-0.5">
          <h3 className="line-clamp-1 font-display text-xs sm:text-sm font-bold leading-snug text-white/85 transition-colors group-hover:text-white">
            {title}
          </h3>
          <p className="mt-0.5 flex items-center justify-between text-[11px] text-white/35 font-sans">
            <span>{year && !isNaN(year) ? year : 'TBA'}</span>
            <span>{mediaType === 'tv' ? 'Series' : 'Movie'}</span>
          </p>
        </div>
      </div>
    );
  },
  (prev, next) => prev.movie.id === next.movie.id && prev.type === next.type
);

MovieCard.displayName = 'MovieCard';
