// src/components/HomePersonalizedSection.tsx
// Simple, clean personalized recommendation shelves based on:
// 1. Watch Later / Marked as Interested ("Because you saved [Title]" / "Top priority in Watch Later [Title]")
// 2. User Watch History ("Because you watched [Title]")
// 3. User Collections ("Inspired by your collection [Collection Name]") - displays all user collections with items

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, History, BookmarkCheck, Flame } from 'lucide-react';
import { MovieRow } from '@/components/MovieRow';
import { tmdb, type Movie } from '@/services/tmdb';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { useWatchlist } from '@/hooks/useWatchlist';
import { userLibraryService, type UserCollectionItem } from '@/services/userLibrary';

interface CollectionSeed {
  collectionId: string;
  collectionTitle: string;
  item: UserCollectionItem;
}

async function fetchRecommendations(
  mediaId: number,
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<{ results: Movie[] }> {
  try {
    const res = await tmdb.getRecommendations(mediaId, mediaType);
    let list = res.results || [];
    if (list.length < 5) {
      const popular = await tmdb.getPopular(mediaType);
      const fallbackList = (popular.results || []).filter(
        (m: Movie) => m.id !== mediaId && !list.some((r: Movie) => r.id === m.id)
      );
      list = [...list, ...fallbackList];
    }
    return { results: list.filter((m: Movie) => m.id !== mediaId) };
  } catch {
    return tmdb.getPopular(mediaType);
  }
}

// Stable row for each collection
const CollectionRow = ({ seed }: { seed: CollectionSeed }) => {
  const fetchFn = useCallback(
    () => fetchRecommendations(seed.item.media_id, seed.item.media_type),
    [seed.item.media_id, seed.item.media_type]
  );

  return (
    <MovieRow
      icon={BookmarkCheck}
      title="Inspired by your collection"
      accent={seed.collectionTitle}
      fetchData={fetchFn}
      type={seed.item.media_type}
    />
  );
};

export const HomePersonalizedSection = () => {
  const { history, watchLater, collections, savedCollections } = useUserLibrary();
  const { watchlist } = useWatchlist();

  const [collectionSeeds, setCollectionSeeds] = useState<CollectionSeed[]>([]);

  // 1. Watch Later / Marked as Interested Seed
  const savedSeed = useMemo(() => {
    if (watchLater && watchLater.length > 0) return watchLater[0];
    if (watchlist && watchlist.length > 0) {
      const w = watchlist[0];
      return {
        media_id: w.id,
        media_type: (w.media_type || 'movie') as 'movie' | 'tv',
        title: w.title,
        tag: 'asap' as const,
      };
    }
    return null;
  }, [watchLater, watchlist]);

  // 2. Watch History Seed (pick item different from savedSeed if possible)
  const watchedSeed = useMemo(() => {
    if (!history || history.length === 0) return null;
    const diff = history.find((h) => h.media_id !== savedSeed?.media_id);
    return diff || history[0];
  }, [history, savedSeed?.media_id]);

  // 3. User Collections Seeds — Loads all collections that have items
  useEffect(() => {
    let active = true;
    const loadAllCollectionSeeds = async () => {
      const allCols = [...collections, ...savedCollections];
      const seenIds = new Set<string>();
      const seeds: CollectionSeed[] = [];

      for (const col of allCols) {
        if (seenIds.has(col.id)) continue;
        seenIds.add(col.id);

        if (col.items_count > 0 || col.preview_posters?.length) {
          try {
            const items = await userLibraryService.getCollectionItems(col.id);
            if (items && items.length > 0) {
              seeds.push({
                collectionId: col.id,
                collectionTitle: col.title,
                item: items[0],
              });
              if (seeds.length >= 4) break; // Support up to 4 collections simultaneously
            }
          } catch {}
        }
      }

      if (active) {
        setCollectionSeeds(seeds);
      }
    };

    loadAllCollectionSeeds();
    return () => {
      active = false;
    };
  }, [collections, savedCollections]);

  // Fetch callbacks for shelves
  const fetchSaved = useCallback(() => {
    if (!savedSeed) return Promise.resolve({ results: [] });
    return fetchRecommendations(savedSeed.media_id, savedSeed.media_type);
  }, [savedSeed?.media_id, savedSeed?.media_type]);

  const fetchWatched = useCallback(() => {
    if (!watchedSeed) return Promise.resolve({ results: [] });
    return fetchRecommendations(watchedSeed.media_id, watchedSeed.media_type);
  }, [watchedSeed?.media_id, watchedSeed?.media_type]);

  const fetchFallback = useCallback(() => tmdb.getPopular('movie'), []);

  // Title & Icon for saved / interested item
  const savedTitle = savedSeed?.tag === 'asap' ? 'Top priority in Watch Later' : 'Because you saved';
  const SavedIcon = savedSeed?.tag === 'asap' ? Flame : Sparkles;

  const hasAnyData = Boolean(savedSeed || watchedSeed || collectionSeeds.length > 0);

  return (
    <div id="for-you" className="scroll-mt-20 space-y-14">
      {/* 1. Marked as Interested / Saved Shelf */}
      {savedSeed && (
        <MovieRow
          icon={SavedIcon}
          title={savedTitle}
          accent={savedSeed.title}
          fetchData={fetchSaved}
          type={savedSeed.media_type}
        />
      )}

      {/* 2. Watched History Shelf */}
      {watchedSeed && (
        <MovieRow
          icon={History}
          title="Because you watched"
          accent={watchedSeed.title}
          fetchData={fetchWatched}
          type={watchedSeed.media_type}
        />
      )}

      {/* 3. User Collections Shelves — All collections with items */}
      {collectionSeeds.map((seed) => (
        <CollectionRow key={seed.collectionId} seed={seed} />
      ))}

      {/* 4. Clean Fallback for new visitors with zero library data */}
      {!hasAnyData && (
        <MovieRow
          icon={Sparkles}
          title="Recommended"
          accent="Picks for You"
          fetchData={fetchFallback}
          type="movie"
        />
      )}
    </div>
  );
};
