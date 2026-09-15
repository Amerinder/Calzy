import logging
from typing import Dict, List, Optional, Any
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class USDAService:
    """
    Client for USDA FoodData Central (FDC) API.
    Provides verified food search, nutrient breakdown, and portion extraction.
    """
    BASE_URL = "https://api.nal.usda.gov/fdc/v1"

    @classmethod
    def is_configured(cls) -> bool:
        return bool(settings.USDA_API_KEY and settings.USDA_API_KEY.strip())

    @classmethod
    def _extract_nutrients(cls, food_nutrients: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Extract standard macronutrients and calories per 100g from USDA nutrient list.
        """
        nutrients = {
            "calories": 0.0,
            "protein_g": 0.0,
            "carbs_g": 0.0,
            "fat_g": 0.0,
            "fiber_g": 0.0,
            "sugar_g": 0.0,
            "sodium_mg": 0.0,
        }

        for n in food_nutrients:
            name = (n.get("nutrientName") or n.get("nutrient", {}).get("name") or "").lower()
            unit = (n.get("unitName") or n.get("nutrient", {}).get("unitName") or "").upper()
            val = float(n.get("value") or n.get("amount") or 0.0)

            if "energy" in name and unit == "KCAL":
                nutrients["calories"] = round(val, 1)
            elif "protein" in name and unit == "G":
                nutrients["protein_g"] = round(val, 1)
            elif "carbohydrate" in name and unit == "G":
                nutrients["carbs_g"] = round(val, 1)
            elif ("total lipid" in name or name == "fat") and unit == "G":
                nutrients["fat_g"] = round(val, 1)
            elif "fiber" in name and unit == "G":
                nutrients["fiber_g"] = round(val, 1)
            elif "sugars" in name and unit == "G":
                nutrients["sugar_g"] = round(val, 1)
            elif "sodium" in name and unit == "MG":
                nutrients["sodium_mg"] = round(val, 1)

        return nutrients

    @classmethod
    def search_foods(cls, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Search foods through USDA FoodData Central.
        """
        if not cls.is_configured() or not query.strip():
            return []

        try:
            res = httpx.get(
                f"{cls.BASE_URL}/foods/search",
                params={
                    "api_key": settings.USDA_API_KEY,
                    "query": query.strip(),
                    "pageSize": limit,
                },
                timeout=7.0,
            )
            if res.status_code != 200:
                logger.warning(f"USDA search error {res.status_code}: {res.text}")
                return []

            data = res.json()
            raw_foods = data.get("foods", [])
            results = []

            for item in raw_foods:
                fdc_id = item.get("fdcId")
                desc = item.get("description", "Unknown Food")
                # Format name nicely (title case if all uppercase)
                formatted_name = desc.title() if desc.isupper() else desc
                brand = item.get("brandOwner") or item.get("brandName")
                cat = item.get("foodCategory", "General Food")

                nut = cls._extract_nutrients(item.get("foodNutrients", []))

                results.append({
                    "id": f"usda:{fdc_id}",
                    "name": formatted_name,
                    "category": cat,
                    "source": "USDA FoodData Central",
                    "brand": brand,
                    "default_unit": "portion",
                    "calories_per_100g": nut["calories"],
                    "protein_per_100g": nut["protein_g"],
                    "carbs_per_100g": nut["carbs_g"],
                    "fat_per_100g": nut["fat_g"],
                    "fiber_per_100g": nut["fiber_g"],
                    "servings_count": len(item.get("foodMeasures", [])) or 1,
                })

            return results
        except Exception as e:
            logger.warning(f"USDA search failed: {e}")
            return []

    @classmethod
    def get_suggestions(cls, query: str, limit: int = 6) -> List[str]:
        """
        Extract clean autocomplete suggestions from USDA top search matches.
        """
        if not cls.is_configured() or not query.strip():
            return []

        try:
            res = httpx.get(
                f"{cls.BASE_URL}/foods/search",
                params={
                    "api_key": settings.USDA_API_KEY,
                    "query": query.strip(),
                    "pageSize": limit,
                },
                timeout=5.0,
            )
            if res.status_code != 200:
                return []

            data = res.json()
            raw_foods = data.get("foods", [])
            suggestions = []
            seen = set()

            for item in raw_foods:
                desc = item.get("description", "").strip()
                if not desc:
                    continue
                # Clean up descriptor: take main title before comma if long
                clean_name = desc.title() if desc.isupper() else desc
                simplified = clean_name.split(",")[0].strip()
                if simplified.lower() not in seen:
                    seen.add(simplified.lower())
                    suggestions.append(simplified)

            return suggestions[:limit]
        except Exception as e:
            logger.warning(f"USDA suggestions failed: {e}")
            return []

    @classmethod
    def get_food_detail(cls, raw_food_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch food detail with portions from USDA FoodData Central.
        """
        clean_id = raw_food_id.replace("usda:", "")
        if not cls.is_configured():
            return None

        try:
            res = httpx.get(
                f"{cls.BASE_URL}/food/{clean_id}",
                params={"api_key": settings.USDA_API_KEY},
                timeout=7.0,
            )
            if res.status_code != 200:
                return None

            item = res.json()
            desc = item.get("description", "Unknown Food")
            formatted_name = desc.title() if desc.isupper() else desc
            brand = item.get("brandOwner") or item.get("brandName")
            cat = item.get("foodCategory", {}).get("description") if isinstance(item.get("foodCategory"), dict) else item.get("foodCategory", "General Food")

            nut = cls._extract_nutrients(item.get("foodNutrients", []))

            # Parse portions
            servings = []
            portions = item.get("foodPortions", []) or item.get("foodMeasures", [])

            for p in portions:
                gram_weight = float(p.get("gramWeight") or p.get("gram_weight") or 0.0)
                if gram_weight <= 0:
                    continue

                modifier = p.get("modifier") or p.get("disseminationText") or p.get("portionDescription") or ""
                amount = p.get("amount") or 1.0
                label = f"{amount} {modifier} ({round(gram_weight)}g)".strip() if modifier else f"Serving ({round(gram_weight)}g)"

                servings.append({
                    "id": f"usda_srv_{p.get('id', len(servings))}",
                    "label": label,
                    "grams": round(gram_weight, 1),
                    "unit_type": "portion",
                    "quantity": float(amount) if amount else 1.0,
                })

            # Ensure 100g portion exists
            if not any(abs(s["grams"] - 100.0) < 1.0 for s in servings):
                servings.append({
                    "id": f"usda_srv_100g",
                    "label": "100g portion",
                    "grams": 100.0,
                    "unit_type": "weight_g",
                    "quantity": 1.0,
                })

            return {
                "id": f"usda:{clean_id}",
                "name": formatted_name,
                "category": cat,
                "source": "USDA FoodData Central",
                "external_id": f"FDC:{clean_id}",
                "brand": brand,
                "default_unit": "portion",
                "nutrition": {
                    "basis_grams": 100.0,
                    "calories": nut["calories"],
                    "protein_g": nut["protein_g"],
                    "carbs_g": nut["carbs_g"],
                    "fat_g": nut["fat_g"],
                    "fiber_g": nut["fiber_g"],
                    "sugar_g": nut["sugar_g"],
                    "sodium_mg": nut["sodium_mg"],
                    "micronutrients": {},
                },
                "servings": servings,
            }
        except Exception as e:
            logger.warning(f"USDA get_food_detail failed: {e}")
            return None
