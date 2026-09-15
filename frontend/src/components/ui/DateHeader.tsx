import React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface DateHeaderProps {
  currentDate?: string;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  onTodayClick?: () => void;
}

export function DateHeader({
  currentDate = "Today, 15 Apr 2026",
  onPrevDay,
  onNextDay,
  onTodayClick,
}: DateHeaderProps) {
  return (
    <div className="w-full flex items-center justify-between py-2 px-1">
      {/* Previous Day */}
      <button
        onClick={onPrevDay}
        className="w-8 h-8 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Date Display & Today Shortcut */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTodayClick}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full hover:border-emerald-300 transition-colors shadow-2xs cursor-pointer"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>{currentDate}</span>
        </button>
      </div>

      {/* Next Day */}
      <button
        onClick={onNextDay}
        className="w-8 h-8 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
        aria-label="Next day"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
