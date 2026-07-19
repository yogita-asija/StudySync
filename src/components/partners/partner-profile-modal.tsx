"use client";

import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import {
  AVAILABILITY_SLOTS,
  STUDY_MODE_OPTIONS,
  YEAR_OPTIONS,
} from "@/lib/partner-matching";

export interface PartnerProfileData {
  year: string;
  branch: string;
  subjects: string[];
  skills: string[];
  studyMode: string;
  availability: string[];
}

function TagInput({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const value = draft.trim();
    if (!value) return;
    if (!values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value]);
    }
    setDraft("");
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="mt-1 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <button
          type="button"
          onClick={commit}
          className="rounded border border-gray-300 px-2.5 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label={`Add ${label}`}
        >
          <Plus size={16} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                aria-label={`Remove ${v}`}
                className="text-blue-400 hover:text-blue-700 dark:hover:text-blue-200"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function PartnerProfileModal({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: PartnerProfileData | null;
  onClose: () => void;
  onSaved: (profile: PartnerProfileData) => void;
}) {
  const [year, setYear] = useState(YEAR_OPTIONS[0]);
  const [branch, setBranch] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [studyMode, setStudyMode] = useState("any");
  const [availability, setAvailability] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setYear(initial?.year || YEAR_OPTIONS[0]);
    setBranch(initial?.branch || "");
    setSubjects(initial?.subjects || []);
    setSkills(initial?.skills || []);
    setStudyMode(initial?.studyMode || "any");
    setAvailability(initial?.availability || []);
  }, [open, initial]);

  if (!open) return null;

  const toggleSlot = (slot: string) => {
    setAvailability((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch.trim()) {
      setError("Please enter your branch / major");
      return;
    }
    if (subjects.length === 0) {
      setError("Add at least one subject you're interested in");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await fetch("/api/partner-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, branch: branch.trim(), subjects, skills, studyMode, availability }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    onSaved({ year, branch: branch.trim(), subjects, skills, studyMode, availability });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/40" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Find Study Partners</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tell us about yourself so we can match you with compatible study partners.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Branch / Major
              </label>
              <input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Computer Science"
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
          </div>

          <TagInput
            label="Subjects you're interested in"
            placeholder="e.g. Data Structures — press Enter"
            values={subjects}
            onChange={setSubjects}
          />

          <TagInput
            label="Skills"
            placeholder="e.g. Python, Public Speaking — press Enter"
            values={skills}
            onChange={setSkills}
          />

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Preferred study mode
            </label>
            <select
              value={studyMode}
              onChange={(e) => setStudyMode(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              {STUDY_MODE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              When are you usually free?
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {AVAILABILITY_SLOTS.map((slot) => (
                <label
                  key={slot}
                  className={`flex cursor-pointer items-center gap-2 rounded border px-2.5 py-1.5 text-xs ${
                    availability.includes(slot)
                      ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={availability.includes(slot)}
                    onChange={() => toggleSlot(slot)}
                    className="h-3.5 w-3.5"
                  />
                  {slot}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Find Partners"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
