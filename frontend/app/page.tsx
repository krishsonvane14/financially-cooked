"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  Crosshair,
  Skull,
  Zap,
  TrendingDown,
  Swords,
} from "lucide-react";

/* ───────────────────────── floating asset config ───────────────────────── */
const floatingAssets: {
  src: string;
  alt: string;
  className: string;
  drift: { x: number[]; y: number[]; rotate: number[] };
  duration: number;
}[] = [
  {
    src: "/assets/dummy-skull.gif",
    alt: "skull",
    className: "w-24 md:w-32 top-[8%] left-[5%]",
    drift: { x: [0, 15, -10, 0], y: [0, -20, 10, 0], rotate: [0, 8, -5, 0] },
    duration: 7,
  },
  {
    src: "/assets/dummy-money-burn.gif",
    alt: "money burn",
    className: "w-20 md:w-28 top-[12%] right-[6%]",
    drift: { x: [0, -12, 18, 0], y: [0, 15, -12, 0], rotate: [0, -10, 6, 0] },
    duration: 9,
  },
  {
    src: "/assets/dummy-meme-1.png",
    alt: "meme",
    className: "w-16 md:w-24 bottom-[18%] left-[8%]",
    drift: { x: [0, 20, -8, 0], y: [0, -15, 20, 0], rotate: [0, 12, -8, 0] },
    duration: 11,
  },
  {
    src: "/assets/dummy-skull.gif",
    alt: "skull 2",
    className: "w-14 md:w-20 bottom-[22%] right-[10%]",
    drift: { x: [0, -18, 10, 0], y: [0, 12, -18, 0], rotate: [0, -6, 10, 0] },
    duration: 8,
  },
  {
    src: "/assets/dummy-money-burn.gif",
    alt: "money burn 2",
    className: "w-12 md:w-16 top-[40%] left-[45%]",
    drift: { x: [0, 8, -14, 0], y: [0, -22, 8, 0], rotate: [0, 15, -12, 0] },
    duration: 10,
  },
];

/* ───────────────────── fake live-feed events ───────────────────── */
const fakeFeed = [
  { user: "SigmaSpender", emoji: "🎮", text: "dropped $50 on Fortnite V-Bucks" },
  { user: "SkibidiSaver", emoji: "🍔", text: "Uber Eats'd a $38 burrito bowl" },
  { user: "CashQueen", emoji: "💅", text: "bought a $120 candle - 'self care'" },
  { user: "BudgetBro", emoji: "💸", text: "venmo'd $80 for 'vibes'" },
];

/* ───────────────────── animation variants ───────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/* ══════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-transparent text-[var(--theme-text)] selection:bg-[var(--theme-primary)]/30 selection:text-[var(--theme-text)]">
      {/* ─── noise grain overlay ─── */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

      {/* ─── radial hero glow ─── */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[800px] w-[800px] rounded-full bg-[var(--theme-primary)]/10 blur-[160px]" />

      {/* ════════════════════ NAVBAR ════════════════════ */}
      <nav className="sticky top-0 z-40 w-full border-b border-[var(--theme-border)] bg-[var(--theme-bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-[var(--theme-primary)]" />
            <span className="text-lg font-black tracking-tighter">
              FINANCIALLY <span className="text-[var(--theme-primary)]">COOKED.</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/quiz">
                <button className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] px-5 py-2 text-sm font-bold text-[var(--theme-text)] backdrop-blur transition hover:opacity-80">
                  Log In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="rounded-full border border-[var(--theme-primary)]/30 bg-[var(--theme-primary)]/10 px-5 py-2 text-sm font-bold text-[var(--theme-primary)] transition hover:bg-[var(--theme-primary)]/20"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* ════════════════════ SECTION 1 — HERO ════════════════════ */}
      <section className="relative isolate flex min-h-[90vh] flex-col items-center justify-center px-6 py-24 text-center">
        {/* floating assets */}
        {floatingAssets.map((asset, i) => (
          <motion.img
            key={i}
            src={asset.src}
            alt={asset.alt}
            className={`pointer-events-none absolute select-none opacity-60 ${asset.className}`}
            animate={{
              x: asset.drift.x,
              y: asset.drift.y,
              rotate: asset.drift.rotate,
            }}
            transition={{
              duration: asset.duration,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
        ))}

        <motion.div
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto max-w-4xl space-y-8"
        >
          {/* pill badge */}
          <motion.div variants={fadeUp} custom={0} className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--theme-primary)]/20 bg-[var(--theme-primary)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--theme-primary)]">
              <Zap className="h-3.5 w-3.5" /> Multiplayer Budgeting
            </span>
          </motion.div>

          {/* title */}
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl"
          >
            FINANCIALLY{" "}
            <span className="text-[var(--theme-primary)] drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]">
              COOKED.
            </span>
          </motion.h1>

          {/* subtitle */}
          <motion.p
            variants={fadeUp}
            custom={2}
            className="mx-auto max-w-2xl text-lg leading-relaxed text-[var(--theme-text-muted)] sm:text-xl"
          >
            The only finance app that judges your Uber Eats addiction and lets
            your friends{" "}
            <span className="font-bold text-[var(--theme-primary)]">sabotage your budget</span>.
            💀💸 Track spending. Get roasted. Survive.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeUp} custom={3} className="flex flex-col items-center gap-4 pt-4">
            <SignedOut>
              <SignUpButton mode="modal" forceRedirectUrl="/quiz">
                <button className="group relative inline-flex items-center gap-2 rounded-2xl bg-[var(--theme-primary)] px-10 py-5 text-lg font-black text-[var(--theme-bg)] shadow-lg transition-all hover:scale-105 hover:opacity-90 active:scale-95">
                  <Skull className="h-5 w-5 transition group-hover:rotate-12" />
                  GET DIAGNOSED
                  {/* pulsing ring */}
                  <span className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-[var(--theme-primary)]/20" />
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center gap-2 rounded-2xl bg-[var(--theme-primary)] px-10 py-5 text-lg font-black text-[var(--theme-bg)] shadow-lg transition-all hover:scale-105 hover:opacity-90 active:scale-95"
              >
                <Flame className="h-5 w-5 transition group-hover:rotate-12" />
                ENTER THE DASHBOARD
              </Link>
            </SignedIn>
            <span className="text-xs font-medium text-[var(--theme-text-muted)]">
              no credit card needed · just vibes & bad decisions 📉
            </span>
          </motion.div>
        </motion.div>

        {/* bottom gradient fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-[var(--theme-bg)] to-transparent" />
      </section>

      {/* ════════════════════ SECTION 2 — CHOOSE YOUR FIGHTER ════════════════════ */}
      <section className="relative z-10 px-6 py-28">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-6xl"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-16 text-center">
            <h2 className="text-4xl font-black sm:text-5xl">
              Choose Your Fighter 🎯
            </h2>
            <p className="mt-4 text-lg text-[var(--theme-text-muted)]">
              Three personas. Three levels of financial delusion. Pick wisely (or
              don&rsquo;t, we don&rsquo;t care). 💀
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* ── Vanilla ── */}
            <motion.div
              variants={fadeUp}
              custom={1}
              className="group relative rotate-1 rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-8 backdrop-blur-xl transition-all hover:rotate-0 hover:border-[var(--theme-primary)]/30"
            >
              <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/50">
                <img
                  src="/assets/dummy-vanilla.gif"
                  alt="Vanilla theme"
                  className="h-48 w-full object-cover opacity-80 transition group-hover:scale-105 group-hover:opacity-100"
                />
              </div>
              <h3 className="text-2xl font-black">Vanilla 🥱</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--theme-text-muted)]">
                Clean. Minimal. <span className="text-[var(--theme-text)]">Boring.</span>{" "}
                For people who colour-code their spreadsheets and pretend they
                have their life together. You probably own a budgeting journal
                from Amazon. 📊
              </p>
              <span className="mt-4 inline-block rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-1 text-xs font-bold text-[var(--theme-text-muted)]">
                &quot;I&rsquo;m actually fine&quot;
              </span>
            </motion.div>

            {/* ── Brainrot ── */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="group relative -rotate-2 rounded-3xl border border-[var(--theme-primary)]/20 bg-[var(--theme-card)] p-8 backdrop-blur-xl transition-all hover:rotate-0 hover:border-[var(--theme-primary)]/40 hover:shadow-[0_0_40px_rgba(239,68,68,0.15)]"
            >
              <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--theme-primary)]/20 bg-[var(--theme-primary)]/10">
                <img
                  src="/assets/dummy-brainrot.gif"
                  alt="Brainrot theme"
                  className="h-48 w-full object-cover opacity-80 transition group-hover:scale-105 group-hover:opacity-100"
                />
              </div>
              <h3 className="text-2xl font-black">
                Brainrot{" "}
                <span className="text-[var(--theme-primary)]">🧠💥</span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--theme-text-muted)]">
                Vine booms on every click. Skibidi styling. Your dashboard looks
                like it was designed during a 3&nbsp;AM Discord call.{" "}
                <span className="font-bold text-[var(--theme-primary)]">
                  Ohio-level financial literacy.
                </span>{" "}
                🗿
              </p>
              <span className="mt-4 inline-block rounded-full border border-[var(--theme-primary)]/30 bg-[var(--theme-primary)]/10 px-3 py-1 text-xs font-bold text-[var(--theme-primary)]">
                &quot;it&rsquo;s giving bankruptcy&quot;
              </span>
            </motion.div>

            {/* ── Girl Math ── */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="group relative rotate-1 rounded-3xl border border-pink-500/20 bg-[var(--theme-card)] p-8 backdrop-blur-xl transition-all hover:rotate-0 hover:border-pink-500/40 hover:shadow-[0_0_40px_rgba(236,72,153,0.15)]"
            >
              <div className="mb-6 overflow-hidden rounded-2xl border border-pink-500/20 bg-pink-500/10">
                <img
                  src="/assets/dummy-girlmath.gif"
                  alt="Girl Math theme"
                  className="h-48 w-full object-cover opacity-80 transition group-hover:scale-105 group-hover:opacity-100"
                />
              </div>
              <h3 className="text-2xl font-black">
                Girl Math{" "}
                <span className="text-pink-400">💅✨</span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--theme-text-muted)]">
                Hot pink everything. If you pay in cash it was{" "}
                <span className="italic text-pink-300">literally free</span>.
                Returns mean the store owes YOU money. Math is just a suggestion.
                💖
              </p>
              <span className="mt-4 inline-block rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-xs font-bold text-pink-400">
                &quot;it&rsquo;s basically free&quot;
              </span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════ SECTION 3 — MULTIPLAYER SABOTAGE ════════════════════ */}
      <section className="relative z-10 overflow-hidden px-6 py-28">
        {/* background accent */}
        <div className="pointer-events-none absolute right-0 top-1/2 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/3 rounded-full bg-[var(--theme-primary)]/5 blur-[120px]" />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2"
        >
          {/* left — copy */}
          <motion.div variants={fadeUp} custom={0} className="space-y-6">
            <div className="flex items-center gap-2">
              <Swords className="h-6 w-6 text-[var(--theme-primary)]" />
              <span className="text-sm font-bold uppercase tracking-widest text-[var(--theme-primary)]">
                Multiplayer Sabotage
              </span>
            </div>
            <h2 className="text-4xl font-black leading-tight sm:text-5xl">
              Destroy your friends&rsquo;{" "}
              <span className="text-[var(--theme-primary)]">budgets</span> in real-time 🎯
            </h2>
            <p className="text-lg leading-relaxed text-[var(--theme-text-muted)]">
              See your friends&rsquo; terrible financial decisions the moment
              they happen. Hit them with a{" "}
              <span className="font-bold text-[var(--theme-primary)]">Sabotage Attack</span>{" "}
              and drain their budget before they drain yours. 💸 It&rsquo;s
              personal finance meets PvP combat. No mercy. 💀
            </p>
            <ul className="space-y-3 text-sm text-[var(--theme-text-muted)]">
              {[
                "Real-time expense feed — watch the carnage unfold 📉",
                "Sabotage attacks drain opponents' remaining budget 🔥",
                "Wall of Shame leaderboard for the biggest disasters 🏆",
                "Sound effects that make every bad decision louder 🔊",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-[var(--theme-primary)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* right — mock live feed */}
          <motion.div variants={fadeUp} custom={2} className="relative">
            {/* sabotage GIF overlay */}
            <img
              src="/assets/dummy-sabotage.gif"
              alt="sabotage"
              className="pointer-events-none absolute -right-6 -top-6 z-20 w-24 opacity-70 rotate-12"
            />

            <div className="rotate-2 rounded-3xl border border-[var(--theme-primary)]/20 bg-[var(--theme-card)] p-6 shadow-2xl backdrop-blur-xl transition hover:rotate-0">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[var(--theme-primary)]">
                  <TrendingDown className="h-4 w-4" /> Live Feed
                </h4>
                <span className="flex items-center gap-1.5 text-xs text-[var(--theme-text-muted)]">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--theme-primary)]" />
                  LIVE
                </span>
              </div>

              <div className="space-y-3">
                {fakeFeed.map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.15 }}
                    className="group relative flex items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-3 transition hover:border-[var(--theme-primary)]/20 hover:bg-[var(--theme-primary)]/5"
                  >
                    {/* avatar placeholder */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--theme-bg)] text-lg">
                      {event.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-bold text-[var(--theme-text)]">
                        {event.user}
                      </span>{" "}
                      <span className="text-sm text-[var(--theme-text-muted)]">{event.text}</span>
                    </div>
                    {/* crosshair on hover */}
                    <Crosshair className="h-5 w-5 shrink-0 text-transparent transition group-hover:text-[var(--theme-primary)]" />
                  </motion.div>
                ))}
              </div>

              {/* sabotage button mock */}
              <div className="mt-5 flex justify-end">
                <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--theme-primary)]/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-[var(--theme-primary)] ring-1 ring-[var(--theme-primary)]/20">
                  <Crosshair className="h-3.5 w-3.5" /> Sabotage
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════ SECTION 4 — BOTTOM CTA ════════════════════ */}
      <section className="relative z-10 px-6 py-28">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[400px] rounded-full bg-[var(--theme-primary)]/10 blur-[140px]" />
        </div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-4xl font-black sm:text-5xl">
            Ready to get <span className="text-[var(--theme-primary)]">cooked</span>? 🍳
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-4 text-lg text-[var(--theme-text-muted)]">
            Join the chaos. Take the quiz. Find out what kind of financial disaster you are.<br />
            Your wallet will never forgive you.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="mt-8 flex justify-center">
            <SignedOut>
              <SignUpButton mode="modal" forceRedirectUrl="/quiz">
                <button className="group relative inline-flex items-center gap-2 rounded-2xl bg-[var(--theme-primary)] px-10 py-5 text-lg font-black text-[var(--theme-bg)] shadow-lg transition-all hover:scale-105 hover:opacity-90 active:scale-95">
                  <Skull className="h-5 w-5 transition group-hover:rotate-12" />
                  GET DIAGNOSED 💀
                  <span className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-[var(--theme-primary)]/20" />
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-2xl bg-[var(--theme-primary)] px-10 py-5 text-lg font-black text-[var(--theme-bg)] shadow-lg transition-all hover:scale-105 hover:opacity-90 active:scale-95"
              >
                <Flame className="h-5 w-5 transition group-hover:rotate-12" />
                ENTER THE DASHBOARD
              </Link>
            </SignedIn>
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="border-t border-[var(--theme-border)] py-10 text-center text-xs text-[var(--theme-text-muted)]">
        <p>
          © 2025 Financially Cooked · Built at a hackathon with zero sleep and
          questionable decisions 🍔📉
        </p>
      </footer>
    </main>
  );
}