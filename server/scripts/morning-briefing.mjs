/**
 * Morning Briefing — daily lead digest (CLI).
 *
 *   node scripts/morning-briefing.mjs            # demo leads, PRINT only (safe default)
 *   node scripts/morning-briefing.mjs --send     # also EMAIL it via Resend to RESEND_TO
 *   node scripts/morning-briefing.mjs --real     # use Supabase leads (added later)
 *
 * Shared logic (env, leads, Groq, HTML rendering) lives in briefing-core.mjs.
 */
import { Resend } from "resend";
import { loadEnv, buildBriefing } from "./briefing-core.mjs";

loadEnv(".env.local");

const mode = process.argv.includes("--real") ? "real" : "demo"; // demo is the safe default
const send = process.argv.includes("--send");                    // nothing leaves unless asked
const hoursArg = process.argv.find((a) => a.startsWith("--hours="));
const hours = hoursArg ? Number(hoursArg.split("=")[1]) : 24;     // real-mode lookback window

const { leads, briefing, html, subject } = await buildBriefing(mode, hours);

console.log(`\nMode: ${mode}${mode === "real" ? ` (last ${hours}h)` : ""} | Leads: ${leads.length}\n${"─".repeat(60)}`);
console.log(briefing);
console.log("─".repeat(60));

if (!send) {
  console.log("Printed only. Add --send to email it.\n");
  process.exit(0);
}

/* ── Send via Resend ─────────────────────────────────────────────────────── */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || "Tester.io <onboarding@resend.dev>";
const TO = process.env.RESEND_TO;
const REPLY_TO = process.env.RESEND_REPLY_TO || undefined;

if (!RESEND_API_KEY) { console.error("✗ RESEND_API_KEY missing in .env.local"); process.exit(1); }
if (!TO) { console.error("✗ RESEND_TO missing in .env.local (who should the briefing go to?)"); process.exit(1); }

const resend = new Resend(RESEND_API_KEY);
console.log(`Sending to ${TO} …`);

const { data, error } = await resend.emails.send({
  from: FROM,
  to: [TO],
  subject,
  html,
  text: briefing, // plain-text fallback for clients that don't render HTML
  ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
});

if (error) {
  console.error("✗ Resend error:", error.message || JSON.stringify(error));
  process.exit(1);
}
console.log(`✓ Sent! Resend id: ${data?.id}\n  Check the inbox for ${TO}.\n`);
