"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Flame, Loader2, Skull, Sparkles, Volume2, VolumeX } from "lucide-react";
import ExpenseForm from "@/components/ExpenseForm";
import SabotageAttackModal, { Player } from "@/components/SabotageAttackModal";
import { Button } from "@/components/ui/button";
import { useTheme, Theme } from "@/src/context/ThemeContext";

type ProfileResponse = {
  persona: string;
  theme_preference: Theme | string;
  monthly_limit: number;
  roast?: string;
};

type LeaderboardResponse = {
  rankings?: Array<{ id: string; username?: string; persona: string; monthly_limit: number }>;
};

const THEME_CONFIG: Record<
  Theme,
  { label: string; accent: string; bg: string; card: string; sfx?: string; icon: React.ReactNode }
> = {
  vanilla: {
    label: "Vanilla",
    accent: "text-zinc-700",
    bg: "from-zinc-50 via-zinc-100 to-zinc-200",
    card: "bg-white/80 border-zinc-200",
    icon: <Sparkles className="h-4 w-4" />,
  },
  brainrot: {
    label: "Brainrot",
    accent: "text-red-500",
    bg: "from-zinc-950 via-red-950/30 to-zinc-950",
    card: "bg-zinc-900/70 border-zinc-800",
    sfx: "/assets/sound-effects/fahh-but-louder.mp3",
    icon: <Skull className="h-4 w-4" />,
  },
  girlmath: {
    label: "Girl Math",
    accent: "text-pink-500",
    bg: "from-pink-50 via-fuchsia-100 to-pink-50",
    card: "bg-white/80 border-pink-200",
    sfx: "/assets/sound-effects/girlmath.mp3",
    icon: <Flame className="h-4 w-4" />,
  },
};

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const isTheme = (value: string): value is Theme => value in THEME_CONFIG;

export default function DashboardPage() {
  const { userId } = useAuth();
  const { theme, setTheme } = useTheme();
  const config = THEME_CONFIG[theme];

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

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
          const detail = await res.text();
          console.error("Failed to fetch profile:", detail);
          setProfile(null);
          return;
        }

        const data = (await res.json()) as ProfileResponse;
        setProfile(data);

        if (typeof data.theme_preference === "string" && isTheme(data.theme_preference)) {
          setTheme(data.theme_preference);
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

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard`);
        if (!res.ok) {
          setPlayers([]);
          return;
        }

        const data = (await res.json()) as LeaderboardResponse;
        const rankings = Array.isArray(data.rankings) ? data.rankings : [];

        const mapped = rankings
          .filter((row) => row.id && row.id !== userId)
          .map((row) => ({
            id: row.id,
            name: row.username || row.persona || "Unknown Player",
            avatar: "🎯",
          }));

        setPlayers(mapped);
      } catch (error) {
        console.error("Failed to fetch players:", error);
        setPlayers([]);
      } finally {
        setPlayersLoading(false);
      }
    }

    fetchPlayers();
  }, [userId]);

  useEffect(() => {
    if (!config.sfx || !sfxEnabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return;
    }

    const audio = new Audio(config.sfx);
    audio.loop = true;
    audio.volume = 0.3;
    audio.play().catch(() => {});
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [config.sfx, sfxEnabled]);

  const monthlyBudget = profile?.monthly_limit ?? 0;

  const statusText = useMemo(() => {
    if (profileLoading) {
      return "Loading profile...";
    }
    if (!profile) {
      return "Complete the quiz to unlock your profile.";
    }
    return profile.roast || "Your finances are being judged in real time.";
  }, [profile, profileLoading]);

  async function handleAttack(victimId: string, penalty: number) {
    if (!userId) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sabotage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attacker_id: userId, victim_id: victimId, penalty }),
      });

      if (!res.ok) {
        console.error("Sabotage failed:", await res.text());
      }
    } catch (error) {
      console.error("Sabotage failed:", error);
    }
  }

  return (
    <main className={`min-h-screen bg-linear-to-b ${config.bg} transition-colors duration-500`}>
      <header className="sticky top-0 z-30 border-b border-black/10 bg-white/70 backdrop-blur dark:bg-zinc-950/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <h1 className="text-sm font-black tracking-wider">
            FINANCIALLY COOKED<span className={config.accent}>.</span>
          </h1>

          <div className="flex items-center gap-2">
            {config.sfx && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSfxEnabled((prev) => !prev)}
                className="h-8 w-8 rounded-full"
              >
                {sfxEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            )}

            {playersLoading ? (
              <Button size="sm" variant="destructive" disabled className="gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Targets
              </Button>
            ) : (
              <SabotageAttackModal players={players} onAttack={handleAttack} />
            )}

            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <section className={`rounded-2xl border p-6 shadow-sm ${config.card}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Current Persona</p>
              <h2 className="mt-2 text-2xl font-black">
                {profileLoading ? "Loading..." : profile?.persona ?? "???"}
              </h2>
              <p className="mt-2 text-sm text-zinc-600">{statusText}</p>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Monthly Budget</p>
              <p className="mt-2 text-4xl font-black">{USD.format(monthlyBudget)}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className={`rounded-2xl border p-6 ${config.card}`}>
            <ExpenseForm userId={userId ?? null} />
          </div>

          <div className={`rounded-2xl border p-6 lg:col-span-2 ${config.card}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Theme Mode</h3>
              <span className="text-xs text-zinc-500">Choose your dashboard vibe</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(THEME_CONFIG) as Theme[]).map((themeKey) => (
                <Button
                  key={themeKey}
                  size="sm"
                  variant={themeKey === theme ? "default" : "outline"}
                  onClick={() => setTheme(themeKey)}
                  className="gap-2"
                >
                  {THEME_CONFIG[themeKey].icon}
                  {THEME_CONFIG[themeKey].label}
                </Button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
