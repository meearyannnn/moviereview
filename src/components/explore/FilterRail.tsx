// src/components/explore/FilterRail.tsx — "The Ticket Booth" Filter Rail
import React, { useState } from 'react';
import {
  ChevronDown,
  Check,
  RotateCcw,
  Zap,
  Smile,
  Heart,
  Sparkles,
  Search,
  Palette,
  Ghost,
  Compass,
  Flame,
  Clapperboard,
  Tv,
  Film,
  Ticket,
} from 'lucide-react';
import { WEB_CHANNELS } from '@/services/webChannels';

export type ExploreType = 'all' | 'movie' | 'tv';
export type ExploreSort = 'trending' | 'popular' | 'top_rated' | 'latest';

export interface GenreItem {
  id: string;
  label: string;
  movieGenreId: number;
  tvGenreId: number;
  Icon: React.ComponentType<{ className?: string }>;
}

export const EXPLORE_GENRES: GenreItem[] = [
  { id: 'action', label: 'Action & Adventure', movieGenreId: 28, tvGenreId: 10759, Icon: Zap },
  { id: 'comedy', label: 'Comedy', movieGenreId: 35, tvGenreId: 35, Icon: Smile },
  { id: 'drama', label: 'Drama', movieGenreId: 18, tvGenreId: 18, Icon: Heart },
  { id: 'scifi', label: 'Sci-Fi & Fantasy', movieGenreId: 878, tvGenreId: 10765, Icon: Sparkles },
  { id: 'crime', label: 'Crime & Mystery', movieGenreId: 80, tvGenreId: 80, Icon: Search },
  { id: 'animation', label: 'Animation', movieGenreId: 16, tvGenreId: 16, Icon: Palette },
  { id: 'horror', label: 'Horror & Thriller', movieGenreId: 27, tvGenreId: 9648, Icon: Ghost },
  { id: 'romance', label: 'Romance', movieGenreId: 10749, tvGenreId: 18, Icon: Flame },
  { id: 'documentary', label: 'Documentary', movieGenreId: 99, tvGenreId: 99, Icon: Compass },
];

export const SHOWTIME_ITEMS: { id: ExploreSort; label: string; sublabel: string }[] = [
  { id: 'trending', label: 'Now Showing', sublabel: 'Trending' },
  { id: 'popular', label: 'Crowd Favorites', sublabel: 'Popular' },
  { id: 'top_rated', label: "Critics' Choice", sublabel: 'Top Rated' },
  { id: 'latest', label: 'Just Premiered', sublabel: 'Latest' },
];

export const SORT_ITEMS = SHOWTIME_ITEMS;

export const SCREEN_ITEMS: { id: ExploreType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'movie', label: 'Movies', icon: Film },
  { id: 'tv', label: 'Series', icon: Tv },
];

export interface FilterRailProps {
  type: ExploreType;
  onTypeChange: (type: ExploreType) => void;
  sort: ExploreSort;
  onSortChange: (sort: ExploreSort) => void;
  selectedNetworks: string[];
  onToggleNetwork: (networkId: string) => void;
  selectedGenres: string[];
  onToggleGenre: (genreId: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  className?: string;
  isDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const FilterRail: React.FC<FilterRailProps> = ({
  type,
  onTypeChange,
  sort,
  onSortChange,
  selectedNetworks,
  onToggleNetwork,
  selectedGenres,
  onToggleGenre,
  onClearAll,
  hasActiveFilters,
  className = '',
  isDrawer = false,
  onCloseMobileDrawer,
}) => {
  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    screen: true,
    showtime: true,
    theatre: true,
    genres: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeFiltersCount =
    (type !== 'all' ? 1 : 0) +
    (sort !== 'trending' ? 1 : 0) +
    selectedNetworks.length +
    selectedGenres.length;

  return (
    <div
      aria-label="The Filter Rail"
      className={
        isDrawer
          ? `flex-1 flex flex-col min-h-0 text-sm text-white ${className}`
          : `rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col text-sm text-white relative overflow-hidden ${className}`
      }
    >
      {/* Top Accent Strip (Desktop only) */}
      {!isDrawer && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      )}

      {/* ── Booth Header & Stubs Badge ── */}
      {!isDrawer && (
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
            <span className="font-display font-bold text-xs uppercase tracking-wider text-white">
              Filter Rail
            </span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/10 text-white border border-white/20">
                {activeFiltersCount} ACTIVE
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] font-mono uppercase tracking-wider text-white/40 hover:text-white transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
        {/* ── 1. SCREEN Section (Type selector) ── */}
        <div className="border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => toggleSection('screen')}
            className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors py-1 focus:outline-none"
          >
            <span className="flex items-center gap-1.5">
              <span>1. SCREEN</span>
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 stroke-[1.5] transition-transform duration-200 ${
                openSections.screen ? 'rotate-180 text-white' : 'text-white/30'
              }`}
            />
          </button>

          {openSections.screen && (
            <div className="mt-2.5 grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/10">
              {SCREEN_ITEMS.map((item) => {
                const active = type === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTypeChange(item.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-center transition-all duration-200 ${
                      active
                        ? 'bg-white text-black font-bold shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-display font-bold leading-none">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 2. SHOWTIME Section (Sort selector) ── */}
        <div className="border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => toggleSection('showtime')}
            className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors py-1 focus:outline-none"
          >
            <span>2. SHOWTIME</span>
            <ChevronDown
              className={`h-3.5 w-3.5 stroke-[1.5] transition-transform duration-200 ${
                openSections.showtime ? 'rotate-180 text-white' : 'text-white/30'
              }`}
            />
          </button>

          {openSections.showtime && (
            <ul className="mt-2.5 space-y-1 relative">
              {SHOWTIME_ITEMS.map((item) => {
                const active = sort === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSortChange(item.id)}
                      className={`relative w-full flex items-center justify-between py-2 px-3 rounded-lg text-xs transition-all duration-200 ${
                        active
                          ? 'text-white font-semibold bg-white/10 border-l-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {active ? (
                          <Clapperboard className="w-3.5 h-3.5 text-white shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-white/20 ml-1" />
                        )}
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/40 uppercase">
                        {item.sublabel}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── 3. THEATRE Section (Networks) ── */}
        <div className="border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => toggleSection('theatre')}
            className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors py-1 focus:outline-none"
          >
            <span className="flex items-center gap-1.5">
              <span>3. THEATRE</span>
              {selectedNetworks.length > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold border border-white/30">
                  {selectedNetworks.length}
                </span>
              )}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 stroke-[1.5] transition-transform duration-200 ${
                openSections.theatre ? 'rotate-180 text-white' : 'text-white/30'
              }`}
            />
          </button>

          {openSections.theatre && (
            <div className="mt-2.5 space-y-1">
              {WEB_CHANNELS.map((channel) => {
                const isSelected = selectedNetworks.includes(channel.id);
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => onToggleNetwork(channel.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                      isSelected
                        ? 'text-white font-medium bg-white/10 border-l-2 border-white'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 overflow-hidden bg-black/60 border border-white/[0.1] p-0.5">
                        <img
                          src={channel.logoUrl}
                          alt={channel.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="truncate text-xs">{channel.name}</span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-white border-white text-black shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                          : 'border-white/20 bg-transparent text-transparent'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 4. GENRE Section ── */}
        <div className="pb-2">
          <button
            type="button"
            onClick={() => toggleSection('genres')}
            className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors py-1 focus:outline-none"
          >
            <span className="flex items-center gap-1.5">
              <span>4. GENRE</span>
              {selectedGenres.length > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold border border-white/30">
                  {selectedGenres.length}
                </span>
              )}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 stroke-[1.5] transition-transform duration-200 ${
                openSections.genres ? 'rotate-180 text-white' : 'text-white/30'
              }`}
            />
          </button>

          {openSections.genres && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {EXPLORE_GENRES.map((g) => {
                const checked = selectedGenres.includes(g.id);
                const Icon = g.Icon;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onToggleGenre(g.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all duration-200 border relative ${
                      checked
                        ? 'bg-white border-white text-black font-bold shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25 hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${checked ? 'text-black' : 'text-white/60'}`} />
                    <span>{g.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Tear up & reset button (Bottom action) ── */}
      {hasActiveFilters && (
        <div className="pt-3 mt-auto border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClearAll}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        </div>
      )}

      {/* ── Mobile Close Action ── */}
      {onCloseMobileDrawer && (
        <div className="pt-3 mt-auto border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="w-full rounded-xl bg-white text-black font-display font-extrabold text-xs py-3 hover:bg-neutral-200 transition-all shadow-lg shadow-white/10"
          >
            Show Titles
          </button>
        </div>
      )}
    </div>
  );
};
