/**
 * ==============================================================================
 * CALZY DEMO / FIXTURE DATA (PHASE 1 UI SHELL ONLY)
 * ==============================================================================
 * IMPORTANT: This data is strictly for UI layout demonstration and testing during
 * Phase 1. It is NOT real user data and will be replaced by Supabase & database
 * persistence in Phase 2 and Phase 6.
 * ==============================================================================
 */

export interface DailyCalorieSummary {
  date: string;
  targetKcal: number;
  consumedKcal: number;
  remainingKcal: number;
  isOverTarget: boolean;
}

export interface MacroTarget {
  name: "Protein" | "Carbs" | "Fat";
  consumedGrams: number;
  targetGrams: number;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export interface MealItemFixture {
  id: string;
  name: string;
  servingLabel: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealCategoryFixture {
  type: "breakfast" | "lunch" | "snacks" | "dinner";
  title: string;
  recommendedKcal: number;
  items: MealItemFixture[];
}

export const mockDailySummary: DailyCalorieSummary = {
  date: "Today, 15 Apr 2026",
  targetKcal: 2200,
  consumedKcal: 1460,
  remainingKcal: 740,
  isOverTarget: false,
};

export const mockMacros: MacroTarget[] = [
  {
    name: "Protein",
    consumedGrams: 98,
    targetGrams: 140,
    color: "#3B82F6", // Blue
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
  },
  {
    name: "Carbs",
    consumedGrams: 185,
    targetGrams: 250,
    color: "#F59E0B", // Amber
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
  },
  {
    name: "Fat",
    consumedGrams: 44,
    targetGrams: 65,
    color: "#EC4899", // Rose
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700",
  },
];

export const mockMeals: MealCategoryFixture[] = [
  {
    type: "breakfast",
    title: "Breakfast",
    recommendedKcal: 550,
    items: [
      {
        id: "m-1",
        name: "Rolled Oats with Almond Milk",
        servingLabel: "1 bowl (60g)",
        quantity: 1,
        calories: 320,
        protein: 11,
        carbs: 54,
        fat: 6,
      },
      {
        id: "m-2",
        name: "Boiled Eggs",
        servingLabel: "2 large eggs",
        quantity: 2,
        calories: 140,
        protein: 12,
        carbs: 1,
        fat: 10,
      },
    ],
  },
  {
    type: "lunch",
    title: "Lunch",
    recommendedKcal: 700,
    items: [
      {
        id: "m-3",
        name: "Whole Wheat Roti",
        servingLabel: "2 pieces",
        quantity: 2,
        calories: 180,
        protein: 6,
        carbs: 36,
        fat: 1,
      },
      {
        id: "m-4",
        name: "Paneer & Mixed Vegetable Curry",
        servingLabel: "1 cup (200g)",
        quantity: 1,
        calories: 310,
        protein: 16,
        carbs: 14,
        fat: 22,
      },
      {
        id: "m-5",
        name: "Moong Dal Tadka",
        servingLabel: "1 small bowl (150g)",
        quantity: 1,
        calories: 160,
        protein: 10,
        carbs: 24,
        fat: 3,
      },
    ],
  },
  {
    type: "snacks",
    title: "Snacks",
    recommendedKcal: 300,
    items: [
      {
        id: "m-6",
        name: "Greek Yogurt with Honey",
        servingLabel: "1 cup (170g)",
        quantity: 1,
        calories: 180,
        protein: 17,
        carbs: 16,
        fat: 4,
      },
      {
        id: "m-7",
        name: "Roasted Almonds",
        servingLabel: "15 pieces (18g)",
        quantity: 1,
        calories: 110,
        protein: 4,
        carbs: 4,
        fat: 9,
      },
    ],
  },
  {
    type: "dinner",
    title: "Dinner",
    recommendedKcal: 650,
    items: [
      {
        id: "m-8",
        name: "Grilled Herb Chicken Breast",
        servingLabel: "150g fillet",
        quantity: 1,
        calories: 240,
        protein: 42,
        carbs: 0,
        fat: 6,
      },
      {
        id: "m-9",
        name: "Quinoa & Steamed Broccoli",
        servingLabel: "1 cup (180g)",
        quantity: 1,
        calories: 180,
        protein: 6,
        carbs: 32,
        fat: 3,
      },
    ],
  },
];

export const mockSearchFoods = [
  {
    id: "f-1",
    name: "Paneer (Cottage Cheese)",
    servingUnits: ["100g", "50g", "1 cube (25g)", "1 cup diced (150g)"],
    caloriesPer100g: 265,
    proteinPer100g: 18.3,
    carbsPer100g: 3.4,
    fatPer100g: 20.8,
    category: "Dairy & Indian",
    brand: "Standard / USDA",
  },
  {
    id: "f-2",
    name: "Chicken Breast (Boneless)",
    servingUnits: ["100g", "150g fillet", "200g breast"],
    caloriesPer100g: 165,
    proteinPer100g: 31.0,
    carbsPer100g: 0.0,
    fatPer100g: 3.6,
    category: "Poultry",
    brand: "Standard / USDA",
  },
  {
    id: "f-3",
    name: "Whole Wheat Roti / Chapati",
    servingUnits: ["1 roti (35g)", "2 rotis (70g)", "100g"],
    caloriesPer100g: 260,
    proteinPer100g: 9.0,
    carbsPer100g: 52.0,
    fatPer100g: 1.5,
    category: "Grains & Indian",
    brand: "Standard IFCT",
  },
  {
    id: "f-4",
    name: "Egg (Whole)",
    servingUnits: ["1 egg (50g)", "2 eggs (100g)", "100g"],
    caloriesPer100g: 143,
    proteinPer100g: 12.6,
    carbsPer100g: 0.7,
    fatPer100g: 9.5,
    category: "Eggs",
    brand: "Standard / USDA",
  },
  {
    id: "f-5",
    name: "Cooked White Rice",
    servingUnits: ["1 cup (160g)", "1/2 cup (80g)", "100g"],
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28.2,
    fatPer100g: 0.3,
    category: "Grains",
    brand: "Standard / USDA",
  },
  {
    id: "f-6",
    name: "Apple (Raw with Skin)",
    servingUnits: ["1 medium (182g)", "1 small (150g)", "100g"],
    caloriesPer100g: 52,
    proteinPer100g: 0.3,
    carbsPer100g: 13.8,
    fatPer100g: 0.2,
    category: "Fruits",
    brand: "Standard / USDA",
  },
];

export const mockCalendarData: Record<string, { calories: number; target: number; status: "met" | "under" | "over" }> = {
  "2026-04-10": { calories: 2150, target: 2200, status: "met" },
  "2026-04-11": { calories: 2240, target: 2200, status: "met" },
  "2026-04-12": { calories: 1890, target: 2200, status: "under" },
  "2026-04-13": { calories: 2450, target: 2200, status: "over" },
  "2026-04-14": { calories: 2180, target: 2200, status: "met" },
  "2026-04-15": { calories: 1460, target: 2200, status: "under" },
};
