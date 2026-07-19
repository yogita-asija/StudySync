import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/groups/[id]/leave
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const group = await prisma.studyGroup.findUnique({ where: { id } });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.ownerId === session.user.id) {
    return NextResponse.json(
      { error: "Owners cannot leave their own group. Delete it instead." },
      { status: 400 }
    );
  }

  await prisma.groupMembership.updateMany({
    where: { groupId: id, userId: session.user.id },
    data: { status: "left" },
  });

  return NextResponse.json({ success: true });
}
