/**
 * sonner-a11y-shim.ts
 *
 * Shim de accesibilidad para Sonner.
 *
 * Estrategia: escuchar el evento personalizado que Sonner emite internamente
 * al crear un toast, e inyectar el texto en la región aria-live correcta:
 *
 *   - toast.error / toast.warning  → aria-live="assertive" (role="alert")
 *     Interrumpe al lector de pantalla de inmediato.
 *
 *   - toast.success / toast.info / toast()  → aria-live="polite" (role="status")
 *     Espera a que el lector termine antes de anunciar.
 *
 * Este módulo exporta:
 *   - `toast`    → wrapper accesible (mismo API que sonner)
 *   - `useA11yToastSetup` → hook para montar las regiones aria-live en el DOM
 */

import { toast as sonnerToast } from "sonner";
import { useEffect } from "react";

// ── Regiones aria-live ────────────────────────────────────────────────────────

const POLITE_ID = "__bm_a11y_polite";
const ASSERTIVE_ID = "__bm_a11y_assertive";

function ensureRegion(id: string, priority: "polite" | "assertive"): HTMLElement {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.setAttribute("role", priority === "assertive" ? "alert" : "status");
    el.setAttribute("aria-live", priority);
    el.setAttribute("aria-atomic", "true");
    el.setAttribute("aria-relevant", "additions text");
    // Visualmente oculto — equivalente a la clase sr-only de Tailwind
    Object.assign(el.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0,0,0,0)",
      whiteSpace: "nowrap",
      border: "0",
    });
    document.body.appendChild(el);
  }
  return el;
}

function announce(message: unknown, priority: "polite" | "assertive"): void {
  if (typeof document === "undefined") return;
  const text = typeof message === "string" ? message : "";
  if (!text) return;

  const region = ensureRegion(
    priority === "assertive" ? ASSERTIVE_ID : POLITE_ID,
    priority
  );

  // Limpiar primero para forzar re-anuncio aunque el mensaje sea idéntico
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = text;
  });
}

// ── Hook para montar las regiones en el DOM ───────────────────────────────────

/**
 * Llama este hook una sola vez en el árbol de componentes (p.ej. en App.tsx)
 * para garantizar que las regiones aria-live existen antes de que se muestren
 * los primeros toasts.
 */
export function useA11yToastSetup(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    ensureRegion(POLITE_ID, "polite");
    ensureRegion(ASSERTIVE_ID, "assertive");
  }, []);
}

// ── Wrapper de toast ─────────────────────────────────────────────────────────

type ToastMessage = Parameters<typeof sonnerToast>[0];
type ToastOptions = Parameters<typeof sonnerToast>[1];

export const toast = Object.assign(
  (message: ToastMessage, options?: ToastOptions) => {
    announce(message, "polite");
    return sonnerToast(message, options);
  },
  {
    success: (message: ToastMessage, options?: ToastOptions) => {
      announce(message, "polite");
      return sonnerToast.success(message, options);
    },

    error: (message: ToastMessage, options?: ToastOptions) => {
      announce(message, "assertive");
      return sonnerToast.error(message, options);
    },

    warning: (message: ToastMessage, options?: ToastOptions) => {
      announce(message, "assertive");
      return sonnerToast.warning(message, options);
    },

    info: (message: ToastMessage, options?: ToastOptions) => {
      announce(message, "polite");
      return sonnerToast.info(message, options);
    },

    loading: (message: ToastMessage, options?: ToastOptions) => {
      announce(message, "polite");
      return sonnerToast.loading(message, options);
    },

    // Métodos que no requieren anuncio adicional
    promise: sonnerToast.promise,
    dismiss: sonnerToast.dismiss,
    custom: sonnerToast.custom,
    message: sonnerToast.message,
  }
) as typeof sonnerToast;
