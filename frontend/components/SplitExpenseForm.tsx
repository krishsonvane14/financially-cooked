"use client";

import { useState } from "react";
import { Loader2, Scissors, DollarSign, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Group } from "@/components/GroupManager";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface SplitExpenseFormProps {
  userId: string;
  groups: Group[];
  /** Called after a successful split so the parent can refresh data */
  onSplitSuccess?: () => void;
}

export default function SplitExpenseForm({ userId, groups, onSplitSuccess }: SplitExpenseFormProps) {
  const [groupId, setGroupId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValid = groupId !== "" && Number(amount) > 0 && description.trim() !== "";

  const selectedGroup = groups.find((g) => g.id === groupId);
  const splitPreview =
    selectedGroup && Number(amount) > 0
      ? (Number(amount) / selectedGroup.members.length).toFixed(2)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/groups/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          payer_id: userId,
          amount: Number(amount),
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Split failed");
      }

      toast.success("Everyone is now more cooked 🔥", {
        description: `$${amount} split between ${selectedGroup?.members.length ?? "?"} people`,
      });
      onSplitSuccess?.();

      // Reset
      setGroupId("");
      setAmount("");
      setDescription("");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Scissors className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Split Expense
        </h3>
      </div>

      {/* Group selector */}
      <div className="space-y-1.5">
        <Label className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Group</Label>
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger className="w-full bg-white/50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300 rounded-xl focus:border-red-500 focus:ring-red-500/20">
            <SelectValue placeholder="Pick a group" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
            {groups.length === 0 && (
              <div className="px-3 py-2 text-xs text-zinc-500">No groups yet — create one first</div>
            )}
            {groups.map((g) => (
              <SelectItem
                key={g.id}
                value={g.id}
                className="text-zinc-700 dark:text-zinc-200 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-zinc-100"
              >
                {g.name} ({g.members.length} members)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <Label className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Amount</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <Input
            type="number"
            min={0.01}
            step={0.01}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-9 w-full bg-white/50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-lg rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        {splitPreview && (
          <p className="text-[11px] text-zinc-500 mt-1">
            → <span className="font-mono font-bold text-zinc-700 dark:text-zinc-400">${splitPreview}</span> per person
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Description</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <Input
            placeholder="e.g. Uber Eats run"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="pl-9 w-full bg-white/50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isValid || submitting}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-black rounded-xl shadow-lg shadow-red-500/25 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:shadow-none transition-all"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Scissors className="h-4 w-4 mr-2" />
            Split &amp; Cook Everyone
          </>
        )}
      </Button>
    </form>
  );
}
