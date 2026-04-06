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
