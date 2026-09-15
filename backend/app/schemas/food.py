from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class ServingSchema(BaseModel):
    id: Optional[str] = None
    label: str = Field(..., description="Human friendly serving label, e.g. '1 large egg (50g)'")
    grams: float = Field(..., gt=0, description="Mass in grams for this serving size")
    unit_type: str = Field(..., description="Unit type, e.g. piece, cup, katori, tbsp, tsp, weight_g, portion")
    quantity: float = Field(1.0, gt=0, description="Reference quantity for the serving")

class FoodNutritionSchema(BaseModel):
    basis_grams: float = Field(100.0, description="Normalization basis mass in grams (default 100g)")
    calories: float = Field(..., ge=0, description="Energy content in kcal per basis_grams")
    protein_g: float = Field(..., ge=0, description="Protein in grams per basis_grams")
    carbs_g: float = Field(..., ge=0, description="Carbohydrates in grams per basis_grams")
    fat_g: float = Field(..., ge=0, description="Fat in grams per basis_grams")
    fiber_g: float = Field(0.0, ge=0, description="Dietary fiber in grams per basis_grams")
    sugar_g: float = Field(0.0, ge=0, description="Sugars in grams per basis_grams")
    sodium_mg: float = Field(0.0, ge=0, description="Sodium in milligrams per basis_grams")
    micronutrients: Dict[str, float] = Field(default_factory=dict, description="Key micronutrients (iron_mg, calcium_mg, etc.)")

class FoodItemSchema(BaseModel):
    id: str
    name: str
    category: str
    source: str = Field(..., description="Authoritative source: USDA FoodData Central or ICMR-NIN IFCT 2017")
    external_id: str = Field(..., description="Official catalog ID (FDC:XXXXXX or IFCT:XXXX)")
    brand: Optional[str] = None
    default_unit: str = "portion"
    nutrition: FoodNutritionSchema
    servings: List[ServingSchema] = Field(default_factory=list)

class FoodSummarySchema(BaseModel):
    id: str
    name: str
    category: str
    source: str
    brand: Optional[str] = None
    default_unit: str
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
    fiber_per_100g: float
    servings_count: int

class FoodSearchResponse(BaseModel):
    total: int
    query: Optional[str] = None
    category: Optional[str] = None
    items: List[FoodSummarySchema]

class ScaledNutritionResponse(BaseModel):
    food_id: str
    food_name: str
    selected_grams: float
    serving_label: Optional[str] = None
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    sodium_mg: float
