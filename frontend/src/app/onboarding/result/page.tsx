"use client";

import React, { Suspense, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { useSearchParams, useRouter } from "next/navigation";
import {
  calculateNutritionTargets,
} from "@/lib/calculator";
import { ActivityLevel, Gender, HealthGoal } from "@/lib/supabase/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  Flame,
  ArrowRight,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Activity,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

function OnboardingResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const age = parseInt(searchParams.get("age") || "26", 10);
  const gender = (searchParams.get("gender") as Gender) || "male";
  const heightCm = parseFloat(searchParams.get("height") || "178");
  const weightKg = parseFloat(searchParams.get("weight") || "74");
  const activityLevel = (searchParams.get("activity") as ActivityLevel) || "moderate";
  const goal = (searchParams.get("goal") as HealthGoal) || "maintain";

  const targets = useMemo(() => {
    return calculateNutritionTargets({
      age,
      gender,
      height_cm: heightCm,
      weight_kg: weightKg,
      activity_level: activityLevel,
      goal,
    });
  }, [age, gender, heightCm, weightKg, activityLevel, goal]);

  const handleSaveAndContinue = async () => {
    if (!targets) return;
    setLoading(true);

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const today = new Date().toISOString().split("T")[0];

          // 1. Save daily target snapshot for today
          await supabase.from("daily_targets").upsert(
            {
              user_id: user.id,
              effective_date: today,
              bmr: targets.bmr,
              tdee: targets.tdee,
              calorie_target: targets.calorie_target,
              protein_g: targets.protein_g,
              carbs_g: targets.carbs_g,
              fat_g: targets.fat_g,
            },
            { onConflict: "user_id,effective_date" }
          );

          // 2. Update user profile metrics
          await supabase.from("user_profiles").upsert(
            {
              user_id: user.id,
              age,
              gender,
              height_cm: heightCm,
              weight_kg: weightKg,
              activity_level: activityLevel,
              goal,
            },
            { onConflict: "user_id" }
          );
        }
      } catch (err) {
        console.error("Failed to persist target snapshot to Supabase:", err);
      }
    }

    // Also store active target in localStorage for instant client dashboard loading
    try {
      localStorage.setItem("calzy_active_target", JSON.stringify(targets));
    } catch {
      // Ignore storage errors
    }

    setSavedSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 700);
  };

  if (!targets) {
    return <LoadingState message="Calculating your personalized targets..." />;
  }

  const getGoalBadge = () => {
    switch (goal) {
      case "lose":
        return {
          icon: TrendingDown,
          text: "Weight Loss (-500 kcal/day)",
          color: "text-amber-700 bg-amber-50 border-amber-200",
        };
      case "gain":
        return {
          icon: TrendingUp,
          text: "Lean Muscle Gain (+350 kcal/day)",
          color: "text-blue-700 bg-blue-50 border-blue-200",
        };
      default:
        return {
          icon: Activity,
          text: "Maintenance Target (0 kcal offset)",
          color: "text-emerald-700 bg-emerald-50 border-emerald-200",
        };
    }
  };

  const goalBadge = getGoalBadge();
  const GoalIcon = goalBadge.icon;

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Header */}
      <div className="text-center flex flex-col items-center gap-1.5 pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/80">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Scientific Calculation Complete</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Your Personalized Targets
        </h1>
        <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
          Calculated using the Mifflin-St Jeor equation and standard sports nutrition macro ratios.
        </p>
      </div>

      {/* Primary Goal Target Card */}
      <Card className="p-4 bg-gradient-to-br from-white to-emerald-50/40 border-emerald-200/80 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Daily Calorie Target
              </span>
              <div className="text-2xl font-black text-slate-900 leading-tight">
                {targets.calorie_target.toLocaleString()} <span className="text-xs font-medium text-slate-500">kcal/day</span>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${goalBadge.color}`}>
            <GoalIcon className="w-3.5 h-3.5" />
            <span className="capitalize">{goal}</span>
          </div>
        </div>

        {/* Maintenance vs BMR comparison */}
        <div className="grid grid-cols-2 gap-2 pt-3">
          <div className="bg-white/80 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">
              BMR (Resting)
            </span>
            <div className="text-sm font-extrabold text-slate-800 mt-0.5">
              {targets.bmr.toLocaleString()} kcal
            </div>
            <span className="text-[10px] text-slate-400">Basic organ function</span>
          </div>

          <div className="bg-white/80 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">
              Maintenance TDEE
            </span>
            <div className="text-sm font-extrabold text-slate-800 mt-0.5">
              {targets.tdee.toLocaleString()} kcal
            </div>
            <span className="text-[10px] text-slate-400">{targets.activity_multiplier}x activity factor</span>
          </div>
        </div>
      </Card>

      {/* Macronutrient Distribution Card */}
      <Card className="p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Daily Macronutrient Targets
        </h2>

        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Protein */}
          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Protein</span>
            <div className="text-base font-black text-slate-900 mt-0.5">
              {targets.protein_g}g
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {targets.protein_pct}% • {targets.protein_kcal} kcal
            </span>
          </div>

          {/* Carbs */}
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Carbs</span>
            <div className="text-base font-black text-slate-900 mt-0.5">
              {targets.carbs_g}g
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {targets.carbs_pct}% • {targets.carbs_kcal} kcal
            </span>
          </div>

          {/* Fat */}
          <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
            <span className="text-[10px] font-bold text-rose-600 uppercase">Fat</span>
            <div className="text-base font-black text-slate-900 mt-0.5">
              {targets.fat_g}g
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {targets.fat_pct}% • {targets.fat_kcal} kcal
            </span>
          </div>
        </div>

        {/* Macro energy check pill */}
        <p className="text-[11px] text-slate-500 text-center mt-3 pt-2 border-t border-slate-100">
          Protein (4 kcal/g) • Carbs (4 kcal/g) • Fat (9 kcal/g) = {targets.protein_kcal + targets.carbs_kcal + targets.fat_kcal} kcal
        </p>
      </Card>

      {/* Snapshot Persistence Guarantee Notice */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex items-start gap-2.5 text-slate-600">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Daily Target Snapshot:</strong> This target is snapshot for today. If your fitness goals change next month, your past logged days will maintain their original targets for accurate history.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-amber-50/60 border border-amber-200/50 rounded-xl p-2.5">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-tight">
          This estimate is for general wellness guidance and does not replace medical or clinical advice.
        </p>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleSaveAndContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={loading || savedSuccess}
        className="gap-2 mt-1"
      >
        {savedSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Target Saved! Opening Dashboard...</span>
          </>
        ) : loading ? (
          <span>Saving Target Snapshot...</span>
        ) : (
          <>
            <span>Continue to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  );
}

export default function OnboardingResultPage() {
  return (
    <AppShell showBottomNav={false}>
      <Suspense fallback={<LoadingState message="Loading your calculated targets..." />}>
        <OnboardingResultContent />
      </Suspense>
    </AppShell>
  );
}
