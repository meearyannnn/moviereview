// src/services/userLibrary.ts — Supabase & Offline User Library Service
// Handles: Watch History, Watch Later (with ASAP/Weekend/Someday tags), Collections, and Discover collections.

import { supabase } from '@/lib/supabase';

export interface WatchHistoryItem {
  id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string;
  backdrop_path?: string;
  release_year: string;
  vote_average?: number;
  watched_at: string;
  reviewed?: boolean;
}

export type WatchLaterTag = 'all' | 'asap' | 'weekend' | 'someday';

export interface WatchLaterItem {
  id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  tag: WatchLaterTag;
  created_at: string;
}

export interface UserCollection {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  cover_image?: string;
  is_public: boolean;
  items_count: number;
  likes_count: number;
  created_at: string;
  username?: string;
  avatar_url?: string;
  is_saved?: boolean;
  preview_posters?: string[];
}

export interface UserCollectionItem {
  id: string;
  collection_id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  media_title: string;
  media_poster?: string;
  release_year?: string;
  vote_average?: number;
  added_at: string;
}

const STORAGE_KEYS = {
  HISTORY: 'movieguy_watch_history_v1',
  WATCH_LATER: 'movieguy_watch_later_v1',
  COLLECTIONS: 'movieguy_user_collections_v1',
  SAVED_COLLECTIONS: 'movieguy_saved_collections_v1',
};

// ── Built-in Curated Discover Collections (Matching Screenshot 5) ────────────
export const CURATED_DISCOVER_COLLECTIONS: UserCollection[] = [
  {
    id: 'curated-ranbir-kapoor',
    user_id: 'system',
    title: 'Celebrating Ranbir Kapoor',
    description: 'Iconic career highlights from Rockstar, Barfi, and Yeh Jawaani Hai Deewani to Animal.',
    cover_image: 'https://image.tmdb.org/t/p/w780/a9N8d93h1Nn5cO5GfV00aT12vM.jpg',
    is_public: true,
    items_count: 17,
    likes_count: 90,
    created_at: '2026-09-01T00:00:00Z',
    username: 'Aryan Singh',
  },
  {
    id: 'curated-what-movie',
    user_id: 'system',
    title: 'Wait, WHAT Movie Is This?',
    description: 'Mind-benders, bizarre plot twists, and unforgettable WTF cinema moments.',
    cover_image: 'https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zJWguTQ2vCW42.jpg',
    is_public: true,
    items_count: 30,
    likes_count: 67,
    created_at: '2026-09-05T00:00:00Z',
    username: 'FilmSociety',
  },
  {
    id: 'curated-tiff-winners',
    user_id: 'system',
    title: 'TIFF Winners 2026',
    description: 'Award-winning cinematic triumphs premiered at Toronto International Film Festival.',
    cover_image: 'https://image.tmdb.org/t/p/w780/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    is_public: true,
    items_count: 8,
    likes_count: 32,
    created_at: '2026-09-10T00:00:00Z',
    username: 'FestivalRadar',
  },
  {
    id: 'curated-emmy-winners',
    user_id: 'system',
    title: 'Emmy Winners 2026',
    description: 'Outstanding drama and comedy series recognized by the Television Academy.',
    cover_image: 'https://image.tmdb.org/t/p/w780/etj5CuMuamjhGjQFTmY3pHMUV5B.jpg',
    is_public: true,
    items_count: 16,
    likes_count: 45,
    created_at: '2026-09-15T00:00:00Z',
    username: 'GoldenGlobe',
  },
  {
    id: 'curated-akshay-kumar',
    user_id: 'system',
    title: 'Celebrating Akshay Kumar',
    description: 'The Khiladi era, classic Bollywood comedies, and patriotic action thrillers.',
    cover_image: 'https://image.tmdb.org/t/p/w780/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg',
    is_public: true,
    items_count: 30,
    likes_count: 94,
    created_at: '2026-09-18T00:00:00Z',
    username: 'BollyMaster',
  },
  {
    id: 'curated-teachers-difference',
    user_id: 'system',
    title: 'Teachers Who Make a Difference',
    description: 'Inspiring educators and mentors that transformed lives on the silver screen.',
    cover_image: 'https://image.tmdb.org/t/p/w780/7fn624j5lj3xTme2SgiLCeuedmO.jpg',
    is_public: true,
    items_count: 30,
    likes_count: 51,
    created_at: '2026-09-20T00:00:00Z',
    username: 'CinemaEdu',
  },
];

// Helper to get local data safely
const getLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

export const userLibraryService = {
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. WATCH HISTORY (Logs movies/shows as "Watched")
  // ═══════════════════════════════════════════════════════════════════════════
  async getWatchHistory(userId?: string): Promise<WatchHistoryItem[]> {
    const local = getLocal<WatchHistoryItem[]>(STORAGE_KEYS.HISTORY, []);

    if (!userId) return local;

    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false });

      if (error || !data) {
        return local;
      }

      // Merge cloud with local
      const mergedMap = new Map<string, WatchHistoryItem>();
      data.forEach((row: any) => {
        mergedMap.set(`${row.media_type}_${row.media_id}`, {
          id: row.id,
          media_id: row.media_id,
          media_type: row.media_type,
          title: row.title,
          poster_path: row.poster_path,
          backdrop_path: row.backdrop_path,
          release_year: row.release_year,
          vote_average: row.vote_average,
          watched_at: row.watched_at,
          reviewed: row.reviewed || false,
        });
      });

      local.forEach((item) => {
        const key = `${item.media_type}_${item.media_id}`;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, item);
        }
      });

      const result = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime()
      );
      setLocal(STORAGE_KEYS.HISTORY, result);
      return result;
    } catch {
      return local;
    }
  },

  async markAsWatched(
    item: Omit<WatchHistoryItem, 'id' | 'watched_at'> & { watched_at?: string },
    userId?: string
  ): Promise<WatchHistoryItem> {
    const watchedAt = item.watched_at || new Date().toISOString();
    const historyItem: WatchHistoryItem = {
      ...item,
      id: `local-history-${Date.now()}-${item.media_id}`,
      watched_at: watchedAt,
      reviewed: item.reviewed || false,
    };

    // Save to local immediately for instant 0ms UI update
    const local = getLocal<WatchHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
    const filtered = local.filter(
      (h) => !(h.media_id === item.media_id && h.media_type === item.media_type)
    );
    const updated = [historyItem, ...filtered];
    setLocal(STORAGE_KEYS.HISTORY, updated);

    // Sync to Supabase in background
    if (userId) {
      try {
        await supabase.from('watch_history').upsert(
          {
            user_id: userId,
            media_id: item.media_id,
            media_type: item.media_type,
            title: item.title,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path || '',
            release_year: item.release_year,
            vote_average: item.vote_average || 0,
            watched_at: watchedAt,
          },
          { onConflict: 'user_id,media_id,media_type' }
        );
      } catch (err) {
        console.warn('Supabase watch_history sync failed (using local):', err);
      }
    }

    return historyItem;
  },

  async unmarkWatched(mediaId: number, mediaType: 'movie' | 'tv', userId?: string): Promise<boolean> {
    const local = getLocal<WatchHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
    const updated = local.filter(
      (h) => !(h.media_id === mediaId && h.media_type === mediaType)
    );
    setLocal(STORAGE_KEYS.HISTORY, updated);

    if (userId) {
      try {
        await supabase
          .from('watch_history')
          .delete()
          .match({ user_id: userId, media_id: mediaId, media_type: mediaType });
      } catch {}
    }
    return true;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. WATCH LATER (With ASAP / Weekend / Someday priority tags)
  // ═══════════════════════════════════════════════════════════════════════════
  async getWatchLater(userId?: string): Promise<WatchLaterItem[]> {
    let local = getLocal<WatchLaterItem[]>(STORAGE_KEYS.WATCH_LATER, []);

    // Seamlessly migrate any legacy watchlist items into watch later so data is fully preserved
    try {
      const legacyRaw = localStorage.getItem('movieguy_watchlist_v1');
      if (legacyRaw) {
        const legacyItems = JSON.parse(legacyRaw);
        if (Array.isArray(legacyItems) && legacyItems.length > 0) {
          const existingKeys = new Set(local.map((l) => `${l.media_type}_${l.media_id}`));
          let hasNew = false;
          legacyItems.forEach((it: any) => {
            const mType = (it.media_type as 'movie' | 'tv') || 'movie';
            const k = `${mType}_${it.id}`;
            if (!existingKeys.has(k)) {
              local.push({
                id: `legacy-${it.id}`,
                media_id: it.id,
                media_type: mType,
                title: it.title || 'Untitled',
                poster_path: it.poster_path || '',
                backdrop_path: it.backdrop_path || '',
                release_date: it.release_date || '',
                vote_average: it.vote_average || 0,
                tag: 'asap',
                created_at: new Date().toISOString(),
              });
              existingKeys.add(k);
              hasNew = true;
            }
          });
          if (hasNew) {
            setLocal(STORAGE_KEYS.WATCH_LATER, local);
          }
        }
      }
    } catch {}

    if (!userId) return local;

    try {
      const { data, error } = await supabase
        .from('watch_later')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return local;

      const mergedMap = new Map<string, WatchLaterItem>();
      data.forEach((row: any) => {
        mergedMap.set(`${row.media_type}_${row.media_id}`, {
          id: row.id,
          media_id: row.media_id,
          media_type: row.media_type,
          title: row.title,
          poster_path: row.poster_path,
          backdrop_path: row.backdrop_path,
          release_date: row.release_date,
          vote_average: row.vote_average,
          tag: row.tag || 'asap',
          created_at: row.created_at,
        });
      });

      local.forEach((item) => {
        const key = `${item.media_type}_${item.media_id}`;
        if (!mergedMap.has(key)) mergedMap.set(key, item);
      });

      const result = Array.from(mergedMap.values());
      setLocal(STORAGE_KEYS.WATCH_LATER, result);
      return result;
    } catch {
      return local;
    }
  },

  async addToWatchLater(
    item: Omit<WatchLaterItem, 'id' | 'created_at'> & { tag?: WatchLaterTag },
    userId?: string
  ): Promise<WatchLaterItem> {
    const newItem: WatchLaterItem = {
      ...item,
      id: `local-later-${Date.now()}-${item.media_id}`,
      tag: item.tag || 'asap',
      created_at: new Date().toISOString(),
    };

    const local = getLocal<WatchLaterItem[]>(STORAGE_KEYS.WATCH_LATER, []);
    const filtered = local.filter(
      (l) => !(l.media_id === item.media_id && l.media_type === item.media_type)
    );
    const updated = [newItem, ...filtered];
    setLocal(STORAGE_KEYS.WATCH_LATER, updated);

    if (userId) {
      try {
        await supabase.from('watch_later').upsert(
          {
            user_id: userId,
            media_id: item.media_id,
            media_type: item.media_type,
            title: item.title,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path || '',
            release_date: item.release_date || '',
            vote_average: item.vote_average || 0,
            tag: item.tag || 'asap',
          },
          { onConflict: 'user_id,media_id,media_type' }
        );
      } catch {}
    }

    return newItem;
  },

  async removeFromWatchLater(mediaId: number, mediaType: 'movie' | 'tv', userId?: string): Promise<boolean> {
    const local = getLocal<WatchLaterItem[]>(STORAGE_KEYS.WATCH_LATER, []);
    const updated = local.filter(
      (l) => !(l.media_id === mediaId && l.media_type === mediaType)
    );
    setLocal(STORAGE_KEYS.WATCH_LATER, updated);

    if (userId) {
      try {
        await supabase
          .from('watch_later')
          .delete()
          .match({ user_id: userId, media_id: mediaId, media_type: mediaType });
      } catch {}
    }
    return true;
  },

  async updateWatchLaterTag(
    mediaId: number,
    mediaType: 'movie' | 'tv',
    newTag: WatchLaterTag,
    userId?: string
  ): Promise<boolean> {
    const local = getLocal<WatchLaterItem[]>(STORAGE_KEYS.WATCH_LATER, []);
    const updated = local.map((it) => {
      if (it.media_id === mediaId && it.media_type === mediaType) {
        return { ...it, tag: newTag };
      }
      return it;
    });
    setLocal(STORAGE_KEYS.WATCH_LATER, updated);

    if (userId) {
      try {
        await supabase
          .from('watch_later')
          .update({ tag: newTag })
          .match({ user_id: userId, media_id: mediaId, media_type: mediaType });
      } catch {}
    }
    return true;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. COLLECTIONS (User Custom Lists & Public Curated Lists)
  // ═══════════════════════════════════════════════════════════════════════════
  async getUserCollections(userId?: string): Promise<UserCollection[]> {
    const defaultLocal: UserCollection[] = [
      {
        id: 'default-watch-later-col',
        user_id: userId || 'guest',
        title: "Aryan's Watch Later",
        description: 'Priority watchlist and weekend cinema lineup.',
        cover_image: '',
        is_public: false,
        items_count: 0,
        likes_count: 0,
        created_at: new Date().toISOString(),
        username: 'Aryan',
      },
    ];

    const local = getLocal<UserCollection[]>(STORAGE_KEYS.COLLECTIONS, defaultLocal);
    if (!userId) {
      return local.map((col) => {
        const localItems = getLocal<UserCollectionItem[]>(`movieguy_col_items_${col.id}`, []);
        const posters = localItems.map((i) => i.media_poster).filter(Boolean) as string[];
        return {
          ...col,
          items_count: Math.max(col.items_count || 0, localItems.length),
          preview_posters: posters.slice(0, 4),
        };
      });
    }

    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return local.map((col) => {
          const localItems = getLocal<UserCollectionItem[]>(`movieguy_col_items_${col.id}`, []);
          const posters = localItems.map((i) => i.media_poster).filter(Boolean) as string[];
          return {
            ...col,
            items_count: Math.max(col.items_count || 0, localItems.length),
            preview_posters: posters.slice(0, 4),
          };
        });
      }

      // Merge Supabase collections with any locally created ones
      const cloudIds = new Set(data.map((c: any) => c.id));
      const unsyncedLocal = local.filter((l) => !cloudIds.has(l.id));

      const merged = [...(data as UserCollection[]), ...unsyncedLocal].map((col) => {
        const localItems = getLocal<UserCollectionItem[]>(`movieguy_col_items_${col.id}`, []);
        const trueCount = Math.max(col.items_count || 0, localItems.length);
        const posters = localItems.map((i) => i.media_poster).filter(Boolean) as string[];
        return { ...col, items_count: trueCount, preview_posters: posters.slice(0, 4) };
      });

      // Try fetching posters from Supabase for collections with empty local posters
      if (cloudIds.size > 0) {
        try {
          const { data: itemRows } = await supabase
            .from('collection_items')
            .select('collection_id, media_poster, added_at')
            .in('collection_id', Array.from(cloudIds))
            .order('added_at', { ascending: false });

          if (itemRows && itemRows.length > 0) {
            const postersMap = new Map<string, string[]>();
            itemRows.forEach((r: any) => {
              if (!r.media_poster) return;
              if (!postersMap.has(r.collection_id)) postersMap.set(r.collection_id, []);
              const list = postersMap.get(r.collection_id)!;
              if (list.length < 4 && !list.includes(r.media_poster)) {
                list.push(r.media_poster);
              }
            });

            merged.forEach((col) => {
              const cloudPosters = postersMap.get(col.id);
              if (cloudPosters && cloudPosters.length > 0) {
                const combined = Array.from(new Set([...(col.preview_posters || []), ...cloudPosters]));
                col.preview_posters = combined.slice(0, 4);
              }
            });
          }
        } catch {}
      }

      setLocal(STORAGE_KEYS.COLLECTIONS, merged);
      return merged;
    } catch {
      return local.map((col) => {
        const localItems = getLocal<UserCollectionItem[]>(`movieguy_col_items_${col.id}`, []);
        const posters = localItems.map((i) => i.media_poster).filter(Boolean) as string[];
        return {
          ...col,
          items_count: Math.max(col.items_count || 0, localItems.length),
          preview_posters: posters.slice(0, 4),
        };
      });
    }
  },

  async createCollection(
    title: string,
    description = '',
    isPublic = true,
    userId?: string
  ): Promise<UserCollection> {
    let finalCol: UserCollection = {
      id: `col-${Date.now()}`,
      user_id: userId || 'guest',
      title,
      description,
      is_public: isPublic,
      items_count: 0,
      likes_count: 0,
      created_at: new Date().toISOString(),
      username: 'You',
    };

    if (userId) {
      try {
        const { data, error } = await supabase
          .from('collections')
          .insert({
            user_id: userId,
            title,
            description,
            is_public: isPublic,
            items_count: 0,
            likes_count: 0,
          })
          .select('*')
          .single();

        if (data && !error) {
          finalCol = data as UserCollection;
        }
      } catch (err) {
        console.warn('Supabase collection creation fallback:', err);
      }
    }

    const local = getLocal<UserCollection[]>(STORAGE_KEYS.COLLECTIONS, []);
    const updated = [finalCol, ...local.filter((c) => c.id !== finalCol.id)];
    setLocal(STORAGE_KEYS.COLLECTIONS, updated);

    return finalCol;
  },

  async deleteCollection(collectionId: string, userId?: string): Promise<boolean> {
    const local = getLocal<UserCollection[]>(STORAGE_KEYS.COLLECTIONS, []);
    const updated = local.filter((c) => c.id !== collectionId);
    setLocal(STORAGE_KEYS.COLLECTIONS, updated);
    try {
      localStorage.removeItem(`movieguy_col_items_${collectionId}`);
    } catch {}

    if (userId && !collectionId.startsWith('col-')) {
      try {
        await supabase.from('collections').delete().match({ id: collectionId, user_id: userId });
      } catch {}
    }
    return true;
  },

  async addItemToCollection(
    collectionId: string,
    item: {
      media_id: number;
      media_type: 'movie' | 'tv';
      title: string;
      poster_path?: string;
      release_year?: string;
      vote_average?: number;
    },
    userId?: string
  ): Promise<boolean> {
    const localKey = `movieguy_col_items_${collectionId}`;
    const items = getLocal<UserCollectionItem[]>(localKey, []);

    const existingIndex = items.findIndex(
      (i) => i.media_id === item.media_id && i.media_type === item.media_type
    );
    if (existingIndex === -1) {
      const newItem: UserCollectionItem = {
        id: `ci-${Date.now()}`,
        collection_id: collectionId,
        media_id: item.media_id,
        media_type: item.media_type,
        media_title: item.title,
        media_poster: item.poster_path,
        release_year: item.release_year,
        vote_average: item.vote_average,
        added_at: new Date().toISOString(),
      };
      setLocal(localKey, [newItem, ...items]);

      // Update collection item count and preview posters in local
      const cols = getLocal<UserCollection[]>(STORAGE_KEYS.COLLECTIONS, []);
      const updatedCols = cols.map((c) => {
        if (c.id !== collectionId) return c;
        const currentPosters = c.preview_posters || [];
        const newPosters = item.poster_path && !currentPosters.includes(item.poster_path)
          ? [item.poster_path, ...currentPosters].slice(0, 4)
          : currentPosters;
        return {
          ...c,
          items_count: (c.items_count || 0) + 1,
          preview_posters: newPosters,
        };
      });
      setLocal(STORAGE_KEYS.COLLECTIONS, updatedCols);
    }

    if (userId && !collectionId.startsWith('col-')) {
      try {
        await supabase.from('collection_items').upsert(
          {
            collection_id: collectionId,
            media_id: item.media_id,
            media_type: item.media_type,
            media_title: item.title,
            media_poster: item.poster_path || '',
            release_year: item.release_year || '',
            vote_average: item.vote_average || 0,
          },
          { onConflict: 'collection_id,media_id,media_type' }
        );

        // Fallback sync items_count directly in collections table
        const { count } = await supabase
          .from('collection_items')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collectionId);

        if (typeof count === 'number') {
          await supabase
            .from('collections')
            .update({ items_count: count })
            .eq('id', collectionId);
        }
      } catch (err) {
        console.warn('Supabase addItemToCollection notice:', err);
      }
    }

    return true;
  },

  async removeItemFromCollection(
    collectionId: string,
    mediaId: number,
    mediaType: 'movie' | 'tv',
    userId?: string
  ): Promise<boolean> {
    const localKey = `movieguy_col_items_${collectionId}`;
    const items = getLocal<UserCollectionItem[]>(localKey, []);
    const updated = items.filter(
      (i) => !(i.media_id === mediaId && i.media_type === mediaType)
    );
    setLocal(localKey, updated);

    // Update count & preview posters in local
    const cols = getLocal<UserCollection[]>(STORAGE_KEYS.COLLECTIONS, []);
    const remainingPosters = updated.map((it) => it.media_poster).filter(Boolean) as string[];
    const updatedCols = cols.map((c) =>
      c.id === collectionId
        ? {
            ...c,
            items_count: Math.max(0, (c.items_count || 1) - 1),
            preview_posters: remainingPosters.slice(0, 4),
          }
        : c
    );
    setLocal(STORAGE_KEYS.COLLECTIONS, updatedCols);

    if (userId && !collectionId.startsWith('col-')) {
      try {
        await supabase
          .from('collection_items')
          .delete()
          .match({ collection_id: collectionId, media_id: mediaId, media_type: mediaType });

        const { count } = await supabase
          .from('collection_items')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collectionId);

        if (typeof count === 'number') {
          await supabase
            .from('collections')
            .update({ items_count: count })
            .eq('id', collectionId);
        }
      } catch {}
    }
    return true;
  },

  async getCollectionItems(collectionId: string): Promise<UserCollectionItem[]> {
    const localKey = `movieguy_col_items_${collectionId}`;
    const local = getLocal<UserCollectionItem[]>(localKey, []);

    if (collectionId.startsWith('col-') || collectionId.startsWith('default-')) {
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('collection_items')
        .select('*')
        .eq('collection_id', collectionId)
        .order('added_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return local;
      }

      // Merge Supabase items with local items
      const map = new Map<string, UserCollectionItem>();
      data.forEach((d: any) => map.set(`${d.media_type}_${d.media_id}`, d as UserCollectionItem));
      local.forEach((l) => {
        const k = `${l.media_type}_${l.media_id}`;
        if (!map.has(k)) map.set(k, l);
      });

      const combined = Array.from(map.values());
      setLocal(localKey, combined);
      return combined;
    } catch {
      return local;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SAVED COLLECTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  async getSavedCollections(userId?: string): Promise<UserCollection[]> {
    const local = getLocal<UserCollection[]>(STORAGE_KEYS.SAVED_COLLECTIONS, []);
    if (!userId) return local;

    try {
      const { data } = await supabase
        .from('collection_likes')
        .select('collection_id, collections(*)')
        .eq('user_id', userId);

      if (data && data.length > 0) {
        return data.map((d: any) => d.collections).filter(Boolean);
      }
    } catch {}

    return local;
  },

  async toggleSaveCollection(collection: UserCollection, userId?: string): Promise<boolean> {
    const local = getLocal<UserCollection[]>(STORAGE_KEYS.SAVED_COLLECTIONS, []);
    const exists = local.some((c) => c.id === collection.id);

    let updated: UserCollection[];
    if (exists) {
      updated = local.filter((c) => c.id !== collection.id);
    } else {
      updated = [{ ...collection, is_saved: true }, ...local];
    }
    setLocal(STORAGE_KEYS.SAVED_COLLECTIONS, updated);

    if (userId && !collection.id.startsWith('curated-')) {
      try {
        if (exists) {
          await supabase
            .from('collection_likes')
            .delete()
            .match({ user_id: userId, collection_id: collection.id });
        } else {
          await supabase
            .from('collection_likes')
            .insert({ user_id: userId, collection_id: collection.id });
        }
      } catch {}
    }

    return !exists;
  },
};
