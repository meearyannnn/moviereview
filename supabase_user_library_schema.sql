-- ==============================================================================
-- MOVIEGUY USER LIBRARY & COLLECTIONS SCHEMA (SUPABASE SQL)
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- Safe & idempotent: can be executed multiple times without conflicts.
-- ==============================================================================

-- 1. WATCH HISTORY TABLE (Logs every movie & TV show marked as Watched)
CREATE TABLE IF NOT EXISTS public.watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    title TEXT NOT NULL,
    poster_path TEXT,
    backdrop_path TEXT,
    release_year TEXT,
    vote_average NUMERIC,
    watched_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, media_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_watched ON public.watch_history(user_id, watched_at DESC);

ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own watch history." ON public.watch_history;
CREATE POLICY "Users can view their own watch history."
    ON public.watch_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can log their own watch history." ON public.watch_history;
CREATE POLICY "Users can log their own watch history."
    ON public.watch_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own watch history." ON public.watch_history;
CREATE POLICY "Users can update their own watch history."
    ON public.watch_history FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove from their own watch history." ON public.watch_history;
CREATE POLICY "Users can remove from their own watch history."
    ON public.watch_history FOR DELETE
    USING (auth.uid() = user_id);


-- 2. WATCH LATER TABLE (With priority tags: 'all', 'asap', 'weekend', 'someday')
CREATE TABLE IF NOT EXISTS public.watch_later (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    title TEXT NOT NULL,
    poster_path TEXT,
    backdrop_path TEXT,
    release_date TEXT,
    vote_average NUMERIC,
    tag TEXT DEFAULT 'asap' CHECK (tag IN ('all', 'asap', 'weekend', 'someday')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, media_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_watch_later_user ON public.watch_later(user_id, tag);

ALTER TABLE public.watch_later ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own watch later items." ON public.watch_later;
CREATE POLICY "Users can view their own watch later items."
    ON public.watch_later FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to their watch later list." ON public.watch_later;
CREATE POLICY "Users can add to their watch later list."
    ON public.watch_later FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update watch later priority tags." ON public.watch_later;
CREATE POLICY "Users can update watch later priority tags."
    ON public.watch_later FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove from watch later list." ON public.watch_later;
CREATE POLICY "Users can remove from watch later list."
    ON public.watch_later FOR DELETE
    USING (auth.uid() = user_id);


-- 3. COLLECTIONS TABLE (Personalized & Public Curated Movie Lists)
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
    description TEXT,
    cover_image TEXT,
    is_public BOOLEAN DEFAULT true,
    items_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON public.collections(is_public, created_at DESC);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public collections are viewable by everyone." ON public.collections;
CREATE POLICY "Public collections are viewable by everyone."
    ON public.collections FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own collections." ON public.collections;
CREATE POLICY "Users can create their own collections."
    ON public.collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own collections." ON public.collections;
CREATE POLICY "Users can update their own collections."
    ON public.collections FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own collections." ON public.collections;
CREATE POLICY "Users can delete their own collections."
    ON public.collections FOR DELETE
    USING (auth.uid() = user_id);


-- 4. COLLECTION ITEMS TABLE (Items inside each collection)
CREATE TABLE IF NOT EXISTS public.collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    media_title TEXT NOT NULL,
    media_poster TEXT,
    release_year TEXT,
    vote_average NUMERIC,
    added_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(collection_id, media_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Items viewable if collection is public or owned." ON public.collection_items;
CREATE POLICY "Items viewable if collection is public or owned."
    ON public.collection_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND (c.is_public = true OR c.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can add items to own collections." ON public.collection_items;
CREATE POLICY "Users can add items to own collections."
    ON public.collection_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can remove items from own collections." ON public.collection_items;
CREATE POLICY "Users can remove items from own collections."
    ON public.collection_items FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update items in own collections." ON public.collection_items;
CREATE POLICY "Users can update items in own collections."
    ON public.collection_items FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));


-- 5. SAVED / LIKED COLLECTIONS (User saves other users' public collections)
CREATE TABLE IF NOT EXISTS public.collection_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, collection_id)
);

ALTER TABLE public.collection_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view collection likes." ON public.collection_likes;
CREATE POLICY "Users can view collection likes."
    ON public.collection_likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can save/like collections." ON public.collection_likes;
CREATE POLICY "Users can save/like collections."
    ON public.collection_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave/unlike collections." ON public.collection_likes;
CREATE POLICY "Users can unsave/unlike collections."
    ON public.collection_likes FOR DELETE
    USING (auth.uid() = user_id);


-- 6. TRIGGER FUNCTIONS (Keep items_count and likes_count in sync)
CREATE OR REPLACE FUNCTION public.sync_collection_items_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.collections SET items_count = items_count + 1 WHERE id = NEW.collection_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.collections SET items_count = GREATEST(items_count - 1, 0) WHERE id = OLD.collection_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collection_item_change ON public.collection_items;
CREATE TRIGGER on_collection_item_change
    AFTER INSERT OR DELETE ON public.collection_items
    FOR EACH ROW EXECUTE FUNCTION public.sync_collection_items_count();


CREATE OR REPLACE FUNCTION public.sync_collection_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.collections SET likes_count = likes_count + 1 WHERE id = NEW.collection_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.collections SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.collection_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collection_like_change ON public.collection_likes;
CREATE TRIGGER on_collection_like_change
    AFTER INSERT OR DELETE ON public.collection_likes
    FOR EACH ROW EXECUTE FUNCTION public.sync_collection_likes_count();
