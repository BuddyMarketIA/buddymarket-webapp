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
 * Apple guideline 3.1.1 compliance:
 *   On iOS the Stripe checkout flow is NEVER triggered for in-app subscriptions.
 *   Stripe is only used on the web and exclusively for B2B professional plans
 *   (BuddyExperts, BuddyMakers) which are exempt from IAP requirements because
 *   they are business-to-business transactions for services delivered outside the app.
 *
 * References:
 *   - App Store Review Guidelines §3.1.1 (In-App Purchase)
 *   - App Store Review Guidelines §3.1.3(b) (Multiplatform apps — reader apps exemption)
 *   - Apple Developer: StoreKit 2 documentation
 */

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { isIOSNative, isIAPAvailable } from "./usePlatform";

/** Maps our internal plan keys to Apple App Store product IDs */
export const IAP_PRODUCT_IDS: Record<string, string> = {
  basic: "com.buddymarket.subscription.pro.monthly",
  premium: "com.buddymarket.subscription.promax.monthly",
  pro_max: "com.buddymarket.subscription.promax.monthly",
  basic_annual: "com.buddymarket.subscription.pro.annual",
  premium_annual: "com.buddymarket.subscription.promax.annual",
};

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

  const verifyIAP = (trpc.subscriptions as any).verifyAppleIAP?.useMutation?.({
    onSuccess: () => {
      toast.success("¡Suscripción activada correctamente!");
      options.onSuccess?.();
    },
    onError: (err: unknown) => {
      toast.error("Error al verificar la compra. Contacta con soporte.");
      options.onError?.(err as Error);
    },
  });

  const purchase = async (plan: PaymentPlan, origin: string) => {
    // ── iOS native: use StoreKit 2 IAP ──────────────────────────────────────
    if (isIOSNative()) {
      if (!isIAPAvailable()) {
        // IAP bridge not injected yet (e.g., during web preview of iOS build)
        toast.info("Las compras in-app están disponibles en la app de iOS. Descárgala desde la App Store.");
        return;
      }
      const productId = IAP_PRODUCT_IDS[plan] ?? IAP_PRODUCT_IDS.basic;
      try {
        toast.loading("Abriendo App Store...");
        const result = await window.BuddyMarketIAP!.purchase(productId);
        toast.dismiss();
        // Send receipt to server for verification
        if (verifyIAP) {
          await verifyIAP.mutateAsync({
            transactionId: result.transactionId,
            receipt: result.receipt,
            plan,
          });
        }
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

    // ── Web / Android: use Stripe Checkout ──────────────────────────────────
    createCheckout.mutate({ plan, origin });
  };

  return {
    purchase,
    isPending: createCheckout.isPending || (verifyIAP?.isPending ?? false),
    isIOSNative: isIOSNative(),
  };
}
