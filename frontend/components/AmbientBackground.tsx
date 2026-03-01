"use client";

import { motion } from "framer-motion";

const FLOATING_ITEMS = [
  { text: "📈", top: "8%",  left: "12%",  duration: 18, delay: 0 },
  { text: "ROI", top: "15%", left: "75%",  duration: 22, delay: 2 },
  { text: "💰", top: "35%", left: "5%",   duration: 16, delay: 4 },
  { text: "SYNERGY", top: "55%", left: "65%", duration: 25, delay: 1 },
  { text: "🏦", top: "70%", left: "30%",  duration: 20, delay: 3 },
  { text: "Q4",  top: "25%", left: "45%",  duration: 23, delay: 5 },
  { text: "📊", top: "80%", left: "80%",  duration: 17, delay: 2 },
  { text: "LIQUIDITY", top: "45%", left: "85%", duration: 26, delay: 0 },
  { text: "DIVERSIFY", top: "90%", left: "15%", duration: 21, delay: 4 },
  { text: "💳", top: "5%",  left: "55%",  duration: 19, delay: 3 },
];

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-zinc-50 dark:bg-zinc-950">
      {/* Blob 1 — Red accent */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-50 dark:opacity-40 bg-red-400/40 dark:bg-red-900/40 top-[-10%] left-[-10%]"
        animate={{ x: [0, 120, -60, 0], y: [0, 80, -40, 0] }}
        transition={{ duration: 24, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
      {/* Blob 2 — Orange warmth */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-50 dark:opacity-40 bg-orange-300/30 dark:bg-orange-900/20 bottom-[-10%] right-[-5%]"
        animate={{ x: [0, -100, 60, 0], y: [0, -70, 50, 0] }}
        transition={{ duration: 28, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
      {/* Blob 3 — Zinc shadow */}
      <motion.div
        className="absolute w-[800px] h-[400px] rounded-full blur-[120px] opacity-50 dark:opacity-40 bg-zinc-300/50 dark:bg-zinc-800/50 top-[40%] left-[20%]"
        animate={{ x: [0, 60, -80, 0], y: [0, -30, 40, 0] }}
        transition={{ duration: 32, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      {/* Floating satirical finance text & emojis */}
      {FLOATING_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl md:text-4xl font-black text-zinc-300/40 dark:text-zinc-800/40 select-none pointer-events-none"
          style={{ top: item.top, left: item.left }}
          animate={{ y: [0, -30, 0], rotate: [-5, 5, -5] }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        >
          {item.text}
        </motion.div>
      ))}
    </div>
  );
}
