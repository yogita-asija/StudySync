"use client";

import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      {session ? (
        <>
          <p className="text-lg">
            Logged in as <strong>{session.user?.email}</strong>
          </p>
          <div className="flex gap-3">
            <a href="/groups" className="rounded bg-blue-600 px-4 py-2 text-white">
              Browse groups
            </a>
            <a href="/dashboard" className="rounded bg-gray-600 px-4 py-2 text-white">
              Dashboard
            </a>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Log out
          </button>
        </>
      ) : (
        <>
          <p className="text-lg">You are not logged in</p>
          <div className="flex gap-3">
            <a href="/login" className="rounded bg-blue-600 px-4 py-2 text-white">
              Log in
            </a>
            <a href="/signup" className="rounded bg-gray-600 px-4 py-2 text-white">
              Sign up
            </a>
          </div>
        </>
      )}
    </div>
  );
}
