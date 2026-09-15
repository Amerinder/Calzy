-- ==============================================================================
-- CALZY DATABASE MIGRATION: Phase 3 - Daily Target Snapshots & Goal History
-- ==============================================================================
-- Execute this script in your Supabase Project SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Create daily_targets table
CREATE TABLE IF NOT EXISTS public.daily_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bmr INT NOT NULL,
    tdee INT NOT NULL,
    calorie_target INT NOT NULL,
    protein_g NUMERIC NOT NULL,
    carbs_g NUMERIC NOT NULL,
    fat_g NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, effective_date)
);

-- 2. Enable Row-Level Security
ALTER TABLE public.daily_targets ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Ensure users can ONLY access and modify their OWN daily targets
DROP POLICY IF EXISTS "Users can view own daily targets" ON public.daily_targets;
CREATE POLICY "Users can view own daily targets"
    ON public.daily_targets FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily targets" ON public.daily_targets;
CREATE POLICY "Users can insert own daily targets"
    ON public.daily_targets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily targets" ON public.daily_targets;
CREATE POLICY "Users can update own daily targets"
    ON public.daily_targets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
