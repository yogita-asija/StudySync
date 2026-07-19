import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups/[id]/bookmark — is the current user bookmarking this group?
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ bookmarked: false });
  }

  const bookmark = await prisma.bookmark.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: id } },
  });

  return NextResponse.json({ bookmarked: !!bookmark });
}

// POST /api/groups/[id]/bookmark — toggle bookmark for the current user
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const group = await prisma.studyGroup.findUnique({ where: { id } });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const existing = await prisma.bookmark.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: id } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  }

  await prisma.bookmark.create({
    data: { userId: session.user.id, groupId: id },
  });

  return NextResponse.json({ bookmarked: true });
}
