import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import type { GroupMembership } from "@prisma/client";

// GET /api/groups/[id]/sessions
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const sessions = await prisma.studySession.findMany({
    where: { groupId: id },
    include: { attendees: { include: { user: { select: { id: true, name: true } } } } },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json(sessions);
}

// POST /api/groups/[id]/sessions — schedule a session (member+)
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
    return NextResponse.json(
      { error: "Only members can schedule sessions" },
      { status: 403 }
    );
  }

  const group = await prisma.studyGroup.findUnique({ where: { id } });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const canSchedule =
    group.sessionSchedulingPermission === "all_members" ||
    (group.sessionSchedulingPermission === "owner_cohost" &&
      ["owner", "cohost"].includes(membership.role)) ||
    (group.sessionSchedulingPermission === "owner" && membership.role === "owner");

  if (!canSchedule) {
    return NextResponse.json(
      { error: "You don't have permission to schedule sessions in this group" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { title, startsAt, durationMins, meetingUrl, notesFileUrl, notesFileName } = body;

  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "Session name is required" }, { status: 400 });
  }

  if (!startsAt || !durationMins) {
    return NextResponse.json(
      { error: "Start time and duration are required" },
      { status: 400 }
    );
  }

  // notesFileUrl is a data URL sent from the client — cap it to ~5MB to
  // keep individual rows reasonable since there's no external file storage.
  if (notesFileUrl && notesFileUrl.length > 7_000_000) {
    return NextResponse.json(
      { error: "That file is too large. Please upload something under 5MB." },
      { status: 400 }
    );
  }

  const studySession = await prisma.studySession.create({
    data: {
      groupId: id,
      createdBy: session.user.id,
      title: String(title).trim().slice(0, 200),
      startsAt: new Date(startsAt),
      durationMins: Number(durationMins),
      meetingUrl: meetingUrl || null,
      notesFileUrl: notesFileUrl || null,
      notesFileName: notesFileName || null,
      attendees: {
        create: { userId: session.user.id, rsvpStatus: "going" },
      },
    },
    include: { attendees: true },
  });

  // A file attached to a session is also a group resource — surface it in
  // the unified My Resources view.
  if (notesFileUrl && notesFileName) {
    await prisma.resource.create({
      data: {
        groupId: id,
        sessionId: studySession.id,
        uploadedBy: session.user.id,
        name: notesFileName,
        fileUrl: notesFileUrl,
        fileName: notesFileName,
      },
    });
  }

  // Notify other active members
  const otherMembers = await prisma.groupMembership.findMany({
    where: { groupId: id, status: "active", userId: { not: session.user.id } },
  });

  await Promise.all(
    otherMembers.map((m: GroupMembership) =>
      createNotification(m.userId, "session_reminder", {
        groupId: id,
        groupTitle: group.title,
        sessionId: studySession.id,
        startsAt: studySession.startsAt,
      })
    )
  );

  return NextResponse.json(studySession, { status: 201 });
}
