"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Moon,
  Sun,
  Skull,
  Sparkles,
  Flame,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTheme, Theme } from "@/src/context/ThemeContext";
import { useDarkMode } from "@/src/context/DarkModeContext";
import { cn } from "@/lib/utils";
import { useState } from "react";
import AmbientBackground from "@/components/AmbientBackground";
import IdleVideoPlayer from "@/components/IdleVideoPlayer";

/* ── Nav items ─────────────────────────────── */
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const THEME_OPTIONS: { key: Theme; label: string; icon: React.ReactNode }[] = [
  { key: "vanilla", label: "Vanilla", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { key: "brainrot", label: "Brainrot", icon: <Skull className="h-3.5 w-3.5" /> },
  { key: "girlmath", label: "Girl Math", icon: <Flame className="h-3.5 w-3.5" /> },
];

/* ══════════════════════════════════════════════ */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { dark, toggleDark } = useDarkMode();
  const { user } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden text-[var(--theme-text)]">
      <AmbientBackground />
      <IdleVideoPlayer />

      {/* ── Sidebar (nav only) ── */}
      <aside
        className={cn(
          "sticky top-0 z-30 flex h-screen flex-col justify-between border-r transition-all duration-300",
          "bg-[var(--theme-sidebar)] border-[var(--theme-border)] backdrop-blur-xl",
          collapsed ? "w-17" : "w-56",
        )}
      >
        <div className="flex flex-col">
          {/* Logo + collapse toggle */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-[var(--theme-border)]">
            {!collapsed && (
              <Link href="/dashboard" className="select-none truncate text-sm font-black tracking-tight">
                FINANCIALLY <span className="text-[var(--theme-primary)]">COOKED.</span>
              </Link>
            )}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1 px-2 pt-4">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800",
                    collapsed && "justify-center px-0",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: dark mode toggle */}
        <div className="border-t border-[var(--theme-border)] p-3">
          <button
            onClick={toggleDark}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all w-full",
              "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800",
              collapsed && "justify-center px-0",
            )}
            title={dark ? "Switch to Light" : "Switch to Dark"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && (dark ? "Light Mode" : "Dark Mode")}
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── Top header bar ── */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-sidebar)] backdrop-blur-xl px-6">
          {/* Left: page title */}
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
            {NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label ?? ""}
          </h2>

          {/* Right: theme selector + user */}
          <div className="flex items-center gap-4">
            {/* Theme pill toggle */}
            <div className="flex items-center gap-0.5 rounded-full border border-[var(--theme-border)] bg-zinc-100/80 dark:bg-zinc-900/80 p-1 backdrop-blur">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all",
                    theme === opt.key
                      ? opt.key === "brainrot"
                        ? "bg-red-500 text-white shadow-sm"
                        : opt.key === "girlmath"
                          ? "bg-pink-500 text-white shadow-sm"
                          : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
                  )}
                >
                  {opt.icon}
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* User name + avatar */}
            <div className="flex items-center gap-3">
              <span className="hidden text-sm font-semibold text-[var(--theme-text-muted)] sm:inline">
                {user?.fullName || "Spender"}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        {children}
      </div>
    </div>
  );
}
