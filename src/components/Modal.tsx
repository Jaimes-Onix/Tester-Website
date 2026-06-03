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

/** Tester.io brand logo mark — the real asset (brand_assets/Tester Logo.png). */
export function ModalLogo({ size = 30 }: { size?: number }) {
  return (
    <img
      src="/tester-logo.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className="block select-none"
      style={{ width: size, height: size }}
    />
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
