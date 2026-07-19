import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/sessions/[id]/rsvp — { status: "going" | "maybe" | "not_going" }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();

  if (!["going", "maybe", "not_going"].includes(status)) {
    return NextResponse.json({ error: "Invalid RSVP status" }, { status: 400 });
  }

  const studySession = await prisma.studySession.findUnique({ where: { id } });

  if (!studySession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const membership = await prisma.groupMembership.findUnique({
    where: {
      groupId_userId: { groupId: studySession.groupId, userId: session.user.id },
    },
  });

  if (!membership || membership.status !== "active") {
    return NextResponse.json(
      { error: "Only group members can RSVP" },
      { status: 403 }
    );
  }

  const attendee = await prisma.sessionAttendee.upsert({
    where: { sessionId_userId: { sessionId: id, userId: session.user.id } },
    update: { rsvpStatus: status },
    create: { sessionId: id, userId: session.user.id, rsvpStatus: status },
  });

  return NextResponse.json(attendee);
}
