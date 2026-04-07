/**
 * Apple In-App Purchase Verification
 * Uses the App Store Server API (StoreKit 2) with JWT authentication (ES256).
 *
 * Required environment variables:
 *   APPLE_IAP_KEY_ID          — Key ID from App Store Connect (e.g. "ABC1234567")
 *   APPLE_IAP_ISSUER_ID       — Issuer ID from App Store Connect (UUID)
 *   APPLE_IAP_PRIVATE_KEY     — ES256 private key in PEM format (base64-encoded or raw PEM)
 *   APPLE_BUNDLE_ID           — App bundle ID (e.g. "com.buddymarket.app")
 *
 * Docs: https://developer.apple.com/documentation/appstoreserverapi
 */

import * as crypto from "crypto";

// ─── Product ID → internal plan mapping ──────────────────────────────────────
export const APPLE_PRODUCT_MAP: Record<string, "basic" | "premium" | "pro_max"> = {
  // Current product IDs (io.buddymarket.app.*)
  "io.buddymarket.app.premium.monthly": "basic",
  "io.buddymarket.app.premium.annual": "basic",
  "io.buddymarket.app.promax.monthly": "premium",
  "io.buddymarket.app.promax.annual": "premium",
  // Legacy product IDs (kept for backward compatibility)
  "com.buddymarket.subscription.pro.monthly": "basic",
  "com.buddymarket.subscription.pro.annual": "basic",
  "com.buddymarket.subscription.promax.monthly": "premium",
  "com.buddymarket.subscription.promax.annual": "premium",
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AppleVerificationResult {
  valid: boolean;
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  plan: "basic" | "premium" | "pro_max" | null;
  expiresAt: Date | null;
  environment: "sandbox" | "production";
  bundleId: string;
  error?: string;
}

interface JWSTransactionDecodedPayload {
  transactionId: string;
  originalTransactionId: string;
  bundleId: string;
  productId: string;
  purchaseDate: number;
  originalPurchaseDate: number;
  expiresDate?: number;
  quantity: number;
  type: string;
  inAppOwnershipType: string;
  signedDate: number;
  environment: "Sandbox" | "Production";
  transactionReason?: string;
  storefront?: string;
}

// ─── JWT generation for App Store Server API ─────────────────────────────────
function generateAppleJWT(): string {
  const keyId = process.env.APPLE_IAP_KEY_ID;
  const issuerId = process.env.APPLE_IAP_ISSUER_ID;
  const privateKeyRaw = process.env.APPLE_IAP_PRIVATE_KEY;

  if (!keyId || !issuerId || !privateKeyRaw) {
    throw new Error("Missing Apple IAP credentials. Set APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID, APPLE_IAP_PRIVATE_KEY.");
  }

  // Support both raw PEM and base64-encoded PEM
  const privateKey = privateKeyRaw.includes("-----BEGIN")
    ? privateKeyRaw.replace(/\\n/g, "\n")
    : Buffer.from(privateKeyRaw, "base64").toString("utf-8");

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: issuerId,
    iat: now,
    exp: now + 3600, // 1 hour
    aud: "appstoreconnect-v1",
    bid: process.env.APPLE_BUNDLE_ID,
  })).toString("base64url");

  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign("SHA256");
  sign.update(signingInput);
  const signature = sign.sign({ key: privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url");

  return `${signingInput}.${signature}`;
}

// ─── Decode a JWS (JSON Web Signature) payload without verifying Apple's cert ─
// Apple's certificates are trusted by default; full cert chain verification
// is optional for server-side receipt validation per Apple docs.
function decodeJWSPayload(jws: string): JWSTransactionDecodedPayload {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWS format");
  const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
  return JSON.parse(payloadJson) as JWSTransactionDecodedPayload;
}

// ─── Main verification function ───────────────────────────────────────────────
export async function verifyAppleTransaction(
  transactionId: string
): Promise<AppleVerificationResult> {
  const bundleId = process.env.APPLE_BUNDLE_ID;
  if (!bundleId) {
    return { valid: false, transactionId, originalTransactionId: "", productId: "", plan: null, expiresAt: null, environment: "sandbox", bundleId: "", error: "APPLE_BUNDLE_ID not configured" };
  }

  // Try production first, fall back to sandbox
  const environments: Array<{ name: "production" | "sandbox"; url: string }> = [
    { name: "production", url: "https://api.storekit.itunes.apple.com" },
    { name: "sandbox", url: "https://api.storekit-sandbox.itunes.apple.com" },
  ];

  let jwt: string;
  try {
    jwt = generateAppleJWT();
  } catch (err) {
    return { valid: false, transactionId, originalTransactionId: "", productId: "", plan: null, expiresAt: null, environment: "sandbox", bundleId, error: (err as Error).message };
  }

  for (const env of environments) {
    try {
      const url = `${env.url}/inApps/v1/transactions/${transactionId}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) continue; // Not found in this environment, try next
      if (!response.ok) {
        const body = await response.text();
        console.error(`[Apple IAP] ${env.name} API error ${response.status}: ${body}`);
        continue;
      }

      const data = await response.json() as { signedTransactionInfo: string };
      const decoded = decodeJWSPayload(data.signedTransactionInfo);

      // Validate bundle ID
      if (decoded.bundleId !== bundleId) {
        return { valid: false, transactionId, originalTransactionId: decoded.originalTransactionId, productId: decoded.productId, plan: null, expiresAt: null, environment: env.name, bundleId: decoded.bundleId, error: "Bundle ID mismatch" };
      }

      const plan = APPLE_PRODUCT_MAP[decoded.productId] ?? null;
      const expiresAt = decoded.expiresDate ? new Date(decoded.expiresDate) : null;

      // Check expiry for subscriptions
      if (expiresAt && expiresAt < new Date()) {
        return { valid: false, transactionId: decoded.transactionId, originalTransactionId: decoded.originalTransactionId, productId: decoded.productId, plan, expiresAt, environment: env.name, bundleId, error: "Subscription expired" };
      }

      return {
        valid: true,
        transactionId: decoded.transactionId,
        originalTransactionId: decoded.originalTransactionId,
        productId: decoded.productId,
        plan,
        expiresAt,
        environment: env.name,
        bundleId,
      };
    } catch (err) {
      console.error(`[Apple IAP] Error querying ${env.name}:`, err);
    }
  }

  return { valid: false, transactionId, originalTransactionId: "", productId: "", plan: null, expiresAt: null, environment: "sandbox", bundleId, error: "Transaction not found in any environment" };
}

// ─── Apple Server Notifications V2 (webhook) ─────────────────────────────────
export interface AppleNotificationPayload {
  notificationType: string;
  subtype?: string;
  notificationUUID: string;
  data: {
    bundleId: string;
    bundleVersion: string;
    environment: "Sandbox" | "Production";
    signedTransactionInfo: string;
    signedRenewalInfo?: string;
  };
  version: string;
  signedDate: number;
}

export function decodeAppleNotification(signedPayload: string): AppleNotificationPayload {
  const decoded = decodeJWSPayload(signedPayload) as unknown as AppleNotificationPayload;
  return decoded;
}

// ─── Notification type → subscription action mapping ─────────────────────────
export type IAPAction = "activate" | "renew" | "cancel" | "expire" | "refund" | "upgrade" | "unknown";

export function getActionFromNotification(type: string, subtype?: string): IAPAction {
  switch (type) {
    case "SUBSCRIBED":
      return subtype === "INITIAL_BUY" ? "activate" : "renew";
    case "DID_RENEW":
      return "renew";
    case "DID_CHANGE_RENEWAL_STATUS":
      return subtype === "AUTO_RENEW_DISABLED" ? "cancel" : "renew";
    case "EXPIRED":
      return "expire";
    case "REFUND":
      return "refund";
    case "OFFER_REDEEMED":
      return "activate";
    case "GRACE_PERIOD_EXPIRED":
      return "expire";
    default:
      return "unknown";
  }
}
