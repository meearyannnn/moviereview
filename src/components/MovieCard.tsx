// src/components/MovieCard.tsx — Clean poster card
import { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { toast } from 'sonner';

export interface MovieCardProps {
  movie: Movie;
  type?: 'movie' | 'tv';
  className?: string;
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  53: 'Thriller', 10752: 'War', 37: 'Western', 10759: 'Action', 10762: 'Kids',
  10764: 'Reality', 10765: 'Sci-Fi', 10768: 'War',
};

export const MovieCard = memo(
  ({ movie, type = 'movie', className = '' }: MovieCardProps) => {
    const { isInWatchlist, toggleWatchlist } = useWatchlist();

    const isTV =
      type === 'tv' || movie.media_type === 'tv' || Boolean(movie.first_air_date && !movie.release_date);
    const mediaType: 'movie' | 'tv' = isTV ? 'tv' : 'movie';

    const title = movie.title || movie.name || 'Untitled';
    const releaseDate = movie.release_date || movie.first_air_date || '';
    const year = releaseDate ? releaseDate.slice(0, 4) : ''; // no made-up year when TMDB has none
    const genre = movie.genre_ids?.[0] ? GENRE_MAP[movie.genre_ids[0]] : undefined;
    const meta = [year, genre].filter(Boolean).join(' · ');

    const rating = movie.vote_average && movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;

    // poster_path first, backdrop as a fallback
    const rawPath = movie.poster_path || movie.backdrop_path;
    const isExternal = !!rawPath?.startsWith('http');
    const posterUrl = rawPath ? (isExternal ? rawPath : tmdb.getImageUrl(rawPath, 'w342')) : '/placeholder.svg';
    const srcSet =
      rawPath && !isExternal
        ? `${tmdb.getImageUrl(rawPath, 'w185')} 185w, ${tmdb.getImageUrl(rawPath, 'w342')} 342w, ${tmdb.getImageUrl(rawPath, 'w500')} 500w`
        : undefined;

    const saved = isInWatchlist(movie.id);

    const handleSave = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleWatchlist({
          id: movie.id,
          title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          vote_average: movie.vote_average,
          release_date: releaseDate,
          media_type: mediaType,
        });
        if (added) toast.success(`Saved "${title}" to Watch Later`);
        else toast.info(`Removed "${title}" from Watch Later`);
      },
      [toggleWatchlist, movie, title, releaseDate, mediaType]
    );

    return (
      <div className={`group relative ${className}`}>
        {/* A real link: keyboard, middle-click and "open in new tab" all work */}
        <Link
          to={`/${mediaType}/${movie.id}`}
          aria-label={`${title}${year ? ` (${year})` : ''}`}
          draggable={false}
          className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]"
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#1a1116] ring-1 ring-white/[0.08] transition duration-300 group-hover:ring-[#f5c542]/60 motion-safe:group-hover:-translate-y-1">
            <img
              src={posterUrl}
              srcSet={srcSet}
              sizes="(max-width: 640px) 160px, (max-width: 1024px) 240px, 320px"
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/placeholder.svg';
              }}
              className="h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {isTV && (
              <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
                TV
              </span>
            )}
          </div>

          <div className="mt-3 px-0.5">
            <h3
              className="truncate text-sm font-semibold text-white transition-colors group-hover:text-[#f5c542] sm:text-base"
              title={title}
            >
              {title}
            </h3>
            <p className="mt-0.5 flex items-center justify-between gap-2 text-xs text-white/45">
              <span className="truncate">{meta || 'Release date TBA'}</span>
              {rating && (
                <span className="inline-flex shrink-0 items-center gap-1 text-white/70">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {rating}
                </span>
              )}
            </p>
          </div>
        </Link>

        {/* Save: beside the link rather than inside it. Always visible once saved, and on touch screens */}
        <button
          type="button"
          onClick={handleSave}
          aria-label={saved ? 'Remove from Watch Later' : 'Save to Watch Later'}
          aria-pressed={saved}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition focus-visible:opacity-100 ${saved
              ? 'bg-[#f5c542] text-[#1c120c]'
              : 'bg-black/65 text-white opacity-0 hover:bg-white hover:text-black group-hover:opacity-100 [@media(hover:none)]:opacity-100'
            }`}
        >
          <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>
    );
  },
  (prev, next) =>
    prev.movie.id === next.movie.id && prev.type === next.type && prev.className === next.className
);

MovieCard.displayName = 'MovieCard';