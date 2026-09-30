// src/components/explore/ActiveFilterChips.tsx — Removable Ticket-Stub Filter Chips
import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { WEB_CHANNELS } from '@/services/webChannels';
import { EXPLORE_GENRES, SHOWTIME_ITEMS, type ExploreType, type ExploreSort } from './FilterRail';

interface ActiveFilterChipsProps {
  type: ExploreType;
  onClearType: () => void;
  sort: ExploreSort;
  onResetSort: () => void;
  selectedNetworks: string[];
  onRemoveNetwork: (id: string) => void;
  selectedGenres: string[];
  onRemoveGenre: (id: string) => void;
  onClearAll: () => void;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  type,
  onClearType,
  sort,
  onResetSort,
  selectedNetworks,
  onRemoveNetwork,
  selectedGenres,
  onRemoveGenre,
  onClearAll,
}) => {
  const isTypeFiltered = type !== 'all';
  const isSortFiltered = sort !== 'trending';
  const hasNetworks = selectedNetworks.length > 0;
  const hasGenres = selectedGenres.length > 0;

  const totalActive =
    (isTypeFiltered ? 1 : 0) +
    (isSortFiltered ? 1 : 0) +
    selectedNetworks.length +
    selectedGenres.length;

  if (totalActive === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 p-2 rounded-xl bg-[#0c090e]/80 border border-[#c9a24b]/20">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a24b] px-2 py-0.5 font-bold">
        Active Stubs:
      </span>

      {/* Type Chip */}
      {isTypeFiltered && (
        <button
          onClick={onClearType}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-[#c9a24b]/15 text-[#f5c542] border border-[#c9a24b]/35 hover:bg-[#c9a24b]/25 transition-colors"
          title="Remove screen filter"
        >
          <span>{type === 'movie' ? 'Screen 1: Movies' : 'Screen 2: Series'}</span>
          <X className="w-3 h-3 text-[#f5c542]/60 hover:text-white" strokeWidth={2} />
        </button>
      )}

      {/* Sort Chip */}
      {isSortFiltered && (
        <button
          onClick={onResetSort}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-[#c9a24b]/15 text-[#f5c542] border border-[#c9a24b]/35 hover:bg-[#c9a24b]/25 transition-colors"
          title="Reset showtime sort"
        >
          <span>Showtime: {SHOWTIME_ITEMS.find((s) => s.id === sort)?.label}</span>
          <X className="w-3 h-3 text-[#f5c542]/60 hover:text-white" strokeWidth={2} />
        </button>
      )}

      {/* Network Chips */}
      {selectedNetworks.map((netId) => {
        const net = WEB_CHANNELS.find((ch) => ch.id === netId);
        if (!net) return null;
        return (
          <button
            key={netId}
            onClick={() => onRemoveNetwork(netId)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-[#c9a24b]/15 text-[#f5c542] border border-[#c9a24b]/35 hover:bg-[#c9a24b]/25 transition-colors"
            title={`Remove ${net.name} filter`}
          >
            <span>Theatre: {net.name}</span>
            <X className="w-3 h-3 text-[#f5c542]/60 hover:text-white" strokeWidth={2} />
          </button>
        );
      })}

      {/* Genre Chips */}
      {selectedGenres.map((gId) => {
        const genre = EXPLORE_GENRES.find((g) => g.id === gId);
        if (!genre) return null;
        return (
          <button
            key={gId}
            onClick={() => onRemoveGenre(gId)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-[#c9a24b]/15 text-[#f5c542] border border-[#c9a24b]/35 hover:bg-[#c9a24b]/25 transition-colors"
            title={`Remove ${genre.label} filter`}
          >
            <span>{genre.label}</span>
            <X className="w-3 h-3 text-[#f5c542]/60 hover:text-white" strokeWidth={2} />
          </button>
        );
      })}

      {/* Clear All action */}
      {totalActive > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs font-mono uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors ml-auto px-2 py-0.5 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Tear all</span>
        </button>
      )}
    </div>
  );
};
