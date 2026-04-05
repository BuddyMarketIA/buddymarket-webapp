/**
 * IAPSubscriptionButton
 *
 * Renders the correct purchase CTA depending on the platform:
 *
 *  - iOS native  → "Suscribirse con App Store" (triggers StoreKit 2 IAP)
 *  - Web/Android → Stripe Checkout button
 *
 * This component is the single source of truth for subscription CTAs.
 * Import this instead of calling createCheckout directly.
 *
 * Apple compliance notes:
 *  - On iOS we NEVER show Stripe UI or mention external payment processors.
 *  - The button label follows Apple HIG: "Subscribe" / "Suscribirse".
 *  - We do NOT show the price ourselves on iOS — StoreKit shows the
 *    localised price from the App Store automatically.
 */

import { usePayment, type PaymentPlan } from "@/hooks/usePayment";
import { isIOSNative } from "@/hooks/usePlatform";

interface IAPSubscriptionButtonProps {
  plan: PaymentPlan;
  label?: string;
  /** Called after a successful purchase (both IAP and Stripe) */
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function IAPSubscriptionButton({
  plan,
  label,
  onSuccess,
  disabled = false,
  className,
  style,
  children,
}: IAPSubscriptionButtonProps) {
  const { purchase, isPending } = usePayment({ onSuccess });
  const iosNative = isIOSNative();

  const handleClick = () => {
    if (disabled || isPending) return;
    purchase(plan, window.location.origin);
  };

  const defaultLabel = iosNative ? "Suscribirse" : (label ?? "Empezar ahora");
  const displayLabel = children ?? defaultLabel;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isPending}
      className={className}
      style={style}
      aria-label={iosNative ? `Suscribirse al plan ${plan} mediante App Store` : `Contratar plan ${plan}`}
    >
      {isPending ? (iosNative ? "Abriendo App Store..." : "Procesando...") : displayLabel}
    </button>
  );
}

/**
 * IOSPaymentBanner
 *
 * Shown on the web pricing page when the user is browsing from an iOS device
 * but NOT inside the native app (e.g., Safari on iPhone).
 *
 * Apple guideline 3.1.1 allows directing users to download the app to purchase,
 * but we MUST NOT link directly to an external checkout from a web page that
 * is also accessible inside the app.
 */
export function IOSPaymentBanner() {
  if (!isIOSNative()) return null;
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        border: "1px solid #bae6fd",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}
    >
      <span style={{ fontSize: "24px", flexShrink: 0 }}></span>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#0c4a6e" }}>
          Gestiona tu suscripción desde la app
        </p>
        <p style={{ margin: 0, fontSize: "13px", color: "#075985", lineHeight: 1.5 }}>
          Las suscripciones se gestionan a través de la App Store de Apple. Abre la app de BuddyMarket en tu iPhone para suscribirte o gestionar tu plan.
        </p>
      </div>
    </div>
  );
}

/**
 * WebOnlyStripeButton
 *
 * Renders a Stripe checkout button ONLY on web.
 * On iOS it renders nothing (or an optional fallback).
 *
 * Use this for BuddyExpert/BuddyMaker professional plans that are
 * exempt from IAP requirements (B2B digital services).
 */
export function WebOnlyStripeButton({
  onClick,
  loading,
  children,
  className,
  style,
  fallback = null,
}: {
  onClick: () => void;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
}) {
  if (isIOSNative()) return <>{fallback}</>;
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={className}
      style={style}
    >
      {loading ? "Procesando..." : children}
    </button>
  );
}
