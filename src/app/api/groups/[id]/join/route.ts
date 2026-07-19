import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// POST /api/groups/[id]/join
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: { _count: { select: { memberships: true } } },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const existing = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  });

  if (existing && existing.status === "active") {
    return NextResponse.json(
      { error: "You are already a member of this group" },
      { status: 409 }
    );
  }

  if (group.maxMembers && group._count.memberships >= group.maxMembers) {
    return NextResponse.json({ error: "This group is full" }, { status: 409 });
  }

  // Public group — join immediately
  if (group.visibility === "public") {
    const membership = await prisma.groupMembership.upsert({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
      update: { status: "active", role: "member" },
      create: { groupId: id, userId: session.user.id, role: "member" },
    });

    return NextResponse.json({ status: "joined", membership });
  }

  // Private group — create/reuse a join request
  const existingRequest = await prisma.joinRequest.findFirst({
    where: { groupId: id, userId: session.user.id, status: "pending" },
  });

  if (existingRequest) {
    return NextResponse.json({ status: "pending", request: existingRequest });
  }

  const joinRequest = await prisma.joinRequest.create({
    data: { groupId: id, userId: session.user.id },
  });

  await createNotification(group.ownerId, "join_request", {
    groupId: id,
    groupTitle: group.title,
    requesterId: session.user.id,
    requesterName: session.user.name,
    requestId: joinRequest.id,
  });

  return NextResponse.json({ status: "pending", request: joinRequest });
}
