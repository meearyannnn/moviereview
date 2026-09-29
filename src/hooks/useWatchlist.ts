import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WatchlistItem {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
  media_type?: 'movie' | 'tv';
}

const STORAGE_KEY = 'movieguy_watchlist_v1';
const SYNC_EVENT = 'movieguy_watchlist_update';

export const useWatchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const syncedUserIdRef = useRef<string | null>(null);

  // Synchronize localStorage between tabs
  useEffect(() => {
    const handleSync = () => {
      if (!user) {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          setWatchlist(saved ? JSON.parse(saved) : []);
        } catch {
          setWatchlist([]);
        }
      }
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [user]);

  // Load from Supabase when user logs in and migrate local items
  useEffect(() => {
    if (!user) {
      syncedUserIdRef.current = null;
      // Revert to localStorage when logged out
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        setWatchlist(saved ? JSON.parse(saved) : []);
      } catch {
        setWatchlist([]);
      }
      return;
    }

    if (syncedUserIdRef.current === user.id) return;
    syncedUserIdRef.current = user.id;

    const loadCloudWatchlist = async () => {
      setIsCloudLoading(true);
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .select('media_id, title, poster_path, backdrop_path, vote_average, release_date, media_type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          if (!error.message?.includes('schema cache') && error.code !== 'PGRST205') {
            console.warn('Could not fetch cloud watchlist:', error.message);
          }
          return;
        }

        const cloudItems: WatchlistItem[] = (data || []).map((row) => ({
          id: row.media_id,
          title: row.title,
          poster_path: row.poster_path,
          backdrop_path: row.backdrop_path,
          vote_average: row.vote_average,
          release_date: row.release_date,
          media_type: row.media_type as 'movie' | 'tv',
        }));

        // Check if there are local guest items to migrate
        let localItems: WatchlistItem[] = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) localItems = JSON.parse(raw);
        } catch { }

        if (localItems.length > 0) {
          // Merge local items not in cloud yet
          const missingInCloud = localItems.filter(
            (local) => !cloudItems.some((c) => c.id === local.id)
          );

          if (missingInCloud.length > 0) {
            const rowsToInsert = missingInCloud.map((item) => ({
              user_id: user.id,
              media_id: item.id,
              media_type: item.media_type || 'movie',
              title: item.title || 'Untitled',
              poster_path: item.poster_path || '',
              backdrop_path: item.backdrop_path || '',
              vote_average: item.vote_average || 0,
              release_date: item.release_date || '',
            }));

            await supabase.from('watchlist').upsert(rowsToInsert, {
              onConflict: 'user_id,media_id,media_type',
            });

            cloudItems.unshift(...missingInCloud);
            // Clear local storage after successful sync
            localStorage.removeItem(STORAGE_KEY);
            toast.success(`Synced ${missingInCloud.length} local titles to your cloud watchlist!`);
          }
        }

        setWatchlist(cloudItems);
      } catch (err) {
        console.error('Failed to sync watchlist:', err);
      } finally {
        setIsCloudLoading(false);
      }
    };

    loadCloudWatchlist();
  }, [user]);

  const saveLocal = useCallback((newList: WatchlistItem[]) => {
    setWatchlist(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      window.dispatchEvent(new Event(SYNC_EVENT));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage', e);
    }
  }, []);

  const isInWatchlist = useCallback(
    (id: number) => {
      return watchlist.some((item) => item.id === id);
    },
    [watchlist]
  );

  const addToWatchlist = useCallback(
    async (item: WatchlistItem) => {
      if (watchlist.some((i) => i.id === item.id)) return;

      const updated = [item, ...watchlist];
      setWatchlist(updated);

      if (user) {
        try {
          await supabase.from('watchlist').upsert(
            {
              user_id: user.id,
              media_id: item.id,
              media_type: item.media_type || 'movie',
              title: item.title,
              poster_path: item.poster_path,
              backdrop_path: item.backdrop_path,
              vote_average: item.vote_average,
              release_date: item.release_date,
            },
            { onConflict: 'user_id,media_id,media_type' }
          );
        } catch (err) {
          console.error('Failed to save to cloud watchlist:', err);
        }
      } else {
        saveLocal(updated);
      }
    },
    [watchlist, user, saveLocal]
  );

  const removeFromWatchlist = useCallback(
    async (id: number) => {
      const updated = watchlist.filter((i) => i.id !== id);
      setWatchlist(updated);

      if (user) {
        try {
          await supabase
            .from('watchlist')
            .delete()
            .match({ user_id: user.id, media_id: id });
        } catch (err) {
          console.error('Failed to delete from cloud watchlist:', err);
        }
      } else {
        saveLocal(updated);
      }
    },
    [watchlist, user, saveLocal]
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
