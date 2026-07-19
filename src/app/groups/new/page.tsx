"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewGroupPage() {
  const router = useRouter();
  const { data: authSession } = useSession();
  const [form, setForm] = useState({
    title: "",
    description: "",
    subjectName: "",
    visibility: "public",
    maxMembers: "",
    mode: "online",
    locationText: "",
    difficulty: "beginner",
    bannerUrl: "",
    university: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authSession?.user?.university) {
      setForm((f) => (f.university ? f : { ...f, university: authSession.user!.university || "" }));
    }
  }, [authSession]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push(`/groups/${data.id}`);
  };

  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Create a study group</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            name="title"
            required
            value={form.title}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 p-2"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Subject</label>
          <input
            name="subjectName"
            required
            value={form.subjectName}
            onChange={handleChange}
            placeholder="e.g. Mathematics"
            className="mt-1 w-full rounded border border-gray-300 p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Visibility</label>
            <select
              name="visibility"
              value={form.visibility}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 p-2"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Mode</label>
            <select
              name="mode"
              value={form.mode}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 p-2"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Difficulty</label>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 p-2"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">University</label>
            <input
              name="university"
              value={form.university}
              onChange={handleChange}
              placeholder="e.g. Delhi University"
              className="mt-1 w-full rounded border border-gray-300 p-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Banner image URL</label>
          <input
            name="bannerUrl"
            value={form.bannerUrl}
            onChange={handleChange}
            placeholder="https://..."
            className="mt-1 w-full rounded border border-gray-300 p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Max members</label>
          <input
            name="maxMembers"
            type="number"
            value={form.maxMembers}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Location (if offline/hybrid)
          </label>
          <input
            name="locationText"
            value={form.locationText}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create group"}
        </button>
      </form>
    </div>
  );
}
