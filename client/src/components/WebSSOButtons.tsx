/**
 * WebSSOButtons — Botones de Sign in with Google (y Apple en Safari/iOS)
 * para la webapp de BuddyMarket.
 *
 * Google: usa el flujo OAuth2 con prompt() de Google Identity Services.
 *         El botón es SIEMPRE visible (nativo, no iframe de Google).
 * Apple: usa Sign in with Apple JS (disponible en Safari y todos los navegadores en iOS)
 */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Tipos globales ────────────────────────────────────────────────────────────

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
          prompt: (notification?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: Record<string, unknown>) => void;
        signIn: () => Promise<{
          authorization: { id_token: string; code: string };
          user?: { name?: { firstName?: string; lastName?: string }; email?: string };
        }>;
      };
    };
  }
}

// ─── Constantes ────────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID ?? "com.buddymarket.web";

// ─── Iconos ────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function Spinner() {
  return (
    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
  );
}

// ─── Componente ────────────────────────────────────────────────────────────────

interface WebSSOButtonsProps {
  onSuccess?: () => void;
  className?: string;
  showApple?: boolean;
}

export default function WebSSOButtons({
  onSuccess,
  className = "",
  showApple = true,
}: WebSSOButtonsProps) {
  const [googleReady, setGoogleReady] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Ref solo para inicializar (no para renderButton)
  const googleInitialized = useRef(false);

  // ── Cargar Google Identity Services ────────────────────────────────────────

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id || googleInitialized.current) return;
      googleInitialized.current = true;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setGoogleReady(true);
    };

    // Si el script ya está cargado
    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    // Si el script ya está en el DOM pero aún no ejecutó
    if (document.getElementById("google-gsi-script")) {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    // Cargar el script por primera vez
    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, []);

  // ── Cargar Apple Sign In JS ─────────────────────────────────────────────────

  useEffect(() => {
    if (!showApple) return;
    if (document.getElementById("apple-signin-script")) return;

    const script = document.createElement("script");
    script.id = "apple-signin-script";
    script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    script.onload = () => {
      if (window.AppleID?.auth) {
        window.AppleID.auth.init({
          clientId: APPLE_CLIENT_ID,
          scope: "name email",
          redirectURI: `${window.location.origin}/api/auth/apple/callback`,
          state: btoa(window.location.origin),
          usePopup: true,
        });
      }
    };
    document.head.appendChild(script);
  }, [showApple]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleGoogleCredential = async (response: { credential: string }) => {
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken: response.credential }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Error al iniciar sesión con Google");
      }

      toast.success("Sesión iniciada con Google", { description: "Bienvenido a BuddyMarket" });
      onSuccess?.();
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      toast.error("Error con Google", { description: err.message });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("Google SSO no configurado", { description: "Añade VITE_GOOGLE_CLIENT_ID en los secretos" });
      return;
    }
    if (!googleReady || !window.google?.accounts?.id) {
      toast.info("Google se está cargando", { description: "Espera un momento e inténtalo de nuevo" });
      return;
    }
    // Abrir el selector de cuenta de Google mediante prompt()
    window.google.accounts.id.prompt((notification) => {
      if (notification?.isNotDisplayed() || notification?.isSkippedMoment()) {
        // El prompt fue bloqueado (cookies de terceros, etc.) — mostrar aviso
        toast.info("Ventana de Google bloqueada", {
          description: "Habilita las cookies de terceros o usa el acceso con email",
        });
      }
    });
  };

  const handleAppleSignIn = async () => {
    if (!window.AppleID?.auth) {
      toast.error("Apple Sign In no disponible", { description: "Usa Safari o un dispositivo Apple" });
      return;
    }

    setAppleLoading(true);
    try {
      const data = await window.AppleID.auth.signIn();
      const identityToken = data.authorization.id_token;
      const fullName = data.user?.name
        ? { givenName: data.user.name.firstName, familyName: data.user.name.lastName }
        : null;
      const email = data.user?.email ?? null;

      const res = await fetch("/api/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identityToken, fullName, email }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Error al iniciar sesión con Apple");
      }

      toast.success("Sesión iniciada con Apple", { description: "Bienvenido a BuddyMarket" });
      onSuccess?.();
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      if (err?.error === "popup_closed_by_user") return;
      toast.error("Error con Apple", { description: err.message });
    } finally {
      setAppleLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* ── Botón de Google — siempre visible, nativo ── */}
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 cursor-pointer"
      >
        {googleLoading ? <Spinner /> : <GoogleIcon />}
        <span>{googleLoading ? "Iniciando sesión..." : "Continuar con Google"}</span>
      </button>

      {/* ── Botón de Apple — siempre visible ── */}
      {showApple && (
        <button
          type="button"
          onClick={handleAppleSignIn}
          disabled={appleLoading}
          className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-900 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 cursor-pointer"
        >
          {appleLoading ? <Spinner /> : <AppleIcon />}
          <span>{appleLoading ? "Iniciando sesión..." : "Continuar con Apple"}</span>
        </button>
      )}
    </div>
  );
}
