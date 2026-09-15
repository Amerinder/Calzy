export interface Serving {
  id: string;
  label: string;
  grams: number;
  unit_type: string;
  quantity: number;
}

export interface FoodNutrition {
  basis_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  micronutrients?: Record<string, number>;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  source: string;
  external_id: string;
  brand: string | null;
  default_unit: string;
  nutrition: FoodNutrition;
  servings: Serving[];
}

export interface FoodSummary {
  id: string;
  name: string;
  category: string;
  source: string;
  brand: string | null;
  default_unit: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  servings_count: number;
}

export interface ScaledNutrition {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
}

/**
 * 21 Authoritative Verified Foods (USDA FoodData Central + ICMR-NIN IFCT 2017)
 * Strictly per 100g normalized. Serves as client-side source of truth and fallback.
 */
export const VERIFIED_FOOD_CATALOG: FoodItem[] = [
  {
    id: "97dd9177-3e91-58bc-a8ca-f94d30e3bb4c",
    name: "Chicken Breast (Boneless, Skinless, Raw)",
    category: "Poultry & Meat",
    source: "USDA FoodData Central",
    external_id: "FDC:171077",
    brand: null,
    default_unit: "piece",
    nutrition: {
      basis_grams: 100,
      calories: 120,
      protein_g: 22.5,
      carbs_g: 0,
      fat_g: 2.6,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 65,
      micronutrients: { iron_mg: 0.37, potassium_mg: 334, calcium_mg: 11 },
    },
    servings: [
      { id: "s-cb-1", label: "1 standard breast fillet (174g)", grams: 174, unit_type: "piece", quantity: 1 },
      { id: "s-cb-2", label: "1 palm portion (100g)", grams: 100, unit_type: "portion", quantity: 1 },
      { id: "s-cb-3", label: "1 oz raw (28.35g)", grams: 28.35, unit_type: "weight_g", quantity: 1 },
    ],
  },
  {
    id: "6f52e391-766b-586b-8fa4-5264b971a810",
    name: "Whole Egg (Raw, Fresh)",
    category: "Dairy & Eggs",
    source: "USDA FoodData Central",
    external_id: "FDC:171287",
    brand: null,
    default_unit: "egg",
    nutrition: {
      basis_grams: 100,
      calories: 143,
      protein_g: 12.6,
      carbs_g: 0.7,
      fat_g: 9.5,
      fiber_g: 0,
      sugar_g: 0.4,
      sodium_mg: 142,
      micronutrients: { iron_mg: 1.75, potassium_mg: 138, calcium_mg: 56 },
    },
    servings: [
      { id: "s-egg-1", label: "1 large egg (50g)", grams: 50, unit_type: "piece", quantity: 1 },
      { id: "s-egg-2", label: "1 medium egg (44g)", grams: 44, unit_type: "piece", quantity: 1 },
      { id: "s-egg-3", label: "2 large eggs (100g)", grams: 100, unit_type: "portion", quantity: 2 },
    ],
  },
  {
    id: "adc43c67-425f-53cf-9456-f4a9ef1af98a",
    name: "Roti / Whole Wheat Chapati (Cooked without Oil)",
    category: "Indian Breads",
    source: "ICMR-NIN IFCT 2017",
    external_id: "IFCT:B005",
    brand: null,
    default_unit: "roti",
    nutrition: {
      basis_grams: 100,
      calories: 297,
      protein_g: 9.4,
      carbs_g: 61.2,
      fat_g: 1.7,
      fiber_g: 11.2,
      sugar_g: 1.5,
      sodium_mg: 8,
      micronutrients: { iron_mg: 3.97, calcium_mg: 30, phosphorus_mg: 280 },
    },
    servings: [
      { id: "s-roti-1", label: "1 medium roti (35g)", grams: 35, unit_type: "piece", quantity: 1 },
      { id: "s-roti-2", label: "1 small thin roti (25g)", grams: 25, unit_type: "piece", quantity: 1 },
      { id: "s-roti-3", label: "1 large thick roti (50g)", grams: 50, unit_type: "piece", quantity: 1 },
      { id: "s-roti-4", label: "2 medium rotis (70g)", grams: 70, unit_type: "portion", quantity: 2 },
    ],
  },
  {
    id: "78ce7cf7-6bc8-5d27-8025-a131ae96a32d",
    name: "Paneer (Fresh Indian Cottage Cheese)",
    category: "Dairy & Eggs",
    source: "ICMR-NIN IFCT 2017",
    external_id: "IFCT:F008",
    brand: null,
    default_unit: "slice",
    nutrition: {
      basis_grams: 100,
      calories: 265,
      protein_g: 18.3,
      carbs_g: 3.2,
      fat_g: 20.8,
      fiber_g: 0,
      sugar_g: 2.8,
      sodium_mg: 18,
      micronutrients: { calcium_mg: 480, phosphorus_mg: 310 },
    },
    servings: [
      { id: "s-pan-1", label: "1 cube / slice (25g)", grams: 25, unit_type: "piece", quantity: 1 },
      { id: "s-pan-2", label: "1 standard portion (100g)", grams: 100, unit_type: "portion", quantity: 1 },
      { id: "s-pan-3", label: "1/2 block (50g)", grams: 50, unit_type: "portion", quantity: 0.5 },
    ],
  },
  {
    id: "cfd515a8-ceb4-5ceb-bce9-bf65a19ceccb",
    name: "Yellow Moong Dal (Cooked)",
    category: "Lentils & Legumes",
    source: "ICMR-NIN IFCT 2017",
    external_id: "IFCT:B033",
    brand: null,
    default_unit: "katori",
    nutrition: {
      basis_grams: 100,
      calories: 105,
      protein_g: 7.1,
      carbs_g: 18.2,
      fat_g: 0.5,
      fiber_g: 4.8,
      sugar_g: 0.8,
      sodium_mg: 140,
      micronutrients: { iron_mg: 1.4, potassium_mg: 240, calcium_mg: 22 },
    },
    servings: [
      { id: "s-dal-1", label: "1 standard katori (150g)", grams: 150, unit_type: "katori", quantity: 1 },
      { id: "s-dal-2", label: "1 cup cooked (200g)", grams: 200, unit_type: "cup", quantity: 1 },
      { id: "s-dal-3", label: "1 serving ladle (60g)", grams: 60, unit_type: "portion", quantity: 1 },
    ],
  },
  {
    id: "1678120c-c697-5dbf-9b09-fa936a7ea5ee",
    name: "Basmati White Rice (Cooked)",
    category: "Grains & Cereals",
    source: "ICMR-NIN IFCT 2017",
    external_id: "IFCT:A009",
    brand: null,
    default_unit: "katori",
    nutrition: {
      basis_grams: 100,
      calories: 130,
      protein_g: 2.7,
      carbs_g: 28.2,
      fat_g: 0.3,
      fiber_g: 0.4,
      sugar_g: 0.1,
      sodium_mg: 1,
      micronutrients: { iron_mg: 0.2, potassium_mg: 35, calcium_mg: 10 },
    },
    servings: [
      { id: "s-rice-1", label: "1 standard katori (150g)", grams: 150, unit_type: "katori", quantity: 1 },
      { id: "s-rice-2", label: "1 cup cooked (180g)", grams: 180, unit_type: "cup", quantity: 1 },
      { id: "s-rice-3", label: "1 scoop / 100g", grams: 100, unit_type: "portion", quantity: 1 },
    ],
  },
  {
    id: "0d3a778c-0f97-578d-937b-9ad29045b4c4",
    name: "Brown Rice (Medium Grain, Cooked)",
    category: "Grains & Cereals",
    source: "USDA FoodData Central",
    external_id: "FDC:169704",
    brand: null,
    default_unit: "cup",
    nutrition: {
      basis_grams: 100,
      calories: 112,
      protein_g: 2.3,
      carbs_g: 23.5,
      fat_g: 0.8,
      fiber_g: 1.8,
      sugar_g: 0.2,
      sodium_mg: 1,
      micronutrients: { magnesium_mg: 43, phosphorus_mg: 83, potassium_mg: 79 },
    },
    servings: [
      { id: "s-brice-1", label: "1 cup cooked (195g)", grams: 195, unit_type: "cup", quantity: 1 },
      { id: "s-brice-2", label: "1/2 cup cooked (98g)", grams: 98, unit_type: "cup", quantity: 0.5 },
      { id: "s-brice-3", label: "1 standard bowl (150g)", grams: 150, unit_type: "portion", quantity: 1 },
    ],
  },
  {
    id: "721f4df4-a4f6-5dd9-9f7a-2422a9eb7d16",
    name: "Dahi / Plain Indian Curd (Whole Milk)",
    category: "Dairy & Eggs",
    source: "ICMR-NIN IFCT 2017",
    external_id: "IFCT:F004",
    brand: null,
    default_unit: "katori",
    nutrition: {
      basis_grams: 100,
      calories: 61,
      protein_g: 3.1,
      carbs_g: 4.4,
      fat_g: 3.4,
      fiber_g: 0,
      sugar_g: 4.4,
      sodium_mg: 39,
      micronutrients: { calcium_mg: 149, phosphorus_mg: 120 },
    },
    servings: [
      { id: "s-curd-1", label: "1 standard katori (150g)", grams: 150, unit_type: "katori", quantity: 1 },
      { id: "s-curd-2", label: "1 cup (200g)", grams: 200, unit_type: "cup", quantity: 1 },
      { id: "s-curd-3", label: "1 tbsp (20g)", grams: 20, unit_type: "tbsp", quantity: 1 },
    ],
  },
  {
    id: "8c7755b3-363c-5cb6-a67b-1cbbfbdf7148",
    name: "Greek Yogurt (Plain, Nonfat)",
    category: "Dairy & Eggs",
    source: "USDA FoodData Central",
    external_id: "FDC:170903",
    brand: null,
    default_unit: "cup",
    nutrition: {
      basis_grams: 100,
      calories: 59,
      protein_g: 10.2,
      carbs_g: 3.6,
      fat_g: 0.4,
      fiber_g: 0,
      sugar_g: 3.2,
      sodium_mg: 36,
      micronutrients: { calcium_mg: 110, potassium_mg: 141 },
    },
    servings: [
      { id: "s-gy-1", label: "1 cup (200g)", grams: 200, unit_type: "cup", quantity: 1 },
      { id: "s-gy-2", label: "1 single-serve tub (150g)", grams: 150, unit_type: "portion", quantity: 1 },
      { id: "s-gy-3", label: "100g portion", grams: 100, unit_type: "portion", quantity: 1 },
    ],
  },
  {
    id: "71bb84df-f2d1-5544-a035-7eb2cb2ba45e",
    name: "Chickpeas / Kabuli Chana (Cooked / Boiled)",
    category: "Lentils & Legumes",
    source: "ICMR-NIN IFCT 2017",
    external_id: "IFCT:B008",
    brand: null,
    default_unit: "katori",
    nutrition: {
      basis_grams: 100,
      calories: 164,
      protein_g: 8.9,
      carbs_g: 27.4,
      fat_g: 2.6,
      fiber_g: 7.6,
      sugar_g: 4.8,
      sodium_mg: 7,
      micronutrients: { iron_mg: 2.89, folate_mcg: 172, magnesium_mg: 48 },
    },
    servings: [
      { id: "s-chana-1", label: "1 standard katori (150g)", grams: 150, unit_type: "katori", quantity: 1 },
      { id: "s-chana-2", label: "1 cup cooked (164g)", grams: 164, unit_type: "cup", quantity: 1 },
      { id: "s-chana-3", label: "100g portion", grams: 100, unit_type: "portion", quantity: 1 },
    ],
  },
  {
    id: "4376c8c4-118a-5e36-af7f-94ad8259b6ad",
    name: "Masoor Dal / Red Lentils (Cooked)",
    category: "Lentils & Legumes",
    source: "ICMR-NIN IFCT 2017",
    external_id: "IFCT:B032",
    brand: null,
    default_unit: "katori",
    nutrition: {
      basis_grams: 100,
      calories: 116,
      protein_g: 9,
      carbs_g: 20.1,
      fat_g: 0.4,
      fiber_g: 3.9,
      sugar_g: 1.8,
      sodium_mg: 135,
      micronutrients: { iron_mg: 1.9, potassium_mg: 210 },
    },
    servings: [
      { id: "s-masoor-1", label: "1 standard katori (150g)", grams: 150, unit_type: "katori", quantity: 1 },
      { id: "s-masoor-2", label: "1 cup cooked (200g)", grams: 200, unit_type: "cup", quantity: 1 },
      { id: "s-masoor-3", label: "1 ladle (60g)", grams: 60, unit_type: "portion", quantity: 1 },
    ],
  },
  {
    id: "4aa51e6d-e9c4-54c3-b4a0-e8ea3c6cba93",
    name: "Rolled Oats (Dry)",
    category: "Grains & Cereals",
    source: "USDA FoodData Central",
    external_id: "FDC:173904",
    brand: null,
    default_unit: "cup",
    nutrition: {
      basis_grams: 100,
      calories: 379,
      protein_g: 13.2,
      carbs_g: 67.7,
      fat_g: 6.5,
      fiber_g: 10.1,
      sugar_g: 1,
      sodium_mg: 6,
      micronutrients: { iron_mg: 4.25, magnesium_mg: 138, phosphorus_mg: 410 },
    },
    servings: [
      { id: "s-oats-1", label: "1/2 cup dry (40g)", grams: 40, unit_type: "cup", quantity: 0.5 },
      { id: "s-oats-2", label: "1 cup dry (80g)", grams: 80, unit_type: "cup", quantity: 1 },
      { id: "s-oats-3", label: "1 standard bowl (50g)", grams: 50, unit_type: "portion", quantity: 1 },
    ],
  },
  {
    id: "b45a4980-ffca-52c6-95ff-35b8602b9ee2",
    name: "Apple (Raw, with Skin)",
    category: "Fruits",
    source: "USDA FoodData Central",
    external_id: "FDC:171688",
    brand: null,
    default_unit: "piece",
    nutrition: {
      basis_grams: 100,
      calories: 52,
      protein_g: 0.3,
      carbs_g: 13.8,
      fat_g: 0.2,
      fiber_g: 2.4,
      sugar_g: 10.4,
      sodium_mg: 1,
      micronutrients: { vitamin_c_mg: 4.6, potassium_mg: 107 },
    },
    servings: [
      { id: "s-apple-1", label: "1 medium apple (182g)", grams: 182, unit_type: "piece", quantity: 1 },
      { id: "s-apple-2", label: "1 small apple (149g)", grams: 149, unit_type: "piece", quantity: 1 },
      { id: "s-apple-3", label: "1 large apple (223g)", grams: 223, unit_type: "piece", quantity: 1 },
    ],
  },
  {
    id: "277e3ffb-b5d1-55fa-b649-7411da3ea5d8",
    name: "Banana (Raw, Fresh)",
    category: "Fruits",
    source: "USDA FoodData Central",
    external_id: "FDC:173944",
    brand: null,
    default_unit: "piece",
    nutrition: {
      basis_grams: 100,
      calories: 89,
      protein_g: 1.1,
      carbs_g: 22.8,
      fat_g: 0.3,
      fiber_g: 2.6,
      sugar_g: 12.2,
      sodium_mg: 1,
      micronutrients: { potassium_mg: 358, vitamin_b6_mg: 0.37, vitamin_c_mg: 8.7 },
    },
    servings: [
      { id: "s-ban-1", label: "1 medium banana (118g)", grams: 118, unit_type: "piece", quantity: 1 },
      { id: "s-ban-2", label: "1 small banana (101g)", grams: 101, unit_type: "piece", quantity: 1 },
      { id: "s-ban-3", label: "1 large banana (136g)", grams: 136, unit_type: "piece", quantity: 1 },
    ],
  },
  {
    id: "bb3ef8ee-dd03-51eb-9481-c75c8cbcae9e",
    name: "Almonds (Raw, Whole)",
    category: "Nuts & Seeds",
    source: "USDA FoodData Central",
    external_id: "FDC:170567",
    brand: null,
    default_unit: "handful",
    nutrition: {
      basis_grams: 100,
      calories: 579,
      protein_g: 21.2,
      carbs_g: 21.6,
      fat_g: 49.9,
      fiber_g: 12.5,
      sugar_g: 4.4,
      sodium_mg: 1,
      micronutrients: { calcium_mg: 269, magnesium_mg: 270, vitamin_e_mg: 25.6 },
    },
    servings: [
      { id: "s-alm-1", label: "1 handful / 23 almonds (28g)", grams: 28, unit_type: "portion", quantity: 1 },
      { id: "s-alm-2", label: "10 almonds (12g)", grams: 12, unit_type: "piece", quantity: 10 },
      { id: "s-alm-3", label: "1 tbsp chopped (10g)", grams: 10, unit_type: "tbsp", quantity: 1 },
    ],
  },
  {
    id: "d4ca9ec7-c0f5-5645-8bc6-946ef6705d1a",
    name: "Broccoli (Raw, Florets)",
    category: "Vegetables",
    source: "USDA FoodData Central",
    external_id: "FDC:170379",
    brand: null,
    default_unit: "cup",
    nutrition: {
      basis_grams: 100,
      calories: 34,
      protein_g: 2.8,
      carbs_g: 6.6,
      fat_g: 0.4,
      fiber_g: 2.6,
      sugar_g: 1.7,
      sodium_mg: 33,
      micronutrients: { vitamin_c_mg: 89.2, vitamin_k_mcg: 101.6, calcium_mg: 47 },
    },
    servings: [
      { id: "s-broc-1", label: "1 cup chopped florets (91g)", grams: 91, unit_type: "cup", quantity: 1 },
      { id: "s-broc-2", label: "1 medium stalk (150g)", grams: 150, unit_type: "piece", quantity: 1 },
      { id: "s-broc-3", label: "100g portion", grams: 100, unit_type: "portion", quantity: 1 },
    ],
  },
  {
    id: "0d075249-14a0-53bc-b1ee-05187eec8219",
    name: "Spinach (Raw, Leaves)",
    category: "Vegetables",
    source: "USDA FoodData Central",
    external_id: "FDC:168462",
    brand: null,
    default_unit: "cup",
    nutrition: {
      basis_grams: 100,
      calories: 23,
      protein_g: 2.9,
      carbs_g: 3.6,
      fat_g: 0.4,
      fiber_g: 2.2,
      sugar_g: 0.4,
      sodium_mg: 79,
      micronutrients: { iron_mg: 2.71, vitamin_a_mcg: 469, vitamin_c_mg: 28.1 },
    },
    servings: [
      { id: "s-spin-1", label: "1 cup raw packed (30g)", grams: 30, unit_type: "cup", quantity: 1 },
      { id: "s-spin-2", label: "1 cup cooked, drained (180g)", grams: 180, unit_type: "cup", quantity: 1 },
      { id: "s-spin-3", label: "100g portion", grams: 100, unit_type: "portion", quantity: 1 },
    ],
  },
  {
    id: "3e5ee0d9-5e73-500b-9ef1-4b1bb3cbdae2",
    name: "Pure Desi Cow Ghee (Clarified Butter)",
    category: "Fats & Oils",
    source: "ICMR-NIN IFCT 2017",
    external_id: "IFCT:F011",
    brand: null,
    default_unit: "tsp",
    nutrition: {
      basis_grams: 100,
      calories: 900,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 100,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
      micronutrients: { vitamin_a_mcg: 850 },
    },
    servings: [
      { id: "s-ghee-1", label: "1 tsp (5g)", grams: 5, unit_type: "tsp", quantity: 1 },
      { id: "s-ghee-2", label: "1 tbsp (15g)", grams: 15, unit_type: "tbsp", quantity: 1 },
      { id: "s-ghee-3", label: "1/2 tsp (2.5g)", grams: 2.5, unit_type: "tsp", quantity: 0.5 },
    ],
  },
  {
    id: "277e9eb7-da56-5593-9cfa-13f57279cb65",
    name: "Peanut Butter (Smooth, Unsalted)",
    category: "Nuts & Seeds",
    source: "USDA FoodData Central",
    external_id: "FDC:172470",
    brand: null,
    default_unit: "tbsp",
    nutrition: {
      basis_grams: 100,
      calories: 588,
      protein_g: 25.1,
      carbs_g: 20,
      fat_g: 50.4,
      fiber_g: 6,
      sugar_g: 9.2,
      sodium_mg: 17,
      micronutrients: { magnesium_mg: 154, potassium_mg: 649 },
    },
    servings: [
      { id: "s-pb-1", label: "1 tbsp (16g)", grams: 16, unit_type: "tbsp", quantity: 1 },
      { id: "s-pb-2", label: "2 tbsp standard serving (32g)", grams: 32, unit_type: "tbsp", quantity: 2 },
      { id: "s-pb-3", label: "1 tsp (5g)", grams: 5, unit_type: "tsp", quantity: 1 },
    ],
  },
  {
    id: "b59a6da8-c92a-5c20-a616-56be30b06b29",
    name: "Wild Atlantic Salmon (Raw)",
    category: "Poultry & Meat",
    source: "USDA FoodData Central",
    external_id: "FDC:173686",
    brand: null,
    default_unit: "fillet",
    nutrition: {
      basis_grams: 100,
      calories: 142,
      protein_g: 19.8,
      carbs_g: 0,
      fat_g: 6.3,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 44,
      micronutrients: { potassium_mg: 490, selenium_mcg: 36.5 },
    },
    servings: [
      { id: "s-sal-1", label: "1 half fillet (154g)", grams: 154, unit_type: "piece", quantity: 1 },
      { id: "s-sal-2", label: "1 palm portion (100g)", grams: 100, unit_type: "portion", quantity: 1 },
      { id: "s-sal-3", label: "1 oz raw (28.35g)", grams: 28.35, unit_type: "weight_g", quantity: 1 },
    ],
  },
  {
    id: "10166418-5a41-5dfa-b731-318e8ce1b2bb",
    name: "Cow Milk (Whole, 3.25% Fat)",
    category: "Dairy & Eggs",
    source: "USDA FoodData Central",
    external_id: "FDC:171265",
    brand: null,
    default_unit: "cup",
    nutrition: {
      basis_grams: 100,
      calories: 61,
      protein_g: 3.2,
      carbs_g: 4.8,
      fat_g: 3.3,
      fiber_g: 0,
      sugar_g: 5.1,
      sodium_mg: 43,
      micronutrients: { calcium_mg: 113, potassium_mg: 132 },
    },
    servings: [
      { id: "s-milk-1", label: "1 cup (244g)", grams: 244, unit_type: "cup", quantity: 1 },
      { id: "s-milk-2", label: "1 standard glass (200g)", grams: 200, unit_type: "portion", quantity: 1 },
      { id: "s-milk-3", label: "1 splash / tbsp (15g)", grams: 15, unit_type: "tbsp", quantity: 1 },
    ],
  },
];

/**
 * Calculates scaled nutrition based on 100g database values.
 * formula: scaled = (val_100g * grams) / 100.0
 */
export function scaleNutrition(food: FoodItem, grams: number): ScaledNutrition {
  const nut = food.nutrition;
  const ratio = Math.max(0, grams) / 100.0;

  return {
    calories: Math.round(nut.calories * ratio),
    protein_g: Math.round(nut.protein_g * ratio * 10) / 10,
    carbs_g: Math.round(nut.carbs_g * ratio * 10) / 10,
    fat_g: Math.round(nut.fat_g * ratio * 10) / 10,
    fiber_g: Math.round(nut.fiber_g * ratio * 10) / 10,
    sugar_g: Math.round(nut.sugar_g * ratio * 10) / 10,
    sodium_mg: Math.round(nut.sodium_mg * ratio * 10) / 10,
  };
}

/**
 * Fetches real-time suggestions while user is typing.
 * Tries FastAPI backend (/api/v1/foods/suggestions), with local fallback.
 */
export async function fetchFoodSuggestions(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiUrl}/api/v1/foods/suggestions?q=${encodeURIComponent(q)}&limit=7`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Backend offline: fallback to local matches
  }

  // Local fallback suggestions
  const qLower = q.toLowerCase();
  const matched = VERIFIED_FOOD_CATALOG
    .filter((f) => f.name.toLowerCase().includes(qLower))
    .map((f) => f.name.split("(")[0].trim());

  return Array.from(new Set(matched)).slice(0, 7);
}

/**
 * Searches foods via backend (FatSecret -> USDA -> Local), falling back to local catalog.
 */
export async function searchFoodsApi(query?: string, category?: string): Promise<FoodSummary[]> {
  const q = query ? query.trim() : "";
  const cat = category && category !== "All" ? category.trim() : "";

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat) params.set("category", cat);
    params.set("limit", "25");

    const res = await fetch(`${apiUrl}/api/v1/foods/search?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        return data.items;
      }
    }
  } catch {
    // Fallback below
  }

  // Local catalog search fallback
  return VERIFIED_FOOD_CATALOG.filter((f) => {
    if (cat && f.category !== cat) return false;
    if (q) {
      const qLower = q.toLowerCase();
      return (
        f.name.toLowerCase().includes(qLower) ||
        f.category.toLowerCase().includes(qLower)
      );
    }
    return true;
  }).map((f) => ({
    id: f.id,
    name: f.name,
    category: f.category,
    source: f.source,
    brand: f.brand,
    default_unit: f.default_unit,
    calories_per_100g: f.nutrition.calories,
    protein_per_100g: f.nutrition.protein_g,
    carbs_per_100g: f.nutrition.carbs_g,
    fat_per_100g: f.nutrition.fat_g,
    fiber_per_100g: f.nutrition.fiber_g,
    servings_count: f.servings.length,
  }));
}

/**
 * Fetches complete food details with servings from backend or local catalog.
 */
export async function fetchFoodDetailApi(foodId: string): Promise<FoodItem | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiUrl}/api/v1/foods/${encodeURIComponent(foodId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to local catalog below
  }

  const localMatch = VERIFIED_FOOD_CATALOG.find((f) => f.id === foodId);
  return localMatch || null;
}

