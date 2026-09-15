import "server-only";

import {
  VERIFIED_FOOD_CATALOG,
  type FoodItem,
  type FoodNutrition,
  type FoodSummary,
  type Serving,
} from "@/lib/api/foods";

const FATSECRET_TOKEN_URL = "https://oauth.fatsecret.com/connect/token";
const FATSECRET_API_URL = "https://platform.fatsecret.com/rest/server.api";
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1";

let fatSecretToken: { value: string; expiresAt: number } | undefined;

const numberValue = (value: unknown) => Number(value ?? 0) || 0;

function summary(food: FoodItem): FoodSummary {
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    source: food.source,
    brand: food.brand,
    default_unit: food.default_unit,
    calories_per_100g: food.nutrition.calories,
    protein_per_100g: food.nutrition.protein_g,
    carbs_per_100g: food.nutrition.carbs_g,
    fat_per_100g: food.nutrition.fat_g,
    fiber_per_100g: food.nutrition.fiber_g,
    servings_count: food.servings.length,
  };
}

function emptyNutrition(): FoodNutrition {
  return { basis_grams: 100, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 };
}

function nutrientsFromList(items: Array<Record<string, unknown>>): FoodNutrition {
  const nutrition = emptyNutrition();
  for (const item of items) {
    const name = String(item.nutrientName ?? (item.nutrient as Record<string, unknown> | undefined)?.name ?? "").toLowerCase();
    const unit = String(item.unitName ?? (item.nutrient as Record<string, unknown> | undefined)?.unitName ?? "").toUpperCase();
    const value = numberValue(item.value ?? item.amount);
    if (name.includes("energy") && unit === "KCAL") nutrition.calories = value;
    else if (name === "protein" && unit === "G") nutrition.protein_g = value;
    else if (name.includes("carbohydrate") && unit === "G") nutrition.carbs_g = value;
    else if ((name.includes("total lipid") || name === "fat") && unit === "G") nutrition.fat_g = value;
    else if (name.includes("fiber") && unit === "G") nutrition.fiber_g = value;
    else if (name.includes("sugars") && unit === "G") nutrition.sugar_g = value;
    else if (name.includes("sodium") && unit === "MG") nutrition.sodium_mg = value;
  }
  return nutrition;
}

async function getFatSecretToken(): Promise<string | null> {
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (fatSecretToken && fatSecretToken.expiresAt > Date.now() + 60_000) return fatSecretToken.value;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(FATSECRET_TOKEN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&scope=basic",
    cache: "no-store",
  });
  if (!response.ok) return null;
  const body = await response.json() as { access_token?: string; expires_in?: number };
  if (!body.access_token) return null;
  fatSecretToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 86_400) * 1000 };
  return body.access_token;
}

function fatSecretSummary(raw: Record<string, unknown>): FoodSummary {
  const description = String(raw.food_description ?? "");
  const find = (label: string) => numberValue(description.match(new RegExp(`${label}:\\s*([0-9.]+)`, "i"))?.[1]);
  return {
    id: `fs:${String(raw.food_id)}`,
    name: String(raw.food_name ?? "Unknown food"),
    category: String(raw.food_type ?? "Standard"),
    source: "FatSecret Platform",
    brand: raw.brand_name ? String(raw.brand_name) : null,
    default_unit: "portion",
    calories_per_100g: find("Calories"), protein_per_100g: find("Protein"), carbs_per_100g: find("Carbs"), fat_per_100g: find("Fat"), fiber_per_100g: 0, servings_count: 1,
  };
}

async function searchFatSecret(query: string, limit: number): Promise<FoodSummary[] | null> {
  const token = await getFatSecretToken();
  if (!token) return null;
  const params = new URLSearchParams({ method: "foods.search", search_expression: query, max_results: String(limit), format: "json" });
  const response = await fetch(`${FATSECRET_API_URL}?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) return null;
  const data = await response.json() as { foods?: { food?: Record<string, unknown> | Array<Record<string, unknown>> }; error?: unknown };
  if (data.error) return null;
  const foods = data.foods?.food;
  if (!foods) return [];
  return (Array.isArray(foods) ? foods : [foods]).map(fatSecretSummary);
}

async function searchUsda(query: string, limit: number): Promise<FoodSummary[]> {
  const key = process.env.USDA_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({ api_key: key, query, pageSize: String(limit) });
  const response = await fetch(`${USDA_API_URL}/foods/search?${params}`, { cache: "no-store" });
  if (!response.ok) return [];
  const data = await response.json() as { foods?: Array<Record<string, unknown>> };
  return (data.foods ?? []).map((food) => {
    const nutrition = nutrientsFromList((food.foodNutrients as Array<Record<string, unknown>>) ?? []);
    const name = String(food.description ?? "Unknown food");
    return { id: `usda:${food.fdcId}`, name: name === name.toUpperCase() ? name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : name, category: String(food.foodCategory ?? "General food"), source: "USDA FoodData Central", brand: food.brandOwner ? String(food.brandOwner) : food.brandName ? String(food.brandName) : null, default_unit: "portion", calories_per_100g: nutrition.calories, protein_per_100g: nutrition.protein_g, carbs_per_100g: nutrition.carbs_g, fat_per_100g: nutrition.fat_g, fiber_per_100g: nutrition.fiber_g, servings_count: 1 };
  });
}

export async function searchFoods(query: string, limit = 25): Promise<FoodSummary[]> {
  const cleaned = query.trim();
  if (!cleaned) return VERIFIED_FOOD_CATALOG.slice(0, limit).map(summary);
  try { const fatSecret = await searchFatSecret(cleaned, limit); if (fatSecret?.length) return fatSecret; } catch { /* USDA is the required fallback. */ }
  try { const usda = await searchUsda(cleaned, limit); if (usda.length) return usda; } catch { /* Use the checked-in verified development catalog. */ }
  const needle = cleaned.toLowerCase();
  return VERIFIED_FOOD_CATALOG.filter(food => food.name.toLowerCase().includes(needle) || food.category.toLowerCase().includes(needle)).slice(0, limit).map(summary);
}

export async function foodSuggestions(query: string, limit = 8): Promise<string[]> {
  const foods = await searchFoods(query, limit);
  return [...new Set(foods.map(food => food.name.split("(")[0].trim()))].slice(0, limit);
}

async function fatSecretDetail(id: string): Promise<FoodItem | null> {
  const token = await getFatSecretToken();
  if (!token) return null;
  const params = new URLSearchParams({ method: "food.get.v2", food_id: id, format: "json" });
  const response = await fetch(`${FATSECRET_API_URL}?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) return null;
  const data = await response.json() as { food?: Record<string, unknown> };
  const food = data.food;
  if (!food) return null;
  const rawServings = (food.servings as { serving?: Record<string, unknown> | Array<Record<string, unknown>> } | undefined)?.serving ?? [];
  const servingsRaw = Array.isArray(rawServings) ? rawServings : [rawServings];
  const servings: Serving[] = servingsRaw.map((serving, index) => ({ id: `fs-serving:${String(serving.serving_id ?? index)}`, label: String(serving.serving_description ?? "1 serving"), grams: numberValue(serving.metric_serving_amount) || 100, unit_type: String(serving.metric_serving_unit ?? "g"), quantity: 1 }));
  const basis = servingsRaw[0] ?? {};
  const grams = numberValue(basis.metric_serving_amount) || 100;
  const ratio = 100 / grams;
  const nutrition: FoodNutrition = { basis_grams: 100, calories: numberValue(basis.calories) * ratio, protein_g: numberValue(basis.protein) * ratio, carbs_g: numberValue(basis.carbohydrate) * ratio, fat_g: numberValue(basis.fat) * ratio, fiber_g: numberValue(basis.fiber) * ratio, sugar_g: numberValue(basis.sugar) * ratio, sodium_mg: numberValue(basis.sodium) * ratio };
  return { id: `fs:${id}`, name: String(food.food_name ?? "Unknown food"), category: String(food.food_type ?? "Standard"), source: "FatSecret Platform", external_id: `FS:${id}`, brand: food.brand_name ? String(food.brand_name) : null, default_unit: "portion", nutrition, servings: servings.length ? servings : [{ id: "fs-serving:100g", label: "100g portion", grams: 100, unit_type: "weight_g", quantity: 1 }] };
}

async function usdaDetail(id: string): Promise<FoodItem | null> {
  const key = process.env.USDA_API_KEY;
  if (!key) return null;
  const response = await fetch(`${USDA_API_URL}/food/${encodeURIComponent(id)}?${new URLSearchParams({ api_key: key })}`, { cache: "no-store" });
  if (!response.ok) return null;
  const food = await response.json() as Record<string, unknown>;
  const portions = (food.foodPortions as Array<Record<string, unknown>>) ?? [];
  const servings: Serving[] = portions.map((portion, index) => ({ id: `usda-serving:${String(portion.id ?? index)}`, label: `${String(portion.amount ?? 1)} ${String(portion.modifier ?? "serving")} (${Math.round(numberValue(portion.gramWeight))}g)`, grams: numberValue(portion.gramWeight), unit_type: "portion", quantity: numberValue(portion.amount) || 1 })).filter(serving => serving.grams > 0);
  if (!servings.some(serving => Math.abs(serving.grams - 100) < 1)) servings.push({ id: "usda-serving:100g", label: "100g portion", grams: 100, unit_type: "weight_g", quantity: 1 });
  return { id: `usda:${id}`, name: String(food.description ?? "Unknown food"), category: String((food.foodCategory as Record<string, unknown> | undefined)?.description ?? food.foodCategory ?? "General food"), source: "USDA FoodData Central", external_id: `FDC:${id}`, brand: food.brandOwner ? String(food.brandOwner) : food.brandName ? String(food.brandName) : null, default_unit: "portion", nutrition: nutrientsFromList((food.foodNutrients as Array<Record<string, unknown>>) ?? []), servings };
}

export async function getFoodDetail(id: string): Promise<FoodItem | null> {
  if (id.startsWith("fs:")) return fatSecretDetail(id.slice(3));
  if (id.startsWith("usda:")) return usdaDetail(id.slice(5));
  return VERIFIED_FOOD_CATALOG.find(food => food.id === id) ?? null;
}
