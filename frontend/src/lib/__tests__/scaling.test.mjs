import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Pure scaling function matching frontend/src/lib/api/foods.ts
function scaleNutrition(food, grams) {
  const nut = food.nutrition;
  const safeGrams = Math.max(0, isNaN(grams) ? 0 : grams);
  const ratio = safeGrams / 100.0;

  const calories = Math.round(nut.calories * ratio);
  const protein_g = Math.round(nut.protein_g * ratio * 10) / 10;
  const carbs_g = Math.round(nut.carbs_g * ratio * 10) / 10;
  const fat_g = Math.round(nut.fat_g * ratio * 10) / 10;
  const fiber_g = Math.round(nut.fiber_g * ratio * 10) / 10;
  const net_carbs_g = Math.max(0, Math.round((carbs_g - fiber_g) * 10) / 10);
  const sugar_g = Math.round(nut.sugar_g * ratio * 10) / 10;
  const sodium_mg = Math.round(nut.sodium_mg * ratio * 10) / 10;

  const proteinKcal = protein_g * 4;
  const carbsKcal = carbs_g * 4;
  const fatKcal = fat_g * 9;
  const totalMacroKcal = Math.max(1, proteinKcal + carbsKcal + fatKcal);

  const protein_pct = Math.round((proteinKcal / totalMacroKcal) * 100);
  const carbs_pct = Math.round((carbsKcal / totalMacroKcal) * 100);
  const fat_pct = Math.max(0, 100 - protein_pct - carbs_pct);

  const scaledMicros = {};
  if (nut.micronutrients) {
    for (const [key, val] of Object.entries(nut.micronutrients)) {
      if (typeof val === "number") {
        scaledMicros[key] = Math.round(val * ratio * 100) / 100;
      }
    }
  }

  return {
    calories,
    protein_g,
    carbs_g,
    fat_g,
    fiber_g,
    net_carbs_g,
    sugar_g,
    sodium_mg,
    potassium_mg: scaledMicros.potassium_mg,
    calcium_mg: scaledMicros.calcium_mg,
    iron_mg: scaledMicros.iron_mg,
    protein_pct,
    carbs_pct,
    fat_pct,
    micronutrients: scaledMicros,
  };
}

const mockChickenBreast = {
  id: "mock-chicken",
  name: "Chicken Breast",
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
    { id: "s1", label: "1 standard fillet (174g)", grams: 174, unit_type: "piece", quantity: 1 },
    { id: "s2", label: "1 palm portion (100g)", grams: 100, unit_type: "portion", quantity: 1 },
  ],
};

const mockRoti = {
  id: "mock-roti",
  name: "Roti / Whole Wheat Chapati",
  nutrition: {
    basis_grams: 100,
    calories: 297,
    protein_g: 9.4,
    carbs_g: 61.2,
    fat_g: 1.7,
    fiber_g: 11.2,
    sugar_g: 1.5,
    sodium_mg: 8,
    micronutrients: { iron_mg: 3.97, calcium_mg: 30 },
  },
  servings: [
    { id: "s-roti-1", label: "1 medium roti (35g)", grams: 35, unit_type: "piece", quantity: 1 },
    { id: "s-roti-2", label: "2 medium rotis (70g)", grams: 70, unit_type: "portion", quantity: 2 },
  ],
};

describe("Phase 5 Nutrition Scaling & Portion Math Tests", () => {
  test("100g portion exactly matches base 100g nutrition values", () => {
    const scaled = scaleNutrition(mockChickenBreast, 100);
    assert.equal(scaled.calories, 120);
    assert.equal(scaled.protein_g, 22.5);
    assert.equal(scaled.carbs_g, 0);
    assert.equal(scaled.fat_g, 2.6);
    assert.equal(scaled.sodium_mg, 65);
    assert.equal(scaled.potassium_mg, 334);
    assert.equal(scaled.iron_mg, 0.37);
  });

  test("Fillet portion (174g) scales deterministically per formula", () => {
    const scaled = scaleNutrition(mockChickenBreast, 174);
    // calories = round(120 * 1.74) = 209
    assert.equal(scaled.calories, 209);
    // protein = round(22.5 * 1.74 * 10) / 10 = round(39.15 * 10) / 10 = 39.2
    assert.equal(scaled.protein_g, 39.2);
    // fat = round(2.6 * 1.74 * 10) / 10 = round(4.524 * 10) / 10 = 4.5
    assert.equal(scaled.fat_g, 4.5);
    // sodium = round(65 * 1.74 * 10) / 10 = 113.1
    assert.equal(scaled.sodium_mg, 113.1);
  });

  test("Roti portion (35g for 1 roti, 70g for 2 rotis) with fiber and net carbs", () => {
    const oneRoti = scaleNutrition(mockRoti, 35);
    // calories = round(297 * 0.35) = 104
    assert.equal(oneRoti.calories, 104);
    // protein = round(9.4 * 0.35 * 10) / 10 = 3.3
    assert.equal(oneRoti.protein_g, 3.3);
    // carbs = round(61.2 * 0.35 * 10) / 10 = 21.4
    assert.equal(oneRoti.carbs_g, 21.4);
    // fiber = round(11.2 * 0.35 * 10) / 10 = 3.9
    assert.equal(oneRoti.fiber_g, 3.9);
    // net carbs = 21.4 - 3.9 = 17.5
    assert.equal(oneRoti.net_carbs_g, 17.5);

    const twoRotis = scaleNutrition(mockRoti, 70);
    // calories = round(297 * 0.70) = 208
    assert.equal(twoRotis.calories, 208);
    assert.equal(twoRotis.protein_g, 6.6);
    assert.equal(twoRotis.carbs_g, 42.8);
    assert.equal(twoRotis.fiber_g, 7.8);
    assert.equal(twoRotis.net_carbs_g, 35.0);
  });

  test("Macro percentage distribution sums up to 100%", () => {
    const scaled = scaleNutrition(mockRoti, 70);
    const sum = scaled.protein_pct + scaled.carbs_pct + scaled.fat_pct;
    assert.equal(sum, 100);
  });

  test("Safety bounds: negative, zero, and NaN grams handle gracefully", () => {
    const zeroScaled = scaleNutrition(mockChickenBreast, 0);
    assert.equal(zeroScaled.calories, 0);
    assert.equal(zeroScaled.protein_g, 0);

    const negScaled = scaleNutrition(mockChickenBreast, -50);
    assert.equal(negScaled.calories, 0);
    assert.equal(negScaled.protein_g, 0);

    const nanScaled = scaleNutrition(mockChickenBreast, NaN);
    assert.equal(nanScaled.calories, 0);
    assert.equal(nanScaled.protein_g, 0);
  });
});
