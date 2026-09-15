import React from "react";

interface ProgressBarProps {
  value: number; // Current value
  max: number;   // Maximum target
  color?: string; // Bar color
  trackColor?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max,
  color = "#10B981",
  trackColor = "bg-slate-100",
  size = "md",
  showLabel = false,
  className = "",
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const isOver = value > max;

  const heights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5",
  };

  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-600">
          <span>{percentage}%</span>
          {isOver && <span className="text-rose-500 font-semibold">Over Target</span>}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={`w-full ${trackColor} ${heights[size]} rounded-full overflow-hidden`}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: isOver ? "#EF4444" : color,
          }}
        />
      </div>
    </div>
  );
}
