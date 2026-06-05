import { useEffect, useRef, useState, type FormEvent } from "react";

/**
 * Guided chat widget (no AI) — UI TEMPLATE ONLY.
 *
 * A floating launcher opens a chat panel that conversationally walks through
 * name → email → message for show. It does NOT send anything to the backend or
 * the Google Sheet — only the contact form under the hero saves real data.
 * The chat just simulates a friendly hand-off and links to the product.
 *
 * Styled to match the site's gold-on-dark brand.
 */

type Sender = "bot" | "user";
type Step = "name" | "email" | "message" | "sending" | "done";
interface Msg {
  id: number;
  from: Sender;
  text: string;
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

let uid = 0;
const nextId = () => ++uid;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("name");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [data, setData] = useState({ name: "", email: "", message: "" });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  /** Push a bot line after a short "typing" pause for a natural feel. */
  const botSay = (text: string, delay = 650) => {
    setTyping(true);
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: nextId(), from: "bot", text }]);
      setTyping(false);
    }, delay);
  };

  // Greet once, the first time the panel opens.
  useEffect(() => {
    if (open && !started.current) {
      started.current = true;
      botSay("Hi! 👋 I'm the Tester.io assistant. I'll get you on the early-access list in a few quick questions.", 350);
      botSay("First up — what's your name?", 1100);
    }
  }, [open]);

  // Keep the newest message in view, and refocus the input.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    if (open && step !== "sending" && step !== "done" && !typing) inputRef.current?.focus();
  }, [messages, typing, open, step]);

  // NOTE: This chatbot is a UI template only — it does NOT send anything to the
  // backend or the Google Sheet. Only the contact form under the hero saves data.
  // It just simulates a successful hand-off for the demo experience.
  const finish = (payload: typeof data) => {
    setStep("sending");
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setStep("done");
      setMessages((m) => [
        ...m,
        { id: nextId(), from: "bot", text: `Thanks, ${payload.name.split(" ")[0]}! 🎉 In the meantime, take a look at what we're building.` },
      ]);
    }, 900);
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const value = draft.trim();
    if (!value || typing || step === "sending" || step === "done") return;

    // Echo the user's message.
    setMessages((m) => [...m, { id: nextId(), from: "user", text: value }]);
    setDraft("");

    if (step === "name") {
      const name = value;
      setData((d) => ({ ...d, name }));
      setStep("email");
      botSay(`Nice to meet you, ${name.split(" ")[0]}! What's the best email to reach you?`);
      return;
    }

    if (step === "email") {
      if (!isEmail(value)) {
        botSay("That email doesn't look quite right — mind double-checking it?");
        return;
      }
      setData((d) => ({ ...d, email: value }));
      setStep("message");
      botSay("Got it. Last one — what are you most curious about, or how can we help?");
      return;
    }

    if (step === "message") {
      const payload = { ...data, message: value };
      setData(payload);
      finish(payload);
    }
  };

  return (
    <>
      {/* ===== LAUNCHER (replaces the old contact FAB) ===== */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-magnetic
        aria-label={open ? "Close chat" : "Chat with us"}
        aria-expanded={open}
        className="fab btn-gold inline-flex items-center gap-2 rounded-full pl-4 pr-5 py-3.5 text-[13.5px] font-bold shadow-lg"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1308" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1308" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-4.2A8.4 8.4 0 1 1 21 11.5z" /></svg>
        )}
        <span className="hidden sm:inline">{open ? "Close" : "Chat"}</span>
      </button>

      {/* ===== CHAT PANEL ===== */}
      <div
        role="dialog"
        aria-label="Chat with Tester.io"
        className={`chat-panel fixed z-[60] flex flex-col overflow-hidden rounded-3xl card
          right-4 sm:right-6 bottom-[5.5rem] sm:bottom-24
          w-[calc(100vw-2rem)] sm:w-[370px] h-[min(70vh,520px)]
          origin-bottom-right transition-[opacity,transform] duration-300
          ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
        style={{ transitionTimingFunction: "var(--ease-spring)", boxShadow: "0 40px 90px -50px rgba(230,185,121,.5), 0 12px 40px rgba(0,0,0,.55)" }}
        aria-hidden={!open}
      >
        {/* header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[.07] bg-white/[.02]">
          <span className="emblem w-9 h-9 grid place-items-center shrink-0">
            <img src="/tester-logo.png" alt="" width={18} height={18} className="select-none" draggable={false} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-extrabold tracking-tight leading-none">
              Tester<span className="text-gold-grad">.io</span> assistant
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-mute">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400/90" /> Typically replies instantly
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="grid place-items-center h-8 w-8 rounded-full text-mute hover:text-gold-200 hover:bg-white/[.05] transition-colors duration-200">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-[1.5] ${
                  m.from === "user" ? "text-[#1A1308] font-semibold rounded-br-md" : "chip text-white/90 rounded-bl-md"
                }`}
                style={m.from === "user" ? { background: "linear-gradient(140deg,#F2DDA8,#E6B979 45%,#C6A559)" } : undefined}
              >
                {m.text}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="chip rounded-2xl rounded-bl-md px-3.5 py-3 flex items-center gap-1">
                <span className="chat-dot" /><span className="chat-dot" /><span className="chat-dot" />
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex justify-start pt-1">
              <a href="/product.html" data-magnetic className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold">
                See the product
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
            </div>
          )}
        </div>

        {/* input */}
        <form onSubmit={handleSend} className="border-t border-white/[.07] p-3 flex items-center gap-2 bg-white/[.02]">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={typing || step === "sending" || step === "done"}
            placeholder={step === "done" ? "Thanks for chatting!" : step === "email" ? "you@example.com" : "Type your reply…"}
            aria-label="Your message"
            className="flex-1 rounded-full bg-white/[.04] border border-white/[.1] px-4 py-2.5 text-[13.5px] text-white placeholder:text-mute outline-none focus:border-[rgba(230,185,121,.55)] transition-colors duration-200 disabled:opacity-60"
            inputMode={step === "email" ? "email" : "text"}
          />
          <button
            type="submit"
            disabled={!draft.trim() || typing || step === "sending" || step === "done"}
            aria-label="Send"
            className="btn-gold grid place-items-center h-10 w-10 shrink-0 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1A1308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" /></svg>
          </button>
        </form>
      </div>
    </>
  );
}
