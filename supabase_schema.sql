-- ==============================================================================
-- MOVIEGUY PRODUCTION SUPABASE SCHEMA & RLS POLICIES
-- Run this in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. PROFILES TABLE (Public user profile linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    username TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Automatically create profile row when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. WATCHLIST TABLE (Cloud synced watchlist per user)
CREATE TABLE IF NOT EXISTS public.watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    title TEXT NOT NULL,
    poster_path TEXT,
    backdrop_path TEXT,
    vote_average NUMERIC,
    release_date TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, media_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist(user_id);
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watchlist." 
    ON public.watchlist FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own watchlist." 
    ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own watchlist." 
    ON public.watchlist FOR DELETE USING (auth.uid() = user_id);


-- 3. REVIEWS TABLE (Community reviews that fluctuate MovieGuy Meter)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    rating NUMERIC(3, 1) NOT NULL, -- 0.5 to 5.0 (or 1 to 10)
    verdict TEXT NOT NULL CHECK (verdict IN ('hardPass', 'decentWatch', 'mustWatch', 'absoluteCinema')),
    review_text TEXT,
    spoiler BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, media_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_reviews_media ON public.reviews(media_id, media_type);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews." 
    ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews." 
    ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews." 
    ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews." 
    ON public.reviews FOR DELETE USING (auth.uid() = user_id);


-- 4. REVIEW LIKES TABLE
CREATE TABLE IF NOT EXISTS public.review_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_likes_review ON public.review_likes(review_id);
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review likes." 
    ON public.review_likes FOR SELECT USING (true);

CREATE POLICY "Users can toggle their own like." 
    ON public.review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own like." 
    ON public.review_likes FOR DELETE USING (auth.uid() = user_id);


-- 5. RPC FUNCTION: GET MOVIEGUY COMMUNITY CONSENSUS & METER METRICS
-- Fast calculation directly on the database in under 2ms
CREATE OR REPLACE FUNCTION public.get_community_score(p_media_id INTEGER, p_media_type TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_reviews', COUNT(*),
        'avg_rating', COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
        'hard_pass_count', COUNT(*) FILTER (WHERE verdict = 'hardPass'),
        'decent_watch_count', COUNT(*) FILTER (WHERE verdict = 'decentWatch'),
        'must_watch_count', COUNT(*) FILTER (WHERE verdict = 'mustWatch'),
        'absolute_cinema_count', COUNT(*) FILTER (WHERE verdict = 'absoluteCinema'),
        'community_score', COALESCE(ROUND(AVG(
            CASE 
                WHEN verdict = 'absoluteCinema' THEN 95.0
                WHEN verdict = 'mustWatch' THEN 80.0
                WHEN verdict = 'decentWatch' THEN 55.0
                WHEN verdict = 'hardPass' THEN 20.0
                ELSE rating * 20.0
            END
        )::numeric, 1), 0)
    ) INTO result
    FROM public.reviews
    WHERE media_id = p_media_id AND media_type = p_media_type;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
