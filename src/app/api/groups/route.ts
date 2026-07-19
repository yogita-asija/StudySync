import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma, GroupMode, Level } from "@prisma/client";

// GET /api/groups — list + search + filters
// query params: q, subject, mode, level, sort
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const subject = searchParams.get("subject");
  const mode = searchParams.get("mode");
  const difficulty = searchParams.get("difficulty");
  const university = searchParams.get("university");
  const sort = searchParams.get("sort") || "recent";

  const where: Prisma.StudyGroupWhereInput = {
    visibility: "public",
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

  if (university) {
    where.university = { contains: university, mode: "insensitive" };
  }

  const orderBy: Prisma.StudyGroupOrderByWithRelationInput =
    sort === "active"
      ? { memberships: { _count: "desc" } }
      : { createdAt: "desc" };

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
      _count: { select: { memberships: true } },
    },
  });

  const enriched = groups.map(({ reviews, studySessions, ...group }) => ({
    ...group,
    avgRating: reviews.length
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : null,
    reviewCount: reviews.length,
    nextSession: studySessions[0] || null,
  }));

  return NextResponse.json(enriched);
}

// POST /api/groups — create a new group
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      subjectName,
      visibility,
      maxMembers,
      mode,
      locationText,
      difficulty,
      bannerUrl,
      university,
      tags,
    } = body;

    if (!title || !subjectName) {
      return NextResponse.json(
        { error: "Title and subject are required" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.upsert({
      where: { name: subjectName },
      update: {},
      create: { name: subjectName },
    });

    const group = await prisma.studyGroup.create({
      data: {
        title,
        description,
        primarySubjectId: subject.id,
        visibility: visibility || "public",
        maxMembers: maxMembers ? Number(maxMembers) : null,
        mode: mode || "online",
        locationText,
        difficulty: ["beginner", "intermediate", "advanced"].includes(difficulty)
          ? difficulty
          : "beginner",
        bannerUrl: bannerUrl || null,
        university: university || session.user.university || null,
        ownerId: session.user.id,
        tags:
          tags && tags.length
            ? {
                create: (tags as string[]).map((tag) => ({ tag })),
              }
            : undefined,
        memberships: {
          create: {
            userId: session.user.id,
            role: "owner",
          },
        },
      },
      include: { tags: true },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
