"use client";

import { useState } from "react";
import type { AiToolType } from "@/lib/ai-hub";

export interface AiGenerationResult {
  id: string;
  type: AiToolType;
  title: string;
  subject: string;
  topic: string;
  result: string;
  isFavorite: boolean;
  createdAt: string;
}

export function useAiTool(type: AiToolType, onGenerated?: (item: AiGenerationResult) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiGenerationResult | null>(null);

  const generate = async (params: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/ai-hub/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...params }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }

    setResult(data);
    onGenerated?.(data);
  };

  const toggleFavorite = async () => {
    if (!result) return;
    const next = !result.isFavorite;
    setResult({ ...result, isFavorite: next });
    await fetch(`/api/ai-hub/history/${result.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: next }),
    });
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { loading, error, result, generate, toggleFavorite, reset };
}
