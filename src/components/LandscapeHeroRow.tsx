import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';

interface LandscapeHeroRowProps {
  title: string;
  items: Movie[];
  type: 'movie' | 'tv';
  badgeType: 'coming_soon' | 'season' | 'latest_release' | 'released';
  onPlayItem?: (item: Movie) => void;
}

/* Glass recipe for the small labels and controls that float over artwork */
const glassControl =
  'backdrop-blur-xl bg-white/15 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_16px_-4px_rgba(0,0,0,0.5)]';

export const LandscapeHeroRow: React.FC<LandscapeHeroRowProps> = ({
  title,
  items,
  type,
  badgeType,
  onPlayItem,
}) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  const today = new Date().toISOString().split('T')[0];

  const getBadgeLabel = (item: Movie) => {
    if (badgeType === 'season') {
      // Only show a season number when TMDB actually gave us one
      const seasons = (item as any).number_of_seasons;
      return seasons ? `Season ${seasons}` : 'New season';
    }
    if (badgeType === 'coming_soon') {
      return item.release_date && item.release_date <= today ? 'Latest release' : 'Coming soon';
    }
    return 'Latest release';
  };

  return (
    // No outer margin: the page decides the spacing around this row
    <section className="w-full">
      <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.022em] text-white mb-5">{title}</h2>

      <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-1 scrollbar-hide touch-pan-x">
        {items.map((item) => {
          const backdrop = item.backdrop_path || item.poster_path;
          const displayTitle = item.title || item.name || '';
          const route = type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`;

          const handleClick = () => {
            if (onPlayItem) {
              onPlayItem(item);
            } else {
              navigate(route);
            }
          };

          return (
            <div
              key={item.id}
              role="link"
              tabIndex={0}
              aria-label={displayTitle}
              onClick={handleClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleClick();
              }}
              className="group relative flex-none w-[280px] sm:w-[320px] md:w-[360px] cursor-pointer select-none rounded-[1.6rem] overflow-hidden border border-white/10 hover:border-white/25 transition-all duration-300 hover:-translate-y-1 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              style={{
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 24px 40px -22px rgba(0,0,0,0.8)',
              }}
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-white/[0.04]">
                <img
                  src={tmdb.getImageUrl(backdrop, 'w780')}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Shade so the text always reads, whatever the artwork */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Title and label, left-aligned at the bottom */}
                <div className="absolute inset-x-4 bottom-4 flex flex-col items-start gap-2">
                  <h3 className="text-base sm:text-lg font-semibold tracking-[-0.02em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] line-clamp-1 w-full">
                    {displayTitle}
                  </h3>
                  <span
                    className={`${glassControl} px-3 py-1 rounded-full text-[11px] font-medium text-white/95 whitespace-nowrap`}
                  >
                    {getBadgeLabel(item)}
                  </span>
                </div>

                {/* Play */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className={`${glassControl} w-11 h-11 rounded-full flex items-center justify-center text-white`}>
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
