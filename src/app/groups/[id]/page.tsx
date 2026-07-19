"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Star,
  Users,
  GraduationCap,
  Flag,
  Check,
  X,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Link2,
  Upload,
  Pencil,
  Trash2,
  Download,
  ExternalLink,
  FolderOpen,
} from "lucide-react";

interface Member {
  userId: string;
  role: string;
  user: { id: string; name: string };
}

interface Attendee {
  userId: string;
  rsvpStatus: string;
  user: { id: string; name: string };
}

interface StudySession {
  id: string;
  title: string;
  startsAt: string;
  durationMins: number;
  meetingUrl: string | null;
  notesFileUrl: string | null;
  notesFileName: string | null;
  creator: { id: string; name: string };
  attendees: Attendee[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string };
}

interface GroupDetail {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  visibility: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  bannerUrl: string | null;
  university: string | null;
  locationText: string | null;
  maxMembers: number | null;
  sessionSchedulingPermission: "owner" | "owner_cohost" | "all_members";
  owner: { id: string; name: string; university: string | null };
  primarySubject: { name: string } | null;
  tags: { tag: string }[];
  memberships: Member[];
  studySessions: StudySession[];
  reviews: Review[];
  avgRating: number | null;
  reviewCount: number;
}

interface JoinRequestItem {
  id: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
}

interface GroupResource {
  id: string;
  name: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
  uploader: { id: string; name: string };
  session: { id: string; title: string } | null;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  advanced: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-cyan-500 to-blue-600",
];

function avatarGradientFor(seed: string) {
  const idx = seed.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinStatus, setJoinStatus] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sessionForm, setSessionForm] = useState({
    title: "",
    startsAt: "",
    durationMins: "60",
    meetingUrl: "",
    notesFileUrl: "",
    notesFileName: "",
  });
  const [fileError, setFileError] = useState("");
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);
  const [resources, setResources] = useState<GroupResource[]>([]);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({ name: "", fileUrl: "", fileName: "" });
  const [resourceFileError, setResourceFileError] = useState("");
  const [resourceError, setResourceError] = useState("");
  const [uploadingResource, setUploadingResource] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequestItem[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(0);

  const fetchGroup = useCallback(async () => {
    const res = await fetch(`/api/groups/${id}`);
    if (res.ok) setGroup(await res.json());
    setLoading(false);
  }, [id]);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/groups/${id}/messages`);
    if (res.ok) setMessages(await res.json());
  }, [id]);

  const fetchResources = useCallback(async () => {
    const res = await fetch(`/api/groups/${id}/resources`);
    if (res.ok) setResources(await res.json());
  }, [id]);

  const fetchBookmarkStatus = useCallback(async () => {
    if (!session) return;
    const res = await fetch(`/api/groups/${id}/bookmark`);
    if (res.ok) {
      const { bookmarked } = await res.json();
      setBookmarked(bookmarked);
    }
  }, [id, session]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  useEffect(() => {
    fetchBookmarkStatus();
  }, [fetchBookmarkStatus]);

  const handleToggleBookmark = async () => {
    const res = await fetch(`/api/groups/${id}/bookmark`, { method: "POST" });
    if (res.ok) {
      const { bookmarked } = await res.json();
      setBookmarked(bookmarked);
    }
  };

  const myMembership = group?.memberships.find((m) => m.userId === session?.user?.id);
  const isMember = !!myMembership;
  const isOwnerOrCohost = myMembership && ["owner", "cohost"].includes(myMembership.role);
  const schedulingPermission = group?.sessionSchedulingPermission || "all_members";
  const canScheduleSessions =
    !!myMembership &&
    (myMembership.role === "owner" ||
      schedulingPermission === "all_members" ||
      (schedulingPermission === "owner_cohost" &&
        ["owner", "cohost"].includes(myMembership.role)));

  const fetchJoinRequests = useCallback(async () => {
    const res = await fetch(`/api/groups/${id}/requests`);
    if (res.ok) setJoinRequests(await res.json());
  }, [id]);

  useEffect(() => {
    if (isOwnerOrCohost) fetchJoinRequests();
  }, [isOwnerOrCohost, fetchJoinRequests]);

  useEffect(() => {
    if (isMember) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [isMember, fetchMessages]);

  useEffect(() => {
    if (isMember) fetchResources();
  }, [isMember, fetchResources]);

  useEffect(() => {
    if (messages.length > lastMessageCount.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    lastMessageCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (group && session?.user?.id) {
      const mine = group.reviews.find((r) => r.user.id === session.user!.id);
      if (mine) {
        setMyRating(mine.rating);
        setMyComment(mine.comment || "");
      }
    }
  }, [group, session]);

  const handleJoin = async () => {
    setJoinStatus("loading");
    const res = await fetch(`/api/groups/${id}/join`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setJoinStatus(data.error || "error");
      return;
    }
    setJoinStatus(data.status);
    fetchGroup();
  };

  const handleLeave = async () => {
    await fetch(`/api/groups/${id}/leave`, { method: "POST" });
    fetchGroup();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const res = await fetch(`/api/groups/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });
    if (res.ok) {
      setNewMessage("");
      fetchMessages();
    }
  };

  const [sessionError, setSessionError] = useState("");

  const handleSessionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");

    if (file.size > 5 * 1024 * 1024) {
      setFileError("File is too large — please choose something under 5MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSessionForm((f) => ({
        ...f,
        notesFileUrl: reader.result as string,
        notesFileName: file.name,
      }));
    };
    reader.onerror = () => setFileError("Couldn't read that file. Please try again.");
    reader.readAsDataURL(file);
  };

  const handleResourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResourceFileError("");

    if (file.size > 5 * 1024 * 1024) {
      setResourceFileError("File is too large — please choose something under 5MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setResourceForm((f) => ({
        ...f,
        fileUrl: reader.result as string,
        fileName: file.name,
        name: f.name || file.name,
      }));
    };
    reader.onerror = () => setResourceFileError("Couldn't read that file. Please try again.");
    reader.readAsDataURL(file);
  };

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setResourceError("");
    setUploadingResource(true);
    const res = await fetch(`/api/groups/${id}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resourceForm),
    });
    setUploadingResource(false);
    if (res.ok) {
      setResourceForm({ name: "", fileUrl: "", fileName: "" });
      setResourceModalOpen(false);
      fetchResources();
    } else {
      const data = await res.json().catch(() => ({}));
      setResourceError(data.error || "Something went wrong");
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm("Delete this resource?")) return;
    const res = await fetch(`/api/resources/${resourceId}`, { method: "DELETE" });
    if (res.ok) fetchResources();
  };

  const emptySessionForm = {
    title: "",
    startsAt: "",
    durationMins: "60",
    meetingUrl: "",
    notesFileUrl: "",
    notesFileName: "",
  };

  const toDatetimeLocalValue = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const openNewSessionModal = () => {
    setEditingSessionId(null);
    setSessionForm(emptySessionForm);
    setSessionError("");
    setFileError("");
    setSessionModalOpen(true);
  };

  const openEditSessionModal = (s: StudySession) => {
    setEditingSessionId(s.id);
    setSessionForm({
      title: s.title,
      startsAt: toDatetimeLocalValue(s.startsAt),
      durationMins: String(s.durationMins),
      meetingUrl: s.meetingUrl || "",
      notesFileUrl: s.notesFileUrl || "",
      notesFileName: s.notesFileName || "",
    });
    setSessionError("");
    setFileError("");
    setSelectedSession(null);
    setSessionModalOpen(true);
  };

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionError("");
    const url = editingSessionId
      ? `/api/sessions/${editingSessionId}`
      : `/api/groups/${id}/sessions`;
    const res = await fetch(url, {
      method: editingSessionId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionForm),
    });
    if (res.ok) {
      setSessionForm(emptySessionForm);
      setEditingSessionId(null);
      setSessionModalOpen(false);
      fetchGroup();
    } else {
      const data = await res.json().catch(() => ({}));
      setSessionError(data.error || "Something went wrong");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Delete this session? This can't be undone.")) return;
    setDeletingSession(true);
    const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    setDeletingSession(false);
    if (res.ok) {
      setSelectedSession(null);
      fetchGroup();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this group permanently?")) return;
    await fetch(`/api/groups/${id}`, { method: "DELETE" });
    router.push("/groups");
  };

  const handleRequestAction = async (requestId: string, action: "approve" | "reject") => {
    await fetch(`/api/groups/${id}/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    fetchJoinRequests();
    fetchGroup();
  };

  const submitRating = async () => {
    if (myRating < 1) return;
    await fetch(`/api/groups/${id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: myRating, comment: myComment }),
    });
    fetchGroup();
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;
    const res = await fetch(`/api/groups/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reportReason }),
    });
    if (res.ok) {
      setReportSent(true);
      setReportReason("");
      setTimeout(() => {
        setReportOpen(false);
        setReportSent(false);
      }, 1500);
    }
  };

  if (loading) return <p className="p-8 text-gray-500 dark:text-gray-400">Loading...</p>;
  if (!group) return <p className="p-8 text-gray-500 dark:text-gray-400">Group not found.</p>;

  return (
    <div className="mx-auto max-w-3xl pb-16">
      {/* Banner */}
      <div
        className="relative h-48 w-full bg-gradient-to-br from-blue-500 to-indigo-600 sm:rounded-b-xl"
        style={
          group.bannerUrl
            ? {
                backgroundImage: `url(${group.bannerUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-black/30 sm:rounded-b-xl" />
        <div className="absolute left-6 top-6 flex flex-wrap gap-1.5">
          {group.primarySubject && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800 backdrop-blur">
              {group.primarySubject.name}
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${DIFFICULTY_STYLES[group.difficulty]}`}
          >
            {group.difficulty}
          </span>
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800 backdrop-blur">
            {group.mode}
          </span>
        </div>
        <div className="absolute right-6 top-6 flex gap-2">
          {session && (
            <button
              onClick={handleToggleBookmark}
              title={bookmarked ? "Remove bookmark" : "Bookmark group"}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark group"}
              className={`rounded-full bg-white/90 p-2 backdrop-blur ${
                bookmarked ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
            </button>
          )}
          {isOwnerOrCohost && (
            <>
              {myMembership?.role === "owner" && (
                <button
                  onClick={handleDelete}
                  className="rounded-full bg-red-600/90 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-red-700"
                >
                  Delete
                </button>
              )}
              <Link
                href={`/groups/${id}/manage`}
                className="rounded-full bg-white/90 px-3 py-2 text-xs font-medium text-gray-800 backdrop-blur hover:bg-white"
              >
                Manage
              </Link>
            </>
          )}
        </div>
        <div className="absolute bottom-5 left-6 right-6">
          <h1 className="text-2xl font-bold text-white drop-shadow sm:text-3xl">{group.title}</h1>
        </div>
      </div>

      <div className="px-6">
        <p className="mt-4 text-gray-600 dark:text-gray-300">{group.description}</p>

        {group.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {group.tags.map((t) => (
              <span
                key={t.tag}
                className="rounded bg-gray-100 px-2 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                #{t.tag}
              </span>
            ))}
          </div>
        )}

        {/* Creator + meta */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-y-3">
          <Link
            href={`/users/${group.owner.id}`}
            className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 hover:border-blue-300 dark:border-gray-800"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">
              {group.owner.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-200">{group.owner.name}</span>
          </Link>

          <button
            onClick={() => setMembersModalOpen(true)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          >
            <Users size={14} />
            {group.memberships.length}
            {group.maxMembers ? ` / ${group.maxMembers}` : ""} members
          </button>

          {group.university && (
            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <GraduationCap size={14} />
              {group.university}
            </span>
          )}
          {group.locationText && (
            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <MapPin size={14} />
              {group.locationText}
            </span>
          )}
          {group.avgRating != null ? (
            <span className="flex items-center gap-1 text-sm text-amber-500">
              <Star size={14} fill="currentColor" />
              {group.avgRating} ({group.reviewCount})
            </span>
          ) : (
            <span className="text-sm text-gray-400">No ratings yet</span>
          )}
        </div>

        {/* Members modal */}
        {membersModalOpen && (
          <div
            onClick={() => setMembersModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-h-[70vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Members ({group.memberships.length})
                </h3>
                <button
                  onClick={() => setMembersModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <ul className="space-y-1">
                {group.memberships.map((m) => (
                  <li key={m.userId}>
                    <Link
                      href={`/users/${m.user.id}`}
                      onClick={() => setMembersModalOpen(false)}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradientFor(
                          m.user.id
                        )} text-xs font-semibold text-white`}
                      >
                        {m.user.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">
                        {m.user.name}
                      </span>
                      <span className="text-xs text-gray-400">{m.role}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Schedule session modal */}
        {sessionModalOpen && (
          <div
            onClick={() => setSessionModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {editingSessionId ? "Edit session" : "Schedule a session"}
                </h3>
                <button
                  onClick={() => setSessionModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmitSession} className="space-y-3">
                {sessionError && (
                  <p className="rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
                    {sessionError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Session name
                  </label>
                  <input
                    required
                    placeholder="e.g. Arrays & Linked Lists"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                    className="mt-1 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Date &amp; time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={sessionForm.startsAt}
                    onChange={(e) => setSessionForm({ ...sessionForm, startsAt: e.target.value })}
                    className="mt-1 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    required
                    value={sessionForm.durationMins}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, durationMins: e.target.value })
                    }
                    className="mt-1 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Meeting link (optional)
                  </label>
                  <input
                    placeholder="https://..."
                    value={sessionForm.meetingUrl}
                    onChange={(e) => setSessionForm({ ...sessionForm, meetingUrl: e.target.value })}
                    className="mt-1 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Notes (optional) — upload a file from your device
                  </label>
                  <label className="mt-1 flex cursor-pointer items-center gap-2 rounded border border-dashed border-gray-300 p-2.5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:text-gray-400">
                    <Upload size={15} />
                    {sessionForm.notesFileName || "Choose a file (PDF, image, doc — up to 5MB)"}
                    <input type="file" onChange={handleSessionFileChange} className="hidden" />
                  </label>
                  {fileError && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fileError}</p>
                  )}
                  {sessionForm.notesFileName && (
                    <button
                      type="button"
                      onClick={() =>
                        setSessionForm({ ...sessionForm, notesFileUrl: "", notesFileName: "" })
                      }
                      className="mt-1 text-xs text-gray-400 hover:text-red-600"
                    >
                      Remove file
                    </button>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    {editingSessionId ? "Save changes" : "Schedule session"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSessionModalOpen(false);
                      setEditingSessionId(null);
                    }}
                    className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join requests (owner/cohost) */}
        {isOwnerOrCohost && joinRequests.length > 0 && (
          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Join Requests ({joinRequests.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {joinRequests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-white p-3 text-sm shadow-sm dark:bg-gray-900"
                >
                  <div>
                    <Link href={`/users/${r.user.id}`} className="font-medium text-gray-900 hover:underline dark:text-gray-100">
                      {r.user.name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{r.user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestAction(r.id, "approve")}
                      title="Approve"
                      className="rounded-full bg-green-100 p-1.5 text-green-700 hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => handleRequestAction(r.id, "reject")}
                      title="Reject"
                      className="rounded-full bg-red-100 p-1.5 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sessions */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Upcoming Sessions</h2>
            {canScheduleSessions && (
              <button
                onClick={openNewSessionModal}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                + Schedule session
              </button>
            )}
          </div>

          {!canScheduleSessions && isMember && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Only{" "}
              {schedulingPermission === "owner" ? "the group owner" : "the owner and co-hosts"}{" "}
              can schedule sessions in this group.
            </p>
          )}

          <ul className="mt-3 space-y-2.5">
            {group.studySessions.map((s) => {
              const isPast = new Date(s.startsAt).getTime() < Date.now();
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setSelectedSession(s)}
                    className={`flex w-full items-start justify-between gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      isPast
                        ? "border-gray-200 opacity-60 dark:border-gray-800"
                        : "border-gray-200 hover:border-blue-300 dark:border-gray-800"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                        {s.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Users size={12} />
                        {s.creator.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {s.meetingUrl && (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Link2 size={12} />
                            Meeting link
                          </span>
                        )}
                        {s.notesFileName && (
                          <span className="flex items-center gap-1">
                            <FileText size={12} />
                            {s.notesFileName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-right dark:bg-blue-950/40">
                      <p className="flex items-center justify-end gap-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                        <Calendar size={12} />
                        {new Date(s.startsAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <Clock size={12} />
                        {new Date(s.startsAt).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        · {s.durationMins}m
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
            {group.studySessions.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No sessions scheduled yet.</p>
            )}
          </ul>
        </div>

        {/* Session details modal */}
        {selectedSession && (
          <div
            onClick={() => setSelectedSession(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedSession.title}
                </h3>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2.5 text-sm">
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar size={14} className="text-blue-600" />
                  {new Date(selectedSession.startsAt).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Clock size={14} className="text-blue-600" />
                  {new Date(selectedSession.startsAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {selectedSession.durationMins} minutes
                </p>
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Users size={14} className="text-blue-600" />
                  Scheduled by {selectedSession.creator.name}
                </p>
                {selectedSession.meetingUrl && (
                  <a
                    href={selectedSession.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <Link2 size={14} />
                    {selectedSession.meetingUrl}
                  </a>
                )}
                {selectedSession.notesFileUrl && selectedSession.notesFileName && (
                  <a
                    href={selectedSession.notesFileUrl}
                    download={selectedSession.notesFileName}
                    className="flex items-center gap-2 rounded border border-gray-200 p-2.5 text-gray-700 hover:border-blue-300 hover:text-blue-600 dark:border-gray-800 dark:text-gray-300"
                  >
                    <FileText size={14} />
                    <span className="flex-1 truncate">{selectedSession.notesFileName}</span>
                    <span className="text-xs text-gray-400">Download</span>
                  </a>
                )}
              </div>

              {myMembership?.role === "owner" && (
                <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <button
                    onClick={() => openEditSessionModal(selectedSession)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSession(selectedSession.id)}
                    disabled={deletingSession}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
                  >
                    <Trash2 size={14} />
                    {deletingSession ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resources */}
        {isMember && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                <FolderOpen size={16} />
                Resources
              </h2>
              <button
                onClick={() => {
                  setResourceForm({ name: "", fileUrl: "", fileName: "" });
                  setResourceError("");
                  setResourceFileError("");
                  setResourceModalOpen(true);
                }}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                + Add resource
              </button>
            </div>

            {resources.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No resources shared yet. Notes, slides, and links uploaded here (or attached to a
                session) will show up for everyone in the group.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {resources.map((r) => {
                  const canDelete =
                    r.uploader.id === session?.user?.id || myMembership?.role === "owner";
                  return (
                    <li
                      key={r.id}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                          {r.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          by {r.uploader.name}
                          {r.session && ` · ${r.session.title}`} ·{" "}
                          {new Date(r.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <a
                            href={r.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            <ExternalLink size={11} />
                            Open
                          </a>
                          <a
                            href={r.fileUrl}
                            download={r.fileName}
                            className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            <Download size={11} />
                            Download
                          </a>
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteResource(r.id)}
                              className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                              <Trash2 size={11} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Add resource modal */}
        {resourceModalOpen && (
          <div
            onClick={() => setResourceModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Add a resource</h3>
                <button
                  onClick={() => setResourceModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleUploadResource} className="space-y-3">
                {resourceError && (
                  <p className="rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
                    {resourceError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Resource name
                  </label>
                  <input
                    required
                    placeholder="e.g. Week 3 lecture notes"
                    value={resourceForm.name}
                    onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                    className="mt-1 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    File
                  </label>
                  <label className="mt-1 flex cursor-pointer items-center gap-2 rounded border border-dashed border-gray-300 p-2.5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:text-gray-400">
                    <Upload size={15} />
                    {resourceForm.fileName || "Choose a file (up to 5MB)"}
                    <input type="file" onChange={handleResourceFileChange} className="hidden" />
                  </label>
                  {resourceFileError && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {resourceFileError}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={uploadingResource || !resourceForm.fileUrl}
                    className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadingResource ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResourceModalOpen(false)}
                    className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Chat */}
        {isMember && (
          <div className="mt-8">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Group Chat</h2>
            <div
              ref={chatContainerRef}
              className="mt-2 flex h-80 flex-col overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950"
            >
              {messages.map((m) => {
                const isMine = m.sender.id === session?.user?.id;
                return (
                  <div
                    key={m.id}
                    className={`mb-3 flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}
                  >
                    <Link href={`/users/${m.sender.id}`} className="shrink-0">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradientFor(
                          m.sender.id
                        )} text-[10px] font-semibold text-white`}
                      >
                        {m.sender.name.slice(0, 1).toUpperCase()}
                      </span>
                    </Link>
                    <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                      {!isMine && (
                        <Link
                          href={`/users/${m.sender.id}`}
                          className="mb-0.5 px-1 text-[11px] font-medium text-gray-500 hover:underline dark:text-gray-400"
                        >
                          {m.sender.name}
                        </Link>
                      )}
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          isMine
                            ? "rounded-br-sm bg-blue-600 text-white"
                            : "rounded-bl-sm bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="mt-0.5 px-1 text-[10px] text-gray-400">
                        {new Date(m.createdAt).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="m-auto text-sm text-gray-500 dark:text-gray-400">
                  No messages yet. Say hello!
                </p>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="mt-2 flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              />
              <button
                type="submit"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-8">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Reviews</h2>

          {isMember && (
            <div className="mt-2 rounded border border-gray-200 p-3 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-300">Rate this group</p>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setMyRating(n)} aria-label={`${n} star`}>
                    <Star
                      size={20}
                      className={n <= myRating ? "text-amber-500" : "text-gray-300 dark:text-gray-700"}
                      fill={n <= myRating ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                rows={2}
                placeholder="Optional comment..."
                className="mt-2 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <button
                onClick={submitRating}
                disabled={myRating < 1}
                className="mt-2 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Submit rating
              </button>
            </div>
          )}

          <ul className="mt-3 space-y-2">
            {group.reviews.map((r) => (
              <li key={r.id} className="rounded border border-gray-200 p-3 text-sm dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <Link href={`/users/${r.user.id}`} className="font-medium text-gray-900 hover:underline dark:text-gray-100">
                    {r.user.name}
                  </Link>
                  <span className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </span>
                </div>
                {r.comment && <p className="mt-1 text-gray-600 dark:text-gray-300">{r.comment}</p>}
              </li>
            ))}
            {group.reviews.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet.</p>
            )}
          </ul>
        </div>

        {/* Join / Leave / Report — end of page */}
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          {!session ? (
            <Link href="/login" className="rounded bg-blue-600 px-4 py-2 text-sm text-white">
              Log in to join
            </Link>
          ) : isMember ? (
            myMembership?.role !== "owner" && (
              <button
                onClick={handleLeave}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Leave group
              </button>
            )
          ) : (
            <button
              onClick={handleJoin}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              {group.visibility === "private" ? "Request to join" : "Join group"}
            </button>
          )}
          {joinStatus === "pending" && (
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              Pending approval
            </span>
          )}
          {session && (
            <button
              onClick={() => setReportOpen(true)}
              className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
            >
              <Flag size={13} />
              Report group
            </button>
          )}
        </div>

        {/* Report modal */}
        {reportOpen && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            {reportSent ? (
              <p className="text-sm text-red-700 dark:text-red-400">
                Thanks — your report has been submitted for review.
              </p>
            ) : (
              <>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Why are you reporting this group?
                </p>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded border border-red-300 p-2 text-sm dark:border-red-800 dark:bg-gray-900"
                  placeholder="Describe the issue..."
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={submitReport}
                    className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                  >
                    Submit report
                  </button>
                  <button
                    onClick={() => setReportOpen(false)}
                    className="rounded bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
