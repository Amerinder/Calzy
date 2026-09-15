import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  variant?: "spinner" | "skeleton";
}

export function LoadingState({
  message = "Loading nutrition data...",
  variant = "spinner",
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className="w-full space-y-3 p-4 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 bg-slate-200 rounded-xl" />
          <div className="h-16 bg-slate-200 rounded-xl" />
          <div className="h-16 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-20 bg-slate-200 rounded-2xl w-full" />
        <div className="h-20 bg-slate-200 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/80 rounded-2xl">
      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mb-2" />
      <p className="text-xs font-medium text-slate-600">{message}</p>
    </div>
  );
}
