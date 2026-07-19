// Minimal client for Google's Gemini REST API — used by the in-group AI
// Study Assistant. No SDK dependency, just a plain fetch call.

const GEMINI_MODEL = "gemini-3.5-flash";

export class GeminiError extends Error {}

export async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiError(
      "AI Study Assistant is not configured. Set GEMINI_API_KEY in your environment."
    );
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GeminiError(`Gemini API error (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new GeminiError("Gemini returned an empty response.");
  }

  return text as string;
}
