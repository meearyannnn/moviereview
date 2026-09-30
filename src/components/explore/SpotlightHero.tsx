// src/components/explore/SpotlightHero.tsx — Cinematic Auto-Rotating Spotlight Hero
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';

interface SpotlightHeroProps {
  items: Movie[];
}

const ROTATION_INTERVAL = 6000; // 6 seconds

export const SpotlightHero: React.FC<SpotlightHeroProps> = ({ items }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const spotlightItems = items.slice(0, 5);
  const total = spotlightItems.length;

  // Auto-rotation timer
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, ROTATION_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, currentIndex]);

  if (total === 0) return null;

  const current = spotlightItems[currentIndex];
  if (!current) return null;

  const isTV = current.media_type === 'tv' || Boolean(current.first_air_date && !current.release_date);
  const mediaType = isTV ? 'tv' : 'movie';
  const title = current.title || current.name || 'Featured Title';
  const dateStr = current.release_date || current.first_air_date || '';
  const year = dateStr ? dateStr.slice(0, 4) : '';
  const backdropUrl = current.backdrop_path ? tmdb.getImageUrl(current.backdrop_path, 'original') : null;
  const rating = current.vote_average ? current.vote_average.toFixed(1) : null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="group relative w-full h-[360px] sm:h-[400px] rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0c0f17] shadow-[0_20px_50px_rgba(0,0,0,0.8)] select-none mb-8 transition-all duration-300"
    >
      {/* ── Backdrop Imagery with Cross-fade ── */}
      {backdropUrl && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            key={current.id}
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover object-center transform scale-105 transition-all duration-1000 ease-out group-hover:scale-100"
          />
        </div>
      )}

      {/* ── Multi-layer Cinematic Vignettes ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0608] via-[#0a0608]/75 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0608] via-transparent to-black/40 z-10" />
      <div className="absolute -top-32 left-10 w-[450px] h-[450px] rounded-full bg-[#f5c542]/10 blur-[120px] pointer-events-none z-10" />

      {/* ── Foreground Content ── */}
      <div className="relative z-20 h-full flex flex-col justify-end p-6 sm:p-10 max-w-2xl">
        {/* Eyebrow badge */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#c9a24b]/15 text-[#f5c542] border border-[#c9a24b]/30 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-[#f5c542] animate-pulse" />
            <span>Spotlight #{currentIndex + 1}</span>
          </span>

          <span className="text-xs text-white/50 font-medium">
            {isTV ? 'TV Series' : 'Movie'} · {year}
          </span>
        </div>

        {/* Title */}
        <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight line-clamp-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          {title}
        </h2>

        {/* Ratings and meta */}
        <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-white/70">
          {rating && Number(rating) > 0 && (
            <div className="flex items-center gap-1 text-[#f5c542] font-bold bg-[#f5c542]/15 border border-[#c9a24b]/30 px-2.5 py-0.5 rounded-full backdrop-blur-md">
              <Star className="w-3 h-3 fill-[#f5c542] text-[#f5c542]" />
              <span>{rating} Rating</span>
            </div>
          )}

          {current.popularity && (
            <span className="text-white/40">
              Popularity score: {Math.round(current.popularity)}
            </span>
          )}
        </div>

        {/* Synopsis snippet */}
        {current.overview && (
          <p className="mt-3 text-xs sm:text-sm text-white/70 font-light leading-relaxed line-clamp-2 max-w-xl">
            {current.overview}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => navigate(`/${mediaType}/${current.id}`)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#f5c542] hover:bg-[#c9a24b] text-[#1c120c] font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#f5c542]/30 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-[#1c120c] text-[#1c120c]" />
            <span>Watch Now</span>
          </button>

          <button
            onClick={() => navigate(`/${mediaType}/${current.id}`)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-[#c9a24b]/30 bg-[#140a0d]/60 hover:bg-[#1a0f14] text-[#f3e9d2] font-bold text-xs tracking-wider transition-all duration-200 backdrop-blur-md"
          >
            <Info className="w-3.5 h-3.5 text-[#c9a24b]" />
            <span>Details</span>
          </button>
        </div>
      </div>

      {/* ── Top-Right Progress Bar Indicators ── */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        {spotlightItems.map((item, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Jump to spotlight item ${idx + 1}`}
              className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300 focus:outline-none"
              style={{ width: isActive ? '36px' : '16px' }}
            >
              <div className="absolute inset-0 bg-white/20" />
              {isActive && (
                <div
                  className="absolute inset-y-0 left-0 bg-[#f5c542] rounded-full shadow-[0_0_8px_rgba(245,197,66,0.8)]"
                  style={{
                    width: '100%',
                    animation: isPaused ? 'none' : `progressAnim ${ROTATION_INTERVAL}ms linear infinite`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Subtle Left & Right Arrow controls on hover ── */}
      <button
        onClick={handlePrev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <style>{`
        @keyframes progressAnim {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};
