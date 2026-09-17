import { ScaledNutrition } from "./foods";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type MealType = "breakfast" | "lunch" | "snacks" | "dinner";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "snacks", "dinner"];

export const MEAL_TITLES: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snacks: "Snacks",
  dinner: "Dinner",
};

export interface LoggedMealItem {
  id: string;
  meal_id?: string;
  meal_type: MealType;
  date: string; // YYYY-MM-DD
  food_id: string;
  name: string;
  portion_label: string;
  grams: number;
  quantity: number;
  nutrition_snapshot: ScaledNutrition;
  created_at: string;
}

export interface DailyMealCategory {
  type: MealType;
  title: string;
  items: LoggedMealItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
}

export interface DailyAggregatedTotals {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  meals: Record<MealType, DailyMealCategory>;
  total_items_count: number;
}

export interface LogMealInput {
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  food_id: string;
  name: string;
  portion_label: string;
  grams: number;
  quantity: number;
  nutrition_snapshot: ScaledNutrition;
}

const LOCAL_STORAGE_KEY = "calzy_logged_meals_v1";

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  const today = getTodayDateString();
  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formatted = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  if (dateStr === today) {
    return `Today, ${formatted}`;
  }

  // Calculate Yesterday / Tomorrow
  const todayObj = new Date();
  const diffDays = Math.round((dateObj.getTime() - todayObj.getTime()) / (1000 * 3600 * 24));
  if (diffDays === -1) return `Yesterday, ${formatted}`;
  if (diffDays === 1) return `Tomorrow, ${formatted}`;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[dateObj.getDay()]}, ${formatted}`;
}

/**
 * Pure aggregation function: calculates total calories, protein, carbs, fat, fiber
 * and groups items by meal category.
 */
export function aggregateDailyTotals(date: string, items: LoggedMealItem[]): DailyAggregatedTotals {
  const meals: Record<MealType, DailyMealCategory> = {
    breakfast: {
      type: "breakfast",
      title: MEAL_TITLES.breakfast,
      items: [],
      total_calories: 0,
      total_protein_g: 0,
      total_carbs_g: 0,
      total_fat_g: 0,
      total_fiber_g: 0,
    },
    lunch: {
      type: "lunch",
      title: MEAL_TITLES.lunch,
      items: [],
      total_calories: 0,
      total_protein_g: 0,
      total_carbs_g: 0,
      total_fat_g: 0,
      total_fiber_g: 0,
    },
    snacks: {
      type: "snacks",
      title: MEAL_TITLES.snacks,
      items: [],
      total_calories: 0,
      total_protein_g: 0,
      total_carbs_g: 0,
      total_fat_g: 0,
      total_fiber_g: 0,
    },
    dinner: {
      type: "dinner",
      title: MEAL_TITLES.dinner,
      items: [],
      total_calories: 0,
      total_protein_g: 0,
      total_carbs_g: 0,
      total_fat_g: 0,
      total_fiber_g: 0,
    },
  };

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let totalSodium = 0;

  for (const item of items) {
    if (item.date !== date) continue;
    const cat = meals[item.meal_type];
    if (!cat) continue;

    cat.items.push(item);
    const snap = item.nutrition_snapshot;

    cat.total_calories += snap.calories || 0;
    cat.total_protein_g = Math.round((cat.total_protein_g + (snap.protein_g || 0)) * 10) / 10;
    cat.total_carbs_g = Math.round((cat.total_carbs_g + (snap.carbs_g || 0)) * 10) / 10;
    cat.total_fat_g = Math.round((cat.total_fat_g + (snap.fat_g || 0)) * 10) / 10;
    cat.total_fiber_g = Math.round((cat.total_fiber_g + (snap.fiber_g || 0)) * 10) / 10;

    totalCalories += snap.calories || 0;
    totalProtein += snap.protein_g || 0;
    totalCarbs += snap.carbs_g || 0;
    totalFat += snap.fat_g || 0;
    totalFiber += snap.fiber_g || 0;
    totalSodium += snap.sodium_mg || 0;
  }

  return {
    date,
    calories: Math.round(totalCalories),
    protein_g: Math.round(totalProtein * 10) / 10,
    carbs_g: Math.round(totalCarbs * 10) / 10,
    fat_g: Math.round(totalFat * 10) / 10,
    fiber_g: Math.round(totalFiber * 10) / 10,
    sodium_mg: Math.round(totalSodium),
    meals,
    total_items_count: items.filter((i) => i.date === date).length,
  };
}

/**
 * Local Storage Helper functions for immediate reactive updates and offline support
 */
function getLocalStoredItems(): LoggedMealItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function setLocalStoredItems(items: LoggedMealItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("calzy_meals_updated"));
  } catch {
    // ignore
  }
}

/**
 * Retrieves all meals for a given date with automatic calculation of daily totals.
 */
export async function getDailyMeals(date: string): Promise<DailyAggregatedTotals> {
  const localItems = getLocalStoredItems().filter((item) => item.date === date);

  if (isSupabaseConfigured) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dbMeals, error } = await supabase
          .from("meals")
          .select("id, date, meal_type, meal_items(*)")
          .eq("user_id", user.id)
          .eq("date", date);

        if (!error && Array.isArray(dbMeals)) {
          const remoteItems: LoggedMealItem[] = [];
          for (const m of dbMeals) {
            const items = (m.meal_items as Array<Record<string, unknown>>) || [];
            for (const it of items) {
              remoteItems.push({
                id: String(it.id),
                meal_id: String(m.id),
                meal_type: m.meal_type as MealType,
                date: String(m.date),
                food_id: String(it.food_id),
                name: String(it.name),
                portion_label: String(it.portion_label),
                grams: Number(it.grams),
                quantity: Number(it.quantity || 1),
                nutrition_snapshot: it.nutrition_snapshot as ScaledNutrition,
                created_at: String(it.created_at || new Date().toISOString()),
              });
            }
          }

          // Merge local and remote ensuring no duplicates
          const seen = new Set(remoteItems.map((r) => r.id));
          const merged = [...remoteItems, ...localItems.filter((l) => !seen.has(l.id))];
          return aggregateDailyTotals(date, merged);
        }
      }
    } catch {
      // Fallback to local storage
    }
  }

  return aggregateDailyTotals(date, localItems);
}

/**
 * Logs a meal item with an immutable nutrition snapshot.
 */
export async function logMealItem(input: LogMealInput): Promise<LoggedMealItem> {
  const newItem: LoggedMealItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    meal_type: input.meal_type,
    date: input.date,
    food_id: input.food_id,
    name: input.name,
    portion_label: input.portion_label,
    grams: input.grams,
    quantity: input.quantity,
    nutrition_snapshot: input.nutrition_snapshot,
    created_at: new Date().toISOString(),
  };

  // Always save locally first for instant UI response
  const existing = getLocalStoredItems();
  setLocalStoredItems([newItem, ...existing]);

  // If Supabase is configured and user is signed in, sync to database
  if (isSupabaseConfigured) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Find or create meal container
        const { data: meal, error: mealErr } = await supabase
          .from("meals")
          .upsert(
            { user_id: user.id, date: input.date, meal_type: input.meal_type },
            { onConflict: "user_id,date,meal_type" }
          )
          .select("id")
          .single();

        if (!mealErr && meal?.id) {
          const { data: dbItem, error: itemErr } = await supabase
            .from("meal_items")
            .insert({
              meal_id: meal.id,
              food_id: input.food_id,
              name: input.name,
              portion_label: input.portion_label,
              grams: input.grams,
              quantity: input.quantity,
              nutrition_snapshot: input.nutrition_snapshot,
            })
            .select("id")
            .single();

          if (!itemErr && dbItem?.id) {
            newItem.id = dbItem.id;
            newItem.meal_id = meal.id;
          }
        }
      }
    } catch {
      // Offline fallback preserved in localStorage
    }
  }

  return newItem;
}

/**
 * Removes a meal item and triggers immediate recalculation of all daily totals and progress bars.
 */
export async function deleteMealItem(itemId: string): Promise<void> {
  const existing = getLocalStoredItems();
  const updated = existing.filter((item) => item.id !== itemId);
  setLocalStoredItems(updated);

  if (isSupabaseConfigured) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("meal_items").delete().eq("id", itemId);
      }
    } catch {
      // ignore
    }
  }
}
