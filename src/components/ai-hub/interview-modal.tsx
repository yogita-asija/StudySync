"use client";

import { useState } from "react";
import { Briefcase } from "lucide-react";
import { INTERVIEW_LEVEL_OPTIONS } from "@/lib/ai-hub";
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

export function InterviewModal({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: (item: AiGenerationResult) => void;
}) {
  const { loading, error, result, generate, toggleFavorite, reset } = useAiTool("interview", onGenerated);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [targetCompany, setTargetCompany] = useState("");
  const [includeSuggestions, setIncludeSuggestions] = useState(true);
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
      difficulty,
      targetCompany: targetCompany.trim(),
      includeSuggestions,
      includeCommonMistakes,
    });
  };

  return (
    <ToolModalShell
      open={open}
      onClose={handleClose}
      icon={Briefcase}
      iconGradient="from-blue-500 to-cyan-600"
      title="Interview Questions"
      subtitle="Practice with questions crafted by a senior interviewer"
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
                placeholder="e.g. Computer Science"
                className={fieldInputClass}
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Data Structures"
                className={fieldInputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabelClass}>Difficulty level</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={fieldInputClass}>
                {INTERVIEW_LEVEL_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabelClass}>Target company (optional)</label>
              <input
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google"
                className={fieldInputClass}
              />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
            <Checkbox checked={includeSuggestions} onChange={setIncludeSuggestions} label="Add suggestions on how to answer" />
            <Checkbox checked={includeCommonMistakes} onChange={setIncludeCommonMistakes} label="Add common mistakes to avoid" />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <GenerateButton loading={loading} label="Generate Questions" />
        </form>
      )}
    </ToolModalShell>
  );
}
