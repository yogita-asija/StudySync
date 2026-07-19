"use client";

import { useState } from "react";
import { StickyNote } from "lucide-react";
import { NOTES_LENGTH_OPTIONS } from "@/lib/ai-hub";
import { useAiTool, type AiGenerationResult } from "./use-ai-tool";
import { AiResultView, fieldInputClass, fieldLabelClass, GenerateButton, ToolModalShell } from "./tool-modal-shell";

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded"
      />
      {label}
    </label>
  );
}

export function NotesModal({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: (item: AiGenerationResult) => void;
}) {
  const { loading, error, result, generate, toggleFavorite, reset } = useAiTool("notes", onGenerated);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState("detailed");
  const [includeImportantPoints, setIncludeImportantPoints] = useState(true);
  const [includeExamTips, setIncludeExamTips] = useState(true);
  const [includeCommonMistakes, setIncludeCommonMistakes] = useState(true);

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) return;
    generate({
      subject: subject.trim(),
      topic: topic.trim(),
      length,
      includeImportantPoints,
      includeExamTips,
      includeCommonMistakes,
    });
  };

  return (
    <ToolModalShell
      open={open}
      onClose={handleClose}
      icon={StickyNote}
      iconGradient="from-emerald-500 to-teal-600"
      title="Revision Notes"
      subtitle="Exam-ready notes written like a top teacher's cheat sheet"
    >
      {result ? (
        <AiResultView
          result={result}
          error={error}
          onToggleFavorite={toggleFavorite}
          onGenerateAnother={reset}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabelClass}>Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology"
                className={fieldInputClass}
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Cell Division"
                className={fieldInputClass}
              />
            </div>
          </div>

          <div>
            <label className={fieldLabelClass}>Length</label>
            <select value={length} onChange={(e) => setLength(e.target.value)} className={fieldInputClass}>
              {NOTES_LENGTH_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
            <Checkbox checked={includeImportantPoints} onChange={setIncludeImportantPoints} label="Add important points" />
            <Checkbox checked={includeExamTips} onChange={setIncludeExamTips} label="Add exam tips" />
            <Checkbox checked={includeCommonMistakes} onChange={setIncludeCommonMistakes} label="Add common mistakes" />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <GenerateButton loading={loading} label="Generate Notes" />
        </form>
      )}
    </ToolModalShell>
  );
}
