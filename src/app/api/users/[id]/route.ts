import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Preferences {
  profileVisibility?: "public" | "members" | "private";
}

async function shareAGroup(viewerId: string, targetId: string): Promise<boolean> {
  const shared = await prisma.groupMembership.findFirst({
    where: {
      userId: viewerId,
      status: "active",
      group: {
        memberships: { some: { userId: targetId, status: "active" } },
      },
    },
  });
  return !!shared;
}

// GET /api/users/[id] — public profile, respecting the user's privacy setting
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      subjects: { include: { subject: true } },
      _count: { select: { ownedGroups: true, memberships: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isSelf = session?.user?.id === id;
  const visibility = (user.preferences as Preferences | null)?.profileVisibility || "public";

  let allowed = isSelf || visibility === "public";
  if (!allowed && visibility === "members" && session?.user?.id) {
    allowed = await shareAGroup(session.user.id, id);
  }

  if (!allowed) {
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        image: user.image,
        restricted: true,
        message: "This profile is private.",
      },
      { status: 200 }
    );
  }

  const achievements: string[] = [];
  if (user._count.memberships >= 1) achievements.push("Getting Started");
  if (user._count.memberships >= 3) achievements.push("Active Learner");
  if (user._count.ownedGroups >= 1) achievements.push("Community Builder");
  if (Date.now() - user.createdAt.getTime() > 30 * 24 * 60 * 60 * 1000) {
    achievements.push("One Month Member");
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    image: user.image,
    university: user.university,
    bio: user.bio,
    createdAt: user.createdAt,
    subjects: user.subjects.map((s) => ({ name: s.subject.name, level: s.level })),
    groupsJoined: user._count.memberships,
    groupsCreated: user._count.ownedGroups,
    achievements,
    restricted: false,
  });
}
