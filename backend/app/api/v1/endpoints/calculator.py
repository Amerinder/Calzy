from fastapi import APIRouter, HTTPException, status
from app.services.calculator import (
    CalculatorInput,
    CalculatorResult,
    calculate_nutrition_targets,
)

router = APIRouter()

@router.post(
    "/calculate",
    response_model=CalculatorResult,
    status_code=status.HTTP_200_OK,
    summary="Calculate BMR, TDEE, and Macronutrient Targets",
    description="Applies Mifflin-St Jeor equation and sports nutrition macro distribution to calculate maintenance and goal calories.",
)
def calculate_targets(inputs: CalculatorInput) -> CalculatorResult:
    try:
        return calculate_nutrition_targets(inputs)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
