"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Moon,
  Sun,
  Flame,
  Skull,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTheme, Theme } from "@/src/context/ThemeContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const THEME_OPTIONS: { key: Theme; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "vanilla", label: "Vanilla", icon: <Sparkles className="h-4 w-4" />, color: "text-zinc-500" },
  { key: "brainrot", label: "Brainrot", icon: <Skull className="h-4 w-4" />, color: "text-red-500" },
  { key: "girlmath", label: "Girl Math", icon: <Flame className="h-4 w-4" />, color: "text-pink-500" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  };

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 flex h-screen flex-col justify-between border-r transition-all duration-300",
        "bg-white/60 border-zinc-200 dark:bg-zinc-950/80 dark:border-zinc-800 backdrop-blur-xl",
        collapsed ? "w-17" : "w-60",
      )}
    >
      {/* Top section */}
      <div className="flex flex-col">
        {/* Logo + collapse */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
          {!collapsed && (
            <span className="text-sm font-black tracking-tight select-none truncate">
              FINANCIALLY<span className="text-red-500">.</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
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

        {/* Theme switcher */}
        {!collapsed && (
          <div className="mx-3 mt-6">
            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Theme
            </p>
            <div className="flex flex-col gap-1">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                    theme === opt.key
                      ? "bg-zinc-100 dark:bg-zinc-800 " + opt.color
                      : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-2 border-t border-zinc-200 dark:border-zinc-800 p-3">
        {/* Dark / Light toggle (vanilla only visual, always functional) */}
        <button
          onClick={toggleDark}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
            "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800",
            collapsed && "justify-center px-0",
          )}
          title={dark ? "Switch to Light" : "Switch to Dark"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && (dark ? "Light Mode" : "Dark Mode")}
        </button>

        {/* User avatar */}
        <div className={cn("flex items-center gap-3 px-2 py-1", collapsed && "justify-center px-0")}>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  );
}
