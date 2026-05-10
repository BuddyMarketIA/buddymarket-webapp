import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Cookie, ChevronDown, ChevronUp, Shield, BarChart3, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const COOKIE_CONSENT_KEY = "buddymarket_cookie_consent";

export interface CookiePreferences {
  necessary: boolean;   // always true, cannot be disabled
  analytics: boolean;   // Google Analytics, Sentry
  marketing: boolean;   // Stripe, retargeting
}

function getStoredConsent(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function storeConsent(prefs: CookiePreferences) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ ...prefs, timestamp: Date.now() }));
}

export function useCookieConsent() {
  const stored = getStoredConsent();
  return stored;
}

export default function CookieBanner() {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  const dismissBanner = () => {
    setVisible(false);
    // Notificar al WelcomeLanguageModal que puede mostrarse ahora
    window.dispatchEvent(new CustomEvent("cookieConsentDone"));
  };

  const handleAcceptAll = () => {
    const all: CookiePreferences = { necessary: true, analytics: true, marketing: true };
    storeConsent(all);
    dismissBanner();
  };

  const handleRejectAll = () => {
    const minimal: CookiePreferences = { necessary: true, analytics: false, marketing: false };
    storeConsent(minimal);
    dismissBanner();
  };

  const handleSavePrefs = () => {
    storeConsent(prefs);
    dismissBanner();
  };

  // Buddy One is a Spanish-first product — always show cookie banner in Spanish
  const lang = "es";

  const texts: Record<string, {
    title: string; desc: string; acceptAll: string; rejectAll: string; customize: string;
    save: string; necessary: string; necessaryDesc: string; analytics: string; analyticsDesc: string;
    marketing: string; marketingDesc: string; alwaysOn: string; learnMore: string;
  }> = {
    es: {
      title: "Usamos cookies",
      desc: "Utilizamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y personalizar el contenido. Puedes aceptarlas todas, rechazarlas o configurar tus preferencias.",
      acceptAll: "Aceptar todas",
      rejectAll: "Solo necesarias",
      customize: "Personalizar",
      save: "Guardar preferencias",
      necessary: "Cookies necesarias",
      necessaryDesc: "Imprescindibles para el funcionamiento de la app: autenticación, seguridad y preferencias básicas. No se pueden desactivar.",
      analytics: "Cookies analíticas",
      analyticsDesc: "Nos ayudan a entender cómo usas la app (Sentry para errores, métricas de rendimiento). Sin datos personales identificables.",
      marketing: "Cookies de marketing",
      marketingDesc: "Usadas por Stripe para el procesamiento de pagos y prevención de fraude. Necesarias si realizas compras.",
      alwaysOn: "Siempre activas",
      learnMore: "Más información",
    },
    en: {
      title: "We use cookies",
      desc: "We use our own and third-party cookies to improve your experience, analyze traffic, and personalize content. You can accept all, reject them, or configure your preferences.",
      acceptAll: "Accept all",
      rejectAll: "Necessary only",
      customize: "Customize",
      save: "Save preferences",
      necessary: "Necessary cookies",
      necessaryDesc: "Essential for the app to work: authentication, security and basic preferences. Cannot be disabled.",
      analytics: "Analytics cookies",
      analyticsDesc: "Help us understand how you use the app (Sentry for errors, performance metrics). No personally identifiable data.",
      marketing: "Marketing cookies",
      marketingDesc: "Used by Stripe for payment processing and fraud prevention. Required if you make purchases.",
      alwaysOn: "Always on",
      learnMore: "Learn more",
    },
    fr: {
      title: "Nous utilisons des cookies",
      desc: "Nous utilisons des cookies propres et tiers pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. Vous pouvez tout accepter, refuser ou configurer vos préférences.",
      acceptAll: "Tout accepter",
      rejectAll: "Nécessaires seulement",
      customize: "Personnaliser",
      save: "Enregistrer les préférences",
      necessary: "Cookies nécessaires",
      necessaryDesc: "Indispensables au fonctionnement de l'application : authentification, sécurité et préférences de base. Ne peuvent pas être désactivés.",
      analytics: "Cookies analytiques",
      analyticsDesc: "Nous aident à comprendre comment vous utilisez l'application (Sentry pour les erreurs, métriques de performance).",
      marketing: "Cookies marketing",
      marketingDesc: "Utilisés par Stripe pour le traitement des paiements et la prévention des fraudes.",
      alwaysOn: "Toujours actifs",
      learnMore: "En savoir plus",
    },
    it: {
      title: "Utilizziamo i cookie",
      desc: "Utilizziamo cookie propri e di terze parti per migliorare la tua esperienza, analizzare il traffico e personalizzare i contenuti. Puoi accettarli tutti, rifiutarli o configurare le tue preferenze.",
      acceptAll: "Accetta tutti",
      rejectAll: "Solo necessari",
      customize: "Personalizza",
      save: "Salva preferenze",
      necessary: "Cookie necessari",
      necessaryDesc: "Indispensabili per il funzionamento dell'app: autenticazione, sicurezza e preferenze di base. Non possono essere disattivati.",
      analytics: "Cookie analitici",
      analyticsDesc: "Ci aiutano a capire come usi l'app (Sentry per gli errori, metriche di performance).",
      marketing: "Cookie di marketing",
      marketingDesc: "Utilizzati da Stripe per l'elaborazione dei pagamenti e la prevenzione delle frodi.",
      alwaysOn: "Sempre attivi",
      learnMore: "Ulteriori informazioni",
    },
  };

  const tx = texts[lang] || texts.es;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto bg-background rounded-2xl shadow-2xl border border-orange-100 overflow-hidden">
        {/* Main banner */}
        <div className="p-5 md:p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Cookie className="w-5 h-5 text-orange-500" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-base mb-1">{tx.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{tx.desc}</p>

              {/* Cookie details (expandable) */}
              {showDetails && (
                <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                  {/* Necessary */}
                  <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{tx.necessary}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tx.necessaryDesc}</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium whitespace-nowrap mt-0.5">{tx.alwaysOn}</span>
                  </div>

                  {/* Analytics */}
                  <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{tx.analytics}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tx.analyticsDesc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={prefs.analytics}
                      onCheckedChange={(v) => setPrefs(p => ({ ...p, analytics: v }))}
                      className="flex-shrink-0 mt-0.5"
                    />
                  </div>

                  {/* Marketing */}
                  <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Megaphone className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{tx.marketing}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tx.marketingDesc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={prefs.marketing}
                      onCheckedChange={(v) => setPrefs(p => ({ ...p, marketing: v }))}
                      className="flex-shrink-0 mt-0.5"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2 md:gap-3">
            <Button
              onClick={handleAcceptAll}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-5 py-2 text-sm flex-1 md:flex-none"
            >
              {tx.acceptAll}
            </Button>
            <Button
              onClick={handleRejectAll}
              variant="outline"
              className="border-border text-foreground/80 hover:bg-muted/30 font-medium rounded-xl px-5 py-2 text-sm flex-1 md:flex-none"
            >
              {tx.rejectAll}
            </Button>
            {showDetails ? (
              <Button
                onClick={handleSavePrefs}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50 font-medium rounded-xl px-5 py-2 text-sm flex-1 md:flex-none"
              >
                {tx.save}
              </Button>
            ) : (
              <button
                onClick={() => setShowDetails(true)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-orange-500 transition-colors px-2 py-2"
              >
                {tx.customize}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
            {showDetails && (
              <button
                onClick={() => setShowDetails(false)}
                className="flex items-center gap-1 text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors px-2 py-2"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}
            <a
              href="/cookies"
              className="text-xs text-muted-foreground/70 hover:text-orange-500 transition-colors ml-auto"
            >
              {tx.learnMore}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
