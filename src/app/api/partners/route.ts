import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateCompatibility, type PartnerMatchInput } from "@/lib/partner-matching";

// GET /api/partners — candidate study partners for the current user, scored
// by compatibility. Also returns the top-of-page stats (pending / accepted /
// available). Requires the current user to have set up their own Study
// Partner profile (via PUT /api/partner-profile) so we have something to
// compare against.
// query params: q, branch, year, subject, skill, mode, sort
export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() || "";
  const branch = searchParams.get("branch")?.trim().toLowerCase() || "";
  const year = searchParams.get("year")?.trim().toLowerCase() || "";
  const subject = searchParams.get("subject")?.trim().toLowerCase() || "";
  const skill = searchParams.get("skill")?.trim().toLowerCase() || "";
  const mode = searchParams.get("mode")?.trim().toLowerCase() || "";
  const sort = searchParams.get("sort") || "compatibility";

  const [me, myUser, candidateProfiles, sentInvites, receivedInvites, myBookmarks] =
    await Promise.all([
      prisma.studyPartnerProfile.findUnique({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { university: true } }),
      prisma.studyPartnerProfile.findMany({
        where: { userId: { not: userId }, isActive: true },
        include: {
          user: { select: { id: true, name: true, image: true, university: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.partnerInvite.findMany({ where: { senderId: userId } }),
      prisma.partnerInvite.findMany({ where: { receiverId: userId } }),
      prisma.partnerBookmark.findMany({ where: { userId }, select: { bookmarkedUserId: true } }),
    ]);

  // Stats shown at the top of the page — computed regardless of whether the
  // current user has a partner profile yet, since invites can exist either way.
  const pendingReceived = receivedInvites.filter((i) => i.status === "pending").length;
  const acceptedCount = [...sentInvites, ...receivedInvites].filter(
    (i) => i.status === "accepted"
  ).length;

  const stats = {
    pendingRequests: pendingReceived,
    acceptedPartners: acceptedCount,
    partnersAvailable: candidateProfiles.length,
  };

  if (!me) {
    return NextResponse.json({ stats, partners: [], hasProfile: false });
  }

  const sentByReceiver = new Map(sentInvites.map((i) => [i.receiverId, i]));
  const receivedBySender = new Map(receivedInvites.map((i) => [i.senderId, i]));
  const bookmarkedIds = new Set(myBookmarks.map((b) => b.bookmarkedUserId));

  const currentInput: PartnerMatchInput = {
    university: myUser?.university,
    year: me.year,
    branch: me.branch,
    subjects: me.subjects,
    skills: me.skills,
    studyMode: me.studyMode,
    availability: me.availability,
  };

  let results = candidateProfiles.map((profile) => {
    const candidateInput: PartnerMatchInput = {
      university: profile.user.university,
      year: profile.year,
      branch: profile.branch,
      subjects: profile.subjects,
      skills: profile.skills,
      studyMode: profile.studyMode,
      availability: profile.availability,
    };

    const compatibility = calculateCompatibility(currentInput, candidateInput);

    const outgoing = sentByReceiver.get(profile.userId);
    const incoming = receivedBySender.get(profile.userId);
    let inviteStatus: "none" | "pending_sent" | "pending_received" | "accepted" | "rejected" = "none";
    if (outgoing?.status === "accepted" || incoming?.status === "accepted") {
      inviteStatus = "accepted";
    } else if (outgoing?.status === "pending") {
      inviteStatus = "pending_sent";
    } else if (incoming?.status === "pending") {
      inviteStatus = "pending_received";
    } else if (outgoing?.status === "rejected" && !incoming) {
      inviteStatus = "rejected";
    }

    return {
      userId: profile.userId,
      name: profile.user.name,
      image: profile.user.image,
      university: profile.user.university,
      year: profile.year,
      branch: profile.branch,
      subjects: profile.subjects,
      skills: profile.skills,
      studyMode: profile.studyMode,
      availability: profile.availability,
      compatibility,
      inviteStatus,
      isBookmarked: bookmarkedIds.has(profile.userId),
    };
  });

  if (q) {
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.branch.toLowerCase().includes(q) ||
        r.subjects.some((s) => s.toLowerCase().includes(q)) ||
        r.skills.some((s) => s.toLowerCase().includes(q))
    );
  }
  if (branch) results = results.filter((r) => r.branch.toLowerCase() === branch);
  if (year) results = results.filter((r) => r.year.toLowerCase() === year);
  if (subject) results = results.filter((r) => r.subjects.some((s) => s.toLowerCase() === subject));
  if (skill) results = results.filter((r) => r.skills.some((s) => s.toLowerCase() === skill));
  if (mode) results = results.filter((r) => r.studyMode === mode);

  results.sort((a, b) =>
    sort === "recent" ? 0 : b.compatibility.score - a.compatibility.score
  );

  return NextResponse.json({ stats, partners: results, hasProfile: true });
}
