import { useState, useEffect } from "react";
import Modal, { ModalLogo, CloseButton } from "./Modal";

type Mode = "login" | "signup";

const SOCIALS = [
  {
    name: "Google",
    icon: (
      <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.9 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.9 36.5 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
      </svg>
    ),
  },
  {
    name: "Apple",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#F2F2F2" aria-hidden="true">
        <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2-.1 1.6-.8 3-.8s1.8.8 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.4-1-2.5-3.7zM14.2 5.8c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z" />
      </svg>
    ),
  },
];

export default function AuthModal({
  open,
  mode,
  prefillEmail = "",
  onClose,
  onSwitch,
}: {
  open: boolean;
  mode: Mode;
  prefillEmail?: string;
  onClose: () => void;
  onSwitch: (m: Mode) => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState(prefillEmail);
  const isSignup = mode === "signup";

  /** Carry the email typed in the hero form into the modal each time it opens. */
  useEffect(() => {
    if (open) setEmail(prefillEmail);
  }, [open, prefillEmail]);

  return (
    <Modal open={open} onClose={onClose} panelClass="max-w-[920px] overflow-hidden" label="Account">
      <div className="grid md:grid-cols-[0.92fr_1fr]">
        {/* ===== Left visual panel ===== */}
        <div className="relative hidden md:block min-h-[600px] m-3 rounded-[18px] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "https://placehold.co/600x800/0E0E0E/E6B979?text=Tester.io";
            }}
          />
          {/* gradient + color treatment layers (per brand guardrails) */}
          <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(230,185,121,.42), rgba(11,11,11,.1) 55%)", mixBlendMode: "multiply" }} />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

          <div className="relative h-full flex flex-col justify-between p-7">
            <div className="flex items-center justify-between">
              <a href="#top" onClick={onClose} className="flex items-center gap-2" aria-label="Tester.io home">
                <ModalLogo size={26} />
                <span className="text-[16px] font-extrabold tracking-tight text-white">
                  Tester<span className="text-gold-grad">.io</span>
                </span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-white/20 active:scale-[.97] transition-[background,transform] duration-300"
              >
                Back to website
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>

            <div>
              <h3 className="text-[30px] font-extrabold tracking-tightest leading-[1.1] text-white">
                Trade the <span className="text-gold-grad">future</span>,<br />hold what you love.
              </h3>
              <div className="mt-5 flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-gold-300" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
              </div>
            </div>
          </div>
        </div>

        {/* ===== Right form panel ===== */}
        <div className="relative p-7 sm:p-9">
          <div className="absolute top-5 right-5"><CloseButton onClose={onClose} /></div>

          <h2 className="text-[28px] sm:text-[32px] font-extrabold tracking-tightest leading-tight">
            {isSignup ? "Create an account" : "Welcome back"}
          </h2>
          <p className="mt-2 text-[13.5px] font-medium text-mute">
            {isSignup ? "Already have an account? " : "New to Tester.io? "}
            <button
              type="button"
              onClick={() => onSwitch(isSignup ? "login" : "signup")}
              className="text-gold-200 font-semibold hover:text-gold-100 underline underline-offset-2 transition-colors duration-300"
            >
              {isSignup ? "Log in" : "Create an account"}
            </button>
          </p>

          <form className="mt-7 space-y-3.5" onSubmit={(e) => e.preventDefault()}>
            {isSignup && (
              <div className="grid grid-cols-2 gap-3">
                <label className="field">
                  <input type="text" placeholder="First name" autoComplete="given-name" aria-label="First name" />
                </label>
                <label className="field">
                  <input type="text" placeholder="Last name" autoComplete="family-name" aria-label="Last name" />
                </label>
              </div>
            )}

            <label className="field">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A8A8F" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" aria-label="Email" required />
            </label>

            <label className="field">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A8A8F" strokeWidth="1.6" aria-hidden="true"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              <input type={showPw ? "text" : "password"} placeholder="Enter your password" autoComplete={isSignup ? "new-password" : "current-password"} aria-label="Password" required />
              <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"} className="text-mute hover:text-gold-200 transition-colors duration-300 shrink-0">
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8M9.9 4.6A9.8 9.8 0 0 1 12 4c5 0 9.3 3.3 10 8a11 11 0 0 1-2.2 4M6.1 6.2A11 11 0 0 0 2 12c.7 4.7 5 8 10 8 1.4 0 2.7-.3 3.9-.7" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </label>

            {isSignup ? (
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input type="checkbox" className="ck mt-0.5" required />
                <span className="text-[12.5px] leading-[1.5] text-mute">
                  I agree to the <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="text-gold-200 hover:text-gold-100 underline underline-offset-2">Terms &amp; Conditions</a> and <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-gold-200 hover:text-gold-100 underline underline-offset-2">Privacy Policy</a>.
                </span>
              </label>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" className="ck" />
                  <span className="text-[12.5px] text-mute">Remember me</span>
                </label>
                <button type="button" className="text-[12.5px] font-semibold text-gold-200 hover:text-gold-100 transition-colors duration-300">Forgot password?</button>
              </div>
            )}

            <button type="submit" data-magnetic className="btn-gold w-full rounded-xl py-3.5 text-[14px] font-bold mt-1">
              {isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11.5px] font-medium text-mute">{isSignup ? "Or register with" : "Or continue with"}</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {SOCIALS.map((s) => (
              <button key={s.name} type="button" className="btn-social">
                {s.icon}
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
