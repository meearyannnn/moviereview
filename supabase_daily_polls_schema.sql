-- ==============================================================================
-- MOVIEGUY DAILY CINEMA POLLS SCHEMA (SUPABASE SQL)
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- Safe & idempotent: can be executed multiple times without conflicts.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.daily_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id TEXT NOT NULL,
    option_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    voted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_poll_poll_id ON public.daily_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_daily_poll_user_id ON public.daily_poll_votes(user_id);

ALTER TABLE public.daily_poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view daily poll vote counts." ON public.daily_poll_votes;
CREATE POLICY "Anyone can view daily poll vote counts."
    ON public.daily_poll_votes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert or update their own daily poll votes." ON public.daily_poll_votes;
CREATE POLICY "Users can insert or update their own daily poll votes."
    ON public.daily_poll_votes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
