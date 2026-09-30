// ── Collections service ──────────────────────────────────────────────────────
// Handles the collections + collection_items tables in Supabase
// Run supabase_collections_schema.sql first to create these tables.

import { supabase } from '@/lib/supabase';

export interface Collection {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  is_public: boolean;
  items_count: number;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  media_title: string;
  media_poster?: string;
  added_at: string;
}

export const collectionsService = {
  // ── Public collections (browse) ────────────────────────────────────────────
  async getPublicCollections(limit = 30, offset = 0): Promise<Collection[]> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('id, user_id, title, description, is_public, items_count, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error || !data || data.length === 0) return [];

      const userIds = Array.from(new Set(data.map((c: any) => c.user_id).filter(Boolean)));
      const profileMap = new Map<string, { username: string; avatar_url: string }>();

      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        if (profs) {
          profs.forEach((p) => {
            profileMap.set(p.id, {
              username: p.username || 'Cinephile',
              avatar_url: p.avatar_url || '',
            });
          });
        }
      }

      return data.map((row: any) => ({
        ...row,
        username: profileMap.get(row.user_id)?.username || 'Cinephile',
        avatar_url: profileMap.get(row.user_id)?.avatar_url || '',
      }));
    } catch {
      return [];
    }
  },

  // ── My collections ─────────────────────────────────────────────────────────
  async getUserCollections(userId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('id, user_id, title, description, is_public, items_count, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as Collection[];
  },

  // ── Create ─────────────────────────────────────────────────────────────────
  async createCollection(userId: string, title: string, description?: string, isPublic = true): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: userId, title, description: description ?? '', is_public: isPublic, items_count: 0 })
      .select('id, user_id, title, description, is_public, items_count, created_at')
      .single();
    if (error || !data) return null;
    return data as Collection;
  },

  // ── Delete ─────────────────────────────────────────────────────────────────
  async deleteCollection(collectionId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .match({ id: collectionId, user_id: userId });
    return !error;
  },

  // ── Items ──────────────────────────────────────────────────────────────────
  async getItems(collectionId: string): Promise<CollectionItem[]> {
    const { data, error } = await supabase
      .from('collection_items')
      .select('id, collection_id, media_id, media_type, media_title, media_poster, added_at')
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false });
    if (error || !data) return [];
    return data as CollectionItem[];
  },

  async addItem(collectionId: string, item: Omit<CollectionItem, 'id' | 'collection_id' | 'added_at'>): Promise<boolean> {
    const { error } = await supabase
      .from('collection_items')
      .upsert({ collection_id: collectionId, ...item }, { onConflict: 'collection_id,media_id,media_type' });
    if (!error) {
      // Increment items_count
      await supabase.rpc('increment_collection_items', { p_collection_id: collectionId }).catch(() => {});
    }
    return !error;
  },

  async removeItem(collectionItemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', collectionItemId);
    return !error;
  },
};
