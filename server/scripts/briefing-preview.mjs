/**
 * Morning-briefing PREVIEW server.
 *
 *   node scripts/briefing-preview.mjs           # then open http://localhost:4500
 *
 * Renders the exact email HTML in your browser so you can check layout/design
 * BEFORE sending anything real. The Groq result is cached so refreshing the
 * page is instant (and free) — click "Regenerate" to make a fresh briefing.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, buildBriefing } from "./briefing-core.mjs";

loadEnv(".env.local");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Brand logo (gold check) used as the browser-tab favicon for the preview page.
const LOGO_PATH = path.join(__dirname, "..", "..", "client", "public", "tester-logo.png");

const PORT = process.env.PREVIEW_PORT || 4500;
const FROM = process.env.RESEND_FROM || "Tester.io <onboarding@resend.dev>";
const TO = process.env.RESEND_TO || "(set RESEND_TO in .env.local)";

let cache = null; // { html, subject, dateLabel } — built on first load, reused after

// The outer page = a mock email-client shell wrapping the real email HTML.
function previewPage({ html, subject, dateLabel }) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Briefing preview — ${esc(subject)}</title>
  <link rel="icon" type="image/png" href="/favicon.png" />
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin:0; background:#070707; color:#ECEAE6;
           font-family:'Segoe UI',Helvetica,Arial,sans-serif; }
    .bar { display:flex; align-items:center; justify-content:space-between; gap:16px;
           padding:14px 20px; background:#0e0e0e; border-bottom:1px solid rgba(255,255,255,.08);
           position:sticky; top:0; }
    .bar .tag { font-size:12px; font-weight:700; color:#1A1308;
                background:linear-gradient(140deg,#F2DDA8,#E6B979); padding:5px 12px; border-radius:99px; }
    .meta { max-width:600px; margin:22px auto 0; padding:0 24px; font-size:13px; color:#9a9a9f; }
    .meta div { padding:5px 0; border-bottom:1px solid rgba(255,255,255,.06); }
    .meta b { color:#ECEAE6; font-weight:600; }
    .regen { font-size:13px; font-weight:600; color:#1A1308; text-decoration:none;
             background:linear-gradient(140deg,#F2DDA8,#E6B979); padding:8px 14px; border-radius:10px;
             transition: transform .15s ease, box-shadow .15s ease; }
    .regen:hover { transform: translateY(-1px); box-shadow:0 6px 18px rgba(230,185,121,.25); }
    .regen:active { transform: translateY(0); }
    .stage { padding: 8px 0 48px; }
  </style>
</head>
<body>
  <div class="bar">
    <span class="tag">PREVIEW — not sent</span>
    <a class="regen" href="/?refresh=1">↻ Regenerate</a>
  </div>
  <div class="meta">
    <div><b>From:</b> ${esc(FROM)}</div>
    <div><b>To:</b> ${esc(TO)}</div>
    <div><b>Subject:</b> ${esc(subject)}</div>
    <div><b>Date:</b> ${esc(dateLabel)}</div>
  </div>
  <div class="stage">${html}</div>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // Serve the brand logo as the favicon.
    if (url.pathname === "/favicon.png" || url.pathname === "/favicon.ico") {
      if (fs.existsSync(LOGO_PATH)) {
        res.writeHead(200, { "content-type": "image/png", "cache-control": "max-age=3600" });
        res.end(fs.readFileSync(LOGO_PATH));
      } else {
        res.writeHead(404).end("no logo");
      }
      return;
    }

    if (url.pathname !== "/") { res.writeHead(404).end("Not found"); return; }

    // ?mode=real&hours=720 previews actual Supabase leads; default is demo.
    const mode = url.searchParams.get("mode") === "real" ? "real" : "demo";
    const hours = Number(url.searchParams.get("hours")) || 24;
    const wantsFresh = url.searchParams.has("refresh") || !cache || cache.mode !== mode || cache.hours !== hours;
    if (wantsFresh) {
      console.log(`Generating briefing via Groq… (mode=${mode}${mode === "real" ? `, ${hours}h` : ""})`);
      cache = { ...(await buildBriefing(mode, hours)), mode, hours };
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(previewPage(cache));
  } catch (err) {
    console.error("Preview error:", err?.message || err);
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("Preview failed: " + (err?.message || err));
  }
});

server.listen(PORT, () => {
  console.log(`\n  Briefing preview running →  http://localhost:${PORT}`);
  console.log(`  (first load calls Groq, then it's cached. Ctrl+C to stop.)\n`);
});
