import { describe, it, expect } from "vitest";

describe("BuddyCoach Integration", () => {
  it("should have BUDDYCOACH_API_URL configured", () => {
    const apiUrl = process.env.BUDDYCOACH_API_URL;
    expect(apiUrl).toBeDefined();
    expect(apiUrl).toBe("https://buddycoach.io");
  });

  it("should have ECOSYSTEM_SECRET configured", () => {
    const secret = process.env.ECOSYSTEM_SECRET;
    expect(secret).toBeDefined();
    expect(secret).toBe("buddyone-ecosystem-2026");
  });

  it("should validate BUDDYCOACH_API_URL format", () => {
    const apiUrl = process.env.BUDDYCOACH_API_URL;
    expect(apiUrl).toMatch(/^https:\/\//);
  });

  it("should validate ECOSYSTEM_SECRET format", () => {
    const secret = process.env.ECOSYSTEM_SECRET;
    expect(secret).toMatch(/^buddyone-ecosystem-/);
  });

  it("should be able to construct ecosystem request headers", () => {
    const secret = process.env.ECOSYSTEM_SECRET;
    const headers = {
      "x-ecosystem-secret": secret,
      "x-source-app": "buddyone",
    };
    expect(headers["x-ecosystem-secret"]).toBe("buddyone-ecosystem-2026");
    expect(headers["x-source-app"]).toBe("buddyone");
  });
});
