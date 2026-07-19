import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma, GroupMode, Level } from "@prisma/client";

// GET /api/groups/mine — groups the current user has joined, with the same
// search/filter/sort options as the public browse endpoint.
// query params: q, subject, mode, difficulty, sort
export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const subject = searchParams.get("subject");
  const mode = searchParams.get("mode");
  const difficulty = searchParams.get("difficulty");
  const sort = searchParams.get("sort") || "recent";

  const where: Prisma.StudyGroupWhereInput = {
    memberships: { some: { userId: session.user.id, status: "active" } },
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (subject) {
    where.primarySubject = { name: { equals: subject, mode: "insensitive" } };
  }

  if (mode && ["online", "offline", "hybrid"].includes(mode)) {
    where.mode = mode as GroupMode;
  }

  if (difficulty && ["beginner", "intermediate", "advanced"].includes(difficulty)) {
    where.difficulty = difficulty as Level;
  }

  const orderBy: Prisma.StudyGroupOrderByWithRelationInput =
    sort === "active" ? { memberships: { _count: "desc" } } : { createdAt: "desc" };

  const groups = await prisma.studyGroup.findMany({
    where,
    orderBy,
    include: {
      owner: { select: { id: true, name: true, university: true } },
      primarySubject: true,
      tags: true,
      reviews: { select: { rating: true } },
      studySessions: {
        where: { startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
        take: 1,
        select: { id: true, startsAt: true },
      },
      memberships: {
        where: { userId: session.user.id },
        select: { role: true },
      },
      _count: { select: { memberships: true } },
    },
  });

  const enriched = groups.map(({ reviews, studySessions, memberships, ...group }) => ({
    ...group,
    avgRating: reviews.length
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : null,
    reviewCount: reviews.length,
    nextSession: studySessions[0] || null,
    myRole: memberships[0]?.role || "member",
  }));

  return NextResponse.json(enriched);
}
