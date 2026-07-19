import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/groups/[id]/report — { reason } — any signed-in user
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reason } = await req.json();

  if (!reason || !String(reason).trim()) {
    return NextResponse.json({ error: "Please describe the issue" }, { status: 400 });
  }

  const group = await prisma.studyGroup.findUnique({ where: { id } });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  await prisma.report.create({
    data: {
      groupId: id,
      reporterId: session.user.id,
      reason: String(reason).trim().slice(0, 1000),
    },
  });

  return NextResponse.json({ success: true });
}
