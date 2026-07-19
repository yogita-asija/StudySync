import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/resources/[id] — uploader or group owner only
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: { group: true },
  });

  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const isUploader = resource.uploadedBy === session.user.id;
  const isOwner = resource.group.ownerId === session.user.id;

  if (!isUploader && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.resource.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
