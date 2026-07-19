import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWithGemini, GeminiError } from "@/lib/gemini";

const ACTIONS = [
  "explain",
  "quiz",
  "flashcards",
  "notes",
  "interview",
  "summarize",
  "plan",
] as const;

type Action = (typeof ACTIONS)[number];

function buildPrompt(action: Action, input: string, subject: string | null): string {
  const context = subject ? ` in the context of ${subject}` : "";

  switch (action) {
    case "explain":
      return `Explain the topic "${input}"${context} clearly for a student, using simple language, a short analogy, and a concrete example. Keep it under 300 words.`;
    case "quiz":
      return `Create a 5-question multiple-choice quiz about "${input}"${context}. For each question give 4 options labelled A-D, then list the correct answers at the end.`;
    case "flashcards":
      return `Create 8 study flashcards about "${input}"${context}. Format each as "Q: ... / A: ...", one per line.`;
    case "notes":
      return `Write concise revision notes on "${input}"${context}, organized with headings and bullet points, suitable for last-minute exam review.`;
    case "interview":
      return `Generate 6 interview questions (with brief ideal-answer pointers) about "${input}"${context}, ranging from basic to advanced difficulty.`;
    case "summarize":
      return `Summarize the following notes into clear, well-organized key points:\n\n${input}`;
    case "plan":
      return `Create a realistic one-week study plan for "${input}"${context}, broken down by day with specific focus areas and time estimates.`;
  }
}

// POST /api/groups/[id]/ai — { action, input } — members only
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
      { error: "Only group members can use the AI assistant" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { action, input } = body as { action: Action; input: string };

  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (!input || !input.trim()) {
    return NextResponse.json({ error: "Please provide some input" }, { status: 400 });
  }

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: { primarySubject: true },
  });

  try {
    const prompt = buildPrompt(action, input.trim().slice(0, 4000), group?.primarySubject?.name ?? null);
    const result = await generateWithGemini(prompt);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("AI assistant error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
