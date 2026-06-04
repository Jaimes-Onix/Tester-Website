/**
 * Step 5 — Mark a contact as "replied".
 *
 * When someone replies to your welcome email (it lands in your inbox via Reply-To),
 * run this to flag their row in Supabase so you can track engagement:
 *
 *   node scripts/mark-replied.mjs someone@email.com
 *
 * It sets  replied = true  and  replied_at = now()  on every row with that email.
 *
 * Uses the SERVICE ROLE key (backend only — bypasses Row-Level Security so it can
 * UPDATE rows; the public anon key can only INSERT). Secrets come from .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal .env.local loader (same idea as server.js).
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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/mark-replied.mjs <email>");
  process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const now = new Date().toISOString();
// A reply counts as engagement, so we also opt them into the newsletter
// ("update subscription status when they reply OR opt-in" — lesson Step 6).
const { data, error } = await supabase
  .from("contact_messages")
  .update({
    replied: true,
    replied_at: now,
    newsletter_subscribed: true,
    subscribed_at: now,
  })
  .eq("email", email)
  .select("id, name, email, replied, replied_at, newsletter_subscribed");

if (error) {
  console.error("Update failed:", error.message);
  process.exit(1);
}
if (!data || data.length === 0) {
  console.log(`No rows found for ${email} — nobody with that email in contact_messages.`);
} else {
  console.log(`Marked ${data.length} row(s) as replied + subscribed for ${email}:`);
  for (const r of data) console.log(`  • ${r.name} <${r.email}>  replied=${r.replied}  subscribed=${r.newsletter_subscribed}  at ${r.replied_at}`);
}
