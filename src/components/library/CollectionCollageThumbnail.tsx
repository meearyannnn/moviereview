// src/components/library/CollectionCollageThumbnail.tsx — Dynamic movie poster collage thumbnail for collections
import React, { useState, useEffect } from 'react';
import { Film, Clapperboard, Sparkles } from 'lucide-react';
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

export const CollectionCollageThumbnail: React.FC<CollectionCollageThumbnailProps> = ({
  collection,
  className = '',
}) => {
  const [posters, setPosters] = useState<string[]>(() => {
    if (collection.preview_posters && collection.preview_posters.length > 0) {
      return collection.preview_posters;
    }
    // Check local storage items
    try {
      const raw = localStorage.getItem(`movieguy_col_items_${collection.id}`);
      if (raw) {
        const parsed: UserCollectionItem[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((i) => i.media_poster).filter(Boolean) as string[];
        }
      }
    } catch {}
    return [];
  });

  // If local posters are missing but items_count > 0, fetch asynchronously
  useEffect(() => {
    if (posters.length > 0) return;
    if (collection.items_count === 0 && !collection.cover_image) return;

    let isMounted = true;
    userLibraryService.getCollectionItems(collection.id).then((items) => {
      if (isMounted && Array.isArray(items) && items.length > 0) {
        const extracted = items.map((i) => i.media_poster).filter(Boolean) as string[];
        if (extracted.length > 0) {
          setPosters(extracted);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [collection.id, collection.items_count, collection.cover_image, posters.length]);

  const totalCount = Math.max(collection.items_count || 0, posters.length);

  // If collection has an explicit cover_image and 0 item posters, render cover_image
  if (collection.cover_image && posters.length === 0) {
    return (
      <div className={`aspect-[16/9] w-full bg-[#1b0d14] relative overflow-hidden ${className}`}>
        <img
          src={collection.cover_image}
          alt={collection.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CASE 0: 0 MOVIES (Empty Collection State)
  // ═══════════════════════════════════════════════════════════════════════════
  if (posters.length === 0) {
    return (
      <div
        className={`aspect-[16/9] w-full bg-gradient-to-br from-[#1d0e16] via-[#140a0f] to-[#0a0507] relative overflow-hidden flex flex-col items-center justify-center p-4 border-b border-[#c9a24b]/15 ${className}`}
      >
        {/* Subtle decorative background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#f5c542_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Ambient golden halo */}
        <div className="pointer-events-none absolute w-24 h-24 rounded-full bg-[#f5c542]/10 blur-xl" />

        {/* Cinema Projector Reel Icon */}
        <div className="relative z-10 w-11 h-11 rounded-2xl bg-white/[0.04] border border-[#c9a24b]/30 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:border-[#f5c542]/60 transition-all duration-300">
          <Clapperboard className="w-5 h-5 text-[#f5c542]/70 group-hover:text-[#f5c542] transition-colors" />
        </div>

        <div className="relative z-10 mt-2.5 text-center">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-white/50 tracking-wider">
            <Sparkles className="w-2.5 h-2.5 text-[#f5c542]" />
            Empty Collection
          </span>
        </div>

        {/* Film strip edge notches */}
        <div className="absolute top-0 inset-x-0 h-1 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,#f5c542_8px,#f5c542_14px)] opacity-20" />
        <div className="absolute bottom-0 inset-x-0 h-1 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,#f5c542_8px,#f5c542_14px)] opacity-20" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CASE 1: EXACTLY 1 MOVIE
  // ═══════════════════════════════════════════════════════════════════════════
  if (posters.length === 1) {
    const posterUrl = getPosterUrl(posters[0], 'w500');
    return (
      <div className={`aspect-[16/9] w-full bg-[#140a0e] relative overflow-hidden ${className}`}>
        {/* Background ambient poster blur */}
        <img
          src={posterUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-lg opacity-35 filter brightness-75"
        />

        {/* Featured Center / Cover Poster */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <img
            src={posterUrl}
            alt={collection.title}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

        {/* Single Item Tag */}
        <div className="absolute top-2 right-2 z-30">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 border border-[#c9a24b]/40 text-[9px] font-mono font-bold text-[#f5c542] backdrop-blur-md shadow-md">
            1 Title
          </span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CASE 2: EXACTLY 2 MOVIES (50/50 Split Collage)
  // ═══════════════════════════════════════════════════════════════════════════
  if (posters.length === 2) {
    return (
      <div className={`aspect-[16/9] w-full bg-[#140a0e] relative overflow-hidden flex ${className}`}>
        {/* Left Poster (50%) */}
        <div className="relative w-1/2 h-full overflow-hidden border-r border-[#c9a24b]/30">
          <img
            src={getPosterUrl(posters[0], 'w500')}
            alt=""
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Right Poster (50%) */}
        <div className="relative w-1/2 h-full overflow-hidden">
          <img
            src={getPosterUrl(posters[1], 'w500')}
            alt=""
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Unified Bottom Vignette Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 z-20 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

        {/* 2 Items Pill */}
        <div className="absolute top-2 right-2 z-30">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 border border-[#c9a24b]/40 text-[9px] font-mono font-bold text-[#f5c542] backdrop-blur-md shadow-md">
            2 Titles
          </span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CASE 3: EXACTLY 3 MOVIES (Letterboxd Style: 1 Main + 2 Stacked)
  // ═══════════════════════════════════════════════════════════════════════════
  if (posters.length === 3) {
    return (
      <div className={`aspect-[16/9] w-full bg-[#140a0e] relative overflow-hidden flex ${className}`}>
        {/* Left Featured Dominant Poster (58% width) */}
        <div className="relative w-[58%] h-full overflow-hidden border-r border-[#c9a24b]/30">
          <img
            src={getPosterUrl(posters[0], 'w500')}
            alt=""
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Right Stacked Column (42% width) */}
        <div className="relative w-[42%] h-full flex flex-col">
          {/* Top Poster (50% height) */}
          <div className="relative w-full h-1/2 overflow-hidden border-b border-[#c9a24b]/30">
            <img
              src={getPosterUrl(posters[1], 'w342')}
              alt=""
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>

          {/* Bottom Poster (50% height) */}
          <div className="relative w-full h-1/2 overflow-hidden">
            <img
              src={getPosterUrl(posters[2], 'w342')}
              alt=""
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </div>

        {/* Unified Bottom Vignette Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 z-20 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

        {/* 3 Items Pill */}
        <div className="absolute top-2 right-2 z-30">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 border border-[#c9a24b]/40 text-[9px] font-mono font-bold text-[#f5c542] backdrop-blur-md shadow-md">
            3 Titles
          </span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CASE 4+: 4 OR MORE MOVIES (2x2 Quad Collage with +N Badge)
  // ═══════════════════════════════════════════════════════════════════════════
  const hasMore = totalCount > 4;
  const moreCount = totalCount - 3;

  return (
    <div className={`aspect-[16/9] w-full bg-[#140a0e] relative overflow-hidden grid grid-cols-2 grid-rows-2 ${className}`}>
      {/* Quadrant 1 (Top-Left) */}
      <div className="relative w-full h-full overflow-hidden border-r border-b border-[#c9a24b]/20">
        <img
          src={getPosterUrl(posters[0], 'w342')}
          alt=""
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Quadrant 2 (Top-Right) */}
      <div className="relative w-full h-full overflow-hidden border-b border-[#c9a24b]/20">
        <img
          src={getPosterUrl(posters[1], 'w342')}
          alt=""
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Quadrant 3 (Bottom-Left) */}
      <div className="relative w-full h-full overflow-hidden border-r border-[#c9a24b]/20">
        <img
          src={getPosterUrl(posters[2], 'w342')}
          alt=""
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Quadrant 4 (Bottom-Right): Poster 4 OR +N Overlay */}
      <div className="relative w-full h-full overflow-hidden">
        {posters[3] && (
          <img
            src={getPosterUrl(posters[3], 'w342')}
            alt=""
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* If more than 4 items, show frosted +N badge over 4th slot */}
        {hasMore && (
          <div className="absolute inset-0 bg-[#0d060a]/80 backdrop-blur-sm flex flex-col items-center justify-center p-1 border-t border-l border-[#c9a24b]/30">
            <span className="font-display font-extrabold text-sm sm:text-base text-[#f5c542] tracking-tight drop-shadow-md">
              +{moreCount}
            </span>
            <span className="text-[8px] font-mono uppercase tracking-wider text-white/60">
              more
            </span>
          </div>
        )}
      </div>

      {/* Subtle Overall Vignette */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Pill Badge */}
      <div className="absolute top-2 right-2 z-20">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 border border-[#c9a24b]/40 text-[9px] font-mono font-bold text-[#f5c542] backdrop-blur-md shadow-md">
          <Film className="w-2.5 h-2.5 text-[#f5c542]" />
          {totalCount} Titles
        </span>
      </div>
    </div>
  );
};
