import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

function describeActivity(type: NotificationType, payload: Record<string, unknown>): string {
  switch (type) {
    case "join_request":
      return payload.status
        ? `Your request to join "${payload.groupTitle}" was ${payload.status}`
        : `${payload.requesterName} requested to join "${payload.groupTitle}"`;
    case "approved":
      return `You were approved to join "${payload.groupTitle}"`;
    case "session_reminder":
      return `New session scheduled in "${payload.groupTitle}"`;
    case "message":
      return `New message in "${payload.groupTitle}"`;
    case "partner_invite":
      return `${payload.senderName || "Someone"} sent you a study partner invite`;
    case "partner_response":
      return `${payload.responderName || "Someone"} ${
        payload.status === "accepted" ? "accepted" : "declined"
      } your study partner invite`;
    default:
      return "Activity update";
  }
}

// GET /api/dashboard — everything the dashboard page needs, in one call
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [
    groupsJoined,
    groupsCreated,
    pendingJoinRequests,
    unreadNotifications,
    upcomingSessions,
    recentNotifications,
    myMemberships,
  ] = await Promise.all([
    prisma.groupMembership.count({ where: { userId, status: "active" } }),
    prisma.studyGroup.count({ where: { ownerId: userId } }),
    prisma.joinRequest.count({
      where: {
        status: "pending",
        group: {
          OR: [
            { ownerId: userId },
            { memberships: { some: { userId, role: "cohost", status: "active" } } },
          ],
        },
      },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.studySession.findMany({
      where: {
        startsAt: { gte: new Date() },
        group: { memberships: { some: { userId, status: "active" } } },
      },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { group: { select: { id: true, title: true } } },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.groupMembership.findMany({
      where: { userId, status: "active" },
      select: { groupId: true },
    }),
  ]);

  const joinedGroupIds = myMemberships.map((m) => m.groupId);

  // "Continue studying": groups I belong to, prioritizing ones with an
  // upcoming session, falling back to most recently joined.
  const continueStudying = await prisma.studyGroup.findMany({
    where: { id: { in: joinedGroupIds } },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: {
      primarySubject: true,
      _count: { select: { memberships: true } },
      studySessions: {
        where: { startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
        take: 1,
        select: { startsAt: true },
      },
    },
  });

  return NextResponse.json({
    stats: {
      groupsJoined,
      groupsCreated,
      pendingJoinRequests,
      upcomingSessionsCount: upcomingSessions.length,
      unreadNotifications,
    },
    upcomingSessions,
    recentActivity: recentNotifications.map((n) => ({
      id: n.id,
      type: n.type,
      text: describeActivity(n.type, (n.payload as Record<string, unknown>) || {}),
      createdAt: n.createdAt,
      readAt: n.readAt,
    })),
    continueStudying: continueStudying.map((g) => ({
      id: g.id,
      title: g.title,
      subject: g.primarySubject?.name ?? null,
      members: g._count.memberships,
      nextSession: g.studySessions[0]?.startsAt ?? null,
    })),
  });
}
