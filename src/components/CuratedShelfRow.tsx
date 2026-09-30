import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
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
  viewAllLink?: string;
}

export const CuratedShelfRow: React.FC<CuratedShelfRowProps> = ({
  title, subtitle, logoSrc, icon: Icon, items, loading = false, viewAllLink,
}) => {
  const { containerRef, canScrollLeft, canScrollRight, isDragging, scrollToDirection, handlers } =
    useSmoothScroll<HTMLDivElement>({ enableWheel: true, enableDrag: true, scrollStepRatio: 0.75 });

  if (!loading && items.length === 0) return null;

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
    genre_ids: [], overview: '', popularity: 0, vote_count: 0,
    adult: false, original_language: 'en', original_title: item.title, video: false,
  });

  return (
    <div className="w-full max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {logoSrc && (
            <img
              src={logoSrc}
              alt={title}
              className="h-5 w-auto object-contain opacity-75 flex-shrink-0"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          {Icon && !logoSrc && (
            <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
          <div>
            <h2 className="font-display font-bold text-xl tracking-tight text-white">{title}</h2>
            {subtitle && <p className="text-[11px] font-mono text-white/30 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {viewAllLink && (
            <Link to={viewAllLink} className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-white/40 hover:text-[#f5c542] transition-colors mr-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          <button onClick={() => scrollToDirection('left')} disabled={!canScrollLeft} aria-label="Scroll left"
            className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scrollToDirection('right')} disabled={!canScrollRight} aria-label="Scroll right"
            className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Track */}
      {loading ? (
        <div className="flex gap-3 sm:gap-4 overflow-hidden py-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-none w-[140px] sm:w-[165px] flex flex-col gap-2">
              <div className="aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.05]" style={{ animationDelay: `${i * 60}ms` }} />
              <div className="h-3 w-3/4 bg-white/[0.04] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={containerRef}
          {...handlers}
          className={`flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 pt-0.5 touch-pan-x select-none overscroll-x-contain ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((item) => (
            <div
              key={`${item.media_type}-${item.id}`}
              className={`flex-none w-[140px] sm:w-[165px] md:w-[180px] ${isDragging ? 'pointer-events-none' : ''}`}
            >
              <MovieCard movie={toMovie(item) as any} type={item.media_type as 'movie' | 'tv'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
