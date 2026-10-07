import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  userLibraryService,
  subscribeToLibrary,
  type WatchLaterItem,
} from '@/services/userLibrary';

export interface WatchlistItem {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
  media_type?: 'movie' | 'tv';
}

const mapLaterToWatchlist = (items: WatchLaterItem[]): WatchlistItem[] => {
  return items.map((it) => ({
    id: it.media_id,
    title: it.title,
    poster_path: it.poster_path || '',
    backdrop_path: it.backdrop_path || '',
    vote_average: it.vote_average || 0,
    release_date: it.release_date || '',
    media_type: it.media_type,
  }));
};

export const useWatchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() =>
    mapLaterToWatchlist(userLibraryService.getWatchLaterSync())
  );
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  const syncFromCloud = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsCloudLoading(true);
      const items = await userLibraryService.getWatchLater(user?.id);
      setWatchlist(mapLaterToWatchlist(items));
    } catch {
      // In-memory cache is already valid
    } finally {
      setIsCloudLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // 0ms instant sync with in-memory singleton
    setWatchlist(mapLaterToWatchlist(userLibraryService.getWatchLaterSync()));

    // Subscribe to immediate reactive updates across all components
    const unsubscribe = subscribeToLibrary(() => {
      setWatchlist(mapLaterToWatchlist(userLibraryService.getWatchLaterSync()));
    });

    if (user?.id) {
      syncFromCloud();
    }

    return () => {
      unsubscribe();
    };
  }, [user?.id, syncFromCloud]);

  const isInWatchlist = useCallback(
    (id: number | string) => {
      const targetId = Number(id);
      return watchlist.some((item) => Number(item.id) === targetId);
    },
    [watchlist]
  );

  const addToWatchlist = useCallback(
    (item: WatchlistItem) => {
      const targetId = Number(item.id);
      if (watchlist.some((i) => Number(i.id) === targetId)) return;
      userLibraryService.addToWatchLater(
        {
          media_id: targetId,
          media_type: item.media_type || 'movie',
          title: item.title,
          poster_path: item.poster_path || '',
          backdrop_path: item.backdrop_path || '',
          release_date: item.release_date || '',
          vote_average: item.vote_average || 0,
          tag: 'asap',
        },
        user?.id
      );
    },
    [watchlist, user?.id]
  );

  const removeFromWatchlist = useCallback(
    (id: number | string) => {
      const targetId = Number(id);
      const existing = watchlist.find((i) => Number(i.id) === targetId);
      const mType = existing?.media_type || 'movie';
      userLibraryService.removeFromWatchLater(targetId, mType, user?.id);
    },
    [watchlist, user?.id]
  );

  const toggleWatchlist = useCallback(
    (item: WatchlistItem) => {
      const targetId = Number(item.id);
      const exists = watchlist.some((i) => Number(i.id) === targetId);
      if (exists) {
        removeFromWatchlist(targetId);
        return false;
      } else {
        addToWatchlist(item);
        return true;
      }
    },
    [watchlist, addToWatchlist, removeFromWatchlist]
  );

  return {
    watchlist,
    isInWatchlist,
    addToWatchlist,
    toggleWatchlist,
    removeFromWatchlist,
    isCloudLoading,
  };
};

