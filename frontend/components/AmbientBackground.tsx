"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/src/context/ThemeContext";
import { useMemo } from "react";

/* ── Positions shared across vanilla / girlmath ─────────────────────── */
const POSITIONS = [
  { top: "8%",  left: "12%",  duration: 18, delay: 0 },
  { top: "15%", left: "75%",  duration: 22, delay: 2 },
  { top: "35%", left: "5%",   duration: 16, delay: 4 },
  { top: "55%", left: "65%",  duration: 25, delay: 1 },
  { top: "70%", left: "30%",  duration: 20, delay: 3 },
  { top: "25%", left: "45%",  duration: 23, delay: 5 },
  { top: "80%", left: "80%",  duration: 17, delay: 2 },
  { top: "45%", left: "85%",  duration: 26, delay: 0 },
  { top: "90%", left: "15%",  duration: 21, delay: 4 },
  { top: "5%",  left: "55%",  duration: 19, delay: 3 },
];

const VANILLA_ITEMS  = ["📈", "ROI", "💰", "SYNERGY", "🏦", "Q4", "📊", "LIQUIDITY", "DIVERSIFY", "💳"];
const GIRLMATH_ITEMS = ["💅", "Slayyy", "🍵", "✨", "GIRL MATH", "🛍️", "🎀", "BASICALLY FREE", "💸", "PERIODT"];

/* ── Blob presets per theme ──────────────────────────────────────────── */
const VANILLA_BLOBS = [
  { className: "bg-red-400/40 dark:bg-red-900/40",    size: "w-[600px] h-[600px]", pos: "top-[-10%] left-[-10%]",   anim: { x: [0, 120, -60, 0], y: [0, 80, -40, 0] },   dur: 24 },
  { className: "bg-orange-300/30 dark:bg-orange-900/20", size: "w-[500px] h-[500px]", pos: "bottom-[-10%] right-[-5%]", anim: { x: [0, -100, 60, 0], y: [0, -70, 50, 0] },   dur: 28 },
  { className: "bg-zinc-300/50 dark:bg-zinc-800/50",   size: "w-[800px] h-[400px]", pos: "top-[40%] left-[20%]",    anim: { x: [0, 60, -80, 0], y: [0, -30, 40, 0] },    dur: 32 },
];

const GIRLMATH_BLOBS = [
  { className: "bg-pink-300/40 dark:bg-pink-900/30",     size: "w-[600px] h-[600px]", pos: "top-[-10%] left-[-10%]",   anim: { x: [0, 100, -50, 0], y: [0, 70, -30, 0] },   dur: 22 },
  { className: "bg-green-300/30 dark:bg-green-900/20",   size: "w-[500px] h-[500px]", pos: "bottom-[-10%] right-[-5%]", anim: { x: [0, -80, 50, 0], y: [0, -60, 40, 0] },    dur: 26 },
  { className: "bg-purple-300/30 dark:bg-purple-900/20", size: "w-[800px] h-[400px]", pos: "top-[40%] left-[20%]",    anim: { x: [0, 50, -70, 0], y: [0, -25, 35, 0] },    dur: 30 },
];

/* ── Brainrot GIF flood ─────────────────────────────────────────────── */
const BRAINROT_GIFS = [
  "/assets/gifs/broke-monke.gif",
  "/assets/gifs/dumb-big-booty-bih.gif",
  "/assets/gifs/niche-baby.gif",
  "/assets/gifs/patrick.gif",
  "/assets/gifs/shut-up-and-take-my-money.gif",
  "/assets/gifs/wallet-empty.gif",
  "/assets/gifs/footsteps-electricity.gif",
];

const GIF_COUNT = 18;

/** Deterministic-ish seed per slot so layout doesn't shuffle on re-render */
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49271;
  return x - Math.floor(x);
}

function buildGifSlots() {
  return Array.from({ length: GIF_COUNT }, (_, i) => {
    const r = seededRandom;
    return {
      src: BRAINROT_GIFS[i % BRAINROT_GIFS.length],
      top: `${r(i * 1) * 90}%`,
      left: `${r(i * 2 + 7) * 90}%`,
      size: 80 + r(i * 3 + 13) * 120,          // 80-200px
      duration: 12 + r(i * 4 + 19) * 18,        // 12-30s drift cycle
      delay: r(i * 5 + 31) * 6,                 // 0-6s stagger
      rotate: (r(i * 6 + 37) - 0.5) * 40,       // ±20°
      driftX: (r(i * 7 + 41) - 0.5) * 200,      // ±100px
      driftY: (r(i * 8 + 43) - 0.5) * 160,      // ±80px
    };
  });
}

export default function AmbientBackground() {
  const { theme } = useTheme();

  const isBrainrot = theme === "brainrot";
  const isGirlmath = theme === "girlmath";
  const blobs = isGirlmath ? GIRLMATH_BLOBS : VANILLA_BLOBS;
  const texts = isGirlmath ? GIRLMATH_ITEMS : VANILLA_ITEMS;

  const gifSlots = useMemo(() => buildGifSlots(), []);

  /* ── Brainrot: chaotic GIF flood ── */
  if (isBrainrot) {
    return (
      <div
        className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: "var(--theme-bg)" }}
      >
        {/* Underlying blobs (same as vanilla but lower opacity) */}
        {VANILLA_BLOBS.map((blob, i) => (
          <motion.div
            key={`br-blob-${i}`}
            className={`absolute rounded-full blur-[120px] opacity-30 dark:opacity-20 ${blob.size} ${blob.pos} ${blob.className}`}
            animate={blob.anim}
            transition={{ duration: blob.dur, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          />
        ))}

        {/* GIF flood */}
        {gifSlots.map((g, i) => (
          <motion.img
            key={`br-gif-${i}`}
            src={g.src}
            alt=""
            draggable={false}
            className="absolute rounded-xl opacity-25 dark:opacity-15 select-none"
            style={{ top: g.top, left: g.left, width: g.size, height: "auto", rotate: `${g.rotate}deg` }}
            animate={{ x: [0, g.driftX, 0], y: [0, g.driftY, 0], rotate: [g.rotate, -g.rotate, g.rotate] }}
            transition={{
              duration: g.duration,
              delay: g.delay,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  }

  /* ── Vanilla / Girl Math: blobs + floating text ── */
  return (
    <div
      className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-500"
      style={{ backgroundColor: "var(--theme-bg)" }}
    >
      {/* Color blobs */}
      {blobs.map((blob, i) => (
        <motion.div
          key={`${theme}-blob-${i}`}
          className={`absolute rounded-full blur-[120px] opacity-50 dark:opacity-40 ${blob.size} ${blob.pos} ${blob.className}`}
          animate={blob.anim}
          transition={{ duration: blob.dur, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}

      {/* Floating text & emojis */}
      {texts.map((text, i) => {
        const p = POSITIONS[i];
        return (
          <motion.div
            key={`${theme}-text-${i}`}
            className={`absolute text-2xl md:text-4xl font-black select-none pointer-events-none ${
              isGirlmath
                ? "text-pink-300/30 dark:text-pink-900/35"
                : "text-zinc-300/40 dark:text-zinc-800/40"
            }`}
            style={{ top: p.top, left: p.left }}
            animate={{ y: [0, -30, 0], rotate: [-5, 5, -5] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          >
            {text}
          </motion.div>
        );
      })}
    </div>
  );
}
