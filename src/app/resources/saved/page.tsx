"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import { ResourceCard, ResourceItem } from "@/components/resource-card";

export default function SavedResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/resources/bookmarks");
    if (res.ok) {
      const data = await res.json();
      setResources(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const toggleBookmark = async (id: string) => {
    // Unbookmarking here means it should disappear from this list.
    setResources((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/resources/${id}/bookmark`, { method: "POST" });
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <Link
        href="/resources"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
      >
        <ArrowLeft size={14} />
        Back to My Resources
      </Link>

      <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        <Bookmark size={22} />
        Saved Resources
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Resources you&apos;ve bookmarked for quick access.
      </p>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              You haven&apos;t saved any resources yet.
            </p>
            <Link
              href="/resources"
              className="mt-3 inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Browse resources
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} onToggleBookmark={toggleBookmark} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
