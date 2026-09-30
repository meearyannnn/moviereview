import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostCategory = 'general' | 'review' | 'discussion' | 'recommendation' | 'news';

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  media_id?: number | null;
  media_type?: 'movie' | 'tv' | null;
  media_title?: string | null;
  media_poster?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  link_url?: string | null;
  link_title?: string | null;
  category: PostCategory;
  likes_count: number;
  comments_count: number;
  created_at: string;
  username: string;
  avatar_url?: string;
  liked_by_user: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

export interface CommunityProfile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  favorite_genres?: string[];
  followers_count: number;
  following_count: number;
  posts_count: number;
}

// ─── Helper: Unpack attachment metadata ────────────────────────────────────────

export function unpackPostAttachments(rawContent: string): {
  content: string;
  attachments: { image_url?: string; video_url?: string; link_url?: string; link_title?: string };
} {
  if (!rawContent) return { content: '', attachments: {} };
  const match = rawContent.match(/\n\n<!--attachments:(.*?)-->$/s);
  if (!match) return { content: rawContent, attachments: {} };
  try {
    const meta = JSON.parse(match[1]);
    return { content: rawContent.replace(match[0], ''), attachments: meta || {} };
  } catch {
    return { content: rawContent, attachments: {} };
  }
}

// ─── Helper: 2-step Profile Enrichment ─────────────────────────────────────────

async function enrichWithProfiles<T extends { user_id: string; id?: string; content?: string }>(
  items: T[],
  currentUserId?: string | null
): Promise<(T & { username: string; avatar_url: string; liked_by_user: boolean; image_url?: string | null; video_url?: string | null; link_url?: string | null; link_title?: string | null })[]> {
  if (!items || items.length === 0) return [];

  const userIds = Array.from(new Set(items.map((i) => i.user_id).filter(Boolean)));
  const profileMap = new Map<string, { username: string; avatar_url?: string }>();

  if (userIds.length > 0) {
    try {
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
    } catch (err) {
      console.warn('Could not fetch profiles for items:', err);
    }
  }

  // If currentUserId provided, batch-check post likes
  let likedSet = new Set<string>();
  if (currentUserId && items.length > 0) {
    const postIds = items.map((i) => i.id).filter(Boolean) as string[];
    if (postIds.length > 0) {
      try {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds);

        if (likes) {
          likes.forEach((l: any) => likedSet.add(l.post_id));
        }
      } catch (err) {
        console.warn('Could not fetch post likes:', err);
      }
    }
  }

  return items.map((item: any) => {
    const prof = profileMap.get(item.user_id);
    const { content, attachments } = unpackPostAttachments(item.content || '');
    return {
      ...item,
      content,
      image_url: item.image_url || attachments.image_url || null,
      video_url: item.video_url || attachments.video_url || null,
      link_url: item.link_url || attachments.link_url || null,
      link_title: item.link_title || attachments.link_title || null,
      username: prof?.username || 'Cinephile',
      avatar_url: prof?.avatar_url || '',
      liked_by_user: item.id ? likedSet.has(item.id) : false,
    };
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const communityService = {
  // ── Feed ──────────────────────────────────────────────────────────────────
  async getPersonalizedFeed(
    userId: string,
    limit = 30,
    offset = 0,
    category?: PostCategory | 'all' | PostCategory[]
  ): Promise<CommunityPost[]> {
    try {
      // 1. Get user's following list
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      const targetUserIds = [userId, ...(following?.map((f: any) => f.following_id) || [])];

      let query = supabase
        .from('community_posts')
        .select('*')
        .in('user_id', targetUserIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (category && category !== 'all') {
        if (Array.isArray(category)) {
          query = query.in('category', category);
        } else {
          query = query.eq('category', category);
        }
      }

      const { data: posts, error } = await query;

      if (!error && posts && posts.length > 0) {
        return enrichWithProfiles(posts, userId);
      }

      // If user follows no one and has no posts yet (on offset 0), show global feed
      if (offset === 0) {
        return this.getGlobalFeed(userId, limit, offset, category);
      }

      return [];
    } catch {
      // Fallback to global feed
      return this.getGlobalFeed(userId, limit, offset, category);
    }
  },

  async getGlobalFeed(
    userId?: string | null,
    limit = 30,
    offset = 0,
    category?: PostCategory | 'all' | PostCategory[]
  ): Promise<CommunityPost[]> {
    try {
      let query = supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (category && category !== 'all') {
        if (Array.isArray(category)) {
          query = query.in('category', category);
        } else {
          query = query.eq('category', category);
        }
      }

      const { data, error } = await query;
      if (error) {
        console.warn('getGlobalFeed query error:', error.message);
        return [];
      }

      return enrichWithProfiles(data || [], userId);
    } catch (err) {
      console.error('getGlobalFeed error:', err);
      return [];
    }
  },

  // ── Posts ─────────────────────────────────────────────────────────────────
  async createPost(params: {
    userId: string;
    content: string;
    category?: PostCategory;
    mediaId?: number;
    mediaType?: 'movie' | 'tv';
    mediaTitle?: string;
    mediaPoster?: string;
    imageUrl?: string;
    videoUrl?: string;
    linkUrl?: string;
    linkTitle?: string;
  }): Promise<{ success: boolean; post?: CommunityPost; error?: string }> {
    try {
      const attachments = {
        image_url: params.imageUrl || null,
        video_url: params.videoUrl || null,
        link_url: params.linkUrl || null,
        link_title: params.linkTitle || null,
      };
      const hasAttachments = Object.values(attachments).some(Boolean);

      // Attempt 1: Try inserting with columns if DB table has them
      let insertData: any = {
        user_id: params.userId,
        content: params.content.trim(),
        category: params.category ?? 'general',
        media_id: params.mediaId ?? null,
        media_type: params.mediaType ?? null,
        media_title: params.mediaTitle ?? null,
        media_poster: params.mediaPoster ?? null,
      };

      if (hasAttachments) {
        insertData = { ...insertData, ...attachments };
      }

      let { data, error } = await supabase
        .from('community_posts')
        .insert(insertData)
        .select('*')
        .single();

      // If schema cache error because extra column doesn't exist yet, fallback to packed attachments in content
      if (error && hasAttachments && (error.message?.includes('schema cache') || error.message?.includes('column'))) {
        const packedContent = params.content.trim() + '\n\n<!--attachments:' + JSON.stringify(attachments) + '-->';
        const fallbackInsert = {
          user_id: params.userId,
          content: packedContent,
          category: params.category ?? 'general',
          media_id: params.mediaId ?? null,
          media_type: params.mediaType ?? null,
          media_title: params.mediaTitle ?? null,
          media_poster: params.mediaPoster ?? null,
        };
        const retry = await supabase
          .from('community_posts')
          .insert(fallbackInsert)
          .select('*')
          .single();

        data = retry.data;
        error = retry.error;
      }

      if (error || !data) return { success: false, error: error?.message || 'Failed to create post' };

      // Fetch profile separately
      const { data: prof } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', params.userId)
        .maybeSingle();

      const { content, attachments: unpacked } = unpackPostAttachments(data.content || '');

      return {
        success: true,
        post: {
          ...data,
          content,
          image_url: data.image_url || unpacked.image_url || null,
          video_url: data.video_url || unpacked.video_url || null,
          link_url: data.link_url || unpacked.link_url || null,
          link_title: data.link_title || unpacked.link_title || null,
          username: prof?.username ?? 'Cinephile',
          avatar_url: prof?.avatar_url ?? '',
          liked_by_user: false,
        } as CommunityPost,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // ── Media Upload (Supabase storage with safe fallback) ─────────────────────
  async uploadMedia(file: File): Promise<{ url?: string; error?: string }> {
    try {
      // 1. Try Supabase Storage bucket 'community-media'
      const ext = file.name.split('.').pop() || 'dat';
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('community-media')
        .upload(cleanFileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: pub } = supabase.storage.from('community-media').getPublicUrl(cleanFileName);
        if (pub?.publicUrl) {
          return { url: pub.publicUrl };
        }
      }

      // 2. Fallback: if storage bucket does not exist or upload fails,
      // For images under 5MB, read as data URL so it never fails!
      if (file.type.startsWith('image/') && file.size < 5 * 1024 * 1024) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ url: reader.result as string });
          reader.onerror = () => resolve({ error: 'Failed to read image file' });
          reader.readAsDataURL(file);
        });
      }

      // For videos under 15MB, also read as data URL if storage is unconfigured
      if (file.type.startsWith('video/') && file.size < 15 * 1024 * 1024) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ url: reader.result as string });
          reader.onerror = () => resolve({ error: 'Failed to read video file' });
          reader.readAsDataURL(file);
        });
      }

      if (error) {
        return { error: error.message };
      }
      return { error: 'File upload failed. Please try a smaller file or paste a direct link.' };
    } catch (err: any) {
      return { error: err.message || 'Media upload failed' };
    }
  },

  async deletePost(postId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .match({ id: postId, user_id: userId });
    return !error;
  },

  // ── Likes ─────────────────────────────────────────────────────────────────
  async togglePostLike(postId: string, userId: string, currentlyLiked: boolean): Promise<boolean> {
    try {
      if (currentlyLiked) {
        await supabase.from('post_likes').delete().match({ post_id: postId, user_id: userId });
        return false;
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
        return true;
      }
    } catch {
      return currentlyLiked;
    }
  },

  // ── Comments ──────────────────────────────────────────────────────────────
  async getComments(postId: string): Promise<PostComment[]> {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, post_id, user_id, content, likes_count, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];
      const enriched = await enrichWithProfiles(data);
      return enriched.map((c) => ({
        id: c.id,
        post_id: c.post_id,
        user_id: c.user_id,
        content: c.content,
        likes_count: c.likes_count,
        created_at: c.created_at,
        username: c.username,
        avatar_url: c.avatar_url,
      }));
    } catch {
      return [];
    }
  },

  async addComment(postId: string, userId: string, content: string): Promise<PostComment | null> {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, user_id: userId, content: content.trim() })
        .select('id, post_id, user_id, content, likes_count, created_at')
        .single();

      if (error || !data) return null;

      const { data: prof } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      return {
        ...data,
        username: prof?.username ?? 'Cinephile',
        avatar_url: prof?.avatar_url ?? '',
      };
    } catch {
      return null;
    }
  },

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .match({ id: commentId, user_id: userId });
    return !error;
  },

  // ── User Follows ──────────────────────────────────────────────────────────
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_follows')
      .insert({ follower_id: followerId, following_id: followingId });
    return !error;
  },

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });
    return !error;
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_follows')
      .select('id')
      .match({ follower_id: followerId, following_id: followingId })
      .maybeSingle();
    return !!data;
  },

  async getFollowers(userId: string): Promise<CommunityProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', userId);

      if (error || !data || data.length === 0) return [];
      const followerIds = data.map((d: any) => d.follower_id);

      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, followers_count, following_count, posts_count')
        .in('id', followerIds);

      return (profs || []) as CommunityProfile[];
    } catch {
      return [];
    }
  },

  async getFollowing(userId: string): Promise<CommunityProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (error || !data || data.length === 0) return [];
      const followingIds = data.map((d: any) => d.following_id);

      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, followers_count, following_count, posts_count')
        .in('id', followingIds);

      return (profs || []) as CommunityProfile[];
    } catch {
      return [];
    }
  },

  // ── Profile ────────────────────────────────────────────────────────────────
  async getProfile(userId: string): Promise<CommunityProfile | null> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, favorite_genres, followers_count, following_count, posts_count')
        .eq('id', userId)
        .maybeSingle();

      if (data) return data as CommunityProfile;

      return {
        id: userId,
        username: 'Cinephile',
        avatar_url: '',
        bio: '',
        favorite_genres: [],
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
      };
    } catch {
      return {
        id: userId,
        username: 'Cinephile',
        avatar_url: '',
        bio: '',
        favorite_genres: [],
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
      };
    }
  },

  async updateProfile(userId: string, updates: Partial<Pick<CommunityProfile, 'username' | 'bio' | 'avatar_url' | 'favorite_genres'>>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);
    return !error;
  },

  async getUserPosts(userId: string, currentUserId?: string): Promise<CommunityPost[]> {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return enrichWithProfiles(data, currentUserId);
    } catch {
      return [];
    }
  },

  // ── Real-time subscription ─────────────────────────────────────────────────
  subscribeToFeed(onPost: (post: any) => void) {
    return supabase
      .channel('community_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, onPost)
      .subscribe();
  },
};
