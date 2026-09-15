"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Calendar, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Today",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Add Food",
      href: "/add-food",
      icon: Plus,
      isPrimaryAction: true,
    },
    {
      label: "Calendar",
      href: "/calendar",
      icon: Calendar,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="sticky bottom-0 z-40 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-1.5 shadow-lg"
    >
      <div className="flex items-center justify-around w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimaryAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 group"
                aria-label="Add Food"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform duration-150 group-active:scale-95 ${
                    isActive
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 min-w-[56px] rounded-xl transition-all duration-150 ${
                isActive
                  ? "text-emerald-600 font-bold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              <span className="text-[10px] tracking-tight mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
