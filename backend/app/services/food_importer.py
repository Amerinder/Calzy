import json
import uuid
from pathlib import Path
from typing import Dict, List, Any, Optional

# Deterministic UUID namespace for Calzy food catalog
FOOD_CATALOG_NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")

VALID_SOURCES = {
    "USDA FoodData Central",
    "USDA SR Legacy",
    "ICMR-NIN IFCT 2017",
    "ICMR-NIN",
    "Open Food Facts",
}

class FoodNormalizationError(Exception):
    pass

class FoodImporter:
    """
    Repeatable, deterministic import and normalization engine for food catalog data.
    Enforces per-100g nutrition basis, validates authoritative source attribution,
    and guarantees idempotency through deterministic UUID generation.
    """

    @staticmethod
    def generate_food_id(external_id: str) -> str:
        """Derive a deterministic UUID from the authoritative external ID."""
        return str(uuid.uuid5(FOOD_CATALOG_NAMESPACE, f"food:{external_id}"))

    @staticmethod
    def generate_serving_id(food_id: str, label: str) -> str:
        """Derive a deterministic UUID for each serving portion."""
        return str(uuid.uuid5(FOOD_CATALOG_NAMESPACE, f"serving:{food_id}:{label}"))

    @classmethod
    def normalize_food_record(cls, raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate, normalize and assign deterministic IDs to a food record.
        Ensures strict 100g basis and verifies nutrition parameters.
        """
        # 1. Check required metadata
        for field in ["name", "category", "source", "external_id", "nutrition", "servings"]:
            if field not in raw:
                raise FoodNormalizationError(f"Missing required field: '{field}' in record: {raw.get('name', 'Unknown')}")

        source = raw["source"].strip()
        if not any(valid in source for valid in VALID_SOURCES):
            raise FoodNormalizationError(
                f"Invalid or non-authoritative source '{source}'. Must be one of: {VALID_SOURCES}"
            )

        external_id = raw["external_id"].strip()
        if not external_id:
            raise FoodNormalizationError("external_id cannot be empty")

        food_id = raw.get("id") or cls.generate_food_id(external_id)

        # 2. Normalize Nutrition (Strict 100g basis)
        nut = raw["nutrition"]
        basis_grams = float(nut.get("basis_grams", 100.0))
        if basis_grams <= 0:
            raise FoodNormalizationError(f"basis_grams must be > 0, got {basis_grams}")

        scale_factor = 100.0 / basis_grams if basis_grams != 100.0 else 1.0

        calories = round(float(nut["calories"]) * scale_factor, 1)
        protein_g = round(float(nut["protein_g"]) * scale_factor, 1)
        carbs_g = round(float(nut["carbs_g"]) * scale_factor, 1)
        fat_g = round(float(nut["fat_g"]) * scale_factor, 1)
        fiber_g = round(float(nut.get("fiber_g", 0.0)) * scale_factor, 1)
        sugar_g = round(float(nut.get("sugar_g", 0.0)) * scale_factor, 1)
        sodium_mg = round(float(nut.get("sodium_mg", 0.0)) * scale_factor, 1)

        # Sanity check non-negative
        for name, val in [("calories", calories), ("protein_g", protein_g), ("carbs_g", carbs_g), ("fat_g", fat_g)]:
            if val < 0:
                raise FoodNormalizationError(f"Nutrition value {name} cannot be negative: {val}")

        normalized_nutrition = {
            "basis_grams": 100.0,
            "calories": calories,
            "protein_g": protein_g,
            "carbs_g": carbs_g,
            "fat_g": fat_g,
            "fiber_g": fiber_g,
            "sugar_g": sugar_g,
            "sodium_mg": sodium_mg,
            "micronutrients": nut.get("micronutrients", {}),
        }

        # 3. Normalize Servings
        raw_servings = raw.get("servings", [])
        if not raw_servings:
            # Fallback to default 100g portion if no specific serving listed
            raw_servings = [{"label": "100g portion", "grams": 100.0, "unit_type": "portion", "quantity": 1.0}]

        normalized_servings = []
        serving_labels_seen = set()

        for s in raw_servings:
            label = s["label"].strip()
            if label in serving_labels_seen:
                continue
            serving_labels_seen.add(label)

            grams = float(s["grams"])
            if grams <= 0:
                raise FoodNormalizationError(f"Serving grams must be > 0 for serving '{label}'")

            unit_type = s.get("unit_type", "portion").strip()
            quantity = float(s.get("quantity", 1.0))
            serving_id = s.get("id") or cls.generate_serving_id(food_id, label)

            normalized_servings.append({
                "id": serving_id,
                "label": label,
                "grams": grams,
                "unit_type": unit_type,
                "quantity": quantity,
            })

        # Ensure a standard 100g portion option exists if not already present
        if not any(abs(s["grams"] - 100.0) < 0.001 for s in normalized_servings):
            normalized_servings.append({
                "id": cls.generate_serving_id(food_id, "100g portion"),
                "label": "100g portion",
                "grams": 100.0,
                "unit_type": "weight_g",
                "quantity": 1.0,
            })

        return {
            "id": food_id,
            "name": raw["name"].strip(),
            "category": raw["category"].strip(),
            "source": source,
            "external_id": external_id,
            "brand": raw.get("brand"),
            "default_unit": raw.get("default_unit", "portion"),
            "nutrition": normalized_nutrition,
            "servings": normalized_servings,
        }

    @classmethod
    def load_and_normalize_dataset(cls, file_path: Path) -> List[Dict[str, Any]]:
        """Load and normalize a JSON dataset of foods with duplicate protection."""
        if not file_path.exists():
            raise FileNotFoundError(f"Dataset file not found: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        if not isinstance(raw_data, list):
            raise FoodNormalizationError("Dataset root must be a list of food objects")

        seen_external_ids = set()
        normalized_foods = []

        for item in raw_data:
            normalized = cls.normalize_food_record(item)
            ext_id = normalized["external_id"]

            if ext_id in seen_external_ids:
                # Deduplicate: Skip already processed external ID
                continue

            seen_external_ids.add(ext_id)
            normalized_foods.append(normalized)

        return normalized_foods
