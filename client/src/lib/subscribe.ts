import { supabase } from "./supabase";

/**
 * Email-only newsletter / early-access subscribe used by the hero and footer
 * forms. Mirrors ContactForm's strategy: Supabase is the source of truth
 * (CORS-enabled, works even when the Express backend isn't running), and the
 * confirmation email is a best-effort call to the backend.
 *
 * In dev, VITE_API_BASE_URL is empty so /api/* stays relative and Vite proxies
 * it to :5000. In production the backend lives on its own origin (set via
 * VITE_API_BASE_URL), matching ContactForm.
 */
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function subscribeEmail(
  rawEmail: string,
  source: string
): Promise<{ ok: boolean; error?: string }> {
  const email = rawEmail.trim();
  if (!isEmail(email)) return { ok: false, error: "Please enter a valid email address." };

  const name = email.split("@")[0].slice(0, 80) || "Subscriber";
  const message = `Newsletter / early-access signup via ${source}`;
  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "";

  try {
    if (supabase) {
      // Source of truth — readable success/failure.
      const { error } = await supabase.from("contact_messages").insert({
        name,
        email,
        message,
        newsletter_subscribed: true,
        subscribed_at: new Date().toISOString(),
      });
      if (error) throw error;
    } else {
      // No Supabase configured — fall back to the backend contact endpoint.
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Subscription failed. Please try again.");
      }
    }

    // Best-effort confirmation email — never blocks success.
    fetch(`${API_BASE}/api/send-welcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    }).catch(() => {});

    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error)?.message || "Something went wrong. Please try again." };
  }
}
