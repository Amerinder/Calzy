"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  FoodSummary,
  fetchFoodSuggestions,
  searchFoodsApi,
} from "@/lib/api/foods";
import {
  Search,
  ArrowLeft,
  Sparkles,
  Loader2,
  X,
  Clock,
  ChevronRight,
  Filter,
  Star,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  "All",
  "Meals & Fast Food",
  "Poultry & Meat",
  "Dairy & Eggs",
  "Indian Breads",
  "Lentils & Legumes",
  "Grains & Cereals",
  "Fruits & Vegetables",
  "Nuts & Seeds",
  "Fats & Oils",
];

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

function AddFoodContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMeal = searchParams.get("meal") || "breakfast";
  const initialQuery = searchParams.get("q") || "";
  const activeDate = searchParams.get("date") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMeal, setSelectedMeal] = useState<string>(initialMeal);
  const [activeTab, setActiveTab] = useState<"catalog" | "favorites" | "recent">("catalog");

  // Search & Catalog state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Past 5 Searches State (headerless chips)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);

  // Favorites State
  const [favorites, setFavorites] = useState<string[]>([]);

  // Recently Logged Foods State
  const [recentLoggedFoods, setRecentLoggedFoods] = useState<RecentLoggedEntry[]>([]);

  // Client mount state to guarantee zero hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  // Safely hydrate client-only storage on mount to eliminate SSR hydration mismatches
  useEffect(() => {
    setIsMounted(true);
    try {
      const storedSearches = localStorage.getItem("calzy_past_searches");
      if (storedSearches) {
        const parsed = JSON.parse(storedSearches);
        if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, 5));
      }
      const storedFavs = localStorage.getItem("calzy_favorite_foods");
      if (storedFavs) {
        const parsed = JSON.parse(storedFavs);
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
      const storedLogged = localStorage.getItem("calzy_recent_logged_foods");
      if (storedLogged) {
        const parsed = JSON.parse(storedLogged);
        if (Array.isArray(parsed)) setRecentLoggedFoods(parsed.slice(0, 15));
      }
    } catch {
      // ignore
    }
  }, []);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);
  const recentBoxRef = useRef<HTMLDivElement>(null);

  const toggleFavorite = (foodId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(foodId)
        ? prev.filter((id) => id !== foodId)
        : [...prev, foodId];
      try {
        localStorage.setItem("calzy_favorite_foods", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const updated = [
        trimmed,
        ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 5);
      try {
        localStorage.setItem("calzy_past_searches", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const handleRemoveSingleRecent = (termToRemove: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== termToRemove.toLowerCase());
      try {
        localStorage.setItem("calzy_past_searches", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearAllRecentSearches = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRecentSearches([]);
    setShowRecentDropdown(false);
    try {
      localStorage.removeItem("calzy_past_searches");
    } catch {
      // ignore
    }
  };

  // Debounced search and catalog retrieval
  const fetchSearchResults = useCallback(async () => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchFoodsApi(searchQuery.trim(), selectedCategory);
      setSearchResults(results);
    } catch {
      setSearchError("Unable to load foods. Please check your connection and retry.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    let isCurrent = true;
    const trimmed = searchQuery.trim();

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchFoodsApi(trimmed, selectedCategory);
        if (isCurrent) {
          setSearchResults(results);
          setIsSearching(false);
        }
      } catch {
        if (isCurrent) {
          setSearchError("Unable to reach search services. Showing catalog.");
          setSearchResults([]);
          setIsSearching(false);
        }
      }
    }, trimmed ? 250 : 0);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory]);

  // Debounced autocomplete suggestions
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      return;
    }

    let isCurrent = true;
    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const list = await fetchFoodSuggestions(q);
        if (isCurrent) {
          setSuggestions(list);
          setShowSuggestions(list.length > 0);
          setIsLoadingSuggestions(false);
        }
      } catch {
        if (isCurrent) {
          setSuggestions([]);
          setIsLoadingSuggestions(false);
        }
      }
    }, 220);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
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
        setShowRecentDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectRecentSearch = (term: string) => {
    setSearchQuery(term);
    setShowRecentDropdown(false);
    setShowSuggestions(false);
    saveRecentSearch(term);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setShowRecentDropdown(false);
    saveRecentSearch(suggestion);
  };

  // Navigates ON NEXT PAGE to dedicated food detail page
  const handleSelectFoodSummary = (summary: FoodSummary) => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
    } else {
      saveRecentSearch(summary.name.split("(")[0].trim());
    }
    const params = new URLSearchParams();
    params.set("meal", selectedMeal);
    if (searchQuery) params.set("q", searchQuery);
    if (activeDate) params.set("date", activeDate);
    router.push(`/food/${encodeURIComponent(summary.id)}?${params.toString()}`);
  };

  // Filtered displayed foods based on active tab
  const displayedFoods = useMemo(() => {
    if (activeTab === "favorites") {
      return searchResults.filter((f) => favorites.includes(f.id));
    }
    return searchResults;
  }, [activeTab, searchResults, favorites]);

  return (
    <div className="flex flex-col gap-3.5 pb-8">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href="/dashboard"
          className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="text-center">
          <h1 className="text-base font-bold text-slate-900">Add Food</h1>
          <p className="text-[11px] text-slate-500">Search & log standardized portions</p>
        </div>
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
            placeholder="Search foods (e.g. egg, chicken, roti, pulao, pizza)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length < 2) {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => {
              if (!searchQuery && recentSearches.length > 0) {
                setShowRecentDropdown(true);
                setShowSuggestions(false);
              } else if (suggestions.length > 0) {
                setShowSuggestions(true);
                setShowRecentDropdown(false);
              }
            }}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowSuggestions(false);
                setShowRecentDropdown(recentSearches.length > 0);
              }}
              className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : isLoadingSuggestions || isSearching ? (
            <Loader2 className="w-3.5 h-3.5 text-slate-400 absolute right-3 animate-spin" />
          ) : null}
        </div>

        {/* Recent Searches Dropdown on Focus (Headerless) */}
        {isMounted && showRecentDropdown && recentSearches.length > 0 && !searchQuery && (
          <div
            ref={recentBoxRef}
            className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden py-1.5 animate-in fade-in-50 duration-150"
          >
            <div className="px-3.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-emerald-500" />
                <span>Recent</span>
              </div>
              <button
                type="button"
                onClick={handleClearAllRecentSearches}
                className="text-[10px] text-slate-400 hover:text-rose-500 lowercase cursor-pointer transition-colors"
              >
                clear all
              </button>
            </div>
            {recentSearches.map((term, idx) => (
              <div
                key={`${term}-${idx}`}
                className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-emerald-50/70 transition-colors flex items-center justify-between group"
              >
                <button
                  type="button"
                  onClick={() => handleSelectRecentSearch(term)}
                  className="flex-1 text-left flex items-center gap-2 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  <span className="font-medium text-slate-800">{term}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRemoveSingleRecent(term, e)}
                  className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                  title="Remove from history"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && searchQuery.length >= 2 && (
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

      {/* User's Past Searches Chips (Headerless) */}
      {isMounted && recentSearches.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap px-0.5">
          <div className="flex items-center gap-1 text-slate-400 pl-0.5 pr-1 shrink-0" title="Recent searches">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          {recentSearches.map((term, idx) => (
            <span
              key={`${term}-${idx}`}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 hover:border-emerald-400 hover:shadow-2xs transition-all"
            >
              <button
                type="button"
                onClick={() => handleSelectRecentSearch(term)}
                className="font-medium hover:text-emerald-700 cursor-pointer"
              >
                {term}
              </button>
              <button
                type="button"
                onClick={(e) => handleRemoveSingleRecent(term, e)}
                className="text-slate-400 hover:text-rose-500 cursor-pointer rounded-full p-0.5 transition-colors"
                title="Remove"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={handleClearAllRecentSearches}
            className="text-[11px] text-slate-400 hover:text-rose-500 font-medium px-1.5 py-1 cursor-pointer transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Catalog / Favorites / Recent Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`text-xs font-bold pb-1 px-1 border-b-2 transition-all cursor-pointer ${
            activeTab === "catalog"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          All Foods
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={`text-xs font-bold pb-1 px-1 border-b-2 flex items-center gap-1 transition-all cursor-pointer ${
            activeTab === "favorites"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
          Favorites {isMounted && favorites.length > 0 ? `(${favorites.length})` : ""}
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          className={`text-xs font-bold pb-1 px-1 border-b-2 flex items-center gap-1 transition-all cursor-pointer ${
            activeTab === "recent"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-3 h-3 text-indigo-500" />
          Recent {isMounted && recentLoggedFoods.length > 0 ? `(${recentLoggedFoods.length})` : ""}
        </button>
      </div>

      {/* Category Filter Pills (When on Catalog tab) */}
      {activeTab === "catalog" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 pl-1 pr-0.5 shrink-0">
            <Filter className="w-3 h-3 text-slate-400" />
          </div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-1 px-2.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Error State Banner */}
      {searchError && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{searchError}</span>
          </div>
          <button
            onClick={fetchSearchResults}
            className="text-[11px] font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Tab 3: Recent Logged Foods View */}
      {activeTab === "recent" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-1">
            <span>Recently Logged Foods</span>
            {recentLoggedFoods.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRecentLoggedFoods([]);
                  try {
                    localStorage.removeItem("calzy_recent_logged_foods");
                  } catch {
                    // ignore
                  }
                }}
                className="text-[11px] text-slate-400 hover:text-rose-500 font-medium cursor-pointer"
              >
                Clear history
              </button>
            )}
          </div>

          {recentLoggedFoods.length > 0 ? (
            recentLoggedFoods.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("meal", item.meal);
                  if (searchQuery) params.set("q", searchQuery);
                  if (activeDate) params.set("date", activeDate);
                  router.push(`/food/${encodeURIComponent(item.food_id)}?${params.toString()}`);
                }}
                className="p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-emerald-300 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-600 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.meal}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.portion_label}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 mt-1">{item.name}</h3>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <span className="text-sm font-black text-emerald-700">{item.calories}</span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5">kcal</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
              <Clock className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-bold text-slate-700">No recently logged foods yet</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Foods you review and log will automatically appear here for fast 1-click re-logging!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("catalog")}
                className="mt-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Browse Foods
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Favorites Empty State */}
      {activeTab === "favorites" && displayedFoods.length === 0 && (
        <div className="p-6 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
          <Star className="w-8 h-8 text-amber-300 fill-amber-100" />
          <p className="text-xs font-bold text-slate-700">No favorites bookmarked yet</p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Tap the star icon ⭐ on any food to pin your daily favorites here for instant access!
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className="mt-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            Explore Foods
          </button>
        </div>
      )}

      {/* Food Results List Header (No count of 21 shown) */}
      {activeTab !== "recent" && (
        <div className="flex items-center justify-between pt-1 border-b border-slate-200/80 pb-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            {activeTab === "favorites" ? (
              <span>Favorite Foods</span>
            ) : searchQuery ? (
              <span>Results for &quot;{searchQuery}&quot;</span>
            ) : selectedCategory !== "All" ? (
              <span>{selectedCategory}</span>
            ) : (
              <span>Food Catalog</span>
            )}
          </div>
          {isSearching && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" /> Searching...
            </span>
          )}
        </div>
      )}

      {/* Food Results Cards (Clean cards with no brand/source tags, opens on next page) */}
      {activeTab !== "recent" && (
        <div className="flex flex-col gap-2">
          {displayedFoods.map((food) => {
            const isFavorite = favorites.includes(food.id);

            return (
              <div
                key={food.id}
                onClick={() => handleSelectFoodSummary(food)}
                className="p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-emerald-300 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      {food.category}
                    </span>
                    <span className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                      {food.servings_count > 1 ? `${food.servings_count} portions` : "Portion options"}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 mt-1 truncate group-hover:text-emerald-700 transition-colors">
                    {food.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    P: {food.protein_per_100g}g • C: {food.carbs_per_100g}g • F: {food.fat_per_100g}g (per 100g)
                  </p>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900">
                      {food.calories_per_100g}
                    </span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5">kcal/100g</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(food.id, e)}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      isFavorite
                        ? "text-amber-500 hover:text-amber-600"
                        : "text-slate-300 hover:text-amber-400"
                    }`}
                    title={isFavorite ? "Remove favorite" : "Bookmark favorite"}
                  >
                    <Star className={`w-4 h-4 ${isFavorite ? "fill-amber-400" : ""}`} />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>
            );
          })}

          {!isSearching && displayedFoods.length === 0 && activeTab === "catalog" && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No foods found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No foods found matching &quot;{searchQuery}&quot; in {selectedCategory}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-3 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Reset filters & show all foods
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AddFoodPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="p-12 text-center flex flex-col items-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          Loading foods...
        </div>
      }>
        <AddFoodContent />
      </Suspense>
    </AppShell>
  );
}
