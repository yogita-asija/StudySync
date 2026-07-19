import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/resources — every resource across every group (and its sessions)
// the current user is an active member of. Search/filter/sort happen
// client-side since the result set is scoped to one person's groups.
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resources = await prisma.resource.findMany({
    where: {
      group: {
        memberships: { some: { userId: session.user.id, status: "active" } },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      group: { select: { id: true, title: true, primarySubject: { select: { name: true } } } },
      session: { select: { id: true, title: true } },
      uploader: { select: { id: true, name: true } },
      bookmarks: { where: { userId: session.user.id }, select: { id: true } },
    },
  });

  const mapped = resources.map(({ bookmarks, ...r }) => ({
    ...r,
    bookmarked: bookmarks.length > 0,
  }));

  return NextResponse.json(mapped);
}
