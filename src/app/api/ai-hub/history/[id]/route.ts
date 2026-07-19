import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function loadOwned(id: string, userId: string) {
  const item = await prisma.aiGeneration.findUnique({ where: { id } });
  if (!item || item.userId !== userId) return null;
  return item;
}

// PATCH /api/ai-hub/history/[id] — toggle favorite { favorite: boolean }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await loadOwned(id, session.user.id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const favorite = typeof body.favorite === "boolean" ? body.favorite : !item.isFavorite;

  const updated = await prisma.aiGeneration.update({
    where: { id },
    data: { isFavorite: favorite },
  });

  return NextResponse.json(updated);
}

// DELETE /api/ai-hub/history/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await loadOwned(id, session.user.id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.aiGeneration.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
