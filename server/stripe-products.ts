// BuddyOne Stripe subscription plans
export const STRIPE_PLANS = {
  basic: {
    name: "BuddyOne Basic",
    description: "Plan básico con acceso a recetas, menús y listas de compra",
    priceMonthly: 499, // 4.99€ in cents
    features: [
      "Recetas ilimitadas",
      "Planificador de menús",
      "Listas de compra",
      "Inventario básico",
    ],
  },
  premium: {
    name: "BuddyOne Premium",
    description: "Plan premium con IA, seguimiento nutricional avanzado y más",
    priceMonthly: 999, // 9.99€ in cents
    features: [
      "Todo lo del plan Basic",
      "Generación de menús con IA",
      "Seguimiento nutricional avanzado",
      "Perfil médico completo",
      "Alertas de inventario",
      "Soporte prioritario",
    ],
  },
  pro_max: {
    name: "BuddyOne Pro Max",
    description: "Plan profesional para nutricionistas y expertos en salud",
    priceMonthly: 1999, // 19.99€ in cents
    features: [
      "Todo lo del plan Premium",
      "Gestión de múltiples perfiles",
      "Exportación de datos",
      "API de integración",
      "Soporte dedicado",
      "Acceso anticipado a nuevas funciones",
    ],
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;
