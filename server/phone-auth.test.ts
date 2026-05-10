import { describe, it, expect, vi } from "vitest";
import { normalizePhone, isValidPhone } from "./sms";

describe("Phone Auth - normalizePhone", () => {
  it("keeps E.164 format unchanged", () => {
    expect(normalizePhone("+34612345678")).toBe("+34612345678");
  });

  it("converts 00 prefix to +", () => {
    expect(normalizePhone("0034612345678")).toBe("+34612345678");
  });

  it("adds +34 to 9-digit Spanish numbers", () => {
    expect(normalizePhone("612345678")).toBe("+34612345678");
  });

  it("strips spaces and dashes", () => {
    expect(normalizePhone("+34 612 345 678")).toBe("+34612345678");
    expect(normalizePhone("+34-612-345-678")).toBe("+34612345678");
  });
});

describe("Phone Auth - isValidPhone", () => {
  it("accepts valid E.164 numbers", () => {
    expect(isValidPhone("+34612345678")).toBe(true);
    expect(isValidPhone("+17405677620")).toBe(true);
    expect(isValidPhone("+447911123456")).toBe(true);
  });

  it("rejects invalid numbers", () => {
    expect(isValidPhone("612345678")).toBe(false);
    expect(isValidPhone("+1")).toBe(false);
    expect(isValidPhone("notanumber")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
});

describe("Phone Auth - Twilio credentials", () => {
  it("TWILIO_ACCOUNT_SID is configured", () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    expect(sid).toBeTruthy();
    expect(sid).toMatch(/^AC/);
  });

  it("TWILIO_AUTH_TOKEN is configured", () => {
    const token = process.env.TWILIO_AUTH_TOKEN;
    expect(token).toBeTruthy();
    expect(token!.length).toBeGreaterThan(10);
  });

  it("TWILIO_PHONE_NUMBER is configured in E.164 format", () => {
    const phone = process.env.TWILIO_PHONE_NUMBER;
    expect(phone).toBeTruthy();
    expect(phone).toMatch(/^\+[1-9]\d{6,14}$/);
  });
});
