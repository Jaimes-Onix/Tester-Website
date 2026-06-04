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
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
app.use(cors());
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

// Simple health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, sheets: sheetsConfigured });
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

app.listen(PORT, () => {
  console.log(`\n  Tester.io API listening on http://localhost:${PORT}`);
  console.log(
    sheetsConfigured
      ? "  Google Sheets: configured ✓  (submissions will be saved)\n"
      : "  Google Sheets: NOT configured — submissions are logged to the console only.\n  → See docs/google-sheets-setup.md to enable saving.\n"
  );
});
