import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWithGemini, GeminiError } from "@/lib/gemini";
import {
  buildAiHubPrompt,
  defaultTitleFor,
  DIFFICULTY_OPTIONS,
  INTERVIEW_LEVEL_OPTIONS,
  NOTES_LENGTH_OPTIONS,
  QUIZ_CATEGORY_OPTIONS,
  type AiToolType,
} from "@/lib/ai-hub";
import type { AiToolType as PrismaAiToolType } from "@prisma/client";

const TYPES: AiToolType[] = ["explain", "quiz", "notes", "interview"];

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

// POST /api/ai-hub/generate
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const type = body.type as AiToolType;

  if (!TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid tool type" }, { status: 400 });
  }

  const subject = str(body.subject, 100);
  const topic = str(body.topic, 200);

  if (!subject || !topic) {
    return NextResponse.json({ error: "Subject and topic are required" }, { status: 400 });
  }

  let params: Record<string, unknown>;

  if (type === "explain") {
    params = { subject, topic };
  } else if (type === "quiz") {
    const numQuestions = Math.min(20, Math.max(1, Number(body.numQuestions) || 5));
    const difficulty = DIFFICULTY_OPTIONS.includes(body.difficulty) ? body.difficulty : "Medium";
    const category = QUIZ_CATEGORY_OPTIONS.some((c) => c.value === body.category)
      ? body.category
      : "objective";
    params = { subject, topic, numQuestions, difficulty, category };
  } else if (type === "notes") {
    const length = NOTES_LENGTH_OPTIONS.some((l) => l.value === body.length) ? body.length : "detailed";
    params = {
      subject,
      topic,
      length,
      includeImportantPoints: Boolean(body.includeImportantPoints),
      includeExamTips: Boolean(body.includeExamTips),
      includeCommonMistakes: Boolean(body.includeCommonMistakes),
    };
  } else {
    const difficulty = INTERVIEW_LEVEL_OPTIONS.includes(body.difficulty) ? body.difficulty : "Intermediate";
    params = {
      subject,
      topic,
      difficulty,
      targetCompany: str(body.targetCompany, 100),
      includeSuggestions: Boolean(body.includeSuggestions),
      includeCommonMistakes: Boolean(body.includeCommonMistakes),
    };
  }

  try {
    const prompt = buildAiHubPrompt(type, params);
    const result = await generateWithGemini(prompt);

    const generation = await prisma.aiGeneration.create({
      data: {
        userId: session.user.id,
        type: type as PrismaAiToolType,
        title: defaultTitleFor(type, subject, topic),
        subject,
        topic,
        inputParams: params,
        result,
      },
    });

    return NextResponse.json(generation);
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("AI Study Hub generation error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
