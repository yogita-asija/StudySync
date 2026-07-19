import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile — the current user's full profile + dynamic stats
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subjects: { include: { subject: true } },
      _count: {
        select: {
          ownedGroups: true,
          memberships: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    university: user.university,
    bio: user.bio,
    image: user.image,
    createdAt: user.createdAt,
    subjects: user.subjects.map((s) => ({ name: s.subject.name, level: s.level })),
    groupsCreated: user._count.ownedGroups,
    groupsJoined: user._count.memberships,
  });
}

// PATCH /api/profile — update name, bio, university, or avatar image
export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, bio, university, image } = body;

  if (university !== undefined && !String(university).trim()) {
    return NextResponse.json({ error: "University cannot be empty" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(university !== undefined ? { university } : {}),
      ...(image !== undefined ? { image } : {}),
    },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    bio: user.bio,
    university: user.university,
    image: user.image,
  });
}
