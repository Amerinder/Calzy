"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ActivityLevel, Gender, HealthGoal } from "@/lib/supabase/types";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Activity,
  TrendingUp,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [age, setAge] = useState("26");
  const [gender, setGender] = useState<Gender>("male");
  const [heightCm, setHeightCm] = useState("178");
  const [weightKg, setWeightKg] = useState("74");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<HealthGoal>("maintain");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedAge = parseInt(age, 10);
    const parsedHeight = parseFloat(heightCm);
    const parsedWeight = parseFloat(weightKg);

    // Validation
    if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120) {
      setErrorMsg("Age must be between 10 and 120 years.");
      return;
    }
    if (isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 300) {
      setErrorMsg("Height must be between 50 and 300 cm.");
      return;
    }
    if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 500) {
      setErrorMsg("Weight must be between 20 and 500 kg.");
      return;
    }

    setLoading(true);
    // Route to scientific calculation result screen
    const query = new URLSearchParams({
      age: parsedAge.toString(),
      gender,
      height: parsedHeight.toString(),
      weight: parsedWeight.toString(),
      activity: activityLevel,
      goal,
    });

    router.push(`/onboarding/result?${query.toString()}`);
    setLoading(false);
  };

  return (
    <AppShell showBottomNav={false}>
      <div className="flex flex-col gap-4 py-2">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-1.5 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/80">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Profile & Goal Setup</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Let&apos;s personalize your targets
          </h1>
          <p className="text-xs text-slate-600 max-w-xs">
            We use the Mifflin-St Jeor equation to calculate your exact metabolic rate and daily calorie targets.
          </p>
        </div>

        <Card className="p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Gender Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Biological Gender
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "male", label: "Male" },
                  { id: "female", label: "Female" },
                  { id: "other", label: "Other" },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(g.id as Gender)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      gender === g.id
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Age, Height, Weight Row */}
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Age (years)"
                type="number"
                min="10"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
              <Input
                label="Height (cm)"
                type="number"
                min="50"
                max="300"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                required
              />
              <Input
                label="Weight (kg)"
                type="number"
                step="0.1"
                min="20"
                max="500"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                required
              />
            </div>

            {/* Activity Level */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Activity Level
              </label>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: "sedentary", title: "Sedentary", desc: "Little or no exercise (desk job)" },
                  { id: "light", title: "Lightly Active", desc: "Light exercise 1-3 days/week" },
                  { id: "moderate", title: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
                  { id: "active", title: "Very Active", desc: "Hard exercise 6-7 days/week" },
                  { id: "very_active", title: "Extra Active", desc: "Heavy physical labor / 2x daily training" },
                ].map((act) => (
                  <div
                    key={act.id}
                    onClick={() => setActivityLevel(act.id as ActivityLevel)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      activityLevel === act.id
                        ? "border-emerald-500 bg-emerald-50/50 shadow-2xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{act.title}</div>
                      <div className="text-[11px] text-slate-500">{act.desc}</div>
                    </div>
                    {activityLevel === act.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Goal */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Primary Nutrition Goal
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "lose", label: "Lose Weight", icon: TrendingDown },
                  { id: "maintain", label: "Maintain", icon: Activity },
                  { id: "gain", label: "Gain Muscle", icon: TrendingUp },
                ].map((g) => {
                  const Icon = g.icon;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id as HealthGoal)}
                      className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        goal === g.id
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold">{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              className="gap-2 mt-1"
            >
              <span>Calculate & Save Target</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
