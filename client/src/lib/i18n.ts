import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

const SUPPORTED = ["es", "en", "fr", "it"] as const;
export type LanguageCode = (typeof SUPPORTED)[number];

/**
 * Maps any browser locale to the closest supported language.
 * Examples: "es-MX" → "es", "en-US" → "en", "pt-BR" → "es" (fallback), "ca" → "es"
 */
function mapToSupported(browserLang: string): LanguageCode {
  const base = browserLang.split("-")[0].toLowerCase();
  // Direct match
  if ((SUPPORTED as readonly string[]).includes(base)) return base as LanguageCode;
  // Regional mappings to closest supported language
  const REGIONAL_MAP: Record<string, LanguageCode> = {
    ca: "es", // Catalan → Spanish
    gl: "es", // Galician → Spanish
    eu: "es", // Basque → Spanish
    pt: "es", // Portuguese → Spanish (closest Latin)
    ro: "it", // Romanian → Italian (closest Latin)
    la: "it", // Latin → Italian
    de: "en", // German → English
    nl: "en", // Dutch → English
    sv: "en", // Swedish → English
    no: "en", // Norwegian → English
    da: "en", // Danish → English
    fi: "en", // Finnish → English
    pl: "en", // Polish → English
    ru: "en", // Russian → English
    zh: "en", // Chinese → English
    ja: "en", // Japanese → English
    ko: "en", // Korean → English
    ar: "en", // Arabic → English
  };
  return REGIONAL_MAP[base] ?? "es"; // Default to Spanish
}

/**
 * Resolves the initial language for the session:
 * 1. User's saved preference in localStorage (highest priority)
 * 2. Default to Spanish — Buddy One is a Spanish-first product
 */
function resolveInitialLanguage(): LanguageCode {
  // 1. Check localStorage first (returning user who explicitly changed language)
  const saved = localStorage.getItem("buddymarket_language") as LanguageCode | null;
  if (saved && (SUPPORTED as readonly string[]).includes(saved)) {
    return saved;
  }

  // 2. Buddy One is a Spanish-first product — always default to Spanish
  // Users can change language from the sidebar language selector
  return "es";
}

const initialLanguage = resolveInitialLanguage();

// Persist the detected language so subsequent visits remember it
if (!localStorage.getItem("buddymarket_language")) {
  localStorage.setItem("buddymarket_language", initialLanguage);
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: initialLanguage, // Set resolved language directly
    fallbackLng: "es",
    supportedLngs: [...SUPPORTED],
    defaultNS: "translation",
    ns: ["translation"],
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      // Still use detector as backup, but our custom resolution takes priority
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "buddymarket_language",
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;

export const SUPPORTED_LANGUAGES = [
  { code: "es" as LanguageCode, name: "Español", flag: "🇪🇸" },
  { code: "en" as LanguageCode, name: "English", flag: "🇬🇧" },
  { code: "fr" as LanguageCode, name: "Français", flag: "🇫🇷" },
  { code: "it" as LanguageCode, name: "Italiano", flag: "🇮🇹" },
] as const;

export { mapToSupported, resolveInitialLanguage };
