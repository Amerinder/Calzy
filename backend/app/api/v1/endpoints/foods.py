from fastapi import APIRouter, Query, HTTPException, Path as FastPath
from typing import Optional, List
from app.schemas.food import (
    FoodItemSchema,
    FoodSearchResponse,
    ScaledNutritionResponse,
)
from app.services.food_catalog import FoodCatalogService

router = APIRouter()

@router.get("/suggestions", response_model=List[str])
def get_food_suggestions(
    q: str = Query(..., min_length=1, description="Prefix or partial food name typed by user"),
    limit: int = Query(8, ge=1, le=20, description="Max suggestions to return"),
):
    """
    Real-time autocomplete suggestions as user types:
    Queries FatSecret autocomplete -> USDA FoodData Central -> Local catalog.
    """
    return FoodCatalogService.get_suggestions(query=q, limit=limit)

@router.get("/search", response_model=FoodSearchResponse)
def search_foods(
    q: Optional[str] = Query(None, description="Search query for food name or category"),
    category: Optional[str] = Query(None, description="Filter by food category"),
    limit: int = Query(20, ge=1, le=100, description="Max items to return"),
):
    """
    Multi-tier food search:
    1. FatSecret Platform API
    2. USDA FoodData Central API (automatic fallback)
    3. Local authoritative catalog (fallback)
    """
    items = FoodCatalogService.search_foods_multi_tier(query=q, category=category, limit=limit)
    return FoodSearchResponse(
        total=len(items),
        query=q,
        category=category,
        items=items,
    )

@router.get("/categories", response_model=List[str])
def list_categories():
    """Returns all available distinct food categories in the catalog."""
    return FoodCatalogService.get_categories()

@router.get("/{food_id}", response_model=FoodItemSchema)
def get_food_detail(
    food_id: str = FastPath(..., description="Food identifier (fs:..., usda:..., or uuid)"),
):
    """
    Retrieve full details for a food item, including 100g nutrition breakdown,
    source attribution, and all configured serving portions with gram equivalents.
    """
    food = FoodCatalogService.get_food_detail_multi_tier(food_id)
    if not food:
        raise HTTPException(
            status_code=404,
            detail=f"Food item with ID '{food_id}' was not found in catalog.",
        )
    return food

@router.get("/{food_id}/scale", response_model=ScaledNutritionResponse)
def scale_food_nutrition(
    food_id: str = FastPath(..., description="Food identifier (fs:..., usda:..., or uuid)"),
    grams: float = Query(..., gt=0, le=5000, description="Grams of food to calculate nutrition for"),
    serving_label: Optional[str] = Query(None, description="Optional label of chosen serving size"),
):
    """
    Calculate scaled nutrition facts for a selected gram weight based on the
    per-100g canonical database record: scaled = (grams / 100) * val_per_100g.
    """
    try:
        return FoodCatalogService.scale_nutrition(food_id, grams, serving_label)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
