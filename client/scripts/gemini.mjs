// scripts/gemini.mjs
// Direct server-side client for Google's Gemini image API ("Nano Banana").
// SECURITY: Node only. GEMINI_API_KEY must NEVER be imported into client code
// (src/**, public/**) or exposed via a VITE_ env var — that would ship it to the browser.

import { readFileSync, existsSync } from "node:fs";
import { Buffer } from "node:buffer";

/** Read GEMINI_API_KEY from the process env, or fall back to parsing .env.local (gitignored). */
function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const envPath = new URL("../.env.local", import.meta.url);
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, "");
    }
  }
  throw new Error("GEMINI_API_KEY not found in environment or .env.local");
}

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Generate an image directly via Gemini ("Nano Banana"). Synchronous — returns the PNG bytes.
 * @param {string} prompt
 * @param {object} [opts]
 *   model: "gemini-2.5-flash-image" (Nano Banana) | "gemini-3.1-flash-image" (Nano Banana 2) | "gemini-3-pro-image" (Pro)
 *   aspectRatio: optional, e.g. "1:1" | "16:9" | "4:3" (only sent if provided)
 * @returns {Promise<{ buffer: Buffer, mimeType: string }>}
 */
export async function generateImage(prompt, { model = "gemini-2.5-flash-image", aspectRatio } = {}) {
  const API_KEY = loadKey(); // lazy: only read the key when a Gemini job actually runs
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      // Aspect ratio is supported on the newer image models; only send it when asked.
      ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}),
    },
  };

  const res = await fetch(`${BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${json.error?.message || JSON.stringify(json)}`);

  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) {
    const text = parts.map((p) => p.text).filter(Boolean).join(" ");
    throw new Error(`No image returned${text ? `: ${text}` : ""}`);
  }
  return { buffer: Buffer.from(img.inlineData.data, "base64"), mimeType: img.inlineData.mimeType || "image/png" };
}
