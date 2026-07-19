"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Users,
  Layers,
  Clock,
  CalendarClock,
  Bell,
  BookOpen,
  ArrowRight,
} from "lucide-react";

interface DashboardData {
  stats: {
    groupsJoined: number;
    groupsCreated: number;
    pendingJoinRequests: number;
    upcomingSessionsCount: number;
    unreadNotifications: number;
  };
  upcomingSessions: {
    id: string;
    startsAt: string;
    group: { id: string; title: string };
  }[];
  recentActivity: { id: string; text: string; createdAt: string; readAt: string | null }[];
  continueStudying: {
    id: string;
    title: string;
    subject: string | null;
    members: number;
    nextSession: string | null;
  }[];
}

const STAT_CARDS = (data: DashboardData["stats"]) => [
  {
    label: "Groups Joined",
    value: data.groupsJoined,
    icon: Users,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    label: "Groups Created",
    value: data.groupsCreated,
    icon: Layers,
    gradient: "from-purple-500 to-pink-600",
  },
  {
    label: "Pending Join Requests",
    value: data.pendingJoinRequests,
    icon: Clock,
    gradient: "from-orange-500 to-amber-600",
  },
  {
    label: "Upcoming Sessions",
    value: data.upcomingSessionsCount,
    icon: CalendarClock,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    label: "Unread Notifications",
    value: data.unreadNotifications,
    icon: Bell,
    gradient: "from-red-500 to-rose-600",
  },
];

export default function DashboardPage() {
  const { data: authSession } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Welcome back{authSession?.user?.name ? `, ${authSession.user.name}` : ""}
      </h1>
      <p className="mt-1 text-gray-500 dark:text-gray-400">
        Here&apos;s what&apos;s happening across your study groups.
      </p>

      {loading || !data ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {STAT_CARDS(data.stats).map((card) => (
              <div
                key={card.label}
                className={`rounded-xl bg-gradient-to-br ${card.gradient} p-4 text-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg`}
              >
                <card.icon size={18} className="opacity-90" />
                <p className="mt-3 text-2xl font-bold">{card.value}</p>
                <p className="mt-0.5 text-xs opacity-90">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Continue studying */}
            <section className="lg:col-span-2">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                <BookOpen size={16} />
                Continue Studying
              </h2>
              {data.continueStudying.length === 0 ? (
                <EmptyCard text="Join a group to see it here." href="/groups" cta="Browse groups" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.continueStudying.map((g) => (
                    <Link
                      key={g.id}
                      href={`/groups/${g.id}`}
                      className="rounded-xl border border-gray-200 p-4 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-gray-800"
                    >
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{g.title}</h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {g.subject} · {g.members} members
                      </p>
                      <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        {g.nextSession
                          ? `Next: ${new Date(g.nextSession).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}`
                          : "No session scheduled"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Sidebar: upcoming schedule + recent activity */}
            <aside className="space-y-6">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                    <CalendarClock size={16} />
                    Upcoming Schedule
                  </h2>
                  <Link href="/calendar" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                    View all
                  </Link>
                </div>
                {data.upcomingSessions.length === 0 ? (
                  <EmptyCard text="No sessions scheduled." href="/calendar" cta="Open calendar" small />
                ) : (
                  <ul className="space-y-2">
                    {data.upcomingSessions.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/groups/${s.group.id}`}
                          className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm transition-colors hover:border-blue-300 dark:border-gray-800"
                        >
                          <span className="truncate text-gray-800 dark:text-gray-200">
                            {s.group.title}
                          </span>
                          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                            {new Date(s.startsAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                  <Bell size={16} />
                  Recent Activity
                </h2>
                {data.recentActivity.length === 0 ? (
                  <EmptyCard text="Nothing yet — your activity will show up here." small />
                ) : (
                  <ul className="space-y-2">
                    {data.recentActivity.map((a) => (
                      <li
                        key={a.id}
                        className={`rounded-lg border p-3 text-xs ${
                          a.readAt
                            ? "border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400"
                            : "border-blue-200 bg-blue-50 text-gray-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-gray-200"
                        }`}
                      >
                        <p>{a.text}</p>
                        <p className="mt-1 text-[10px] text-gray-400">
                          {new Date(a.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyCard({
  text,
  href,
  cta,
  small,
}: {
  text: string;
  href?: string;
  cta?: string;
  small?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-gray-300 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400 ${
        small ? "p-4 text-xs" : "p-8 text-sm"
      }`}
    >
      <p>{text}</p>
      {href && cta && (
        <Link
          href={href}
          className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
        >
          {cta}
          <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}
