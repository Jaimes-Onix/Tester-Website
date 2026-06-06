/**
 * Morning-briefing CORE — shared by the CLI sender and the preview server.
 *
 * Keeps one source of truth for: loading env, getting leads, asking Groq,
 * and rendering the briefing as an email-safe HTML string.
 *
 * Nothing here sends email or starts a server — it just produces data + HTML.
 */
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ── env ─────────────────────────────────────────────────────────────────── */
export function loadEnv(file = ".env.local") {
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

/* ── leads ───────────────────────────────────────────────────────────────── */
export const SAMPLE_LEADS = [
  { name: "Emily Johnson",  email: "emily.johnson@acmecorp.com",   company: "Acme Corp" },
  { name: "Michael Smith",  email: "michael.smith@finflow.com",    company: "FinFlow" },
  { name: "Olivia Brown",   email: "olivia.brown@growthlab.com",   company: "GrowthLab" },
  { name: "James Williams", email: "james.williams@stackr.com",    company: "Stackr" },
  { name: "Sophia Davis",   email: "sophia.davis@clarityhq.com",   company: "Clarity HQ" },
  { name: "Liam Miller",    email: "liam.miller@buildco.com",      company: "BuildCo" },
];

// Pull real signups from Supabase within the last `hours` (default 24h).
// Returns { name, email, message } — the real table has a message, not a company.
export async function getRealLeads(hours = 24) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase not configured (need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local).");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const since = new Date(Date.now() - hours * 3600_000).toISOString();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("name, email, message, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Supabase query failed: " + error.message);

  return (data || []).map((r) => ({
    name: (r.name || "there").trim(),
    email: r.email,
    message: (r.message || "").trim(),
  }));
}

export async function getLeads(mode = "demo", hours = 24) {
  if (mode === "real") return getRealLeads(hours);
  return SAMPLE_LEADS;
}

/* ── Groq ────────────────────────────────────────────────────────────────── */
export async function generateBriefing(leads) {
  // No leads → don't spend Groq tokens; return a clean "nothing today" note.
  if (!leads || leads.length === 0) {
    return "No new leads in the last 24 hours.\nFocus today: re-engage an existing subscriber or revisit yesterday's pipeline.";
  }

  const N = leads.length;
  const top = Math.min(N, 8); // list at most 8 ranked leads to keep it skimmable
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = `You are a sales operations assistant. Below are ${N} new leads
that signed up recently, as JSON. Write a concise MORNING BRIEFING for the founder.

Each lead has a name and email. A lead may ALSO have a "company" (infer
industry/size from it + the email domain) and/or a "message" they wrote (use it
to judge their intent and how warm they are).

Output EXACTLY this plain-text structure, nothing before or after:
Line 1: the headline, exactly "${N} new lead${N === 1 ? "" : "s"} yesterday."
Then the ${top} most promising leads, each on ITS OWN line, numbered, formatted:
"1. Full Name, one-sentence reason + suggested next action."
"2. Full Name, ..."
(continue up to ${top})
Final line: "Focus today: <single best lead's name>"

Rules:
- Start each ranked line with "N. " and the person's name, then a comma.
- No preamble like "Prioritized leads:". No markdown, no bullets, no tables.
- Rank by how warm/promising each lead is; ignore obvious test/spam entries.

Leads JSON:
${JSON.stringify(leads, null, 2)}`;

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.4,
    messages: [
      { role: "system", content: "You write crisp, useful sales briefings. No fluff." },
      { role: "user", content: prompt },
    ],
  });
  return res.choices[0]?.message?.content?.trim() || "(no content returned)";
}

/* ── render: plain-text briefing → email-safe HTML ───────────────────────── */
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Aurora palette — warm-light premium, deep gold for contrast on paper.
// Inlined because email clients strip <style>; one optional <style> block adds
// a mobile fallback (ignored gracefully by clients that don't support it).
const C = {
  page: "#F1EBDF", card: "#FFFDF8", ink: "#241c0f", body: "#6b6357", muted: "#9a9082",
  gold: "#A9742B", line: "rgba(26,19,8,.1)", lineSoft: "rgba(26,19,8,.08)",
  serif: "Georgia,'Times New Roman',serif",
  badge: "linear-gradient(140deg,#E8C98A,#C79A4B)",
};

// Turn the model's plain text into styled blocks: headline, ranked rows, focus callout.
export function parseBriefing(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let headline = "Your morning briefing";
  const items = [];
  let focus = "";
  const paras = [];

  lines.forEach((line, i) => {
    const ranked = line.match(/^(\d+)\.\s+(.*)$/);
    if (i === 0 && !ranked) { headline = line; return; }
    if (/^focus today/i.test(line)) { focus = line.replace(/^focus today[:\s-]*/i, ""); return; }
    if (ranked) {
      const rest = ranked[2];
      const comma = rest.indexOf(",");
      const name = comma === -1 ? rest : rest.slice(0, comma);
      const detail = comma === -1 ? "" : rest.slice(comma + 1).trim();
      items.push({ rank: ranked[1], name, detail });
      return;
    }
    paras.push(line);
  });
  return { headline, items, focus, paras };
}

export function renderBriefingEmail({ briefing, count, dateLabel }) {
  const { headline, items, focus, paras } = parseBriefing(briefing);

  // A single lead "chip": gold rank badge + serif name + detail.
  const chip = (it) => `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
      <td style="vertical-align:top;width:30px;">
        <div style="width:27px;height:27px;border-radius:99px;background:${C.badge};color:#3a2a0c;font-size:12px;font-weight:800;text-align:center;line-height:27px;box-shadow:0 2px 6px rgba(150,110,40,.3);">${esc(it.rank)}</div>
      </td>
      <td style="vertical-align:top;padding-left:12px;">
        <div style="font-family:${C.serif};font-size:16px;font-weight:700;color:${C.ink};letter-spacing:-.01em;">${esc(it.name)}</div>
        ${it.detail ? `<div style="margin-top:4px;font-size:13px;line-height:1.6;color:${C.body};">${esc(it.detail)}</div>` : ""}
      </td>
    </tr></table>`;

  // Right side: leads in a 2-column grid (walk items in pairs).
  let grid = "";
  for (let i = 0; i < items.length; i += 2) {
    const a = items[i], b = items[i + 1];
    grid += `<tr>
      <td class="col" style="width:50%;vertical-align:top;padding:0 18px 22px 0;border-bottom:1px solid ${C.lineSoft};">${chip(a)}</td>
      <td class="col" style="width:50%;vertical-align:top;padding:0 0 22px 18px;border-bottom:1px solid ${C.lineSoft};border-left:1px solid ${C.lineSoft};">${b ? chip(b) : ""}</td>
    </tr><tr><td colspan="2" style="height:18px;line-height:18px;font-size:0;">&nbsp;</td></tr>`;
  }

  const extra = paras.map((p) => `<p style="margin:10px 0 0;font-size:13px;line-height:1.65;color:${C.body};">${esc(p)}</p>`).join("");

  // Optional mobile fallback: stacks rail + columns on narrow screens. Clients
  // that ignore <style> simply keep the (intentional) wide layout.
  const responsive = `<style>
    @media only screen and (max-width:640px){
      .rail,.gridcol{display:block!important;width:100%!important;border-left:0!important;padding:0!important;}
      .rail{border-right:0!important;border-bottom:1px solid ${C.line};padding-bottom:22px!important;margin-bottom:22px!important;}
      .col{display:block!important;width:100%!important;border-left:0!important;padding:14px 0!important;}
    }
  </style>`;

  return `${responsive}
  <div style="margin:0;padding:0;background:${C.page};">
    <div style="max-width:920px;margin:0 auto;padding:38px 28px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:${C.ink};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <div style="font-size:18px;font-weight:800;letter-spacing:-.01em;color:${C.ink};">Tester<span style="color:${C.gold};">.io</span></div>
        <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${C.muted};">${esc(dateLabel)}</div>
      </div>
      <div style="background:${C.card};border:1px solid ${C.lineSoft};border-top:3px solid ${C.gold};border-radius:18px;padding:34px;box-shadow:0 22px 50px -24px rgba(120,90,30,.42);">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
          <td class="rail gridcol" style="width:34%;vertical-align:top;padding-right:34px;border-right:1px solid ${C.line};">
            <div style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${C.gold};border:1px solid rgba(169,116,43,.4);padding:5px 12px;border-radius:99px;">☀ Morning briefing</div>
            <h1 style="font-family:${C.serif};margin:18px 0 0;font-size:32px;line-height:1.1;font-weight:700;letter-spacing:-.02em;color:${C.ink};">${esc(headline)}</h1>
            <p style="margin:12px 0 0;padding-bottom:14px;border-bottom:1px solid ${C.lineSoft};font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${C.muted};">${esc(count)} new lead${count === 1 ? "" : "s"} · ranked by opportunity</p>
            ${focus ? `
            <div style="margin-top:20px;padding:16px 18px;border-left:3px solid ${C.gold};background:rgba(169,116,43,.08);border-radius:0 8px 8px 0;">
              <div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.gold};">Focus today</div>
              <div style="font-family:${C.serif};margin-top:6px;font-size:16px;line-height:1.45;color:${C.ink};">${esc(focus)}</div>
            </div>` : ""}
            <p style="margin:22px 0 0;font-size:11px;line-height:1.6;color:${C.muted};">Generated by Groq · Llama 3.3<br/>Tester.io ops desk</p>
          </td>
          <td class="gridcol" style="vertical-align:top;padding-left:34px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${grid}</table>
            ${extra}
          </td>
        </tr></table>
      </div>
      <p style="margin:16px 0 0;font-size:11px;color:#a79c8b;text-align:center;">Daily lead briefing — sent to the Tester.io founder inbox.</p>
    </div>
  </div>`;
}

/* ── one call to produce everything ──────────────────────────────────────── */
export async function buildBriefing(mode = "demo", hours = 24) {
  const leads = await getLeads(mode, hours);
  const briefing = await generateBriefing(leads);
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const subject = `☀ Morning briefing — ${leads.length} new lead${leads.length === 1 ? "" : "s"}`;
  const html = renderBriefingEmail({ briefing, count: leads.length, dateLabel });
  return { leads, briefing, html, subject, dateLabel };
}
