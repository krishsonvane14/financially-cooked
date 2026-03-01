"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  DollarSign,
  Flame,
  Skull,
  TrendingDown,
  User,
  Volume2,
  VolumeX,
  Wallet,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
} from "recharts";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseLog from "@/components/ExpenseLog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTheme, Theme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";

/* ── Types ──────────────────────────────────────────────────────────────── */

type ProfileResponse = {
  persona: string;
  theme_preference: Theme | string;
  monthly_limit: number;
  roast?: string;
};

interface Expense {
  id?: string;
  amount: number;
  category?: string;
  description?: string;
  created_at?: string;
}

/* ── Theme visual tokens ────────────────────────────────────────────────── */

const THEME_VIZ: Record<Theme, { sfx?: string }> = {
  vanilla: {},
  brainrot: { sfx: "/assets/sound-effects/shimmy-shimmy-ay.mp3" },
  girlmath: { sfx: "/assets/sound-effects/girlmath.mp3" },
};

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const isTheme = (v: string): v is Theme => v === "vanilla" || v === "brainrot" || v === "girlmath";
const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const CATEGORY_COLORS: Record<string, string> = {
  food: "#f59e0b",
  entertainment: "#8b5cf6",
  shopping: "#ec4899",
  transport: "#06b6d4",
  subscriptions: "#10b981",
  other: "#6b7280",
};

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food",
  entertainment: "Entertainment",
  shopping: "Shopping",
  transport: "Transport",
  subscriptions: "Subscriptions",
  other: "Other",
};

/* ── Cooked Meter ───────────────────────────────────────────────────────── */

function CookedMeter({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 120);

  let barColor = "bg-emerald-500";
  let glowColor = "";
  let shake = "";
  let label = "On Track";

  if (clamped >= 100) {
    barColor = "bg-red-600";
    glowColor = "shadow-[0_0_20px_rgba(239,68,68,0.6)]";
    shake = "animate-[screen-shake_0.12s_ease-in-out_infinite]";
    label = "🔥 COOKED 🔥";
  } else if (clamped >= 85) {
    barColor = "bg-red-500";
    glowColor = "shadow-[0_0_12px_rgba(239,68,68,0.4)]";
    shake = "animate-[screen-shake_0.25s_ease-in-out_infinite]";
    label = "DANGER";
  } else if (clamped >= 50) {
    barColor = "bg-yellow-500";
    shake = "animate-pulse";
    label = "Warning";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="uppercase tracking-widest text-zinc-400">Spending Progress</span>
        <span className={clamped >= 85 ? "text-red-500" : clamped >= 50 ? "text-yellow-500" : "text-emerald-500"}>
          {Math.round(clamped)}% — {label}
        </span>
      </div>
      <div className={`h-4 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 ${shake}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor} ${glowColor}`}
          style={{ width: `${Math.min(clamped, 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { userId } = useAuth();
  const { theme, setTheme } = useTheme();
  const viz = THEME_VIZ[theme];

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const heartbeatRef = useRef<HTMLAudioElement | null>(null);

  /* ── Fetch profile ──────────────────────────────────────────────────── */

  const fetchProfile = useCallback(async () => {
    if (!userId) { setProfileLoading(false); return; }
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
  }, [setTheme, userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  /* ── Fetch expenses ─────────────────────────────────────────────────── */

  const fetchExpenses = useCallback(async () => {
    if (!userId) { setExpensesLoading(false); return; }
    try {
      // Try with created_at first; fall back to without it if column doesn't exist
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: { data: any[] | null; error: any } = await supabase
        .from("expenses")
        .select("id, amount, category, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (result.error) {
        console.error("Expense fetch (with created_at) failed:", JSON.stringify(result.error, null, 2));
        // Retry without created_at ordering in case column is missing
        result = await supabase
          .from("expenses")
          .select("id, amount, category")
          .eq("user_id", userId);

        if (result.error) {
          console.error("Expense fetch (fallback) failed:", JSON.stringify(result.error, null, 2));
          setExpenses([]);
          return;
        }
      }

      setExpenses((result.data as Expense[]) ?? []);
    } catch (e) {
      console.error("Expense fetch unexpected error:", e instanceof Error ? { message: e.message, stack: e.stack } : e);
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  /* ── Realtime expense subscription ──────────────────────────────────── */

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`expenses-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "expenses", filter: `user_id=eq.${userId}` },
        () => { fetchExpenses(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchExpenses]);

  /* ── Realtime profile subscription ────────────────────────────────── */

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setProfile((prev) => ({
            persona: (row.persona as string) ?? prev?.persona ?? "???",
            theme_preference: (row.theme_preference as string) ?? prev?.theme_preference ?? "vanilla",
            monthly_limit: (row.monthly_limit as number) ?? prev?.monthly_limit ?? 0,
            roast: (row.roast as string) ?? prev?.roast,
          }));
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  /* ── SFX playback ───────────────────────────────────────────────────── */

  useEffect(() => {
    if (!viz.sfx || !sfxEnabled) { audioRef.current?.pause(); return; }
    const a = new Audio(viz.sfx);
    a.loop = true; a.volume = 0.25; a.play().catch(() => {});
    audioRef.current = a;
    return () => { a.pause(); a.currentTime = 0; };
  }, [viz.sfx, sfxEnabled]);

  /* ── Derived budget math ────────────────────────────────────────────── */

  const monthlyLimit = profile?.monthly_limit ?? 0;
  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0),
    [expenses],
  );
  const budgetLeft = monthlyLimit - totalSpent;
  const spentPct = monthlyLimit > 0 ? (totalSpent / monthlyLimit) * 100 : 0;
  const isCooked = spentPct >= 100;

  /* ── Lock to brainrot when cooked ───────────────────────────────────── */

  useEffect(() => {
    if (isCooked && theme !== "brainrot") {
      setTheme("brainrot");
    }
  }, [isCooked, theme, setTheme]);

  /* ── Heartbeat SFX at 85%+ ──────────────────────────────────────────── */

  useEffect(() => {
    if (spentPct >= 85 && spentPct < 100) {
      const hb = new Audio("/assets/sound-effects/heartbeat.mp3");
      hb.loop = true; hb.volume = 0.15; hb.play().catch(() => {});
      heartbeatRef.current = hb;
      return () => { hb.pause(); hb.currentTime = 0; };
    }
    heartbeatRef.current?.pause();
  }, [spentPct >= 85 && spentPct < 100]); // eslint-disable-line react-hooks/exhaustive-deps

  const roast = useMemo(() => {
    if (profileLoading) return "Loading...";
    if (!profile) return "Take the quiz to unlock your persona.";
    if (isCooked) return "You are beyond saving. Welcome to Brainrot.";
    return profile.roast || "Your finances are under surveillance.";
  }, [profile, profileLoading, isCooked]);

  /* ── Recharts data ──────────────────────────────────────────────────── */

  const pieChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      const cat = e.category || "other";
      map[cat] = (map[cat] ?? 0) + e.amount;
    }
    return Object.entries(map)
      .map(([name, value]) => ({
        name: CATEGORY_LABELS[name] || name,
        value: Math.round(value * 100) / 100,
        fill: CATEGORY_COLORS[name] || "#6b7280",
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Line chart data — cumulative spending over days this month
  const lineChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      const day = e.created_at
        ? new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      map[day] = (map[day] ?? 0) + e.amount;
    }

    // Sort chronologically and build cumulative
    const sorted = Object.entries(map)
      .map(([day, total]) => ({ day, daily: Math.round(total * 100) / 100 }))
      .reverse(); // oldest first

    let cumulative = 0;
    return sorted.map((d) => {
      cumulative += d.daily;
      return { ...d, cumulative: Math.round(cumulative * 100) / 100 };
    });
  }, [expenses]);

  /* ── Metric cards ───────────────────────────────────────────────────── */

  const metrics = [
    {
      label: "Monthly Budget",
      value: monthlyLimit > 0 ? USD.format(monthlyLimit) : "—",
      sub: monthlyLimit > 0 ? "AI-calculated limit" : "Take the quiz first",
      icon: <DollarSign className="h-5 w-5" />,
      accent: "text-emerald-500 dark:text-emerald-400",
      ring: "ring-emerald-500/10",
    },
    {
      label: "Total Spent",
      value: USD.format(totalSpent),
      sub: `${expenses.length} expense${expenses.length !== 1 ? "s" : ""} logged`,
      icon: <Flame className="h-5 w-5" />,
      accent: spentPct >= 85 ? "text-red-500" : spentPct >= 50 ? "text-yellow-500" : "text-amber-500 dark:text-amber-400",
      ring: spentPct >= 85 ? "ring-red-500/10" : "ring-amber-500/10",
    },
    {
      label: "Budget Left",
      value: USD.format(budgetLeft),
      sub: budgetLeft <= 0 ? "YOU ARE COOKED" : roast,
      icon: budgetLeft <= 0 ? <Skull className="h-5 w-5" /> : <Wallet className="h-5 w-5" />,
      accent: budgetLeft <= 0 ? "text-red-500" : budgetLeft < 100 ? "text-yellow-500" : "text-emerald-500",
      ring: budgetLeft <= 0 ? "ring-red-500/10" : "ring-zinc-500/10",
    },
  ];

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className={`flex-1 overflow-y-auto ${isCooked ? "border-2 border-red-500/40" : ""}`}>
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">

        {/* ── Persona Hero Card (full-width) ── */}
        {profileLoading ? (
          <Skeleton className="h-44 w-full rounded-2xl" />
        ) : (
          <section className="relative overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] backdrop-blur-xl p-8 shadow-sm">
            {/* subtle accent glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--theme-primary)]/5 blur-[80px]" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">
                  Current Diagnosis
                </p>
                <h1 className="mt-2 truncate text-4xl font-black leading-tight text-[var(--theme-text)] sm:text-5xl">
                  {profile?.persona ?? (
                    <span className="text-zinc-400">Take the quiz first</span>
                  )}
                </h1>
                <p className="mt-2 max-w-md text-sm text-[var(--theme-text-muted)]">
                  {roast}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
                  <User className="h-8 w-8 text-[var(--theme-primary)]" />
                </div>
                {isCooked && (
                  <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]">
                    🔥 COOKED
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Metric cards (3-col) ── */}
        {profileLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="group relative overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] backdrop-blur-xl p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">{m.label}</p>
                    <p className="mt-2 truncate text-2xl font-black text-[var(--theme-text)]">{m.value}</p>
                    <p className="mt-1 truncate text-xs text-[var(--theme-text-muted)]">{m.sub}</p>
                  </div>
                  <div className={`shrink-0 rounded-xl p-2.5 ring-1 ${m.ring} ${m.accent}`}>
                    {m.icon}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Cooked Progression Meter ── */}
        {!profileLoading && monthlyLimit > 0 && (
          <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] backdrop-blur-xl p-5 shadow-sm">
            <CookedMeter pct={spentPct} />
          </section>
        )}

        {/* ── Charts row ── */}
        {!expensesLoading && expenses.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Spending over time */}
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] backdrop-blur-xl p-5 shadow-sm">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">Spending Over Time</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="#3f3f46" />
                  <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="#3f3f46" width={55} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, fontSize: 12, color: "#f4f4f5" }}
                    labelStyle={{ color: "#a1a1aa" }}
                    formatter={(value?: number | string, name?: string) => [
                      USD.format(Number(value ?? 0)),
                      name === "cumulative" ? "Total" : "Daily",
                    ]}
                  />
                  <Line type="monotone" dataKey="cumulative" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", r: 4, strokeWidth: 2, stroke: "#18181b" }} activeDot={{ r: 6, fill: "#ef4444" }} name="cumulative" />
                  <Line type="monotone" dataKey="daily" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 5" dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }} name="daily" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Expenses by category */}
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] backdrop-blur-xl p-5 shadow-sm">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">Expenses by Category</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} strokeWidth={2} stroke="#18181b">
                      {pieChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, fontSize: 12, color: "#f4f4f5" }}
                      formatter={(value?: number | string) => [USD.format(Number(value ?? 0)), "Spent"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {pieChartData.map((c) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ background: c.fill }} />
                      <span className="text-[var(--theme-text-muted)]">{c.name}</span>
                      <span className="ml-auto font-mono font-bold tabular-nums text-[var(--theme-text)]">{USD.format(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Expense Form + Expense Log (2-col) ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] backdrop-blur-xl p-6 shadow-sm">
            <ExpenseForm userId={userId ?? null} onSubmit={() => fetchExpenses()} />
          </div>
          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] backdrop-blur-xl p-6 shadow-sm">
            {userId && (
              <ExpenseLog
                userId={userId}
                onBudgetUpdate={() => { fetchProfile(); fetchExpenses(); }}
              />
            )}
          </div>
        </section>

        {/* ── SFX toggle (floating, for themed audio) ── */}
        {viz.sfx && (
          <div className="fixed bottom-6 right-6 z-30">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setSfxEnabled((p) => !p)}
              className="h-10 w-10 rounded-full border-[var(--theme-border)] bg-[var(--theme-card)] shadow-lg"
            >
              {sfxEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
