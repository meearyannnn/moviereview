import { supabase } from '@/lib/supabase';
import type { TierKey } from '@/components/MovieGuyMeter';

export interface CommunityReview {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  rating: number; // 0.5 - 5.0
  verdict: TierKey;
  review_text?: string;
  spoiler: boolean;
  likes: number;
  liked_by_user?: boolean;
  created_at: string;
}

export interface CommunityConsensus {
  total_reviews: number;
  avg_rating: number;
  hard_pass_count: number;
  decent_watch_count: number;
  must_watch_count: number;
  absolute_cinema_count: number;
  community_score: number; // 0 - 100
}

export const communityReviewsService = {
  // Fetch reviews for a media item
  async getReviews(mediaId: number, mediaType: 'movie' | 'tv', currentUserId?: string): Promise<CommunityReview[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          user_id,
          media_id,
          media_type,
          rating,
          verdict,
          review_text,
          spoiler,
          likes,
          created_at
        `)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching reviews:', error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      // 2-step profile fetch
      const userIds = Array.from(new Set(data.map((r: any) => r.user_id).filter(Boolean)));
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

      // Check liked by current user if logged in
      let likedReviewIds = new Set<string>();
      if (currentUserId && data.length > 0) {
        const { data: likesData } = await supabase
          .from('review_likes')
          .select('review_id')
          .eq('user_id', currentUserId)
          .in('review_id', data.map((r: any) => r.id));

        if (likesData) {
          likesData.forEach((l: any) => likedReviewIds.add(l.review_id));
        }
      }

      return data.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        username: profileMap.get(row.user_id)?.username || 'Cinephile',
        avatar_url: profileMap.get(row.user_id)?.avatar_url || '',
        media_id: row.media_id,
        media_type: row.media_type,
        rating: Number(row.rating),
        verdict: row.verdict as TierKey,
        review_text: row.review_text || '',
        spoiler: !!row.spoiler,
        likes: Number(row.likes) || 0,
        liked_by_user: likedReviewIds.has(row.id),
        created_at: row.created_at,
      }));
    } catch (err) {
      console.error('getReviews failed:', err);
      return [];
    }
  },

  // Submit or update a user review
  async submitReview(params: {
    userId: string;
    mediaId: number;
    mediaType: 'movie' | 'tv';
    rating: number;
    verdict: TierKey;
    reviewText?: string;
    spoiler?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('reviews').upsert(
        {
          user_id: params.userId,
          media_id: params.mediaId,
          media_type: params.mediaType,
          rating: params.rating,
          verdict: params.verdict,
          review_text: params.reviewText || '',
          spoiler: params.spoiler || false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,media_id,media_type' }
      );

      if (error) {
        if (error.message?.includes('schema cache') || error.code === 'PGRST205') {
          return {
            success: false,
            error: "Database tables not found. Please run 'supabase_schema.sql' in your Supabase SQL Editor.",
          };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to submit review' };
    }
  },

  // Fetch consensus score to fluctuate MovieGuy Meter
  async getCommunityScore(mediaId: number, mediaType: 'movie' | 'tv'): Promise<CommunityConsensus | null> {
    try {
      // 1. Try RPC function if created
      const { data, error } = await supabase.rpc('get_community_score', {
        p_media_id: mediaId,
        p_media_type: mediaType,
      });

      if (!error && data) {
        return data as CommunityConsensus;
      }

      // 2. Fallback direct query if RPC is not deployed yet
      const { data: directData, error: directError } = await supabase
        .from('reviews')
        .select('rating, verdict')
        .eq('media_id', mediaId)
        .eq('media_type', mediaType);

      if (directError || !directData || directData.length === 0) {
        return null;
      }

      const total = directData.length;
      let hp = 0, dw = 0, mw = 0, ac = 0;
      let totalRating = 0;
      let totalScore = 0;

      for (const r of directData) {
        totalRating += Number(r.rating) || 3;
        if (r.verdict === 'hardPass') {
          hp++;
          totalScore += 20;
        } else if (r.verdict === 'decentWatch') {
          dw++;
          totalScore += 55;
        } else if (r.verdict === 'mustWatch') {
          mw++;
          totalScore += 80;
        } else if (r.verdict === 'absoluteCinema') {
          ac++;
          totalScore += 95;
        } else {
          totalScore += (Number(r.rating) || 3) * 20;
        }
      }

      return {
        total_reviews: total,
        avg_rating: Math.round((totalRating / total) * 10) / 10,
        hard_pass_count: hp,
        decent_watch_count: dw,
        must_watch_count: mw,
        absolute_cinema_count: ac,
        community_score: Math.round((totalScore / total) * 10) / 10,
      };
    } catch (err) {
      console.warn('getCommunityScore warning:', err);
      return null;
    }
  },

  // Toggle like on a review
  async toggleLike(reviewId: string, userId: string, currentlyLiked: boolean): Promise<boolean> {
    try {
      if (currentlyLiked) {
        await supabase.from('review_likes').delete().match({ review_id: reviewId, user_id: userId });
        await supabase.rpc('decrement_review_likes', { review_id: reviewId }).catch(() => {});
        return false;
      } else {
        await supabase.from('review_likes').insert({ review_id: reviewId, user_id: userId });
        await supabase.rpc('increment_review_likes', { review_id: reviewId }).catch(() => {});
        return true;
      }
    } catch {
      return currentlyLiked;
    }
  },
};
