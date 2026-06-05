/**
 * Supabase browser client (frontend).
 *
 * Reads its config from Vite env vars (see .env.local):
 *   VITE_SUPABASE_URL       — your project URL  (https://<ref>.supabase.co)
 *   VITE_SUPABASE_ANON_KEY  — the PUBLIC anon key (safe to ship to the browser;
 *                             access is gated by Row-Level-Security policies).
 *
 * Used by the contact form to insert submissions directly into the
 * `contact_messages` table. The service_role key is NEVER used here.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True only when both env vars are present — lets callers fail gracefully. */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // Warn (don't crash) so the rest of the site still runs in dev if env is missing.
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — " +
      "Supabase inserts will be skipped. Check .env.local and restart `npm run dev`."
  );
}

/**
 * Single shared client. We don't persist auth sessions — this app only does
 * anonymous inserts, so there's no user session to keep.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
