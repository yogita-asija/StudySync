"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { useAiTool, type AiGenerationResult } from "./use-ai-tool";
import { AiResultView, fieldInputClass, fieldLabelClass, GenerateButton, ToolModalShell } from "./tool-modal-shell";

export function ExplainModal({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: (item: AiGenerationResult) => void;
}) {
  const { loading, error, result, generate, toggleFavorite, reset } = useAiTool("explain", onGenerated);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) return;
    generate({ subject: subject.trim(), topic: topic.trim() });
  };

  return (
    <ToolModalShell
      open={open}
      onClose={handleClose}
      icon={Lightbulb}
      iconGradient="from-amber-400 to-orange-500"
      title="Explain Any Topic"
      subtitle="Get a senior-teacher-level breakdown of any concept"
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
          <div>
            <label className={fieldLabelClass}>Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics"
              className={fieldInputClass}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Newton's Third Law"
              className={fieldInputClass}
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <GenerateButton loading={loading} label="Explain This Topic" />
        </form>
      )}
    </ToolModalShell>
  );
}
