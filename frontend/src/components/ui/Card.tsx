import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "subtle" | "interactive";
}

export function Card({
  children,
  variant = "default",
  className = "",
  ...props
}: CardProps) {
  const baseStyles =
    "rounded-2xl border border-slate-100 bg-white transition-all duration-200";

  const variants = {
    default: "shadow-xs hover:border-slate-200",
    subtle: "bg-slate-50/70 border-slate-100",
    interactive:
      "shadow-xs hover:border-emerald-300 hover:shadow-md cursor-pointer active:scale-[0.99]",
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
