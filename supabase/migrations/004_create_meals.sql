-- Migration: 004_create_meals.sql
-- Description: Creates meals and meal_items tables with immutable nutrition snapshots and strict RLS policies.

CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_date_meal UNIQUE (user_id, date, meal_type)
);

CREATE TABLE IF NOT EXISTS public.meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_id TEXT NOT NULL,
  name TEXT NOT NULL,
  portion_label TEXT NOT NULL,
  grams NUMERIC(10, 2) NOT NULL CHECK (grams > 0),
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  nutrition_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning fast queries by user and date
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals (user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON public.meal_items (meal_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

-- Meals RLS Policies: Users can only see and manage their own meals
DROP POLICY IF EXISTS "Users can read own meals" ON public.meals;
CREATE POLICY "Users can read own meals"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meals" ON public.meals;
CREATE POLICY "Users can insert own meals"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meals" ON public.meals;
CREATE POLICY "Users can update own meals"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meals" ON public.meals;
CREATE POLICY "Users can delete own meals"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);

-- Meal Items RLS Policies: Users can only see and manage items belonging to their meals
DROP POLICY IF EXISTS "Users can read own meal items" ON public.meal_items;
CREATE POLICY "Users can read own meal items"
  ON public.meal_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meals
      WHERE public.meals.id = public.meal_items.meal_id
      AND public.meals.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own meal items" ON public.meal_items;
CREATE POLICY "Users can insert own meal items"
  ON public.meal_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meals
      WHERE public.meals.id = public.meal_items.meal_id
      AND public.meals.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own meal items" ON public.meal_items;
CREATE POLICY "Users can update own meal items"
  ON public.meal_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meals
      WHERE public.meals.id = public.meal_items.meal_id
      AND public.meals.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own meal items" ON public.meal_items;
CREATE POLICY "Users can delete own meal items"
  ON public.meal_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meals
      WHERE public.meals.id = public.meal_items.meal_id
      AND public.meals.user_id = auth.uid()
    )
  );
