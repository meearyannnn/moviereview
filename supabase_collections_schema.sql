-- ── Add to supabase_community_schema.sql or run separately ──────────────────

-- COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  items_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON public.collections(is_public, created_at DESC);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public collections are viewable by everyone." ON public.collections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create their own collections." ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own collections." ON public.collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own collections." ON public.collections FOR DELETE USING (auth.uid() = user_id);


-- COLLECTION ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  media_title TEXT NOT NULL,
  media_poster TEXT,
  added_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (collection_id, media_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items viewable if collection is public or owned." ON public.collection_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND (c.is_public = true OR c.user_id = auth.uid())));
CREATE POLICY "Users can add items to own collections." ON public.collection_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can remove items from own collections." ON public.collection_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));


-- Function: maintain items_count on collections
CREATE OR REPLACE FUNCTION public.handle_collection_item()
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

DROP TRIGGER IF EXISTS on_collection_item ON public.collection_items;
CREATE TRIGGER on_collection_item AFTER INSERT OR DELETE ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_collection_item();
