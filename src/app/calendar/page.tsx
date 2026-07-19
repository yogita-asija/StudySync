"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Link as LinkIcon, MapPin } from "lucide-react";

interface Attendee {
  userId: string;
  rsvpStatus: string;
}

interface SessionItem {
  id: string;
  startsAt: string;
  durationMins: number;
  meetingUrl: string | null;
  notes: string | null;
  group: { id: string; title: string };
  creator: { id: string; name: string };
  attendees: Attendee[];
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarPage() {
  const { data: authSession } = useSession();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => new Date());

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/calendar");
    if (res.ok) {
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRsvp = async (sessionId: string, status: string) => {
    await fetch(`/api/sessions/${sessionId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchSessions();
  };

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const sessionsInMonth = useMemo(
    () =>
      sessions.filter((s) => {
        const d = new Date(s.startsAt);
        return d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth();
      }),
    [sessions, cursor]
  );

  const daysWithSessions = useMemo(() => {
    const map = new Map<number, SessionItem[]>();
    for (const s of sessionsInMonth) {
      const day = new Date(s.startsAt).getDate();
      map.set(day, [...(map.get(day) || []), s]);
    }
    return map;
  }, [sessionsInMonth]);

  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const today = new Date();

  const upcoming = useMemo(
    () =>
      sessions
        .filter((s) => new Date(s.startsAt).getTime() >= Date.now() - 60 * 60 * 1000)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [sessions]
  );

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center gap-2">
        <CalendarDays size={22} />
        <h1 className="text-2xl font-bold">Calendar</h1>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-[1fr_320px]">
          {/* Month grid */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                }
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-semibold">{monthLabel}</h2>
              <button
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                }
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startWeekday }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
                const daySessions = daysWithSessions.get(day) || [];
                const isToday = sameDay(date, today);
                return (
                  <div
                    key={day}
                    className={`min-h-16 rounded border p-1 text-left text-xs ${
                      isToday ? "border-blue-400 bg-blue-50" : "border-gray-100"
                    }`}
                  >
                    <p className={isToday ? "font-semibold text-blue-700" : "text-gray-500"}>
                      {day}
                    </p>
                    {daySessions.slice(0, 2).map((s) => (
                      <Link
                        key={s.id}
                        href={`/groups/${s.group.id}`}
                        className="mt-0.5 block truncate rounded bg-blue-100 px-1 text-blue-800 hover:bg-blue-200"
                        title={s.group.title}
                      >
                        {new Date(s.startsAt).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        {s.group.title}
                      </Link>
                    ))}
                    {daySessions.length > 2 && (
                      <p className="text-gray-400">+{daySessions.length - 2} more</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agenda */}
          <div>
            <h2 className="mb-3 font-semibold">Upcoming sessions</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500">
                No upcoming sessions. Join a group and schedule one!
              </p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((s) => {
                  const myRsvp = s.attendees.find((a) => a.userId === authSession?.user?.id);
                  return (
                    <li key={s.id} className="rounded border border-gray-200 p-3 text-sm">
                      <Link
                        href={`/groups/${s.group.id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {s.group.title}
                      </Link>
                      <p className="mt-1 flex items-center gap-1 text-gray-600">
                        <Clock size={14} />
                        {new Date(s.startsAt).toLocaleString()} · {s.durationMins} min
                      </p>
                      {s.meetingUrl && (
                        <a
                          href={s.meetingUrl}
                          className="mt-1 flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <LinkIcon size={14} />
                          Join meeting
                        </a>
                      )}
                      {s.notes && (
                        <p className="mt-1 flex items-center gap-1 text-gray-500">
                          <MapPin size={14} />
                          {s.notes}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        {s.attendees.filter((a) => a.rsvpStatus === "going").length} going
                      </p>
                      <div className="mt-2 flex gap-2">
                        {["going", "maybe", "not_going"].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleRsvp(s.id, status)}
                            className={`rounded px-2 py-1 text-xs ${
                              myRsvp?.rsvpStatus === status
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {status.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
