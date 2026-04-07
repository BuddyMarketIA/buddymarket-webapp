import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Shield, BarChart3, Megaphone, CheckCircle2, Cookie } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const COOKIE_CONSENT_KEY = "buddymarket_cookie_consent";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

function getStoredConsent(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as CookiePreferences;
  } catch {
    return null;
  }
}

function saveConsent(prefs: CookiePreferences) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ ...prefs, timestamp: Date.now() }));
}

// i18n labels per language
const LABELS: Record<string, {
  title: string; subtitle: string; lastUpdated: string; notConfigured: string;
  necessary: string; necessaryDesc: string;
  analytics: string; analyticsDesc: string;
  marketing: string; marketingDesc: string;
  alwaysOn: string; saveBtn: string; acceptAll: string; rejectAll: string;
  savedToast: string;
}> = {
  es: {
    title: "Preferencias de cookies",
    subtitle: "Gestiona qué cookies aceptas en BuddyMarket. Puedes cambiar tus preferencias en cualquier momento.",
    lastUpdated: "Última actualización",
    notConfigured: "Aún no has configurado tus preferencias de cookies.",
    necessary: "Cookies necesarias",
    necessaryDesc: "Imprescindibles para el funcionamiento de la app: autenticación, seguridad y preferencias básicas. No se pueden desactivar.",
    analytics: "Cookies analíticas",
    analyticsDesc: "Nos ayudan a entender cómo usas la app (Sentry para errores, métricas de rendimiento). Sin datos personales identificables.",
    marketing: "Cookies de marketing",
    marketingDesc: "Usadas por Stripe para el procesamiento de pagos y prevención de fraude. Necesarias si realizas compras.",
    alwaysOn: "Siempre activas",
    saveBtn: "Guardar preferencias",
    acceptAll: "Aceptar todas",
    rejectAll: "Solo necesarias",
    savedToast: "Preferencias de cookies guardadas",
  },
  en: {
    title: "Cookie preferences",
    subtitle: "Manage which cookies you accept on BuddyMarket. You can change your preferences at any time.",
    lastUpdated: "Last updated",
    notConfigured: "You haven't configured your cookie preferences yet.",
    necessary: "Necessary cookies",
    necessaryDesc: "Essential for the app to work: authentication, security and basic preferences. Cannot be disabled.",
    analytics: "Analytics cookies",
    analyticsDesc: "Help us understand how you use the app (Sentry for errors, performance metrics). No personally identifiable data.",
    marketing: "Marketing cookies",
    marketingDesc: "Used by Stripe for payment processing and fraud prevention. Required if you make purchases.",
    alwaysOn: "Always on",
    saveBtn: "Save preferences",
    acceptAll: "Accept all",
    rejectAll: "Necessary only",
    savedToast: "Cookie preferences saved",
  },
  fr: {
    title: "Préférences de cookies",
    subtitle: "Gérez les cookies que vous acceptez sur BuddyMarket. Vous pouvez modifier vos préférences à tout moment.",
    lastUpdated: "Dernière mise à jour",
    notConfigured: "Vous n'avez pas encore configuré vos préférences de cookies.",
    necessary: "Cookies nécessaires",
    necessaryDesc: "Indispensables au fonctionnement de l'application : authentification, sécurité et préférences de base. Ils ne peuvent pas être désactivés.",
    analytics: "Cookies analytiques",
    analyticsDesc: "Nous aident à comprendre comment vous utilisez l'application (Sentry pour les erreurs, métriques de performance). Aucune donnée personnelle identifiable.",
    marketing: "Cookies marketing",
    marketingDesc: "Utilisés par Stripe pour le traitement des paiements et la prévention des fraudes. Nécessaires si vous effectuez des achats.",
    alwaysOn: "Toujours actifs",
    saveBtn: "Enregistrer les préférences",
    acceptAll: "Tout accepter",
    rejectAll: "Nécessaires uniquement",
    savedToast: "Préférences de cookies enregistrées",
  },
  it: {
    title: "Preferenze cookie",
    subtitle: "Gestisci quali cookie accetti su BuddyMarket. Puoi modificare le tue preferenze in qualsiasi momento.",
    lastUpdated: "Ultimo aggiornamento",
    notConfigured: "Non hai ancora configurato le tue preferenze sui cookie.",
    necessary: "Cookie necessari",
    necessaryDesc: "Indispensabili per il funzionamento dell'app: autenticazione, sicurezza e preferenze di base. Non possono essere disattivati.",
    analytics: "Cookie analitici",
    analyticsDesc: "Ci aiutano a capire come usi l'app (Sentry per gli errori, metriche di prestazione). Nessun dato personale identificabile.",
    marketing: "Cookie di marketing",
    marketingDesc: "Utilizzati da Stripe per l'elaborazione dei pagamenti e la prevenzione delle frodi. Necessari se effettui acquisti.",
    alwaysOn: "Sempre attivi",
    saveBtn: "Salva preferenze",
    acceptAll: "Accetta tutto",
    rejectAll: "Solo necessari",
    savedToast: "Preferenze cookie salvate",
  },
};

export default function CookiePreferencesPanel() {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.slice(0, 2) as keyof typeof LABELS) in LABELS
    ? (i18n.language.slice(0, 2) as keyof typeof LABELS)
    : "es";
  const L = LABELS[lang];

  const [prefs, setPrefs] = useState<CookiePreferences>({ necessary: true, analytics: false, marketing: false });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setPrefs({ necessary: true, analytics: stored.analytics, marketing: stored.marketing });
      const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.timestamp) setLastUpdated(new Date(parsed.timestamp));
        } catch { /* ignore */ }
      }
    }
  }, []);

  const handleSave = (overridePrefs?: CookiePreferences) => {
    const toSave = overridePrefs ?? prefs;
    saveConsent(toSave);
    setPrefs({ ...toSave, necessary: true });
    setLastUpdated(new Date());
    setSaved(true);
    toast.success(L.savedToast);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAcceptAll = () => handleSave({ necessary: true, analytics: true, marketing: true });
  const handleRejectAll = () => handleSave({ necessary: true, analytics: false, marketing: false });

  const cookieItems = [
    {
      key: "necessary" as const,
      icon: <Shield size={18} className="text-green-600" />,
      label: L.necessary,
      desc: L.necessaryDesc,
      alwaysOn: true,
      color: "bg-green-50 border-green-100",
    },
    {
      key: "analytics" as const,
      icon: <BarChart3 size={18} className="text-blue-600" />,
      label: L.analytics,
      desc: L.analyticsDesc,
      alwaysOn: false,
      color: "bg-blue-50 border-blue-100",
    },
    {
      key: "marketing" as const,
      icon: <Megaphone size={18} className="text-orange-600" />,
      label: L.marketing,
      desc: L.marketingDesc,
      alwaysOn: false,
      color: "bg-orange-50 border-orange-100",
    },
  ];

  return (
    <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: "1px solid #f3f4f6" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <Cookie size={18} color="#F97316" />
        <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {L.title}
        </p>
      </div>
      <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#6b7280", lineHeight: 1.6 }}>
        {L.subtitle}
      </p>

      {/* Last updated badge */}
      {lastUpdated && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", padding: "8px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", width: "fit-content" }}>
          <CheckCircle2 size={14} color="#16a34a" />
          <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>
            {L.lastUpdated}: {lastUpdated.toLocaleDateString(lang, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}

      {/* Cookie items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        {cookieItems.map((item) => (
          <div
            key={item.key}
            style={{ padding: "14px 16px", background: item.alwaysOn ? "#f9fafb" : "white", borderRadius: "12px", border: `1px solid ${item.alwaysOn ? "#e5e7eb" : "#f3f4f6"}`, display: "flex", alignItems: "flex-start", gap: "12px" }}
          >
            <div style={{ marginTop: "2px", flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#111827" }}>{item.label}</p>
                {item.alwaysOn ? (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "3px 8px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                    {L.alwaysOn}
                  </span>
                ) : (
                  <Switch
                    checked={prefs[item.key]}
                    onCheckedChange={(val) => setPrefs((p) => ({ ...p, [item.key]: val }))}
                  />
                )}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280", lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Button
          onClick={() => handleSave()}
          style={{ background: saved ? "#16a34a" : "#F97316", color: "white", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "background 0.2s", display: "flex", alignItems: "center", gap: "6px" }}
        >
          {saved && <CheckCircle2 size={15} />}
          {L.saveBtn}
        </Button>
        <Button
          variant="outline"
          onClick={handleAcceptAll}
          style={{ borderRadius: "10px", fontSize: "13px", fontWeight: 600 }}
        >
          {L.acceptAll}
        </Button>
        <Button
          variant="outline"
          onClick={handleRejectAll}
          style={{ borderRadius: "10px", fontSize: "13px", fontWeight: 600 }}
        >
          {L.rejectAll}
        </Button>
      </div>
    </div>
  );
}
