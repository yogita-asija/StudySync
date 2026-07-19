"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Layers,
  CalendarClock,
  Award,
  Lock,
} from "lucide-react";

interface ProfileData {
  id: string;
  name: string;
  image: string | null;
  university?: string;
  bio?: string | null;
  createdAt?: string;
  subjects?: { name: string; level: string }[];
  groupsJoined?: number;
  groupsCreated?: number;
  achievements?: string[];
  restricted: boolean;
  message?: string;
}

export default function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((res) => res.json())
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-2xl p-8 text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  if (!profile) {
    return <div className="mx-auto max-w-2xl p-8 text-gray-500 dark:text-gray-400">User not found.</div>;
  }

  if (profile.restricted) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-semibold text-white">
          {profile.name.slice(0, 1).toUpperCase()}
        </div>
        <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {profile.name}
        </h1>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Lock size={14} />
          {profile.message || "This profile is private."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="flex flex-col items-center text-center">
        {profile.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.image}
            alt={profile.name}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-semibold text-white">
            {profile.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {profile.name}
        </h1>
        {profile.university && (
          <p className="mt-1 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
            <GraduationCap size={14} />
            {profile.university}
          </p>
        )}
      </div>

      {profile.bio && (
        <p className="mt-6 rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {profile.bio}
        </p>
      )}

      {profile.subjects && profile.subjects.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium uppercase text-gray-400">Subjects &amp; Skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.subjects.map((s) => (
              <span
                key={s.name}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              >
                {s.name} · {s.level}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard icon={<Users size={16} className="text-blue-600" />} value={profile.groupsJoined ?? 0} label="Groups joined" />
        <StatCard icon={<Layers size={16} className="text-indigo-600" />} value={profile.groupsCreated ?? 0} label="Groups created" />
        <StatCard
          icon={<CalendarClock size={16} className="text-gray-500" />}
          value={
            profile.createdAt
              ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
          label="Joined"
        />
      </div>

      {profile.achievements && profile.achievements.length > 0 && (
        <div className="mt-6">
          <p className="flex items-center gap-1 text-xs font-medium uppercase text-gray-400">
            <Award size={12} />
            Achievements
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.achievements.map((a) => (
              <span
                key={a}
                className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/groups" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          Browse study groups
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 p-3 text-center dark:border-gray-800">
      <div className="mx-auto w-fit">{icon}</div>
      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
