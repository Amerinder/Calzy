"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DateHeader } from "@/components/ui/DateHeader";
import { CalorieRing } from "@/components/ui/CalorieRing";
import { MacroBar } from "@/components/ui/MacroBar";
import { MealCard } from "@/components/ui/MealCard";
import {
  getTodayDateString,
  formatDisplayDate,
  getDailyMeals,
  deleteMealItem,
  DailyAggregatedTotals,
  MEAL_TYPES,
  MEAL_TITLES,
} from "@/lib/api/meals";
import { Plus, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { CalculatedTargets } from "@/lib/calculator";

export default function DashboardPage() {
  const [activeDateStr, setActiveDateStr] = useState<string>(() => getTodayDateString());
  const [isDemoOverTarget, setIsDemoOverTarget] = useState(false);
  const [activeTarget, setActiveTarget] = useState<CalculatedTargets | null>(null);
  const [dailyData, setDailyData] = useState<DailyAggregatedTotals | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Load daily meal data
  const loadDailyData = useCallback(async (date: string) => {
    try {
      const data = await getDailyMeals(date);
      setDailyData(data);
    } catch {
      // ignore
    }
  }, []);

  // Initial mount & hydration
  useEffect(() => {
    setIsMounted(true);

    try {
      const saved = localStorage.getItem("calzy_active_target");
      if (saved) {
        setActiveTarget(JSON.parse(saved));
      }
    } catch {
      // ignore
    }

    loadDailyData(activeDateStr);

    // If Supabase is configured, fetch live daily target snapshot
    if (isSupabaseConfigured) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from("daily_targets")
            .select("*")
            .eq("user_id", user.id)
            .eq("effective_date", activeDateStr)
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                setActiveTarget({
                  bmr: data.bmr,
                  tdee: data.tdee,
                  calorie_target: data.calorie_target,
                  protein_g: data.protein_g,
                  protein_kcal: Math.round(data.protein_g * 4),
                  protein_pct: Math.round(((data.protein_g * 4) / data.calorie_target) * 100),
                  carbs_g: data.carbs_g,
                  carbs_kcal: Math.round(data.carbs_g * 4),
                  carbs_pct: Math.round(((data.carbs_g * 4) / data.calorie_target) * 100),
                  fat_g: data.fat_g,
                  fat_kcal: Math.round(data.fat_g * 9),
                  fat_pct: Math.round(((data.fat_g * 9) / data.calorie_target) * 100),
                  activity_multiplier: 1.55,
                  goal_adjustment_kcal: 0,
                });
              }
            });
        }
      });
    }

    // Subscribe to cross-component meal update events
    const handleMealsUpdated = () => {
      loadDailyData(activeDateStr);
    };

    window.addEventListener("calzy_meals_updated", handleMealsUpdated);
    window.addEventListener("storage", handleMealsUpdated);

    return () => {
      window.removeEventListener("calzy_meals_updated", handleMealsUpdated);
      window.removeEventListener("storage", handleMealsUpdated);
    };
  }, [activeDateStr, loadDailyData]);

  // Date navigation handlers
  const handleShiftDay = (delta: number) => {
    const [y, m, d] = activeDateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + delta);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const nextDateStr = `${year}-${month}-${day}`;
    setActiveDateStr(nextDateStr);
    loadDailyData(nextDateStr);
  };

  const handleResetToToday = () => {
    const today = getTodayDateString();
    setActiveDateStr(today);
    loadDailyData(today);
  };

  // Item deletion handler: removes item and immediately updates all progress bars
  const handleDeleteItem = async (itemId: string) => {
    await deleteMealItem(itemId);
    await loadDailyData(activeDateStr);
  };

  // Calorie and Macro targets
  const targetCalories = activeTarget?.calorie_target || 2050;
  const consumedCalories = isDemoOverTarget
    ? targetCalories + 280
    : dailyData?.calories ?? 0;

  const targetProtein = activeTarget?.protein_g || 140;
  const consumedProtein = isDemoOverTarget
    ? targetProtein + 18
    : dailyData?.protein_g ?? 0;

  const targetCarbs = activeTarget?.carbs_g || 220;
  const consumedCarbs = isDemoOverTarget
    ? targetCarbs + 35
    : dailyData?.carbs_g ?? 0;

  const targetFat = activeTarget?.fat_g || 65;
  const consumedFat = isDemoOverTarget
    ? targetFat + 12
    : dailyData?.fat_g ?? 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-4 pb-8">
        {/* Date Selector Header */}
        <DateHeader
          currentDate={isMounted ? formatDisplayDate(activeDateStr) : "Today"}
          onPrevDay={() => handleShiftDay(-1)}
          onNextDay={() => handleShiftDay(1)}
          onTodayClick={handleResetToToday}
        />

        {/* Anchor Calorie Ring Card */}
        <section className="bg-white border border-slate-100 rounded-3xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -z-10 opacity-70 pointer-events-none" />

          <div className="flex items-center justify-between px-1 mb-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Daily Calorie Anchor
              </h2>
            </div>

            {/* Interactive demo toggle to test overage state */}
            <button
              onClick={() => setIsDemoOverTarget(!isDemoOverTarget)}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Click to preview over-target state"
            >
              {isDemoOverTarget ? "Simulate: Normal" : "Simulate: Over Target"}
            </button>
          </div>

          <CalorieRing
            consumed={consumedCalories}
            target={targetCalories}
            size={185}
            strokeWidth={13}
          />

          {activeTarget && (
            <div className="mt-1 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Target: {targetCalories.toLocaleString()} kcal</span>
            </div>
          )}
        </section>

        {/* Macronutrient Progress Bars (Dynamically update as foods are added/removed) */}
        <section className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Macronutrients
            </h2>
            {dailyData && dailyData.total_items_count > 0 && (
              <span className="text-[11px] text-slate-400 font-medium">
                {dailyData.total_items_count} {dailyData.total_items_count === 1 ? "item logged" : "items logged"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MacroBar
              name="Protein"
              consumed={consumedProtein}
              target={targetProtein}
              color="#3B82F6"
              badgeBg="bg-blue-50"
              badgeText="text-blue-700"
            />
            <MacroBar
              name="Carbs"
              consumed={consumedCarbs}
              target={targetCarbs}
              color="#F59E0B"
              badgeBg="bg-amber-50"
              badgeText="text-amber-700"
            />
            <MacroBar
              name="Fat"
              consumed={consumedFat}
              target={targetFat}
              color="#EC4899"
              badgeBg="bg-rose-50"
              badgeText="text-rose-700"
            />
          </div>
        </section>

        {/* Meals Section with Real-Time Items & Deletion */}
        <section className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today&apos;s Meals
            </h2>
            <Link
              href={`/add-food?date=${activeDateStr}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Item</span>
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            {MEAL_TYPES.map((type) => {
              const mealCategory = dailyData?.meals[type] || {
                type,
                title: MEAL_TITLES[type],
                items: [],
                total_calories: 0,
                total_protein_g: 0,
                total_carbs_g: 0,
                total_fat_g: 0,
                total_fiber_g: 0,
              };

              return (
                <MealCard
                  key={type}
                  meal={mealCategory}
                  onDeleteItem={handleDeleteItem}
                  targetDate={activeDateStr}
                />
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
