"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useTheme, Theme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import SabotageAttackModal, { Player } from "@/components/SabotageAttackModal";
import ExpenseForm from "@/components/ExpenseForm";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Crosshair,
  DollarSign,
  Flame,
  Loader2,
  Palette,
  Radio,
  ShieldAlert,
  Skull,
  Sparkles,
  TrendingDown,
  User,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Framer presets ───────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

// ── Theme visual map ─────────────────────────────────────────────────────────
const THEMES: Record<
  Theme,
  {
    label: string;
    accent: string;
    accentBorder: string;
    bg: string;
    cardBg: string;
    gif?: string;
    sfx?: string;
    icon: React.ReactNode;
    glow: string;
  }
> = {
  vanilla: {
    label: "Vanilla",
    accent: "text-zinc-300",
    accentBorder: "border-zinc-800",
    bg: "from-[#09090b] via-[#0c0c0f] to-[#09090b]",
    cardBg: "bg-zinc-900/60",
    icon: <Sparkles className="h-4 w-4" />,
    glow: "rgba(161,161,170,0.06)",
  },
  brainrot: {
    label: "Brainrot",
    accent: "text-red-500",
    accentBorder: "border-red-900/40",
    bg: "from-[#09090b] via-[#1a0505] to-[#09090b]",
    cardBg: "bg-red-950/20",
    gif: "/assets/gifs/wallet-empty.gif",
    sfx: "/assets/sound-effects/fahh-but-louder.mp3",
    icon: <Skull className="h-4 w-4" />,
    glow: "rgba(239,68,68,0.08)",
  },
  girlmath: {
    label: "Girl Math",
    accent: "text-pink-400",
    accentBorder: "border-pink-900/40",
    bg: "from-[#09090b] via-[#1a0515] to-[#09090b]",
    cardBg: "bg-pink-950/20",
    gif: "/assets/gifs/girlmath.gif",
    sfx: "/assets/sound-effects/girlmath.mp3",
    icon: <Flame className="h-4 w-4" />,
    glow: "rgba(236,72,153,0.08)",
  },
};

// ── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { userId } = useAuth();
  const { theme, setTheme } = useTheme();
  const t = THEMES[theme];

  // ── Live Feed State ───────────────────────────────────────────────────
  const [liveFeed, setLiveFeed] = useState<any[]>([]);

  // ── Personal profile data from Supabase ────────────────────────────────
  const [profile, setProfile] = useState<{
    persona: string | null;
    monthly_limit: number | null;
    impulse_buy_score: number | null;
  } | null>(null);
  const [totalSpent, setTotalSpent] = useState<number>(0);

  // ── Supabase: fetch targetable players ─────────────────────────────────
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);

  // ── Supabase WebSocket Live Feed ───────────────────────────────────────
  useEffect(() => {
    // 1. Fetch the last 5 historical events so the feed isn't empty on load
    const fetchHistory = async () => {
      // NOTE: Ask Krish what the actual table name is! We are using 'expenses' as an example.
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (data) setLiveFeed(data);
    };
    
    fetchHistory();

    // 2. Open the WebSocket connection to listen for NEW events in real-time
    const feedChannel = supabase
      .channel('public:expenses')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          console.log('🔥 NEW EVENT DETECTED VIA WEBSOCKET:', payload.new);
          const newEvent = payload.new as any;
          // Add the new event to the top of the feed, keep only the latest 10
          setLiveFeed((currentFeed) => [newEvent, ...currentFeed].slice(0, 10));
          // If this expense belongs to the current user, update totalSpent live
          if (newEvent.user_id === userId) {
            setTotalSpent((prev) => prev + (newEvent.amount ?? 0));
          }
        }
      )
      .subscribe();

    // 3. Cleanup the WebSocket when the user leaves the dashboard
    return () => {
      supabase.removeChannel(feedChannel);
    };
  }, []);

  useEffect(() => {
    async function fetchPlayers() {
      setPlayersLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, persona");

      if (!error && data) {
        setPlayers(
          data
            .filter((p) => p.id !== userId)
            .map((p) => ({
              id: p.id,
              name: p.persona ?? "Unknown",
              avatar: "🎯",
            })),
        );
      }
      setPlayersLoading(false);
    }

    async function fetchProfile() {
      if (!userId) return;
      const { data } = await supabase
        .from("profiles")
        .select("persona, monthly_limit, impulse_buy_score")
        .eq("id", userId)
        .single();

      if (data) setProfile(data);
    }

    async function fetchTotalSpent() {
      if (!userId) return;
      const { data } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", userId);

      if (data) {
        setTotalSpent(data.reduce((sum: number, e: any) => sum + (e.amount ?? 0), 0));
      }
    }

    fetchPlayers();
    fetchProfile();
    fetchTotalSpent();
  }, [userId]);

  // ── SFX ────────────────────────────────────────────────────────────────
  const [sfx, setSfx] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!t.sfx || !sfx) {
      audioRef.current?.pause();
      return;
    }
    const a = new Audio(t.sfx);
    a.loop = true;
    a.volume = 0.25;
    a.play().catch(() => {});
    audioRef.current = a;
    return () => {
      a.pause();
      a.currentTime = 0;
    };
  }, [t.sfx, sfx]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleAttack = async (victimId: string, penalty: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sabotage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attacker_id: userId, victim_id: victimId, penalty }),
      });
    } catch (err) {
      console.error("[SABOTAGE] Failed:", err);
    }
  };

  // ── Metric cards data (real from Supabase) ─────────────────────────────
  const budgetLimit = profile?.monthly_limit ?? 0;
  const budgetLeft = Math.max(budgetLimit - totalSpent, 0);
  const impulse = profile?.impulse_buy_score;

  const metrics = [
    {
      label: "Total Budget",
      value: budgetLimit > 0 ? `$${budgetLimit.toFixed(2)}` : "—",
      sub: budgetLimit > 0 ? "monthly limit" : "take the quiz first",
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-emerald-400",
      border: "border-emerald-900/30",
    },
    {
      label: "Persona",
      value: profile?.persona ?? "???",
      sub: profile?.persona ? "AI-assigned" : "take the quiz first",
      icon: <User className="h-5 w-5" />,
      color: "text-amber-400",
      border: "border-amber-900/30",
    },
    {
      label: "Total Spent",
      value: `$${totalSpent.toFixed(2)}`,
      sub: budgetLimit > 0 ? `$${budgetLeft.toFixed(2)} remaining` : "this month",
      icon: <TrendingDown className="h-5 w-5" />,
      color: "text-sky-400",
      border: "border-sky-900/30",
    },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${t.bg} text-zinc-100 transition-colors duration-700`}>

      {/* ════════════════════ TOP BAR ════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          {/* Left: title + online pill */}
          <div className="flex items-center gap-3">
            <h1 className="font-black text-base tracking-tight select-none">
              {profile?.persona ? (
                <>{profile.persona.toUpperCase()}<span className={t.accent}>'s</span> HQ</>
              ) : (
                <>COMMAND CENTER<span className={t.accent}>.</span></>
              )}
            </h1>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-800/40 bg-emerald-950/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Online
            </span>
          </div>

          {/* Right: sfx + sabotage + avatar */}
          <div className="flex items-center gap-2">
            {t.sfx && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSfx((v) => !v)}
                className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-300"
              >
                {sfx ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </Button>
            )}

            {/* Sabotage trigger in the header */}
            {playersLoading ? (
              <Button size="sm" variant="destructive" disabled className="gap-1.5 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading targets…
              </Button>
            ) : (
              <SabotageAttackModal players={players} onAttack={handleAttack} />
            )}

            {/* ── Theme Selector ──────────────────────────────── */}
            <div className="flex items-center gap-0.5 rounded-full border border-zinc-800 bg-zinc-900/80 p-0.5">
              {(Object.keys(THEMES) as Theme[]).map((key) => {
                const active = key === theme;
                return (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    title={THEMES[key].label}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer
                      ${active
                        ? `${THEMES[key].accent} bg-zinc-800`
                        : "text-zinc-600 hover:text-zinc-400"}`}
                  >
                    {THEMES[key].icon}
                    <span className="hidden sm:inline">{THEMES[key].label}</span>
                  </button>
                );
              })}
            </div>

            <div className="ml-1">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* ════════════════════ BENTO GRID ════════════════════ */}
      <main className="mx-auto max-w-7xl px-5 py-8 space-y-5">

        {/* ── Row 1: Metric Cards ────────────────────────────────── */}
        <motion.section
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
        >
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              custom={i}
              variants={fadeUp}
              className={`group relative overflow-hidden rounded-2xl border ${m.border} ${t.cardBg} backdrop-blur-md p-5
                          transition-shadow duration-300`}
              style={{ boxShadow: `0 0 40px -8px ${t.glow}` }}
            >
              {/* Subtle corner accent */}
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-white/[0.015] to-transparent" />

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    {m.label}
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight">{m.value}</p>
                  <p className="mt-0.5 text-xs text-zinc-600">{m.sub}</p>
                </div>
                <div className={`rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 ${m.color}`}>
                  {m.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* ── Row 2: Expense Form (1col) + Live Feed (2col) ──────── */}
        <motion.section
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
        >
          {/* ── LEFT: Expense Form ──────────────────────────────── */}
          <motion.div
            custom={3}
            variants={fadeUp}
            className={`rounded-2xl border ${t.accentBorder} ${t.cardBg} backdrop-blur-md p-6`}
          >
            <ExpenseForm userId={userId ?? null} />
          </motion.div>

          {/* ── RIGHT: Live Feed (spans 2) ──────────────────────── */}
          <motion.div
            custom={4}
            variants={fadeUp}
            className={`relative lg:col-span-2 rounded-2xl border ${t.accentBorder} ${t.cardBg} backdrop-blur-md p-6 overflow-hidden`}
          >
            {/* Background GIF if theme has one */}
            {t.gif && (
              <img
                src={t.gif}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-[0.04] pointer-events-none"
              />
            )}

            {/* Glow ring */}
            <div
              className="pointer-events-none absolute -inset-px rounded-2xl"
              style={{
                background: `conic-gradient(from 180deg, transparent 60%, ${t.glow} 80%, transparent 100%)`,
                opacity: 0.6,
              }}
            />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Radio className={`h-4 w-4 ${t.accent} animate-pulse`} />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                    Live Feed
                  </h3>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-zinc-600 font-mono">
                  <Activity className="h-3 w-3" />
                  CONNECTED
                </span>
              </div>

              {/* Feed items */}
              <div className="space-y-3">
                <AnimatePresence>
                  {liveFeed.length === 0 ? (
                    <div className="text-center text-sm text-zinc-500 py-4 font-mono">No recent activity. It's too quiet...</div>
                    ) : liveFeed.map((event, i) => (
                    <motion.div
                        key={event.id || i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.35 }}
                        className="flex items-center gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/40 px-4 py-3 hover:bg-zinc-800/40 transition-colors"
                    >
                        <span className="text-lg">
                        {event.category === 'Food / Takeout' ? '🍔' : event.category === 'Impulse Buy' ? '🔥' : '💸'}
                        </span>
                        <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                            {/* We will join this with the profiles table later to show the actual name */}
                            <span className="font-bold text-zinc-200">A Target</span>{" "}
                            <span className="text-zinc-500">logged ${event.amount} for {event.category}</span>
                        </p>
                        </div>
                        <span className="shrink-0 text-[10px] text-zinc-600 font-mono">
                        Just now
                        </span>
                    </motion.div>
                    ))}
                </AnimatePresence>
              </div>

              {/* Bottom hint — disappears once we have real events */}
              {liveFeed.length === 0 && (
                <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-zinc-700 uppercase tracking-widest">
                  <ShieldAlert className="h-3 w-3" />
                  Waiting for WebSocket connection…
                </div>
              )}
            </div>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
}
