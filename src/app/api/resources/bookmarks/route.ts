import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/resources/bookmarks — the current user's saved (bookmarked) resources
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmarks = await prisma.resourceBookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      resource: {
        include: {
          group: { select: { id: true, title: true, primarySubject: { select: { name: true } } } },
          session: { select: { id: true, title: true } },
          uploader: { select: { id: true, name: true } },
        },
      },
    },
  });

  const mapped = bookmarks.map((b) => ({ ...b.resource, bookmarked: true }));

  return NextResponse.json(mapped);
}
