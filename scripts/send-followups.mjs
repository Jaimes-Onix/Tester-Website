/**
 * Step 7 — Automated follow-up emails.
 *
 * Loops through newsletter subscribers and emails the ones who are "due"
 * (their last email was >= N days ago), then logs each send to `email_events`
 * so we never double-send and can space follow-ups out.
 *
 * Run it on a schedule (daily is fine) — it only emails who's actually due.
 *
 *   node scripts/send-followups.mjs                 # real run, 5-day cadence
 *   node scripts/send-followups.mjs --dry-run       # preview, send nothing
 *   node scripts/send-followups.mjs --days=0        # treat everyone as due (testing)
 *   node scripts/send-followups.mjs --only=a@b.com  # restrict to one address (testing)
 *
 * Backend only: uses the service_role key (reads/updates any row, reads email_events)
 * and the Resend API key. Secrets come from .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function loadEnv(file) {
  const full = path.join(__dirname, "..", file);
  if (!fs.existsSync(full)) return;
  for (const raw of fs.readFileSync(full, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv(".env.local");

// ── CLI flags ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const daysArg = args.find((a) => a.startsWith("--days="));
const onlyArg = args.find((a) => a.startsWith("--only="));
const FOLLOWUP_DAYS = daysArg ? Number(daysArg.split("=")[1]) : 5;
const ONLY = onlyArg ? onlyArg.split("=")[1].toLowerCase() : null;
const MAX_FOLLOWUPS = 3; // stop after 3 — don't pester forever

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Tester.io <onboarding@resend.dev>";
const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO || undefined;

if (!SUPABASE_URL || !SERVICE_KEY || !RESEND_API_KEY) {
  console.error("Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const resend = new Resend(RESEND_API_KEY);

// ── Follow-up content: 3 themed emails (value → testimonial → update) ───────
function followup(step, firstName) {
  const wrap = (badge, heading, bodyHtml) => `
  <div style="margin:0;padding:0;background:#0A0A0A;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#ECEAE6;">
      <div style="font-size:18px;font-weight:800;margin-bottom:24px;">Tester<span style="color:#E6B979;">.io</span></div>
      <div style="background:linear-gradient(180deg,#141414,#0B0B0B);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:34px 28px;">
        <div style="display:inline-block;font-size:12px;font-weight:700;color:#1A1308;background:linear-gradient(140deg,#F2DDA8,#C6A559);padding:6px 14px;border-radius:99px;">${badge}</div>
        <h1 style="margin:20px 0 0;font-size:23px;line-height:1.2;font-weight:800;color:#F7E8C2;">${heading}</h1>
        ${bodyHtml}
        <p style="margin:24px 0 0;font-size:14px;color:#8d8d92;">— The Tester.io team</p>
      </div>
      <p style="margin:18px 0 0;font-size:12px;color:#6f6f74;text-align:center;">You're getting this because you subscribed to Tester.io updates. Reply "stop" to unsubscribe.</p>
    </div>
  </div>`;
  const p = (t) => `<p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#cfcdc8;">${t}</p>`;

  if (step <= 1) {
    return {
      subject: "Why builders are watching Tester.io",
      html: wrap("Why Tester.io", `${firstName}, here's what we're building`,
        p("The <strong style='color:#F2DDA8'>Tester Pro Terminal</strong> gives you real-time token signals, one-click testing, and a workflow that used to take a dozen tabs — in one place.") +
        p("Early-access members get it first, at a founding price. We'd love your eyes on it.")),
      text: `${firstName}, here's what we're building at Tester.io — the Tester Pro Terminal: real-time token signals, one-click testing, all in one place. Early access members get it first.`,
    };
  }
  if (step === 2) {
    return {
      subject: "“It paid for itself in a week” — a Tester.io story",
      html: wrap("From the community", "What early testers are saying",
        `<blockquote style="margin:16px 0 0;padding:14px 18px;border-left:3px solid #E6B979;background:rgba(230,185,121,.06);border-radius:8px;font-size:15px;line-height:1.7;color:#e8e6e1;font-style:italic;">“I caught two moves I'd have completely missed. It paid for itself in a week.”<br/><span style="font-style:normal;color:#8d8d92;font-size:13px;">— an early Tester.io member</span></blockquote>` +
        p("Want in? Just reply and we'll get you set up.")),
      text: `"I caught two moves I'd have completely missed. It paid for itself in a week." — an early Tester.io member. Reply and we'll get you set up.`,
    };
  }
  return {
    subject: "Your early-access spot at Tester.io",
    html: wrap("Update", `${firstName}, your spot is ready`,
      p("We've been shipping fast — faster signals, a cleaner terminal, and onboarding that takes minutes.") +
      p("Your early-access spot is still open. Reply to this email and we'll send your invite. 🚀")),
    text: `${firstName}, your early-access spot at Tester.io is still open. Reply and we'll send your invite.`,
  };
}

// ── Gather subscribers + their email history ────────────────────────────────
let subQuery = supabase
  .from("contact_messages")
  .select("name, email, created_at")
  .eq("newsletter_subscribed", true);
if (ONLY) subQuery = subQuery.eq("email", ONLY);
const { data: subs, error: subErr } = await subQuery;
if (subErr) { console.error("Failed to load subscribers:", subErr.message); process.exit(1); }

// One row per unique email (keep the earliest signup + a display name).
const byEmail = new Map();
for (const s of subs || []) {
  const key = s.email.toLowerCase();
  const cur = byEmail.get(key);
  if (!cur || new Date(s.created_at) < new Date(cur.created_at)) byEmail.set(key, s);
}

const { data: events } = await supabase
  .from("email_events")
  .select("email, kind, created_at")
  .order("created_at", { ascending: false });
const lastEmailAt = new Map();
const followupCount = new Map();
for (const e of events || []) {
  const key = e.email.toLowerCase();
  if (!lastEmailAt.has(key)) lastEmailAt.set(key, e.created_at);
  if (e.kind === "followup") followupCount.set(key, (followupCount.get(key) || 0) + 1);
}

// ── Decide + send ───────────────────────────────────────────────────────────
const now = Date.now();
const DAY = 86_400_000;
let sent = 0, skipped = 0, done = 0;
console.log(`Follow-up run — cadence=${FOLLOWUP_DAYS}d, dryRun=${dryRun}${ONLY ? `, only=${ONLY}` : ""}`);
console.log(`Subscribers: ${byEmail.size}\n`);

for (const [key, sub] of byEmail) {
  const count = followupCount.get(key) || 0;
  if (count >= MAX_FOLLOWUPS) { console.log(`· ${key} — done (${count} follow-ups already)`); done++; continue; }

  const baseline = lastEmailAt.get(key) || sub.created_at; // last email, else signup time
  const daysSince = (now - new Date(baseline).getTime()) / DAY;
  if (daysSince < FOLLOWUP_DAYS) { console.log(`· ${key} — not due (${daysSince.toFixed(1)}d since last)`); skipped++; continue; }

  const firstName = (sub.name?.split(/\s+/)[0] || "there").slice(0, 40);
  const msg = followup(count + 1, firstName);

  if (dryRun) { console.log(`→ WOULD send follow-up #${count + 1} to ${key} — "${msg.subject}"`); sent++; continue; }

  try {
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to: [sub.email],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      ...(RESEND_REPLY_TO ? { replyTo: RESEND_REPLY_TO } : {}),
    });
    if (error) throw new Error(error.message || JSON.stringify(error));
    await supabase.from("email_events").insert({
      email: sub.email, kind: "followup", subject: msg.subject, resend_id: data?.id,
    });
    console.log(`✓ sent follow-up #${count + 1} to ${key} (id ${data?.id})`);
    sent++;
  } catch (err) {
    console.warn(`✗ ${key} — ${err.message}`);
    skipped++;
  }
}

console.log(`\nDone. sent=${sent} skipped=${skipped} alreadyDone=${done}`);
