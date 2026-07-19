"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Handshake, Search, UserCheck, Users } from "lucide-react";
import { PartnerProfileModal, type PartnerProfileData } from "@/components/partners/partner-profile-modal";
import { PartnerCard, type PartnerListItem } from "@/components/partners/partner-card";
import { ReceivedInviteCard, type InviteUserSummary } from "@/components/partners/invite-card";
import { STUDY_MODE_OPTIONS, YEAR_OPTIONS } from "@/lib/partner-matching";

interface Stats {
  pendingRequests: number;
  acceptedPartners: number;
  partnersAvailable: number;
}

interface ReceivedInvite {
  id: string;
  message: string | null;
  createdAt: string;
  sender: InviteUserSummary;
}

const STAT_CARDS = (stats: Stats) => [
  {
    label: "Pending Requests",
    value: stats.pendingRequests,
    icon: Clock,
    gradient: "from-orange-500 to-amber-600",
  },
  {
    label: "Accepted Partners",
    value: stats.acceptedPartners,
    icon: UserCheck,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    label: "Partners Available",
    value: stats.partnersAvailable,
    icon: Users,
    gradient: "from-blue-500 to-indigo-600",
  },
];

export default function StudyPartnersPage() {
  const [stats, setStats] = useState<Stats>({
    pendingRequests: 0,
    acceptedPartners: 0,
    partnersAvailable: 0,
  });
  const [partners, setPartners] = useState<PartnerListItem[]>([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [myProfile, setMyProfile] = useState<PartnerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<"discover" | "invites">("discover");
  const [receivedInvites, setReceivedInvites] = useState<ReceivedInvite[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [mode, setMode] = useState("");

  const fetchMyProfile = useCallback(async () => {
    const res = await fetch("/api/partner-profile");
    if (res.ok) {
      const data = await res.json();
      setMyProfile(data);
    }
  }, []);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (branch) params.set("branch", branch);
    if (year) params.set("year", year);
    if (mode) params.set("mode", mode);

    const res = await fetch(`/api/partners?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setPartners(data.partners);
      setHasProfile(data.hasProfile);
    }
    setLoading(false);
  }, [q, branch, year, mode]);

  const fetchInvites = useCallback(async () => {
    const res = await fetch("/api/partners/invites");
    if (res.ok) {
      const data = await res.json();
      setReceivedInvites(data.received.filter((i: { status: string }) => i.status === "pending"));
    }
  }, []);

  useEffect(() => {
    fetchMyProfile();
    fetchInvites();
  }, [fetchMyProfile, fetchInvites]);

  useEffect(() => {
    const timeout = setTimeout(fetchPartners, 300);
    return () => clearTimeout(timeout);
  }, [fetchPartners]);

  const handleProfileSaved = (profile: PartnerProfileData) => {
    setMyProfile(profile);
    setModalOpen(false);
    fetchPartners();
  };

  const handleInvite = async (userId: string) => {
    setActionError(null);
    const res = await fetch("/api/partners/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setActionError(data.error || "Could not send invite");
      return;
    }
    fetchPartners();
  };

  const handleToggleBookmark = async (userId: string) => {
    setPartners((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, isBookmarked: !p.isBookmarked } : p))
    );
    const res = await fetch("/api/partners/bookmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const { bookmarked } = await res.json();
      setPartners((prev) =>
        prev.map((p) => (p.userId === userId ? { ...p, isBookmarked: bookmarked } : p))
      );
    }
  };

  const handleRespondInvite = async (inviteId: string, action: "accept" | "reject") => {
    await fetch(`/api/partners/invite/${inviteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    fetchInvites();
    fetchPartners();
  };

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            <Handshake className="text-blue-600" size={26} />
            Study Partners
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Find compatible study partners based on subjects, skills, and availability.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {hasProfile ? "Edit Preferences" : "Find Partners"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STAT_CARDS(stats).map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${card.gradient} text-white`}>
              <card.icon size={20} />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setTab("discover")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "discover"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Discover Partners
        </button>
        <button
          onClick={() => setTab("invites")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "invites"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Invites Received{receivedInvites.length > 0 ? ` (${receivedInvites.length})` : ""}
        </button>
      </div>

      {actionError && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {actionError}
        </p>
      )}

      {tab === "invites" ? (
        <div className="space-y-3">
          {receivedInvites.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No pending invites right now.</p>
          ) : (
            receivedInvites.map((invite) => (
              <ReceivedInviteCard
                key={invite.id}
                inviteId={invite.id}
                from={invite.sender}
                message={invite.message}
                onRespond={handleRespondInvite}
              />
            ))
          )}
        </div>
      ) : !hasProfile && !loading ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <Handshake className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="text-gray-600 dark:text-gray-300">
            Set up your study partner preferences to see compatible matches.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Find Partners
          </button>
        </div>
      ) : (
        <>
          {/* Search + filter bar */}
          <div className="mb-6 flex flex-wrap gap-2">
            <div className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, subject, or skill..."
                className="w-full rounded border border-gray-300 p-2 pl-8 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Branch"
              className="w-36 rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">Any year</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">Any mode</option>
              {STUDY_MODE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : partners.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No study partners found yet. Try different filters, or check back later.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {partners.map((partner) => (
                <PartnerCard
                  key={partner.userId}
                  partner={partner}
                  onInvite={handleInvite}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          )}
        </>
      )}

      <PartnerProfileModal
        open={modalOpen}
        initial={myProfile}
        onClose={() => setModalOpen(false)}
        onSaved={handleProfileSaved}
      />
    </div>
  );
}
