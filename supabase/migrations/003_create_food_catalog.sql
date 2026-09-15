-- ===========================================================================
-- Calzy Migration 003: Create Food Catalog, Nutrition & Servings Schema
-- Authoritative data sources: USDA FoodData Central & ICMR-NIN IFCT 2017
-- ===========================================================================

-- 1. Create foods table
CREATE TABLE IF NOT EXISTS public.foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT NOT NULL,
    external_id TEXT UNIQUE NOT NULL,
    brand TEXT DEFAULT NULL,
    default_unit TEXT NOT NULL DEFAULT 'portion',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create food_nutrition table (Strict 100g basis)
CREATE TABLE IF NOT EXISTS public.food_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    basis_grams NUMERIC NOT NULL DEFAULT 100.0,
    calories NUMERIC NOT NULL,
    protein_g NUMERIC NOT NULL,
    carbs_g NUMERIC NOT NULL,
    fat_g NUMERIC NOT NULL,
    fiber_g NUMERIC NOT NULL DEFAULT 0.0,
    sugar_g NUMERIC NOT NULL DEFAULT 0.0,
    sodium_mg NUMERIC NOT NULL DEFAULT 0.0,
    micronutrients JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_food_nutrition_food_id UNIQUE (food_id)
);

-- 3. Create servings table
CREATE TABLE IF NOT EXISTS public.servings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    grams NUMERIC NOT NULL,
    unit_type TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_servings_food_label UNIQUE (food_id, label)
);

-- 4. Indexes for fast search and relations
CREATE INDEX IF NOT EXISTS idx_foods_name ON public.foods (name);
CREATE INDEX IF NOT EXISTS idx_foods_category ON public.foods (category);
CREATE INDEX IF NOT EXISTS idx_foods_external_id ON public.foods (external_id);
CREATE INDEX IF NOT EXISTS idx_food_nutrition_food_id ON public.food_nutrition (food_id);
CREATE INDEX IF NOT EXISTS idx_servings_food_id ON public.servings (food_id);

-- 5. Enable Row-Level Security (Public read access for catalog)
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Foods are viewable by everyone" ON public.foods;
CREATE POLICY "Foods are viewable by everyone" ON public.foods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Food nutrition is viewable by everyone" ON public.food_nutrition;
CREATE POLICY "Food nutrition is viewable by everyone" ON public.food_nutrition FOR SELECT USING (true);

DROP POLICY IF EXISTS "Servings are viewable by everyone" ON public.servings;
CREATE POLICY "Servings are viewable by everyone" ON public.servings FOR SELECT USING (true);

-- 6. Authoritative Seed Data (USDA FoodData Central + ICMR-NIN IFCT 2017)
DO $$
DECLARE
    fid UUID;
BEGIN
    -- Item: Chicken Breast (Boneless, Skinless, Raw) (FDC:171077)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('fd119b18-0673-56b4-a870-df7f1b9ccb03', 'Chicken Breast (Boneless, Skinless, Raw)', 'Poultry & Meat', 'USDA FoodData Central', 'FDC:171077', NULL, 'piece')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 120.0, 22.5, 0.0, 2.6, 0.0, 0.0, 65.0, '{"iron_mg": 0.37, "potassium_mg": 334.0, "calcium_mg": 11.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('d17f67f3-17bc-5bbf-b6b5-a03df99d4cfb', fid, '1 standard breast fillet (174g)', 174.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('350725b8-bc7a-56e6-82ab-a4d50b1db57d', fid, '1 palm portion (100g)', 100.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('6134d1ec-8663-5c12-af1d-e0cddcf6152c', fid, '1 oz raw (28.35g)', 28.35, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Whole Egg (Raw, Fresh) (FDC:171287)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('ac71db80-b03f-5f7a-9aa8-50451904533e', 'Whole Egg (Raw, Fresh)', 'Dairy & Eggs', 'USDA FoodData Central', 'FDC:171287', NULL, 'egg')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 143.0, 12.6, 0.7, 9.5, 0.0, 0.4, 142.0, '{"iron_mg": 1.75, "potassium_mg": 138.0, "calcium_mg": 56.0, "cholesterol_mg": 372.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('752918a6-a2f0-51d1-9dbf-42f17b304bc6', fid, '1 large egg (50g)', 50.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('b08e204d-d81a-5e10-9914-cbc01968d866', fid, '1 medium egg (44g)', 44.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('d2b09125-bcc4-58c3-9206-43b9fd460b7d', fid, '2 large eggs (100g)', 100.0, 'portion', 2.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Roti / Whole Wheat Chapati (Cooked without Oil) (IFCT:B005)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('adc43c67-425f-53cf-9456-f4a9ef1af98a', 'Roti / Whole Wheat Chapati (Cooked without Oil)', 'Indian Breads', 'ICMR-NIN IFCT 2017', 'IFCT:B005', NULL, 'roti')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 297.0, 9.4, 61.2, 1.7, 11.2, 1.5, 8.0, '{"iron_mg": 3.97, "calcium_mg": 30.0, "phosphorus_mg": 280.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('2d80315a-611b-553e-a719-b62231500b11', fid, '1 medium roti (35g)', 35.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('449fd28b-e434-5951-b2e2-1e0aa5f61dc8', fid, '1 small thin roti (25g)', 25.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('3cf485fd-a5e0-569f-b689-8f49225690ac', fid, '1 large thick roti (50g)', 50.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('f7a9b8a6-fa96-55e1-aaec-99766c065c88', fid, '2 medium rotis (70g)', 70.0, 'portion', 2.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('033fa084-a161-506b-80a3-d0f37ff3229e', fid, '100g portion', 100.0, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Paneer (Fresh Indian Cottage Cheese) (IFCT:F008)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('3df63524-023c-5624-8b3b-b1053745c579', 'Paneer (Fresh Indian Cottage Cheese)', 'Dairy & Eggs', 'ICMR-NIN IFCT 2017', 'IFCT:F008', NULL, 'slice')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 265.0, 18.3, 3.2, 20.8, 0.0, 2.8, 18.0, '{"calcium_mg": 480.0, "phosphorus_mg": 310.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('42e49b2d-405c-5c4b-b86b-3968faf92b80', fid, '1 cube / slice (25g)', 25.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('8d12ffa2-f615-595c-8ca3-bbfc1a036f97', fid, '1 standard portion (100g)', 100.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('eb618c1d-830c-5983-9369-1ab36d2075ca', fid, '1/2 block (50g)', 50.0, 'portion', 0.5)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Yellow Moong Dal (Cooked) (IFCT:B033)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('b245bbb8-10ef-58ad-b925-7aacc3eea863', 'Yellow Moong Dal (Cooked)', 'Lentils & Legumes', 'ICMR-NIN IFCT 2017', 'IFCT:B033', NULL, 'katori')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 105.0, 7.1, 18.2, 0.5, 4.8, 0.8, 140.0, '{"iron_mg": 1.4, "potassium_mg": 240.0, "calcium_mg": 22.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('bdb90c09-b7b7-56a5-9c7d-9908023a4236', fid, '1 standard katori (150g)', 150.0, 'katori', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('0ef09b2e-691e-5f1c-92e8-3832944a0720', fid, '1 cup cooked (200g)', 200.0, 'cup', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('13fca506-f911-54aa-b064-a218dc6cc4e9', fid, '1 serving ladle (60g)', 60.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('e2d3e076-ce67-515d-8c6f-bc7aaac71e83', fid, '100g portion', 100.0, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Basmati White Rice (Cooked) (IFCT:A009)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('7f41ce0a-0771-5566-84e6-55ce17c9630e', 'Basmati White Rice (Cooked)', 'Grains & Cereals', 'ICMR-NIN IFCT 2017', 'IFCT:A009', NULL, 'katori')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 130.0, 2.7, 28.2, 0.3, 0.4, 0.1, 1.0, '{"iron_mg": 0.2, "potassium_mg": 35.0, "calcium_mg": 10.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('6c88dfa1-cd58-56dc-8c57-c7c50ee68965', fid, '1 standard katori (150g)', 150.0, 'katori', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('f8a089c4-7d81-553d-afc1-d84f1668b5b5', fid, '1 cup cooked (180g)', 180.0, 'cup', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('236bc264-82f4-5c20-bf84-59a7487a6068', fid, '1 scoop / 100g', 100.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Brown Rice (Medium Grain, Cooked) (FDC:169704)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('881d25c5-0787-5f69-87d4-c4d0b14cd311', 'Brown Rice (Medium Grain, Cooked)', 'Grains & Cereals', 'USDA FoodData Central', 'FDC:169704', NULL, 'cup')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 112.0, 2.3, 23.5, 0.8, 1.8, 0.2, 1.0, '{"magnesium_mg": 43.0, "phosphorus_mg": 83.0, "potassium_mg": 79.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('9d93d594-c62e-5637-9d15-d4a35dcb689b', fid, '1 cup cooked (195g)', 195.0, 'cup', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('0357dbdc-9613-50cb-952b-367e577eec1f', fid, '1/2 cup cooked (98g)', 98.0, 'cup', 0.5)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('3fb837ad-9af5-53b7-b02b-d24c1eb60e87', fid, '1 standard bowl (150g)', 150.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('00feed94-e188-5267-89ab-feb72ef34193', fid, '100g portion', 100.0, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Dahi / Plain Indian Curd (Whole Milk) (IFCT:F004)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('b6c434f1-8942-5455-96a4-1577a64e2d9b', 'Dahi / Plain Indian Curd (Whole Milk)', 'Dairy & Eggs', 'ICMR-NIN IFCT 2017', 'IFCT:F004', NULL, 'katori')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 61.0, 3.1, 4.4, 3.4, 0.0, 4.4, 39.0, '{"calcium_mg": 149.0, "phosphorus_mg": 120.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('79428442-da98-5f61-a111-ffbdcdf4fa41', fid, '1 standard katori (150g)', 150.0, 'katori', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('cd4028a1-83b5-5619-a939-a85e785f4a76', fid, '1 cup (200g)', 200.0, 'cup', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('384f5263-c936-536b-92f3-085d059d9347', fid, '1 tbsp (20g)', 20.0, 'tbsp', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('3f8d160f-6d1c-524e-9de5-854ca65497d2', fid, '100g portion', 100.0, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Greek Yogurt (Plain, Nonfat) (FDC:170903)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('648cc00a-465e-5875-a57f-b5df7d85f1a2', 'Greek Yogurt (Plain, Nonfat)', 'Dairy & Eggs', 'USDA FoodData Central', 'FDC:170903', NULL, 'cup')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 59.0, 10.2, 3.6, 0.4, 0.0, 3.2, 36.0, '{"calcium_mg": 110.0, "potassium_mg": 141.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('5e37e6a3-ff71-5496-9f28-b2a85ea41760', fid, '1 cup (200g)', 200.0, 'cup', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('a6d1be5c-b125-5465-824a-2c6ee24594a6', fid, '1 single-serve tub (150g)', 150.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('02d5569c-5127-5edb-992f-126fa2d2f465', fid, '100g portion', 100.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Chickpeas / Kabuli Chana (Cooked / Boiled) (IFCT:B008)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('88e9ba81-1c07-59a9-914a-0dc690df6633', 'Chickpeas / Kabuli Chana (Cooked / Boiled)', 'Lentils & Legumes', 'ICMR-NIN IFCT 2017', 'IFCT:B008', NULL, 'katori')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 164.0, 8.9, 27.4, 2.6, 7.6, 4.8, 7.0, '{"iron_mg": 2.89, "folate_mcg": 172.0, "magnesium_mg": 48.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('9a4ebf3d-06d4-50ea-9043-ee9f0b79601d', fid, '1 standard katori (150g)', 150.0, 'katori', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('70ff0557-2ec1-5b57-993e-125d8d7ae715', fid, '1 cup cooked (164g)', 164.0, 'cup', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('c1f367e5-18d3-59a3-a9f5-1f03ac1d20a9', fid, '100g portion', 100.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Masoor Dal / Red Lentils (Cooked) (IFCT:B032)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('6132c5fd-be46-5afe-b3fe-a0d87687317b', 'Masoor Dal / Red Lentils (Cooked)', 'Lentils & Legumes', 'ICMR-NIN IFCT 2017', 'IFCT:B032', NULL, 'katori')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 116.0, 9.0, 20.1, 0.4, 3.9, 1.8, 135.0, '{"iron_mg": 1.9, "potassium_mg": 210.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('6c4daab7-accf-5974-8bfe-866dc9781df7', fid, '1 standard katori (150g)', 150.0, 'katori', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('ee995983-944d-5f3b-9c13-9f68b3e51cc0', fid, '1 cup cooked (200g)', 200.0, 'cup', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('14cdc0a3-c0cb-59fb-9e67-3ae6278acbb4', fid, '1 ladle (60g)', 60.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('051dcbf2-9bf0-5315-9a28-9e820bc7a46c', fid, '100g portion', 100.0, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Rolled Oats (Dry) (FDC:173904)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('c0a8b6ad-7d2d-5e16-a627-3520fc2077f8', 'Rolled Oats (Dry)', 'Grains & Cereals', 'USDA FoodData Central', 'FDC:173904', NULL, 'cup')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 379.0, 13.2, 67.7, 6.5, 10.1, 1.0, 6.0, '{"iron_mg": 4.25, "magnesium_mg": 138.0, "phosphorus_mg": 410.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('1501fcf2-e275-5ab6-b89b-8b094eef33cf', fid, '1/2 cup dry (40g)', 40.0, 'cup', 0.5)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('9e5e794f-bd9c-5664-9c00-f47db8afaba6', fid, '1 cup dry (80g)', 80.0, 'cup', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('00b73059-953c-5f75-87aa-24d27f820e00', fid, '1 standard bowl (50g)', 50.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('1dc25b5e-f47d-5921-bb6b-a9e22c6c9da8', fid, '100g portion', 100.0, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Apple (Raw, with Skin) (FDC:171688)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('abed3de7-d615-56d3-9eb5-5ee6db47cf2f', 'Apple (Raw, with Skin)', 'Fruits', 'USDA FoodData Central', 'FDC:171688', NULL, 'piece')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 52.0, 0.3, 13.8, 0.2, 2.4, 10.4, 1.0, '{"vitamin_c_mg": 4.6, "potassium_mg": 107.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('0f1c00fb-c4db-56ec-b39d-b249cea66625', fid, '1 medium apple (182g)', 182.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('20f9c780-710a-5d47-b736-f048117d2089', fid, '1 small apple (149g)', 149.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('d18552e6-ac63-5771-aada-a2d388334dd3', fid, '1 large apple (223g)', 223.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('bc290a48-aba2-5e59-9c82-add655b3c055', fid, '100g portion', 100.0, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Banana (Raw, Fresh) (FDC:173944)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('f2263bee-c318-5daa-9871-b693cffb6809', 'Banana (Raw, Fresh)', 'Fruits', 'USDA FoodData Central', 'FDC:173944', NULL, 'piece')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 89.0, 1.1, 22.8, 0.3, 2.6, 12.2, 1.0, '{"potassium_mg": 358.0, "vitamin_b6_mg": 0.37, "vitamin_c_mg": 8.7}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('b9a17652-9451-5161-8fd2-a1831eb7d82b', fid, '1 medium banana (118g)', 118.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('1b8fd6b3-a64e-5021-a298-fc8e00d29c1d', fid, '1 small banana (101g)', 101.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('b612c2d0-2443-5516-9140-5afa70b7ca67', fid, '1 large banana (136g)', 136.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('ac1490b5-f2c9-57c7-8339-33e4d72de6ac', fid, '100g portion', 100.0, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Almonds (Raw, Whole) (FDC:170567)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('8fa14143-4c51-5376-a0f1-e2f5ec0e75bd', 'Almonds (Raw, Whole)', 'Nuts & Seeds', 'USDA FoodData Central', 'FDC:170567', NULL, 'handful')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 579.0, 21.2, 21.6, 49.9, 12.5, 4.4, 1.0, '{"calcium_mg": 269.0, "magnesium_mg": 270.0, "vitamin_e_mg": 25.6}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('6dc112d2-d106-58a9-8607-564bd2026383', fid, '1 handful / 23 almonds (28g)', 28.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('e67427e3-ffb8-54c7-9d03-80ea9ac5ce74', fid, '10 almonds (12g)', 12.0, 'piece', 10.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('27625dcd-5588-57a2-b40a-b10ee41fc0da', fid, '1 tbsp chopped (10g)', 10.0, 'tbsp', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('39f32ec7-ad6d-59ec-8043-39e6c5bf6664', fid, '100g portion', 100.0, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Broccoli (Raw, Florets) (FDC:170379)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('66d1e370-9bf8-5edb-97d5-2e6ef916cfd8', 'Broccoli (Raw, Florets)', 'Vegetables', 'USDA FoodData Central', 'FDC:170379', NULL, 'cup')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 34.0, 2.8, 6.6, 0.4, 2.6, 1.7, 33.0, '{"vitamin_c_mg": 89.2, "vitamin_k_mcg": 101.6, "calcium_mg": 47.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('9dea57ed-b171-504c-b396-5f9227349bd9', fid, '1 cup chopped florets (91g)', 91.0, 'cup', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('b2a0a016-4821-5b7c-aa0d-c0519db4e35e', fid, '1 medium stalk (150g)', 150.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('a9f9a5eb-ec5c-5c4e-8289-4235f63ec37a', fid, '100g portion', 100.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Spinach (Raw, Leaves) (FDC:168462)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('2dc47c74-fbc1-58a9-adbe-58a19d2f5dfb', 'Spinach (Raw, Leaves)', 'Vegetables', 'USDA FoodData Central', 'FDC:168462', NULL, 'cup')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 23.0, 2.9, 3.6, 0.4, 2.2, 0.4, 79.0, '{"iron_mg": 2.71, "vitamin_a_mcg": 469.0, "vitamin_c_mg": 28.1}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('a5699e30-8638-57cc-93af-60d62b48047b', fid, '1 cup raw packed (30g)', 30.0, 'cup', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('7f87b5d5-c24e-5f07-8574-85dfcf95dada', fid, '1 cup cooked, drained (180g)', 180.0, 'cup', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('d330d3a6-82fc-5f68-a698-6277857f404b', fid, '100g portion', 100.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Pure Desi Cow Ghee (Clarified Butter) (IFCT:F011)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('86dc5273-b9f5-55fe-9cae-edc4b110cbd3', 'Pure Desi Cow Ghee (Clarified Butter)', 'Fats & Oils', 'ICMR-NIN IFCT 2017', 'IFCT:F011', NULL, 'tsp')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 900.0, 0.0, 0.0, 100.0, 0.0, 0.0, 0.0, '{"vitamin_a_mcg": 850.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('ef337c7e-d199-5209-b4b1-0575beed2c71', fid, '1 tsp (5g)', 5.0, 'tsp', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('20684056-486f-5642-8441-5810adb9da40', fid, '1 tbsp (15g)', 15.0, 'tbsp', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('6b3f1aa5-9e59-53f7-8ec8-21449c371ba6', fid, '1/2 tsp (2.5g)', 2.5, 'tsp', 0.5)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('dcc352f0-a603-5ba7-add3-96e51fce98a4', fid, '100g portion', 100.0, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Peanut Butter (Smooth, Unsalted) (FDC:172470)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('7f343417-4ea8-5141-b60c-d8a7cae29c05', 'Peanut Butter (Smooth, Unsalted)', 'Nuts & Seeds', 'USDA FoodData Central', 'FDC:172470', NULL, 'tbsp')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 588.0, 25.1, 20.0, 50.4, 6.0, 9.2, 17.0, '{"magnesium_mg": 154.0, "potassium_mg": 649.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('5fb831cc-58ae-5da1-8b7c-d32b08a47d79', fid, '1 tbsp (16g)', 16.0, 'tbsp', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('319484c5-d5eb-530d-9492-cceb664d101b', fid, '2 tbsp standard serving (32g)', 32.0, 'tbsp', 2.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('2679ea70-f685-5f2f-ad48-b8c967d222c3', fid, '1 tsp (5g)', 5.0, 'tsp', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('d95a66de-de62-5b0d-ad61-7dc8eb61ec1b', fid, '100g portion', 100.0, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Wild Atlantic Salmon (Raw) (FDC:173686)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('5fff3e29-7fd2-5825-a774-58d99f6c7ddc', 'Wild Atlantic Salmon (Raw)', 'Poultry & Meat', 'USDA FoodData Central', 'FDC:173686', NULL, 'fillet')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 142.0, 19.8, 0.0, 6.3, 0.0, 0.0, 44.0, '{"potassium_mg": 490.0, "selenium_mcg": 36.5}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('67643ad1-38d8-59c8-825b-f1590705f7ad', fid, '1 half fillet (154g)', 154.0, 'piece', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('1a8df4ab-d3db-55da-9042-aed436343f50', fid, '1 palm portion (100g)', 100.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('5fabfd50-06c5-5cab-9a19-0b4b47c4300a', fid, '1 oz raw (28.35g)', 28.35, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

    -- Item: Cow Milk (Whole, 3.25% Fat) (FDC:171265)
    INSERT INTO public.foods (id, name, category, source, external_id, brand, default_unit)
    VALUES ('db69359a-8257-5439-8845-0d217dd1a369', 'Cow Milk (Whole, 3.25% Fat)', 'Dairy & Eggs', 'USDA FoodData Central', 'FDC:171265', NULL, 'cup')
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
    RETURNING id INTO fid;

    INSERT INTO public.food_nutrition (food_id, basis_grams, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, micronutrients)
    VALUES (fid, 100.0, 61.0, 3.2, 4.8, 3.3, 0.0, 5.1, 43.0, '{"calcium_mg": 113.0, "potassium_mg": 132.0}'::jsonb)
    ON CONFLICT (food_id) DO UPDATE SET calories = EXCLUDED.calories, protein_g = EXCLUDED.protein_g, carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g;

    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('7b5ce16d-e4ad-5b0b-932b-659cdda6f80f', fid, '1 cup (244g)', 244.0, 'cup', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('9c8b088a-b02f-530e-845e-501983dbe2cc', fid, '1 standard glass (200g)', 200.0, 'portion', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('a8431d91-4d5a-5d6c-83a3-6e5feea80e2c', fid, '1 splash / tbsp (15g)', 15.0, 'tbsp', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;
    INSERT INTO public.servings (id, food_id, label, grams, unit_type, quantity)
    VALUES ('06200f8a-3c1f-552b-ade5-2d1958fb7e33', fid, '100g portion', 100.0, 'weight_g', 1.0)
    ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams, quantity = EXCLUDED.quantity;

END $$;
