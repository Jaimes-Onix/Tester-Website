/**
 * Tester.io — contact-form backend.
 *
 * Responsibilities
 *   1. POST /api/contact  → validate { name, email, message } and append a row
 *                           to a Google Sheet via the Google Sheets API.
 *   2. Serve the built front-end (dist/) and the standalone public/ pages in
 *      production, so the whole site runs from one origin + one port.
 *
 * Secrets live in .env.local (gitignored). Nothing sensitive is hard-coded here.
 * See docs/google-sheets-setup.md for how to obtain the credentials.
 *
 * Run:  npm run server        (or  node server.js)
 */

import express from "express";
import cors from "cors";
import { google } from "googleapis";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { buildBriefing } from "./scripts/briefing-core.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ *
 * Tiny .env.local loader (no extra dependency).
 * Parses KEY=VALUE lines; keeps literal \n inside quoted values so the
 * Google private key survives as a single line.
 * ------------------------------------------------------------------ */
function loadEnv(file) {
  const full = path.join(__dirname, file);
  if (!fs.existsSync(full)) return;
  for (const raw of fs.readFileSync(full, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv(".env.local");

const PORT = process.env.PORT || 5000;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
// The private key is stored on one line with literal "\n"; turn those back into real newlines.
const SA_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:D";

const sheetsConfigured = Boolean(SHEET_ID && SA_EMAIL && SA_KEY);

/* ------------------------------------------------------------------ *
 * Resend (confirmation emails). Lazy client, only built when a key exists.
 * ------------------------------------------------------------------ */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Tester.io <onboarding@resend.dev>";
const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO || undefined;
const resendConfigured = Boolean(RESEND_API_KEY);
const resend = resendConfigured ? new Resend(RESEND_API_KEY) : null;

/* ------------------------------------------------------------------ *
 * Supabase admin client (service_role) — backend only. Used to LOG email
 * interactions into email_events so everything stays organized (Step 8).
 * ------------------------------------------------------------------ */
// Accept SUPABASE_URL (preferred for a standalone backend) and fall back to the
// VITE_-prefixed name for backward compatibility with the old single-folder setup.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

/* ------------------------------------------------------------------ *
 * Admin dashboard auth. The password lives ONLY in .env.local (no VITE_
 * prefix), so it never reaches the browser. The dashboard sends it on each
 * /api/admin/* request; we compare server-side with a timing-safe check.
 * ------------------------------------------------------------------ */
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "";
const dashboardConfigured = Boolean(DASHBOARD_PASSWORD);

function passwordMatches(supplied) {
  if (!dashboardConfigured || !supplied) return false;
  const a = Buffer.from(String(supplied));
  const b = Buffer.from(DASHBOARD_PASSWORD);
  // timingSafeEqual requires equal-length buffers, so length-check first.
  return a.length === b.length && timingSafeEqual(a, b);
}

// Express middleware: blocks /api/admin/* unless the correct password is sent
// in the `x-dashboard-password` header (the dashboard stores it in sessionStorage
// after a successful login and attaches it to every request).
function requireAdmin(req, res, next) {
  if (!dashboardConfigured) {
    return res.status(503).json({ ok: false, error: "Dashboard password not configured on the server." });
  }
  if (!passwordMatches(req.get("x-dashboard-password"))) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
  next();
}

async function logEmailEvent({ email, kind, subject, resendId }) {
  if (!supabaseAdmin) return;
  const { error } = await supabaseAdmin
    .from("email_events")
    .insert({ email, kind, subject, resend_id: resendId });
  if (error) console.warn("[email_events] log failed:", error.message);
}

/* ------------------------------------------------------------------ *
 * Google Sheets client (lazy — only built when credentials exist).
 * ------------------------------------------------------------------ */
let sheetsClient = null;
async function getSheets() {
  if (sheetsClient) return sheetsClient;
  const auth = new google.auth.JWT({
    email: SA_EMAIL,
    key: SA_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  await auth.authorize();
  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

async function appendRow({ name, email, message }) {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[new Date().toISOString(), name, email, message]],
    },
  });
}

/* ------------------------------------------------------------------ *
 * App
 * ------------------------------------------------------------------ */
const app = express();
// The frontend now lives on a SEPARATE origin, so CORS must allow it. By default
// we reflect any origin (the sensitive routes are still gated by the dashboard
// password + Supabase service_role). Set CORS_ORIGIN to the frontend URL to lock
// it down to a single origin in production.
const CORS_ORIGIN = process.env.CORS_ORIGIN;
app.use(cors(CORS_ORIGIN ? { origin: CORS_ORIGIN } : {}));
app.use(express.json({ limit: "16kb" }));

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

app.post("/api/contact", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim();
  const message = String(req.body?.message || "").trim();

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: "Please fill in your name, email, and message." });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ ok: false, error: "That email address doesn't look right." });
  }
  if (name.length > 120 || email.length > 200 || message.length > 4000) {
    return res.status(400).json({ ok: false, error: "One of your fields is too long." });
  }

  try {
    if (sheetsConfigured) {
      await appendRow({ name, email, message });
    } else {
      // No credentials yet — log so the redirect flow is fully testable before
      // Google Cloud is wired up. See docs/google-sheets-setup.md.
      console.warn(
        "[contact] Google Sheets not configured — logging submission only:\n",
        { name, email, message }
      );
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("[contact] failed to save submission:", err?.message || err);
    return res.status(500).json({ ok: false, error: "We couldn't save your message. Please try again." });
  }
});

/* ------------------------------------------------------------------ *
 * Confirmation email (Step 4). Sent after a successful submission.
 * The body deliberately invites a reply (so we can track engagement later).
 * ------------------------------------------------------------------ */
function welcomeEmailHtml(firstName) {
  return `
  <div style="margin:0;padding:0;background:#0A0A0A;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#ECEAE6;">
      <div style="font-size:18px;font-weight:800;letter-spacing:-.01em;margin-bottom:28px;">
        Tester<span style="color:#E6B979;">.io</span>
      </div>
      <div style="background:linear-gradient(180deg,#141414,#0B0B0B);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:36px 30px;">
        <div style="display:inline-block;font-size:12px;font-weight:700;color:#1A1308;background:linear-gradient(140deg,#F2DDA8,#C6A559);padding:6px 14px;border-radius:99px;">
          ✓ You're on the list
        </div>
        <h1 style="margin:22px 0 0;font-size:26px;line-height:1.15;font-weight:800;letter-spacing:-.02em;color:#F7E8C2;">
          Welcome, ${firstName} 👋
        </h1>
        <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#cfcdc8;">
          Thanks for reaching out to Tester.io — we've saved your details and you're
          in line for early access to the Tester Smart Watch Pro.
        </p>
        <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#cfcdc8;">
          <strong style="color:#F2DDA8;">One quick favor:</strong> just hit
          <em>reply</em> to this email and tell us the one thing you're most curious
          about. A real human reads every reply — and it helps us build the right thing.
        </p>
        <p style="margin:26px 0 0;font-size:14px;line-height:1.7;color:#8d8d92;">
          Talk soon,<br/>The Tester.io team
        </p>
      </div>
      <p style="margin:20px 0 0;font-size:12px;color:#6f6f74;text-align:center;">
        You're receiving this because you submitted the contact form at Tester.io.
      </p>
    </div>
  </div>`;
}

async function sendWelcomeEmail({ name, email }) {
  const firstName = (name.split(/\s+/)[0] || "there").slice(0, 40);
  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: [email],
    subject: "You're on the list — welcome to Tester.io",
    html: welcomeEmailHtml(firstName),
    ...(RESEND_REPLY_TO ? { replyTo: RESEND_REPLY_TO } : {}),
  });
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data;
}

app.post("/api/send-welcome", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim();

  if (!name || !isEmail(email)) {
    return res.status(400).json({ ok: false, error: "A valid name and email are required." });
  }
  if (!resendConfigured) {
    console.warn("[welcome] Resend not configured — skipping email for", email);
    return res.json({ ok: true, skipped: true });
  }
  try {
    const data = await sendWelcomeEmail({ name, email });
    console.log("[welcome] sent to", email, "→ id:", data?.id);
    await logEmailEvent({
      email,
      kind: "welcome",
      subject: "You're on the list — welcome to Tester.io",
      resendId: data?.id,
    });
    return res.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("[welcome] failed:", err?.message || err);
    return res.status(502).json({ ok: false, error: err?.message || "Email failed to send." });
  }
});

// Simple health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, sheets: sheetsConfigured, resend: resendConfigured, dashboard: dashboardConfigured });
});

/* ------------------------------------------------------------------ *
 * Vercel Cron — daily morning briefing (Step 7).
 * vercel.json schedules a daily GET to this path. When CRON_SECRET is set,
 * Vercel attaches it as `Authorization: Bearer <CRON_SECRET>`, so we reject
 * any request that doesn't carry the matching secret. Builds the briefing
 * from the last 24h of real Supabase leads and emails it via Resend.
 * ------------------------------------------------------------------ */
const CRON_SECRET = process.env.CRON_SECRET || "";
const BRIEFING_TO = process.env.RESEND_TO;

app.get("/api/cron/briefing", async (req, res) => {
  // Auth: if a secret is configured, require it (Vercel sends it automatically).
  if (CRON_SECRET) {
    const auth = req.get("authorization") || "";
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ ok: false, error: "Unauthorized." });
    }
  }
  if (!resendConfigured) return res.status(503).json({ ok: false, error: "Resend not configured." });
  if (!BRIEFING_TO) return res.status(503).json({ ok: false, error: "RESEND_TO not set." });

  try {
    const { briefing, html, subject, leads } = await buildBriefing("real", 24);
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to: [BRIEFING_TO],
      subject,
      html,
      text: briefing,
      ...(RESEND_REPLY_TO ? { replyTo: RESEND_REPLY_TO } : {}),
    });
    if (error) throw new Error(error.message || JSON.stringify(error));
    await logEmailEvent({ email: BRIEFING_TO, kind: "briefing", subject, resendId: data?.id });
    console.log(`[cron/briefing] sent to ${BRIEFING_TO} — ${leads.length} leads, id ${data?.id}`);
    return res.json({ ok: true, id: data?.id, leads: leads.length });
  } catch (err) {
    console.error("[cron/briefing] failed:", err?.message || err);
    return res.status(500).json({ ok: false, error: err?.message || "Briefing failed." });
  }
});

/* ================================================================== *
 * ADMIN DASHBOARD API  (all routes below require the password header)
 *
 * Data is read with the service_role client (supabaseAdmin), so the
 * browser never needs the anon key and we never open a public read
 * policy. Newsletter drafts live in the `newsletters` table (service_role
 * only — no public RLS policy), so they persist on serverless hosts where
 * the local filesystem is ephemeral.
 * ================================================================== */

// POST /api/admin/login — verify the password, nothing more. The dashboard
// keeps the password client-side and re-sends it on every request.
app.post("/api/admin/login", (req, res) => {
  if (!dashboardConfigured) {
    return res.status(503).json({ ok: false, error: "Dashboard password not configured on the server." });
  }
  if (!passwordMatches(req.body?.password)) {
    return res.status(401).json({ ok: false, error: "Incorrect password." });
  }
  res.json({ ok: true });
});

// Everything past this point needs the header.
app.use("/api/admin", requireAdmin);

function ensureSupabase(res) {
  if (!supabaseAdmin) {
    res.status(503).json({ ok: false, error: "Supabase is not configured on the server." });
    return false;
  }
  return true;
}

// GET /api/admin/overview — headline stats for the Overview tab.
app.get("/api/admin/overview", async (_req, res) => {
  if (!ensureSupabase(res)) return;
  try {
    const head = { count: "exact", head: true };
    const [fills, subs, emails, unsubs] = await Promise.all([
      supabaseAdmin.from("contact_messages").select("*", head),
      supabaseAdmin.from("contact_messages").select("*", head).eq("newsletter_subscribed", true),
      supabaseAdmin.from("email_events").select("*", head),
      supabaseAdmin.from("contact_messages").select("*", head).eq("newsletter_subscribed", false),
    ]);
    res.json({
      ok: true,
      stats: {
        formFills: fills.count ?? 0,
        subscribers: subs.count ?? 0,
        emailsSent: emails.count ?? 0,
        unsubscribed: unsubs.count ?? 0,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || "Failed to load overview." });
  }
});

// GET /api/admin/submissions — everyone who filled the contact form.
app.get("/api/admin/submissions", async (_req, res) => {
  if (!ensureSupabase(res)) return;
  const { data, error } = await supabaseAdmin
    .from("contact_messages")
    .select("id, name, email, message, newsletter_subscribed, replied, created_at")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, rows: data });
});

// GET /api/admin/subscribers — newsletter opt-ins only.
app.get("/api/admin/subscribers", async (_req, res) => {
  if (!ensureSupabase(res)) return;
  const { data, error } = await supabaseAdmin
    .from("contact_messages")
    .select("id, name, email, subscribed_at, created_at")
    .eq("newsletter_subscribed", true)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, rows: data });
});

// POST /api/admin/unsubscribe { id } — flip a subscriber off the list.
app.post("/api/admin/unsubscribe", async (req, res) => {
  if (!ensureSupabase(res)) return;
  const id = String(req.body?.id || "");
  if (!id) return res.status(400).json({ ok: false, error: "id is required." });
  const { error } = await supabaseAdmin
    .from("contact_messages")
    .update({ newsletter_subscribed: false })
    .eq("id", id);
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true });
});

// GET /api/admin/email-events — the email log.
app.get("/api/admin/email-events", async (_req, res) => {
  if (!ensureSupabase(res)) return;
  const { data, error } = await supabaseAdmin
    .from("email_events")
    .select("id, email, kind, subject, resend_id, created_at")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, rows: data });
});

// --- Newsletter draft CRUD (Supabase `newsletters` table, service_role) ---
app.get("/api/admin/newsletters", async (_req, res) => {
  if (!ensureSupabase(res)) return;
  const { data, error } = await supabaseAdmin
    .from("newsletters")
    .select("id, subject, body_html, status, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, rows: data });
});

app.post("/api/admin/newsletters", async (req, res) => {
  if (!ensureSupabase(res)) return;
  const subject = String(req.body?.subject || "").slice(0, 200);
  const body_html = String(req.body?.body_html || "").slice(0, 50000);
  const { data, error } = await supabaseAdmin
    .from("newsletters")
    .insert({ subject, body_html, status: "draft" })
    .select("id, subject, body_html, status, created_at, updated_at")
    .single();
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, row: data });
});

app.put("/api/admin/newsletters/:id", async (req, res) => {
  if (!ensureSupabase(res)) return;
  const patch = { updated_at: new Date().toISOString() };
  if (req.body?.subject !== undefined) patch.subject = String(req.body.subject).slice(0, 200);
  if (req.body?.body_html !== undefined) patch.body_html = String(req.body.body_html).slice(0, 50000);
  const { data, error } = await supabaseAdmin
    .from("newsletters")
    .update(patch)
    .eq("id", req.params.id)
    .select("id, subject, body_html, status, created_at, updated_at")
    .maybeSingle();
  if (error) return res.status(500).json({ ok: false, error: error.message });
  if (!data) return res.status(404).json({ ok: false, error: "Newsletter not found." });
  res.json({ ok: true, row: data });
});

app.delete("/api/admin/newsletters/:id", async (req, res) => {
  if (!ensureSupabase(res)) return;
  const { data, error } = await supabaseAdmin
    .from("newsletters")
    .delete()
    .eq("id", req.params.id)
    .select("id")
    .maybeSingle();
  if (error) return res.status(500).json({ ok: false, error: error.message });
  if (!data) return res.status(404).json({ ok: false, error: "Newsletter not found." });
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ *
 * Static hosting (production). In dev, Vite (:3000) serves the front-end
 * and proxies /api here — see vite.config.ts.
 * ------------------------------------------------------------------ */
const distDir = path.join(__dirname, "dist");
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(distDir)) app.use(express.static(distDir));
app.use(express.static(publicDir));

// SPA fallback to index.html for any non-API, non-file route.
app.get(/^\/(?!api\/).*/, (_req, res, next) => {
  const indexFile = path.join(distDir, "index.html");
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  next();
});

// On Vercel (and other serverless hosts) the platform sets VERCEL=1 and invokes
// the exported app per-request — there is no port to bind. Locally (`npm start`)
// VERCEL is unset, so we start a long-running listener as before.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n  Tester.io API listening on http://localhost:${PORT}`);
    console.log(
      sheetsConfigured
        ? "  Google Sheets: configured ✓  (submissions will be saved)\n"
        : "  Google Sheets: NOT configured — submissions are logged to the console only.\n  → See docs/google-sheets-setup.md to enable saving.\n"
    );
  });
}

// The Express app is itself a valid (req, res) handler, so serverless entry
// points (api/index.js on Vercel) can import and re-export it directly.
export default app;
