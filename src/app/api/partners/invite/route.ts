import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// POST /api/partners/invite — send (or re-send after rejection) a study partner invite
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));
  const receiverId = typeof body.receiverId === "string" ? body.receiverId : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 300) : null;

  if (!receiverId) {
    return NextResponse.json({ error: "receiverId is required" }, { status: 400 });
  }

  if (receiverId === userId) {
    return NextResponse.json({ error: "You can't invite yourself" }, { status: 400 });
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await prisma.partnerInvite.findUnique({
    where: { senderId_receiverId: { senderId: userId, receiverId } },
  });

  if (existing && existing.status !== "rejected") {
    return NextResponse.json(
      { error: existing.status === "pending" ? "Invite already sent" : "Already connected" },
      { status: 409 }
    );
  }

  // Also block re-inviting someone who already invited you and is pending —
  // point them at accepting instead.
  const reverse = await prisma.partnerInvite.findUnique({
    where: { senderId_receiverId: { senderId: receiverId, receiverId: userId } },
  });
  if (reverse && reverse.status === "pending") {
    return NextResponse.json(
      { error: "This person already sent you an invite — accept it instead" },
      { status: 409 }
    );
  }

  const invite = existing
    ? await prisma.partnerInvite.update({
        where: { id: existing.id },
        data: { status: "pending", message, respondedAt: null },
      })
    : await prisma.partnerInvite.create({
        data: { senderId: userId, receiverId, message, status: "pending" },
      });

  const sender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

  await createNotification(receiverId, "partner_invite", {
    inviteId: invite.id,
    senderId: userId,
    senderName: sender?.name,
  });

  return NextResponse.json(invite);
}
