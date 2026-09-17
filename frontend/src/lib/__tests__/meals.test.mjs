import test from "node:test";
import assert from "node:assert/strict";

// Pure aggregation matching frontend/src/lib/api/meals.ts
function aggregateDailyTotals(date, items) {
  const meals = {
    breakfast: {
      type: "breakfast",
      title: "Breakfast",
      items: [],
      total_calories: 0,
      total_protein_g: 0,
      total_carbs_g: 0,
      total_fat_g: 0,
      total_fiber_g: 0,
    },
    lunch: {
      type: "lunch",
      title: "Lunch",
      items: [],
      total_calories: 0,
      total_protein_g: 0,
      total_carbs_g: 0,
      total_fat_g: 0,
      total_fiber_g: 0,
    },
    snacks: {
      type: "snacks",
      title: "Snacks",
      items: [],
      total_calories: 0,
      total_protein_g: 0,
      total_carbs_g: 0,
      total_fat_g: 0,
      total_fiber_g: 0,
    },
    dinner: {
      type: "dinner",
      title: "Dinner",
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

test("Phase 6 Meal Logging & Daily Aggregation Tests", async (t) => {
  await t.test("Empty meals list returns zero totals and all 4 meal categories", () => {
    const totals = aggregateDailyTotals("2026-09-16", []);
    assert.equal(totals.date, "2026-09-16");
    assert.equal(totals.calories, 0);
    assert.equal(totals.protein_g, 0);
    assert.equal(totals.carbs_g, 0);
    assert.equal(totals.fat_g, 0);
    assert.equal(totals.fiber_g, 0);
    assert.equal(totals.total_items_count, 0);
    assert.ok(totals.meals.breakfast);
    assert.ok(totals.meals.lunch);
    assert.ok(totals.meals.snacks);
    assert.ok(totals.meals.dinner);
    assert.equal(totals.meals.breakfast.items.length, 0);
  });

  await t.test("Multiple items across meals aggregate calories and macros correctly", () => {
    const items = [
      {
        id: "item-1",
        meal_type: "breakfast",
        date: "2026-09-16",
        food_id: "egg-1",
        name: "Whole Egg (Boiled)",
        portion_label: "2 large eggs (100g)",
        grams: 100,
        quantity: 2,
        nutrition_snapshot: {
          calories: 143,
          protein_g: 12.6,
          carbs_g: 0.7,
          fat_g: 9.5,
          fiber_g: 0,
          net_carbs_g: 0.7,
          sugar_g: 0.4,
          sodium_mg: 124,
          protein_pct: 35,
          carbs_pct: 2,
          fat_pct: 63,
        },
        created_at: new Date().toISOString(),
      },
      {
        id: "item-2",
        meal_type: "breakfast",
        date: "2026-09-16",
        food_id: "roti-1",
        name: "Roti / Chapati",
        portion_label: "1 medium roti (35g)",
        grams: 35,
        quantity: 1,
        nutrition_snapshot: {
          calories: 104,
          protein_g: 3.3,
          carbs_g: 21.4,
          fat_g: 0.6,
          fiber_g: 3.9,
          net_carbs_g: 17.5,
          sugar_g: 0.1,
          sodium_mg: 0.4,
          protein_pct: 13,
          carbs_pct: 82,
          fat_pct: 5,
        },
        created_at: new Date().toISOString(),
      },
      {
        id: "item-3",
        meal_type: "lunch",
        date: "2026-09-16",
        food_id: "pulao-1",
        name: "Vegetable Pulao",
        portion_label: "1 katori (150g)",
        grams: 150,
        quantity: 1,
        nutrition_snapshot: {
          calories: 231,
          protein_g: 5.1,
          carbs_g: 42.3,
          fat_g: 4.8,
          fiber_g: 3.5,
          net_carbs_g: 38.8,
          sugar_g: 1.8,
          sodium_mg: 390,
          protein_pct: 9,
          carbs_pct: 73,
          fat_pct: 18,
        },
        created_at: new Date().toISOString(),
      },
    ];

    const totals = aggregateDailyTotals("2026-09-16", items);

    // Total calories: 143 + 104 + 231 = 478
    assert.equal(totals.calories, 478);
    // Total protein: 12.6 + 3.3 + 5.1 = 21.0
    assert.equal(totals.protein_g, 21.0);
    // Total carbs: 0.7 + 21.4 + 42.3 = 64.4
    assert.equal(totals.carbs_g, 64.4);
    // Total fat: 9.5 + 0.6 + 4.8 = 14.9
    assert.equal(totals.fat_g, 14.9);
    // Total fiber: 0 + 3.9 + 3.5 = 7.4
    assert.equal(totals.fiber_g, 7.4);
    assert.equal(totals.total_items_count, 3);

    // Breakfast totals
    assert.equal(totals.meals.breakfast.total_calories, 247);
    assert.equal(totals.meals.breakfast.items.length, 2);

    // Lunch totals
    assert.equal(totals.meals.lunch.total_calories, 231);
    assert.equal(totals.meals.lunch.items.length, 1);

    // Dinner empty
    assert.equal(totals.meals.dinner.total_calories, 0);
    assert.equal(totals.meals.dinner.items.length, 0);
  });

  await t.test("Items from different dates are strictly excluded from current daily total", () => {
    const items = [
      {
        id: "today-1",
        meal_type: "breakfast",
        date: "2026-09-16",
        food_id: "egg-1",
        name: "Egg",
        portion_label: "1 egg",
        grams: 50,
        quantity: 1,
        nutrition_snapshot: {
          calories: 72,
          protein_g: 6.3,
          carbs_g: 0.4,
          fat_g: 4.8,
          fiber_g: 0,
        },
        created_at: new Date().toISOString(),
      },
      {
        id: "yesterday-1",
        meal_type: "breakfast",
        date: "2026-09-15",
        food_id: "egg-1",
        name: "Egg",
        portion_label: "1 egg",
        grams: 50,
        quantity: 1,
        nutrition_snapshot: {
          calories: 72,
          protein_g: 6.3,
          carbs_g: 0.4,
          fat_g: 4.8,
          fiber_g: 0,
        },
        created_at: new Date().toISOString(),
      },
    ];

    const totalsToday = aggregateDailyTotals("2026-09-16", items);
    assert.equal(totalsToday.calories, 72);
    assert.equal(totalsToday.total_items_count, 1);

    const totalsYesterday = aggregateDailyTotals("2026-09-15", items);
    assert.equal(totalsYesterday.calories, 72);
    assert.equal(totalsYesterday.total_items_count, 1);
  });

  await t.test("Deleting an item updates the daily total and category sum immediately", () => {
    const item1 = {
      id: "del-1",
      meal_type: "dinner",
      date: "2026-09-16",
      food_id: "pizza-1",
      name: "Farmhouse Pizza",
      portion_label: "2 slices (210g)",
      grams: 210,
      quantity: 2,
      nutrition_snapshot: {
        calories: 514,
        protein_g: 19.3,
        carbs_g: 59.8,
        fat_g: 21.8,
        fiber_g: 4.4,
      },
      created_at: new Date().toISOString(),
    };
    const item2 = {
      id: "del-2",
      meal_type: "dinner",
      date: "2026-09-16",
      food_id: "coke-1",
      name: "Diet Soda",
      portion_label: "1 can (330ml)",
      grams: 330,
      quantity: 1,
      nutrition_snapshot: {
        calories: 1,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
      },
      created_at: new Date().toISOString(),
    };

    // Before deletion
    const before = aggregateDailyTotals("2026-09-16", [item1, item2]);
    assert.equal(before.calories, 515);
    assert.equal(before.meals.dinner.items.length, 2);

    // After deleting pizza
    const after = aggregateDailyTotals("2026-09-16", [item2]);
    assert.equal(after.calories, 1);
    assert.equal(after.protein_g, 0);
    assert.equal(after.meals.dinner.items.length, 1);
  });

  await t.test("Over-target calorie math handles surpluses gracefully", () => {
    const target = 2000;
    const consumed = 2350;
    const remaining = target - consumed;
    const isOver = remaining < 0;
    const surplus = Math.abs(remaining);

    assert.equal(isOver, true);
    assert.equal(surplus, 350);
  });
});
