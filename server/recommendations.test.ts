import { describe, it, expect, beforeAll } from "vitest";

/**
 * Test para validar que las credenciales de BuddyShop y BuddyCare están configuradas correctamente
 */

describe("External APIs Configuration", () => {
  let buddyshopKey: string;
  let buddyshopUrl: string;
  let buddycareKey: string;
  let buddycareUrl: string;
  let buddycareWebhookSecret: string;

  beforeAll(() => {
    buddyshopKey = process.env.BUDDYSHOP_API_KEY || "";
    buddyshopUrl = process.env.BUDDYSHOP_API_URL || "";
    buddycareKey = process.env.BUDDYCARE_API_KEY || "";
    buddycareUrl = process.env.BUDDYCARE_API_URL || "";
    buddycareWebhookSecret = process.env.BUDDYCARE_WEBHOOK_SECRET || "";
  });

  it("should have BuddyShop API key configured", () => {
    expect(buddyshopKey).toBeTruthy();
    expect(buddyshopKey).toMatch(/^bshop_/);
  });

  it("should have BuddyShop API URL configured", () => {
    expect(buddyshopUrl).toBeTruthy();
    expect(buddyshopUrl).toContain("buddyshop");
  });

  it("should have BuddyCare API key configured", () => {
    expect(buddycareKey).toBeTruthy();
    expect(buddycareKey).toMatch(/^sk_(test|live|enterprise)_/);
  });

  it("should have BuddyCare API URL configured", () => {
    expect(buddycareUrl).toBeTruthy();
    expect(buddycareUrl).toContain("buddycare");
  });

  it("should have BuddyCare webhook secret configured", () => {
    expect(buddycareWebhookSecret).toBeTruthy();
    expect(buddycareWebhookSecret).toMatch(/^whsec_/);
  });

  it("should validate BuddyShop API key format", () => {
    const parts = buddyshopKey.split("_");
    expect(parts[0]).toBe("bshop");
    expect(buddyshopKey.length).toBeGreaterThan(20);
  });

  it("should validate BuddyCare API key format", () => {
    const parts = buddycareKey.split("_");
    expect(["sk"].includes(parts[0])).toBe(true);
    // BuddyCare key format: sk_[environment]_[identifier]_[hash]
    // So parts[1] contains the environment (test, live, enterprise)
    expect(["test", "live", "enterprise"].includes(parts[1])).toBe(true);
    expect(buddycareKey.length).toBeGreaterThan(30);
  });


  it("should validate BuddyCare webhook secret format", () => {
    const parts = buddycareWebhookSecret.split("_");
    expect(parts[0]).toBe("whsec");
    expect(buddycareWebhookSecret.length).toBeGreaterThan(20);
  });

  it("should have all required environment variables", () => {
    const required = {
      BUDDYSHOP_API_KEY: buddyshopKey,
      BUDDYSHOP_API_URL: buddyshopUrl,
      BUDDYCARE_API_KEY: buddycareKey,
      BUDDYCARE_API_URL: buddycareUrl,
      BUDDYCARE_WEBHOOK_SECRET: buddycareWebhookSecret,
    };

    Object.entries(required).forEach(([key, value]) => {
      expect(value, `${key} should be configured`).toBeTruthy();
    });
  });
});
