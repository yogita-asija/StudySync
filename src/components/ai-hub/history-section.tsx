"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  Briefcase,
  Lightbulb,
  ListChecks,
  StickyNote,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { MarkdownLite } from "./markdown-lite";
import type { AiGenerationResult } from "./use-ai-tool";

const TYPE_META: Record<
  string,
  { label: string; icon: LucideIcon; gradient: string; badge: string }
> = {
  explain: {
    label: "Explanation",
    icon: Lightbulb,
    gradient: "from-amber-400 to-orange-500",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  quiz: {
    label: "Quiz",
    icon: ListChecks,
    gradient: "from-violet-500 to-purple-600",
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
  notes: {
    label: "Notes",
    icon: StickyNote,
    gradient: "from-emerald-500 to-teal-600",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  interview: {
    label: "Interview",
    icon: Briefcase,
    gradient: "from-blue-500 to-cyan-600",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function HistoryItemCard({
  item,
  onOpen,
  onToggleFavorite,
  onDelete,
}: {
  item: AiGenerationResult;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <button
        onClick={onOpen}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient} text-white`}
      >
        <Icon size={17} />
      </button>
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}>{meta.label}</span>
          <span className="text-[11px] text-gray-400">{timeAgo(item.createdAt)}</span>
        </div>
      </button>
      <button
        onClick={onToggleFavorite}
        title={item.isFavorite ? "Remove from favourites" : "Add to favourites"}
        className={`shrink-0 rounded p-1.5 ${
          item.isFavorite ? "text-amber-500" : "text-gray-300 hover:text-amber-500"
        }`}
      >
        <Bookmark size={16} fill={item.isFavorite ? "currentColor" : "none"} />
      </button>
      <button
        onClick={onDelete}
        title="Delete"
        className="shrink-0 rounded p-1.5 text-gray-300 hover:text-red-500"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function HistoryDetailModal({
  item,
  onClose,
  onToggleFavorite,
}: {
  item: AiGenerationResult;
  onClose: () => void;
  onToggleFavorite: () => void;
}) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/40" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white`}>
              <Icon size={19} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(item.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFavorite}
              title={item.isFavorite ? "Remove from favourites" : "Add to favourites"}
              className={`rounded border px-2 py-1 text-xs ${
                item.isFavorite
                  ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              <Bookmark size={12} className="inline" fill={item.isFavorite ? "currentColor" : "none"} />
            </button>
            <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-4">
          <MarkdownLite text={item.result} />
        </div>
      </div>
    </div>
  );
}

export function HistorySection({ refreshKey }: { refreshKey: number }) {
  const [tab, setTab] = useState<"history" | "favourites">("history");
  const [items, setItems] = useState<AiGenerationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<AiGenerationResult | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ai-hub/history?filter=${tab === "favourites" ? "favorites" : "all"}`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, [tab, refreshKey]);

  const toggleFavorite = async (item: AiGenerationResult) => {
    const next = !item.isFavorite;
    setItems((prev) =>
      tab === "favourites" && !next
        ? prev.filter((i) => i.id !== item.id)
        : prev.map((i) => (i.id === item.id ? { ...i, isFavorite: next } : i))
    );
    setViewing((v) => (v && v.id === item.id ? { ...v, isFavorite: next } : v));
    await fetch(`/api/ai-hub/history/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: next }),
    });
  };

  const deleteItem = async (item: AiGenerationResult) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await fetch(`/api/ai-hub/history/${item.id}`, { method: "DELETE" });
  };

  return (
    <div>
      <div className="mb-3 flex gap-1 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setTab("history")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "history"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          History
        </button>
        <button
          onClick={() => setTab("favourites")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "favourites"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Favourites
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {tab === "favourites"
            ? "You haven't saved any favourites yet."
            : "Nothing generated yet — try one of the tools above."}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <HistoryItemCard
              key={item.id}
              item={item}
              onOpen={() => setViewing(item)}
              onToggleFavorite={() => toggleFavorite(item)}
              onDelete={() => deleteItem(item)}
            />
          ))}
        </div>
      )}

      {viewing && (
        <HistoryDetailModal
          item={viewing}
          onClose={() => setViewing(null)}
          onToggleFavorite={() => toggleFavorite(viewing)}
        />
      )}
    </div>
  );
}
