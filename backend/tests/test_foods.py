import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.food_importer import FoodImporter, FoodNormalizationError
from app.services.food_catalog import FoodCatalogService

client = TestClient(app)

@pytest.fixture(autouse=True)
def init_catalog():
    FoodCatalogService.initialize()

# =============================================================================
# 1. FoodImporter & Normalization Unit Tests
# =============================================================================

def test_importer_deterministic_food_id():
    """Verify that deterministic UUID generation is stable across runs."""
    id1 = FoodImporter.generate_food_id("FDC:171077")
    id2 = FoodImporter.generate_food_id("FDC:171077")
    id3 = FoodImporter.generate_food_id("IFCT:B005")
    assert id1 == id2
    assert id1 != id3
    assert len(id1) == 36

def test_importer_normalizes_to_100g_basis():
    """Verify that foods stored with basis other than 100g are scaled to 100g."""
    raw_food = {
        "name": "Test Whey Protein",
        "category": "Supplements",
        "source": "USDA FoodData Central",
        "external_id": "TEST:WHEY_01",
        "nutrition": {
            "basis_grams": 30.0, # 30g scoop
            "calories": 120.0,
            "protein_g": 24.0,
            "carbs_g": 2.0,
            "fat_g": 1.5,
            "fiber_g": 0.0,
            "sugar_g": 1.0,
            "sodium_mg": 50.0,
        },
        "servings": [
            {"label": "1 scoop (30g)", "grams": 30.0, "unit_type": "scoop", "quantity": 1.0}
        ]
    }
    normalized = FoodImporter.normalize_food_record(raw_food)
    nut = normalized["nutrition"]
    assert nut["basis_grams"] == 100.0
    # 120 * (100 / 30) = 400.0 kcal
    assert nut["calories"] == 400.0
    # 24 * (100 / 30) = 80.0g protein
    assert nut["protein_g"] == 80.0
    # Servings must have preserved the 30g scoop AND added a standard 100g portion
    assert len(normalized["servings"]) >= 2
    assert any(s["label"] == "1 scoop (30g)" for s in normalized["servings"])
    assert any(abs(s["grams"] - 100.0) < 0.001 for s in normalized["servings"])

def test_importer_rejects_unauthorized_source():
    """Verify that unofficial or unverified sources are rejected."""
    invalid_food = {
        "name": "Random Blog Snack",
        "category": "Snacks",
        "source": "Random Lifestyle Blog",
        "external_id": "BLOG:001",
        "nutrition": {
            "basis_grams": 100.0,
            "calories": 250.0,
            "protein_g": 5.0,
            "carbs_g": 30.0,
            "fat_g": 10.0,
        },
        "servings": []
    }
    with pytest.raises(FoodNormalizationError, match="Invalid or non-authoritative source"):
        FoodImporter.normalize_food_record(invalid_food)

def test_importer_rejects_negative_nutrients():
    """Verify that negative nutrient amounts trigger a validation error."""
    bad_food = {
        "name": "Corrupted Food",
        "category": "Grains",
        "source": "USDA FoodData Central",
        "external_id": "TEST:CORRUPT",
        "nutrition": {
            "basis_grams": 100.0,
            "calories": -50.0,
            "protein_g": 10.0,
            "carbs_g": 20.0,
            "fat_g": 5.0,
        },
        "servings": []
    }
    with pytest.raises(FoodNormalizationError, match="cannot be negative"):
        FoodImporter.normalize_food_record(bad_food)

# =============================================================================
# 2. FoodCatalogService Unit Tests
# =============================================================================

def test_catalog_search_by_name():
    """Test searching for specific foods like 'roti' and 'chicken'."""
    results = FoodCatalogService.search_foods(query="roti")
    assert len(results) >= 1
    assert any("roti" in r.name.lower() for r in results)

    results_chicken = FoodCatalogService.search_foods(query="chicken")
    assert len(results_chicken) >= 1
    assert "chicken breast" in results_chicken[0].name.lower()

def test_catalog_search_by_category():
    """Test filtering catalog by category."""
    breads = FoodCatalogService.search_foods(category="Indian Breads")
    assert len(breads) >= 1
    assert all(b.category == "Indian Breads" for b in breads)

def test_catalog_category_listing():
    """Test listing distinct categories in catalog."""
    categories = FoodCatalogService.get_categories()
    assert "Indian Breads" in categories
    assert "Dairy & Eggs" in categories
    assert "Poultry & Meat" in categories
    assert "Lentils & Legumes" in categories

def test_catalog_portion_scaling():
    """
    Verify exact mathematical scaling from 100g basis:
    Roti (100g = 297 kcal, 9.4g P, 61.2g C, 1.7g F)
    1 medium roti = 35g => 104.0 kcal, 3.3g P, 21.4g C, 0.6g F
    """
    roti = FoodCatalogService.get_food_by_external_id("IFCT:B005")
    assert roti is not None

    scaled_35g = FoodCatalogService.scale_nutrition(
        food_id=roti["id"],
        grams=35.0,
        serving_label="1 medium roti (35g)"
    )
    assert scaled_35g.selected_grams == 35.0
    assert scaled_35g.calories == 103.9
    assert scaled_35g.protein_g == 3.3
    assert scaled_35g.carbs_g == 21.4
    assert scaled_35g.fat_g == 0.6

def test_catalog_portion_scaling_egg():
    """
    Verify egg scaling:
    100g = 143 kcal, 12.6g P
    1 large egg = 50g => 71.5 kcal, 6.3g P
    """
    egg = FoodCatalogService.get_food_by_external_id("FDC:171287")
    assert egg is not None

    scaled_50g = FoodCatalogService.scale_nutrition(
        food_id=egg["id"],
        grams=50.0,
        serving_label="1 large egg (50g)"
    )
    assert scaled_50g.calories == 71.5
    assert scaled_50g.protein_g == 6.3

# =============================================================================
# 3. FastAPI REST Endpoint Tests
# =============================================================================

def test_api_food_search():
    """GET /api/v1/foods/search?q=paneer"""
    resp = client.get("/api/v1/foods/search", params={"q": "paneer"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert "paneer" in data["items"][0]["name"].lower()
    assert data["items"][0]["protein_per_100g"] > 0
    assert data["items"][0]["source"] in ["USDA FoodData Central", "FatSecret Platform", "ICMR-NIN IFCT 2017"]

def test_api_food_categories():
    """GET /api/v1/foods/categories"""
    resp = client.get("/api/v1/foods/categories")
    assert resp.status_code == 200
    cats = resp.json()
    assert isinstance(cats, list)
    assert len(cats) >= 5
    assert "Grains & Cereals" in cats

def test_api_food_detail_success():
    """GET /api/v1/foods/{food_id}"""
    roti = FoodCatalogService.get_food_by_external_id("IFCT:B005")
    assert roti is not None
    resp = client.get(f"/api/v1/foods/{roti['id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == roti["name"]
    assert data["source"] == "ICMR-NIN IFCT 2017"
    assert len(data["servings"]) >= 3
    assert data["nutrition"]["calories"] == 297.0

def test_api_food_detail_not_found():
    """GET /api/v1/foods/{invalid_id} returns 404"""
    resp = client.get("/api/v1/foods/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404
    assert "was not found" in resp.json()["detail"]

def test_api_food_scaling_endpoint():
    """GET /api/v1/foods/{food_id}/scale?grams=200"""
    dal = FoodCatalogService.get_food_by_external_id("IFCT:B033")
    assert dal is not None
    # Yellow Moong Dal: 100g = 105 kcal, 7.1g P. 200g = 210 kcal, 14.2g P
    resp = client.get(f"/api/v1/foods/{dal['id']}/scale", params={"grams": 200.0})
    assert resp.status_code == 200
    scaled = resp.json()
    assert scaled["selected_grams"] == 200.0
    assert scaled["calories"] == 210.0
    assert scaled["protein_g"] == 14.2

def test_api_food_suggestions():
    """GET /api/v1/foods/suggestions?q=rot"""
    resp = client.get("/api/v1/foods/suggestions", params={"q": "rot"})
    assert resp.status_code == 200
    suggestions = resp.json()
    assert isinstance(suggestions, list)
    assert len(suggestions) >= 1
    assert any("roti" in s.lower() for s in suggestions)

def test_usda_search_service():
    """Verify USDA FoodData Central search service returns normalized items."""
    from app.services.usda_service import USDAService
    results = USDAService.search_foods("chicken breast", limit=3)
    assert len(results) >= 1
    first = results[0]
    assert first["id"].startswith("usda:")
    assert "chicken" in first["name"].lower()
    assert first["source"] == "USDA FoodData Central"
    assert first["calories_per_100g"] > 0

