"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Navbar onMenuClick={() => setMobileOpen(true)} />
      <div className="flex min-h-[calc(100vh-57px)]">
        {session && <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
