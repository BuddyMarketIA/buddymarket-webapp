/**
 * Stripe B2B Products — Precios unitarios por licencia activa
 *
 * Modelo de facturación: la empresa paga SOLO por los empleados
 * que activaron su código ese mes (licencias activas), no por el
 * total de licencias contratadas.
 *
 * Estos Price IDs se crean en Stripe una sola vez y se reutilizan
 * en cada checkout y actualización de suscripción.
 *
 * Para crear los precios en Stripe (ejecutar una sola vez):
 *   node -e "require('./server/stripe-b2b-products.ts')" (con tsx)
 * O bien crearlos manualmente en el Dashboard de Stripe.
 */

export interface B2BPlanConfig {
  name: string;
  description: string;
  pricePerEmployee: number; // euros
  minEmployees: number;
  maxEmployees: number | null;
  /**
   * Stripe Price ID para este plan.
   * Se configura como variable de entorno para no hardcodear IDs de producción.
   * En test mode se crean dinámicamente si no están configurados.
   */
  stripePriceIdEnvKey: string;
}

export const B2B_PLANS: Record<"starter" | "business" | "enterprise", B2BPlanConfig> = {
  starter: {
    name: "BuddyMarket for Business — Starter",
    description: "Plan empresarial para equipos de hasta 49 empleados. Facturación por licencias activas.",
    pricePerEmployee: 8.00,
    minEmployees: 1,
    maxEmployees: 49,
    stripePriceIdEnvKey: "STRIPE_B2B_PRICE_STARTER",
  },
  business: {
    name: "BuddyMarket for Business — Business",
    description: "Plan empresarial para equipos de 50 a 199 empleados. Facturación por licencias activas.",
    pricePerEmployee: 6.00,
    minEmployees: 50,
    maxEmployees: 199,
    stripePriceIdEnvKey: "STRIPE_B2B_PRICE_BUSINESS",
  },
  enterprise: {
    name: "BuddyMarket for Business — Enterprise",
    description: "Plan empresarial para equipos de 200 a 499 empleados. Facturación por licencias activas.",
    pricePerEmployee: 4.50,
    minEmployees: 200,
    maxEmployees: 499,
    stripePriceIdEnvKey: "STRIPE_B2B_PRICE_ENTERPRISE",
  },
};

/**
 * Obtiene el Stripe Price ID para un plan.
 * Primero intenta leer la variable de entorno configurada.
 * Si no existe (entorno de desarrollo/test), devuelve null y el checkout
 * usará price_data dinámico como fallback.
 */
export function getStripePriceId(plan: "starter" | "business" | "enterprise"): string | null {
  const envKey = B2B_PLANS[plan].stripePriceIdEnvKey;
  return process.env[envKey] ?? null;
}

/**
 * Crea los productos y precios B2B en Stripe si no existen.
 * Llamar una sola vez durante el setup inicial.
 */
export async function ensureStripeB2BProducts(): Promise<void> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.warn("[B2B] STRIPE_SECRET_KEY no configurado, omitiendo creación de productos");
    return;
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeKey);

  for (const [planId, config] of Object.entries(B2B_PLANS)) {
    const existingPriceId = process.env[config.stripePriceIdEnvKey];
    if (existingPriceId) {
      console.log(`[B2B] Plan ${planId}: usando precio existente ${existingPriceId}`);
      continue;
    }

    try {
      // Crear producto
      const product = await stripe.products.create({
        name: config.name,
        description: config.description,
        metadata: { plan: planId, type: "b2b_per_license" },
      });

      // Crear precio unitario recurrente mensual
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(config.pricePerEmployee * 100), // centavos
        currency: "eur",
        recurring: {
          interval: "month",
          usage_type: "licensed", // quantity fija por período, actualizable
        },
        metadata: { plan: planId, type: "b2b_per_license" },
      });

      console.log(`[B2B] Plan ${planId}: producto ${product.id}, precio ${price.id}`);
      console.log(`[B2B] Añade a .env: ${config.stripePriceIdEnvKey}=${price.id}`);
    } catch (err) {
      console.error(`[B2B] Error creando producto para plan ${planId}:`, err);
    }
  }
}
