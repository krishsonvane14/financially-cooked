"use client";

import { useCallback, useEffect, useState } from "react";
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

interface Ranking {
  id: string;
  persona: string;
  monthly_limit: number;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function WallOfShame() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/leaderboard`);

      if (!res.ok) {
        console.error("Leaderboard request failed:", res.status, res.statusText);
        setRankings([]);
        return;
      }

      const data = await res.json();

      if (!data || !Array.isArray(data.rankings)) {
        console.error("Backend error or no rankings found:", data);
        setRankings([]);
        return;
      }

      const sorted = [...(data.rankings as Ranking[])].sort(
        (a, b) => a.monthly_limit - b.monthly_limit
      );

      setRankings(sorted);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---- Initial fetch ---- */
  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  /* ---- Realtime subscription ---- */
  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => { fetchLeaderboard(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLeaderboard]);

  /* ---- Derived: lowest budget id ---- */
  const lowestId = rankings.length > 0 ? rankings[0].id : null;

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="w-full space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );
  }

  /* ---- Leaderboard table ---- */
  return (
    <div className="w-full overflow-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Persona</TableHead>
            <TableHead className="text-right">Monthly Limit</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {rankings.map((r, idx) => {
            const isCooked = r.monthly_limit < 50;
            const isLowest = r.id === lowestId;

            return (
              <TableRow
                key={r.id}
                className={
                  isCooked
                    ? "animate-pulse bg-red-500/10 hover:bg-red-500/20"
                    : ""
                }
              >
                <TableCell className="text-center font-medium">
                  {idx + 1}
                </TableCell>
                <TableCell className="font-semibold">
                  {r.persona}{isLowest && " 🔥"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {usd.format(r.monthly_limit)}
                </TableCell>
                {/* Reserved for future Attack button */}
                <TableCell />
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
