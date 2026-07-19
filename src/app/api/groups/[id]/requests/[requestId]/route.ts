import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// PATCH /api/groups/[id]/requests/[requestId] — approve or reject
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const { id, requestId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  });

  if (!membership || !["owner", "cohost"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json(); // "approve" | "reject"

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const joinRequest = await prisma.joinRequest.findUnique({
    where: { id: requestId },
  });

  if (!joinRequest || joinRequest.groupId !== id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const updated = await prisma.joinRequest.update({
    where: { id: requestId },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
  });

  if (action === "approve") {
    await prisma.groupMembership.upsert({
      where: { groupId_userId: { groupId: id, userId: joinRequest.userId } },
      update: { status: "active", role: "member" },
      create: { groupId: id, userId: joinRequest.userId, role: "member" },
    });
  }

  const group = await prisma.studyGroup.findUnique({ where: { id } });

  await createNotification(
    joinRequest.userId,
    action === "approve" ? "approved" : "join_request",
    {
      groupId: id,
      groupTitle: group?.title,
      status: action === "approve" ? "approved" : "rejected",
    }
  );

  return NextResponse.json(updated);
}
