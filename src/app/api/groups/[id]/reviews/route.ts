import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups/[id]/reviews — list reviews + average
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const reviews = await prisma.review.findMany({
    where: { groupId: id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });

  const avgRating = reviews.length
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : null;

  return NextResponse.json({ reviews, avgRating, reviewCount: reviews.length });
}

// POST /api/groups/[id]/reviews — { rating, comment? } — members only, one per user
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
      { error: "Only members can rate this group" },
      { status: 403 }
    );
  }

  const { rating, comment } = await req.json();
  const numericRating = Number(rating);

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const review = await prisma.review.upsert({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
    update: { rating: numericRating, comment: comment || null },
    create: {
      groupId: id,
      userId: session.user.id,
      rating: numericRating,
      comment: comment || null,
    },
  });

  return NextResponse.json(review);
}
