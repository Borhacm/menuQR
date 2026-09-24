/**
 * Minimal Google Gemini client (REST, no SDK). The Gemini API has a free tier that needs no credit
 * card (key from Google AI Studio), which is why it is the preferred provider when configured.
 * Free-tier prompts may be used by Google to improve its products: only menu content is sent.
 */
type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function geminiGenerate({
  model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite",
  system,
  parts,
  json = false,
  temperature = 0.2,
}: {
  model?: string;
  system?: string;
  parts: GeminiPart[];
  json?: boolean;
  temperature?: number;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  const base = process.env.GEMINI_API_BASE?.trim() || "https://generativelanguage.googleapis.com";
  const res = await fetch(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents: [{ role: "user", parts }],
      generationConfig: { temperature, ...(json ? { responseMimeType: "application/json" } : {}) },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    throw new Error(`Gemini ${model} failed with status ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error(`Gemini ${model} returned no text`);
  return text;
}
