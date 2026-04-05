/**
 * usePayment — Payment abstraction layer.
 *
 * Routes subscription purchases to the correct payment system:
 *
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  Platform / User type          │  Payment system            │
 *  ├────────────────────────────────┼────────────────────────────┤
 *  │  iOS native (any user)         │  Apple IAP (StoreKit 2)    │
 *  │  Android native (any user)     │  Google Play Billing       │
 *  │  Web — regular user            │  Stripe Checkout           │
 *  │  Web — BuddyExpert/Maker       │  Stripe Checkout           │
 *  └─────────────────────────────────────────────────────────────┘
 *
 * Apple guideline 3.1.1 / Google Play Billing Policy compliance:
 *   On iOS/Android the Stripe checkout flow is NEVER triggered for in-app
 *   subscriptions. Stripe is only used on the web and exclusively for B2B
 *   professional plans (BuddyExperts, BuddyMakers) which are exempt from IAP
 *   requirements because they are B2B transactions for services delivered outside
 *   the app.
 *
 * References:
 *   - App Store Review Guidelines §3.1.1 (In-App Purchase)
 *   - App Store Review Guidelines §3.1.3(b) (Multiplatform apps)
 *   - Google Play Billing Policy
 *   - Apple Developer: StoreKit 2 documentation
 *   - Google Play Billing Library 6+
 */

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { isIOSNative, isAndroidNative, isIAPAvailable } from "./usePlatform";

// ─── Product ID maps ──────────────────────────────────────────────────────────

/** Maps internal plan keys → Apple App Store product IDs */
export const APPLE_PRODUCT_IDS: Record<string, string> = {
  basic: "com.buddymarket.subscription.pro.monthly",
  premium: "com.buddymarket.subscription.promax.monthly",
  pro_max: "com.buddymarket.subscription.promax.monthly",
  basic_annual: "com.buddymarket.subscription.pro.annual",
  premium_annual: "com.buddymarket.subscription.promax.annual",
};

/** Maps internal plan keys → Google Play product IDs */
export const GOOGLE_PRODUCT_IDS: Record<string, string> = {
  basic: "buddymarket_pro_monthly",
  premium: "buddymarket_promax_monthly",
  pro_max: "buddymarket_promax_monthly",
  basic_annual: "buddymarket_pro_annual",
  premium_annual: "buddymarket_promax_annual",
};

/** @deprecated Use APPLE_PRODUCT_IDS */
export const IAP_PRODUCT_IDS = APPLE_PRODUCT_IDS;

export type PaymentPlan = "basic" | "premium" | "pro_max";

interface UsePaymentOptions {
  onSuccess?: (transactionId?: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Returns a `purchase` function that automatically routes to IAP or Stripe
 * depending on the current platform.
 */
export function usePayment(options: UsePaymentOptions = {}) {
  // ── Stripe (web) ────────────────────────────────────────────────────────────
  const createCheckout = trpc.subscriptions.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.info("Redirigiendo a la pasarela de pago...");
      }
      options.onSuccess?.();
    },
    onError: (err) => {
      toast.error("Error al iniciar el pago. Inténtalo de nuevo.");
      options.onError?.(err as unknown as Error);
    },
  });

  // ── Apple IAP verification (server-side) ────────────────────────────────────
  const verifyApple = trpc.subscriptions.verifyAppleIAP.useMutation({
    onSuccess: (data) => {
      const envLabel = data.environment === "sandbox" ? " (sandbox)" : "";
      toast.success(`¡Suscripción ${data.plan} activada correctamente!${envLabel}`);
      options.onSuccess?.(undefined);
    },
    onError: (err: unknown) => {
      toast.error("Error al verificar la compra con Apple. Contacta con soporte.");
      options.onError?.(err as Error);
    },
  });

  // ── Google Play IAP verification (server-side) ──────────────────────────────
  const verifyGoogle = trpc.subscriptions.verifyGoogleIAP.useMutation({
    onSuccess: (data) => {
      const envLabel = data.environment === "sandbox" ? " (sandbox)" : "";
      toast.success(`¡Suscripción ${data.plan} activada correctamente!${envLabel}`);
      options.onSuccess?.(undefined);
    },
    onError: (err: unknown) => {
      toast.error("Error al verificar la compra con Google Play. Contacta con soporte.");
      options.onError?.(err as Error);
    },
  });

  // ── Main purchase function ──────────────────────────────────────────────────
  const purchase = async (plan: PaymentPlan, origin: string) => {

    // ── iOS native: StoreKit 2 ─────────────────────────────────────────────────
    if (isIOSNative()) {
      if (!isIAPAvailable()) {
        toast.info("Las compras in-app están disponibles en la app de iOS. Descárgala desde la App Store.");
        return;
      }
      const productId = APPLE_PRODUCT_IDS[plan] ?? APPLE_PRODUCT_IDS.basic;
      try {
        const toastId = toast.loading("Abriendo App Store...");
        const result = await window.BuddyMarketIAP!.purchase(productId);
        toast.dismiss(toastId);
        toast.loading("Verificando compra...");
        await verifyApple.mutateAsync({
          transactionId: result.transactionId,
          productId,
        });
        toast.dismiss();
      } catch (err: unknown) {
        toast.dismiss();
        const msg = (err as Error)?.message ?? "Compra cancelada";
        if (!msg.toLowerCase().includes("cancel")) {
          toast.error("Error en la compra: " + msg);
          options.onError?.(err as Error);
        }
      }
      return;
    }

    // ── Android native: Google Play Billing ────────────────────────────────────
    if (isAndroidNative()) {
      if (!isIAPAvailable()) {
        toast.info("Las compras in-app están disponibles en la app de Android. Descárgala desde Google Play.");
        return;
      }
      const productId = GOOGLE_PRODUCT_IDS[plan] ?? GOOGLE_PRODUCT_IDS.basic;
      try {
        const toastId = toast.loading("Abriendo Google Play...");
        const result = await window.BuddyMarketIAP!.purchase(productId);
        toast.dismiss(toastId);
        toast.loading("Verificando compra...");
        await verifyGoogle.mutateAsync({
          productId,
          purchaseToken: result.transactionId, // Google uses purchaseToken as transactionId
        });
        toast.dismiss();
      } catch (err: unknown) {
        toast.dismiss();
        const msg = (err as Error)?.message ?? "Compra cancelada";
        if (!msg.toLowerCase().includes("cancel")) {
          toast.error("Error en la compra: " + msg);
          options.onError?.(err as Error);
        }
      }
      return;
    }

    // ── Web: Stripe Checkout ────────────────────────────────────────────────────
    createCheckout.mutate({ plan, origin });
  };

  return {
    purchase,
    isPending:
      createCheckout.isPending ||
      verifyApple.isPending ||
      verifyGoogle.isPending,
    isIOSNative: isIOSNative(),
    isAndroidNative: isAndroidNative(),
  };
}
