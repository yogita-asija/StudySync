"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { DIFFICULTY_OPTIONS, QUIZ_CATEGORY_OPTIONS } from "@/lib/ai-hub";
import { useAiTool, type AiGenerationResult } from "./use-ai-tool";
import { AiResultView, fieldInputClass, fieldLabelClass, GenerateButton, ToolModalShell } from "./tool-modal-shell";

export function QuizModal({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: (item: AiGenerationResult) => void;
}) {
  const { loading, error, result, generate, toggleFavorite, reset } = useAiTool("quiz", onGenerated);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [category, setCategory] = useState("objective");

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) return;
    generate({ subject: subject.trim(), topic: topic.trim(), numQuestions, difficulty, category });
  };

  return (
    <ToolModalShell
      open={open}
      onClose={handleClose}
      icon={ListChecks}
      iconGradient="from-violet-500 to-purple-600"
      title="Quiz Generator"
      subtitle="Generate an exam-quality quiz on any topic"
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
                placeholder="e.g. Chemistry"
                className={fieldInputClass}
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Periodic Table"
                className={fieldInputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabelClass}>Number of questions</label>
              <input
                type="number"
                min={1}
                max={20}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className={fieldInputClass}
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={fieldInputClass}>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={fieldLabelClass}>Question category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldInputClass}>
              {QUIZ_CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <GenerateButton loading={loading} label="Generate Quiz" />
        </form>
      )}
    </ToolModalShell>
  );
}
