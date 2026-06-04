/**
 * Seed sample contact-form submissions into Supabase (contact_messages).
 *
 * This populates the admin dashboard with realistic data for testing/demo.
 * It uses the SERVICE ROLE key (backend-only, bypasses RLS) read from
 * .env.local — the same pattern as send-followups.mjs / mark-replied.mjs.
 *
 * Every seeded row's message starts with the tag "[TEST]" so they are easy to
 * find and remove. A spread of dates, newsletter opt-ins, and "replied" flags
 * makes the Overview / Subscribers / Email-log tabs look real.
 *
 * Usage:
 *   node scripts/seed-submissions.mjs            # insert 20 tagged rows
 *   node scripts/seed-submissions.mjs --dry-run  # print what would be inserted
 *   node scripts/seed-submissions.mjs --clean    # delete all [TEST] rows again
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TAG = "[TEST]";

// --- tiny .env.local loader (same approach as server.js) ---
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

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const clean = args.includes("--clean");

// --- sample people ---
const PEOPLE = [
  ["Maya Chen", "maya.chen@example.com", "Curious about the Tester Pro Terminal — when does early access open?"],
  ["Diego Alvarez", "diego.alvarez@example.com", "Do you support cross-chain leverage on Solana?"],
  ["Priya Nair", "priya.nair@example.com", "Loved the whitepaper. How does the vesting schedule work?"],
  ["Tom Becker", "tom.becker@example.com", "Is there an API for building custom trading dashboards?"],
  ["Aiko Tanaka", "aiko.tanaka@example.com", "What are the fees for the Pro Terminal subscription?"],
  ["Liam O'Brien", "liam.obrien@example.com", "Signing up for updates — keep me posted on the token sale!"],
  ["Sofia Rossi", "sofia.rossi@example.com", "Can I monitor positions in real time on mobile?"],
  ["Noah Williams", "noah.williams@example.com", "Interested in the audited smart contract details."],
  ["Hana Park", "hana.park@example.com", "How early is 'early access'? Want to be first in line."],
  ["Marcus Webb", "marcus.webb@example.com", "Do you offer staking rewards on held TST tokens?"],
  ["Elena Petrova", "elena.petrova@example.com", "Great design. Will there be a desktop terminal app?"],
  ["Kwame Mensah", "kwame.mensah@example.com", "Question about exportable tax reports — are they audit-ready?"],
  ["Isabella Santos", "isabella.santos@example.com", "Where can I read more about cross-chain infrastructure?"],
  ["Daniel Cohen", "daniel.cohen@example.com", "Add me to the list. Excited for the product drop!"],
  ["Yuki Sato", "yuki.sato@example.com", "Does the terminal show live market depth?"],
  ["Olivia Murphy", "olivia.murphy@example.com", "What chains are supported at launch?"],
  ["Ahmed Hassan", "ahmed.hassan@example.com", "Looking forward to the Telegram community — when does it open?"],
  ["Grace Kim", "grace.kim@example.com", "How does identity verification / AML work out of the box?"],
  ["Lucas Meyer", "lucas.meyer@example.com", "Can I get a demo of the Pro Terminal before subscribing?"],
  ["Fatima Zahra", "fatima.zahra@example.com", "Subscribed! Curious about the roadmap for 2026."],
];

const DAY = 24 * 60 * 60 * 1000;

function buildRows() {
  const now = Date.now();
  return PEOPLE.map(([name, email, msg], i) => {
    // spread submissions across the last ~24 days, newest first
    const createdAt = new Date(now - i * 1.2 * DAY).toISOString();
    // ~75% subscribe to the newsletter
    const subscribed = i % 4 !== 0;
    // a few of the older ones have "replied"
    const replied = i % 5 === 0;
    return {
      name,
      email,
      message: `${TAG} ${msg}`,
      newsletter_subscribed: subscribed,
      subscribed_at: subscribed ? createdAt : null,
      replied,
      replied_at: replied ? new Date(now - i * 1.2 * DAY + 6 * 60 * 60 * 1000).toISOString() : null,
      created_at: createdAt,
    };
  });
}

async function main() {
  if (clean) {
    const { data, error } = await supabase
      .from("contact_messages")
      .delete()
      .like("message", `${TAG}%`)
      .select("id");
    if (error) { console.error("Clean failed:", error.message); process.exit(1); }
    console.log(`Removed ${data.length} [TEST] rows.`);
    return;
  }

  const rows = buildRows();
  if (dryRun) {
    console.log(`Would insert ${rows.length} rows:`);
    rows.forEach((r, i) => console.log(`  ${i + 1}. ${r.name} <${r.email}> sub=${r.newsletter_subscribed} replied=${r.replied}`));
    return;
  }

  const { data, error } = await supabase.from("contact_messages").insert(rows).select("id");
  if (error) { console.error("Insert failed:", error.message); process.exit(1); }
  console.log(`Inserted ${data.length} tagged sample submissions into contact_messages.`);
  console.log(`To remove them later:  node scripts/seed-submissions.mjs --clean`);
}

main().catch((e) => { console.error(e); process.exit(1); });
