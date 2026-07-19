"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Compass, CalendarDays, Bookmark, Users, FolderOpen, Handshake, Sparkles, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Browse Groups", icon: Compass },
  { href: "/partners", label: "Study Partners", icon: Handshake },
  { href: "/ai-hub", label: "AI Study Hub", icon: Sparkles },
  { href: "/calendar", label: "Scheduled Sessions", icon: CalendarDays },
  { href: "/bookmarks", label: "Saved Groups", icon: Bookmark },
  { href: "/my-groups", label: "My Groups", icon: Users },
  { href: "/resources", label: "My Resources", icon: FolderOpen },
];

// /groups/[id] (a group's detail page) is reachable from Browse Groups, My
// Groups, Saved Groups, and Scheduled Sessions alike. Rather than always
// highlighting "Browse Groups" just because the URL starts with /groups/,
// remember whichever sidebar section the person actually came from.
const STORAGE_KEY = "studysync-sidebar-active";
const SHARED_DETAIL_PREFIX = "/groups/";

function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const exact = NAV_ITEMS.find((item) => pathname === item.href);
    if (exact) {
      setActiveHref(exact.href);
      try {
        sessionStorage.setItem(STORAGE_KEY, exact.href);
      } catch {
        // sessionStorage can be unavailable (e.g. private mode) — safe to ignore.
      }
      return;
    }

    // Sub-routes of a sidebar item (other than /groups, which is handled
    // specially below) stay highlighted too — e.g. /resources/saved.
    const prefixMatch = NAV_ITEMS.find(
      (item) => item.href !== "/groups" && pathname.startsWith(`${item.href}/`)
    );
    if (prefixMatch) {
      setActiveHref(prefixMatch.href);
      try {
        sessionStorage.setItem(STORAGE_KEY, prefixMatch.href);
      } catch {
        // ignore
      }
      return;
    }

    if (pathname.startsWith(SHARED_DETAIL_PREFIX)) {
      let stored: string | null = null;
      try {
        stored = sessionStorage.getItem(STORAGE_KEY);
      } catch {
        stored = null;
      }
      const stillValid = stored && NAV_ITEMS.some((item) => item.href === stored);
      setActiveHref(stillValid ? stored : "/groups");
      return;
    }

    setActiveHref(null);
  }, [pathname]);

  const handleClick = (href: string) => {
    setActiveHref(href);
    try {
      sessionStorage.setItem(STORAGE_KEY, href);
    } catch {
      // ignore
    }
    onNavigate?.();
  };

  return (
    <nav className="space-y-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = activeHref === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => handleClick(item.href)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            }`}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Desktop sidebar — normal flex column, stretches to content height, never overlaps */}
      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white md:block dark:border-gray-800 dark:bg-gray-900">
        <div className="sticky top-0">
          <SidebarLinks />
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 transform border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 md:hidden dark:border-gray-800 dark:bg-gray-900 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <span className="font-bold text-gray-900 dark:text-gray-100">StudySync</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarLinks onNavigate={onClose} />
      </aside>
    </>
  );
}
