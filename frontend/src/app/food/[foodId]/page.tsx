"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  FoodItem,
  Serving,
  scaleNutrition,
  fetchFoodDetailApi,
} from "@/lib/api/foods";
import {
  ArrowLeft,
  Scale,
  Loader2,
  Star,
  Minus,
  Plus,
  AlertCircle,
  Flame,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const PRESET_MULTIPLIERS = [0.5, 1, 1.5, 2, 3];

interface RecentLoggedEntry {
  id: string;
  food_id: string;
  name: string;
  category: string;
  meal: string;
  portion_label: string;
  grams: number;
  calories: number;
  protein_g: number;
  timestamp: number;
}

export default function FoodDetailPage({
  params,
}: {
  params: Promise<{ foodId: string }>;
}) {
  const resolvedParams = use(params);
  const foodId = decodeURIComponent(resolvedParams.foodId);
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMeal = searchParams.get("meal") || "breakfast";
  const returnQuery = searchParams.get("q") || "";

  const [food, setFood] = useState<FoodItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<string>(initialMeal);
  const [selectedServing, setSelectedServing] = useState<Serving | null>(null);
  const [quantityMultiplier, setQuantityMultiplier] = useState<number>(1);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customGrams, setCustomGrams] = useState<string>("100");
  const [customUnit, setCustomUnit] = useState<"g" | "ml">("g");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLogged, setIsLogged] = useState(false);

  // Favorites state
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem("calzy_favorite_foods");
      if (storedFavs) {
        const parsed = JSON.parse(storedFavs);
        if (Array.isArray(parsed) && parsed.includes(foodId)) {
          setIsFavorite(true);
        }
      }
    } catch {
      // ignore
    }
  }, [foodId]);

  const toggleFavorite = () => {
    try {
      const stored = localStorage.getItem("calzy_favorite_foods");
      const list: string[] = stored ? JSON.parse(stored) : [];
      const updated = list.includes(foodId)
        ? list.filter((id) => id !== foodId)
        : [...list, foodId];
      localStorage.setItem("calzy_favorite_foods", JSON.stringify(updated));
      setIsFavorite(updated.includes(foodId));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    fetchFoodDetailApi(foodId)
      .then((item) => {
        if (isCurrent && item) {
          setFood(item);
          const defaultServ = item.servings[0] || {
            id: "std-100",
            label: "100g portion",
            grams: 100,
            unit_type: "weight_g",
            quantity: 1,
          };
          setSelectedServing(defaultServ);
          setCustomGrams(defaultServ.grams.toString());
          setCustomUnit(defaultServ.unit_type === "volume_ml" ? "ml" : "g");
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [foodId]);

  const handleSelectServing = (serving: Serving) => {
    setSelectedServing(serving);
    setIsCustomMode(false);
    setValidationError(null);
    setCustomGrams(Math.round(serving.grams * quantityMultiplier).toString());
    setCustomUnit(serving.unit_type === "volume_ml" ? "ml" : "g");
  };

  const handleMultiplierChange = (multiplier: number) => {
    const safeMult = Math.max(0.25, Math.min(20, Math.round(multiplier * 10) / 10));
    setQuantityMultiplier(safeMult);
    setIsCustomMode(false);
    setValidationError(null);
    if (selectedServing) {
      setCustomGrams(Math.round(selectedServing.grams * safeMult).toString());
    }
  };

  const handleCustomGramsChange = (val: string) => {
    setCustomGrams(val);
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      setValidationError("Please enter a positive number greater than 0.");
    } else if (num > 5000) {
      setValidationError("Maximum allowed portion is 5,000g / 5,000ml.");
    } else {
      setValidationError(null);
    }
  };

  const activeGrams = useMemo(() => {
    if (isCustomMode) {
      const parsed = parseFloat(customGrams);
      return !isNaN(parsed) && parsed > 0 && parsed <= 5000 ? parsed : 0;
    }
    const baseGrams = selectedServing ? selectedServing.grams : 100;
    return Math.round(baseGrams * quantityMultiplier * 10) / 10;
  }, [isCustomMode, customGrams, selectedServing, quantityMultiplier]);

  const scaledNutrients = useMemo(() => {
    if (!food || activeGrams <= 0) return null;
    return scaleNutrition(food, activeGrams);
  }, [food, activeGrams]);

  const handleSaveToMeal = () => {
    if (!food || !scaledNutrients || activeGrams <= 0) return;

    const entry: RecentLoggedEntry = {
      id: `${food.id}-${Date.now()}`,
      food_id: food.id,
      name: food.name,
      category: food.category,
      meal: selectedMeal,
      portion_label: isCustomMode
        ? `${activeGrams}${customUnit} custom`
        : `${quantityMultiplier}x ${selectedServing?.label || "100g"} (${activeGrams}g)`,
      grams: activeGrams,
      calories: scaledNutrients.calories,
      protein_g: scaledNutrients.protein_g,
      timestamp: Date.now(),
    };

    try {
      const stored = localStorage.getItem("calzy_recent_logged_foods");
      const list: RecentLoggedEntry[] = stored ? JSON.parse(stored) : [];
      const updated = [entry, ...list.filter((item) => item.food_id !== food.id)].slice(
        0,
        15
      );
      localStorage.setItem("calzy_recent_logged_foods", JSON.stringify(updated));
    } catch {
      // ignore
    }

    setIsLogged(true);
    setTimeout(() => {
      setIsLogged(false);
      // Return seamlessly to Add Food or Dashboard
      router.push(`/add-food?meal=${selectedMeal}&q=${encodeURIComponent(returnQuery)}`);
    }, 1800);
  };

  const backUrl = `/add-food?meal=${selectedMeal}${returnQuery ? `&q=${encodeURIComponent(returnQuery)}` : ""}`;

  return (
    <AppShell>
      <div className="flex flex-col gap-4 pb-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href={backUrl}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
            title="Back to search"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="text-center">
            <h1 className="text-base font-bold text-slate-900">Food Details & Portion</h1>
            <p className="text-[11px] text-slate-500">Configure portions and verify nutrition</p>
          </div>
          <button
            type="button"
            onClick={toggleFavorite}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
              isFavorite
                ? "bg-amber-50 border-amber-300 text-amber-500"
                : "bg-white border-slate-200 text-slate-400 hover:text-amber-500"
            }`}
            title={isFavorite ? "Remove favorite" : "Bookmark favorite"}
          >
            <Star className={`w-4 h-4 ${isFavorite ? "fill-amber-400" : ""}`} />
          </button>
        </div>

        {/* Meal Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { id: "breakfast", label: "Breakfast" },
            { id: "lunch", label: "Lunch" },
            { id: "snacks", label: "Snacks" },
            { id: "dinner", label: "Dinner" },
          ].map((meal) => (
            <button
              key={meal.id}
              onClick={() => setSelectedMeal(meal.id)}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer text-center ${
                selectedMeal === meal.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {meal.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold text-slate-600">
              Loading complete nutrition & portion details...
            </p>
          </div>
        )}

        {!isLoading && !food && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm font-bold text-slate-800">Food Item Not Found</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Unable to locate food details for this item. Please try searching again.
            </p>
            <Link
              href="/add-food"
              className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100"
            >
              Return to Food Search
            </Link>
          </div>
        )}

        {!isLoading && food && scaledNutrients && (
          <div className="flex flex-col gap-3.5 animate-in fade-in-50 duration-200">
            {/* Food Title & Category Card */}
            <Card className="p-4 border-slate-200/80 bg-white shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                {food.category}
              </span>
              <h2 className="text-base font-extrabold text-slate-900 mt-2 leading-snug">
                {food.name}
              </h2>

              {/* Large Calories & Portion Live Header Badge */}
              <div className="mt-3.5 flex items-center justify-between bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 leading-tight">
                      {scaledNutrients.calories}
                    </span>
                    <span className="text-xs text-slate-500 font-bold ml-1.5">kcal</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg block">
                    {activeGrams}g total
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    scaled nutrition
                  </span>
                </div>
              </div>
            </Card>

            {/* Serving Portion Selection */}
            <Card className="p-4 border-slate-200/80 bg-white shadow-2xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  Portion & Quantity:
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomMode((prev) => !prev)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  {isCustomMode ? "Use preset portions" : "Custom weight/ml"}
                </button>
              </div>

              {!isCustomMode ? (
                <>
                  {/* Preset Servings */}
                  <div className="flex flex-wrap gap-1.5">
                    {food.servings.map((serving) => {
                      const isSelected = selectedServing?.id === serving.id;
                      return (
                        <button
                          key={serving.id}
                          onClick={() => handleSelectServing(serving)}
                          className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "bg-slate-50 border border-slate-200 text-slate-700 hover:border-emerald-300"
                          }`}
                        >
                          {serving.label}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        handleSelectServing({
                          id: "std-100g",
                          label: "100g portion",
                          grams: 100,
                          unit_type: "weight_g",
                          quantity: 1,
                        })
                      }
                      className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                        selectedServing?.id === "std-100g"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-slate-50 border border-slate-200 text-slate-700 hover:border-emerald-300"
                      }`}
                    >
                      100g portion
                    </button>
                  </div>

                  {/* Quantity Stepper & Multiplier Chips */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mt-1">
                    <span className="text-xs font-semibold text-slate-700">Multiplier:</span>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleMultiplierChange(quantityMultiplier - 0.5)}
                        disabled={quantityMultiplier <= 0.5}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        title="Decrease portion"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-slate-900 w-8 text-center">
                        {quantityMultiplier}x
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMultiplierChange(quantityMultiplier + 0.5)}
                        disabled={quantityMultiplier >= 10}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        title="Increase portion"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {PRESET_MULTIPLIERS.map((mult) => (
                      <button
                        key={mult}
                        onClick={() => handleMultiplierChange(mult)}
                        className={`text-xs py-1 px-2.5 rounded-lg font-bold transition-colors cursor-pointer ${
                          quantityMultiplier === mult
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-200"
                        }`}
                      >
                        {mult}x
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                /* Custom Quantity Control */
                <div className="flex flex-col gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Custom Portion:</span>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setCustomUnit("g")}
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                          customUnit === "g" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600"
                        }`}
                      >
                        grams (g)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomUnit("ml")}
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                          customUnit === "ml" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600"
                        }`}
                      >
                        milliliters (ml)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="5000"
                      step="1"
                      value={customGrams}
                      onChange={(e) => handleCustomGramsChange(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold outline-none focus:border-emerald-500 transition-all"
                      placeholder="e.g. 150"
                    />
                    <span className="text-xs font-bold text-slate-600 px-3 py-2 bg-white rounded-xl border border-slate-200">
                      {customUnit}
                    </span>
                  </div>

                  {validationError && (
                    <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {validationError}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Enter weight in grams or volume in ml (1g to 5,000g). Nutrition values update live.
                  </p>
                </div>
              )}
            </Card>

            {/* Scaled Macronutrient Cards */}
            <Card className="p-4 border-slate-200/80 bg-white shadow-2xs flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Macronutrient Breakdown
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">Protein</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {scaledNutrients.protein_g}g
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {scaledNutrients.protein_pct}%
                  </span>
                </div>
                <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-amber-800 uppercase font-bold block">Carbs</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {scaledNutrients.carbs_g}g
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {scaledNutrients.carbs_pct}%
                  </span>
                </div>
                <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-rose-800 uppercase font-bold block">Fat</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {scaledNutrients.fat_g}g
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {scaledNutrients.fat_pct}%
                  </span>
                </div>
                <div className="bg-teal-50/60 p-2.5 rounded-xl border border-teal-100">
                  <span className="text-[10px] text-teal-800 uppercase font-bold block">Fiber</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {scaledNutrients.fiber_g}g
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Net {scaledNutrients.net_carbs_g}g
                  </span>
                </div>
              </div>

              {/* Caloric Distribution Progress Bar */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase">
                  <span>Caloric Split</span>
                  <span>P {scaledNutrients.protein_pct}% • C {scaledNutrients.carbs_pct}% • F {scaledNutrients.fat_pct}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-200/70 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${scaledNutrients.protein_pct}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Protein: ${scaledNutrients.protein_pct}%`}
                  />
                  <div
                    style={{ width: `${scaledNutrients.carbs_pct}%` }}
                    className="bg-amber-400 h-full"
                    title={`Carbs: ${scaledNutrients.carbs_pct}%`}
                  />
                  <div
                    style={{ width: `${scaledNutrients.fat_pct}%` }}
                    className="bg-rose-400 h-full"
                    title={`Fat: ${scaledNutrients.fat_pct}%`}
                  />
                </div>
              </div>

              {/* Micronutrients Row */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2 mt-1">
                <span className="font-bold text-slate-700">Micronutrients:</span>
                <div className="flex items-center gap-3 flex-wrap">
                  <span>
                    Sodium: <strong className="text-slate-900">{scaledNutrients.sodium_mg}mg</strong>
                  </span>
                  {scaledNutrients.potassium_mg !== undefined && (
                    <span>
                      Potassium:{" "}
                      <strong className="text-slate-900">{scaledNutrients.potassium_mg}mg</strong>
                    </span>
                  )}
                  {scaledNutrients.calcium_mg !== undefined && (
                    <span>
                      Calcium:{" "}
                      <strong className="text-slate-900">{scaledNutrients.calcium_mg}mg</strong>
                    </span>
                  )}
                  {scaledNutrients.iron_mg !== undefined && (
                    <span>
                      Iron: <strong className="text-slate-900">{scaledNutrients.iron_mg}mg</strong>
                    </span>
                  )}
                  <span>
                    Sugar: <strong className="text-slate-900">{scaledNutrients.sugar_g}g</strong>
                  </span>
                </div>
              </div>
            </Card>

            {/* Review & Add to Meal Stage */}
            <Card className="p-4 border-2 border-emerald-400 bg-white shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                  Review Before Logging
                </span>
                <span className="text-xs font-bold text-slate-700 capitalize">
                  Target Meal: {selectedMeal}
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-snug">
                <p className="text-slate-600">
                  Selected Portion:{" "}
                  <strong className="text-slate-900">
                    {isCustomMode
                      ? `${activeGrams}${customUnit} custom portion`
                      : `${quantityMultiplier}x ${selectedServing?.label || "100g"} (${activeGrams}g)`}
                  </strong>
                </p>
                <p className="text-xs text-emerald-700 font-bold mt-1">
                  {scaledNutrients.calories} kcal • {scaledNutrients.protein_g}g Protein •{" "}
                  {scaledNutrients.carbs_g}g Carbs • {scaledNutrients.fat_g}g Fat
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <Link
                  href={backUrl}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer text-center"
                >
                  Back
                </Link>
                <div className="flex-1">
                  {isLogged ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold animate-in fade-in">
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>Added to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}!</span>
                    </div>
                  ) : (
                    <Button
                      onClick={handleSaveToMeal}
                      disabled={activeGrams <= 0 || !!validationError}
                      fullWidth
                      variant="primary"
                      size="md"
                      className="gap-2 font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        Add to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)} ({scaledNutrients.calories} kcal)
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
