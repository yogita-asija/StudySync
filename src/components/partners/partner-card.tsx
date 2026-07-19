"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, GraduationCap, Layers, Send, UserCheck, Wifi } from "lucide-react";
import { studyModeLabel } from "@/lib/partner-matching";
import type { CompatibilityBreakdown } from "@/lib/partner-matching";

export interface PartnerListItem {
  userId: string;
  name: string;
  image: string | null;
  university: string | null;
  year: string;
  branch: string;
  subjects: string[];
  skills: string[];
  studyMode: string;
  compatibility: CompatibilityBreakdown;
  inviteStatus: "none" | "pending_sent" | "pending_received" | "accepted" | "rejected";
  isBookmarked: boolean;
}

function scoreColor(score: number) {
  if (score >= 70) return "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-300";
  if (score >= 40) return "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300";
  return "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300";
}

export function PartnerCard({
  partner,
  onInvite,
  onToggleBookmark,
}: {
  partner: PartnerListItem;
  onInvite: (userId: string) => Promise<void> | void;
  onToggleBookmark: (userId: string) => Promise<void> | void;
}) {
  const [inviting, setInviting] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  const handleInvite = async () => {
    setInviting(true);
    await onInvite(partner.userId);
    setInviting(false);
  };

  const handleBookmark = async () => {
    setBookmarking(true);
    await onToggleBookmark(partner.userId);
    setBookmarking(false);
  };

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {partner.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={partner.image}
              alt={partner.name}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
              {partner.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{partner.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {partner.year} · {partner.branch}
            </p>
          </div>
        </div>
        <span
          title="Compatibility score"
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${scoreColor(
            partner.compatibility.score
          )}`}
        >
          {partner.compatibility.score}% match
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        {partner.university && (
          <span className="flex items-center gap-1">
            <GraduationCap size={12} />
            {partner.university}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Wifi size={12} />
          {studyModeLabel(partner.studyMode)}
        </span>
      </div>

      {partner.compatibility.commonSubjects.length > 0 && (
        <div className="mt-3">
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase text-gray-400">
            <Layers size={11} />
            Common subjects
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {partner.compatibility.commonSubjects.slice(0, 4).map((s) => (
              <span
                key={s}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {partner.compatibility.commonSkills.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] font-medium uppercase text-gray-400">Common skills</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {partner.compatibility.commonSkills.slice(0, 4).map((s) => (
              <span
                key={s}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/users/${partner.userId}`}
          className="flex-1 rounded border border-gray-300 py-1.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          View Profile
        </Link>

        {partner.inviteStatus === "accepted" ? (
          <span className="flex flex-1 items-center justify-center gap-1 rounded bg-green-100 py-1.5 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
            <UserCheck size={14} />
            Partners
          </span>
        ) : partner.inviteStatus === "pending_sent" ? (
          <span className="flex-1 rounded bg-yellow-100 py-1.5 text-center text-sm font-medium text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
            Invite sent
          </span>
        ) : partner.inviteStatus === "pending_received" ? (
          <span className="flex-1 rounded bg-blue-100 py-1.5 text-center text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            Check invites
          </span>
        ) : (
          <button
            onClick={handleInvite}
            disabled={inviting}
            className="flex flex-1 items-center justify-center gap-1.5 rounded bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Send size={14} />
            {inviting ? "Sending..." : "Send Invite"}
          </button>
        )}

        <button
          onClick={handleBookmark}
          disabled={bookmarking}
          title={partner.isBookmarked ? "Remove bookmark" : "Bookmark"}
          aria-label={partner.isBookmarked ? "Remove bookmark" : "Bookmark"}
          className={`rounded border p-2 transition-colors disabled:opacity-60 ${
            partner.isBookmarked
              ? "border-blue-300 text-blue-600 dark:border-blue-800"
              : "border-gray-300 text-gray-500 hover:text-blue-600 dark:border-gray-700"
          }`}
        >
          <Bookmark size={15} fill={partner.isBookmarked ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
}
