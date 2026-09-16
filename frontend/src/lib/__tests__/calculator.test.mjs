import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Mirror calculator logic directly to test deterministic Mifflin-St Jeor math
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS = {
  lose: -500,
  maintain: 0,
  gain: 350,
};

const SAFETY_FLOORS = {
  male: 1500,
  female: 1200,
  other: 1350,
};

function calculateNutritionTargets(params) {
  const { age, gender, height_cm, weight_kg, activity_level, goal } = params;

  const base = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age;
  let bmrRaw = base - 78.0;
  if (gender === "male") bmrRaw = base + 5.0;
  if (gender === "female") bmrRaw = base - 161.0;

  const bmr = Math.round(bmrRaw);
  const multiplier = ACTIVITY_MULTIPLIERS[activity_level] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  const adjustment = GOAL_ADJUSTMENTS[goal] || 0;
  const rawTarget = tdee + adjustment;
  const floor = SAFETY_FLOORS[gender] || 1350;
  const calorie_target = Math.max(floor, rawTarget);

  let protein_g = Math.round(weight_kg * 2.0);
  let protein_kcal = protein_g * 4;
  const maxProteinKcal = Math.round(calorie_target * 0.35);
  if (protein_kcal > maxProteinKcal) {
    protein_kcal = maxProteinKcal;
    protein_g = Math.round(protein_kcal / 4);
  }

  let fat_g = Math.round(weight_kg * 0.9);
  let fat_kcal = fat_g * 9;
  const minFatKcal = Math.round(calorie_target * 0.20);
  const maxFatKcal = Math.round(calorie_target * 0.35);
  if (fat_kcal < minFatKcal) {
    fat_kcal = minFatKcal;
    fat_g = Math.round(fat_kcal / 9);
  } else if (fat_kcal > maxFatKcal) {
    fat_kcal = maxFatKcal;
    fat_g = Math.round(fat_kcal / 9);
  }

  const remainingKcal = Math.max(0, calorie_target - protein_kcal - fat_kcal);
  const carbs_g = Math.round(remainingKcal / 4);
  const carbs_kcal = carbs_g * 4;

  const totalMacroKcal = Math.max(1, protein_kcal + carbs_kcal + fat_kcal);
  const protein_pct = Math.round((protein_kcal / totalMacroKcal) * 100);
  const carbs_pct = Math.round((carbs_kcal / totalMacroKcal) * 100);
  const fat_pct = 100 - protein_pct - carbs_pct;

  return {
    bmr,
    tdee,
    calorie_target,
    protein_g,
    protein_kcal,
    protein_pct,
    carbs_g,
    carbs_kcal,
    carbs_pct,
    fat_g,
    fat_kcal,
    fat_pct,
    activity_multiplier: multiplier,
    goal_adjustment_kcal: adjustment,
  };
}

describe("Mifflin-St Jeor Nutrition Calculator Tests", () => {
  test("Standard male baseline calculation (26yo, 74kg, 178cm, moderate, maintain)", () => {
    const result = calculateNutritionTargets({
      age: 26,
      gender: "male",
      height_cm: 178,
      weight_kg: 74,
      activity_level: "moderate",
      goal: "maintain",
    });

    // BMR = 10*74 + 6.25*178 - 5*26 + 5 = 740 + 1112.5 - 130 + 5 = 1727.5 -> 1728
    assert.equal(result.bmr, 1728);
    // TDEE = 1728 * 1.55 = 2678.4 -> 2678
    assert.equal(result.tdee, 2678);
    assert.equal(result.calorie_target, 2678);
    assert.equal(result.protein_g, 148); // 74kg * 2g = 148g
    assert.ok(result.protein_g > 0);
    assert.ok(result.carbs_g > 0);
    assert.ok(result.fat_g > 0);
    assert.equal(result.protein_pct + result.carbs_pct + result.fat_pct, 100);
  });

  test("Standard female baseline calculation (30yo, 60kg, 165cm, light, lose)", () => {
    const result = calculateNutritionTargets({
      age: 30,
      gender: "female",
      height_cm: 165,
      weight_kg: 60,
      activity_level: "light",
      goal: "lose",
    });

    // BMR = 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
    assert.equal(result.bmr, 1320);
    // TDEE = 1320 * 1.375 = 1815
    assert.equal(result.tdee, 1815);
    // Goal lose = -500 kcal -> 1815 - 500 = 1315
    assert.equal(result.calorie_target, 1315);
    assert.ok(result.calorie_target >= 1200); // Respects female safety floor of 1200
  });

  test("Edge case: Safety floor enforcement for aggressive deficits", () => {
    const result = calculateNutritionTargets({
      age: 40,
      gender: "female",
      height_cm: 150,
      weight_kg: 45,
      activity_level: "sedentary",
      goal: "lose",
    });

    // Raw deficit would fall below 1200 kcal
    assert.ok(result.calorie_target >= 1200, "Safety floor must be at least 1200 for female");
  });

  test("Weight gain goal correctly adds surplus (+350 kcal)", () => {
    const result = calculateNutritionTargets({
      age: 22,
      gender: "male",
      height_cm: 180,
      weight_kg: 70,
      activity_level: "active",
      goal: "gain",
    });

    assert.equal(result.goal_adjustment_kcal, 350);
    assert.equal(result.calorie_target, result.tdee + 350);
  });
});
