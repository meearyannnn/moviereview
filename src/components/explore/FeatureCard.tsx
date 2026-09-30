// src/components/explore/FeatureCard.tsx — Marquee Wide Feature Ticket (Spans 2 columns)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Heart, Star, Sparkles } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { toast } from 'sonner';

interface FeatureCardProps {
  item: Movie;
  typeOverride?: 'movie' | 'tv';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ item, typeOverride }) => {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const isTV = typeOverride === 'tv' || item.media_type === 'tv' || Boolean(item.first_air_date && !item.release_date);
  const mediaType: 'movie' | 'tv' = isTV ? 'tv' : 'movie';

  const title = item.title || item.name || 'Featured Title';
  const dateStr = item.release_date || item.first_air_date || '';
  const year = dateStr ? dateStr.slice(0, 4) : '';
  const FALLBACK_BACKDROP =
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1280&q=80';
  const backdropUrl = item.backdrop_path
    ? tmdb.getImageUrl(item.backdrop_path, 'original')
    : item.poster_path
    ? tmdb.getImageUrl(item.poster_path, 'original')
    : FALLBACK_BACKDROP;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const inWatchlist = isInWatchlist(item.id);

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggleWatchlist({
      id: item.id,
      title,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average,
      release_date: dateStr,
      media_type: mediaType,
    });
    if (added) toast.success(`Seat reserved for "${title}"`);
    else toast.info(`Reservation released for "${title}"`);
  };

  return (
    <div
      onClick={() => navigate(`/${mediaType}/${item.id}`)}
      className="col-span-2 relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-[#c9a24b]/20 bg-[#140c10] group cursor-pointer transition-all duration-300 hover:border-[#c9a24b]/50 hover:shadow-[0_16px_40px_rgba(201,162,75,0.18)] hover:-translate-y-1"
    >
      {/* Background image */}
      <img
        src={backdropUrl || FALLBACK_BACKDROP}
        alt={title}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_BACKDROP;
        }}
        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
      />

      {/* Cinematic Vignettes */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0608]/95 via-[#0a0608]/65 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0608] via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-3.5 sm:p-7 max-w-lg">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 rounded-full text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest bg-[#c9a24b]/20 text-[#f5c542] border border-[#c9a24b]/35">
            <Sparkles className="w-2.5 h-2.5" />
            Marquee Feature
          </span>

          <span className="text-[10px] sm:text-[11px] font-mono text-white/50">
            {isTV ? 'SCREEN 2 · TV' : 'SCREEN 1 · MOVIE'} {year ? `· ${year}` : ''}
          </span>

          {rating && Number(rating) > 0 && (
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-bold text-[#f5c542] ml-auto">
              <Star className="w-3 h-3 fill-current stroke-none" />
              {rating}
            </span>
          )}
        </div>

        <h3 className="font-display font-extrabold text-sm sm:text-xl text-white tracking-tight leading-tight line-clamp-1 group-hover:text-[#f5c542] transition-colors">
          {title}
        </h3>

        {item.overview && (
          <p className="mt-1.5 text-xs text-white/65 line-clamp-2 leading-relaxed font-light hidden sm:block">
            {item.overview}
          </p>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-2 mt-2.5 sm:mt-3.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/${mediaType}/${item.id}`);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 rounded-lg bg-gradient-to-r from-[#c9a24b] to-[#e5b95a] text-[#1c120c] font-display font-extrabold text-[11px] sm:text-xs shadow-md shadow-[#c9a24b]/20 hover:brightness-110 transition-all"
          >
            <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
            <span>Show Details</span>
          </button>

          <button
            onClick={handleToggleWatchlist}
            className={`p-1.5 sm:p-2 rounded-lg border transition-all ${
              inWatchlist
                ? 'bg-[#f5c542] border-[#f5c542] text-[#1c120c] shadow-md shadow-[#f5c542]/30'
                : 'border-[#c9a24b]/30 bg-black/40 text-white/70 hover:text-white hover:border-[#c9a24b]/60'
            }`}
            title={inWatchlist ? 'Reserved' : 'Reserve seat'}
          >
            <Heart className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
