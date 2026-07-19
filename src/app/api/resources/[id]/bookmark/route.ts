import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/resources/[id]/bookmark — is the current user bookmarking this resource?
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ bookmarked: false });
  }

  const bookmark = await prisma.resourceBookmark.findUnique({
    where: { userId_resourceId: { userId: session.user.id, resourceId: id } },
  });

  return NextResponse.json({ bookmarked: !!bookmark });
}

// POST /api/resources/[id]/bookmark — toggle bookmark for the current user
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resource = await prisma.resource.findUnique({ where: { id } });

  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const existing = await prisma.resourceBookmark.findUnique({
    where: { userId_resourceId: { userId: session.user.id, resourceId: id } },
  });

  if (existing) {
    await prisma.resourceBookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  }

  await prisma.resourceBookmark.create({
    data: { userId: session.user.id, resourceId: id },
  });

  return NextResponse.json({ bookmarked: true });
}
