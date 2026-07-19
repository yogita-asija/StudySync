"use client";

import Link from "next/link";
import { FileText, Download, ExternalLink, Bookmark, GraduationCap, Calendar } from "lucide-react";

export interface ResourceItem {
  id: string;
  name: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
  group: { id: string; title: string; primarySubject: { name: string } | null };
  session: { id: string; title: string } | null;
  uploader: { id: string; name: string };
  bookmarked: boolean;
}

const RECENT_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

export function isRecentUpload(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < RECENT_WINDOW_MS;
}

export function ResourceCard({
  resource,
  onToggleBookmark,
}: {
  resource: ResourceItem;
  onToggleBookmark: (id: string) => void;
}) {
  const isNew = isRecentUpload(resource.createdAt);

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900 ${
        isNew
          ? "border-blue-300 ring-1 ring-blue-100 dark:border-blue-800 dark:ring-blue-950/50"
          : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
        <FileText size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-medium text-gray-900 dark:text-gray-100">{resource.name}</p>
          {isNew && (
            <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              New
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <Link
            href={`/groups/${resource.group.id}`}
            className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
          >
            <GraduationCap size={12} />
            {resource.group.title}
          </Link>
          {resource.session && <span>· {resource.session.title}</span>}
          <span>· by {resource.uploader.name}</span>
        </div>

        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
          <Calendar size={11} />
          {new Date(resource.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <a
            href={resource.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <ExternalLink size={12} />
            Open
          </a>
          <a
            href={resource.fileUrl}
            download={resource.fileName}
            className="flex items-center gap-1 rounded bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Download size={12} />
            Download
          </a>
          <button
            onClick={() => onToggleBookmark(resource.id)}
            title={resource.bookmarked ? "Remove bookmark" : "Save resource"}
            aria-label={resource.bookmarked ? "Remove bookmark" : "Save resource"}
            className={`ml-auto rounded p-1.5 ${
              resource.bookmarked
                ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                : "text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800"
            }`}
          >
            <Bookmark size={16} fill={resource.bookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}
