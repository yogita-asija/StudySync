import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/calendar — every study session across groups the current user belongs to
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.studySession.findMany({
    where: {
      group: {
        memberships: {
          some: { userId: session.user.id, status: "active" },
        },
      },
    },
    orderBy: { startsAt: "asc" },
    include: {
      group: { select: { id: true, title: true } },
      creator: { select: { id: true, name: true } },
      attendees: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(sessions);
}
