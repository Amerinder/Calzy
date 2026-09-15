"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { UserProfile } from "@/lib/supabase/types";
import { useRouter } from "next/navigation";
import {
  User,
  Calculator,
  LogOut,
  LogIn,
  KeyRound,
  Edit3,
} from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserEmail(user.email ?? null);
          const { data, error } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (!error && data) {
            setProfile(data as UserProfile);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const handleLogout = async () => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const displayName = profile?.name || (userEmail ? userEmail.split("@")[0] : "Demo Profile");

  const profileStats = [
    { label: "Age", value: profile?.age ? `${profile.age} yrs` : "26 yrs" },
    { label: "Gender", value: profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : "Male" },
    { label: "Height", value: profile?.height_cm ? `${profile.height_cm} cm` : "178 cm" },
    { label: "Weight", value: profile?.weight_kg ? `${profile.weight_kg} kg` : "74.0 kg" },
    { label: "Activity", value: profile?.activity_level ? profile.activity_level.replace("_", " ") : "Moderately Active" },
    { label: "Goal", value: profile?.goal ? profile.goal.toUpperCase() : "MAINTENANCE" },
  ];

  if (loading) {
    return (
      <AppShell>
        <LoadingState message="Loading your profile details..." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        {/* User Card */}
        <Card className="p-4 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-none shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white">{displayName}</h1>
                <span className="text-[10px] uppercase font-bold bg-white/25 px-2 py-0.5 rounded-full">
                  {userEmail ? "Verified" : "Demo"}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">{userEmail || "calzy.user@example.com"}</p>
            </div>
          </div>

          {userEmail ? (
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/login"
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              title="Sign In / Register"
            >
              <LogIn className="w-4 h-4" />
            </Link>
          )}
        </Card>

        {/* Supabase Status Banner */}
        {!isSupabaseConfigured ? (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3">
            <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-amber-900">
                Supabase Connection Needed
              </h2>
              <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                To sync your profile and save real data, add your Supabase credentials to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">frontend/.env.local</code>.
              </p>
            </div>
          </div>
        ) : !userEmail ? (
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-emerald-900">
                Sign In to Save Data
              </h2>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Create a private account to keep your meals across devices.
              </p>
            </div>
            <Link
              href="/login"
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
            >
              Sign In
            </Link>
          </div>
        ) : null}

        {/* Metabolic Targets Summary */}
        <Card className="p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Mifflin-St Jeor Targets
              </h2>
            </div>
            <Link
              href="/onboarding"
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Update Goals</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-3">
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400">
                Basal Metabolic Rate
              </span>
              <div className="text-base font-extrabold text-slate-800 mt-0.5">
                1,720 <span className="text-xs font-normal text-slate-500">kcal</span>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400">
                Daily TDEE Target
              </span>
              <div className="text-base font-extrabold text-slate-800 mt-0.5">
                2,200 <span className="text-xs font-normal text-slate-500">kcal</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Personal Attributes Grid */}
        <section className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Personal Metrics
            </h2>
            <Link
              href="/onboarding"
              className="text-xs text-emerald-600 font-semibold hover:underline"
            >
              Edit
            </Link>
          </div>

          <Card className="divide-y divide-slate-100">
            {profileStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between p-3 text-xs"
              >
                <span className="text-slate-500 font-medium">{stat.label}</span>
                <span className="font-bold text-slate-800">{stat.value}</span>
              </div>
            ))}
          </Card>
        </section>

        {/* Action Button */}
        {userEmail ? (
          <Button
            onClick={handleLogout}
            variant="danger"
            size="md"
            fullWidth
            className="gap-2 mt-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </Button>
        ) : (
          <Link href="/login" className="w-full">
            <Button
              variant="primary"
              size="md"
              fullWidth
              className="gap-2 mt-1"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Create Account</span>
            </Button>
          </Link>
        )}
      </div>
    </AppShell>
  );
}
