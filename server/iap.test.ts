/**
 * Tests for Apple IAP and Google Play Billing verification services.
 *
 * These tests run without real API credentials by mocking the fetch calls.
 * They verify the business logic: JWT generation, response parsing,
 * plan mapping, expiry checks, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  APPLE_PRODUCT_MAP,
  getActionFromNotification,
  decodeAppleNotification,
} from "./_core/iap/appleIAP";
import {
  GOOGLE_PRODUCT_MAP,
  getActionFromGoogleNotification,
} from "./_core/iap/googleIAP";

// ─── Apple IAP ────────────────────────────────────────────────────────────────

describe("Apple IAP — product map", () => {
  it("maps monthly premium product to basic plan", () => {
    expect(APPLE_PRODUCT_MAP["io.buddymarket.app.premium.monthly"]).toBe("basic");
  });

  it("maps annual premium product to basic plan", () => {
    expect(APPLE_PRODUCT_MAP["io.buddymarket.app.premium.annual"]).toBe("basic");
  });

  it("maps monthly promax product to premium plan", () => {
    expect(APPLE_PRODUCT_MAP["io.buddymarket.app.promax.monthly"]).toBe("premium");
  });

  it("maps annual promax product to premium plan", () => {
    expect(APPLE_PRODUCT_MAP["io.buddymarket.app.promax.annual"]).toBe("premium");
  });

  // Legacy product IDs (backward compatibility)
  it("maps legacy monthly pro product to basic plan", () => {
    expect(APPLE_PRODUCT_MAP["com.buddymarket.subscription.pro.monthly"]).toBe("basic");
  });

  it("returns undefined for unknown product IDs", () => {
    expect(APPLE_PRODUCT_MAP["com.unknown.product"]).toBeUndefined();
  });
});

describe("Apple IAP — notification action mapping", () => {
  it("maps SUBSCRIBED/INITIAL_BUY to activate", () => {
    expect(getActionFromNotification("SUBSCRIBED", "INITIAL_BUY")).toBe("activate");
  });

  it("maps SUBSCRIBED without subtype to renew", () => {
    expect(getActionFromNotification("SUBSCRIBED")).toBe("renew");
  });

  it("maps DID_RENEW to renew", () => {
    expect(getActionFromNotification("DID_RENEW")).toBe("renew");
  });

  it("maps DID_CHANGE_RENEWAL_STATUS/AUTO_RENEW_DISABLED to cancel", () => {
    expect(getActionFromNotification("DID_CHANGE_RENEWAL_STATUS", "AUTO_RENEW_DISABLED")).toBe("cancel");
  });

  it("maps EXPIRED to expire", () => {
    expect(getActionFromNotification("EXPIRED")).toBe("expire");
  });

  it("maps REFUND to refund", () => {
    expect(getActionFromNotification("REFUND")).toBe("refund");
  });

  it("maps OFFER_REDEEMED to activate", () => {
    expect(getActionFromNotification("OFFER_REDEEMED")).toBe("activate");
  });

  it("maps unknown types to unknown", () => {
    expect(getActionFromNotification("SOME_FUTURE_TYPE")).toBe("unknown");
  });
});

describe("Apple IAP — verifyAppleTransaction (mocked fetch)", () => {
  const originalFetch = global.fetch;

  // Generate a real P-256 (ES256) key pair for testing
  const { privateKey: TEST_EC_KEY } = (() => {
    const { generateKeyPairSync } = require("crypto");
    return generateKeyPairSync("ec", { namedCurve: "P-256" });
  })();

  beforeEach(() => {
    process.env.APPLE_IAP_KEY_ID = "TESTKEY123";
    process.env.APPLE_IAP_ISSUER_ID = "00000000-0000-0000-0000-000000000000";
    process.env.APPLE_BUNDLE_ID = "io.buddymarket.app";
    // Export the test EC private key as PEM
    process.env.APPLE_IAP_PRIVATE_KEY = TEST_EC_KEY.export({ type: "sec1", format: "pem" }) as string;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.APPLE_IAP_KEY_ID;
    delete process.env.APPLE_IAP_ISSUER_ID;
    delete process.env.APPLE_BUNDLE_ID;
    delete process.env.APPLE_IAP_PRIVATE_KEY;
  });

  it("returns invalid when credentials are missing", async () => {
    delete process.env.APPLE_IAP_KEY_ID;
    const { verifyAppleTransaction } = await import("./_core/iap/appleIAP");
    const result = await verifyAppleTransaction("tx_test_123");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Missing Apple IAP credentials");
  });

  it("returns invalid when APPLE_BUNDLE_ID is missing", async () => {
    delete process.env.APPLE_BUNDLE_ID;
    const { verifyAppleTransaction } = await import("./_core/iap/appleIAP");
    const result = await verifyAppleTransaction("tx_test_123");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("APPLE_BUNDLE_ID not configured");
  });

  it("returns invalid when API returns 404 on both environments", async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 404, ok: false });
    const { verifyAppleTransaction } = await import("./_core/iap/appleIAP");
    const result = await verifyAppleTransaction("tx_nonexistent");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not found in any environment");
  });

  it("returns invalid when bundle ID mismatches", async () => {
    const payload = {
      transactionId: "tx_123",
      originalTransactionId: "orig_tx_123",
      bundleId: "com.other.app", // wrong bundle
      productId: "com.buddymarket.subscription.pro.monthly",
      purchaseDate: Date.now(),
      originalPurchaseDate: Date.now(),
      expiresDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      quantity: 1,
      type: "Auto-Renewable Subscription",
      inAppOwnershipType: "PURCHASED",
      signedDate: Date.now(),
      environment: "Sandbox",
    };
    const jwsPayload = [
      Buffer.from(JSON.stringify({ alg: "ES256", kid: "TEST" })).toString("base64url"),
      Buffer.from(JSON.stringify(payload)).toString("base64url"),
      "fakesig",
    ].join(".");

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ signedTransactionInfo: jwsPayload }),
    });

    const { verifyAppleTransaction } = await import("./_core/iap/appleIAP");
    const result = await verifyAppleTransaction("tx_123");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Bundle ID mismatch");
  });

  it("returns valid with correct plan when API returns valid transaction", async () => {
    const futureDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const payload = {
      transactionId: "tx_valid_123",
      originalTransactionId: "orig_tx_valid_123",
      bundleId: "io.buddymarket.app",
      productId: "io.buddymarket.app.premium.monthly",
      purchaseDate: Date.now(),
      originalPurchaseDate: Date.now(),
      expiresDate: futureDate,
      quantity: 1,
      type: "Auto-Renewable Subscription",
      inAppOwnershipType: "PURCHASED",
      signedDate: Date.now(),
      environment: "Sandbox",
    };
    const jwsPayload = [
      Buffer.from(JSON.stringify({ alg: "ES256", kid: "TEST" })).toString("base64url"),
      Buffer.from(JSON.stringify(payload)).toString("base64url"),
      "fakesig",
    ].join(".");

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ signedTransactionInfo: jwsPayload }),
    });

    const { verifyAppleTransaction } = await import("./_core/iap/appleIAP");
    const result = await verifyAppleTransaction("tx_valid_123");
    expect(result.valid).toBe(true);
    expect(result.plan).toBe("basic");
    // environment is derived from the JWS payload field ("Sandbox" -> "sandbox", "Production" -> "production")
    expect(["sandbox", "production"]).toContain(result.environment);
    expect(result.transactionId).toBe("tx_valid_123");
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it("returns invalid when subscription is expired", async () => {
    const pastDate = Date.now() - 1000;
    const payload = {
      transactionId: "tx_expired",
      originalTransactionId: "orig_tx_expired",
      bundleId: "io.buddymarket.app",
      productId: "io.buddymarket.app.premium.monthly",
      purchaseDate: Date.now() - 40 * 24 * 60 * 60 * 1000,
      originalPurchaseDate: Date.now() - 40 * 24 * 60 * 60 * 1000,
      expiresDate: pastDate,
      quantity: 1,
      type: "Auto-Renewable Subscription",
      inAppOwnershipType: "PURCHASED",
      signedDate: Date.now(),
      environment: "Production",
    };
    const jwsPayload = [
      Buffer.from(JSON.stringify({ alg: "ES256", kid: "TEST" })).toString("base64url"),
      Buffer.from(JSON.stringify(payload)).toString("base64url"),
      "fakesig",
    ].join(".");

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ signedTransactionInfo: jwsPayload }),
    });

    const { verifyAppleTransaction } = await import("./_core/iap/appleIAP");
    const result = await verifyAppleTransaction("tx_expired");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Subscription expired");
  });
});

// ─── Google Play Billing ──────────────────────────────────────────────────────

describe("Google Play Billing — product map", () => {
  it("maps monthly pro product to basic plan", () => {
    expect(GOOGLE_PRODUCT_MAP["buddymarket_pro_monthly"]).toBe("basic");
  });

  it("maps annual pro product to basic plan", () => {
    expect(GOOGLE_PRODUCT_MAP["buddymarket_pro_annual"]).toBe("basic");
  });

  it("maps monthly promax product to premium plan", () => {
    expect(GOOGLE_PRODUCT_MAP["buddymarket_promax_monthly"]).toBe("premium");
  });

  it("returns undefined for unknown product IDs", () => {
    expect(GOOGLE_PRODUCT_MAP["unknown.product"]).toBeUndefined();
  });
});

describe("Google Play Billing — notification action mapping", () => {
  it("maps type 4 (PURCHASED) to activate", () => {
    expect(getActionFromGoogleNotification(4)).toBe("activate");
  });

  it("maps type 1 (RECOVERED) to renew", () => {
    expect(getActionFromGoogleNotification(1)).toBe("renew");
  });

  it("maps type 2 (RENEWED) to renew", () => {
    expect(getActionFromGoogleNotification(2)).toBe("renew");
  });

  it("maps type 3 (CANCELED) to cancel", () => {
    expect(getActionFromGoogleNotification(3)).toBe("cancel");
  });

  it("maps type 12 (REVOKED) to cancel", () => {
    expect(getActionFromGoogleNotification(12)).toBe("cancel");
  });

  it("maps type 13 (EXPIRED) to expire", () => {
    expect(getActionFromGoogleNotification(13)).toBe("expire");
  });

  it("maps type 5 (ON_HOLD) to hold", () => {
    expect(getActionFromGoogleNotification(5)).toBe("hold");
  });

  it("maps unknown types to unknown", () => {
    expect(getActionFromGoogleNotification(99)).toBe("unknown");
  });
});

describe("Google Play Billing — verifyGooglePurchase (mocked fetch)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.GOOGLE_PLAY_PACKAGE_NAME = "com.buddymarket.app";
    // Generate a real RSA key pair for JWT signing in tests
    const { generateKeyPairSync } = require("crypto");
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const serviceAccount = {
      type: "service_account",
      project_id: "buddymarket",
      private_key_id: "key123",
      private_key: privateKey.export({ type: "pkcs1", format: "pem" }) as string,
      client_email: "buddymarket@buddymarket.iam.gserviceaccount.com",
      client_id: "123456789",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
    };
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = Buffer.from(JSON.stringify(serviceAccount)).toString("base64");

    // Mock fetch to bypass the real OAuth token exchange by default
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "mock_access_token" }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GOOGLE_PLAY_PACKAGE_NAME;
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  });

  it("returns invalid when GOOGLE_PLAY_PACKAGE_NAME is missing", async () => {
    delete process.env.GOOGLE_PLAY_PACKAGE_NAME;
    const { verifyGooglePurchase } = await import("./_core/iap/googleIAP");
    const result = await verifyGooglePurchase("buddymarket_pro_monthly", "token_123");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("GOOGLE_PLAY_PACKAGE_NAME not configured");
  });

  it("returns invalid when service account JSON is missing", async () => {
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    const { verifyGooglePurchase } = await import("./_core/iap/googleIAP");
    const result = await verifyGooglePurchase("buddymarket_pro_monthly", "token_123");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not configured");
  });

  it("returns invalid when payment state is pending (0)", async () => {
    // Override fetch: first call = token exchange, second = subscription API
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "mock_token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          kind: "androidpublisher#subscriptionPurchase",
          startTimeMillis: String(Date.now()),
          expiryTimeMillis: String(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenewing: true,
          priceCurrencyCode: "EUR",
          priceAmountMicros: "4990000",
          countryCode: "ES",
          developerPayload: "",
          paymentState: 0, // pending
          orderId: "GPA.1234-5678",
          acknowledgementState: 1,
        }),
      });

    const { verifyGooglePurchase } = await import("./_core/iap/googleIAP");
    const result = await verifyGooglePurchase("buddymarket_pro_monthly", "token_pending");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Payment not received");
  });

  it("returns valid with correct plan when subscription is active", async () => {
    const futureExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "mock_token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          kind: "androidpublisher#subscriptionPurchase",
          startTimeMillis: String(Date.now()),
          expiryTimeMillis: String(futureExpiry),
          autoRenewing: true,
          priceCurrencyCode: "EUR",
          priceAmountMicros: "4990000",
          countryCode: "ES",
          developerPayload: "",
          paymentState: 1, // received
          orderId: "GPA.1234-5678-valid",
          acknowledgementState: 1,
        }),
      });

    const { verifyGooglePurchase } = await import("./_core/iap/googleIAP");
    const result = await verifyGooglePurchase("buddymarket_pro_monthly", "token_valid");
    expect(result.valid).toBe(true);
    expect(result.plan).toBe("basic");
    expect(result.orderId).toBe("GPA.1234-5678-valid");
    expect(result.expiresAt).toBeInstanceOf(Date);
  });
});
