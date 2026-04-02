import { useState, useEffect } from "react";
import { X, Download, Smartphone, Monitor } from "lucide-react";

// Extend Window interface for PWA install prompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "buddymarket_install_dismissed";
const DISMISSED_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode(): boolean {
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export default function InstallAppBanner() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | "desktop" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isInStandaloneMode()) return;

    // Don't show if recently dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISSED_DURATION_MS) return;
    }

    // Detect iOS
    if (isIOS()) {
      setPlatform("ios");
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for PWA install prompt (Android / Desktop Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const ua = navigator.userAgent.toLowerCase();
      setPlatform(/android/.test(ua) ? "android" : "desktop");
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (platform === "ios") {
      // iOS: just show instructions, no native prompt
      return;
    }
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        handleDismiss();
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setShow(false);
  };

  if (!show || !platform) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 9998,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Banner */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          padding: "0 16px 24px",
          animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes iconFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-4px) rotate(-2deg); }
            75% { transform: translateY(-2px) rotate(2deg); }
          }
          @keyframes pulseRing {
            0% { transform: scale(1); opacity: 0.6; }
            70% { transform: scale(1.55); opacity: 0; }
            100% { transform: scale(1.55); opacity: 0; }
          }
          @keyframes pulseRing2 {
            0% { transform: scale(1); opacity: 0.4; }
            70% { transform: scale(1.85); opacity: 0; }
            100% { transform: scale(1.85); opacity: 0; }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes iconPop {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>

        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "24px",
            boxShadow: "0 -4px 40px rgba(0,0,0,0.18)",
            maxWidth: "480px",
            margin: "0 auto",
            position: "relative",
          }}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "#f3f4f6",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            {/* Animated icon container */}
            <div style={{ position: "relative", flexShrink: 0, width: 56, height: 56 }}>
              {/* Outer pulse ring */}
              <div style={{
                position: "absolute",
                inset: 0,
                borderRadius: 16,
                background: "rgba(249,115,22,0.25)",
                animation: "pulseRing2 2.4s ease-out infinite",
                animationDelay: "0.3s",
              }} />
              {/* Inner pulse ring */}
              <div style={{
                position: "absolute",
                inset: 0,
                borderRadius: 16,
                background: "rgba(249,115,22,0.35)",
                animation: "pulseRing 2.4s ease-out infinite",
              }} />
              {/* Icon itself — floats up/down */}
              <div
                style={{
                  position: "relative",
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #F97316, #ea580c)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 20px rgba(249,115,22,0.45)",
                  animation: "iconPop 0.5s cubic-bezier(0.16,1,0.3,1) both, iconFloat 3.5s ease-in-out 0.6s infinite",
                  overflow: "hidden",
                }}
              >
                {/* Shimmer sweep */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.8s ease-in-out 1s infinite",
                  borderRadius: 16,
                  pointerEvents: "none",
                }} />
                {platform === "desktop" ? (
                  <Monitor size={28} color="white" />
                ) : (
                  <Smartphone size={28} color="white" />
                )}
              </div>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: "#111827", lineHeight: 1.2 }}>
                Descarga BuddyMarket
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280" }}>
                {platform === "desktop"
                  ? "Instala la app en tu ordenador"
                  : "Añade la app a tu pantalla de inicio"}
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {[
              { emoji: "⚡", text: "Acceso instantáneo sin abrir el navegador" },
              { emoji: "🔔", text: "Notificaciones de caducidades y recordatorios" },
              { emoji: "📱", text: "Experiencia nativa optimizada para móvil" },
            ].map((b) => (
              <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{b.emoji}</span>
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{b.text}</span>
              </div>
            ))}
          </div>

          {/* iOS instructions */}
          {platform === "ios" && (
            <div
              style={{
                background: "#fff7ed",
                border: "1.5px solid #fed7aa",
                borderRadius: 14,
                padding: "12px 14px",
                marginBottom: 16,
              }}
            >
              <p style={{ margin: 0, fontSize: 13, color: "#9a3412", fontWeight: 700, marginBottom: 6 }}>
                Cómo instalar en iPhone / iPad:
              </p>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#7c2d12", lineHeight: 1.6 }}>
                <li>Pulsa el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba) en Safari</li>
                <li>Desplázate y selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                <li>Pulsa <strong>"Añadir"</strong> en la esquina superior derecha</li>
              </ol>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {platform !== "ios" && (
              <button
                onClick={handleInstall}
                disabled={installing}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  background: installing ? "#d1d5db" : "linear-gradient(135deg, #F97316, #ea580c)",
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: installing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: installing ? "none" : "0 4px 16px rgba(249,115,22,0.35)",
                  transition: "all 0.2s",
                }}
              >
                <Download size={18} />
                {installing ? "Instalando..." : "Instalar ahora"}
              </button>
            )}
            <button
              onClick={handleDismiss}
              style={{
                flex: platform === "ios" ? 1 : 0,
                padding: "13px 20px",
                background: "#f3f4f6",
                color: "#6b7280",
                border: "none",
                borderRadius: 14,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {platform === "ios" ? "Entendido" : "Ahora no"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
