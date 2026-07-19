import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, university: true } },
      primarySubject: true,
      tags: true,
      memberships: {
        where: { status: "active" },
        include: { user: { select: { id: true, name: true } } },
      },
      studySessions: {
        orderBy: { startsAt: "asc" },
        include: { attendees: true, creator: { select: { id: true, name: true } } },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const { reviews, ...rest } = group;
  const avgRating = reviews.length
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : null;

  return NextResponse.json({ ...rest, reviews, avgRating, reviewCount: reviews.length });
}

// PATCH /api/groups/[id] — owner/cohost only
export async function PATCH(
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

  if (!membership || !["owner", "cohost"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    title,
    description,
    maxMembers,
    mode,
    locationText,
    visibility,
    difficulty,
    bannerUrl,
    university,
    sessionSchedulingPermission,
  } = body;

  if (sessionSchedulingPermission !== undefined && membership.role !== "owner") {
    return NextResponse.json(
      { error: "Only the group owner can change who can schedule sessions" },
      { status: 403 }
    );
  }

  if (
    sessionSchedulingPermission !== undefined &&
    !["owner", "owner_cohost", "all_members"].includes(sessionSchedulingPermission)
  ) {
    return NextResponse.json({ error: "Invalid scheduling permission" }, { status: 400 });
  }

  const updated = await prisma.studyGroup.update({
    where: { id },
    data: {
      title,
      description,
      maxMembers,
      mode,
      locationText,
      visibility,
      ...(difficulty !== undefined ? { difficulty } : {}),
      ...(bannerUrl !== undefined ? { bannerUrl } : {}),
      ...(university !== undefined ? { university } : {}),
      ...(sessionSchedulingPermission !== undefined
        ? { sessionSchedulingPermission }
        : {}),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/groups/[id] — owner only
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const group = await prisma.studyGroup.findUnique({ where: { id } });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.studyGroup.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
