import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Preferences {
  theme: "light" | "dark" | "system";
  profileVisibility: "public" | "members" | "private";
  notifyJoinRequests: boolean;
  notifyMessages: boolean;
  notifySessionReminders: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  profileVisibility: "public",
  notifyJoinRequests: true,
  notifyMessages: true,
  notifySessionReminders: true,
};

// GET /api/profile/preferences
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(DEFAULT_PREFERENCES);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  const stored = (user?.preferences as Partial<Preferences> | null) || {};

  return NextResponse.json({ ...DEFAULT_PREFERENCES, ...stored });
}

// PATCH /api/profile/preferences — partial update, merged with existing preferences
export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  const merged = {
    ...DEFAULT_PREFERENCES,
    ...((user?.preferences as Partial<Preferences> | null) || {}),
    ...updates,
  };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferences: merged },
  });

  return NextResponse.json(merged);
}
