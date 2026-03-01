"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Crown,
  Flame,
  Skull,
  Trophy,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

/* ── Types ──────────────────────────────────────────────────────────────── */

interface Ranking {
  id: string;
  persona: string;
  username?: string;
  monthly_limit: number;
}

interface TopSpender {
  user_id: string;
  persona?: string;
  username?: string;
  total_spent: number;
}

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/* ── Helpers ────────────────────────────────────────────────────────────── */

function rankBadge(idx: number) {
  if (idx === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
        <Crown className="h-3 w-3" /> 1st
      </span>
    );
  if (idx === 1)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-700/40 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
        2nd
      </span>
    );
  if (idx === 2)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
        3rd
      </span>
    );
  return <span className="text-xs text-zinc-400">{idx + 1}</span>;
}

const AVATARS = ["💀", "🤡", "👹", "🧟", "😈", "🫠", "💸", "🔥"];

/* ── Component ──────────────────────────────────────────────────────────── */

export default function LeaderboardPage() {
  const { userId } = useAuth();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [topSpenders, setTopSpenders] = useState<TopSpender[]>([]);
  const [loading, setLoading] = useState(true);
  const [spendersLoading, setSpendersLoading] = useState(true);

  /* ── Fetch budget leaderboard ───────────────────────────────────────── */

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/leaderboard`);
      if (!res.ok) { setRankings([]); return; }
      const data = await res.json();
      if (!data || !Array.isArray(data.rankings)) { setRankings([]); return; }
      setRankings(
        [...(data.rankings as Ranking[])].sort((a, b) => a.monthly_limit - b.monthly_limit),
      );
    } catch { setRankings([]); }
    finally { setLoading(false); }
  }, []);

  /* ── Fetch top spenders of the day ──────────────────────────────────── */

  const fetchTopSpenders = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("expenses")
        .select("user_id, amount")
        .gte("created_at", today.toISOString());

      if (error || !data) { setTopSpenders([]); return; }

      // Aggregate by user_id
      const map: Record<string, number> = {};
      for (const row of data) {
        map[row.user_id] = (map[row.user_id] ?? 0) + (row.amount ?? 0);
      }

      const sorted = Object.entries(map)
        .map(([user_id, total_spent]) => ({ user_id, total_spent }))
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 5);

      // Enrich with profile data
      if (sorted.length > 0) {
        const ids = sorted.map((s) => s.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, persona, username")
          .in("id", ids);

        const profileMap: Record<string, { persona?: string; username?: string }> = {};
        for (const p of profiles ?? []) {
          profileMap[p.id] = { persona: p.persona, username: p.username };
        }

        setTopSpenders(
          sorted.map((s) => ({
            ...s,
            persona: profileMap[s.user_id]?.persona,
            username: profileMap[s.user_id]?.username,
          })),
        );
      } else {
        setTopSpenders([]);
      }
    } catch { setTopSpenders([]); }
    finally { setSpendersLoading(false); }
  }, []);

  /* ── Initial fetch ──────────────────────────────────────────────────── */

  useEffect(() => { fetchLeaderboard(); fetchTopSpenders(); }, [fetchLeaderboard, fetchTopSpenders]);

  /* ── Realtime: re-fetch on any profile or expense change ────────────── */

  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchLeaderboard();
        fetchTopSpenders();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "expenses" }, () => {
        fetchTopSpenders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLeaderboard, fetchTopSpenders]);

  /* ── Derived ────────────────────────────────────────────────────────── */
  const lowestId = rankings.length > 0 ? rankings[0].id : null;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl px-6">
        <Trophy className="mr-2 h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Leaderboard</h2>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        {/* ── Top 5 Highest Spenders Today ─────────────────────────────── */}
        <section>
          <div className="flex flex-col items-center gap-3 text-center mb-6">
            <div className="rounded-full bg-red-500/10 p-4">
              <Flame className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-black">Today&apos;s Biggest Burners</h1>
            <p className="max-w-md text-sm text-zinc-500">
              Top 5 highest spenders <span className="font-bold">today</span>. If you see your name here, you&apos;re getting cooked in real time.
            </p>
          </div>

          {spendersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : topSpenders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-zinc-400">
              <p className="text-sm font-medium">No one has spent anything today. Suspiciously frugal.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {topSpenders.map((s, idx) => {
                const isYou = s.user_id === userId;
                return (
                  <div
                    key={s.user_id}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-shadow hover:shadow-md ${
                      idx === 0
                        ? "border-red-500/40 bg-red-500/5 dark:bg-red-500/10 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    }`}
                  >
                    <span className="text-3xl">{AVATARS[idx] ?? "💸"}</span>
                    <p className="text-xs font-bold truncate max-w-full">
                      {s.username || s.persona || "Anonymous"}
                      {isYou && <span className="ml-1 text-blue-500">(YOU)</span>}
                    </p>
                    <p className="text-lg font-black text-red-500 tabular-nums">{USD.format(s.total_spent)}</p>
                    <span className="absolute top-2 left-2 text-[10px] font-bold text-zinc-400">#{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Full Wall of Shame ──────────────────────────────────────── */}
        <section>
          <div className="flex flex-col items-center gap-3 text-center mb-6">
            <div className="rounded-full bg-amber-500/10 p-4">
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-black">Wall of Shame</h2>
            <p className="max-w-md text-sm text-zinc-500">
              Ranked by budget — lowest on top. If you see red, they&apos;re <span className="font-bold text-red-500">cooked</span>.
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : rankings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-zinc-400">
              <Skull className="h-10 w-10" />
              <p className="text-sm font-medium">No players yet. Be the first to get judged.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-200 dark:border-zinc-800">
                    <TableHead className="w-16 text-center">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="w-20 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.map((r, idx) => {
                    const isCooked = r.monthly_limit < 50;
                    const isYou = r.id === userId;
                    const isLowest = r.id === lowestId;
                    return (
                      <TableRow
                        key={r.id}
                        className={
                          isCooked
                            ? "animate-pulse bg-red-500/5 hover:bg-red-500/10 dark:bg-red-500/10"
                            : isYou
                              ? "bg-blue-500/5 dark:bg-blue-500/10"
                              : ""
                        }
                      >
                        <TableCell className="text-center">{rankBadge(idx)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {r.username || r.persona}
                              {isLowest && " 🔥"}
                              {isYou && (
                                <span className="ml-1.5 text-[10px] font-bold text-blue-500">(YOU)</span>
                              )}
                            </span>
                            {r.username && (
                              <span className="text-[11px] text-zinc-400">{r.persona}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {USD.format(r.monthly_limit)}
                        </TableCell>
                        <TableCell className="text-center">
                          {isCooked ? (
                            <span className="inline-flex items-center gap-1 text-red-500">
                              <Flame className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-bold uppercase">Cooked</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-zinc-400">OK</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
