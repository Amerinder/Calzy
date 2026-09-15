import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 tracking-tight"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400
            transition-all duration-150 outline-none
            focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${icon ? "pl-10" : ""}
            ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15" : ""}
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="text-[11px] font-medium text-rose-600 mt-0.5">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
      )}
    </div>
  );
}
