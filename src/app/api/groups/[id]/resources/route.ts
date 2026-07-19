import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups/[id]/resources — all resources uploaded to this group
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const resources = await prisma.resource.findMany({
    where: { groupId: id },
    orderBy: { createdAt: "desc" },
    include: {
      uploader: { select: { id: true, name: true } },
      session: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(resources);
}

// POST /api/groups/[id]/resources — { name, fileUrl, fileName } — members only
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
      { error: "Only members can upload resources to this group" },
      { status: 403 }
    );
  }

  const { name, fileUrl, fileName } = await req.json();

  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "Resource name is required" }, { status: 400 });
  }

  if (!fileUrl || !fileName) {
    return NextResponse.json({ error: "Please attach a file" }, { status: 400 });
  }

  if (fileUrl.length > 7_000_000) {
    return NextResponse.json(
      { error: "That file is too large. Please upload something under 5MB." },
      { status: 400 }
    );
  }

  const resource = await prisma.resource.create({
    data: {
      groupId: id,
      uploadedBy: session.user.id,
      name: String(name).trim().slice(0, 200),
      fileUrl,
      fileName,
    },
    include: {
      uploader: { select: { id: true, name: true } },
      session: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(resource, { status: 201 });
}
