"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useSession } from "next-auth/react";

interface JoinRequestItem {
  id: string;
  user: { id: string; name: string; email: string };
  createdAt: string;
}

interface Member {
  userId: string;
  role: string;
  user: { id: string; name: string };
}

type SchedulingPermission = "owner" | "owner_cohost" | "all_members";

export default function ManageGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: authSession } = useSession();
  const [requests, setRequests] = useState<JoinRequestItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [schedulingPermission, setSchedulingPermission] = useState<SchedulingPermission>("all_members");
  const [savingPermission, setSavingPermission] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    const [reqRes, groupRes] = await Promise.all([
      fetch(`/api/groups/${id}/requests`),
      fetch(`/api/groups/${id}`),
    ]);

    if (reqRes.ok) setRequests(await reqRes.json());
    else setError("You don't have permission to manage this group.");

    if (groupRes.ok) {
      const group = await groupRes.json();
      setMembers(group.memberships);
      setSchedulingPermission(group.sessionSchedulingPermission || "all_members");
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequest = async (requestId: string, action: "approve" | "reject") => {
    await fetch(`/api/groups/${id}/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    fetchData();
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await fetch(`/api/groups/${id}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    fetchData();
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Remove this member from the group?")) return;
    await fetch(`/api/groups/${id}/members/${userId}`, { method: "DELETE" });
    fetchData();
  };

  const handleSchedulingPermissionChange = async (value: SchedulingPermission) => {
    setSchedulingPermission(value);
    setSavingPermission(true);
    await fetch(`/api/groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionSchedulingPermission: value }),
    });
    setSavingPermission(false);
  };

  const myRole = members.find((m) => m.userId === authSession?.user?.id)?.role;

  if (error) return <p className="p-8 text-red-600">{error}</p>;

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Manage Group</h1>
      <a href={`/groups/${id}`} className="text-sm text-blue-600 hover:underline">
        ← Back to group
      </a>

      {myRole === "owner" && (
        <div className="mt-6 rounded border border-gray-200 p-4">
          <h2 className="font-semibold">Who can schedule sessions?</h2>
          <p className="mt-1 text-sm text-gray-500">
            Control which members are allowed to create study sessions in this group.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {(
              [
                { value: "owner", label: "Owner only" },
                { value: "owner_cohost", label: "Owner + co-hosts" },
                { value: "all_members", label: "All members" },
              ] as const
            ).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="schedulingPermission"
                  checked={schedulingPermission === opt.value}
                  disabled={savingPermission}
                  onChange={() => handleSchedulingPermissionChange(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="font-semibold">Pending join requests</h2>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No pending requests.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm"
              >
                <span>
                  {r.user.name} ({r.user.email})
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequest(r.id, "approve")}
                    className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRequest(r.id, "reject")}
                    className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-semibold">Members</h2>
        <ul className="mt-2 space-y-2">
          {members.map((m) => (
            <li
              key={m.userId}
              className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm"
            >
              <span>
                {m.user.name} — <span className="text-gray-500">{m.role}</span>
              </span>
              {m.role !== "owner" && (
                <div className="flex gap-2">
                  {m.role === "member" ? (
                    <button
                      onClick={() => handleRoleChange(m.userId, "cohost")}
                      className="rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-800"
                    >
                      Make co-host
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(m.userId, "member")}
                      className="rounded bg-gray-500 px-3 py-1 text-xs text-white hover:bg-gray-600"
                    >
                      Remove co-host
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(m.userId)}
                    className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
