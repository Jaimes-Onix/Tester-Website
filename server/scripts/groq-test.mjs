/**
 * One-off connectivity test for the Groq API key.
 * Run:  node scripts/groq-test.mjs
 * Delete it once the morning-briefing script works.
 */
import Groq from "groq-sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Same tiny .env.local loader the other scripts use (no extra dependency).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const raw of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const eq = line.indexOf("=");
  if (eq === -1) continue;
  const key = line.slice(0, eq).trim();
  let val = line.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
  if (!(key in process.env)) process.env[key] = val;
}

if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "gsk_") {
  console.error("✗ GROQ_API_KEY is missing or still the placeholder. Check .env.local.");
  process.exit(1);
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log("Pinging Groq…");
const res = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant", // small + fast, perfect for a connectivity check
  messages: [{ role: "user", content: "Reply with exactly: Groq is connected." }],
});

console.log("✓ Groq replied:", res.choices[0]?.message?.content);
console.log("  model:", res.model, "| tokens used:", res.usage?.total_tokens);
