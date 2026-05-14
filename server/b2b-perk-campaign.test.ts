import { describe, it, expect, vi } from "vitest";

// Mock the resend module
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "test_msg_123" }, error: null }),
    },
  })),
}));

describe("B2B Perk Campaign Email", () => {
  it("should export sendB2BPerkCampaignEmail function", async () => {
    const emailModule = await import("./email");
    expect(typeof emailModule.sendB2BPerkCampaignEmail).toBe("function");
  });

  it("should export sendB2BPerkCampaignBatch function", async () => {
    const emailModule = await import("./email");
    expect(typeof emailModule.sendB2BPerkCampaignBatch).toBe("function");
  });

  it("should export B2BPerkCampaignRecipient interface type", async () => {
    // Type check - if this compiles, the interface exists
    const recipient: import("./email").B2BPerkCampaignRecipient = {
      contactName: "Test User",
      contactEmail: "test@example.com",
      companyName: "Test Corp",
      employeeCount: 500,
    };
    expect(recipient.contactName).toBe("Test User");
    expect(recipient.employeeCount).toBe(500);
  });

  it("should handle missing RESEND_API_KEY gracefully", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    // Re-import to get fresh module with no API key
    vi.resetModules();
    vi.mock("resend", () => ({
      Resend: vi.fn().mockImplementation(() => ({
        emails: { send: vi.fn() },
      })),
    }));
    const { sendB2BPerkCampaignEmail } = await import("./email");

    const result = await sendB2BPerkCampaignEmail({
      contactName: "Test",
      contactEmail: "test@test.com",
      companyName: "TestCo",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("RESEND_API_KEY");

    // Restore
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
  });
});
