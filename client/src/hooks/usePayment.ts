/**
 * usePayment — Capa de abstracción de pagos para la webapp de BuddyMarket.
 * NOTA: Versión webapp pura. Solo usa Stripe Checkout.
 */

import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";

export type PaymentPlan = "basic" | "premium" | "pro_max";

interface UsePaymentOptions {
  onSuccess?: (transactionId?: string) => void;
  onError?: (error: Error) => void;
}

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

  const purchase = async (plan: PaymentPlan, origin: string) => {
    createCheckout.mutate({ plan, origin });
  };

  return {
    purchase,
    isPending: createCheckout.isPending,
    isIOSNative: false,
    isAndroidNative: false,
  };
}
