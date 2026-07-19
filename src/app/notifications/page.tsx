"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

function describeNotification(n: NotificationItem): string {
  const p = n.payload || {};
  switch (n.type) {
    case "join_request":
      return p.status
        ? `Your request to join "${p.groupTitle}" was ${p.status}.`
        : `${p.requesterName} requested to join "${p.groupTitle}".`;
    case "approved":
      return `You were approved to join "${p.groupTitle}".`;
    case "session_reminder":
      return `New session scheduled in "${p.groupTitle}" at ${
        p.startsAt ? new Date(p.startsAt as string).toLocaleString() : ""
      }.`;
    case "message":
      return `New message in "${p.groupTitle}".`;
    case "partner_invite":
      return `${p.senderName || "Someone"} sent you a study partner invite.`;
    case "partner_response":
      return `${p.responderName || "Someone"} ${p.status === "accepted" ? "accepted" : "declined"} your study partner invite.`;
    default:
      return "You have a new notification.";
  }
}

function isPartnerNotification(type: string) {
  return type === "partner_invite" || type === "partner_response";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) setNotifications(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    fetchNotifications();
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Notifications</h1>

      {loading ? (
        <p className="mt-4 text-gray-500">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="mt-4 text-gray-500">No notifications yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {notifications.map((n) => {
            const content = (
              <>
                <p>{describeNotification(n)}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </>
            );
            const className = `block rounded border p-3 text-sm ${
              n.readAt ? "border-gray-200 text-gray-500" : "border-blue-300 bg-blue-50"
            }`;

            return isPartnerNotification(n.type) ? (
              <Link
                key={n.id}
                href="/partners"
                onClick={() => !n.readAt && markRead(n.id)}
                className={className}
              >
                {content}
              </Link>
            ) : (
              <li
                key={n.id}
                onClick={() => !n.readAt && markRead(n.id)}
                className={`cursor-pointer ${className}`}
              >
                {content}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
