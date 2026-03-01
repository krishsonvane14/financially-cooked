"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "@/src/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const IDLE_TIMEOUT_MS = 15_000; // 15 seconds of inactivity
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];

export default function IdleVideoPlayer() {
  const { theme } = useTheme();
  const [isIdle, setIsIdle] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsIdle(false);
    setDismissed(false);
    timerRef.current = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    // Only track idle when brainrot is active
    if (theme !== "brainrot") {
      setIsIdle(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Kick off first timer
    timerRef.current = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT_MS);

    const handler = () => resetTimer();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [theme, resetTimer]);

  // Auto-play when visible
  useEffect(() => {
    if (isIdle && !dismissed && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isIdle, dismissed]);

  const show = theme === "brainrot" && isIdle && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-4 right-4 z-50 w-52 md:w-64 aspect-[9/16] rounded-2xl shadow-2xl border-4 border-red-500 overflow-hidden bg-black"
        >
          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Label */}
          <div className="absolute top-2 left-2 z-10 rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
            Brainrot Mode
          </div>

          {/* Subway Surfers video */}
          <video
            ref={videoRef}
            src="/assets/videos/subway-surfers.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
