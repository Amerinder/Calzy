from pathlib import Path
from typing import Dict, List, Optional, Any
from app.services.food_importer import FoodImporter
from app.schemas.food import FoodItemSchema, FoodSummarySchema, ScaledNutritionResponse
from app.services.fatsecret_service import FatSecretService
from app.services.usda_service import USDAService

SEED_DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "seed_foods.json"

class FoodCatalogService:
    """
    Catalog querying, multi-tier search (FatSecret -> USDA -> Local),
    autocomplete suggestions, and nutrition scaling service.
    """
    _foods_by_id: Dict[str, Dict[str, Any]] = {}
    _foods_by_external_id: Dict[str, Dict[str, Any]] = {}
    _initialized: bool = False

    @classmethod
    def initialize(cls, dataset_path: Optional[Path] = None) -> None:
        """Load catalog from verified seed file if not already initialized."""
        target_path = dataset_path or SEED_DATA_PATH
        normalized_foods = FoodImporter.load_and_normalize_dataset(target_path)
        cls._foods_by_id = {food["id"]: food for food in normalized_foods}
        cls._foods_by_external_id = {food["external_id"]: food for food in normalized_foods}
        cls._initialized = True

    @classmethod
    def ensure_initialized(cls) -> None:
        if not cls._initialized:
            cls.initialize()

    @classmethod
    def get_all_foods(cls) -> List[Dict[str, Any]]:
        cls.ensure_initialized()
        return list(cls._foods_by_id.values())

    @classmethod
    def get_food_by_id(cls, food_id: str) -> Optional[Dict[str, Any]]:
        cls.ensure_initialized()
        return cls._foods_by_id.get(food_id)

    @classmethod
    def get_food_by_external_id(cls, external_id: str) -> Optional[Dict[str, Any]]:
        cls.ensure_initialized()
        return cls._foods_by_external_id.get(external_id)

    @classmethod
    def get_categories(cls) -> List[str]:
        cls.ensure_initialized()
        categories = set(food["category"] for food in cls._foods_by_id.values())
        return sorted(list(categories))

    @classmethod
    def get_suggestions(cls, query: str, limit: int = 8) -> List[str]:
        """
        Multi-tier live suggestions while typing:
        1. FatSecret foods.autocomplete
        2. USDA FoodData Central search suggestions
        3. Local verified food catalog name match
        """
        q_clean = query.strip()
        if not q_clean:
            return []

        suggestions: List[str] = []
        seen = set()

        # 1. Try FatSecret autocomplete
        fs_suggestions = FatSecretService.autocomplete(q_clean)
        for s in fs_suggestions:
            if s.lower() not in seen:
                seen.add(s.lower())
                suggestions.append(s)

        # 2. If fewer than desired, fetch from USDA
        if len(suggestions) < limit:
            usda_suggestions = USDAService.get_suggestions(q_clean, limit=limit)
            for s in usda_suggestions:
                if s.lower() not in seen:
                    seen.add(s.lower())
                    suggestions.append(s)

        # 3. If still fewer, pull from local catalog
        if len(suggestions) < limit:
            cls.ensure_initialized()
            for f in cls._foods_by_id.values():
                if q_clean.lower() in f["name"].lower():
                    name_clean = f["name"].split("(")[0].strip()
                    if name_clean.lower() not in seen:
                        seen.add(name_clean.lower())
                        suggestions.append(name_clean)

        return suggestions[:limit]

    @classmethod
    def search_foods(
        cls,
        query: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 20,
    ) -> List[FoodSummarySchema]:
        """Search local verified foods with optional name substring and category filtering."""
        cls.ensure_initialized()
        results = []
        q_clean = query.strip().lower() if query else ""
        cat_clean = category.strip().lower() if category else ""

        for food in cls._foods_by_id.values():
            if cat_clean and food["category"].lower() != cat_clean:
                continue

            if q_clean:
                food_name = food["name"].lower()
                if q_clean not in food_name and q_clean not in food["category"].lower():
                    continue

            nut = food["nutrition"]
            summary = FoodSummarySchema(
                id=food["id"],
                name=food["name"],
                category=food["category"],
                source=food["source"],
                brand=food.get("brand"),
                default_unit=food.get("default_unit", "portion"),
                calories_per_100g=nut["calories"],
                protein_per_100g=nut["protein_g"],
                carbs_per_100g=nut["carbs_g"],
                fat_per_100g=nut["fat_g"],
                fiber_per_100g=nut["fiber_g"],
                servings_count=len(food.get("servings", [])),
            )
            results.append(summary)

        if q_clean:
            results.sort(key=lambda s: (0 if s.name.lower().startswith(q_clean) else 1, s.name))
        else:
            results.sort(key=lambda s: s.name)

        return results[:limit]

    @classmethod
    def search_foods_multi_tier(
        cls,
        query: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 20,
    ) -> List[FoodSummarySchema]:
        """
        Multi-tier search:
        1. FatSecret foods.search
        2. USDA FoodData Central search fallback
        3. Local verified database catalog fallback
        """
        q_clean = (query or "").strip()
        if not q_clean:
            # When no query, return local verified catalog
            return cls.search_foods(query=None, category=category, limit=limit)

        # 1. Try FatSecret
        fs_results = FatSecretService.search_foods(q_clean, max_results=limit)
        if fs_results is not None and len(fs_results) > 0:
            return [FoodSummarySchema(**item) for item in fs_results[:limit]]

        # 2. Fallback to USDA FoodData Central
        usda_results = USDAService.search_foods(q_clean, limit=limit)
        if usda_results and len(usda_results) > 0:
            return [FoodSummarySchema(**item) for item in usda_results[:limit]]

        # 3. Fallback to local catalog
        return cls.search_foods(query=q_clean, category=category, limit=limit)

    @classmethod
    def get_food_detail_multi_tier(cls, food_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve food detail by ID routing across FatSecret, USDA, or local catalog."""
        if food_id.startswith("fs:"):
            return FatSecretService.get_food_detail(food_id)
        elif food_id.startswith("usda:"):
            return USDAService.get_food_detail(food_id)
        else:
            return cls.get_food_by_id(food_id)

    @classmethod
    def scale_nutrition(
        cls,
        food_id: str,
        grams: float,
        serving_label: Optional[str] = None,
    ) -> ScaledNutritionResponse:
        """
        Calculates exact scaled nutrition for a given gram weight:
        scaled = nutrient_per_100g * (grams / 100.0)
        """
        cls.ensure_initialized()
        food = cls.get_food_detail_multi_tier(food_id)
        if not food:
            raise ValueError(f"Food item with id '{food_id}' not found")

        if grams <= 0:
            raise ValueError("Grams must be greater than zero")

        nut = food["nutrition"]
        ratio = grams / 100.0

        return ScaledNutritionResponse(
            food_id=food["id"],
            food_name=food["name"],
            selected_grams=round(grams, 2),
            serving_label=serving_label,
            calories=round(nut["calories"] * ratio, 1),
            protein_g=round(nut["protein_g"] * ratio, 1),
            carbs_g=round(nut["carbs_g"] * ratio, 1),
            fat_g=round(nut["fat_g"] * ratio, 1),
            fiber_g=round(nut["fiber_g"] * ratio, 1),
            sugar_g=round(nut.get("sugar_g", 0.0) * ratio, 1),
            sodium_mg=round(nut.get("sodium_mg", 0.0) * ratio, 1),
        )
