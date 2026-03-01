"use client";

import { useState, useEffect, useCallback } from "react";
import { Crosshair, Skull, Zap, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// ── Types ────────────────────────────────────────────────────────────────────
export interface Player {
  id: string;
  name: string;
  avatar?: string;
}

interface SabotageAttackModalProps {
  /** List of players the attacker can target */
  players: Player[];
  /** Called when the user confirms the attack */
  onAttack: (victimId: string, penalty: number) => void;
  /** Maximum penalty allowed (default 10 000) */
  maxPenalty?: number;
  /** Optional: control open state externally */
  open?: boolean;
  /** Optional: callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

// ── Glitch text helper ───────────────────────────────────────────────────────
const GLITCH_CHARS = "!@#$%^&*░▒▓█▄▀₿Ξ";

function useGlitchText(base: string, active: boolean) {
  const [text, setText] = useState(base);

  useEffect(() => {
    if (!active) {
      setText(base);
      return;
    }
    const id = setInterval(() => {
      const arr = base.split("");
      const idx = Math.floor(Math.random() * arr.length);
      arr[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      setText(arr.join(""));
    }, 80);
    return () => clearInterval(id);
  }, [active, base]);

  return text;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function SabotageAttackModal({
  players,
  onAttack,
  maxPenalty = 10_000,
  open: controlledOpen,
  onOpenChange,
}: SabotageAttackModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const [victimId, setVictimId] = useState<string>("");
  const [penalty, setPenalty] = useState<string>("");
  const [isHovering, setIsHovering] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const glitchTitle = useGlitchText("SABOTAGE ATTACK", isOpen);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setVictimId("");
      setPenalty("");
      setLaunching(false);
    }
  }, [isOpen]);

  const penaltyNum = Number(penalty);
  const isValid = victimId !== "" && penaltyNum > 0 && penaltyNum <= maxPenalty;

  const handleLaunch = useCallback(() => {
    if (!isValid) {
      setShakeKey((k) => k + 1);
      return;
    }
    setLaunching(true);
    // Simulate a dramatic delay, then fire
    setTimeout(() => {
      onAttack(victimId, penaltyNum);
      setLaunching(false);
      setIsOpen(false);
    }, 900);
  }, [isValid, victimId, penaltyNum, onAttack, setIsOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Default trigger – can be overridden by controlling open externally */}
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            className="group relative gap-2 overflow-hidden font-black tracking-wide uppercase
                       bg-gradient-to-r from-red-700 via-red-600 to-orange-600
                       hover:from-red-600 hover:via-orange-500 hover:to-yellow-500
                       shadow-lg shadow-red-900/40 hover:shadow-red-500/50
                       transition-all duration-300 hover:scale-105"
          >
            <Crosshair className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            Sabotage
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </DialogTrigger>
      )}

      <DialogContent
        className="sm:max-w-[440px] border-red-900/60 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950
                   shadow-[0_0_80px_-12px_rgba(239,68,68,0.35)] overflow-hidden"
      >
        {/* Animated scanline overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)",
            animation: "scanline 4s linear infinite",
          }}
        />

        {/* Top decorative bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse" />

        <DialogHeader className="relative z-20">
          <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-widest text-red-500">
            <Skull className="h-7 w-7 text-red-400 animate-pulse" />
            <span
              className="bg-gradient-to-r from-red-400 via-orange-400 to-red-500 bg-clip-text text-transparent
                         drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]"
              style={{ fontFamily: "monospace" }}
            >
              {glitchTitle}
            </span>
          </DialogTitle>
          <DialogDescription className="text-zinc-500 italic text-xs tracking-wide mt-1">
            <AlertTriangle className="inline h-3 w-3 mr-1 text-yellow-500" />
            Choose your target wisely. There is no going back.
          </DialogDescription>
        </DialogHeader>

        {/* ── Form Body ─────────────────────────────────────────────── */}
        <div className="relative z-20 space-y-6 py-4">
          {/* Victim selector */}
          <div className="space-y-2">
            <Label
              htmlFor="victim"
              className="text-xs font-bold uppercase tracking-widest text-zinc-400"
            >
              Select Victim
            </Label>
            <Select value={victimId} onValueChange={setVictimId}>
              <SelectTrigger
                id="victim"
                className="bg-zinc-800/70 border-zinc-700 text-zinc-100
                           focus:ring-red-500/50 focus:border-red-500
                           hover:border-red-700 transition-colors"
              >
                <SelectValue placeholder="Who's getting cooked? 🍳" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {players.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="text-zinc-200 focus:bg-red-900/40 focus:text-red-200"
                  >
                    <span className="flex items-center gap-2">
                      {p.avatar && <span>{p.avatar}</span>}
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Penalty input */}
          <div className="space-y-2">
            <Label
              htmlFor="penalty"
              className="text-xs font-bold uppercase tracking-widest text-zinc-400"
            >
              Penalty Amount ($)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 font-bold text-lg">
                $
              </span>
              <Input
                id="penalty"
                type="number"
                min={1}
                max={maxPenalty}
                placeholder="0"
                value={penalty}
                onChange={(e) => setPenalty(e.target.value)}
                className="pl-8 bg-zinc-800/70 border-zinc-700 text-zinc-100 text-lg font-mono
                           placeholder:text-zinc-600
                           focus:ring-red-500/50 focus:border-red-500
                           hover:border-red-700 transition-colors
                           [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                           [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {penaltyNum > maxPenalty && (
              <p className="text-xs text-red-400 animate-pulse">
                Max penalty is ${maxPenalty.toLocaleString()}. Chill.
              </p>
            )}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <DialogFooter className="relative z-20 flex-col gap-3 sm:flex-col">
          {/* THE BUTTON */}
          <button
            key={shakeKey}
            type="button"
            disabled={launching}
            onClick={handleLaunch}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`
              group relative w-full py-4 rounded-xl font-black text-xl tracking-[0.25em] uppercase
              text-white cursor-pointer select-none
              transition-all duration-300
              ${
                isValid
                  ? `bg-gradient-to-r from-red-700 via-red-600 to-orange-600
                     hover:from-red-500 hover:via-orange-500 hover:to-yellow-500
                     hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)]
                     active:scale-[0.97]`
                  : "bg-zinc-700 opacity-50 cursor-not-allowed"
              }
              ${launching ? "animate-pulse scale-[0.97]" : ""}
              ${!isValid && shakeKey ? "animate-[headShake_0.5s_ease-in-out]" : ""}
            `}
          >
            {/* Glow pulse behind button */}
            {isValid && (
              <span
                className="absolute inset-0 -z-10 rounded-xl blur-xl opacity-0 group-hover:opacity-60
                           bg-gradient-to-r from-red-600 via-orange-500 to-red-600 transition-opacity duration-500"
              />
            )}

            <span className="relative flex items-center justify-center gap-3">
              <Zap
                className={`h-6 w-6 transition-transform duration-300 ${
                  isHovering ? "rotate-12 scale-125" : ""
                }`}
              />
              {launching ? "LAUNCHING..." : "LAUNCH ATTACK"}
              <Zap
                className={`h-6 w-6 transition-transform duration-300 ${
                  isHovering ? "-rotate-12 scale-125" : ""
                }`}
              />
            </span>
          </button>

          <p className="text-center text-[10px] text-zinc-600 tracking-wider">
            ⚠ THIS ACTION IS IRREVERSIBLE. YOUR FRIENDSHIP MIGHT NOT SURVIVE. ⚠
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
