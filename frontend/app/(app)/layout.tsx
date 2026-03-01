"use client";

import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Sidebar />
      {children}
    </div>
  );
}
