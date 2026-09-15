"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { mockCalendarData } from "@/lib/mockData";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState("2026-04-15");
  const [currentMonth, setCurrentMonth] = useState("April 2026");

  // April 2026 calendar days: 30 days
  const daysInMonth = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-04-${String(dayNum).padStart(2, "0")}`;
    const log = mockCalendarData[dateStr];
    return {
      day: dayNum,
      date: dateStr,
      log,
    };
  });

  const selectedLog = mockCalendarData[selectedDate];

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        {/* Month Header Navigation */}
        <div className="flex items-center justify-between py-1">
          <button
            onClick={() => setCurrentMonth("March 2026")}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <h1 className="text-sm font-extrabold text-slate-900">{currentMonth}</h1>
            <span className="text-[11px] text-emerald-600 font-semibold">
              6 Days Logged
            </span>
          </div>

          <button
            onClick={() => setCurrentMonth("May 2026")}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 py-1 border-b border-slate-100">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* April 2026 starts on Wednesday (3 empty slots) */}
          <div className="h-10" />
          <div className="h-10" />
          <div className="h-10" />

          {daysInMonth.map(({ day, date, log }) => {
            const isSelected = selectedDate === date;
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-600 text-white font-bold shadow-sm"
                    : log
                    ? "bg-white border border-slate-200/90 text-slate-800 hover:border-emerald-300"
                    : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <span className="text-xs">{day}</span>
                {log && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected
                        ? "bg-white"
                        : log.status === "met"
                        ? "bg-emerald-500"
                        : log.status === "over"
                        ? "bg-rose-500"
                        : "bg-amber-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Summary Card */}
        <Card className="p-4 mt-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Selected Day Summary
              </span>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                {selectedDate}
              </h2>
            </div>
            {selectedLog ? (
              <div
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  selectedLog.status === "met"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : selectedLog.status === "over"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {selectedLog.status === "met" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                <span className="capitalize">{selectedLog.status} Target</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">No logs for this date</span>
            )}
          </div>

          {selectedLog ? (
            <div className="pt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {selectedLog.calories} kcal consumed
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Target: {selectedLog.target} kcal
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-slate-700">
                    {Math.round((selectedLog.calories / selectedLog.target) * 100)}%
                  </span>
                </div>
              </div>

              {/* Monthly adherence mini insight */}
              <div className="flex items-center gap-2 text-xs text-slate-600 px-1">
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Weekly adherence: <strong>83%</strong> compliance on tracked days.</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400 italic">
              Tap any highlighted date with a dot to inspect historical meals.
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
