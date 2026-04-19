/**
 * AccessibleToaster
 *
 * Componente Toaster accesible que:
 * 1. Monta las regiones aria-live en el DOM (polite + assertive)
 * 2. Renderiza el Toaster visual de Sonner con configuración optimizada
 *
 * Para que los toasts de error/warning sean anunciados con urgencia por los
 * lectores de pantalla, los componentes deben importar `toast` desde
 * "@/components/sonner-a11y-shim" en lugar de "sonner".
 *
 * Los 59 archivos que ya usan `toast` de "sonner" seguirán funcionando con
 * el aria-live="polite" nativo de Sonner. Solo los nuevos archivos o los que
 * se actualicen usarán el shim para la distinción polite/assertive.
 */

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useA11yToastSetup } from "./sonner-a11y-shim";

export function AccessibleToaster(props: ToasterProps) {
  const { theme = "system" } = useTheme();
  const [toastOffset, setToastOffset] = useState(80);

  // Monta las regiones aria-live en el DOM al cargar la app
  useA11yToastSetup();

  // Calcula el offset dinámico basado en el header real de la app
  useEffect(() => {
    const updateOffset = () => {
      const header = document.querySelector(".app-header") as HTMLElement | null;
      if (header) {
        const headerBottom = header.getBoundingClientRect().bottom;
        setToastOffset(headerBottom + 8);
      } else {
        // Fallback: safe-area-inset-top + 64px header + 8px gap
        const safeTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sat") || "0") || 0;
        setToastOffset(safeTop + 72);
      }
    };
    updateOffset();
    window.addEventListener("resize", updateOffset);
    return () => window.removeEventListener("resize", updateOffset);
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      offset={toastOffset}
      containerAriaLabel="Notificaciones"
      richColors
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--width": "360px",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          borderRadius: "14px",
          fontSize: "15px",
          fontWeight: 600,
          padding: "14px 18px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        },
      }}
      {...props}
    />
  );
}
