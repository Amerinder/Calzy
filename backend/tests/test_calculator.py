import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.calculator import (
    calculate_bmr,
    calculate_tdee,
    calculate_nutrition_targets,
    calculate_macro_distribution,
    CalculatorInput,
    Gender,
    ActivityLevel,
    HealthGoal,
    ACTIVITY_MULTIPLIERS,
    SAFETY_CALORIE_FLOORS,
)

client = TestClient(app)

def test_mifflin_st_jeor_male():
    """Test standard male calculation: 26yo, 74kg, 178cm."""
    # Formula: 10*74 + 6.25*178 - 5*26 + 5 = 740 + 1112.5 - 130 + 5 = 1727.5
    bmr = calculate_bmr(74.0, 178.0, 26, Gender.MALE)
    assert round(bmr, 1) == 1727.5

def test_mifflin_st_jeor_female():
    """Test standard female calculation: 30yo, 60kg, 165cm."""
    # Formula: 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
    bmr = calculate_bmr(60.0, 165.0, 30, Gender.FEMALE)
    assert round(bmr, 2) == 1320.25

def test_activity_multipliers():
    """Verify all explicit multipliers match scientific specifications."""
    assert ACTIVITY_MULTIPLIERS[ActivityLevel.SEDENTARY] == 1.200
    assert ACTIVITY_MULTIPLIERS[ActivityLevel.LIGHT] == 1.375
    assert ACTIVITY_MULTIPLIERS[ActivityLevel.MODERATE] == 1.550
    assert ACTIVITY_MULTIPLIERS[ActivityLevel.ACTIVE] == 1.725
    assert ACTIVITY_MULTIPLIERS[ActivityLevel.VERY_ACTIVE] == 1.900

    bmr = 1727.5
    tdee = calculate_tdee(bmr, ActivityLevel.MODERATE)
    assert round(tdee, 2) == round(1727.5 * 1.550, 2)

def test_macro_energy_balance():
    """Test that calculated macros sum up to the target calorie total."""
    weight_kg = 75.0
    calorie_target = 2200

    macros = calculate_macro_distribution(weight_kg, calorie_target)
    total_macro_calories = (macros.protein_g * 4) + (macros.carbs_g * 4) + (macros.fat_g * 9)

    # Allow tiny rounding deviation (+/- 15 kcal)
    assert abs(total_macro_calories - calorie_target) <= 15
    assert macros.protein_g > 0
    assert macros.carbs_g > 0
    assert macros.fat_g > 0

def test_safety_calorie_floor():
    """Verify calorie targets do not drop below safety thresholds."""
    # Extreme weight loss case with low starting weight & sedentary activity
    inputs = CalculatorInput(
        age=50,
        gender=Gender.FEMALE,
        height_cm=150.0,
        weight_kg=40.0,
        activity_level=ActivityLevel.SEDENTARY,
        goal=HealthGoal.LOSE,
    )
    result = calculate_nutrition_targets(inputs)
    assert result.calorie_target >= SAFETY_CALORIE_FLOORS[Gender.FEMALE]
    assert result.calorie_target >= 1200

def test_calculator_api_endpoint():
    """Test FastAPI calculator endpoint with valid input."""
    payload = {
        "age": 26,
        "gender": "male",
        "height_cm": 178.0,
        "weight_kg": 74.0,
        "activity_level": "moderate",
        "goal": "maintain",
    }
    response = client.post("/api/v1/calculator/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["bmr"] == 1728
    assert data["tdee"] == 2678
    assert data["calorie_target"] == 2678
    assert "macros" in data
    assert data["protein_g"] > 0
    assert data["carbs_g"] > 0
    assert data["fat_g"] > 0

def test_calculator_api_validation_error():
    """Test that out-of-range inputs trigger 422 validation error."""
    invalid_payload = {
        "age": 5, # Minimum age is 10
        "gender": "male",
        "height_cm": 178.0,
        "weight_kg": 74.0,
        "activity_level": "moderate",
        "goal": "maintain",
    }
    response = client.post("/api/v1/calculator/calculate", json=invalid_payload)
    assert response.status_code == 422
