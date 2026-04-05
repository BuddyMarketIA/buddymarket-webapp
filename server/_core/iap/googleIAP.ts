/**
 * Google Play Billing Verification
 * Uses the Google Play Developer API v3 with a Service Account (OAuth2).
 *
 * Required environment variables:
 *   GOOGLE_PLAY_SERVICE_ACCOUNT_JSON  — Full JSON of the service account key (base64-encoded)
 *   GOOGLE_PLAY_PACKAGE_NAME          — App package name (e.g. "com.buddymarket.app")
 *
 * Docs: https://developer.android.com/google/play/billing/getting-ready
 * API:  https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2/get
 */

// ─── Product ID → internal plan mapping ──────────────────────────────────────
export const GOOGLE_PRODUCT_MAP: Record<string, "basic" | "premium" | "pro_max"> = {
  "buddymarket_pro_monthly": "basic",
  "buddymarket_pro_annual": "basic",
  "buddymarket_promax_monthly": "premium",
  "buddymarket_promax_annual": "premium",
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface GoogleVerificationResult {
  valid: boolean;
  purchaseToken: string;
  productId: string;
  plan: "basic" | "premium" | "pro_max" | null;
  expiresAt: Date | null;
  orderId: string;
  environment: "sandbox" | "production";
  error?: string;
}

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

interface GoogleSubscriptionPurchase {
  kind: string;
  startTimeMillis: string;
  expiryTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  countryCode: string;
  developerPayload: string;
  paymentState: number; // 0=pending, 1=received, 2=free trial, 3=deferred
  cancelReason?: number;
  orderId: string;
  linkedPurchaseToken?: string;
  purchaseType?: number; // 0=test, 1=promo
  acknowledgementState: number; // 0=not acknowledged, 1=acknowledged
}

// ─── OAuth2 JWT for Google Service Account ────────────────────────────────────
async function getGoogleAccessToken(): Promise<string> {
  const serviceAccountRaw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountRaw) throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not configured");

  let serviceAccount: ServiceAccountKey;
  try {
    const decoded = Buffer.from(serviceAccountRaw, "base64").toString("utf-8");
    serviceAccount = JSON.parse(decoded);
  } catch {
    try {
      serviceAccount = JSON.parse(serviceAccountRaw);
    } catch {
      throw new Error("Invalid GOOGLE_PLAY_SERVICE_ACCOUNT_JSON format (expected base64 or raw JSON)");
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const scope = "https://www.googleapis.com/auth/androidpublisher";

  // Build JWT claim set
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope,
    aud: serviceAccount.token_uri,
    exp: now + 3600,
    iat: now,
  })).toString("base64url");

  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${claim}`);
  const signature = sign.sign(serviceAccount.private_key.replace(/\\n/g, "\n"), "base64url");
  const jwt = `${header}.${claim}.${signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    throw new Error(`Google OAuth2 token exchange failed: ${err}`);
  }

  const tokenData = await tokenResponse.json() as { access_token: string };
  return tokenData.access_token;
}

// ─── Main verification function ───────────────────────────────────────────────
export async function verifyGooglePurchase(
  productId: string,
  purchaseToken: string
): Promise<GoogleVerificationResult> {
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME;
  if (!packageName) {
    return { valid: false, purchaseToken, productId, plan: null, expiresAt: null, orderId: "", environment: "sandbox", error: "GOOGLE_PLAY_PACKAGE_NAME not configured" };
  }

  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken();
  } catch (err) {
    return { valid: false, purchaseToken, productId, plan: null, expiresAt: null, orderId: "", environment: "sandbox", error: (err as Error).message };
  }

  try {
    // Use subscriptions.get for subscription products
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[Google IAP] API error ${response.status}: ${body}`);
      return { valid: false, purchaseToken, productId, plan: null, expiresAt: null, orderId: "", environment: "sandbox", error: `API error ${response.status}` };
    }

    const data = await response.json() as GoogleSubscriptionPurchase;

    // paymentState: 0=pending, 1=received, 2=free trial, 3=deferred
    if (data.paymentState !== 1 && data.paymentState !== 2) {
      return { valid: false, purchaseToken, productId, plan: null, expiresAt: null, orderId: data.orderId, environment: "sandbox", error: `Payment not received (state: ${data.paymentState})` };
    }

    const expiresAt = data.expiryTimeMillis ? new Date(parseInt(data.expiryTimeMillis)) : null;
    if (expiresAt && expiresAt < new Date()) {
      return { valid: false, purchaseToken, productId, plan: GOOGLE_PRODUCT_MAP[productId] ?? null, expiresAt, orderId: data.orderId, environment: "sandbox", error: "Subscription expired" };
    }

    // purchaseType 0 = test purchase (sandbox)
    const environment: "sandbox" | "production" = data.purchaseType === 0 ? "sandbox" : "production";
    const plan = GOOGLE_PRODUCT_MAP[productId] ?? null;

    return {
      valid: true,
      purchaseToken,
      productId,
      plan,
      expiresAt,
      orderId: data.orderId,
      environment,
    };
  } catch (err) {
    console.error("[Google IAP] Verification error:", err);
    return { valid: false, purchaseToken, productId, plan: null, expiresAt: null, orderId: "", environment: "sandbox", error: (err as Error).message };
  }
}

// ─── Google Play Real-Time Developer Notifications (RTDN) ────────────────────
export interface GoogleRTDNMessage {
  version: string;
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string;
  };
  testNotification?: {
    version: string;
  };
}

// notificationType values:
// 1=RECOVERED, 2=RENEWED, 3=CANCELED, 4=PURCHASED, 5=ON_HOLD,
// 6=IN_GRACE_PERIOD, 7=RESTARTED, 8=PRICE_CHANGE_CONFIRMED,
// 9=DEFERRED, 10=PAUSED, 11=PAUSE_SCHEDULE_CHANGED, 12=REVOKED, 13=EXPIRED
export type GoogleIAPAction = "activate" | "renew" | "cancel" | "expire" | "hold" | "unknown";

export function getActionFromGoogleNotification(notificationType: number): GoogleIAPAction {
  switch (notificationType) {
    case 4: return "activate";  // PURCHASED
    case 1: return "renew";     // RECOVERED
    case 2: return "renew";     // RENEWED
    case 7: return "renew";     // RESTARTED
    case 3: return "cancel";    // CANCELED
    case 12: return "cancel";   // REVOKED
    case 13: return "expire";   // EXPIRED
    case 5: return "hold";      // ON_HOLD
    case 6: return "hold";      // IN_GRACE_PERIOD
    default: return "unknown";
  }
}
