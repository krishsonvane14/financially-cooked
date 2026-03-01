"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  DollarSign,
  Loader2,
  Skull,
  TrendingDown,
  User,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import ExpenseForm from "@/components/ExpenseForm";
import SabotageAttackModal, { Player } from "@/components/SabotageAttackModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTheme, Theme } from "@/src/context/ThemeContext";

/* ── Types ──────────────────────────────────────────────────────────────── */

type ProfileResponse = {
  persona: string;
  theme_preference: Theme | string;
  monthly_limit: number;
  roast?: string;
};

type LeaderboardEntry = {
  id: string;
  username?: string;
  persona: string;
  monthly_limit: number;
};

/* ── Theme visual tokens ────────────────────────────────────────────────── */

const THEME_VIZ: Record<Theme, { sfx?: string }> = {
  vanilla: {},
  brainrot: { sfx: "/assets/sound-effects/fahh-but-louder.mp3" },
  girlmath: { sfx: "/assets/sound-effects/girlmath.mp3" },
};

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const isTheme = (v: string): v is Theme => v === "vanilla" || v === "brainrot" || v === "girlmath";
const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/* ── Component ──────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { userId } = useAuth();
  const { theme, setTheme } = useTheme();
  const viz = THEME_VIZ[theme];

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ── Fetch profile ──────────────────────────────────────────────────── */

  useEffect(() => {
    if (!userId) { setProfileLoading(false); return; }

    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/profile/${userId}`);
        if (res.status === 404) { setProfile(null); return; }
        if (!res.ok) { console.error("Profile fetch failed:", await res.text()); setProfile(null); return; }

        const data = (await res.json()) as ProfileResponse;
        setProfile(data);
        if (typeof data.theme_preference === "string" && isTheme(data.theme_preference)) {
          setTheme(data.theme_preference);
        }
      } catch (e) { console.error("Profile fetch error:", e); setProfile(null); }
      finally { setProfileLoading(false); }
    })();
  }, [setTheme, userId]);

  /* ── Fetch leaderboard for sabotage targets ─────────────────────────── */

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/leaderboard`);
        if (!res.ok) { setPlayers([]); return; }
        const data = await res.json();
        const rankings: LeaderboardEntry[] = Array.isArray(data.rankings) ? data.rankings : [];
        setPlayers(
          rankings
            .filter((r) => r.id && r.id !== userId)
            .map((r) => ({ id: r.id, name: r.username || r.persona || "Unknown", avatar: "🎯" })),
        );
      } catch { setPlayers([]); }
      finally { setPlayersLoading(false); }
    })();
  }, [userId]);

  /* ── SFX playback ───────────────────────────────────────────────────── */

  useEffect(() => {
    if (!viz.sfx || !sfxEnabled) { audioRef.current?.pause(); return; }
    const a = new Audio(viz.sfx);
    a.loop = true; a.volume = 0.25; a.play().catch(() => {});
    audioRef.current = a;
    return () => { a.pause(); a.currentTime = 0; };
  }, [viz.sfx, sfxEnabled]);

  /* ── Derived ────────────────────────────────────────────────────────── */

  const budget = profile?.monthly_limit ?? 0;
  const roast = useMemo(() => {
    if (profileLoading) return "Loading...";
    if (!profile) return "Take the quiz to unlock your persona.";
    return profile.roast || "Your finances are under surveillance.";
  }, [profile, profileLoading]);

  async function handleAttack(victimId: string, penalty: number) {
    if (!userId) return;
    try {
      await fetch(`${apiBase}/api/sabotage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attacker_id: userId, victim_id: victimId, penalty }),
      });
    } catch (e) { console.error("Sabotage failed:", e); }
  }

  /* ── Metric cards ───────────────────────────────────────────────────── */

  const metrics = [
    {
      label: "Monthly Budget",
      value: budget > 0 ? USD.format(budget) : "—",
      sub: budget > 0 ? "AI-calculated limit" : "Take the quiz first",
      icon: <DollarSign className="h-5 w-5" />,
      accent: "text-emerald-500 dark:text-emerald-400",
      ring: "ring-emerald-500/10",
    },
    {
      label: "Persona",
      value: profileLoading ? "..." : profile?.persona ?? "???",
      sub: profile?.persona ? "AI-assigned identity" : "Unknown entity",
      icon: <User className="h-5 w-5" />,
      accent: "text-amber-500 dark:text-amber-400",
      ring: "ring-amber-500/10",
    },
    {
      label: "Threat Level",
      value: budget < 200 ? "COOKED" : budget < 400 ? "MID" : "SAFE",
      sub: roast,
      icon: budget < 200 ? <Skull className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />,
      accent: budget < 200 ? "text-red-500" : budget < 400 ? "text-yellow-500" : "text-emerald-500",
      ring: budget < 200 ? "ring-red-500/10" : "ring-zinc-500/10",
    },
  ];

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl px-6">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Dashboard</h2>
        <div className="flex items-center gap-2">
          {viz.sfx && (
            <Button size="icon" variant="ghost" onClick={() => setSfxEnabled((p) => !p)} className="h-8 w-8 rounded-full">
              {sfxEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          )}
          {playersLoading ? (
            <Button size="sm" variant="destructive" disabled className="gap-2 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Targets
            </Button>
          ) : (
            <SabotageAttackModal players={players} onAttack={handleAttack} />
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* Metric cards */}
        {profileLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{m.label}</p>
                    <p className="mt-2 truncate text-2xl font-black">{m.value}</p>
                    <p className="mt-1 truncate text-xs text-zinc-500">{m.sub}</p>
                  </div>
                  <div className={`shrink-0 rounded-xl p-2.5 ring-1 ${m.ring} ${m.accent}`}>
                    {m.icon}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Expense Form + Sabotage zone */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <ExpenseForm userId={userId ?? null} />
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-red-500/10 p-4">
              <Zap className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-black">Sabotage Zone</h3>
            <p className="max-w-sm text-sm text-zinc-500">
              Choose a target from the header and drain their budget. Every dollar you steal pushes them closer to being <span className="font-bold text-red-500">financially cooked</span>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
