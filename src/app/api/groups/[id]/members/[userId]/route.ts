import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/groups/[id]/members/[userId] — change role (owner only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const group = await prisma.studyGroup.findUnique({ where: { id } });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the owner can change member roles" },
      { status: 403 }
    );
  }

  const { role } = await req.json(); // "cohost" | "member"

  if (!["cohost", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updated = await prisma.groupMembership.update({
    where: { groupId_userId: { groupId: id, userId } },
    data: { role },
  });

  return NextResponse.json(updated);
}

// DELETE /api/groups/[id]/members/[userId] — remove member (owner/cohost only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requesterMembership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  });

  if (!requesterMembership || !["owner", "cohost"].includes(requesterMembership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const group = await prisma.studyGroup.findUnique({ where: { id } });

  if (group?.ownerId === userId) {
    return NextResponse.json(
      { error: "Cannot remove the group owner" },
      { status: 400 }
    );
  }

  await prisma.groupMembership.update({
    where: { groupId_userId: { groupId: id, userId } },
    data: { status: "banned" },
  });

  return NextResponse.json({ success: true });
}
