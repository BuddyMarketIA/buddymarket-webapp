/**
 * Stripe B2B Products — Precios unitarios por licencia activa
 *
 * Modelo de facturación tipo Gympass/Wellhub:
 * La empresa paga SOLO por los empleados que activaron su código
 * ese mes (licencias activas), no por el total de licencias contratadas.
 *
 * 6 tramos de precio según volumen de empleados:
 *   Starter    10–49    → 3,90 €/usuario/mes  (beneficio 2,50 €)
 *   Growth     50–199   → 3,50 €/usuario/mes  (beneficio 2,10 €)
 *   Business   200–499  → 3,40 €/usuario/mes  (beneficio 2,00 €)
 *   Enterprise 500–999  → 2,50 €/usuario/mes  (beneficio 1,10 €)
 *   Corporate  1.000–4.999 → 2,20 €/usuario/mes (beneficio 0,80 €)
 *   Global     5.000+   → 1,90 €/usuario/mes  (beneficio 0,50 €)
 *
 * Facturación anual: 2 meses gratis (paga 10, recibe 12).
 */

export type B2BPlanId = "starter" | "growth" | "business" | "enterprise" | "corporate" | "global";

export interface B2BPlanConfig {
  name: string;
  description: string;
  pricePerEmployee: number; // euros/mes
  benefitPerEmployee: number; // euros — lo que la empresa "ahorra" vs precio individual
  minEmployees: number;
  maxEmployees: number | null;
  features: string[];
  /**
   * Stripe Price ID para este plan.
   * Se configura como variable de entorno para no hardcodear IDs de producción.
   * En test mode se crean dinámicamente si no están configurados.
   */
  stripePriceIdEnvKey: string;
}

export const B2B_PLANS: Record<B2BPlanId, B2BPlanConfig> = {
  starter: {
    name: "Buddy One for Business — Starter",
    description: "Plan empresarial para equipos de 10 a 49 empleados.",
    pricePerEmployee: 3.90,
    benefitPerEmployee: 2.50,
    minEmployees: 10,
    maxEmployees: 49,
    features: [
      "App completa con menús IA para todos los empleados",
      "Lista de la compra automática por supermercado",
      "Seguimiento de macros y calorías",
      "Códigos de activación individuales",
      "Soporte por email",
    ],
    stripePriceIdEnvKey: "STRIPE_B2B_PRICE_STARTER",
  },
  growth: {
    name: "Buddy One for Business — Growth",
    description: "Plan empresarial para equipos de 50 a 199 empleados.",
    pricePerEmployee: 3.50,
    benefitPerEmployee: 2.10,
    minEmployees: 50,
    maxEmployees: 199,
    features: [
      "Todo lo de Starter",
      "Panel RRHH con métricas agregadas",
      "Onboarding dedicado",
      "Alta masiva de empleados por CSV",
      "Soporte prioritario",
    ],
    stripePriceIdEnvKey: "STRIPE_B2B_PRICE_GROWTH",
  },
  business: {
    name: "Buddy One for Business — Business",
    description: "Plan empresarial para equipos de 200 a 499 empleados.",
    pricePerEmployee: 3.40,
    benefitPerEmployee: 2.00,
    minEmployees: 200,
    maxEmployees: 499,
    features: [
      "Todo lo de Growth",
      "BuddyCoach grupal mensual",
      "Informes PDF mensuales para dirección",
      "Webinars de nutrición para empleados",
      "Cuenta ejecutiva dedicada",
    ],
    stripePriceIdEnvKey: "STRIPE_B2B_PRICE_BUSINESS",
  },
  enterprise: {
    name: "Buddy One for Business — Enterprise",
    description: "Plan empresarial para equipos de 500 a 999 empleados.",
    pricePerEmployee: 2.50,
    benefitPerEmployee: 1.10,
    minEmployees: 500,
    maxEmployees: 999,
    features: [
      "Todo lo de Business",
      "Integración SSO (Google / Microsoft)",
      "SLA 99,9% garantizado",
      "API de integración con HRIS",
      "Soporte 24/5",
    ],
    stripePriceIdEnvKey: "STRIPE_B2B_PRICE_ENTERPRISE",
  },
  corporate: {
    name: "Buddy One for Business — Corporate",
    description: "Plan empresarial para equipos de 1.000 a 4.999 empleados.",
    pricePerEmployee: 2.20,
    benefitPerEmployee: 0.80,
    minEmployees: 1000,
    maxEmployees: 4999,
    features: [
      "Todo lo de Enterprise",
      "Integración HRIS (Workday, SAP, BambooHR)",
      "Programa de bienestar personalizado",
      "Eventos de nutrición presenciales",
      "Soporte 24/7",
    ],
    stripePriceIdEnvKey: "STRIPE_B2B_PRICE_CORPORATE",
  },
  global: {
    name: "Buddy One for Business — Global",
    description: "Plan empresarial para equipos de 5.000+ empleados.",
    pricePerEmployee: 1.90,
    benefitPerEmployee: 0.50,
    minEmployees: 5000,
    maxEmployees: null,
    features: [
      "Todo lo de Corporate",
      "Multi-país / multi-idioma",
      "API dedicada con SLA premium",
      "Consultoría nutricional estratégica",
      "Precio y condiciones a medida",
    ],
    stripePriceIdEnvKey: "STRIPE_B2B_PRICE_GLOBAL",
  },
};

/** Todos los plan IDs ordenados por volumen */
export const B2B_PLAN_IDS: B2BPlanId[] = ["starter", "growth", "business", "enterprise", "corporate", "global"];

/**
 * Obtiene el Stripe Price ID para un plan.
 * Primero intenta leer la variable de entorno configurada.
 * Si no existe (entorno de desarrollo/test), devuelve null y el checkout
 * usará price_data dinámico como fallback.
 */
export function getStripePriceId(plan: B2BPlanId): string | null {
  const envKey = B2B_PLANS[plan].stripePriceIdEnvKey;
  return process.env[envKey] ?? null;
}

/**
 * Dado un número de empleados, devuelve el plan recomendado.
 */
export function getPlanForEmployeeCount(count: number): B2BPlanId {
  if (count >= 5000) return "global";
  if (count >= 1000) return "corporate";
  if (count >= 500) return "enterprise";
  if (count >= 200) return "business";
  if (count >= 50) return "growth";
  return "starter";
}

/**
 * Calcula el coste mensual y anual para un plan y número de empleados.
 * Facturación anual = 10 meses (2 meses gratis).
 */
export function calculateB2BCost(plan: B2BPlanId, employees: number) {
  const config = B2B_PLANS[plan];
  const monthly = config.pricePerEmployee * employees;
  const annual = monthly * 10; // 2 meses gratis
  const annualMonthly = annual / 12; // coste mensual equivalente con anual
  const annualSavings = monthly * 12 - annual; // ahorro anual
  return { monthly, annual, annualMonthly, annualSavings, pricePerEmployee: config.pricePerEmployee };
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
