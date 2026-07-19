"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X as XIcon } from "lucide-react";

export interface InviteUserSummary {
  id: string;
  name: string;
  image: string | null;
  university: string | null;
  studyPartnerProfile: {
    year: string;
    branch: string;
    subjects: string[];
  } | null;
}

export function ReceivedInviteCard({
  inviteId,
  from,
  message,
  onRespond,
}: {
  inviteId: string;
  from: InviteUserSummary;
  message: string | null;
  onRespond: (inviteId: string, action: "accept" | "reject") => Promise<void> | void;
}) {
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);

  const respond = async (action: "accept" | "reject") => {
    setBusy(action);
    await onRespond(inviteId, action);
    setBusy(null);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {from.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={from.image} alt={from.name} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
            {from.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{from.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {from.studyPartnerProfile
              ? `${from.studyPartnerProfile.year} · ${from.studyPartnerProfile.branch}`
              : from.university || "Wants to study together"}
          </p>
          {message && (
            <p className="mt-1 max-w-sm text-xs italic text-gray-500 dark:text-gray-400">
              &ldquo;{message}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/users/${from.id}`}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          View Profile
        </Link>
        <button
          onClick={() => respond("accept")}
          disabled={busy !== null}
          className="flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          <Check size={13} />
          {busy === "accept" ? "Accepting..." : "Accept"}
        </button>
        <button
          onClick={() => respond("reject")}
          disabled={busy !== null}
          className="flex items-center gap-1 rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <XIcon size={13} />
          {busy === "reject" ? "Rejecting..." : "Reject"}
        </button>
      </div>
    </div>
  );
}
