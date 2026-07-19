// Shared constants + pure scoring logic for the Study Partners feature.
// Kept dependency-free (no prisma import) so it can be used from both
// client components (the Find Partners form) and server API routes.

export const YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Masters",
  "PhD",
];

export const STUDY_MODE_OPTIONS: { value: string; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "offline", label: "In-Person" },
  { value: "hybrid", label: "Hybrid" },
  { value: "any", label: "No preference" },
];

// Simple day/time-of-day slots — enough granularity for a meaningful
// "availability overlap" signal without needing a full calendar picker.
export const AVAILABILITY_SLOTS = [
  "Weekday Mornings",
  "Weekday Afternoons",
  "Weekday Evenings",
  "Weekend Mornings",
  "Weekend Afternoons",
  "Weekend Evenings",
];

export interface PartnerMatchInput {
  university: string | null | undefined;
  year: string;
  branch: string;
  subjects: string[];
  skills: string[];
  studyMode: string; // online | offline | hybrid | any
  availability: string[];
}

export interface CompatibilityBreakdown {
  score: number; // 0-100
  sameUniversity: boolean;
  commonSubjects: string[];
  commonSkills: string[];
  sameStudyMode: boolean;
  overlappingAvailability: string[];
  pointsBreakdown: {
    university: number;
    subjects: number;
    skills: number;
    studyMode: number;
    availability: number;
  };
}

function normalizeSet(values: string[]): Set<string> {
  return new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean));
}

function overlap(a: string[], b: string[]): string[] {
  const bSet = normalizeSet(b);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of a) {
    const key = v.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    if (bSet.has(key)) {
      result.push(v.trim());
      seen.add(key);
    }
  }
  return result;
}

function jaccard(a: string[], b: string[]): number {
  const setA = normalizeSet(a);
  const setB = normalizeSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const v of setA) {
    if (setB.has(v)) intersectionSize++;
  }
  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

const WEIGHTS = {
  university: 20,
  subjects: 30,
  skills: 25,
  studyMode: 15,
  availability: 10,
};

/**
 * Calculates a 0-100 compatibility score between the current user and a
 * candidate study partner, using: same university, common subjects, common
 * skills, preferred study mode match, and availability overlap.
 */
export function calculateCompatibility(
  current: PartnerMatchInput,
  candidate: PartnerMatchInput
): CompatibilityBreakdown {
  const sameUniversity =
    !!current.university &&
    !!candidate.university &&
    current.university.trim().toLowerCase() === candidate.university.trim().toLowerCase();

  const commonSubjects = overlap(current.subjects, candidate.subjects);
  const commonSkills = overlap(current.skills, candidate.skills);

  const sameStudyMode =
    current.studyMode === candidate.studyMode ||
    current.studyMode === "any" ||
    candidate.studyMode === "any";

  const overlappingAvailability = overlap(current.availability, candidate.availability);

  const universityPoints = sameUniversity ? WEIGHTS.university : 0;
  const subjectsPoints = jaccard(current.subjects, candidate.subjects) * WEIGHTS.subjects;
  const skillsPoints = jaccard(current.skills, candidate.skills) * WEIGHTS.skills;
  const studyModePoints = sameStudyMode ? WEIGHTS.studyMode : 0;
  const availabilityDenominator = Math.max(1, current.availability.length);
  const availabilityPoints =
    Math.min(1, overlappingAvailability.length / availabilityDenominator) * WEIGHTS.availability;

  const rawScore =
    universityPoints + subjectsPoints + skillsPoints + studyModePoints + availabilityPoints;

  return {
    score: Math.round(rawScore),
    sameUniversity,
    commonSubjects,
    commonSkills,
    sameStudyMode,
    overlappingAvailability,
    pointsBreakdown: {
      university: Math.round(universityPoints),
      subjects: Math.round(subjectsPoints),
      skills: Math.round(skillsPoints),
      studyMode: Math.round(studyModePoints),
      availability: Math.round(availabilityPoints),
    },
  };
}

export function studyModeLabel(mode: string): string {
  return STUDY_MODE_OPTIONS.find((m) => m.value === mode)?.label ?? mode;
}
