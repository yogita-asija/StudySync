"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bookmark, Star, Users, GraduationCap, Calendar, Wifi, MapPin } from "lucide-react";

interface GroupListItem {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  visibility: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  bannerUrl: string | null;
  university: string | null;
  maxMembers: number | null;
  primarySubject: { name: string } | null;
  owner: { name: string };
  _count: { memberships: number };
  avgRating: number | null;
  reviewCount: number;
  nextSession: { id: string; startsAt: string } | null;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  advanced: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const MODE_STYLES: Record<string, string> = {
  online: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  offline: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  hybrid: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
};

const BANNER_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-cyan-500 to-blue-600",
];

function gradientFor(seed: string) {
  const idx = seed.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % BANNER_GRADIENTS.length;
  return BANNER_GRADIENTS[idx];
}

export default function GroupsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [mode, setMode] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("recent");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [joinState, setJoinState] = useState<Record<string, "loading" | "joined" | "pending" | "error">>({});

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (subject) params.set("subject", subject);
    if (mode) params.set("mode", mode);
    if (difficulty) params.set("difficulty", difficulty);
    if (sort) params.set("sort", sort);

    const res = await fetch(`/api/groups?${params.toString()}`);
    const data = await res.json();
    setGroups(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [q, subject, mode, difficulty, sort]);

  const fetchBookmarks = useCallback(async () => {
    if (!session) return;
    const res = await fetch("/api/bookmarks");
    if (res.ok) {
      const data: { id: string }[] = await res.json();
      setBookmarkedIds(new Set(data.map((g) => g.id)));
    }
  }, [session]);

  useEffect(() => {
    const timeout = setTimeout(fetchGroups, 300);
    return () => clearTimeout(timeout);
  }, [fetchGroups]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const toggleBookmark = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if (!session) return;
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
    const res = await fetch(`/api/groups/${groupId}/bookmark`, { method: "POST" });
    if (res.ok) {
      const { bookmarked } = await res.json();
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        bookmarked ? next.add(groupId) : next.delete(groupId);
        return next;
      });
    }
  };

  const handleJoin = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if (!session) {
      router.push("/login");
      return;
    }
    setJoinState((prev) => ({ ...prev, [groupId]: "loading" }));
    const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setJoinState((prev) => ({
        ...prev,
        [groupId]: data.status === "pending" ? "pending" : "joined",
      }));
      fetchGroups();
    } else {
      setJoinState((prev) => ({ ...prev, [groupId]: "error" }));
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Study Groups</h1>
        <Link
          href="/groups/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + Create group
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search groups..."
          className="flex-1 rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-36 rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">Any mode</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">Any difficulty</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="recent">Most recent</option>
          <option value="active">Most active</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No groups found. Try different filters, or create one!
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const isFull =
              group.maxMembers != null && group._count.memberships >= group.maxMembers;
            const status = joinState[group.id];

            return (
              <div
                key={group.id}
                onClick={() => router.push(`/groups/${group.id}`)}
                className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Banner */}
                <div
                  className={`relative h-28 bg-gradient-to-br ${gradientFor(group.id)}`}
                  style={
                    group.bannerUrl
                      ? {
                          backgroundImage: `url(${group.bannerUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    {group.primarySubject && (
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-800 backdrop-blur">
                        {group.primarySubject.name}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[group.difficulty]}`}
                    >
                      {group.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={(e) => toggleBookmark(e, group.id)}
                    title={bookmarkedIds.has(group.id) ? "Remove bookmark" : "Bookmark group"}
                    aria-label={bookmarkedIds.has(group.id) ? "Remove bookmark" : "Bookmark group"}
                    className={`absolute right-3 top-3 rounded-full bg-white/90 p-1.5 backdrop-blur transition-colors ${
                      bookmarkedIds.has(group.id) ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
                    }`}
                  >
                    <Bookmark size={15} fill={bookmarkedIds.has(group.id) ? "currentColor" : "none"} />
                  </button>
                  <span
                    className={`absolute bottom-3 left-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${MODE_STYLES[group.mode]}`}
                  >
                    <Wifi size={11} />
                    {group.mode}
                  </span>
                </div>

                {/* Body */}
                <div className="p-4">
                  <h2 className="truncate font-semibold text-gray-900 dark:text-gray-100">
                    {group.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                    {group.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {group.university && (
                      <span className="flex items-center gap-1">
                        <GraduationCap size={12} />
                        {group.university}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {group._count.memberships}
                      {group.maxMembers ? `/${group.maxMembers}` : ""} members
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>by {group.owner.name}</span>
                    {group.avgRating != null ? (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star size={12} fill="currentColor" />
                        {group.avgRating} ({group.reviewCount})
                      </span>
                    ) : (
                      <span className="text-gray-400">No ratings yet</span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    {group.mode === "offline" ? <MapPin size={12} /> : <Calendar size={12} />}
                    {group.nextSession
                      ? `Next session ${new Date(group.nextSession.startsAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}`
                      : "No upcoming session"}
                  </div>

                  <button
                    onClick={(e) => handleJoin(e, group.id)}
                    disabled={status === "loading" || status === "joined" || status === "pending" || isFull}
                    className={`mt-3 w-full rounded py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                      status === "joined"
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                          : isFull
                            ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {status === "joined"
                      ? "Joined ✓"
                      : status === "pending"
                        ? "Request sent"
                        : isFull
                          ? "Group full"
                          : status === "loading"
                            ? "Joining..."
                            : "Join group"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
