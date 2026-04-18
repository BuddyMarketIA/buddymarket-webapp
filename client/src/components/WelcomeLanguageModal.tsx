import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "buddymarket_language_confirmed";

/**
 * Detects the browser language and maps it to a supported language code.
 * Mirrors the logic in i18n.ts mapToSupported.
 */
function detectBrowserLanguage(): LanguageCode {
  const supported: LanguageCode[] = ["es", "en", "fr", "it"];
  const REGIONAL_MAP: Record<string, LanguageCode> = {
    ca: "es", gl: "es", eu: "es", pt: "es",
    ro: "it", la: "it",
    de: "en", nl: "en", sv: "en", no: "en", da: "en",
    fi: "en", pl: "en", ru: "en", zh: "en", ja: "en", ko: "en", ar: "en",
  };

  const browserLang = navigator.language || "es";
  const base = browserLang.split("-")[0].toLowerCase();

  if (supported.includes(base as LanguageCode)) return base as LanguageCode;
  return REGIONAL_MAP[base] ?? "es";
}

export default function WelcomeLanguageModal() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<LanguageCode>("es");
  const [detectedLang, setDetectedLang] = useState<LanguageCode>("es");

  useEffect(() => {
    // Only show on first visit — if user has never confirmed a language
    const confirmed = localStorage.getItem(STORAGE_KEY);
    if (confirmed) return;

    const detected = detectBrowserLanguage();
    setDetectedLang(detected);
    setSelected(detected);

    const COOKIE_CONSENT_KEY = "buddymarket_cookie_consent";
    const cookiesAlreadyAccepted = !!localStorage.getItem(COOKIE_CONSENT_KEY);

    if (cookiesAlreadyAccepted) {
      // Cookies ya aceptadas en visita anterior → mostrar idioma directamente
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    } else {
      // Esperar a que el usuario resuelva el banner de cookies primero
      const handleCookieDone = () => {
        setTimeout(() => setOpen(true), 400);
      };
      window.addEventListener("cookieConsentDone", handleCookieDone);
      return () => window.removeEventListener("cookieConsentDone", handleCookieDone);
    }
  }, []);

  const handleConfirm = () => {
    i18n.changeLanguage(selected);
    localStorage.setItem("buddymarket_language", selected);
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === selected);
  const detectedLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === detectedLang);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleConfirm(); }}>
      <DialogContent
        className="max-w-sm rounded-3xl p-0 overflow-hidden border-0 shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-400 px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-background/20 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
            🌍
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            ¡Bienvenido a BuddyMarket!
          </h2>
          <p className="text-sm text-white/80 mt-1">
            Hemos detectado tu idioma:{" "}
            <span className="font-bold text-white">
              {detectedLangInfo?.flag} {detectedLangInfo?.name}
            </span>
          </p>
        </div>

        {/* Language picker */}
        <div className="px-6 py-5">
          <p className="text-sm font-semibold text-muted-foreground mb-3 text-center">
            ¿Confirmas o prefieres otro idioma?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selected === lang.code;
              const isDetected = detectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setSelected(lang.code)}
                  className={`
                    relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left
                    ${isSelected
                      ? "border-orange-500 bg-orange-50 shadow-md"
                      : "border-border bg-card hover:border-orange-300 hover:bg-orange-50/50"
                    }
                  `}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${isSelected ? "text-orange-600" : "text-foreground"}`}>
                      {lang.name}
                    </p>
                    {isDetected && (
                      <p className="text-xs text-muted-foreground">Detectado</p>
                    )}
                  </div>
                  {isSelected && (
                    <span className="absolute top-2 right-2 text-orange-500 text-xs font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm button */}
        <div className="px-6 pb-6">
          <Button
            onClick={handleConfirm}
            className="w-full h-12 rounded-2xl text-base font-bold bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 shadow-lg shadow-orange-200 border-0"
          >
            {currentLangInfo?.flag} Continuar en {currentLangInfo?.name}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Puedes cambiar el idioma en cualquier momento desde tu perfil.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
