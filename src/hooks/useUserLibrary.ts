// src/hooks/useUserLibrary.ts — Reactive hook for User Library & Collections
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  userLibraryService,
  subscribeToLibrary,
  type WatchHistoryItem,
  type WatchLaterItem,
  type WatchLaterTag,
  type UserCollection,
  CURATED_DISCOVER_COLLECTIONS,
} from '@/services/userLibrary';
import { toast } from 'sonner';

const EVENT_LIBRARY_CHANGE = 'movieguy_library_change';

export function useUserLibrary() {
  const { user } = useAuth();
  const [history, setHistory] = useState<WatchHistoryItem[]>(() =>
    userLibraryService.getWatchHistorySync()
  );
  const [watchLater, setWatchLater] = useState<WatchLaterItem[]>(() =>
    userLibraryService.getWatchLaterSync()
  );
  const [collections, setCollections] = useState<UserCollection[]>(() =>
    userLibraryService.getUserCollectionsSync()
  );
  const [savedCollections, setSavedCollections] = useState<UserCollection[]>(() =>
    userLibraryService.getSavedCollectionsSync()
  );
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [hist, later, cols, saved] = await Promise.all([
        userLibraryService.getWatchHistory(user?.id),
        userLibraryService.getWatchLater(user?.id),
        userLibraryService.getUserCollections(user?.id),
        userLibraryService.getSavedCollections(user?.id),
      ]);
      setHistory(hist);
      setWatchLater(later);
      setCollections(cols);
      setSavedCollections(saved);
    } catch {
      // In-memory/localStorage cache is already active and healthy
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // 0ms instant sync with in-memory singleton
    setHistory(userLibraryService.getWatchHistorySync());
    setWatchLater(userLibraryService.getWatchLaterSync());
    setCollections(userLibraryService.getUserCollectionsSync());
    setSavedCollections(userLibraryService.getSavedCollectionsSync());

    // Subscribe to immediate reactive updates across all components
    const unsubscribe = subscribeToLibrary(() => {
      setHistory([...userLibraryService.getWatchHistorySync()]);
      setWatchLater([...userLibraryService.getWatchLaterSync()]);
      setCollections([...userLibraryService.getUserCollectionsSync()]);
      setSavedCollections([...userLibraryService.getSavedCollectionsSync()]);
    });

    // Background sync with cloud if logged in
    if (user?.id) {
      loadData();
    }

    return () => {
      unsubscribe();
    };
  }, [user?.id, loadData]);

  // ── Watch History Helpers ──
  const isWatched = useCallback(
    (mediaId: number | string, mediaType: 'movie' | 'tv') => {
      const targetId = Number(mediaId);
      return history.some((h) => Number(h.media_id) === targetId && h.media_type === mediaType);
    },
    [history]
  );

  const toggleWatched = useCallback(
    async (item: {
      media_id: number;
      media_type: 'movie' | 'tv';
      title: string;
      poster_path?: string;
      backdrop_path?: string;
      release_year?: string;
      vote_average?: number;
    }) => {
      const already = isWatched(item.media_id, item.media_type);
      if (already) {
        userLibraryService.unmarkWatched(item.media_id, item.media_type, user?.id);
        toast.info(`Removed "${item.title}" from Watch History`);
      } else {
        userLibraryService.markAsWatched(
          {
            media_id: item.media_id,
            media_type: item.media_type,
            title: item.title,
            poster_path: item.poster_path || '',
            backdrop_path: item.backdrop_path || '',
            release_year: item.release_year || new Date().getFullYear().toString(),
            vote_average: item.vote_average || 0,
          },
          user?.id
        );

        // Once watched, automatically remove from Watch Later in 0ms
        userLibraryService.removeFromWatchLater(item.media_id, item.media_type, user?.id);
        toast.success(`Marked "${item.title}" as Watched!`);
      }
      return !already;
    },
    [isWatched, user?.id]
  );

  // ── Watch Later Helpers ──
  const isInWatchLater = useCallback(
    (mediaId: number | string, mediaType?: 'movie' | 'tv') => {
      const targetId = Number(mediaId);
      return watchLater.some(
        (l) => Number(l.media_id) === targetId && (!mediaType || l.media_type === mediaType)
      );
    },
    [watchLater]
  );

  const toggleWatchLater = useCallback(
    async (
      item: {
        media_id: number;
        media_type: 'movie' | 'tv';
        title: string;
        poster_path?: string;
        backdrop_path?: string;
        release_date?: string;
        vote_average?: number;
      },
      tag: WatchLaterTag = 'asap'
    ) => {
      const already = isInWatchLater(item.media_id, item.media_type);
      if (already) {
        userLibraryService.removeFromWatchLater(item.media_id, item.media_type, user?.id);
        toast.info(`Removed "${item.title}" from Watch Later`);
      } else {
        userLibraryService.addToWatchLater(
          {
            media_id: item.media_id,
            media_type: item.media_type,
            title: item.title,
            poster_path: item.poster_path || '',
            backdrop_path: item.backdrop_path || '',
            release_date: item.release_date || '',
            vote_average: item.vote_average || 0,
            tag,
          },
          user?.id
        );
        toast.success(`Saved "${item.title}" to Watch Later!`);
      }
      return !already;
    },
    [isInWatchLater, user?.id]
  );

  const setWatchLaterTag = useCallback(
    async (mediaId: number, mediaType: 'movie' | 'tv', newTag: WatchLaterTag) => {
      await userLibraryService.updateWatchLaterTag(mediaId, mediaType, newTag, user?.id);
    },
    [user?.id]
  );

  // ── Collection Helpers ──
  const createCollection = useCallback(
    async (title: string, desc = '', isPublic = true) => {
      const col = await userLibraryService.createCollection(title, desc, isPublic, user?.id);
      toast.success(`Created collection "${title}"`);
      return col;
    },
    [user?.id]
  );

  const deleteCollection = useCallback(
    async (collectionId: string) => {
      await userLibraryService.deleteCollection(collectionId, user?.id);
      toast.info('Collection deleted');
    },
    [user?.id]
  );

  const updateCollection = useCallback(
    async (
      collectionId: string,
      updates: {
        title?: string;
        description?: string;
        cover_image?: string;
        is_public?: boolean;
      }
    ) => {
      const col = await userLibraryService.updateCollection(collectionId, updates, user?.id);
      toast.success('Collection updated');
      return col;
    },
    [user?.id]
  );

  const addItemToCollection = useCallback(
    async (
      collectionId: string,
      item: {
        media_id: number;
        media_type: 'movie' | 'tv';
        title: string;
        poster_path?: string;
        release_year?: string;
        vote_average?: number;
      }
    ) => {
      await userLibraryService.addItemToCollection(collectionId, item, user?.id);
      toast.success(`Added to collection`);
    },
    [user?.id]
  );

  const removeItemFromCollection = useCallback(
    async (collectionId: string, mediaId: number, mediaType: 'movie' | 'tv') => {
      await userLibraryService.removeItemFromCollection(collectionId, mediaId, mediaType, user?.id);
      toast.info(`Removed from collection`);
    },
    [user?.id]
  );

  const toggleSaveCollection = useCallback(
    async (collection: UserCollection) => {
      const saved = await userLibraryService.toggleSaveCollection(collection, user?.id);
      if (saved) {
        toast.success(`Saved "${collection.title}" to your Collections`);
      } else {
        toast.info(`Removed "${collection.title}" from saved`);
      }
    },
    [user?.id]
  );

  return {
    history,
    watchLater,
    collections,
    savedCollections,
    discoverCollections: CURATED_DISCOVER_COLLECTIONS,
    loading,
    isWatched,
    toggleWatched,
    isInWatchLater,
    toggleWatchLater,
    setWatchLaterTag,
    createCollection,
    updateCollection,
    deleteCollection,
    addItemToCollection,
    removeItemFromCollection,
    toggleSaveCollection,
    refreshLibrary: loadData,
  };
}
