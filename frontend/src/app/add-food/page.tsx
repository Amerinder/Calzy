"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  FoodItem,
  FoodSummary,
  Serving,
  scaleNutrition,
  fetchFoodSuggestions,
  searchFoodsApi,
  fetchFoodDetailApi,
} from "@/lib/api/foods";
import {
  Search,
  Plus,
  Check,
  ArrowLeft,
  Scale,
  Sparkles,
  Loader2,
  X,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function AddFoodPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<string>("breakfast");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedServing, setSelectedServing] = useState<Serving | null>(null);
  const [customGrams, setCustomGrams] = useState<string>("100");
  const [isLogged, setIsLogged] = useState(false);

  // Suggestions & Search State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFoodDetail, setIsLoadingFoodDetail] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Recent Searches State (Top 3 past searches)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);
  const recentBoxRef = useRef<HTMLDivElement>(null);

  // Load past searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("calzy_past_searches");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 3));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      setRecentSearches((prev) => {
        const updated = [
          trimmed,
          ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
        ].slice(0, 3);
        localStorage.setItem("calzy_past_searches", JSON.stringify(updated));
        return updated;
      });
    } catch {
      // ignore
    }
  };

  // Debounced autocomplete suggestions as user types
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const list = await fetchFoodSuggestions(q);
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounced search execution when query changes
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setHasSearched(true);
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchFoodsApi(q);
        setSearchResults(results);
        saveRecentSearch(q);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedSuggestions =
        suggestionsBoxRef.current && suggestionsBoxRef.current.contains(target);
      const clickedRecent =
        recentBoxRef.current && recentBoxRef.current.contains(target);
      const clickedInput =
        searchInputRef.current && searchInputRef.current.contains(target);

      if (!clickedSuggestions && !clickedInput) {
        setShowSuggestions(false);
      }
      if (!clickedRecent && !clickedInput) {
        setShowRecentSearches(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectRecentSearch = (term: string) => {
    setSearchQuery(term);
    setShowRecentSearches(false);
    setShowSuggestions(false);
    setIsSearching(true);
    setHasSearched(true);
    saveRecentSearch(term);
    searchFoodsApi(term).then((results) => {
      setSearchResults(results);
      setIsSearching(false);
    });
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setShowRecentSearches(false);
    setIsSearching(true);
    setHasSearched(true);
    saveRecentSearch(suggestion);
    searchFoodsApi(suggestion).then((results) => {
      setSearchResults(results);
      setIsSearching(false);
    });
  };

  const handleSelectFoodSummary = async (summary: FoodSummary) => {
    setIsLoadingFoodDetail(true);
    try {
      const fullItem = await fetchFoodDetailApi(summary.id);
      if (fullItem) {
        setSelectedFood(fullItem);
        const defaultServ = fullItem.servings[0] || {
          id: "std-100",
          label: "100g portion",
          grams: 100,
          unit_type: "weight_g",
          quantity: 1,
        };
        setSelectedServing(defaultServ);
        setCustomGrams(defaultServ.grams.toString());
      }
    } finally {
      setIsLoadingFoodDetail(false);
      setIsLogged(false);
    }
  };

  const handleSelectServing = (serving: Serving) => {
    setSelectedServing(serving);
    setCustomGrams(serving.grams.toString());
  };

  const handleCustomGramsChange = (val: string) => {
    setCustomGrams(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setSelectedServing({
        id: "custom",
        label: `${num}g custom`,
        grams: num,
        unit_type: "custom",
        quantity: 1,
      });
    }
  };

  // Compute live scaled nutrition
  const activeGrams =
    parseFloat(customGrams) || (selectedServing ? selectedServing.grams : 100);
  const scaledNutrients = useMemo(() => {
    if (!selectedFood) return null;
    return scaleNutrition(selectedFood, activeGrams);
  }, [selectedFood, activeGrams]);

  const handleSaveToMeal = () => {
    setIsLogged(true);
    setTimeout(() => {
      setIsLogged(false);
    }, 2500);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pb-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href="/dashboard"
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-base font-bold text-slate-900">Add Food</h1>
          <div className="w-8" />
        </div>

        {/* Meal Selector Pills */}
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

        {/* Search Input with Autocomplete & Recent Searches */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search foods (e.g. egg, chicken, banana)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (!searchQuery && recentSearches.length > 0) {
                  setShowRecentSearches(true);
                  setShowSuggestions(false);
                } else if (suggestions.length > 0) {
                  setShowSuggestions(true);
                  setShowRecentSearches(false);
                }
              }}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowSuggestions(false);
                  setShowRecentSearches(recentSearches.length > 0);
                }}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : isLoadingSuggestions ? (
              <Loader2 className="w-3.5 h-3.5 text-slate-400 absolute right-3 animate-spin" />
            ) : null}
          </div>

          {/* Recent Searches Dropdown (Top 3 on search bar click) */}
          {showRecentSearches && recentSearches.length > 0 && !searchQuery && (
            <div
              ref={recentBoxRef}
              className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden py-1.5 animate-in fade-in-50 duration-150"
            >
              <div className="px-3.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  <span>Recent Searches</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRecentSearches([]);
                    localStorage.removeItem("calzy_past_searches");
                    setShowRecentSearches(false);
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-500 lowercase cursor-pointer transition-colors"
                >
                  clear
                </button>
              </div>
              {recentSearches.map((term, idx) => (
                <button
                  key={`${term}-${idx}`}
                  type="button"
                  onClick={() => handleSelectRecentSearch(term)}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-800">{term}</span>
                  </span>
                  <Search className="w-3 h-3 text-slate-300" />
                </button>
              ))}
            </div>
          )}

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsBoxRef}
              className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden py-1 animate-in fade-in-50 duration-150"
            >
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                Suggestions
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={`${item}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>{item}</span>
                  <Search className="w-3 h-3 text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Food & Portion Detail Card (Shows ONLY when user clicks on a food item) */}
        {selectedFood && scaledNutrients && (
          <Card className="p-4 border-emerald-300 bg-emerald-50/40 shadow-xs animate-in fade-in-50">
            <div className="flex items-start justify-between">
              <div className="pr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {selectedFood.category}
                  </span>
                  {selectedFood.brand && (
                    <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {selectedFood.brand}
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                  {selectedFood.name}
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-extrabold text-emerald-700">
                  {scaledNutrients.calories}
                </span>
                <span className="text-xs text-slate-500 block -mt-1 font-medium">
                  kcal ({activeGrams}g)
                </span>
              </div>
            </div>

            {/* Serving Portion Chips */}
            <div className="mt-3 pt-3 border-t border-emerald-100 flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                Portion Size:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {selectedFood.servings.map((serving) => (
                  <button
                    key={serving.id}
                    onClick={() => handleSelectServing(serving)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedServing?.id === serving.id
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-emerald-300"
                    }`}
                  >
                    {serving.label}
                  </button>
                ))}
              </div>

              {/* Custom Weight Gram Input */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-600 whitespace-nowrap font-medium">
                  Or custom weight:
                </span>
                <div className="flex items-center gap-1 w-24">
                  <input
                    type="number"
                    min="1"
                    max="3000"
                    value={customGrams}
                    onChange={(e) => handleCustomGramsChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 text-center outline-none focus:border-emerald-500 font-semibold"
                    placeholder="100"
                  />
                  <span className="text-xs text-slate-400 font-medium">g</span>
                </div>
              </div>
            </div>

            {/* Scaled Macronutrient Breakdown */}
            <div className="mt-3 pt-3 border-t border-emerald-100 grid grid-cols-4 gap-2 text-center bg-white/80 p-2.5 rounded-xl border border-emerald-100/60">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Protein</span>
                <span className="text-xs font-bold text-slate-800">{scaledNutrients.protein_g}g</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Carbs</span>
                <span className="text-xs font-bold text-slate-800">{scaledNutrients.carbs_g}g</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Fat</span>
                <span className="text-xs font-bold text-slate-800">{scaledNutrients.fat_g}g</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Fiber</span>
                <span className="text-xs font-bold text-slate-800">{scaledNutrients.fiber_g}g</span>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-3.5">
              {isLogged ? (
                <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Added to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}!</span>
                </div>
              ) : (
                <Button
                  onClick={handleSaveToMeal}
                  fullWidth
                  variant="primary"
                  size="md"
                  className="gap-2 font-bold"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Add to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)} ({scaledNutrients.calories} kcal)
                  </span>
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Loading detail indicator */}
        {isLoadingFoodDetail && (
          <div className="p-4 text-center bg-white rounded-2xl border border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            Loading nutrition details...
          </div>
        )}

        {/* Initial Prompt State (shown before searching) */}
        {!hasSearched && !selectedFood && (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 mt-1">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">Search for any food item</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
              Type a food name above or click below to search and view accurate portion-scaled nutrition.
            </p>
            {recentSearches.length > 0 && (
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Recent:
                </span>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectRecentSearch(term)}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-full transition-colors font-medium cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Results Header (Only shown when a search has been initiated) */}
        {hasSearched && (
          <div className="flex items-center justify-between pt-1 border-b border-slate-200/70 pb-2 text-xs">
            <span className="text-slate-600 font-semibold">
              Results for &quot;{searchQuery}&quot; ({searchResults.length})
            </span>
            {isSearching && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching...
              </span>
            )}
          </div>
        )}

        {/* Food Results List (Only shown when searching) */}
        {hasSearched && (
          <div className="flex flex-col gap-2">
            {searchResults.map((food) => {
              const isSelected = selectedFood?.id === food.id;

              return (
                <div
                  key={food.id}
                  onClick={() => handleSelectFoodSummary(food)}
                  className={`p-3.5 rounded-2xl bg-white border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {food.category}
                      </span>
                      {food.brand && (
                        <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                          {food.brand}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 mt-1 truncate">
                      {food.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      P: {food.protein_per_100g}g • C: {food.carbs_per_100g}g • F: {food.fat_per_100g}g (per 100g)
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-slate-900">
                      {food.calories_per_100g}
                    </span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5">kcal/100g</span>
                  </div>
                </div>
              );
            })}

            {!isSearching && searchResults.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No foods found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try typing a broader term like &quot;apple&quot;, &quot;egg&quot;, or &quot;rice&quot;.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
