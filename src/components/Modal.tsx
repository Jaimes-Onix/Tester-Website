import { useEffect, type ReactNode } from "react";

/** Backdrop + animated panel shell. Handles Escape, scroll-lock and backdrop-click close. */
export default function Modal({
  open,
  onClose,
  children,
  panelClass = "max-w-md",
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClass?: string;
  label: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className={`modal-panel ${panelClass}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/** Tester.io mark with a self-contained gradient (safe to render outside App's #g defs). */
export function ModalLogo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="gm" x1="6" y1="6" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2DDA8" />
          <stop offset=".45" stopColor="#E6B979" />
          <stop offset="1" stopColor="#A9863F" />
        </linearGradient>
      </defs>
      <path
        d="M10 4h24a8 8 0 0 1 8 8v18a8 8 0 0 1-8 8H22l-9 7v-7h-3a8 8 0 0 1-8-8V12a8 8 0 0 1 8-8Z"
        fill="url(#gm)"
      />
      <path
        d="M16 24.5 21.5 30 33 17"
        stroke="#1A1308"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Small round close (×) button shared by modals. */
export function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="modal-x grid place-items-center h-9 w-9 rounded-full"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );
}
