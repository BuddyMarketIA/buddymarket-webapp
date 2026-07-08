import { useState, useEffect } from "react";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const STORAGE_KEY = "bm_medical_disclaimer_shown";

/**
 * MedicalDisclaimerBanner
 * Shows a dismissible banner once per session (sessionStorage) reminding users
 * that BuddyMarket is not a substitute for professional medical advice.
 */
export default function MedicalDisclaimerBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show once per session (not per page load)
    const alreadyShown = sessionStorage.getItem(STORAGE_KEY);
    if (!alreadyShown) {
      // Small delay so it doesn't flash immediately on load
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9990,
        width: "min(calc(100vw - 32px), 480px)",
        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        border: "1.5px solid #fbbf24",
        borderRadius: "16px",
        padding: "14px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(251,191,36,0.2)",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        animation: "slideUpFade 0.4s ease-out",
      }}
    >
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{ flexShrink: 0, marginTop: "2px" }}>
        <ExclamationTriangleIcon style={{ width: "20px", height: "20px", color: "#d97706" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#92400e", marginBottom: "3px" }}>
          Aviso médico
        </p>
        <p style={{ margin: 0, fontSize: "12px", color: "#78350f", lineHeight: 1.5 }}>
          BuddyMarket es una herramienta de apoyo nutricional y{" "}
          <strong>no sustituye el consejo médico profesional</strong>. Consulta siempre a un profesional de la salud antes de realizar cambios significativos en tu dieta.
        </p>
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Cerrar aviso"
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px",
          borderRadius: "6px",
          color: "#92400e",
          marginTop: "1px",
        }}
      >
        <XMarkIcon style={{ width: "18px", height: "18px" }} />
      </button>
    </div>
  );
}
