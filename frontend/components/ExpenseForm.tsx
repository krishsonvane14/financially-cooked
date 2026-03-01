"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, DollarSign, Tag, Check, Loader2 } from "lucide-react";
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
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/src/context/ThemeContext";

const CATEGORIES = [
  { value: "food", label: "Food & Takeout", icon: "🍔" },
  { value: "entertainment", label: "Entertainment", icon: "🎮" },
  { value: "shopping", label: "Shopping", icon: "🛍️" },
  { value: "transport", label: "Transport", icon: "🚗" },
  { value: "subscriptions", label: "Subscriptions", icon: "📺" },
  { value: "other", label: "Other", icon: "📦" },
];

// ── Brainrot SFX pool ────────────────────────────────────────────────────────
const BRAINROT_SFX = [
  "/assets/sound-effects/vine-boom.mp3",
  "/assets/sound-effects/metal-pipe-clang.mp3",
  "/assets/sound-effects/fart-meme-sound.mp3",
  "/assets/sound-effects/taco-bell-bong-sfx.mp3",
];

function playRandomSfx() {
  const src = BRAINROT_SFX[Math.floor(Math.random() * BRAINROT_SFX.length)];
  const audio = new Audio(src);
  audio.volume = 0.5;
  audio.play().catch(() => {});
}

interface ExpenseFormProps {
  userId: string | null;
  onSubmit?: (expense: { amount: number; category: string }) => void;
}

export default function ExpenseForm({ userId, onSubmit }: ExpenseFormProps) {
  const { theme } = useTheme();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isValid = Number(amount) > 0 && category !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !userId) return;

    setSubmitting(true);
    try {
      const finalAmount = Number(amount);

      // Insert directly into Supabase — this triggers the Realtime WebSocket
      const { error } = await supabase.from("expenses").insert({
        user_id: userId,
        amount: finalAmount,
        category,
      });

      if (!error) {
        // Play a random brainrot SFX on success
        if (theme === "brainrot") {
          playRandomSfx();
        }

        onSubmit?.({ amount: finalAmount, category });
        setSuccess(true);
        setTimeout(() => {
          setAmount("");
          setCategory("");
          setSuccess(false);
        }, 1500);
      } else {
        console.error("Supabase insert failed:", error.message);
      }
    } catch (err) {
      console.error("Failed to log expense:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Plus className="h-4 w-4 text-zinc-500" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          Log Expense
        </h3>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <Label htmlFor="exp-amount" className="text-xs text-zinc-500">
          Amount
        </Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            id="exp-amount"
            type="number"
            min={0.01}
            step={0.01}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-9 bg-zinc-900/60 border-zinc-800 text-zinc-100 font-mono text-lg
                       placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-zinc-700/40
                       [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
                       [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label htmlFor="exp-cat" className="text-xs text-zinc-500">
          Category
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger
            id="exp-cat"
            className="bg-zinc-900/60 border-zinc-800 text-zinc-300 focus:border-zinc-600 focus:ring-zinc-700/40"
          >
            <SelectValue placeholder="Pick a category" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {CATEGORIES.map((c) => (
              <SelectItem
                key={c.value}
                value={c.value}
                className="text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100"
              >
                <span className="flex items-center gap-2">
                  <span>{c.icon}</span>
                  {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-sm font-bold"
          >
            <Check className="h-4 w-4" /> Logged!
          </motion.div>
        ) : (
          <motion.div key="btn" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button
              type="submit"
              disabled={!isValid || submitting || !userId}
              className="w-full bg-zinc-100 text-zinc-900 font-bold hover:bg-white
                         disabled:bg-zinc-800 disabled:text-zinc-600 transition-all"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Tag className="h-4 w-4 mr-2" />
                  Add Expense
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
