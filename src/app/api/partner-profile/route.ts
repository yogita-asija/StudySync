import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PartnerStudyMode } from "@prisma/client";
import { AVAILABILITY_SLOTS, STUDY_MODE_OPTIONS } from "@/lib/partner-matching";

const VALID_MODES = STUDY_MODE_OPTIONS.map((m) => m.value);

function cleanList(input: unknown, max = 20): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= max) break;
  }
  return out;
}

// GET /api/partner-profile — the current user's Study Partner profile (or null)
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.studyPartnerProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(profile);
}

// PUT /api/partner-profile — create or update the current user's Study Partner profile
export async function PUT(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const year = typeof body.year === "string" ? body.year.trim() : "";
  const branch = typeof body.branch === "string" ? body.branch.trim() : "";
  const subjects = cleanList(body.subjects);
  const skills = cleanList(body.skills);
  const availability = cleanList(body.availability).filter((slot) =>
    AVAILABILITY_SLOTS.includes(slot)
  );
  const studyMode = VALID_MODES.includes(body.studyMode) ? (body.studyMode as PartnerStudyMode) : "any";

  if (!year || !branch) {
    return NextResponse.json({ error: "Year and branch are required" }, { status: 400 });
  }

  if (subjects.length === 0) {
    return NextResponse.json({ error: "Add at least one subject you're interested in" }, { status: 400 });
  }

  const profile = await prisma.studyPartnerProfile.upsert({
    where: { userId: session.user.id },
    update: {
      year,
      branch,
      subjects,
      skills,
      studyMode,
      availability,
      isActive: true,
    },
    create: {
      userId: session.user.id,
      year,
      branch,
      subjects,
      skills,
      studyMode,
      availability,
      isActive: true,
    },
  });

  return NextResponse.json(profile);
}
