"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useTheme, Theme } from "@/src/context/ThemeContext";
import SabotageAttackModal, { Player } from "@/components/SabotageAttackModal";
import { Flame, Skull, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Theme-specific config ────────────────────────────────────────────────────
const THEME_CONFIG: Record<
  Theme,
  { label: string; accent: string; bg: string; gif?: string; sfx?: string; icon: React.ReactNode }
> = {
  vanilla: {
    label: "Vanilla",
    accent: "text-zinc-700",
    bg: "from-zinc-50 to-zinc-200",
    icon: <Sparkles className="h-5 w-5" />,
  },
  brainrot: {
    label: "Brainrot",
    accent: "text-red-500",
    bg: "from-zinc-950 via-red-950/30 to-zinc-950",
    gif: "/assets/gifs/brainrot.gif",
    sfx: "/assets/sound-effects/brainrot.mp3",
    icon: <Skull className="h-5 w-5" />,
  },
  girlmath: {
    label: "Girl Math",
    accent: "text-pink-500",
    bg: "from-pink-50 via-fuchsia-100 to-pink-50",
    gif: "/assets/gifs/girlmath.gif",
    sfx: "/assets/sound-effects/girlmath.mp3",
    icon: <Flame className="h-5 w-5" />,
  },
};

// ── Placeholder players (replace with real API data later) ───────────────────
const MOCK_PLAYERS: Player[] = [
  { id: "p1", name: "CryptoKing69", avatar: "💀" },
  { id: "p2", name: "BudgetBro", avatar: "🤡" },
  { id: "p3", name: "SigmaSpender", avatar: "🐺" },
  { id: "p4", name: "TakeoutTyrant", avatar: "🍔" },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { userId } = useAuth();
  const { theme, setTheme } = useTheme();

  const [profile, setProfile] = useState<{
    persona: string;
    theme_preference: string;
    monthly_limit: number;
    roast?: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [sfxEnabled, setSfxEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cfg = THEME_CONFIG[theme];

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) {
        setProfileLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/${userId}`);

        if (res.status === 404) {
          setProfile(null);
          return;
        }

        if (!res.ok) {
          const errorPayload = await res.text();
          console.error("Failed to fetch profile:", errorPayload);
          setProfile(null);
          return;
        }

        const data = await res.json();
        setProfile(data);

        if (data?.theme_preference && data.theme_preference in THEME_CONFIG) {
          setTheme(data.theme_preference as Theme);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    }

    fetchProfile();
  }, [setTheme, userId]);

  // Play theme SFX when theme has one and user opted in
  useEffect(() => {
    if (!cfg.sfx || !sfxEnabled) return;
    const audio = new Audio(cfg.sfx);
    audio.loop = true;
    audio.volume = 0.3;
    audio.play().catch(() => {}); // browsers may block autoplay
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [cfg.sfx, sfxEnabled]);

  const handleAttack = (victimId: string, penalty: number) => {
    // TODO: POST to backend sabotage endpoint
    console.log(`[SABOTAGE] Attacked ${victimId} for $${penalty}`);
  };

  return (
    <main
      className={`min-h-screen bg-gradient-to-b ${cfg.bg} transition-colors duration-700`}
    >
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/5 border-b border-white/10">
        <h1 className="font-black text-xl tracking-tighter">
          FINANCIALLY COOKED<span className={cfg.accent}>.</span>
        </h1>
        <div className="flex items-center gap-3">
          {/* SFX toggle */}
          {cfg.sfx && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSfxEnabled((v) => !v)}
              className="rounded-full"
            >
              {sfxEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        {/* ── Hero banner ────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8">
          {/* Theme GIF background */}
          {cfg.gif && (
            <img
              src={cfg.gif}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-10 pointer-events-none"
            />
          )}
          <div className="relative z-10 flex flex-col items-center text-center gap-4">
            <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${cfg.accent}`}>
              {cfg.icon}
              {cfg.label} Mode
            </div>
            <h2 className="text-4xl font-black">Your Dashboard</h2>
            <p className="text-sm text-zinc-500 max-w-md">
              Track your budget, flex your persona, and sabotage your friends before they sabotage you.
            </p>
          </div>
        </section>

        {/* ── Quick actions row ──────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Sabotage card */}
          <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-6 flex flex-col items-center gap-4">
            <Skull className="h-8 w-8 text-red-500" />
            <p className="text-sm font-bold text-zinc-400">Cause Chaos</p>
            <SabotageAttackModal
              players={MOCK_PLAYERS}
              onAttack={handleAttack}
            />
          </div>

          {/* Budget card placeholder */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 flex flex-col items-center gap-4">
            <span className="text-4xl">💸</span>
            <p className="text-sm font-bold text-zinc-400">Monthly Budget</p>
            <p className="text-3xl font-black">
              {profileLoading
                ? "Loading..."
                : `$${(profile?.monthly_limit ?? 0).toFixed(2)}`}
            </p>
            <p className="text-xs text-zinc-600">
              {profile ? "Live from your profile" : "Complete the quiz to unlock"}
            </p>
          </div>

          {/* Persona card placeholder */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 flex flex-col items-center gap-4">
            <span className="text-4xl">🎭</span>
            <p className="text-sm font-bold text-zinc-400">Your Persona</p>
            <p className="text-lg font-black text-center">
              {profileLoading ? "Loading..." : profile?.persona ?? "???"}
            </p>
            <p className="text-xs text-zinc-600 text-center">
              {profile?.roast ?? "AI-assigned after the quiz"}
            </p>
          </div>
        </section>

        {/* ── Theme switcher (debug / demo) ──────────────────────── */}
        <section className="flex items-center justify-center gap-3 pt-4">
          <span className="text-xs text-zinc-500 uppercase tracking-widest mr-2">Theme:</span>
          {(Object.keys(THEME_CONFIG) as Theme[]).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={t === theme ? "default" : "outline"}
              onClick={() => setTheme(t)}
              className="text-xs capitalize"
            >
              {THEME_CONFIG[t].label}
            </Button>
          ))}
        </section>
      </div>
    </main>
  );
}
