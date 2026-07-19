import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/partners/invites — the current user's sent & received partner invites
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [received, sent] = await Promise.all([
    prisma.partnerInvite.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            university: true,
            studyPartnerProfile: true,
          },
        },
      },
    }),
    prisma.partnerInvite.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
            university: true,
            studyPartnerProfile: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ received, sent });
}
