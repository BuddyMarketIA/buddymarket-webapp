# BuddyMarket — Arquitectura de Pagos

## Resumen

BuddyMarket utiliza **dos pasarelas de pago** según el tipo de usuario y la plataforma:

| Plataforma / Tipo de usuario | Pasarela | Justificación |
|---|---|---|
| iOS nativo — usuario regular | **Apple IAP (StoreKit 2)** | Obligatorio por Apple guideline 3.1.1 |
| Android nativo — usuario regular | **Google Play Billing** (futuro) | Obligatorio por Google Play policy |
| Web — usuario regular | **Stripe Checkout** | Permitido en web |
| Web — BuddyExpert / BuddyMaker | **Stripe Checkout** | B2B, exento de IAP |
| BuddyExpert / BuddyMaker (cobros) | **Stripe Connect** | Payouts a creadores |

---

## Cumplimiento con Apple App Store

### Guideline 3.1.1 — In-App Purchase

> "If you want to unlock features or functionality within your app, you must use in-app purchase."

**Regla:** Cualquier suscripción o compra de contenido digital consumido dentro de la app iOS **debe** procesarse mediante StoreKit 2 (IAP). No se puede mostrar ni mencionar Stripe, PayPal u otras pasarelas externas en el flujo de compra dentro de la app.

### Exención B2B (guideline 3.1.3)

Los planes de **BuddyExperts** y **BuddyMakers** son servicios profesionales (B2B) que se contratan desde la web. Apple permite el uso de pasarelas externas para este tipo de transacciones porque:
1. Son compras realizadas fuera de la app (web-only).
2. El servicio no es un "feature" de la app sino una herramienta profesional.
3. No se muestra ningún botón de Stripe dentro de la app iOS.

---

## Implementación

### Detección de plataforma

```ts
// client/src/hooks/usePlatform.ts
import { usePlatform, isIOSNative } from "@/hooks/usePlatform";

// El shell nativo iOS inyecta:
window.__BUDDYMARKET_PLATFORM__ = "ios";

// El bridge StoreKit 2 se inyecta como:
window.BuddyMarketIAP = {
  purchase(productId: string): Promise<{ transactionId: string; receipt: string }>,
  getProducts(productIds: string[]): Promise<IAPProduct[]>,
  restorePurchases(): Promise<void>,
};
```

### Capa de abstracción de pagos

```ts
// client/src/hooks/usePayment.ts
const { purchase, isPending } = usePayment({ onSuccess });

// En iOS → llama a window.BuddyMarketIAP.purchase()
// En web → llama a trpc.subscriptions.createCheckout
purchase("basic", window.location.origin);
```

### Componente unificado

```tsx
// client/src/components/IAPSubscriptionButton.tsx
import { IAPSubscriptionButton } from "@/components/IAPSubscriptionButton";

// Renderiza el botón correcto según plataforma:
// iOS: "Suscribirse" → StoreKit 2
// Web: "Empezar ahora" → Stripe Checkout
<IAPSubscriptionButton plan="basic" onSuccess={handleSuccess} />
```

---

## Product IDs de Apple App Store

| Plan interno | Product ID |
|---|---|
| `basic` (Pro mensual) | `com.buddymarket.subscription.pro.monthly` |
| `premium` (Pro Max mensual) | `com.buddymarket.subscription.promax.monthly` |
| `basic_annual` (Pro anual) | `com.buddymarket.subscription.pro.annual` |
| `premium_annual` (Pro Max anual) | `com.buddymarket.subscription.promax.annual` |

---

## Verificación de recibos IAP (servidor)

El endpoint `trpc.subscriptions.verifyAppleIAP` (pendiente de implementar en `server/routers.ts`) debe:

1. Recibir `{ transactionId, receipt, plan }` del cliente iOS.
2. Verificar el recibo contra la API de Apple (`https://buy.itunes.apple.com/verifyReceipt`).
3. Activar el plan en la BD del usuario.
4. Devolver confirmación al cliente.

**Nunca confiar en el cliente para activar el plan** — siempre verificar en servidor.

---

## Flujos que NO deben usar Stripe en iOS

- `Subscription.tsx` — página de planes → usa `usePayment()` ✅
- `UpgradeGate.tsx` — modal de upgrade → usa `usePayment()` ✅
- `LandingPage.tsx` — botones de precios → pendiente de migrar

## Flujos que SÍ usan Stripe (siempre web)

- `BuddyMakerStats.tsx` — Stripe Connect onboarding/dashboard ✅
- `BuddyExpertStats.tsx` — Stripe Connect onboarding/dashboard ✅
- `ReferralDashboard.tsx` — comisiones de referidos ✅

---

## Checklist para el equipo iOS nativo

- [ ] Inyectar `window.__BUDDYMARKET_PLATFORM__ = "ios"` en WKWebView antes de cargar la app
- [ ] Implementar el bridge `window.BuddyMarketIAP` con StoreKit 2
- [ ] Registrar los Product IDs en App Store Connect
- [ ] Configurar el endpoint de verificación de recibos en producción
- [ ] Añadir "Sign in with Apple" (obligatorio si hay Google Login)
- [ ] Revisar que ningún botón de Stripe sea visible en la app iOS
