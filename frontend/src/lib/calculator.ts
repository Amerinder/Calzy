import { ActivityLevel, Gender, HealthGoal } from "./supabase/types";

export interface CalculatorParameters {
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: HealthGoal;
}

export interface CalculatedTargets {
  bmr: number;
  tdee: number;
  calorie_target: number;
  protein_g: number;
  protein_kcal: number;
  protein_pct: number;
  carbs_g: number;
  carbs_kcal: number;
  carbs_pct: number;
  fat_g: number;
  fat_kcal: number;
  fat_pct: number;
  activity_multiplier: number;
  goal_adjustment_kcal: number;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const GOAL_ADJUSTMENTS: Record<HealthGoal, number> = {
  lose: -500,
  maintain: 0,
  gain: 350,
};

export const SAFETY_FLOORS: Record<Gender, number> = {
  male: 1500,
  female: 1200,
  other: 1350,
};

/**
 * Client-side calculation adhering identically to the backend Mifflin-St Jeor service.
 */
export function calculateNutritionTargets(params: CalculatorParameters): CalculatedTargets {
  const { age, gender, height_cm, weight_kg, activity_level, goal } = params;

  // 1. Mifflin-St Jeor BMR
  const base = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age;
  let bmrRaw = base - 78.0;
  if (gender === "male") bmrRaw = base + 5.0;
  if (gender === "female") bmrRaw = base - 161.0;

  const bmr = Math.round(bmrRaw);

  // 2. TDEE
  const multiplier = ACTIVITY_MULTIPLIERS[activity_level] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  // 3. Goal Adjustment with Safety Floor
  const adjustment = GOAL_ADJUSTMENTS[goal] || 0;
  const rawTarget = tdee + adjustment;
  const floor = SAFETY_FLOORS[gender] || 1350;
  const calorie_target = Math.max(floor, rawTarget);

  // 4. Macro Allocation
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
