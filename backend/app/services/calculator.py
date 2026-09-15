from enum import Enum
from typing import Dict, Any
from pydantic import BaseModel, Field

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class ActivityLevel(str, Enum):
    SEDENTARY = "sedentary"
    LIGHT = "light"
    MODERATE = "moderate"
    ACTIVE = "active"
    VERY_ACTIVE = "very_active"

class HealthGoal(str, Enum):
    LOSE = "lose"
    MAINTAIN = "maintain"
    GAIN = "gain"

# Explicit configuration of activity multipliers (not magic numbers scattered in code)
ACTIVITY_MULTIPLIERS: Dict[ActivityLevel, float] = {
    ActivityLevel.SEDENTARY: 1.200,   # Little to no exercise
    ActivityLevel.LIGHT: 1.375,       # Light exercise 1-3 days/week
    ActivityLevel.MODERATE: 1.550,    # Moderate exercise 3-5 days/week
    ActivityLevel.ACTIVE: 1.725,      # Hard exercise 6-7 days/week
    ActivityLevel.VERY_ACTIVE: 1.900, # Extra intense training or physical labor
}

# Goal calorie offsets
GOAL_CALORIE_ADJUSTMENTS: Dict[HealthGoal, int] = {
    HealthGoal.LOSE: -500,     # ~0.5 kg healthy fat loss per week
    HealthGoal.MAINTAIN: 0,    # Maintain current weight
    HealthGoal.GAIN: 350,      # ~0.35 kg lean mass surplus per week
}

# Minimum safety caloric floors to prevent harmful metabolic slowdown
SAFETY_CALORIE_FLOORS: Dict[Gender, int] = {
    Gender.MALE: 1500,
    Gender.FEMALE: 1200,
    Gender.OTHER: 1350,
}

class CalculatorInput(BaseModel):
    age: int = Field(..., ge=10, le=120, description="Age in years")
    gender: Gender = Field(..., description="Biological sex for Mifflin-St Jeor")
    height_cm: float = Field(..., ge=50, le=300, description="Height in centimeters")
    weight_kg: float = Field(..., ge=20, le=500, description="Weight in kilograms")
    activity_level: ActivityLevel = Field(..., description="Daily physical activity level")
    goal: HealthGoal = Field(..., description="Primary health goal")

class MacroBreakdown(BaseModel):
    protein_g: float
    protein_kcal: int
    protein_pct: int
    carbs_g: float
    carbs_kcal: int
    carbs_pct: int
    fat_g: float
    fat_kcal: int
    fat_pct: int

class CalculatorResult(BaseModel):
    bmr: int
    tdee: int
    calorie_target: int
    macros: MacroBreakdown
    protein_g: float
    carbs_g: float
    fat_g: float
    activity_multiplier: float
    goal_adjustment_kcal: int
    notes: str

def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: Gender) -> float:
    """
    Calculate Basal Metabolic Rate using the Mifflin-St Jeor Equation.
    Male: 10 * weight + 6.25 * height - 5 * age + 5
    Female: 10 * weight + 6.25 * height - 5 * age - 161
    Other: 10 * weight + 6.25 * height - 5 * age - 78
    """
    base = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age)
    if gender == Gender.MALE:
        return base + 5.0
    elif gender == Gender.FEMALE:
        return base - 161.0
    else:
        return base - 78.0

def calculate_tdee(bmr: float, activity_level: ActivityLevel) -> float:
    """
    Calculate Total Daily Energy Expenditure by applying the explicit activity multiplier.
    """
    multiplier = ACTIVITY_MULTIPLIERS[activity_level]
    return bmr * multiplier

def calculate_macro_distribution(
    weight_kg: float,
    calorie_target: int,
) -> MacroBreakdown:
    """
    Calculate macronutrient distribution adhering to evidence-based sports nutrition:
    - Protein: 2.0g per kg of body weight (capped at 35% of total calories)
    - Fat: 0.9g per kg of body weight (floored at 20% and capped at 35% of total calories)
    - Carbohydrates: Remaining calories allocated to carbohydrates (4 kcal/g)
    """
    # 1. Protein: 2.0g per kg body weight
    protein_g = round(weight_kg * 2.0, 1)
    protein_kcal = int(round(protein_g * 4))
    # Cap protein at 35% of total calories if target is very low
    max_protein_kcal = int(calorie_target * 0.35)
    if protein_kcal > max_protein_kcal:
        protein_kcal = max_protein_kcal
        protein_g = round(protein_kcal / 4.0, 1)

    # 2. Fat: 0.9g per kg body weight (approx 25% of calories)
    fat_g = round(weight_kg * 0.9, 1)
    fat_kcal = int(round(fat_g * 9))
    min_fat_kcal = int(calorie_target * 0.20)
    max_fat_kcal = int(calorie_target * 0.35)
    if fat_kcal < min_fat_kcal:
        fat_kcal = min_fat_kcal
        fat_g = round(fat_kcal / 9.0, 1)
    elif fat_kcal > max_fat_kcal:
        fat_kcal = max_fat_kcal
        fat_g = round(fat_kcal / 9.0, 1)

    # 3. Carbohydrates: Remainder of daily calories
    remaining_kcal = max(0, calorie_target - protein_kcal - fat_kcal)
    carbs_g = round(remaining_kcal / 4.0, 1)
    carbs_kcal = int(round(carbs_g * 4))

    # Calculate actual energy percentages
    total_macro_kcal = max(1, protein_kcal + carbs_kcal + fat_kcal)
    protein_pct = int(round((protein_kcal / total_macro_kcal) * 100))
    carbs_pct = int(round((carbs_kcal / total_macro_kcal) * 100))
    fat_pct = 100 - protein_pct - carbs_pct

    return MacroBreakdown(
        protein_g=protein_g,
        protein_kcal=protein_kcal,
        protein_pct=protein_pct,
        carbs_g=carbs_g,
        carbs_kcal=carbs_kcal,
        carbs_pct=carbs_pct,
        fat_g=fat_g,
        fat_kcal=fat_kcal,
        fat_pct=fat_pct,
    )

def calculate_nutrition_targets(inputs: CalculatorInput) -> CalculatorResult:
    """
    Main calculator function executing the complete pipeline:
    BMR -> TDEE -> Goal Adjustment with Safety Floors -> Macro Split.
    """
    bmr = calculate_bmr(inputs.weight_kg, inputs.height_cm, inputs.age, inputs.gender)
    tdee = calculate_tdee(bmr, inputs.activity_level)
    adjustment = GOAL_CALORIE_ADJUSTMENTS[inputs.goal]

    raw_target = tdee + adjustment
    floor = SAFETY_CALORIE_FLOORS[inputs.gender]
    final_target = max(floor, int(round(raw_target)))

    macros = calculate_macro_distribution(inputs.weight_kg, final_target)

    note = f"Calculated using Mifflin-St Jeor formula with {inputs.activity_level.value} activity factor ({ACTIVITY_MULTIPLIERS[inputs.activity_level]}x)."
    if raw_target < floor:
        note += f" Calorie target was adjusted to the scientific safety floor of {floor} kcal."

    return CalculatorResult(
        bmr=int(round(bmr)),
        tdee=int(round(tdee)),
        calorie_target=final_target,
        macros=macros,
        protein_g=macros.protein_g,
        carbs_g=macros.carbs_g,
        fat_g=macros.fat_g,
        activity_multiplier=ACTIVITY_MULTIPLIERS[inputs.activity_level],
        goal_adjustment_kcal=adjustment,
        notes=note,
    )
