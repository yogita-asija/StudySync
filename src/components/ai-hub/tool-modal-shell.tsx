"use client";

import { type LucideIcon, Bookmark, Copy, Loader2, RefreshCcw, X } from "lucide-react";
import { useState } from "react";
import { MarkdownLite } from "./markdown-lite";
import type { AiGenerationResult } from "./use-ai-tool";

export function ToolModalShell({
  open,
  icon: Icon,
  iconGradient,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  icon: LucideIcon;
  iconGradient: string;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/40" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${iconGradient} text-white shadow-sm`}>
              <Icon size={19} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function AiResultView({
  result,
  error,
  onToggleFavorite,
  onGenerateAnother,
}: {
  result: AiGenerationResult;
  error: string | null;
  onToggleFavorite: () => void;
  onGenerateAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(result.result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-3 dark:from-blue-950 dark:to-indigo-950">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{result.title}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={copy}
            title="Copy"
            className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <Copy size={12} />
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onToggleFavorite}
            title={result.isFavorite ? "Remove from favourites" : "Add to favourites"}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-xs ${
              result.isFavorite
                ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            <Bookmark size={12} fill={result.isFavorite ? "currentColor" : "none"} />
            {result.isFavorite ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-3 max-h-[50vh] overflow-y-auto rounded-lg border border-gray-100 p-3 dark:border-gray-800">
        <MarkdownLite text={result.result} />
      </div>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={onGenerateAnother}
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <RefreshCcw size={13} />
        Generate another
      </button>
    </div>
  );
}

export function GenerateButton({ loading, label = "Generate" }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Thinking like a senior teacher...
        </>
      ) : (
        label
      )}
    </button>
  );
}

export const fieldLabelClass = "text-sm font-medium text-gray-700 dark:text-gray-300";
export const fieldInputClass =
  "mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900";
