import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Star, Calendar, Bookmark, Check, Clapperboard } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { soundEffects } from '@/lib/soundEffects';

interface QuickPeekModalProps {
  movie: Movie | null;
  onClose: () => void;
  type?: 'movie' | 'tv';
}

export const QuickPeekModal = ({ movie, onClose, type = 'movie' }: QuickPeekModalProps) => {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    if (movie) {
      soundEffects.playSwoosh();
    }
  }, [movie]);

  if (!movie) return null;

  const mediaType = movie.media_type || type;
  const inWatchlist = isInWatchlist(movie.id);
  const year = movie.release_date || movie.first_air_date ? new Date(movie.release_date || movie.first_air_date || '').getFullYear() : null;
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;

  const handleWatch = () => {
    onClose();
    navigate(`/${mediaType}/${movie.id}`);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playChime();
    toggleWatchlist({
      id: movie.id,
      title: movie.title || movie.name || 'Untitled',
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date || movie.first_air_date,
      media_type: mediaType as 'movie' | 'tv',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden bg-[#111520] border border-white/15 shadow-2xl shadow-black animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Backdrop Banner */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-neutral-900">
          <img
            src={tmdb.getImageUrl(movie.backdrop_path || movie.poster_path, 'original')}
            alt={movie.title || movie.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1118] via-[#0e1118]/60 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/15 flex items-center justify-center transition-all hover:scale-110"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Media Chip */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5c542] text-[#1c120c] font-black text-[10px] uppercase tracking-wider shadow-md">
            <Clapperboard className="w-3 h-3 text-[#1c120c]" />
            Quick Preview
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 -mt-6 relative z-10">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#c9a24b]/20 text-[#f3e9d2] border border-[#c9a24b]/30">
              {mediaType === 'tv' ? 'TV Series' : 'Cinema Film'}
            </span>
            {rating && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-[#c9a24b]/30 text-[#f5c542] font-black text-xs">
                <span className="text-[9px] uppercase font-mono font-black px-1 rounded bg-[#c9a24b]/20 text-[#f5c542]">TMDB</span>
                <Star className="w-3 h-3 fill-[#f5c542] text-[#f5c542]" />
                <span>{rating}</span>
              </div>
            )}
            {year && (
              <div className="flex items-center gap-1 text-xs text-white/60 font-mono">
                <Calendar className="w-3 h-3 text-[#c9a24b]" />
                <span>{year}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-3">
            {movie.title || movie.name}
          </h3>

          {/* Overview */}
          <p className="text-white/70 text-sm font-light leading-relaxed line-clamp-4 mb-6">
            {movie.overview || 'No storyline summary available for this title.'}
          </p>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#c9a24b]/20">
            <button
              onClick={handleWatch}
              className="btn-cinema-gold flex-1 text-xs sm:text-sm py-3 flex items-center justify-center gap-2"
            >
              <Clapperboard className="w-4 h-4 text-[#1c120c]" />
              <span>View & Review</span>
            </button>

            <button
              onClick={handleToggle}
              className={`p-3 rounded-full border transition-all ${
                inWatchlist
                  ? 'bg-[#f5c542]/20 border-[#f5c542] text-[#f5c542]'
                  : 'bg-white/5 border-white/15 text-white hover:bg-white/10'
              }`}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
