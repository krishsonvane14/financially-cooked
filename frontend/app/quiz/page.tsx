"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Skull,
  Flame,
  ArrowRight,
  RotateCcw,
  Loader2,
  DollarSign,
  Coffee,
  Tv,
  ShoppingCart,
  Coins,
  Bitcoin,
  PartyPopper,
  Brain,
  CreditCard,
  Home,
} from "lucide-react";

/* ─────────────────── types ─────────────────── */
interface Answers {
  rent: string;
  income: string;
  debt: string;
  subscriptions: string;
  caffeine: string;
  advisor: string;
  justification: string;
  takeout: string;
  crypto: string;
  weekend: string;
}

interface McOption {
  value: string;
  label: string;
}

type QuestionDef =
  | { kind: "number"; field: keyof Answers; label: string; emoji: string; icon: React.ReactNode; placeholder: string }
  | { kind: "mc"; field: keyof Answers; label: string; emoji: string; icon: React.ReactNode; options: McOption[] };

/* ─────────────────── questions ─────────────────── */
const questions: QuestionDef[] = [
  {
    kind: "number",
    field: "income",
    label: "Monthly Income (Be honest)",
    emoji: "💰",
    icon: <DollarSign className="h-5 w-5" />,
    placeholder: "4200",
  },
  {
    kind: "number",
    field: "rent",
    label: "Monthly Rent / Mortgage",
    emoji: "🏠",
    icon: <Home className="h-5 w-5" />,
    placeholder: "1500",
  },
  {
    kind: "number",
    field: "debt",
    label: "Current Debt Level",
    emoji: "📉",
    icon: <CreditCard className="h-5 w-5" />,
    placeholder: "12000",
  },
  {
    kind: "number",
    field: "subscriptions",
    label: "How much on subscriptions?",
    emoji: "📺",
    icon: <Tv className="h-5 w-5" />,
    placeholder: "85",
  },
  {
    kind: "mc",
    field: "caffeine",
    label: "Caffeine Dependency?",
    emoji: "☕",
    icon: <Coffee className="h-5 w-5" />,
    options: [
      { value: "tap_water", label: "Tap Water" },
      { value: "black_coffee", label: "Black Coffee" },
      { value: "matcha", label: "Matcha ✨" },
      { value: "3_celsius", label: "3 Monsters Cans" },
    ],
  },
  {
    kind: "mc",
    field: "advisor",
    label: "Primary Financial Advisor?",
    emoji: "🧠",
    icon: <Brain className="h-5 w-5" />,
    options: [
      { value: "excel", label: "Excel Spreadsheet" },
      { value: "tiktok", label: "TikTok Finance Bros" },
      { value: "mom", label: "My Mom" },
      { value: "delusion", label: "Pure Delusion" },
    ],
  },
  {
    kind: "mc",
    field: "justification",
    label: "How do you justify a $100 impulse buy?",
    emoji: "🛍️",
    icon: <ShoppingCart className="h-5 w-5" />,
    options: [
      { value: "girl_math", label: "Girl Math" },
      { value: "on_sale", label: "It was on sale" },
      { value: "yolo", label: "YOLO" },
      { value: "cried_first", label: "I cried first" },
    ],
  },
  {
    kind: "mc",
    field: "takeout",
    label: "Takeout Frequency?",
    emoji: "🍔",
    icon: <Coins className="h-5 w-5" />,
    options: [
      { value: "i_cook", label: "I cook" },
      { value: "weekends", label: "Weekends only" },
      { value: "few_times_week", label: "A few times a week" },
      { value: "stove_decoration", label: "My stove is just for decoration" },
    ],
  },
  {
    kind: "mc",
    field: "crypto",
    label: "Crypto Portfolio Status?",
    emoji: "🪙",
    icon: <Bitcoin className="h-5 w-5" />,
    options: [
      { value: "zero", label: "Zero" },
      { value: "sensible_btc", label: "Sensible BTC" },
      { value: "dogecoin", label: "Dogecoin Bagholder" },
      { value: "dont_ask", label: "Don't ask" },
    ],
  },
  {
    kind: "mc",
    field: "weekend",
    label: "Typical Weekend Vibe?",
    emoji: "🎉",
    icon: <PartyPopper className="h-5 w-5" />,
    options: [
      { value: "rotting", label: "Rotting in bed" },
      { value: "brunch", label: "$80 Brunch" },
      { value: "clubbing", label: "Clubbing" },
      { value: "leetcode", label: "Grinding Leetcode" },
    ],
  },
];

/* ─────────────────── animation variants ─────────────────── */
const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/* ─────────────────── floating emoji config ─────────────────── */
const floatingEmojis = [
  { emoji: "💸", x: "8%",  y: "12%", dx: 14,  dy: -20, rotate: 15,  duration: 12, size: "text-3xl" },
  { emoji: "💀", x: "85%", y: "18%", dx: -18, dy: 16,  rotate: -12, duration: 14, size: "text-4xl" },
  { emoji: "💅", x: "15%", y: "55%", dx: 20,  dy: 12,  rotate: 10,  duration: 11, size: "text-2xl" },
  { emoji: "📉", x: "90%", y: "45%", dx: -12, dy: -18, rotate: -8,  duration: 13, size: "text-3xl" },
  { emoji: "🍔", x: "75%", y: "72%", dx: 16,  dy: 14,  rotate: 20,  duration: 15, size: "text-2xl" },
  { emoji: "🤡", x: "5%",  y: "80%", dx: -10, dy: -16, rotate: -15, duration: 10, size: "text-4xl" },
  { emoji: "🔥", x: "50%", y: "8%",  dx: 8,   dy: 22,  rotate: 12,  duration: 13, size: "text-2xl" },
  { emoji: "🎰", x: "40%", y: "88%", dx: -14, dy: -10, rotate: -18, duration: 12, size: "text-3xl" },
];

/* ══════════════════════════════════════════════════════════════════════ */

export default function QuizPage() {
  const { theme, setTheme } = useTheme();
  const { userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [username, setUsername] = useState("");
  const [answers, setAnswers] = useState<Answers>({
    rent: "",
    income: "",
    debt: "",
    subscriptions: "",
    caffeine: "",
    advisor: "",
    justification: "",
    takeout: "",
    crypto: "",
    weekend: "",
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* ── helpers ── */
  const setField = (field: keyof Answers, value: string) =>
    setAnswers((prev) => ({ ...prev, [field]: value }));

  const numericFields: (keyof Answers)[] = ["income", "rent", "debt", "subscriptions"];
  const mcFields: (keyof Answers)[] = ["caffeine", "advisor", "justification", "takeout", "crypto", "weekend"];

  const allFilled =
    numericFields.every((f) => answers[f] !== "") &&
    mcFields.every((f) => answers[f] !== "");

  /* ── derive legacy fields so backend still works ── */
  const deriveLegacy = () => {
    const takeoutMap: Record<string, number> = { i_cook: 1, weekends: 4, few_times_week: 8, stove_decoration: 14 };
    const impulseMap: Record<string, number> = { girl_math: 9, on_sale: 5, yolo: 8, cried_first: 7 };
    return {
      takeout_frequency: takeoutMap[answers.takeout] ?? 3,
      impulse_buy_score: impulseMap[answers.justification] ?? 5,
      entertainment_spend: parseInt(answers.subscriptions) || 50,
    };
  };

  /* ── submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("You must be logged in to take the vibe check!");
      return;
    }
    setLoading(true);

    try {
      const legacy = deriveLegacy();
      const payload = {
        user_id: userId,
        username: username.trim() || user?.fullName || undefined,
        // legacy fields for existing backend
        takeout_frequency: legacy.takeout_frequency,
        impulse_buy_score: legacy.impulse_buy_score,
        entertainment_spend: legacy.entertainment_spend,
        selected_theme: theme,
        // new extended fields
        rent: parseInt(answers.rent) || 0,
        income: parseInt(answers.income) || 0,
        debt: parseInt(answers.debt) || 0,
        subscriptions: parseInt(answers.subscriptions) || 0,
        caffeine: answers.caffeine,
        advisor: answers.advisor,
        justification: answers.justification,
        takeout: answers.takeout,
        crypto: answers.crypto,
        weekend: answers.weekend,
      };

      console.log("🚀 SENDING TO BACKEND:", payload);

      const res = await fetch(`${apiBaseUrl}/api/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("📥 RECEIVED FROM BACKEND:", data);

      if (!res.ok) {
        console.error("❌ BACKEND REJECTED IT. Status:", res.status);
        alert(`API Error! Check the browser console.\nServer says: ${JSON.stringify(data.detail || data)}`);
        setLoading(false);
        return;
      }

      setResult(data);
      if (data.recommended_theme) setTheme(data.recommended_theme);
    } catch (error) {
      console.error("🔥 NETWORK CRASH:", error);
      alert("Failed to reach the server entirely. Is the Render URL correct?");
    } finally {
      setLoading(false);
    }
  };

  /* ════════════════════ RESULTS SCREEN ════════════════════ */
  if (result) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
        {/* glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-red-500/10 blur-[160px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-8 px-6 py-20 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-400"
          >
            <Skull className="h-3.5 w-3.5" /> Diagnosis Complete
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-5xl font-black text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.5)] sm:text-6xl"
          >
            {result.persona}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 backdrop-blur"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Monthly Budget Allowed
            </p>
            <p className="mt-2 text-5xl font-black tabular-nums">
              ${result.monthly_limit?.toFixed(2) || "0.00"}
            </p>
            <p className="mt-3 text-sm text-zinc-500">
              Theme locked to{" "}
              <span className="font-bold text-red-400">{result.recommended_theme}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="flex w-full flex-col gap-3"
          >
            <button
              onClick={() => router.push("/dashboard")}
              className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-red-500 py-5 text-lg font-black text-white shadow-[0_0_40px_rgba(239,68,68,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(239,68,68,0.5)] active:scale-95"
            >
              <Flame className="h-5 w-5 transition group-hover:rotate-12" />
              GO TO DASHBOARD
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              <span className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-red-500/20" />
            </button>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 text-sm font-bold text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
            >
              <RotateCcw className="h-4 w-4" /> Retake Quiz
            </button>
          </motion.div>
        </motion.div>
      </main>
    );
  }

  /* ════════════════════ QUIZ FORM ════════════════════ */
  return (
    <main className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950 text-white">
      {/* floating emojis layer */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {floatingEmojis.map((item, i) => (
          <motion.span
            key={i}
            className={`absolute select-none opacity-20 blur-[1px] ${item.size}`}
            style={{ left: item.x, top: item.y }}
            animate={{
              x: [0, item.dx, -item.dx * 0.6, 0],
              y: [0, item.dy, -item.dy * 0.6, 0],
              rotate: [0, item.rotate, -item.rotate * 0.5, 0],
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          >
            {item.emoji}
          </motion.span>
        ))}
      </div>

      {/* noise grain */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

      <form onSubmit={handleSubmit} className="relative z-10 mx-auto max-w-2xl px-6 py-20">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-400">
            <Skull className="h-3.5 w-3.5" /> Financial Vibe Check
          </span>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            How <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">cooked</span> are you? 💀
          </h1>
          <p className="mt-3 text-zinc-500">
            Answer honestly. Or don&rsquo;t. We&rsquo;ll judge you either way. 📉
          </p>
        </motion.div>

        {/* username */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={cardVariant}
          custom={0}
          className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur"
        >
          <label className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
            <Skull className="h-4 w-4 text-red-500" />
            Your Alias 💀
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. BudgetBandit"
            className="w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 px-5 py-4 font-mono text-xl text-white placeholder:text-zinc-700 transition focus:border-red-500 focus:outline-none focus:ring-0"
          />
        </motion.div>

        {/* questions */}
        <motion.div initial="hidden" animate="show" className="space-y-6">
          {questions.map((q, i) => (
            <motion.div
              key={q.field}
              variants={cardVariant}
              custom={i + 1}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur"
            >
              <label className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                  {q.icon}
                </span>
                <span>
                  {q.label} {q.emoji}
                </span>
              </label>

              {q.kind === "number" ? (
                <div className="relative">
                  <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-600">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={answers[q.field]}
                    onChange={(e) => setField(q.field, e.target.value)}
                    placeholder={q.placeholder}
                    className="w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 py-4 pl-12 pr-5 font-mono text-2xl text-white placeholder:text-zinc-700 transition focus:border-red-500 focus:outline-none focus:ring-0"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {q.options.map((opt) => {
                    const selected = answers[q.field] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setField(q.field, opt.value)}
                        className={`rounded-xl border-2 px-4 py-3.5 text-sm font-bold transition-all ${
                          selected
                            ? "border-red-500 bg-red-500/15 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* submit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="sticky bottom-6 z-20 mt-12"
        >
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 backdrop-blur-xl">
            <button
              type="submit"
              disabled={loading || !userId || !allFilled}
              className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-red-500 py-5 text-lg font-black text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(239,68,68,0.45)] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing Delusions...
                </>
              ) : (
                <>
                  <Skull className="h-5 w-5 transition group-hover:rotate-12" />
                  DIAGNOSE ME 💀
                </>
              )}
            </button>
            {!allFilled && (
              <p className="mt-2 text-center text-xs text-zinc-600">
                Answer all questions to unlock your diagnosis
              </p>
            )}
          </div>
        </motion.div>

        {/* bottom spacer for sticky button */}
        <div className="h-8" />
      </form>
    </main>
  );
}