"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { FolderOpen, Bookmark, Search } from "lucide-react";
import { ResourceCard, ResourceItem, isRecentUpload } from "@/components/resource-card";

const POLL_MS = 20000;

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [groupId, setGroupId] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");

  const fetchResources = useCallback(async () => {
    const res = await fetch("/api/resources");
    if (res.ok) {
      const data = await res.json();
      setResources(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResources();
    // Pick up newly uploaded resources from any group automatically.
    const interval = setInterval(fetchResources, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchResources]);

  const { subjects, groups, uploaders } = useMemo(() => {
    const subjects = new Map<string, string>();
    const groups = new Map<string, string>();
    const uploaders = new Map<string, string>();
    for (const r of resources) {
      if (r.group.primarySubject) subjects.set(r.group.primarySubject.name, r.group.primarySubject.name);
      groups.set(r.group.id, r.group.title);
      uploaders.set(r.uploader.id, r.uploader.name);
    }
    return {
      subjects: Array.from(subjects.values()).sort(),
      groups: Array.from(groups.entries()).sort((a, b) => a[1].localeCompare(b[1])),
      uploaders: Array.from(uploaders.entries()).sort((a, b) => a[1].localeCompare(b[1])),
    };
  }, [resources]);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (subject && r.group.primarySubject?.name !== subject) return false;
      if (groupId && r.group.id !== groupId) return false;
      if (uploadedBy && r.uploader.id !== uploadedBy) return false;
      return true;
    });
  }, [resources, q, subject, groupId, uploadedBy]);

  const recentCount = useMemo(
    () => resources.filter((r) => isRecentUpload(r.createdAt)).length,
    [resources]
  );

  const toggleBookmark = async (id: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, bookmarked: !r.bookmarked } : r))
    );
    const res = await fetch(`/api/resources/${id}/bookmark`, { method: "POST" });
    if (res.ok) {
      const { bookmarked } = await res.json();
      setResources((prev) => prev.map((r) => (r.id === id ? { ...r, bookmarked } : r)));
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            <FolderOpen size={22} />
            My Resources
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Everything shared across your groups and sessions.
            {recentCount > 0 && (
              <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">
                {recentCount} new since your last visit.
              </span>
            )}
          </p>
        </div>
        <Link
          href="/resources/saved"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-600 dark:border-gray-800 dark:text-gray-200"
        >
          <Bookmark size={15} />
          Saved Resources
        </Link>
      </div>

      <div className="mb-6 space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search resources..."
            className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Any subject</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Any group</option>
            {groups.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
          <select
            value={uploadedBy}
            onChange={(e) => setUploadedBy(e.target.value)}
            className="rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Uploaded by anyone</option>
            {uploaders.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            {resources.length === 0
              ? "No resources yet. Files shared in your groups and sessions will show up here."
              : "No resources match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} onToggleBookmark={toggleBookmark} />
          ))}
        </div>
      )}
    </div>
  );
}
