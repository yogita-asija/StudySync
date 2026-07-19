"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { X, GraduationCap, Users, Layers, CalendarClock } from "lucide-react";

interface ProfileData {
  name: string;
  email: string;
  university: string;
  bio: string | null;
  image: string | null;
  createdAt: string;
  subjects: { name: string; level: string }[];
  groupsCreated: number;
  groupsJoined: number;
}

export function ProfileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfile(data))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm transform border-l border-gray-200 bg-white shadow-xl transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Your Profile</h2>
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {loading || !profile ? (
          <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        ) : (
          <div className="flex h-[calc(100%-57px)] flex-col overflow-y-auto p-6">
            <div className="flex flex-col items-center text-center">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-semibold text-white">
                  {profile.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {profile.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
              {profile.university && (
                <p className="mt-1 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                  <GraduationCap size={14} />
                  {profile.university}
                </p>
              )}
            </div>

            {profile.bio && (
              <p className="mt-4 rounded bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {profile.bio}
              </p>
            )}

            {profile.subjects.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase text-gray-400">
                  Subjects interested
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.subjects.map((s) => (
                    <span
                      key={s.name}
                      className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded border border-gray-100 p-3 text-center dark:border-gray-800">
                <Users size={16} className="mx-auto text-blue-600" />
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {profile.groupsJoined}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Groups joined</p>
              </div>
              <div className="rounded border border-gray-100 p-3 text-center dark:border-gray-800">
                <Layers size={16} className="mx-auto text-indigo-600" />
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {profile.groupsCreated}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Groups created</p>
              </div>
              <div className="rounded border border-gray-100 p-3 text-center dark:border-gray-800">
                <CalendarClock size={16} className="mx-auto text-gray-500" />
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-6">
              <Link
                href="/settings?tab=account"
                onClick={onClose}
                className="rounded bg-blue-600 py-2 text-center text-sm text-white hover:bg-blue-700"
              >
                Edit Profile
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded bg-gray-100 py-2 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
