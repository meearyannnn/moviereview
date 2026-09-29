// components/CuratedShelfRow.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import type { CuratedShelfItem } from '@/services/curatedShelves';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

interface CuratedShelfRowProps {
  title: string;
  subtitle?: string;
  logoSrc?: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: CuratedShelfItem[];
  loading?: boolean;
}

export const CuratedShelfRow: React.FC<CuratedShelfRowProps> = ({
  title,
  subtitle,
  logoSrc,
  icon: Icon,
  items,
  loading = false,
}) => {
  const {
    containerRef,
    canScrollLeft,
    canScrollRight,
    isDragging,
    scrollToDirection,
    handlers,
  } = useSmoothScroll<HTMLDivElement>({
    enableWheel: true,
    enableDrag: true,
    scrollStepRatio: 0.75,
  });

  if (!loading && items.length === 0) return null;

  // Convert CuratedShelfItem to Movie shape for MovieCard
  const toMovie = (item: CuratedShelfItem) => ({
    id: item.id,
    title: item.media_type === 'movie' ? item.title : undefined,
    name: item.media_type === 'tv' ? item.title : undefined,
    poster_path: item.poster_path || '',
    backdrop_path: '',
    vote_average: 0,
    release_date: item.media_type === 'movie' ? `${item.year || 2026}-01-01` : undefined,
    first_air_date: item.media_type === 'tv' ? `${item.year || 2026}-01-01` : undefined,
    media_type: item.media_type,
    genre_ids: [],
    overview: '',
    popularity: 0,
    vote_count: 0,
    adult: false,
    original_language: 'en',
    original_title: item.title,
    video: false,
  });

  return (
    <section className="relative w-full max-w-full my-8 group/shelf">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-0.5">
        <div className="flex items-center gap-2.5">
          {logoSrc && (
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center flex-shrink-0">
              <img src={logoSrc} alt={title} className="w-full h-full object-contain" loading="lazy" />
            </div>
          )}
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.15)] flex-shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl tracking-tight text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-white/35 font-sans mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Nav arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scrollToDirection('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollToDirection('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Track */}
      {loading ? (
        <div className="flex gap-3 sm:gap-4 overflow-x-hidden py-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-none w-[140px] sm:w-[165px] md:w-[185px] flex flex-col gap-2">
              <div className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
              <div className="h-3.5 w-3/4 bg-white/[0.04] rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-white/[0.04] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={containerRef}
          {...handlers}
          className={`flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 pt-0.5 touch-pan-x select-none overscroll-x-contain will-change-scroll ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((item) => (
            <div
              key={`${item.media_type}-${item.id}-${item.title}`}
              className={`flex-none w-[140px] sm:w-[165px] md:w-[185px] transition-transform ${
                isDragging ? 'pointer-events-none' : ''
              }`}
            >
              <MovieCard
                movie={toMovie(item) as any}
                type={item.media_type as 'movie' | 'tv'}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
