import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const LOCALES = ["es", "en", "fr", "it"];
const LOCALES_DIR = join(__dirname, "../client/public/locales");

function loadTranslation(lang: string) {
  const filePath = join(LOCALES_DIR, lang, "translation.json");
  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

function getAllKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      return getAllKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

describe("i18n translations", () => {
  it("all locale files exist and are valid JSON", () => {
    for (const lang of LOCALES) {
      const translation = loadTranslation(lang);
      expect(translation).toBeDefined();
      expect(typeof translation).toBe("object");
    }
  });

  it("all locales have the same top-level keys as Spanish", () => {
    const esKeys = Object.keys(loadTranslation("es")).sort();
    for (const lang of LOCALES.filter((l) => l !== "es")) {
      const langKeys = Object.keys(loadTranslation(lang)).sort();
      expect(langKeys).toEqual(esKeys);
    }
  });

  it("no locale has empty string values", () => {
    for (const lang of LOCALES) {
      const translation = loadTranslation(lang);
      const keys = getAllKeys(translation);
      for (const key of keys) {
        const parts = key.split(".");
        let val: unknown = translation;
        for (const part of parts) {
          val = (val as Record<string, unknown>)[part];
        }
        expect(typeof val === "string" && val.length > 0, `${lang}.${key} is empty`).toBe(true);
      }
    }
  });

  it("Spanish has at least 20 translation keys", () => {
    const esTranslation = loadTranslation("es");
    const keys = getAllKeys(esTranslation);
    expect(keys.length).toBeGreaterThanOrEqual(20);
  });

  it("all supported languages are defined", () => {
    const supported = ["es", "en", "fr", "it"];
    for (const lang of supported) {
      expect(() => loadTranslation(lang)).not.toThrow();
    }
  });
});

// Replicate mapToSupported logic from i18n.ts for unit testing
const SUPPORTED = ["es", "en", "fr", "it"] as const;
type LanguageCode = (typeof SUPPORTED)[number];

function mapToSupported(browserLang: string): LanguageCode {
  const base = browserLang.split("-")[0].toLowerCase();
  if ((SUPPORTED as readonly string[]).includes(base)) return base as LanguageCode;
  const REGIONAL_MAP: Record<string, LanguageCode> = {
    ca: "es", gl: "es", eu: "es", pt: "es",
    ro: "it", la: "it",
    de: "en", nl: "en", sv: "en", no: "en", da: "en",
    fi: "en", pl: "en", ru: "en", zh: "en", ja: "en", ko: "en", ar: "en",
  };
  return REGIONAL_MAP[base] ?? "es";
}

describe("i18n browser language detection", () => {
  it("maps exact supported languages correctly", () => {
    expect(mapToSupported("es")).toBe("es");
    expect(mapToSupported("en")).toBe("en");
    expect(mapToSupported("fr")).toBe("fr");
    expect(mapToSupported("it")).toBe("it");
  });

  it("maps regional variants to base language", () => {
    expect(mapToSupported("es-MX")).toBe("es");
    expect(mapToSupported("es-AR")).toBe("es");
    expect(mapToSupported("en-US")).toBe("en");
    expect(mapToSupported("en-GB")).toBe("en");
    expect(mapToSupported("fr-CA")).toBe("fr");
    expect(mapToSupported("it-CH")).toBe("it");
  });

  it("maps Catalan and Galician to Spanish", () => {
    expect(mapToSupported("ca")).toBe("es");
    expect(mapToSupported("gl")).toBe("es");
    expect(mapToSupported("eu")).toBe("es");
  });

  it("maps Portuguese to Spanish (closest Latin)", () => {
    expect(mapToSupported("pt")).toBe("es");
    expect(mapToSupported("pt-BR")).toBe("es");
  });

  it("maps Romanian to Italian (closest Latin)", () => {
    expect(mapToSupported("ro")).toBe("it");
  });

  it("maps Germanic/Nordic/Slavic/Asian languages to English", () => {
    expect(mapToSupported("de")).toBe("en");
    expect(mapToSupported("nl")).toBe("en");
    expect(mapToSupported("sv")).toBe("en");
    expect(mapToSupported("zh")).toBe("en");
    expect(mapToSupported("ja")).toBe("en");
    expect(mapToSupported("ar")).toBe("en");
  });

  it("falls back to Spanish for unknown languages", () => {
    expect(mapToSupported("xx")).toBe("es");
    expect(mapToSupported("zz-ZZ")).toBe("es");
  });

  it("handles uppercase browser locales", () => {
    expect(mapToSupported("ES")).toBe("es");
    expect(mapToSupported("EN-US")).toBe("en");
    expect(mapToSupported("FR-FR")).toBe("fr");
  });
});
