import { describe, expect, it, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const LOCALES_DIR = path.join(process.cwd(), "client/public/locales");
const LANGUAGES = ["es", "en", "fr", "it"];

// Critical keys that must exist in all languages for the app to work
const REQUIRED_KEYS = [
  // Navigation
  "nav.home",
  "nav.recipes",
  "nav.diary",
  "nav.menus",
  "nav.profile",
  "nav.supermarkets",
  "nav.inventory",
  "nav.scan",
  // Sidebar
  "sidebar.principal",
  "sidebar.nutrition",
  "sidebar.shopping",
  "sidebar.logout",
  "sidebar.loggingOut",
  "sidebar.myProfile",
  "sidebar.shoppingList",
  "sidebar.supermarkets",
  // Dashboard
  "dashboard.morningGreeting",
  "dashboard.afternoonGreeting",
  "dashboard.eveningGreeting",
  "dashboard.recipeOfDay",
  "dashboard.quickAccess",
  "dashboard.shoppingList",
  "dashboard.reminders",
  "dashboard.achievements",
  "dashboard.recipeSubtitle",
  "dashboard.menuSubtitle",
  // Home/Landing
  "home.hero",
  "home.heroTitle1",
  "home.heroTitle2",
  "home.heroDesc",
  "home.getStarted",
  "home.noCard",
  "home.enter",
  "home.features.title",
  "home.features.recipes",
  "home.features.menus",
  "home.features.shopping",
  "home.features.inventory",
  "home.howItWorks.title",
  "home.howItWorks.step1Title",
  "home.howItWorks.step2Title",
  "home.howItWorks.step3Title",
  "home.pricing.title",
  "home.pricing.basicName",
  "home.pricing.premiumName",
  "home.cta.title",
  "home.cta.button",
  // Common
  "common.seeMore",
];

function getNestedValue(obj: Record<string, any>, keyPath: string): string | undefined {
  const parts = keyPath.split(".");
  let current: any = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

describe("i18n Translation Files", () => {
  const translations: Record<string, Record<string, any>> = {};

  beforeAll(() => {
    for (const lang of LANGUAGES) {
      const filePath = path.join(LOCALES_DIR, lang, "translation.json");
      const content = fs.readFileSync(filePath, "utf-8");
      translations[lang] = JSON.parse(content);
    }
  });

  it("all translation files should exist and be valid JSON", () => {
    for (const lang of LANGUAGES) {
      expect(translations[lang]).toBeDefined();
      expect(typeof translations[lang]).toBe("object");
    }
  });

  for (const key of REQUIRED_KEYS) {
    it(`key "${key}" should exist in all languages`, () => {
      for (const lang of LANGUAGES) {
        const value = getNestedValue(translations[lang], key);
        expect(value, `Missing key "${key}" in language "${lang}"`).toBeDefined();
        expect(value!.length, `Empty value for key "${key}" in language "${lang}"`).toBeGreaterThan(0);
      }
    });
  }

  it("English translations should differ from Spanish for key nav.home", () => {
    const es = getNestedValue(translations["es"], "nav.home");
    const en = getNestedValue(translations["en"], "nav.home");
    expect(es).toBeDefined();
    expect(en).toBeDefined();
    expect(es).not.toBe(en);
  });

  it("sidebar.logout should be translated in all languages", () => {
    const expected: Record<string, string> = {
      es: "Cerrar sesión",
      en: "Log out",
      fr: "Se déconnecter",
      it: "Disconnetti",
    };
    for (const [lang, expectedValue] of Object.entries(expected)) {
      const value = getNestedValue(translations[lang], "sidebar.logout");
      expect(value).toBe(expectedValue);
    }
  });
});
