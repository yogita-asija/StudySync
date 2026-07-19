"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bell, Settings, Menu } from "lucide-react";
import { ProfileDrawer } from "@/components/profile-drawer";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session) return;
    const fetchUnread = () => {
      fetch("/api/notifications")
        .then((res) => (res.ok ? res.json() : []))
        .then((data: { readAt: string | null }[]) => {
          if (Array.isArray(data)) {
            setUnreadCount(data.filter((n) => !n.readAt).length);
          }
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        {session && (
          <button
            onClick={onMenuClick}
            className="text-gray-500 hover:text-gray-700 md:hidden dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        )}
        <Link
          href={session ? "/dashboard" : "/"}
          className="font-bold text-gray-900 dark:text-gray-100"
        >
          StudySync
        </Link>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {session ? (
          <>
            <Link
              href="/notifications"
              title="Notifications"
              aria-label="Notifications"
              className="relative text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/settings"
              title="Settings"
              aria-label="Settings"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              <Settings size={20} />
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-full text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              aria-label="Open profile"
            >
              {session.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "Profile"}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">
                  {(session.user?.name || "?").slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hidden sm:inline">{session.user?.name}</span>
            </button>
            <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
