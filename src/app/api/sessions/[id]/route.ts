import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sessions/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const studySession = await prisma.studySession.findUnique({
    where: { id },
    include: {
      group: true,
      creator: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  if (!studySession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(studySession);
}

// PATCH /api/sessions/[id] — creator or group owner only
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studySession = await prisma.studySession.findUnique({
    where: { id },
    include: { group: true },
  });

  if (!studySession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isCreator = studySession.createdBy === session.user.id;
  const isOwner = studySession.group.ownerId === session.user.id;

  if (!isCreator && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, startsAt, durationMins, meetingUrl, notesFileUrl, notesFileName } = body;

  if (title !== undefined && !String(title).trim()) {
    return NextResponse.json({ error: "Session name is required" }, { status: 400 });
  }

  if (notesFileUrl && notesFileUrl.length > 7_000_000) {
    return NextResponse.json(
      { error: "That file is too large. Please upload something under 5MB." },
      { status: 400 }
    );
  }

  const updated = await prisma.studySession.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title: String(title).trim().slice(0, 200) } : {}),
      ...(startsAt !== undefined ? { startsAt: new Date(startsAt) } : {}),
      ...(durationMins !== undefined ? { durationMins: Number(durationMins) } : {}),
      ...(meetingUrl !== undefined ? { meetingUrl: meetingUrl || null } : {}),
      ...(notesFileUrl !== undefined ? { notesFileUrl: notesFileUrl || null } : {}),
      ...(notesFileName !== undefined ? { notesFileName: notesFileName || null } : {}),
    },
  });

  // Keep the session's linked Resource row (if any) in sync with the file.
  if (notesFileUrl !== undefined) {
    const existingResource = await prisma.resource.findFirst({ where: { sessionId: id } });

    if (notesFileUrl && notesFileName) {
      if (existingResource) {
        await prisma.resource.update({
          where: { id: existingResource.id },
          data: { name: notesFileName, fileUrl: notesFileUrl, fileName: notesFileName },
        });
      } else {
        await prisma.resource.create({
          data: {
            groupId: studySession.groupId,
            sessionId: id,
            uploadedBy: session.user.id,
            name: notesFileName,
            fileUrl: notesFileUrl,
            fileName: notesFileName,
          },
        });
      }
    } else if (existingResource) {
      await prisma.resource.delete({ where: { id: existingResource.id } });
    }
  }

  return NextResponse.json(updated);
}

// DELETE /api/sessions/[id] — creator or group owner only
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studySession = await prisma.studySession.findUnique({
    where: { id },
    include: { group: true },
  });

  if (!studySession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isCreator = studySession.createdBy === session.user.id;
  const isOwner = studySession.group.ownerId === session.user.id;

  if (!isCreator && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.studySession.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
