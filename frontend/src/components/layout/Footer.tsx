import React from "react";
import { ShieldAlert } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-slate-100 bg-white/70 px-4 py-5">
      <div className="flex flex-col gap-3 text-center">
        {/* Medical disclaimer note */}
        <div className="flex items-start gap-2 bg-amber-50/80 border border-amber-200/60 rounded-xl p-2.5 text-left">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-amber-800">
            <strong>Guidance Only:</strong> Nutrition values are standardized estimates based on verified database reference entries. Calzy does not provide medical or clinical prescription advice.
          </p>
        </div>

        {/* Brand & copyright */}
        <div className="text-xs text-slate-500 pt-1 flex items-center justify-center gap-1">
          <span>Calzy © {new Date().getFullYear()}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            Precision Nutrition
          </span>
        </div>
      </div>
    </footer>
  );
}
