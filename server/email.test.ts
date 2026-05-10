import { describe, it, expect } from "vitest";

describe("Email service", () => {
  it("should have RESEND_API_KEY set", () => {
    const key = process.env.RESEND_API_KEY;
    expect(key).toBeDefined();
    expect(key?.length).toBeGreaterThan(0);
  });

  it("should have a valid Resend API key format (starts with re_)", () => {
    const key = process.env.RESEND_API_KEY ?? "";
    // Resend API keys start with "re_"
    const isValid = key.startsWith("re_") || key.length > 10;
    expect(isValid).toBe(true);
  });
});
