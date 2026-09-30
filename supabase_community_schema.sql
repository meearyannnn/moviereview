-- ==============================================================================
-- MOVIEGUY COMMUNITY SCHEMA — Run in Supabase Dashboard → SQL Editor
-- Adds: community_posts, post_comments, post_likes, user_follows
-- ==============================================================================

-- ── 1. Add bio / stats columns to existing profiles table ─────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS favorite_genres TEXT[],
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0;

-- ── 2. COMMUNITY POSTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  media_id INTEGER,
  media_type TEXT CHECK (media_type IN ('movie', 'tv')),
  media_title TEXT,
  media_poster TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'review', 'discussion', 'recommendation', 'news')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  image_url TEXT,
  video_url TEXT,
  link_url TEXT,
  link_title TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Ensure media columns exist on existing tables
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS link_url TEXT,
  ADD COLUMN IF NOT EXISTS link_title TEXT;

-- Relax content constraint to allow image-only, video-only, or link-only posts
ALTER TABLE public.community_posts DROP CONSTRAINT IF EXISTS community_posts_content_check;
ALTER TABLE public.community_posts ALTER COLUMN content DROP NOT NULL;
ALTER TABLE public.community_posts ALTER COLUMN content SET DEFAULT '';
ALTER TABLE public.community_posts ADD CONSTRAINT community_posts_content_check
  CHECK (
    char_length(content) <= 2000 AND (
      char_length(trim(content)) >= 1
      OR image_url IS NOT NULL
      OR video_url IS NOT NULL
      OR link_url IS NOT NULL
      OR media_id IS NOT NULL
    )
  );

CREATE INDEX IF NOT EXISTS idx_community_posts_user ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_media ON public.community_posts(media_id, media_type);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read posts." ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts." ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts." ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts." ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- ── 2b. STORAGE BUCKET FOR COMMUNITY MEDIA (optional) ────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-media', 'community-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public community media access"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-media');

CREATE POLICY "Authenticated users can upload community media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'community-media' AND auth.role() = 'authenticated');

-- ── 3. POST LIKES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view post likes." ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts." ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts." ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- ── 4. POST COMMENTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments." ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can comment." ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments." ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- ── 5. USER FOLLOWS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.user_follows(following_id);
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see follows." ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow." ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow." ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);

-- ── 6. FUNCTIONS: maintain counts ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_post_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_like ON public.post_likes;
CREATE TRIGGER on_post_like AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_like();

CREATE OR REPLACE FUNCTION public.handle_post_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_comment ON public.post_comments;
CREATE TRIGGER on_post_comment AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_comment();

CREATE OR REPLACE FUNCTION public.handle_user_follow()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_follow ON public.user_follows;
CREATE TRIGGER on_user_follow AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_follow();

CREATE OR REPLACE FUNCTION public.handle_community_post()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_community_post ON public.community_posts;
CREATE TRIGGER on_community_post AFTER INSERT OR DELETE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_community_post();

-- ── 7. RPC: personalized feed ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_community_feed(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 30,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID, user_id UUID, content TEXT,
  media_id INTEGER, media_type TEXT, media_title TEXT, media_poster TEXT,
  category TEXT, likes_count INTEGER, comments_count INTEGER,
  created_at TIMESTAMPTZ,
  username TEXT, avatar_url TEXT,
  liked_by_user BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id, cp.user_id, cp.content,
    cp.media_id, cp.media_type, cp.media_title, cp.media_poster,
    cp.category, cp.likes_count, cp.comments_count, cp.created_at,
    COALESCE(pr.username, 'Cinephile') AS username,
    COALESCE(pr.avatar_url, '') AS avatar_url,
    EXISTS(SELECT 1 FROM public.post_likes pl WHERE pl.post_id = cp.id AND pl.user_id = p_user_id) AS liked_by_user
  FROM public.community_posts cp
  LEFT JOIN public.profiles pr ON pr.id = cp.user_id
  WHERE
    cp.user_id = p_user_id OR
    cp.user_id IN (SELECT following_id FROM public.user_follows WHERE follower_id = p_user_id)
  ORDER BY cp.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. RPC: global discover feed ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_global_feed(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 30,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID, user_id UUID, content TEXT,
  media_id INTEGER, media_type TEXT, media_title TEXT, media_poster TEXT,
  category TEXT, likes_count INTEGER, comments_count INTEGER,
  created_at TIMESTAMPTZ,
  username TEXT, avatar_url TEXT,
  liked_by_user BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id, cp.user_id, cp.content,
    cp.media_id, cp.media_type, cp.media_title, cp.media_poster,
    cp.category, cp.likes_count, cp.comments_count, cp.created_at,
    COALESCE(pr.username, 'Cinephile') AS username,
    COALESCE(pr.avatar_url, '') AS avatar_url,
    CASE WHEN p_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM public.post_likes pl WHERE pl.post_id = cp.id AND pl.user_id = p_user_id)
    ELSE false END AS liked_by_user
  FROM public.community_posts cp
  LEFT JOIN public.profiles pr ON pr.id = cp.user_id
  ORDER BY cp.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 9. Ensure existing auth users have profiles rows ──────────────────────────
INSERT INTO public.profiles (id, username)
SELECT id, split_part(email, '@', 1)
FROM auth.users
ON CONFLICT (id) DO NOTHING;
