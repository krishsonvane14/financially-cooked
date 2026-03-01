"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Users } from "lucide-react";
import GroupManager, { Group } from "@/components/GroupManager";
import SplitExpenseForm from "@/components/SplitExpenseForm";
import DebtLedger from "@/components/DebtLedger";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function GroupsPage() {
  const { userId } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${apiBase}/api/groups/${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      setGroups(data.groups ?? []);
    } catch (e) {
      console.error("Failed to fetch groups:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  if (!userId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Groups</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Create squads, split expenses, and get everyone financially cooked together.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Create group */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl p-6 shadow-sm">
            <GroupManager
              userId={userId}
              onGroupCreated={(newGroup) => {
                setGroups((prev) => [...prev, newGroup]);
              }}
            />
          </div>

          {/* Right — Split expense */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl p-6 shadow-sm">
            <SplitExpenseForm
              userId={userId}
              groups={groups}
              onSplitSuccess={() => fetchGroups()}
            />
          </div>
        </div>

        {/* Existing groups list */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Your Groups</h2>

          {loading ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading groups…
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-xl p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-zinc-400 dark:text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No groups yet. Create one above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl p-5 shadow-sm space-y-4 transition-shadow hover:shadow-md"
                >
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{g.name}</h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {g.members.length} member{g.members.length !== 1 ? "s" : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {g.members.map((mid) => (
                        <span
                          key={mid}
                          className="inline-block rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400"
                        >
                          {mid === userId ? "You" : mid.slice(0, 8) + "…"}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Debt Ledger for this group */}
                  <DebtLedger groupId={g.id} currentUserId={userId} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
