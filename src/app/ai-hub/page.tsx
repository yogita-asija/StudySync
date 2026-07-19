"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  Lightbulb,
  ListChecks,
  MessagesSquare,
  Sparkles,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { ExplainModal } from "@/components/ai-hub/explain-modal";
import { QuizModal } from "@/components/ai-hub/quiz-modal";
import { NotesModal } from "@/components/ai-hub/notes-modal";
import { InterviewModal } from "@/components/ai-hub/interview-modal";
import { HistorySection } from "@/components/ai-hub/history-section";

type ToolKey = "explain" | "quiz" | "notes" | "interview" | null;

interface Stats {
  totalRequests: number;
  notesGenerated: number;
  quizGenerated: number;
  interviewGenerated: number;
}

const QUICK_CARDS: {
  key: Exclude<ToolKey, null>;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
}[] = [
  {
    key: "explain",
    title: "Explain Any Topic",
    description: "Get a clear, teacher-style breakdown with examples & analogies",
    icon: Lightbulb,
    gradient: "from-amber-400 to-orange-500",
  },
  {
    key: "quiz",
    title: "Quiz Generator",
    description: "Custom quizzes with difficulty, count & question type",
    icon: ListChecks,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    key: "interview",
    title: "Interview Questions",
    description: "Practice questions tailored to a role or company",
    icon: Briefcase,
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    key: "notes",
    title: "Revision Notes",
    description: "Exam-ready notes with tips & common mistakes",
    icon: StickyNote,
    gradient: "from-emerald-500 to-teal-600",
  },
];

export default function AiStudyHubPage() {
  const [openTool, setOpenTool] = useState<ToolKey>(null);
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    notesGenerated: 0,
    quizGenerated: 0,
    interviewGenerated: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/ai-hub/history");
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  const handleGenerated = () => {
    setRefreshKey((k) => k + 1);
  };

  const STAT_CARDS = [
    { label: "AI Requests", value: stats.totalRequests, icon: Sparkles, gradient: "from-blue-500 to-indigo-600" },
    { label: "Notes Generated", value: stats.notesGenerated, icon: StickyNote, gradient: "from-emerald-500 to-teal-600" },
    { label: "Quizzes Generated", value: stats.quizGenerated, icon: ListChecks, gradient: "from-violet-500 to-purple-600" },
    { label: "Interview Qs Generated", value: stats.interviewGenerated, icon: Briefcase, gradient: "from-blue-500 to-cyan-600" },
  ];

  return (
    <div className="mx-auto max-w-6xl p-8">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-14 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Study Hub</h1>
            <p className="mt-1 text-sm text-blue-100">
              Your personal AI teacher — explanations, quizzes, notes & interview prep, on demand.
            </p>
          </div>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_CARDS.map((card) => (
          <button
            key={card.key}
            onClick={() => setOpenTool(card.key)}
            className="group flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-sm transition-transform group-hover:scale-110`}
            >
              <card.icon size={20} />
            </div>
            <p className="mt-3 font-semibold text-gray-900 dark:text-gray-100">{card.title}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.description}</p>
          </button>
        ))}
      </div>

      {/* Usage stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${card.gradient} text-white`}>
              <card.icon size={18} />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* History / Favourites */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-1 flex items-center gap-2">
          <MessagesSquare size={17} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Your Generations</h2>
        </div>
        <HistorySection refreshKey={refreshKey} />
      </div>

      <ExplainModal open={openTool === "explain"} onClose={() => setOpenTool(null)} onGenerated={handleGenerated} />
      <QuizModal open={openTool === "quiz"} onClose={() => setOpenTool(null)} onGenerated={handleGenerated} />
      <NotesModal open={openTool === "notes"} onClose={() => setOpenTool(null)} onGenerated={handleGenerated} />
      <InterviewModal open={openTool === "interview"} onClose={() => setOpenTool(null)} onGenerated={handleGenerated} />
    </div>
  );
}
