import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdb, type Movie } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { soundEffects } from '@/lib/soundEffects';
import { 
  X, 
  Flame, 
  Heart, 
  Play, 
  RotateCcw, 
  Star, 
  Sparkles,
  Info,
  Calendar,
  ThumbsDown
} from 'lucide-react';

interface ReelSwiperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReelSwiperModal = ({ isOpen, onClose }: ReelSwiperModalProps) => {
  const navigate = useNavigate();
  const { addToWatchlist } = useWatchlist();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<'pass' | 'save' | 'stream' | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Load movies
  const loadDeck = useCallback(async () => {
    try {
      setLoading(true);
      const page = Math.floor(Math.random() * 5) + 1;
      const data = await tmdb.discover('movie', `sort_by=popularity.desc&vote_count.gte=300&page=${page}`);
      const valid = (data.results || []).filter((m: Movie) => m.poster_path && m.backdrop_path);
      setMovies(valid);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to load swiper deck', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadDeck();
    }
  }, [isOpen, loadDeck]);

  const currentMovie = movies[currentIndex];
  const nextMovie = movies[currentIndex + 1];

  // Actions
  const handlePass = useCallback(() => {
    if (!currentMovie) return;
    soundEffects.playHover();
    setActionFeedback('pass');
    setTimeout(() => {
      setActionFeedback(null);
      setDragOffset({ x: 0, y: 0 });
      setCurrentIndex(prev => prev + 1);
    }, 200);
  }, [currentMovie]);

  const handleSave = useCallback(() => {
    if (!currentMovie) return;
    soundEffects.playChime();
    addToWatchlist({
      id: currentMovie.id,
      title: currentMovie.title || currentMovie.name || 'Untitled',
      poster_path: currentMovie.poster_path,
      backdrop_path: currentMovie.backdrop_path,
      vote_average: currentMovie.vote_average,
      release_date: currentMovie.release_date || currentMovie.first_air_date,
      media_type: 'movie'
    });
    setSavedCount(c => c + 1);
    setActionFeedback('save');
    setTimeout(() => {
      setActionFeedback(null);
      setDragOffset({ x: 0, y: 0 });
      setCurrentIndex(prev => prev + 1);
    }, 200);
  }, [currentMovie, addToWatchlist]);

  const handleStream = useCallback(() => {
    if (!currentMovie) return;
    soundEffects.playChime();
    setActionFeedback('stream');
    setTimeout(() => {
      onClose();
      navigate(`/movie/${currentMovie.id}`);
    }, 250);
  }, [currentMovie, onClose, navigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePass();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'ArrowUp' || e.code === 'Space') {
        e.preventDefault();
        handleStream();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePass, handleSave, handleStream, onClose]);

  // Mouse / Touch Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Thresholds
    if (dragOffset.x > 120) {
      handleSave();
    } else if (dragOffset.x < -120) {
      handlePass();
    } else if (dragOffset.y < -100) {
      handleStream();
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-[90vh] max-h-[760px] flex flex-col justify-between">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#c9a24b]/15 border border-[#c9a24b]/30 flex items-center justify-center">
              <Flame className="w-5 h-5 text-[#f5c542] animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-white tracking-wide">Reel Swiper</h2>
              <p className="text-[11px] text-[#c9a24b]/70 font-mono">
                {savedCount > 0 ? `Saved ${savedCount} films to Watchlist` : 'Swipe to match your mood'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playHover();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* -- Card Deck Area -- */}
        <div className="relative flex-1 my-2 flex items-center justify-center select-none overflow-hidden touch-none">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-[#c9a24b]/20 border-t-[#f5c542] animate-spin" />
              <span className="text-xs text-white/40 font-mono">Shuffling Reel Deck...</span>
            </div>
          ) : !currentMovie ? (
            <div className="text-center p-8 bg-[#140a0d] border border-[#c9a24b]/20 rounded-3xl">
              <Sparkles className="w-10 h-10 text-[#f5c542] mx-auto mb-3 animate-pulse" />
              <h3 className="text-xl font-display font-bold text-white mb-2">Reel Deck Cleared!</h3>
              <p className="text-xs text-white/60 mb-6">
                You've reviewed this batch. Ready to deal another stack of cinema gems?
              </p>
              <button
                onClick={loadDeck}
                className="px-6 py-2.5 rounded-2xl bg-[#f5c542] hover:bg-[#c9a24b] text-[#1c120c] font-black text-xs flex items-center gap-2 mx-auto transition-all shadow-lg shadow-[#f5c542]/25"
              >
                <RotateCcw className="w-4 h-4" />
                Shuffle New Batch
              </button>
            </div>
          ) : (
            <>
              {/* Next card in background */}
              {nextMovie && (
                <div 
                  className="absolute inset-x-4 inset-y-2 rounded-3xl bg-[#0b0d14] border border-white/10 overflow-hidden shadow-2xl scale-95 opacity-50 pointer-events-none transition-all"
                >
                  <img 
                    src={tmdb.getImageUrl(nextMovie.poster_path, 'w500')} 
                    alt={nextMovie.title} 
                    className="w-full h-full object-cover brightness-50 blur-[2px]"
                  />
                </div>
              )}

              {/* Active top card */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`absolute inset-x-2 inset-y-0 rounded-3xl bg-[#111520] border border-white/15 overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing transition-transform ${
                  !isDragging && !actionFeedback ? 'duration-300 ease-out' : 'duration-75'
                }`}
                style={{
                  touchAction: 'none',
                  transform: actionFeedback === 'save'
                    ? 'translateX(400px) rotate(25deg)'
                    : actionFeedback === 'pass'
                    ? 'translateX(-400px) rotate(-25deg)'
                    : actionFeedback === 'stream'
                    ? 'translateY(-400px) scale(0.9)'
                    : `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)'
                }}
              >
                {/* Poster Background */}
                <img
                  src={tmdb.getImageUrl(currentMovie.poster_path, 'original')}
                  alt={currentMovie.title}
                  className="w-full h-full object-cover pointer-events-none"
                />

                {/* Deep Cinema Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0608] via-[#0a0608]/50 to-transparent pointer-events-none" />

                {/* Feedback Badges (Like / Pass / Stream) */}
                {dragOffset.x > 50 && (
                  <div className="absolute top-8 left-8 border-4 border-emerald-400 bg-emerald-500/20 backdrop-blur-md text-emerald-400 font-display font-black text-2xl px-4 py-1 rounded-2xl rotate-[-15deg] shadow-lg animate-in zoom-in-75">
                    SAVE
                  </div>
                )}
                {dragOffset.x < -50 && (
                  <div className="absolute top-8 right-8 border-4 border-rose-500 bg-rose-500/20 backdrop-blur-md text-rose-400 font-display font-black text-2xl px-4 py-1 rounded-2xl rotate-[15deg] shadow-lg animate-in zoom-in-75">
                    PASS
                  </div>
                )}
                {dragOffset.y < -50 && Math.abs(dragOffset.x) < 50 && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 border-4 border-[#f5c542] bg-[#f5c542]/20 backdrop-blur-md text-[#f5c542] font-display font-black text-xl px-4 py-1 rounded-2xl shadow-lg animate-in zoom-in-75">
                    EXPLORE
                  </div>
                )}

                {/* Card Content Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-6 pointer-events-none">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1 bg-[#c9a24b]/20 border border-[#c9a24b]/30 text-[#f5c542] text-xs font-mono font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md">
                      <Star className="w-3 h-3 fill-[#f5c542] text-[#f5c542]" />
                      {currentMovie.vote_average?.toFixed(1)}
                    </span>
                    {(currentMovie.release_date || currentMovie.first_air_date) && (
                      <span className="flex items-center gap-1 bg-white/10 text-white/70 text-xs font-mono px-2.5 py-0.5 rounded-full backdrop-blur-md">
                        <Calendar className="w-3 h-3 text-white/50" />
                        {new Date(currentMovie.release_date || currentMovie.first_air_date || '').getFullYear()}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-display font-black text-white leading-tight mb-2 drop-shadow-md">
                    {currentMovie.title || currentMovie.name}
                  </h3>

                  <p className="text-xs text-white/70 line-clamp-3 leading-relaxed mb-4 font-sans drop-shadow">
                    {currentMovie.overview}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* -- Bottom Controls -- */}
        <div className="px-4 py-3 flex items-center justify-center gap-6">
          {/* Pass Button */}
          <button
            onClick={handlePass}
            disabled={!currentMovie}
            className="w-14 h-14 rounded-full bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/50 flex items-center justify-center text-white/60 hover:text-rose-400 transition-all active:scale-90 shadow-xl group"
            title="Pass (? Arrow)"
          >
            <ThumbsDown className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>

          {/* Instant Explore Button */}
          <button
            onClick={handleStream}
            disabled={!currentMovie}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-amber-400/25 group"
            title="Explore & Review (? Arrow / Space)"
          >
            <Star className="w-7 h-7 fill-black group-hover:scale-110 transition-transform" />
          </button>

          {/* Save to Watchlist Button */}
          <button
            onClick={handleSave}
            disabled={!currentMovie}
            className="w-14 h-14 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 flex items-center justify-center text-white/60 hover:text-emerald-400 transition-all active:scale-90 shadow-xl group"
            title="Save to Watchlist (? Arrow)"
          >
            <Heart className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Keyboard shortcut legend */}
        <div className="pb-1 text-center text-[10px] font-mono text-white/40 flex items-center justify-center gap-3">
          <span>? Pass</span>
          <span>�</span>
          <span>? Explore & Review</span>
          <span>�</span>
          <span>? Save to Watchlist</span>
        </div>

      </div>
    </div>
  );
};
