"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Laptop,
  User,
  ShieldCheck,
  Palette,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

type Tab = "general" | "account" | "privacy" | "appearance";

interface Preferences {
  theme: "light" | "dark" | "system";
  profileVisibility: "public" | "members" | "private";
  notifyJoinRequests: boolean;
  notifyMessages: boolean;
  notifySessionReminders: boolean;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();

  const initialTab = (searchParams.get("tab") as Tab) || "general";
  const [tab, setTab] = useState<Tab>(initialTab);

  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [university, setUniversity] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetch("/api/profile/preferences")
      .then((res) => res.json())
      .then(setPrefs);
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setUniversity(data.university || "");
        setBio(data.bio || "");
      });
  }, []);

  const flash = (msg: string, isError = false) => {
    setError(isError ? msg : "");
    setMessage(isError ? "" : msg);
    setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
  };

  const savePreferences = async (updates: Partial<Preferences>) => {
    const res = await fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setPrefs(data);
      flash("Saved");
    }
  };

  const saveUniversity = async () => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ university }),
    });
    if (res.ok) {
      await updateSession({ university });
      flash("University updated");
    } else {
      const data = await res.json();
      flash(data.error || "Something went wrong", true);
    }
  };

  const saveBio = async () => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio }),
    });
    if (res.ok) {
      flash("Bio updated");
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      flash("Password changed");
    } else {
      flash(data.error || "Something went wrong", true);
    }
  };

  const deleteAccount = async () => {
    const res = await fetch("/api/profile/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    const data = await res.json();
    if (res.ok) {
      signOut({ callbackUrl: "/" });
    } else {
      flash(data.error || "Something went wrong", true);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <SettingsIcon size={16} /> },
    { id: "account", label: "Account", icon: <User size={16} /> },
    { id: "privacy", label: "Privacy", icon: <ShieldCheck size={16} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={16} /> },
  ];

  return (
    <div className="mx-auto max-w-3xl p-8 text-gray-900 dark:text-gray-100">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      {(message || error) && (
        <p
          className={`mb-4 rounded p-2 text-sm ${
            error
              ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
              : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="flex gap-6">
        <nav className="w-40 shrink-0 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                router.replace(`/settings?tab=${t.id}`);
              }}
              className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm ${
                tab === t.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 space-y-6">
          {tab === "general" && (
            <section className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <h2 className="font-semibold">Dark mode</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Quickly toggle dark mode. For system-matching, use Appearance.
              </p>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="mt-3 flex items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              </button>
            </section>
          )}

          {tab === "account" && (
            <>
              <section className="rounded border border-gray-200 p-5 dark:border-gray-800">
                <h2 className="font-semibold">University</h2>
                <div className="mt-2 flex gap-2">
                  <input
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="flex-1 rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  />
                  <button
                    onClick={saveUniversity}
                    className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </section>

              <section className="rounded border border-gray-200 p-5 dark:border-gray-800">
                <h2 className="font-semibold">Bio</h2>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
                <button
                  onClick={saveBio}
                  className="mt-2 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </section>

              <section className="rounded border border-gray-200 p-5 dark:border-gray-800">
                <h2 className="font-semibold">Change password</h2>
                <form onSubmit={changePassword} className="mt-2 space-y-2">
                  <input
                    type="password"
                    placeholder="Current password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  />
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                  >
                    Update password
                  </button>
                </form>
              </section>

              <section className="rounded border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
                <h2 className="font-semibold text-red-700 dark:text-red-400">Delete account</h2>
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  This permanently deletes your account, groups you own, and your data.
                </p>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="mt-3 rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                  >
                    Delete my account
                  </button>
                ) : (
                  <div className="mt-3 space-y-2">
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full rounded border border-red-300 p-2 text-sm dark:border-red-800 dark:bg-gray-900"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={deleteAccount}
                        className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                      >
                        Confirm delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="rounded bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

          {tab === "privacy" && prefs && (
            <>
              <section className="rounded border border-gray-200 p-5 dark:border-gray-800">
                <h2 className="font-semibold">Profile visibility</h2>
                <select
                  value={prefs.profileVisibility}
                  onChange={(e) =>
                    savePreferences({
                      profileVisibility: e.target.value as Preferences["profileVisibility"],
                    })
                  }
                  className="mt-2 rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="public">Public — anyone can view</option>
                  <option value="members">Members — only shared group members</option>
                  <option value="private">Private — hidden from search</option>
                </select>
              </section>

              <section className="rounded border border-gray-200 p-5 dark:border-gray-800">
                <h2 className="font-semibold">Notification preferences</h2>
                <div className="mt-2 space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={prefs.notifyJoinRequests}
                      onChange={(e) => savePreferences({ notifyJoinRequests: e.target.checked })}
                    />
                    Join requests on my groups
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={prefs.notifyMessages}
                      onChange={(e) => savePreferences({ notifyMessages: e.target.checked })}
                    />
                    New chat messages
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={prefs.notifySessionReminders}
                      onChange={(e) =>
                        savePreferences({ notifySessionReminders: e.target.checked })
                      }
                    />
                    Session reminders
                  </label>
                </div>
              </section>
            </>
          )}

          {tab === "appearance" && (
            <section className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <h2 className="font-semibold">Theme</h2>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {(
                  [
                    { id: "light", label: "Light", icon: <Sun size={18} /> },
                    { id: "dark", label: "Dark", icon: <Moon size={18} /> },
                    { id: "system", label: "System", icon: <Laptop size={18} /> },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={`flex flex-col items-center gap-2 rounded border p-4 text-sm ${
                      theme === opt.id
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
