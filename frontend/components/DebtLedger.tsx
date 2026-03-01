"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Receipt, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Balance {
  user_id: string;
  username: string;
  total_spent: number;
  net_balance: number;
}

interface DebtLedgerProps {
  groupId: string;
  currentUserId: string;
}

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function DebtLedger({ groupId, currentUserId }: DebtLedgerProps) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/groups/${groupId}/balances`);
      if (!res.ok) return;
      const data = await res.json();
      setBalances(data.balances ?? []);
    } catch (e) {
      console.error("Failed to fetch balances:", e);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const handleSettle = async (b: Balance) => {
    setSettlingId(b.user_id);
    try {
      const res = await fetch(`${apiBase}/api/groups/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: b.user_id,
          group_id: groupId,
          amount: Math.abs(b.net_balance),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Settle failed");
      }

      toast.success("Debt settled. You are slightly less cooked.", {
        description: `${USD.format(Math.abs(b.net_balance))} settled for ${b.username}`,
      });

      // Re-fetch to update UI instantly
      await fetchBalances();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSettlingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-zinc-500 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading balances…
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-zinc-500">
        No expenses logged in this group yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-zinc-500" />
        <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          Debt Ledger
        </h4>
      </div>

      <div className="space-y-2">
        {balances.map((b) => {
          const isYou = b.user_id === currentUserId;
          const owes = b.net_balance > 0;    // positive → owes the group
          const owed = b.net_balance < 0;    // negative → owed by the group
          const even = b.net_balance === 0;

          return (
            <div
              key={b.user_id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-4 py-3 shadow-sm"
            >
              {/* Left side — name + label */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-bold text-zinc-100 truncate">
                  {isYou ? "You" : b.username}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {even
                    ? "Settled up"
                    : owes
                      ? "Owes the group"
                      : "Owed by the group"}
                </span>
              </div>

              {/* Right side — amount + settle button */}
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`font-mono text-sm font-bold tabular-nums ${
                    even
                      ? "text-zinc-500"
                      : owes
                        ? "text-emerald-500"
                        : "text-red-500"
                  }`}
                >
                  {USD.format(Math.abs(b.net_balance))}
                </span>

                {owed && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={settlingId === b.user_id}
                    onClick={() => handleSettle(b)}
                    className="h-7 gap-1.5 rounded-lg border-zinc-700 bg-zinc-800 text-[11px] font-bold text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-50"
                  >
                    {settlingId === b.user_id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <HandCoins className="h-3 w-3" />
                        Settle Up
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
