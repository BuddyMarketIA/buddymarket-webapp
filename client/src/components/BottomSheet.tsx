import React, { useEffect, useRef } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Altura máxima como fracción del viewport, por defecto 0.85 */
  maxHeightFraction?: number;
}

/**
 * BottomSheet — modal deslizable desde abajo, optimizado para mobile.
 * En desktop se muestra como un dialog centrado estándar.
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  maxHeightFraction = 0.85,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const maxH = Math.round(maxHeightFraction * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        style={{ animation: "fadeIn 0.2s ease" }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full lg:max-w-lg bg-background rounded-t-3xl lg:rounded-2xl shadow-2xl flex flex-col"
        style={{
          maxHeight: `${maxH}vh`,
          animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Handle (solo mobile) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (min-width: 1024px) {
          @keyframes slideUp {
            from { transform: scale(0.95) translateY(10px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}
