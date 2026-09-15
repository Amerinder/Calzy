"use client";

import React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export function AppShell({ children, showBottomNav = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col items-center justify-start antialiased text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Mobile-Only Centered Container */}
      <div className="w-full max-w-[430px] mx-auto min-h-screen bg-[#F8FAFC] flex flex-col shadow-xl md:border-x md:border-slate-200/80 relative">
        {/* Top Navbar */}
        <Navbar />

        {/* Scrollable Main Content */}
        <main className="flex-1 flex flex-col p-4 w-full overflow-y-auto pb-6">
          {children}
        </main>

        {/* Medical & Guidance Disclaimer Footer */}
        <Footer />

        {/* Bottom Navigation */}
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
