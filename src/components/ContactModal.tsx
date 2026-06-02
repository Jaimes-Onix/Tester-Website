import { useState } from "react";
import Modal, { ModalLogo, CloseButton } from "./Modal";

const CHANNELS = [
  {
    label: "Email us",
    value: "hello@tester.io",
    icon: <path d="M3 5h18v14H3z M3 6l9 7 9-7" />,
  },
  {
    label: "Telegram",
    value: "@testerio",
    icon: <path d="M21.9 4.3 2.7 11.7c-1 .4-1 1.7.1 2l4.8 1.5 1.8 5.8c.3.8 1.2 1 1.8.4l2.6-2.5 4.7 3.5c.7.5 1.6.1 1.8-.7l3-15.4c.2-1-.7-1.8-1.4-1.5z" />,
  },
];

export default function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sent, setSent] = useState(false);

  const close = () => {
    onClose();
    // reset after the close animation so it re-opens fresh
    setTimeout(() => setSent(false), 250);
  };

  return (
    <Modal open={open} onClose={close} panelClass="max-w-[560px]" label="Contact us">
      <div className="relative p-7 sm:p-9">
        <div className="absolute top-5 right-5"><CloseButton onClose={close} /></div>

        {sent ? (
          <div className="py-10 text-center flex flex-col items-center">
            <span className="emblem w-20 h-20 grid place-items-center">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#E6B979" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <h2 className="mt-6 text-[26px] font-extrabold tracking-tightest">Message sent!</h2>
            <p className="mt-2 max-w-xs text-[14px] leading-[1.6] text-mute">Thanks for reaching out — our team will get back to you within one business day.</p>
            <button type="button" onClick={close} data-magnetic className="btn-gold mt-7 rounded-full px-7 py-3 text-[13px] font-bold">Back to site</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <ModalLogo size={26} />
              <span className="text-[16px] font-extrabold tracking-tight">
                Tester<span className="text-gold-grad">.io</span>
              </span>
            </div>

            <h2 className="mt-5 text-[28px] sm:text-[32px] font-extrabold tracking-tightest leading-tight">
              Get in <span className="text-gold-grad">touch</span>
            </h2>
            <p className="mt-2 text-[13.5px] leading-[1.6] font-medium text-mute">
              Questions about the token sale, partnerships, or press? Drop us a line and we'll respond shortly.
            </p>

            <form className="mt-6 space-y-3.5" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="field">
                  <input type="text" placeholder="Full name" autoComplete="name" aria-label="Full name" required />
                </label>
                <label className="field">
                  <input type="email" placeholder="Email" autoComplete="email" aria-label="Email" required />
                </label>
              </div>

              <label className="field">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A8A8F" strokeWidth="1.6" aria-hidden="true"><path d="M4 5h16v14H4z" /><path d="M4 9h16" /></svg>
                <input type="text" placeholder="Subject" aria-label="Subject" />
              </label>

              <label className="field field--area">
                <textarea placeholder="How can we help?" aria-label="Message" required />
              </label>

              <button type="submit" data-magnetic className="btn-gold w-full rounded-xl py-3.5 text-[14px] font-bold flex items-center justify-center gap-2">
                Send message
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" /></svg>
              </button>
            </form>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {CHANNELS.map((c) => (
                <div key={c.label} className="chip rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="icon-tile w-9 h-9 shrink-0">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E6B979" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{c.icon}</svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10.5px] uppercase tracking-wide text-mute">{c.label}</div>
                    <div className="text-[13px] font-semibold text-white truncate">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
