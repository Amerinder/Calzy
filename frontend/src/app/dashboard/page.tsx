"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DateHeader } from "@/components/ui/DateHeader";
import { CalorieRing } from "@/components/ui/CalorieRing";
import { MacroBar } from "@/components/ui/MacroBar";
import { MealCard } from "@/components/ui/MealCard";
import {
  mockDailySummary,
  mockMacros,
  mockMeals,
} from "@/lib/mockData";
import { Plus, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { CalculatedTargets } from "@/lib/calculator";

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState("Today, 15 Apr 2026");
  const [isDemoOverTarget, setIsDemoOverTarget] = useState(false);
  const [activeTarget, setActiveTarget] = useState<CalculatedTargets | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("calzy_active_target");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // If Supabase is configured, fetch live daily target snapshot
    if (isSupabaseConfigured) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const today = new Date().toISOString().split("T")[0];
          supabase
            .from("daily_targets")
            .select("*")
            .eq("user_id", user.id)
            .eq("effective_date", today)
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
  }, []);

  const target = activeTarget?.calorie_target || mockDailySummary.targetKcal;
  const consumed = isDemoOverTarget ? target + 250 : mockDailySummary.consumedKcal;

  // Dynamic macro targets
  const proteinTarget = activeTarget?.protein_g || mockMacros[0].targetGrams;
  const carbsTarget = activeTarget?.carbs_g || mockMacros[1].targetGrams;
  const fatTarget = activeTarget?.fat_g || mockMacros[2].targetGrams;

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        {/* Date Selector Header */}
        <DateHeader
          currentDate={currentDate}
          onPrevDay={() => setCurrentDate("Yesterday, 14 Apr 2026")}
          onNextDay={() => setCurrentDate("Tomorrow, 16 Apr 2026")}
          onTodayClick={() => setCurrentDate("Today, 15 Apr 2026")}
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
            consumed={consumed}
            target={target}
            size={185}
            strokeWidth={13}
          />

          {activeTarget && (
            <div className="mt-1 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Mifflin-St Jeor Target: {target.toLocaleString()} kcal</span>
            </div>
          )}
        </section>

        {/* Macronutrient Progress Bars */}
        <section className="flex flex-col gap-1.5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Macronutrients
          </h2>

          <div className="grid grid-cols-3 gap-2">
            <MacroBar
              name="Protein"
              consumed={isDemoOverTarget ? proteinTarget + 15 : mockMacros[0].consumedGrams}
              target={proteinTarget}
              color="#3B82F6"
              badgeBg="bg-blue-50"
              badgeText="text-blue-700"
            />
            <MacroBar
              name="Carbs"
              consumed={isDemoOverTarget ? carbsTarget + 30 : mockMacros[1].consumedGrams}
              target={carbsTarget}
              color="#F59E0B"
              badgeBg="bg-amber-50"
              badgeText="text-amber-700"
            />
            <MacroBar
              name="Fat"
              consumed={isDemoOverTarget ? fatTarget + 10 : mockMacros[2].consumedGrams}
              target={fatTarget}
              color="#EC4899"
              badgeBg="bg-rose-50"
              badgeText="text-rose-700"
            />
          </div>
        </section>

        {/* Meals Section */}
        <section className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today&apos;s Meals
            </h2>
            <Link
              href="/add-food"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Item</span>
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            {mockMeals.map((meal) => (
              <MealCard key={meal.type} meal={meal} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
