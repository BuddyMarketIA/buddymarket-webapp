import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Resend with success by default
const mockSend = vi.fn().mockResolvedValue({ data: { id: "email_test_123" }, error: null });

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe("Payment Email Notifications", () => {
  beforeEach(() => {
    mockSend.mockResolvedValue({ data: { id: "email_test_123" }, error: null });
  });

  it("sendPaymentConfirmationEmail exports correctly", async () => {
    const { sendPaymentConfirmationEmail } = await import("./email");
    expect(typeof sendPaymentConfirmationEmail).toBe("function");
  });

  it("sendPaymentAdminNotification exports correctly", async () => {
    const { sendPaymentAdminNotification } = await import("./email");
    expect(typeof sendPaymentAdminNotification).toBe("function");
  });

  it("sendPaymentConfirmationEmail sends email for premium plan", async () => {
    const { sendPaymentConfirmationEmail } = await import("./email");
    const result = await sendPaymentConfirmationEmail({
      userName: "María García",
      userEmail: "maria@example.com",
      plan: "premium",
      amount: 999,
      currency: "eur",
      invoiceId: "inv_test_123",
      periodEnd: new Date("2026-05-06"),
    });
    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "maria@example.com",
        subject: expect.stringContaining("Pago confirmado"),
      })
    );
  });

  it("sendPaymentConfirmationEmail sends email for pro_max plan", async () => {
    const { sendPaymentConfirmationEmail } = await import("./email");
    const result = await sendPaymentConfirmationEmail({
      userName: "Carlos López",
      userEmail: "carlos@example.com",
      plan: "pro_max",
      amount: 1999,
      currency: "eur",
      invoiceId: "inv_test_456",
      periodEnd: new Date("2026-05-06"),
    });
    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "carlos@example.com",
        subject: expect.stringContaining("Pro Max"),
      })
    );
  });

  it("sendPaymentAdminNotification sends notification to admin", async () => {
    const { sendPaymentAdminNotification } = await import("./email");
    const result = await sendPaymentAdminNotification({
      userName: "María García",
      userEmail: "maria@example.com",
      plan: "premium",
      amount: 999,
      currency: "eur",
      invoiceId: "inv_test_123",
      userId: 42,
      stripeCustomerId: "cus_test_abc",
      adminEmail: "hola@buddymarketapp.com",
    });
    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "hola@buddymarketapp.com",
        subject: expect.stringContaining("Nuevo pago"),
      })
    );
  });

  it("sendPaymentConfirmationEmail returns false on Resend error", async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: "API error" } });
    const { sendPaymentConfirmationEmail } = await import("./email");
    const result = await sendPaymentConfirmationEmail({
      userName: "Test User",
      userEmail: "test@example.com",
      plan: "basic",
      amount: 499,
      currency: "eur",
      invoiceId: "inv_err",
      periodEnd: new Date(),
    });
    expect(result).toBe(false);
  });

  it("sendPaymentAdminNotification returns false on Resend error", async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: "API error" } });
    const { sendPaymentAdminNotification } = await import("./email");
    const result = await sendPaymentAdminNotification({
      userName: "Test User",
      userEmail: "test@example.com",
      plan: "basic",
      amount: 499,
      currency: "eur",
      invoiceId: "inv_err",
      userId: 1,
      stripeCustomerId: "cus_err",
      adminEmail: "admin@test.com",
    });
    expect(result).toBe(false);
  });
});
