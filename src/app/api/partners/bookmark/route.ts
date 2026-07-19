import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/partners/bookmark — ids of study partners the current user has bookmarked
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const bookmarks = await prisma.partnerBookmark.findMany({
    where: { userId: session.user.id },
    select: { bookmarkedUserId: true },
  });

  return NextResponse.json(bookmarks.map((b) => b.bookmarkedUserId));
}

// POST /api/partners/bookmark — toggle bookmark on a study partner { userId }
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const targetId = typeof body.userId === "string" ? body.userId : "";

  if (!targetId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const existing = await prisma.partnerBookmark.findUnique({
    where: { userId_bookmarkedUserId: { userId: session.user.id, bookmarkedUserId: targetId } },
  });

  if (existing) {
    await prisma.partnerBookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  }

  await prisma.partnerBookmark.create({
    data: { userId: session.user.id, bookmarkedUserId: targetId },
  });

  return NextResponse.json({ bookmarked: true });
}
