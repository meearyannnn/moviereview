import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userLibraryService } from '@/services/userLibrary';

export interface WatchlistItem {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
  media_type?: 'movie' | 'tv';
}

const EVENT_LIBRARY_CHANGE = 'movieguy_library_change';

export const useWatchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const items = await userLibraryService.getWatchLater(user?.id);
      const mapped: WatchlistItem[] = items.map((it) => ({
        id: it.media_id,
        title: it.title,
        poster_path: it.poster_path || '',
        backdrop_path: it.backdrop_path || '',
        vote_average: it.vote_average || 0,
        release_date: it.release_date || '',
        media_type: it.media_type,
      }));
      setWatchlist(mapped);
    } catch {
      setWatchlist([]);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
    const onSync = () => load();
    window.addEventListener(EVENT_LIBRARY_CHANGE, onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.removeEventListener(EVENT_LIBRARY_CHANGE, onSync);
      window.removeEventListener('storage', onSync);
    };
  }, [load]);

  const isInWatchlist = useCallback(
    (id: number) => {
      return watchlist.some((item) => item.id === id);
    },
    [watchlist]
  );

  const addToWatchlist = useCallback(
    async (item: WatchlistItem) => {
      if (watchlist.some((i) => i.id === item.id)) return;
      await userLibraryService.addToWatchLater(
        {
          media_id: item.id,
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
      window.dispatchEvent(new Event(EVENT_LIBRARY_CHANGE));
    },
    [watchlist, user?.id]
  );

  const removeFromWatchlist = useCallback(
    async (id: number) => {
      const existing = watchlist.find((i) => i.id === id);
      const mType = existing?.media_type || 'movie';
      await userLibraryService.removeFromWatchLater(id, mType, user?.id);
      window.dispatchEvent(new Event(EVENT_LIBRARY_CHANGE));
    },
    [watchlist, user?.id]
  );

  const toggleWatchlist = useCallback(
    (item: WatchlistItem) => {
      const exists = watchlist.some((i) => i.id === item.id);
      if (exists) {
        removeFromWatchlist(item.id);
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
