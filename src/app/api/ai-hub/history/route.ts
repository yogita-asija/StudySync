import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/ai-hub/history — usage stats + generation history for the current user
// query params: filter=all|favorites, type=explain|quiz|notes|interview
export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all";
  const type = searchParams.get("type");

  const [all, items] = await Promise.all([
    prisma.aiGeneration.findMany({
      where: { userId },
      select: { type: true },
    }),
    prisma.aiGeneration.findMany({
      where: {
        userId,
        ...(filter === "favorites" ? { isFavorite: true } : {}),
        ...(type ? { type: type as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const stats = {
    totalRequests: all.length,
    notesGenerated: all.filter((g) => g.type === "notes").length,
    quizGenerated: all.filter((g) => g.type === "quiz").length,
    interviewGenerated: all.filter((g) => g.type === "interview").length,
  };

  return NextResponse.json({ stats, items });
}
