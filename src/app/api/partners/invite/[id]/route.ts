import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// PATCH /api/partners/invite/[id] — accept or reject a received invite
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action; // "accept" | "reject"

  if (!["accept", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const invite = await prisma.partnerInvite.findUnique({ where: { id } });

  if (!invite || invite.receiverId !== session.user.id) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "This invite has already been responded to" }, { status: 409 });
  }

  const updated = await prisma.partnerInvite.update({
    where: { id },
    data: {
      status: action === "accept" ? "accepted" : "rejected",
      respondedAt: new Date(),
    },
  });

  const receiver = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  await createNotification(invite.senderId, "partner_response", {
    inviteId: invite.id,
    responderId: session.user.id,
    responderName: receiver?.name,
    status: action === "accept" ? "accepted" : "rejected",
  });

  return NextResponse.json(updated);
}
