import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/bookmarks — the current user's bookmarked study groups
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      group: {
        include: {
          owner: { select: { id: true, name: true } },
          primarySubject: true,
          tags: true,
          _count: { select: { memberships: true } },
        },
      },
    },
  });

  const groups = bookmarks.map((b) => ({
    ...b.group,
    bookmarkedAt: b.createdAt,
  }));

  return NextResponse.json(groups);
}
