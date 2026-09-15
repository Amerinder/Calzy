import time
import re
import logging
from typing import Dict, List, Optional, Any
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class FatSecretService:
    """
    Client for the FatSecret Platform API (OAuth 2.0).
    Provides autocomplete suggestions, food search, and nutrition details.
    """
    TOKEN_URL = "https://oauth.fatsecret.com/connect/token"
    API_URL = "https://platform.fatsecret.com/rest/server.api"

    _access_token: Optional[str] = None
    _token_expires_at: float = 0.0

    @classmethod
    def is_configured(cls) -> bool:
        return bool(settings.FATSECRET_CLIENT_ID and settings.FATSECRET_CLIENT_SECRET)

    @classmethod
    def get_access_token(cls) -> Optional[str]:
        """Retrieve cached access token or fetch a new one via client_credentials grant."""
        if not cls.is_configured():
            return None

        # Return cached token if valid for at least 60 more seconds
        if cls._access_token and time.time() < cls._token_expires_at - 60:
            return cls._access_token

        try:
            res = httpx.post(
                cls.TOKEN_URL,
                data={"grant_type": "client_credentials", "scope": "basic"},
                auth=(settings.FATSECRET_CLIENT_ID, settings.FATSECRET_CLIENT_SECRET),
                timeout=8.0,
            )
            if res.status_code == 200:
                data = res.json()
                cls._access_token = data.get("access_token")
                expires_in = data.get("expires_in", 86400)
                cls._token_expires_at = time.time() + float(expires_in)
                return cls._access_token
            else:
                logger.warning(f"FatSecret token error {res.status_code}: {res.text}")
                return None
        except Exception as e:
            logger.error(f"Failed to obtain FatSecret access token: {e}")
            return None

    @classmethod
    def autocomplete(cls, expression: str) -> List[str]:
        """
        Get real-time food name suggestions using foods.autocomplete method.
        """
        token = cls.get_access_token()
        if not token or not expression.strip():
            return []

        try:
            res = httpx.get(
                cls.API_URL,
                params={
                    "method": "foods.autocomplete",
                    "expression": expression.strip(),
                    "format": "json",
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0,
            )
            if res.status_code != 200:
                return []

            data = res.json()
            if "error" in data:
                # If premier scope is missing, derive live suggestions from search results
                quick_matches = cls.search_foods(expression.strip(), max_results=6)
                if quick_matches:
                    names = []
                    seen = set()
                    for item in quick_matches:
                        clean = item["name"].strip()
                        if clean.lower() not in seen:
                            seen.add(clean.lower())
                            names.append(clean)
                    return names
                return []

            suggestions_data = data.get("suggestions", {}).get("suggestion", [])
            if isinstance(suggestions_data, str):
                return [suggestions_data]
            elif isinstance(suggestions_data, list):
                return [str(s) for s in suggestions_data if s]
            return []
        except Exception as e:
            logger.warning(f"FatSecret autocomplete request failed: {e}")
            # Fallback to search foods
            quick = cls.search_foods(expression.strip(), max_results=6)
            return [q["name"] for q in (quick or [])]

    @classmethod
    def _parse_food_description(cls, desc: str) -> Dict[str, float]:
        """
        Parse nutrients from FatSecret food_description string, e.g.:
        'Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g'
        """
        nutrients = {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0}
        if not desc:
            return nutrients

        cal_match = re.search(r"Calories:\s*([0-9.]+)", desc)
        if cal_match:
            nutrients["calories"] = float(cal_match.group(1))

        fat_match = re.search(r"Fat:\s*([0-9.]+)", desc)
        if fat_match:
            nutrients["fat_g"] = float(fat_match.group(1))

        carbs_match = re.search(r"Carbs:\s*([0-9.]+)", desc)
        if carbs_match:
            nutrients["carbs_g"] = float(carbs_match.group(1))

        prot_match = re.search(r"Protein:\s*([0-9.]+)", desc)
        if prot_match:
            nutrients["protein_g"] = float(prot_match.group(1))

        return nutrients

    @classmethod
    def search_foods(cls, query: str, max_results: int = 20) -> Optional[List[Dict[str, Any]]]:
        """
        Search foods via FatSecret foods.search.
        Returns normalized list of foods, or None if error/IP blocked so fallback can trigger.
        """
        token = cls.get_access_token()
        if not token or not query.strip():
            return None

        try:
            res = httpx.get(
                cls.API_URL,
                params={
                    "method": "foods.search",
                    "search_expression": query.strip(),
                    "max_results": max_results,
                    "format": "json",
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=6.0,
            )
            if res.status_code != 200:
                return None

            data = res.json()
            if "error" in data:
                logger.warning(f"FatSecret search error: {data['error']}")
                return None

            foods_container = data.get("foods", {})
            raw_foods = foods_container.get("food", [])
            if isinstance(raw_foods, dict):
                raw_foods = [raw_foods]

            if not raw_foods:
                return []

            results = []
            for item in raw_foods:
                food_id = f"fs:{item.get('food_id')}"
                name = item.get("food_name", "Unknown Food")
                brand = item.get("brand_name")
                desc = item.get("food_description", "")
                parsed = cls._parse_food_description(desc)

                results.append({
                    "id": food_id,
                    "name": name,
                    "category": item.get("food_type", "Standard"),
                    "source": "FatSecret Platform",
                    "brand": brand,
                    "default_unit": "portion",
                    "calories_per_100g": parsed["calories"],
                    "protein_per_100g": parsed["protein_g"],
                    "carbs_per_100g": parsed["carbs_g"],
                    "fat_per_100g": parsed["fat_g"],
                    "fiber_per_100g": 0.0,
                    "servings_count": 1,
                })
            return results
        except Exception as e:
            logger.warning(f"FatSecret search failed: {e}")
            return None

    @classmethod
    def get_food_detail(cls, raw_food_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve complete food detail with servings from FatSecret food.get.v2.
        """
        clean_id = raw_food_id.replace("fs:", "")
        token = cls.get_access_token()
        if not token:
            return None

        try:
            res = httpx.get(
                cls.API_URL,
                params={
                    "method": "food.get.v2",
                    "food_id": clean_id,
                    "format": "json",
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=6.0,
            )
            if res.status_code != 200:
                return None

            data = res.json()
            if "error" in data:
                return None

            food_data = data.get("food", {})
            servings_data = food_data.get("servings", {}).get("serving", [])
            if isinstance(servings_data, dict):
                servings_data = [servings_data]

            servings = []
            basis_nut = None

            for s in servings_data:
                desc = s.get("serving_description", "1 serving")
                metric_amount = float(s.get("metric_serving_amount", 100.0) or 100.0)
                metric_unit = s.get("metric_serving_unit", "g")
                cal = float(s.get("calories", 0.0) or 0.0)
                prot = float(s.get("protein", 0.0) or 0.0)
                carbs = float(s.get("carbohydrate", 0.0) or 0.0)
                fat = float(s.get("fat", 0.0) or 0.0)
                fiber = float(s.get("fiber", 0.0) or 0.0)
                sugar = float(s.get("sugar", 0.0) or 0.0)
                sodium = float(s.get("sodium", 0.0) or 0.0)

                servings.append({
                    "id": f"fs_srv_{s.get('serving_id', len(servings))}",
                    "label": f"{desc} ({round(metric_amount)}g)" if "g" not in desc else desc,
                    "grams": metric_amount,
                    "unit_type": metric_unit,
                    "quantity": 1.0,
                })

                # Check if this serving is 100g or use the first one to derive 100g
                if abs(metric_amount - 100.0) < 1.0 or basis_nut is None:
                    scale = 100.0 / metric_amount if metric_amount > 0 else 1.0
                    basis_nut = {
                        "basis_grams": 100.0,
                        "calories": round(cal * scale, 1),
                        "protein_g": round(prot * scale, 1),
                        "carbs_g": round(carbs * scale, 1),
                        "fat_g": round(fat * scale, 1),
                        "fiber_g": round(fiber * scale, 1),
                        "sugar_g": round(sugar * scale, 1),
                        "sodium_mg": round(sodium * scale, 1),
                        "micronutrients": {},
                    }

            if not basis_nut:
                basis_nut = {
                    "basis_grams": 100.0,
                    "calories": 0.0,
                    "protein_g": 0.0,
                    "carbs_g": 0.0,
                    "fat_g": 0.0,
                    "fiber_g": 0.0,
                    "sugar_g": 0.0,
                    "sodium_mg": 0.0,
                    "micronutrients": {},
                }

            return {
                "id": f"fs:{clean_id}",
                "name": food_data.get("food_name", "Unknown"),
                "category": food_data.get("food_type", "Standard"),
                "source": "FatSecret Platform",
                "external_id": f"FS:{clean_id}",
                "brand": food_data.get("brand_name"),
                "default_unit": "portion",
                "nutrition": basis_nut,
                "servings": servings,
            }
        except Exception as e:
            logger.warning(f"FatSecret food.get failed: {e}")
            return None
