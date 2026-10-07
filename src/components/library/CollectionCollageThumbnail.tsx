// src/components/library/CollectionCollageThumbnail.tsx — Poster collage thumbnail for collections
import React, { useState, useEffect } from 'react';
import { Film, Clapperboard } from 'lucide-react';
import { userLibraryService, type UserCollection, type UserCollectionItem } from '@/services/userLibrary';

interface CollectionCollageThumbnailProps {
  collection: UserCollection;
  className?: string;
}

function getPosterUrl(path?: string, size: 'w342' | 'w500' | 'w780' = 'w500'): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `https://image.tmdb.org/t/p/${size}${path.startsWith('/') ? '' : '/'}${path}`;
}

const FRAME = 'relative aspect-[16/9] w-full overflow-hidden bg-[#140a0e]';

// One poster tile, zooming slightly when the parent card (class "group") is hovered
const Tile: React.FC<{ path?: string; size?: 'w342' | 'w500'; position?: string }> = ({
  path,
  size = 'w342',
  position = 'object-top',
}) => (
  <img
    src={getPosterUrl(path, size)}
    alt=""
    loading="lazy"
    decoding="async"
    onError={(e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = '/placeholder.svg';
    }}
    className={`h-full w-full object-cover ${position} transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
  />
);

// Frosted count pill in the top-right corner
const CountPill: React.FC<{ count: number; icon?: boolean }> = ({ count, icon }) => (
  <span className="absolute right-2 top-2 z-30 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-medium text-[#f5c542] backdrop-blur-md">
    {icon && <Film className="h-3 w-3" aria-hidden />}
    {count} {count === 1 ? 'title' : 'titles'}
  </span>
);

const Vignette: React.FC<{ strong?: boolean }> = ({ strong }) => (
  <div
    aria-hidden
    className={`pointer-events-none absolute inset-0 z-20 bg-gradient-to-t ${strong ? 'from-black/85 via-black/20' : 'from-black/60'
      } to-transparent`}
  />
);

export const CollectionCollageThumbnail: React.FC<CollectionCollageThumbnailProps> = ({
  collection,
  className = '',
}) => {
  const [posters, setPosters] = useState<string[]>(() => {
    if (collection.preview_posters && collection.preview_posters.length > 0) {
      return collection.preview_posters;
    }
    try {
      const raw = localStorage.getItem(`movieguy_col_items_${collection.id}`);
      if (raw) {
        const parsed: UserCollectionItem[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((i) => i.media_poster).filter(Boolean) as string[];
        }
      }
    } catch {
      /* ignore unreadable local data */
    }
    return [];
  });

  // If local posters are missing but the collection has titles, fetch them
  useEffect(() => {
    if (posters.length > 0) return;
    if (collection.items_count === 0 && !collection.cover_image) return;

    let isMounted = true;
    userLibraryService
      .getCollectionItems(collection.id)
      .then((items) => {
        if (!isMounted || !Array.isArray(items)) return;
        const extracted = items.map((i) => i.media_poster).filter(Boolean) as string[];
        if (extracted.length > 0) setPosters(extracted);
      })
      .catch(() => { });

    return () => {
      isMounted = false;
    };
  }, [collection.id, collection.items_count, collection.cover_image, posters.length]);

  const totalCount = Math.max(collection.items_count || 0, posters.length);

  // Explicit cover image, used when there are no item posters
  if (collection.cover_image && posters.length === 0) {
    return (
      <div className={`${FRAME} ${className}`}>
        <img
          src={collection.cover_image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          loading="lazy"
          decoding="async"
        />
        <Vignette strong />
      </div>
    );
  }

  // 0 titles
  if (posters.length === 0) {
    return (
      <div
        className={`${FRAME} flex flex-col items-center justify-center bg-gradient-to-br from-[#2a1422] via-[#160b11] to-[#0d0709] p-4 ${className}`}
      >
        <div aria-hidden className="pointer-events-none absolute h-28 w-28 rounded-full bg-[#f5c542]/10 blur-2xl" />
        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:border-[#f5c542]/50">
          <Clapperboard className="h-5 w-5 text-[#f5c542]/80 transition-colors group-hover:text-[#f5c542]" aria-hidden />
        </div>
        <span className="relative z-10 mt-3 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-white/60 backdrop-blur-md">
          No titles yet
        </span>
      </div>
    );
  }

  // 1 title: poster centred over a blurred copy of itself
  if (posters.length === 1) {
    return (
      <div className={`${FRAME} ${className}`}>
        <img
          src={getPosterUrl(posters[0], 'w500')}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-lg brightness-75"
        />
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <div className="aspect-[2/3] h-[86%] overflow-hidden rounded-xl border border-white/20 shadow-2xl">
            <Tile path={posters[0]} size="w500" position="object-center" />
          </div>
        </div>
        <Vignette strong />
        <CountPill count={1} />
      </div>
    );
  }

  // 2 titles: 50/50 split
  if (posters.length === 2) {
    return (
      <div className={`${FRAME} flex ${className}`}>
        <div className="relative h-full w-1/2 overflow-hidden border-r border-white/20">
          <Tile path={posters[0]} size="w500" />
        </div>
        <div className="relative h-full w-1/2 overflow-hidden">
          <Tile path={posters[1]} size="w500" />
        </div>
        <Vignette strong />
        <CountPill count={2} />
      </div>
    );
  }

  // 3 titles: one large poster plus two stacked
  if (posters.length === 3) {
    return (
      <div className={`${FRAME} flex ${className}`}>
        <div className="relative h-full w-[58%] overflow-hidden border-r border-white/20">
          <Tile path={posters[0]} size="w500" position="object-center" />
        </div>
        <div className="flex h-full w-[42%] flex-col">
          <div className="relative h-1/2 w-full overflow-hidden border-b border-white/20">
            <Tile path={posters[1]} />
          </div>
          <div className="relative h-1/2 w-full overflow-hidden">
            <Tile path={posters[2]} />
          </div>
        </div>
        <Vignette strong />
        <CountPill count={3} />
      </div>
    );
  }

  // 4 or more: 2x2 grid, with a frosted "+N" tile when there are more
  const hasMore = totalCount > 4;
  const moreCount = totalCount - 3;

  return (
    <div className={`${FRAME} grid grid-cols-2 grid-rows-2 ${className}`}>
      <div className="relative h-full w-full overflow-hidden border-b border-r border-white/15">
        <Tile path={posters[0]} />
      </div>
      <div className="relative h-full w-full overflow-hidden border-b border-white/15">
        <Tile path={posters[1]} />
      </div>
      <div className="relative h-full w-full overflow-hidden border-r border-white/15">
        <Tile path={posters[2]} />
      </div>
      <div className="relative h-full w-full overflow-hidden">
        {posters[3] && <Tile path={posters[3]} />}
        {hasMore && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d060a]/70 backdrop-blur-sm">
            <span className="font-display text-base font-bold text-[#f5c542]">+{moreCount}</span>
            <span className="text-[11px] text-white/60">more</span>
          </div>
        )}
      </div>

      <Vignette />
      <CountPill count={totalCount} icon />
    </div>
  );
};