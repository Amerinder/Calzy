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
  const micros: Record<string, number> = {};

  for (const item of items) {
    const name = String(
      item.nutrientName ??
        (item.nutrient as Record<string, unknown> | undefined)?.name ??
        item.name ??
        ""
    ).toLowerCase();
    const number = String(
      item.nutrientNumber ??
        (item.nutrient as Record<string, unknown> | undefined)?.number ??
        item.number ??
        ""
    );
    const unit = String(
      item.unitName ??
        (item.nutrient as Record<string, unknown> | undefined)?.unitName ??
        ""
    ).toUpperCase();
    const value = numberValue(item.value ?? item.amount);

    if (number === "208" || (name.includes("energy") && (unit === "KCAL" || !unit))) {
      if (value > 0) nutrition.calories = value;
    } else if (number === "203" || name === "protein") {
      nutrition.protein_g = value;
    } else if (number === "205" || name.includes("carbohydrate")) {
      nutrition.carbs_g = value;
    } else if (number === "204" || name.includes("total lipid") || name === "fat") {
      nutrition.fat_g = value;
    } else if (number === "291" || name.includes("fiber")) {
      nutrition.fiber_g = value;
    } else if (number === "269" || name.includes("sugar")) {
      nutrition.sugar_g = value;
    } else if (number === "307" || name.includes("sodium")) {
      nutrition.sodium_mg = value;
    } else if (number === "306" || name.includes("potassium")) {
      micros.potassium_mg = value;
    } else if (number === "301" || name.includes("calcium")) {
      micros.calcium_mg = value;
    } else if (number === "303" || name.includes("iron")) {
      micros.iron_mg = value;
    }
  }

  if (Object.keys(micros).length > 0) {
    nutrition.micronutrients = micros;
  }

  // Fallback: If calories are still 0 but macros are present, compute using 4-4-9 Atwater system
  if (nutrition.calories === 0 && (nutrition.protein_g > 0 || nutrition.carbs_g > 0 || nutrition.fat_g > 0)) {
    nutrition.calories = Math.round(nutrition.protein_g * 4 + nutrition.carbs_g * 4 + nutrition.fat_g * 9);
  }

  return nutrition;
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = 2800
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getFatSecretToken(): Promise<string | null> {
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (fatSecretToken && fatSecretToken.expiresAt > Date.now() + 60_000) return fatSecretToken.value;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  try {
    const response = await fetchWithTimeout(FATSECRET_TOKEN_URL, {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials&scope=basic",
      cache: "no-store",
    }, 2500);
    if (!response.ok) return null;
    const body = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!body.access_token) return null;
    fatSecretToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 86_400) * 1000 };
    return body.access_token;
  } catch {
    return null;
  }
}

function fatSecretSummary(raw: Record<string, unknown>): FoodSummary {
  const description = String(raw.food_description ?? "");
  const find = (label: string) => numberValue(description.match(new RegExp(`${label}:\\s*([0-9.]+)`, "i"))?.[1]);
  return {
    id: `fs:${String(raw.food_id)}`,
    name: String(raw.food_name ?? "Unknown food"),
    category: String(raw.food_type ?? "Standard"),
    source: "Verified Food Database",
    brand: null,
    default_unit: "portion",
    calories_per_100g: find("Calories"),
    protein_per_100g: find("Protein"),
    carbs_per_100g: find("Carbs"),
    fat_per_100g: find("Fat"),
    fiber_per_100g: 0,
    servings_count: 1,
  };
}

async function searchFatSecret(query: string, limit: number): Promise<FoodSummary[] | null> {
  const token = await getFatSecretToken();
  if (!token) return null;
  const safeLimit = Math.min(Math.max(limit, 5), 20);
  const params = new URLSearchParams({ method: "foods.search", search_expression: query, max_results: String(safeLimit), format: "json" });
  try {
    const response = await fetchWithTimeout(`${FATSECRET_API_URL}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }, 2500);
    if (!response.ok) return null;
    const data = (await response.json()) as { foods?: { food?: Record<string, unknown> | Array<Record<string, unknown>> }; error?: unknown };
    if (data.error) return null;
    const foods = data.foods?.food;
    if (!foods) return [];
    return (Array.isArray(foods) ? foods : [foods]).map(fatSecretSummary);
  } catch {
    return null;
  }
}

async function searchUsda(query: string, limit: number): Promise<FoodSummary[]> {
  const key = process.env.USDA_API_KEY;
  if (!key) return [];
  const safeLimit = Math.min(Math.max(limit, 5), 18);
  const params = new URLSearchParams({ api_key: key, query, pageSize: String(safeLimit) });
  try {
    const response = await fetchWithTimeout(`${USDA_API_URL}/foods/search?${params}`, {
      cache: "no-store",
    }, 2800);
    if (!response.ok) return [];
    const data = (await response.json()) as { foods?: Array<Record<string, unknown>> };
    return (data.foods ?? []).map((food) => {
      const nutrition = nutrientsFromList((food.foodNutrients as Array<Record<string, unknown>>) ?? []);
      const rawName = String(food.description ?? "Unknown food");
      const formattedName = rawName === rawName.toUpperCase()
        ? rawName.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
        : rawName;
      return {
        id: `usda:${food.fdcId}`,
        name: formattedName,
        category: String(food.foodCategory ?? "General food"),
        source: "Verified Food Database",
        brand: null,
        default_unit: "portion",
        calories_per_100g: nutrition.calories,
        protein_per_100g: nutrition.protein_g,
        carbs_per_100g: nutrition.carbs_g,
        fat_per_100g: nutrition.fat_g,
        fiber_per_100g: nutrition.fiber_g,
        servings_count: 1,
      };
    });
  } catch {
    return [];
  }
}

let cachedCatalogFoods: { items: FoodItem[]; timestamp: number } | null = null;

async function getSupabaseFoods(): Promise<FoodItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id") || url.includes("placeholder")) {
    return [];
  }
  try {
    const response = await fetch(
      `${url}/rest/v1/foods?select=id,name,category,source,external_id,brand,default_unit,food_nutrition(*),servings(*)`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      }
    );
    if (!response.ok) return [];
    const data = (await response.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(data)) return [];
    return data.map((item) => {
      const rawNut = item.food_nutrition as Record<string, unknown> | null;
      const rawServings = item.servings as Array<Record<string, unknown>> | null;
      const nutrition: FoodNutrition = rawNut
        ? {
            basis_grams: numberValue(rawNut.basis_grams) || 100,
            calories: numberValue(rawNut.calories),
            protein_g: numberValue(rawNut.protein_g),
            carbs_g: numberValue(rawNut.carbs_g),
            fat_g: numberValue(rawNut.fat_g),
            fiber_g: numberValue(rawNut.fiber_g),
            sugar_g: numberValue(rawNut.sugar_g),
            sodium_mg: numberValue(rawNut.sodium_mg),
            micronutrients: (rawNut.micronutrients as Record<string, number>) ?? {},
          }
        : emptyNutrition();

      const servings: Serving[] =
        Array.isArray(rawServings) && rawServings.length > 0
          ? rawServings.map((s) => ({
              id: String(s.id),
              label: String(s.label),
              grams: numberValue(s.grams) || 100,
              unit_type: String(s.unit_type ?? "portion"),
              quantity: numberValue(s.quantity) || 1,
            }))
          : [
              {
                id: `${String(item.id)}-100g`,
                label: "100g portion",
                grams: 100,
                unit_type: "weight_g",
                quantity: 1,
              },
            ];

      return {
        id: String(item.id),
        name: String(item.name ?? "Unknown food"),
        category: String(item.category ?? "General"),
        source: String(item.source ?? "Database"),
        external_id: String(item.external_id ?? item.id),
        brand: item.brand ? String(item.brand) : null,
        default_unit: String(item.default_unit ?? "portion"),
        nutrition,
        servings,
      };
    });
  } catch {
    return [];
  }
}

export async function getAllCatalogFoods(): Promise<FoodItem[]> {
  const now = Date.now();
  if (cachedCatalogFoods && now - cachedCatalogFoods.timestamp < 600_000) {
    return cachedCatalogFoods.items;
  }
  const dbFoods = await getSupabaseFoods();
  const map = new Map<string, FoodItem>();
  for (const f of VERIFIED_FOOD_CATALOG) {
    map.set(f.name.toLowerCase(), f);
  }
  for (const f of dbFoods) {
    map.set(f.name.toLowerCase(), f);
  }
  const combined = Array.from(map.values());
  cachedCatalogFoods = { items: combined, timestamp: now };
  return combined;
}

interface SearchCacheEntry {
  items: FoodSummary[];
  timestamp: number;
}

const searchCache = new Map<string, SearchCacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function searchFoods(
  query: string,
  limit = 100,
  category?: string
): Promise<FoodSummary[]> {
  const cleaned = query.trim();
  const cat = category && category !== "All" ? category.trim().toLowerCase() : "";
  const cacheKey = `${cleaned.toLowerCase()}::${cat}::${limit}`;

  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.items;
  }

  let finalResults: FoodSummary[] = [];

  if (cleaned) {
    const halfLimit = Math.min(Math.ceil(limit / 2), 18);
    const needle = cleaned.toLowerCase();

    // Fetch FatSecret, USDA, and Local Catalog concurrently
    const [fatSecretItems, usdaItems, catalog] = await Promise.all([
      searchFatSecret(cleaned, halfLimit).catch(() => null).then((res) => res ?? []),
      searchUsda(cleaned, halfLimit).catch(() => []).then((res) => res ?? []),
      getAllCatalogFoods(),
    ]);

    // Interleave FatSecret and USDA results
    const apiResults: FoodSummary[] = [];
    const maxLen = Math.max(fatSecretItems.length, usdaItems.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < fatSecretItems.length) apiResults.push(fatSecretItems[i]);
      if (i < usdaItems.length) apiResults.push(usdaItems[i]);
    }

    const localMatches = catalog
      .filter((food) => {
        if (cat && food.category.toLowerCase() !== cat) return false;
        return (
          food.name.toLowerCase().includes(needle) ||
          food.category.toLowerCase().includes(needle) ||
          Boolean(food.brand && food.brand.toLowerCase().includes(needle))
        );
      })
      .map(summary);

    const allCandidates = [...localMatches, ...apiResults];

    if (allCandidates.length > 0) {
      const seen = new Set<string>();
      const filtered = allCandidates.filter((item) => {
        if (cat && item.category.toLowerCase() !== cat) return false;
        const key = `${item.name.toLowerCase()}::${item.brand?.toLowerCase() || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      finalResults = filtered
        .sort((a, b) => {
          const aExact = a.name.toLowerCase().includes(needle);
          const bExact = b.name.toLowerCase().includes(needle);
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return 0;
        })
        .slice(0, limit);
    }
  } else {
    // When no query is provided, return all catalog & database foods
    const catalog = await getAllCatalogFoods();
    finalResults = catalog
      .filter((food) => {
        if (cat && food.category.toLowerCase() !== cat) return false;
        return true;
      })
      .slice(0, limit)
      .map(summary);
  }

  if (finalResults.length > 0) {
    searchCache.set(cacheKey, { items: finalResults, timestamp: Date.now() });
    if (searchCache.size > 500) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) searchCache.delete(oldestKey);
    }
  }

  return finalResults;
}

const COMMON_FOOD_TERMS = [
  "Apple", "Banana", "Orange", "Mango", "Papaya", "Watermelon", "Pineapple", "Strawberries",
  "Chicken Breast", "Chicken Curry", "Chicken Biryani", "Boiled Egg", "Egg Omelette", "Egg Bhurji",
  "Paneer Tikka", "Paneer Butter Masala", "Roti / Chapati", "Butter Roti", "Paratha", "Aloo Paratha", "Naan",
  "Basmati Rice", "Brown Rice", "Vegetable Pulao", "Veg Pulao", "Dal Makhani", "Yellow Moong Dal", "Tarka Dal",
  "Chana Masala", "Rajma Chawal", "Chole Bhature", "Farmhouse Pizza", "Cheese Pizza", "Veggie Burger",
  "French Fries", "Oats Porridge", "Greek Yogurt", "Plain Dahi / Curd", "Almonds", "Walnuts", "Peanut Butter",
  "Cow Milk", "Almond Milk", "Pure Cow Ghee", "Tofu", "Spinach / Palak", "Broccoli", "Chia Seeds", "Protein Shake",
  "Veg Sandwich", "Masala Dosa", "Plain Idli", "Sambar", "Poha", "Upma"
];

export async function foodSuggestions(query: string, limit = 8): Promise<string[]> {
  const cleaned = query.trim().toLowerCase();
  if (!cleaned) return [];

  const suggestions = new Set<string>();

  // 1. Instant check in cached searches (< 0.1ms)
  for (const [key, entry] of searchCache.entries()) {
    if (key.includes(cleaned)) {
      for (const item of entry.items) {
        const simple = item.name.split("(")[0].split("/")[0].trim();
        if (simple.toLowerCase().includes(cleaned)) {
          suggestions.add(simple);
          if (suggestions.size >= limit) return Array.from(suggestions);
        }
      }
    }
  }

  // 2. Instant catalog lookup (< 0.5ms)
  const catalog = await getAllCatalogFoods();
  for (const food of catalog) {
    const simple = food.name.split("(")[0].split("/")[0].trim();
    if (simple.toLowerCase().includes(cleaned)) {
      suggestions.add(simple);
      if (suggestions.size >= limit) return Array.from(suggestions);
    }
  }

  // 3. Fallback to common culinary dictionary (< 0.1ms)
  for (const word of COMMON_FOOD_TERMS) {
    if (word.toLowerCase().includes(cleaned)) {
      suggestions.add(word);
      if (suggestions.size >= limit) break;
    }
  }

  return Array.from(suggestions).slice(0, limit);
}

async function fatSecretDetail(id: string): Promise<FoodItem | null> {
  const token = await getFatSecretToken();
  if (!token) return null;
  const params = new URLSearchParams({ method: "food.get.v2", food_id: id, format: "json" });
  try {
    const response = await fetchWithTimeout(`${FATSECRET_API_URL}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }, 3000);
    if (!response.ok) return null;
    const data = (await response.json()) as { food?: Record<string, unknown> };
    const food = data.food;
    if (!food) return null;
    const rawServings = (food.servings as { serving?: Record<string, unknown> | Array<Record<string, unknown>> } | undefined)?.serving ?? [];
    const servingsRaw = Array.isArray(rawServings) ? rawServings : [rawServings];
    const servings: Serving[] = servingsRaw.map((serving, index) => ({
      id: `fs-serving:${String(serving.serving_id ?? index)}`,
      label: String(serving.serving_description ?? "1 serving"),
      grams: numberValue(serving.metric_serving_amount) || 100,
      unit_type: String(serving.metric_serving_unit ?? "g"),
      quantity: 1,
    }));
    const basis = servingsRaw[0] ?? {};
    const grams = numberValue(basis.metric_serving_amount) || 100;
    const ratio = 100 / grams;
    const nutrition: FoodNutrition = {
      basis_grams: 100,
      calories: numberValue(basis.calories) * ratio,
      protein_g: numberValue(basis.protein) * ratio,
      carbs_g: numberValue(basis.carbohydrate) * ratio,
      fat_g: numberValue(basis.fat) * ratio,
      fiber_g: numberValue(basis.fiber) * ratio,
      sugar_g: numberValue(basis.sugar) * ratio,
      sodium_mg: numberValue(basis.sodium) * ratio,
    };
    return {
      id: `fs:${id}`,
      name: String(food.food_name ?? "Unknown food"),
      category: String(food.food_type ?? "Standard"),
      source: "Verified Food Database",
      external_id: `FS:${id}`,
      brand: null,
      default_unit: "portion",
      nutrition,
      servings: servings.length ? servings : [{ id: "fs-serving:100g", label: "100g portion", grams: 100, unit_type: "weight_g", quantity: 1 }],
    };
  } catch {
    return null;
  }
}

async function usdaDetail(id: string): Promise<FoodItem | null> {
  const key = process.env.USDA_API_KEY;
  if (!key) return null;

  try {
    // Fetch full details and abridged nutrients in parallel with 3500ms timeout
    const [response, abridgedResponse] = await Promise.all([
      fetchWithTimeout(
        `${USDA_API_URL}/food/${encodeURIComponent(id)}?${new URLSearchParams({ api_key: key })}`,
        { cache: "no-store" },
        3500
      ),
      fetchWithTimeout(
        `${USDA_API_URL}/food/${encodeURIComponent(id)}?${new URLSearchParams({ api_key: key, format: "abridged" })}`,
        { cache: "no-store" },
        3500
      ),
    ]);

    if (!response.ok) return null;
    const food = (await response.json()) as Record<string, unknown>;
    const abridged = abridgedResponse.ok
      ? ((await abridgedResponse.json()) as Record<string, unknown>)
      : null;

    const portions = (food.foodPortions as Array<Record<string, unknown>>) ?? [];
    const servings: Serving[] = portions
      .map((portion, index) => ({
        id: `usda-serving:${String(portion.id ?? index)}`,
        label: `${String(portion.amount ?? 1)} ${String(portion.modifier ?? "serving")} (${Math.round(numberValue(portion.gramWeight))}g)`,
        grams: numberValue(portion.gramWeight),
        unit_type: "portion",
        quantity: numberValue(portion.amount) || 1,
      }))
      .filter((serving) => serving.grams > 0);

    if (food.servingSize) {
      const servGrams = numberValue(food.servingSize);
      if (servGrams > 0) {
        servings.unshift({
          id: `usda-serving:servSize`,
          label: `${String(food.householdServingFullText || "1 serving")} (${Math.round(servGrams)}g)`,
          grams: servGrams,
          unit_type: "portion",
          quantity: 1,
        });
      }
    }

    if (!servings.some((serving) => Math.abs(serving.grams - 100) < 1)) {
      servings.push({
        id: "usda-serving:100g",
        label: "100g portion",
        grams: 100,
        unit_type: "weight_g",
        quantity: 1,
      });
    }

    // Combine foodNutrients from abridged and full responses
    const combinedNutrients = [
      ...((abridged?.foodNutrients as Array<Record<string, unknown>>) ?? []),
      ...((food.foodNutrients as Array<Record<string, unknown>>) ?? []),
    ];

    const nutrition = nutrientsFromList(combinedNutrients);

    if (food.labelNutrients && typeof food.labelNutrients === "object") {
      const ln = food.labelNutrients as Record<string, { value?: number }>;
      if (ln.calories?.value && !nutrition.calories) nutrition.calories = ln.calories.value;
      if (ln.protein?.value && !nutrition.protein_g) nutrition.protein_g = ln.protein.value;
      if (ln.carbohydrates?.value && !nutrition.carbs_g) nutrition.carbs_g = ln.carbohydrates.value;
      if (ln.fat?.value && !nutrition.fat_g) nutrition.fat_g = ln.fat.value;
      if (ln.fiber?.value && !nutrition.fiber_g) nutrition.fiber_g = ln.fiber.value;
      if (ln.sugars?.value && !nutrition.sugar_g) nutrition.sugar_g = ln.sugars.value;
      if (ln.sodium?.value && !nutrition.sodium_mg) nutrition.sodium_mg = ln.sodium.value;
    }

    // Atwater calculation fallback if calories remain 0
    if (nutrition.calories === 0 && (nutrition.protein_g > 0 || nutrition.carbs_g > 0 || nutrition.fat_g > 0)) {
      nutrition.calories = Math.round(nutrition.protein_g * 4 + nutrition.carbs_g * 4 + nutrition.fat_g * 9);
    }

    const rawName = String(food.description ?? "Unknown food");
    const formattedName = rawName === rawName.toUpperCase()
      ? rawName.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
      : rawName;

    return {
      id: `usda:${id}`,
      name: formattedName,
      category: String(
        (food.foodCategory as Record<string, unknown> | undefined)?.description ??
          food.foodCategory ??
          food.brandedFoodCategory ??
          "General food"
      ),
      source: "Verified Food Database",
      external_id: `FDC:${id}`,
      brand: null,
      default_unit: "portion",
      nutrition,
      servings,
    };
  } catch {
    return null;
  }
}

const foodDetailCache = new Map<string, { item: FoodItem; timestamp: number }>();

export async function getFoodDetail(id: string): Promise<FoodItem | null> {
  const cached = foodDetailCache.get(id);
  if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
    return cached.item;
  }

  let item: FoodItem | null = null;
  if (id.startsWith("fs:")) item = await fatSecretDetail(id.slice(3));
  else if (id.startsWith("usda:")) item = await usdaDetail(id.slice(5));
  else {
    const catalog = await getAllCatalogFoods();
    const match = catalog.find((food) => food.id === id || food.external_id === id);
    if (match) item = match;
    else item = VERIFIED_FOOD_CATALOG.find((food) => food.id === id || food.external_id === id) ?? null;
  }

  if (item) {
    foodDetailCache.set(id, { item, timestamp: Date.now() });
  }

  return item;
}
