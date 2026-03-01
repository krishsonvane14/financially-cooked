"use client";

import { useEffect, useState } from "react";
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

/* ── Types ──────────────────────────────────────────────────────────────── */

interface Ranking {
  id: string;
  persona: string;
  username?: string;
  monthly_limit: number;
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

/* ── Component ──────────────────────────────────────────────────────────── */

export default function LeaderboardPage() {
  const { userId } = useAuth();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl px-6">
        <Trophy className="mr-2 h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Leaderboard</h2>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-amber-500/10 p-4">
            <Trophy className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-black">Wall of Shame</h1>
          <p className="max-w-md text-sm text-zinc-500">
            Ranked by budget — lowest on top. If you see red, they&apos;re <span className="font-bold text-red-500">cooked</span>.
          </p>
        </div>

        {/* Table */}
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
      </div>
    </div>
  );
}
