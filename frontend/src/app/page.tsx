"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Sparkles,
  ArrowRight,
  Flame,
  Search,
  Calendar,
  CheckCircle2,
  Calculator,
} from "lucide-react";

import Link from "next/link";

export default function LandingPage() {
  return (
    <AppShell showBottomNav={false}>
      <div className="flex flex-col gap-5 py-2">
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-3 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold tracking-wide shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Smart Nutrition Tracking</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight px-2">
            Track your nutrition. <br />
            <span className="text-emerald-600">Live healthier.</span>
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed max-w-xs px-2">
            Calculate your true calorie targets, search foods with practical portion sizes, and stay consistent every single day.
          </p>

          {/* Quick CTAs */}
          <div className="flex flex-col w-full gap-2.5 pt-2">
            <Link
              href="/dashboard"
              className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/dashboard"
              className="btn-secondary w-full py-3 text-sm flex items-center justify-center gap-1.5"
            >
              <span>Explore Demo Dashboard</span>
            </Link>
          </div>
        </section>

        {/* Visual Preview / Feature Card */}
        <section className="card-surface p-4 flex flex-col gap-3.5 mt-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Today&apos;s Nutrition Preview</h2>
                <p className="text-[11px] text-slate-500">Sample target calculation</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              Demo
            </span>
          </div>

          {/* Mock Calorie Ring / Bar Visual */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Remaining</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                740 <span className="text-xs font-medium text-slate-500">kcal</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Target: <span className="font-semibold text-slate-700">2,200 kcal</span>
              </div>
            </div>

            {/* Visual Ring Representation */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 stroke-current"
                  strokeWidth="3.5"
                  strokeDasharray="66, 100"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-slate-800">66%</span>
            </div>
          </div>

          {/* Macro Mini Progress Bars */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100">
              <div className="text-[10px] uppercase font-semibold text-blue-600">Protein</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">98 / 140g</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "70%" }}></div>
              </div>
            </div>

            <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100">
              <div className="text-[10px] uppercase font-semibold text-amber-600">Carbs</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">185 / 250g</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "74%" }}></div>
              </div>
            </div>

            <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100">
              <div className="text-[10px] uppercase font-semibold text-rose-600">Fat</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">44 / 65g</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: "67%" }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars List */}
        <section className="flex flex-col gap-2.5 pt-1">
          <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider px-1">
            Designed for Simplicity & Precision
          </h2>

          {/* Feature 1 */}
          <div className="card-surface p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900">BMR & TDEE Science</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Calculates true metabolic maintenance using Mifflin-St Jeor formulas rather than guesswork.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="card-surface p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
              <Search className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900">Practical Portions</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Log real portions like 1 roti, 2 eggs, or 1 cup, as well as exact gram weights.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="card-surface p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900">Historical Calendar</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Browse any previous day, review meal logs, and track weekly consistency with ease.
              </p>
            </div>
          </div>
        </section>

        {/* Phase Status Pill */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">Phase 0 Foundation Active</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            v0.1.0
          </span>
        </div>
      </div>
    </AppShell>
  );
}
