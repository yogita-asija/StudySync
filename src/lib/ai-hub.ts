// Shared constants + prompt builders for the AI Study Hub feature.
// Dependency-free (no prisma import) so it can be used from both the
// client-side tool forms and the server-side generate route.

export type AiToolType = "explain" | "quiz" | "notes" | "interview";

export const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard", "Mixed"];

export const QUIZ_CATEGORY_OPTIONS = [
  { value: "objective", label: "Objective (MCQ)" },
  { value: "subjective", label: "Subjective (Short/Long Answer)" },
  { value: "both", label: "Both" },
];

export const NOTES_LENGTH_OPTIONS = [
  { value: "short", label: "Short & Crisp" },
  { value: "detailed", label: "Detailed" },
];

export const INTERVIEW_LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export interface ExplainParams {
  subject: string;
  topic: string;
}

export interface QuizParams {
  subject: string;
  topic: string;
  numQuestions: number;
  difficulty: string;
  category: string; // objective | subjective | both
}

export interface NotesParams {
  subject: string;
  topic: string;
  length: string; // short | detailed
  includeImportantPoints: boolean;
  includeExamTips: boolean;
  includeCommonMistakes: boolean;
}

export interface InterviewParams {
  subject: string;
  topic: string;
  difficulty: string;
  targetCompany: string;
  includeSuggestions: boolean;
  includeCommonMistakes: boolean;
}

function categoryInstructions(category: string): string {
  if (category === "objective") {
    return `Make every question Multiple Choice (MCQ) with 4 options labelled A–D. Bold the correct option and add a one-line explanation of why it's correct.`;
  }
  if (category === "subjective") {
    return `Make every question short/long-answer style (no options). For each question, provide a model answer with the key points a top student would include.`;
  }
  return `Use a mix of both Objective (MCQ, with 4 options A–D, correct option bolded, brief explanation) and Subjective (short/long answer with model answer key points) questions, roughly balanced.`;
}

/**
 * Builds a high-level, senior-teacher-persona prompt for each AI Study Hub
 * tool so Gemini responds with depth, structure, and pedagogical care
 * rather than a generic answer.
 */
export function buildAiHubPrompt(type: AiToolType, params: Record<string, unknown>): string {
  switch (type) {
    case "explain": {
      const { subject, topic } = params as unknown as ExplainParams;
      return `You are a senior professor of ${subject} with over 15 years of teaching experience, renowned for turning the most confusing topics into simple, memorable ideas for your students.

A student has come to your office hours and asked you to explain: "${topic}" (within ${subject}).

Give a rich, well-structured explanation that includes, using clear markdown headings:
## Simple Definition
A one- or two-sentence definition anyone can understand.
## Why It Matters
Where this concept is used in the real world or in further study.
## Core Explanation
Break the concept down step-by-step, building from fundamentals to nuance.
## Analogy / Example
At least one relatable analogy or worked example that makes it click.
## Common Misconceptions
Mistakes or confusions students typically have about this topic, and the correct understanding.
## Key Takeaway
A short, memorable summary in 2-3 bullet points.

Keep the tone warm, encouraging, and student-friendly. Avoid unnecessary jargon, and define any technical term you do use.`;
    }

    case "quiz": {
      const { subject, topic, numQuestions, difficulty, category } = params as unknown as QuizParams;
      return `You are a senior ${subject} professor and experienced exam-setter who designs rigorous, fair assessments used by your university department.

Create a quiz on the topic "${topic}" (within ${subject}) with exactly ${numQuestions} questions at ${difficulty} difficulty.

${categoryInstructions(category)}

Formatting rules:
- Number every question clearly (Q1, Q2, ...).
- Calibrate rigor precisely to "${difficulty}" difficulty — don't make Easy questions trivial or Hard questions unfair.
- After all questions, include a final "## Answer Key" section summarizing every correct answer in one place for quick checking.
- Use clean markdown with headings and spacing so it's easy to scan.`;
    }

    case "notes": {
      const { subject, topic, length, includeImportantPoints, includeExamTips, includeCommonMistakes } =
        params as unknown as NotesParams;
      const extras: string[] = [];
      if (includeImportantPoints)
        extras.push(`- A "## ⭐ Important Points to Remember" section highlighting the most exam-critical facts and formulas.`);
      if (includeExamTips)
        extras.push(`- A "## 📝 Exam Tips" section with strategic advice on how to score well when answering questions on this topic.`);
      if (includeCommonMistakes)
        extras.push(`- A "## ⚠️ Common Mistakes to Avoid" section covering typical student errors and misconceptions.`);

      return `You are a senior ${subject} teacher famous among your students for writing the best revision notes — the kind that condense an entire chapter into exam-ready material without losing any depth.

Write ${length === "short" ? "short, crisp, high-yield" : "comprehensive, detailed"} revision notes on the topic "${topic}" (within ${subject}).

Structure the notes with clear markdown headings and bullet points so they're scannable at a glance.
${extras.length > 0 ? `\nAlso include:\n${extras.join("\n")}\n` : ""}
Keep the language precise and exam-focused. Prioritize clarity and retention over verbosity, while still being ${length === "short" ? "brief" : "thorough"}.`;
    }

    case "interview": {
      const { subject, topic, difficulty, targetCompany, includeSuggestions, includeCommonMistakes } =
        params as unknown as InterviewParams;
      const extraLines: string[] = [`- **Ideal Answer Pointers:** the key points a strong candidate would cover.`];
      if (includeSuggestions)
        extraLines.push(`- **💡 Suggestion:** how to best structure and deliver the answer in a real interview.`);
      if (includeCommonMistakes)
        extraLines.push(`- **⚠️ Common Mistake:** what candidates typically get wrong when answering this.`);

      return `You are a senior ${subject} professional and experienced technical interviewer who has personally conducted hundreds of interviews at top companies.

Generate a set of 6-8 interview questions on the topic "${topic}" (within ${subject}) at ${difficulty} difficulty${
        targetCompany ? `, styled to match the kind of interview questions asked at ${targetCompany}` : ""
      }.

For each question, use this exact structure in markdown:
### Q1: <question>
${extraLines.join("\n")}

Range the questions from fundamental to advanced within the ${difficulty} band, and make sure they reflect what a real interviewer would actually ask — not textbook trivia. End with a short "## Overall Prep Advice" section.`;
    }
  }
}

export function defaultTitleFor(type: AiToolType, subject: string, topic: string): string {
  const labels: Record<AiToolType, string> = {
    explain: "Explanation",
    quiz: "Quiz",
    notes: "Revision Notes",
    interview: "Interview Prep",
  };
  return `${labels[type]}: ${topic} (${subject})`;
}
