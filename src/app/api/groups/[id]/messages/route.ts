import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import type { GroupMembership } from "@prisma/client";

// GET /api/groups/[id]/messages — members only
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  });

  if (!membership || membership.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { groupId: id },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(messages);
}

// POST /api/groups/[id]/messages — members only
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  });

  if (!membership || membership.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { content } = await req.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { groupId: id, senderId: session.user.id, content: content.trim() },
    include: { sender: { select: { id: true, name: true } } },
  });

  // Notify other active members of the new message
  const group = await prisma.studyGroup.findUnique({ where: { id }, select: { title: true } });
  const otherMembers = await prisma.groupMembership.findMany({
    where: { groupId: id, status: "active", userId: { not: session.user.id } },
  });

  await Promise.all(
    otherMembers.map((m: GroupMembership) =>
      createNotification(m.userId, "message", {
        groupId: id,
        groupTitle: group?.title,
        senderName: session.user!.name,
        preview: content.trim().slice(0, 120),
      })
    )
  );

  return NextResponse.json(message, { status: 201 });
}
