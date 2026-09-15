import React from "react";
import { Flame, AlertTriangle } from "lucide-react";

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

export function CalorieRing({
  consumed,
  target,
  size = 190,
  strokeWidth = 14,
}: CalorieRingProps) {
  const remaining = target - consumed;
  const isOver = remaining < 0;
  const overage = Math.abs(remaining);

  // SVG ring calculations
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  const percent = target > 0 ? Math.min(100, Math.max(0, (consumed / target) * 100)) : 0;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-3 relative">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          aria-label={`Calorie Ring: ${consumed} of ${target} kcal consumed`}
        >
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={isOver ? "#EF4444" : "#10B981"}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 select-none">
          {isOver ? (
            <>
              <div className="flex items-center gap-1 text-rose-600 font-semibold text-xs tracking-wider uppercase">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Over by</span>
              </div>
              <div className="text-3xl font-black text-rose-600 tracking-tight leading-none mt-1">
                {overage.toLocaleString()}
              </div>
              <span className="text-xs font-semibold text-rose-500 mt-0.5">kcal</span>
              <span className="text-[11px] text-slate-400 mt-1">
                Target: {target.toLocaleString()}
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 text-slate-500 font-medium text-xs uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-emerald-500" />
                <span>Remaining</span>
              </div>
              <div className="text-4xl font-black text-slate-900 tracking-tight leading-none mt-1">
                {remaining.toLocaleString()}
              </div>
              <span className="text-xs font-semibold text-slate-500 mt-0.5">kcal</span>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                {consumed.toLocaleString()} / {target.toLocaleString()} kcal
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
