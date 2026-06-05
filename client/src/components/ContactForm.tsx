import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

type Status = "idle" | "sending" | "error";

/**
 * Contact section that sits directly under the hero.
 * Collects Name / Email / Message and POSTs to the Express backend (`/api/contact`),
 * which appends the submission to a Google Sheet. On success the visitor is sent to
 * the Thank-You page, which then auto-redirects to the product page.
 *
 * Styled with the site's existing gold-on-dark system (.card / .field / .btn-gold).
 */
export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      message: String(data.get("message") || "").trim(),
      newsletter: data.get("newsletter") != null, // checkbox ticked?
    };

    // Client-side validation before sending. These mirror the database's RLS
    // insert policy, so the user gets a clear message instead of a generic
    // "couldn't save" error when the DB rejects malformed data.
    if (!payload.name || !payload.email || !payload.message) {
      setStatus("error");
      setError("Please fill in your name, email, and message.");
      return;
    }
    const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    if (!isEmail(payload.email)) {
      setStatus("error");
      setError("That email address doesn't look right — please use a real email.");
      return;
    }
    if (payload.name.length > 120 || payload.message.length > 4000) {
      setStatus("error");
      setError("One of your fields is too long. Please shorten it.");
      return;
    }

    setStatus("sending");
    setError("");

    // ── Destination 1: Supabase ────────────────────────────────────────────
    // This is a real (CORS-enabled) request, so we CAN read whether it worked.
    // We treat Supabase as the source of truth for success/failure.
    const insertSupabase = async () => {
      if (!supabase) return; // env not configured — skip rather than block Sheets
      const { error } = await supabase.from("contact_messages").insert({
        name: payload.name,
        email: payload.email,
        message: payload.message,
        newsletter_subscribed: payload.newsletter,
        subscribed_at: payload.newsletter ? new Date().toISOString() : null,
      });
      if (error) throw error;
    };

    // ── Destination 2: Google Sheets via Apps Script ───────────────────────
    // `no-cors` makes the response opaque (we can't read it) — Apps Script still
    // records the row. This is best-effort: a failure here won't block the user,
    // since the submission is already safely in Supabase.
    const postSheets = async () => {
      const SHEETS_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL as string | undefined;
      if (!SHEETS_URL) return; // not configured — skip
      await fetch(SHEETS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    };

    // ── Confirmation email: ask the backend (server.js) to send via Resend ─
    // Best-effort — the email key is server-side only, so we POST to /api/send-welcome.
    // If the backend isn't running, this just fails quietly; the submission is still saved.
    const sendWelcome = async () => {
      // Backend lives on its own origin in production (VITE_API_BASE_URL). In dev
      // it's empty, so the call stays relative and the Vite proxy forwards it to :5000.
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
      await fetch(`${API_BASE}/api/send-welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: payload.name, email: payload.email }),
      });
    };

    // Run all destinations at once and wait for them to settle (so none are
    // cancelled by the redirect below). Supabase is the source of truth for success.
    const [supabaseResult] = await Promise.allSettled([
      insertSupabase(),
      postSheets(),
      sendWelcome(),
    ]);

    if (supabaseResult.status === "rejected") {
      const reason = supabaseResult.reason;
      console.error("[contact] Supabase insert failed:", reason);
      setStatus("error");
      setError(
        reason instanceof Error
          ? reason.message
          : "We couldn't save your message. Please try again."
      );
      return;
    }

    // Success → hand off to the Thank-You page (which redirects to the product after 5s).
    window.location.href = "/thankyou.html";
  };

  return (
    <section id="contact" className="relative py-14 sm:py-20 lg:py-24 border-t border-white/[.06] overflow-hidden">
      {/* atmospheric gold wash, top-right */}
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 w-[28rem] h-[28rem] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(230,185,121,.12), transparent 65%)", filter: "blur(14px)" }}
      />
      <div aria-hidden="true" className="absolute inset-0 dots opacity-40" />

      <div className="relative mx-auto max-w-6xl px-5 lg:px-8 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        {/* ── Left: pitch ───────────────────────────── */}
        <div className="reveal">
          <span className="inline-flex items-center gap-2 rounded-full pill px-3.5 py-1.5 text-[12px] font-semibold text-gold-200">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-300" /> Get on the list
          </span>
          <h2 className="mt-5 text-[32px] sm:text-[44px] font-extrabold tracking-tightest leading-[1.06]">
            Tell us where to send your <span className="text-gold-grad">early access</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-[1.7] font-medium text-mute">
            Drop your details and a short note. We'll add you to the Tester.io early-access
            list and get you straight to the product the moment you submit.
          </p>

          <ul className="mt-8 space-y-3.5 max-w-md">
            {["No spam — token updates and product drops only", "Be first in line for the Tester Pro Terminal", "Replies from a real human within one business day"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-[14px] font-medium text-white/90">
                <span
                  className="grid place-items-center h-6 w-6 shrink-0 rounded-full"
                  style={{ background: "linear-gradient(140deg,#F2DDA8,#C6A559)", boxShadow: "0 0 16px -4px rgba(230,185,121,.5)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A1308" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-11" /></svg>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right: form card ──────────────────────── */}
        <div className="reveal card rounded-3xl p-7 sm:p-9">
          <h3 className="text-[20px] font-extrabold tracking-tight">
            Contact <span className="text-gold-grad">us</span>
          </h3>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-mute">
            All fields below — takes about 20 seconds.
          </p>

          <form className="mt-6 space-y-3.5" onSubmit={onSubmit} noValidate>
            <label className="field">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A8A8F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.4" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
              <input type="text" name="name" placeholder="Full name" autoComplete="name" aria-label="Full name" required />
            </label>

            <label className="field">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A8A8F" strokeWidth="1.6" aria-hidden="true"><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></svg>
              <input type="email" name="email" placeholder="Email address" autoComplete="email" aria-label="Email address" required />
            </label>

            <label className="field field--area">
              <textarea name="message" placeholder="Your message — what are you most curious about?" aria-label="Message" required />
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer select-none px-0.5 pt-0.5">
              <input
                type="checkbox"
                name="newsletter"
                defaultChecked
                className="mt-[2px] h-4 w-4 shrink-0 rounded accent-gold-300 cursor-pointer"
              />
              <span className="text-[12.5px] leading-[1.5] text-mute">
                Subscribe me to product updates &amp; token drops.{" "}
                <span className="text-white/70">No spam — unsubscribe anytime.</span>
              </span>
            </label>

            {status === "error" && (
              <p role="alert" className="flex items-center gap-2 text-[13px] font-medium text-red-300/90">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
                {error}
              </p>
            )}

            <button
              type="submit"
              data-magnetic
              disabled={status === "sending"}
              className="btn-gold w-full rounded-xl py-3.5 text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === "sending" ? (
                <>
                  <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.2-8.6" /></svg>
                  Sending…
                </>
              ) : (
                <>
                  Send &amp; get access
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" /></svg>
                </>
              )}
            </button>

            <p className="text-center text-[11.5px] leading-[1.5] text-mute/80">
              By submitting you agree to receive occasional updates. We never share your details.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
