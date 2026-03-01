"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Profile {
  id: string;
  username?: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  members: string[];
}

interface GroupManagerProps {
  userId: string;
  onGroupCreated?: (group: Group) => void;
}

export default function GroupManager({ userId, onGroupCreated }: GroupManagerProps) {
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  /* ── Fetch all profiles for the user picker ──────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/profiles/all`);
        if (!res.ok) return;
        const data = await res.json();
        setAllProfiles((data.profiles as Profile[]) ?? []);
      } catch (e) {
        console.error("Failed to fetch profiles:", e);
      }
    })();
  }, []);

  const otherProfiles = allProfiles.filter((p) => p.id !== userId);

  const filtered = otherProfiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      !selected.includes(p.id) &&
      ((p.username ?? "").toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
    );
  });

  const toggleUser = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const displayName = useCallback(
    (id: string) => {
      const p = allProfiles.find((x) => x.id === id);
      return p?.username || id.slice(0, 8) + "…";
    },
    [allProfiles],
  );

  /* ── Submit ──────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selected.length === 0) return;

    setSubmitting(true);
    try {
      // 1. Create the group
      const createRes = await fetch(`${apiBase}/api/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName.trim(), created_by: userId }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create group");
      }

      const { group } = await createRes.json();

      // 2. Add members (including self)
      const memberIds = [userId, ...selected];
      const membersRes = await fetch(`${apiBase}/api/groups/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: group.id, user_ids: memberIds }),
      });

      if (!membersRes.ok) {
        const err = await membersRes.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to add members");
      }

      toast.success(`Group "${group.name}" created!`);
      onGroupCreated?.({ ...group, members: memberIds });
      setGroupName("");
      setSelected([]);
      setSearch("");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Create Group
        </h3>
      </div>

      {/* Group name */}
      <div className="space-y-1.5">
        <Label htmlFor="grp-name" className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Group Name</Label>
        <Input
          id="grp-name"
          placeholder="e.g. Roommates"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full bg-white/50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20"
        />
      </div>

      {/* Multi-select members */}
      <div className="space-y-1.5">
        <Label className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Add Members</Label>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selected.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                {displayName(id)}
                <button type="button" onClick={() => toggleUser(id)} className="hover:text-red-400 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input + dropdown */}
        <div className="relative">
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            className="w-full bg-white/50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20"
          />

          {dropdownOpen && filtered.length > 0 && (
            <div className="absolute z-50 mt-1 w-full max-h-44 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { toggleUser(p.id); setSearch(""); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                  {p.username || p.id.slice(0, 12) + "…"}
                </button>
              ))}
            </div>
          )}

          {dropdownOpen && filtered.length === 0 && search && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-500 text-center">
              No users found
            </div>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={!groupName.trim() || selected.length === 0 || submitting}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-black rounded-xl shadow-lg shadow-red-500/25 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:shadow-none transition-all"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Group"}
      </Button>
    </form>
  );
}
