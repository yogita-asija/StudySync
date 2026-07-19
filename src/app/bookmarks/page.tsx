"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";

interface BookmarkedGroup {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  visibility: string;
  primarySubject: { name: string } | null;
  owner: { name: string };
  _count: { memberships: number };
  bookmarkedAt: string;
}

export default function BookmarksPage() {
  const [groups, setGroups] = useState<BookmarkedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/bookmarks");
    if (res.ok) {
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleRemove = async (groupId: string) => {
    setRemovingId(groupId);
    await fetch(`/api/groups/${groupId}/bookmark`, { method: "POST" });
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setRemovingId(null);
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Bookmark size={22} />
          Bookmarked Groups
        </h1>
        <Link href="/groups" className="text-sm text-blue-600 hover:underline">
          Browse all groups
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : groups.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">
            You haven&apos;t bookmarked any groups yet.
          </p>
          <Link
            href="/groups"
            className="mt-3 inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Find a group to save
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-start justify-between rounded border border-gray-200 p-4 hover:border-blue-400"
            >
              <Link href={`/groups/${group.id}`} className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{group.title}</h2>
                  <span className="text-xs text-gray-400">{group.mode}</span>
                </div>
                <p className="text-sm text-gray-600">{group.description}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {group.primarySubject?.name} · {group._count.memberships} member(s) · by{" "}
                  {group.owner.name}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Saved {new Date(group.bookmarkedAt).toLocaleDateString()}
                </p>
              </Link>
              <button
                onClick={() => handleRemove(group.id)}
                disabled={removingId === group.id}
                title="Remove bookmark"
                aria-label="Remove bookmark"
                className="ml-3 text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <Bookmark size={18} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
