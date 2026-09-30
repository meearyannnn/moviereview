// src/components/MovieCard.tsx — "The Box Office" Admission Ticket Card
import React, { useState, useRef, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Play, Heart } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { toast } from 'sonner';

export interface MovieCardProps {
  movie: Movie;
  type?: 'movie' | 'tv';
  className?: string;
}

const GENRE_MAP: Record<number, string> = {
  28: 'ACTION',
  12: 'ADVENTURE',
  16: 'ANIMATION',
  35: 'COMEDY',
  80: 'CRIME',
  99: 'DOCS',
  18: 'DRAMA',
  10751: 'FAMILY',
  14: 'FANTASY',
  36: 'HISTORY',
  27: 'HORROR',
  10402: 'MUSIC',
  9648: 'MYSTERY',
  10749: 'ROMANCE',
  878: 'SCI-FI',
  53: 'THRILLER',
  10752: 'WAR',
  37: 'WESTERN',
  10759: 'ACTION',
  10765: 'SCI-FI',
  10768: 'WAR',
};

const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

export const MovieCard = memo(
  ({ movie, type = 'movie', className = '' }: MovieCardProps) => {
    const navigate = useNavigate();
    const cardRef = useRef<HTMLDivElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const { isInWatchlist, toggleWatchlist } = useWatchlist();

    const isTV =
      type === 'tv' ||
      movie.media_type === 'tv' ||
      Boolean(movie.first_air_date && !movie.release_date);
    const mediaType: 'movie' | 'tv' = isTV ? 'tv' : 'movie';

    const title = movie.title || movie.name || 'Untitled';
    const releaseDate = movie.release_date || movie.first_air_date || '';
    const year = releaseDate ? releaseDate.slice(0, 4) : '2026';

    const firstGenreId = movie.genre_ids?.[0];
    const genreName = firstGenreId ? (GENRE_MAP[firstGenreId] || 'CINEMA') : 'CINEMA';

    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
    const hasRating = !!rating && Number(rating) > 0;
    const posterUrl = movie.poster_path
      ? (movie.poster_path.startsWith('http')
          ? movie.poster_path
          : tmdb.getImageUrl(movie.poster_path, 'w500'))
      : FALLBACK_POSTER;

    const inWatchlist = isInWatchlist(movie.id);

    // Formatted ticket serial number (e.g. No. 5102)
    const ticketNo = `No. ${String(movie.id).slice(-4).padStart(4, '0')}`;

    // 3D tilt calculation on cursor move
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((centerY - y) / centerY) * 4.5;
      const rotateY = ((x - centerX) / centerX) * 4.5;

      setTilt({ x: rotateX, y: rotateY });
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      setTilt({ x: 0, y: 0 });
    };

    const handleClick = useCallback(() => {
      navigate(`/${mediaType}/${movie.id}`);
    }, [navigate, mediaType, movie.id]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    };

    const handleReserve = (e: React.MouseEvent) => {
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

      if (added) {
        toast.success(`Seat reserved for "${title}"`, {
          description: 'Stamped into your admission collection',
        });
      } else {
        toast.info(`Reservation released for "${title}"`);
      }
    };

    return (
      <div
        ref={cardRef}
        role="link"
        tabIndex={0}
        aria-label={`${title} (${year})`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`group cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] rounded-2xl transition-all duration-300 ease-out flex flex-col ${className}`}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${
            isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)'
          }`,
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out',
        }}
      >
        {/* ── Admission Ticket Container ── */}
        <div className="relative rounded-2xl overflow-hidden bg-[#140c10] border border-[#c9a24b]/20 shadow-xl group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] group-hover:border-[#c9a24b]/50 transition-all flex flex-col w-full">
          {/* ── Top Portion: 2:3 Movie Poster ── */}
          <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0c090e]">
            <img
              src={posterUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              draggable={false}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_POSTER;
                setImageLoaded(true);
              }}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:brightness-105 group-hover:scale-[1.03] ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-white/[0.04]" />
            )}

            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Rating Chip: Popcorn Yellow in corner */}
            {hasRating && (
              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5c542] text-[#1c120c] font-mono font-bold text-[10px] shadow-lg shadow-black/60">
                <Star className="w-2.5 h-2.5 fill-current stroke-none" />
                <span>{rating}</span>
              </div>
            )}

            {/* "Reserve Seat" Heart Button on hover */}
            <button
              type="button"
              onClick={handleReserve}
              aria-label={inWatchlist ? 'Cancel reservation' : 'Reserve seat'}
              className={`absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                inWatchlist
                  ? 'bg-[#f5c542] text-[#1c120c] shadow-md shadow-[#f5c542]/50'
                  : 'bg-black/60 text-white/80 hover:text-white hover:bg-black/90 opacity-0 group-hover:opacity-100 backdrop-blur-sm'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-current' : ''}`} />
            </button>

            {/* Play Icon in center on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-[#c9a24b] text-[#1c120c] flex items-center justify-center shadow-lg shadow-black/60 transform group-hover:scale-105 transition-transform">
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              </div>
            </div>
          </div>

          {/* ── Perforated Tear Line with Circular Notches ── */}
          <div className="relative h-4 bg-[#f3e9d2] flex items-center justify-center overflow-hidden shrink-0 border-t border-[#c9a24b]/30">
            {/* Left Circular Punch Notch */}
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#0a0608] border border-black/40 z-20" />

            {/* Dashed Tear Line */}
            <div className="w-full border-t border-dashed border-[#2a1a14]/30 mx-4" />

            {/* Right Circular Punch Notch */}
            <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#0a0608] border border-black/40 z-20" />
          </div>

          {/* ── Bottom Portion: Warm Cream Ticket Stub with Espresso Ink ── */}
          <div className="relative bg-[#f3e9d2] px-3.5 pt-1.5 pb-3 text-[#2a1a14] flex flex-col justify-between min-h-[92px] transition-transform duration-300">
            {/* Screen & Admit One header */}
            <div className="flex items-center justify-between text-[9px] font-mono tracking-wider font-extrabold uppercase">
              <span className="text-[#2a1a14]/70">
                {isTV ? 'SCREEN 2 · TV' : 'SCREEN 1 · MOVIE'}
              </span>
              <span className="border border-[#c9a24b] text-[#8c6b1c] px-1 py-0.2 rounded text-[8px] font-mono font-bold tracking-widest bg-[#c9a24b]/10">
                ADMIT ONE
              </span>
            </div>

            {/* Film Title */}
            <div className="my-1">
              <h3 className="font-display font-bold text-xs leading-tight text-[#2a1a14] truncate group-hover:text-black">
                {title}
              </h3>
              <p className="text-[10px] font-mono tracking-wider text-[#2a1a14]/65 uppercase mt-0.5 truncate">
                {year} · {genreName}
              </p>
            </div>

            {/* Ticket Number & Mini Barcode */}
            <div className="flex items-end justify-between pt-1 border-t border-[#2a1a14]/15 mt-0.5">
              <span className="text-[9px] font-mono font-medium text-[#2a1a14]/60">
                {ticketNo}
              </span>

              {/* Mini SVG Barcode */}
              <div className="flex items-center gap-[1.5px] opacity-75 h-3">
                <span className="w-[1.5px] h-3 bg-[#2a1a14]" />
                <span className="w-[1px] h-3 bg-[#2a1a14]" />
                <span className="w-[2px] h-3 bg-[#2a1a14]" />
                <span className="w-[1px] h-2 bg-[#2a1a14]" />
                <span className="w-[1.5px] h-3 bg-[#2a1a14]" />
                <span className="w-[1px] h-3 bg-[#2a1a14]" />
                <span className="w-[2.5px] h-3 bg-[#2a1a14]" />
                <span className="w-[1px] h-2 bg-[#2a1a14]" />
                <span className="w-[1.5px] h-3 bg-[#2a1a14]" />
                <span className="w-[2px] h-3 bg-[#2a1a14]" />
                <span className="w-[1px] h-3 bg-[#2a1a14]" />
                <span className="w-[2px] h-3 bg-[#2a1a14]" />
              </div>
            </div>

            {/* Reserved Stamp (Shown when added to watchlist) */}
            {inWatchlist && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <span className="border-2 border-[#8c1c2b] text-[#8c1c2b] font-mono font-black text-xs px-2.5 py-0.5 rounded tracking-widest uppercase rotate-[-12deg] bg-[#f3e9d2]/90 shadow-md animate-in zoom-in-90 duration-200">
                  RESERVED
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => prev.movie.id === next.movie.id && prev.type === next.type
);

MovieCard.displayName = 'MovieCard';

