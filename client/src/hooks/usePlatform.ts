/**
 * usePlatform — Detects the current runtime environment.
 *
 * Apple App Store policy (guideline 3.1.1):
 *   - Apps distributed via the App Store MUST use In-App Purchase (IAP/StoreKit 2)
 *     for digital goods and subscriptions consumed inside the app.
 *   - External payment processors (Stripe, PayPal, etc.) are NOT allowed for
 *     in-app subscriptions on iOS.
 *
 * Stripe is kept ONLY for:
 *   - BuddyExperts and BuddyMakers purchasing professional plans (B2B, web-only).
 *   - Stripe Connect payouts to creators (always web-only).
 *
 * Detection strategy:
 *   1. The iOS/Android native shell injects window.__BUDDYMARKET_PLATFORM__ = "ios" | "android"
 *      via WKScriptMessageHandler / JavascriptInterface before the React app boots.
 *   2. As a fallback we check the User-Agent for common WebView patterns.
 *   3. If neither matches we assume "web".
 */

export type Platform = "ios" | "android" | "web";

declare global {
  interface Window {
    /** Injected by the native iOS/Android shell */
    __BUDDYMARKET_PLATFORM__?: Platform;
    /** StoreKit 2 bridge injected by the native iOS shell */
    BuddyOneIAP?: {
      purchase: (productId: string) => Promise<{ transactionId: string; receipt: string }>;
      getProducts: (productIds: string[]) => Promise<IAPProduct[]>;
      restorePurchases: () => Promise<void>;
    };
    /** Sign in with Apple bridge injected by the native iOS shell */
    BuddyOneAppleAuth?: {
      signIn: (options?: { nonce?: string }) => Promise<{
        identityToken: string;
        authorizationCode: string;
        user: string;
        nonce: string;
        email?: string;
        fullName?: { givenName?: string; familyName?: string };
      }>;
      isAvailable: () => Promise<{ available: boolean }>;
    };
  }
}

export interface IAPProduct {
  productId: string;
  localizedTitle: string;
  localizedDescription: string;
  localizedPrice: string;
  priceAmountMicros: number;
  currencyCode: string;
}

function detectPlatform(): Platform {
  // 1. Native shell injection (most reliable)
  if (typeof window !== "undefined" && window.__BUDDYMARKET_PLATFORM__) {
    return window.__BUDDYMARKET_PLATFORM__;
  }

  // 2. User-Agent heuristics (fallback)
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent;
    // iOS WebView patterns
    if (/iPhone|iPad|iPod/.test(ua) && /AppleWebKit/.test(ua) && !/Safari/.test(ua)) {
      return "ios";
    }
    // Android WebView pattern
    if (/Android/.test(ua) && /wv/.test(ua)) {
      return "android";
    }
  }

  return "web";
}

let _cachedPlatform: Platform | null = null;

/**
 * Returns the current platform.
 * Result is memoized after the first call (platform never changes at runtime).
 */
export function getPlatform(): Platform {
  if (_cachedPlatform) return _cachedPlatform;
  _cachedPlatform = detectPlatform();
  return _cachedPlatform;
}

/**
 * React hook — returns the current platform.
 * Stable reference, safe to use in dependency arrays.
 */
export function usePlatform(): Platform {
  return getPlatform();
}

/**
 * Returns true if the app is running inside an iOS native shell.
 * Use this to gate Stripe UI and show IAP buttons instead.
 */
export function isIOSNative(): boolean {
  return getPlatform() === "ios";
}

/**
 * Returns true if the app is running inside an Android native shell.
 * Use this to gate Stripe UI and show Google Play Billing buttons instead.
 */
export function isAndroidNative(): boolean {
  return getPlatform() === "android";
}

/**
 * Returns true if the app is running inside any native shell (iOS or Android).
 */
export function isNativeApp(): boolean {
  return getPlatform() !== "web";
}

/**
 * Returns true if IAP is available:
 *   - iOS: native shell with StoreKit 2 bridge injected
 *   - Android: native shell with Google Play Billing bridge injected
 */
export function isIAPAvailable(): boolean {
  return isNativeApp() && typeof window !== "undefined" && !!window.BuddyOneIAP;
}
