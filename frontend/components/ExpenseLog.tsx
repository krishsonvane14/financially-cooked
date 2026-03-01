"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

interface Expense {
  id: string;
  amount: number;
  description?: string;
  category?: string;
  created_at?: string;
}

interface ExpenseLogProps {
  userId: string;
  /** Called after a successful delete so the parent can refresh budget numbers */
  onBudgetUpdate?: () => void;
}

export default function ExpenseLog({ userId, onBudgetUpdate }: ExpenseLogProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/expenses/${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      setExpenses(data.expenses ?? []);
    } catch (e) {
      console.error("Failed to fetch expenses:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (expense: Expense) => {
    setDeletingId(expense.id);
    try {
      const res = await fetch(`${apiBase}/api/expenses/${expense.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Delete failed");
      }

      toast.success("Expense deleted. Budget refunded.", {
        description: `${USD.format(expense.amount)} returned to your budget`,
      });

      // Remove from local state instantly
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));

      // Let the parent refresh budget numbers
      onBudgetUpdate?.();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-zinc-500 text-sm justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading expenses…
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-zinc-500">
        No expenses logged yet. Start spending to see them here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-[var(--theme-text-muted)]" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">
          Expense Log
        </h3>
        <span className="ml-auto text-[11px] font-mono text-[var(--theme-text-muted)]">
          {expenses.length} item{expenses.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
        {expenses.map((expense) => {
          const isDeleting = deletingId === expense.id;

          return (
            <div
              key={expense.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-3 shadow-sm transition-opacity"
              style={{ opacity: isDeleting ? 0.5 : 1 }}
            >
              {/* Info */}
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-sm font-bold text-[var(--theme-text)] truncate">
                  {expense.description || expense.category || "Expense"}
                </span>
                <div className="flex items-center gap-2">
                  {expense.category && (
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      {expense.category}
                    </span>
                  )}
                  {expense.created_at && (
                    <span className="text-[10px] text-[var(--theme-text-muted)]">
                      {new Date(expense.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount */}
              <span className="font-mono text-sm font-bold tabular-nums text-red-500 shrink-0">
                {USD.format(expense.amount)}
              </span>

              {/* Delete button */}
              <Button
                size="icon"
                variant="ghost"
                disabled={isDeleting}
                onClick={() => handleDelete(expense)}
                className="h-8 w-8 shrink-0 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
