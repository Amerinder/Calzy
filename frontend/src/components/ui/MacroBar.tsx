import React from "react";
import { ProgressBar } from "./ProgressBar";

interface MacroBarProps {
  name: "Protein" | "Carbs" | "Fat";
  consumed: number;
  target: number;
  unit?: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export function MacroBar({
  name,
  consumed,
  target,
  unit = "g",
  color,
  badgeBg,
  badgeText,
}: MacroBarProps) {
  const percent = target > 0 ? Math.round((consumed / target) * 100) : 0;

  return (
    <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-3 shadow-2xs hover:border-slate-200 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${badgeBg} ${badgeText}`}>
          {name}
        </span>
        <span className="text-[11px] font-bold text-slate-500">
          {percent}%
        </span>
      </div>

      <div className="my-1">
        <div className="text-base font-extrabold text-slate-900 leading-tight">
          {consumed}
          <span className="text-xs font-normal text-slate-400">/{target}{unit}</span>
        </div>
      </div>

      <ProgressBar
        value={consumed}
        max={target}
        color={color}
        size="sm"
        className="mt-2"
      />
    </div>
  );
}
