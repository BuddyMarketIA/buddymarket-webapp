// ============================================================
// BuddyMarket — Plan Limits & Feature Gates
// ============================================================
// This file is the single source of truth for what each plan
// can and cannot do. Import it on both server and client.
// ============================================================

export type PlanTier = "free" | "basic" | "premium" | "pro_max";

export interface PlanLimits {
  // Recipes
  canCreateRecipes: boolean;
  maxSavedRecipes: number; // -1 = unlimited

  // Menus
  maxMenusPerMonth: number; // -1 = unlimited
  canGenerateAIMenus: boolean;
  canAccessSpecializedMenus: boolean;

  // Events
  canAccessEventMenus: boolean;
  maxEventMenusPerMonth: number; // -1 = unlimited, 1 = 1 free trial

  // Nutritional diary
  canAccessDiary: boolean;
  maxDiaryEntriesPerDay: number; // -1 = unlimited

  // Inventory
  canAccessInventory: boolean;
  maxInventoryItems: number; // -1 = unlimited

  // BuddyIA
  canUseBuddyIA: boolean;
  maxBuddyIAMessagesPerDay: number; // -1 = unlimited

  // Shopping
  canGenerateShoppingList: boolean;
  maxShoppingListsPerMonth: number; // -1 = unlimited
  canConnectSupermarket: boolean;

  // Health metrics
  canTrackMetrics: boolean;
  maxMetricsHistory: number; // days, -1 = unlimited

  // Community
  canAccessBuddyMakers: boolean;
  canAccessBuddyExperts: boolean;
  canBecomeBuddyMaker: boolean;
  canBecomeBuddyExpert: boolean;

  // Data
  canExportData: boolean;
  canManageMultipleProfiles: boolean;

  // Support
  prioritySupport: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  // FREE — 0€ (miel en los labios: todo limitado para que quieran más)
  free: {
    canCreateRecipes: false,          // ❌ No crear recetas
    maxSavedRecipes: 5,               // Solo 5 recetas guardadas

    maxMenusPerMonth: 1,              // Solo 1 menú al mes (sin IA)
    canGenerateAIMenus: false,        // ❌ Sin menús IA
    canAccessSpecializedMenus: false, // ❌ Sin menús especializados

    canAccessEventMenus: true,        // ✅ 1 menú de evento gratis para probar
    maxEventMenusPerMonth: 1,         // Solo 1 de prueba

    canAccessDiary: false,            // ❌ Sin diario nutricional
    maxDiaryEntriesPerDay: 0,

    canAccessInventory: true,         // ✅ Inventario básico
    maxInventoryItems: 10,            // Solo 10 productos

    canUseBuddyIA: false,             // ❌ Sin BuddyIA
    maxBuddyIAMessagesPerDay: 0,

    canGenerateShoppingList: true,    // ✅ Listas básicas
    maxShoppingListsPerMonth: 2,      // Solo 2 listas al mes
    canConnectSupermarket: false,     // ❌ Sin supermercado online

    canTrackMetrics: false,           // ❌ Sin métricas de salud
    maxMetricsHistory: 0,

    canAccessBuddyMakers: true,       // ✅ Ver BuddyMakers (canal de monetización)
    canAccessBuddyExperts: true,      // ✅ Ver BuddyExperts (canal de monetización)
    canBecomeBuddyMaker: true,        // any user can apply — BuddyMarket approves
    canBecomeBuddyExpert: true,       // any user can apply — BuddyMarket approves

    canExportData: false,
    canManageMultipleProfiles: false,

    prioritySupport: false,
  },

  // PRO — 9,99€/mes
  basic: {
    canCreateRecipes: true,
    maxSavedRecipes: -1,              // unlimited

    maxMenusPerMonth: -1,             // unlimited
    canGenerateAIMenus: true,
    canAccessSpecializedMenus: true,

    canAccessEventMenus: true,
    maxEventMenusPerMonth: -1,        // unlimited

    canAccessDiary: true,
    maxDiaryEntriesPerDay: -1,        // unlimited

    canAccessInventory: true,
    maxInventoryItems: -1,            // unlimited

    canUseBuddyIA: true,
    maxBuddyIAMessagesPerDay: 50,

    canGenerateShoppingList: true,
    maxShoppingListsPerMonth: -1,     // unlimited
    canConnectSupermarket: true,

    canTrackMetrics: true,
    maxMetricsHistory: 180,           // 6 months

    canAccessBuddyMakers: true,
    canAccessBuddyExperts: true,
    canBecomeBuddyMaker: true,
    canBecomeBuddyExpert: true,

    canExportData: false,
    canManageMultipleProfiles: false,

    prioritySupport: false,
  },

  // PRO MAX — 19,99€/mes
  premium: {
    canCreateRecipes: true,
    maxSavedRecipes: -1,

    maxMenusPerMonth: -1,
    canGenerateAIMenus: true,
    canAccessSpecializedMenus: true,

    canAccessEventMenus: true,
    maxEventMenusPerMonth: -1,

    canAccessDiary: true,
    maxDiaryEntriesPerDay: -1,

    canAccessInventory: true,
    maxInventoryItems: -1,

    canUseBuddyIA: true,
    maxBuddyIAMessagesPerDay: -1,     // unlimited

    canGenerateShoppingList: true,
    maxShoppingListsPerMonth: -1,
    canConnectSupermarket: true,

    canTrackMetrics: true,
    maxMetricsHistory: -1,            // unlimited

    canAccessBuddyMakers: true,
    canAccessBuddyExperts: true,
    canBecomeBuddyMaker: true,
    canBecomeBuddyExpert: true,

    canExportData: true,
    canManageMultipleProfiles: true,

    prioritySupport: true,
  },

  pro_max: {
    canCreateRecipes: true,
    maxSavedRecipes: -1,

    maxMenusPerMonth: -1,
    canGenerateAIMenus: true,
    canAccessSpecializedMenus: true,

    canAccessEventMenus: true,
    maxEventMenusPerMonth: -1,

    canAccessDiary: true,
    maxDiaryEntriesPerDay: -1,

    canAccessInventory: true,
    maxInventoryItems: -1,

    canUseBuddyIA: true,
    maxBuddyIAMessagesPerDay: -1,

    canGenerateShoppingList: true,
    maxShoppingListsPerMonth: -1,
    canConnectSupermarket: true,

    canTrackMetrics: true,
    maxMetricsHistory: -1,

    canAccessBuddyMakers: true,
    canAccessBuddyExperts: true,
    canBecomeBuddyMaker: true,
    canBecomeBuddyExpert: true,

    canExportData: true,
    canManageMultipleProfiles: true,

    prioritySupport: true,
  },
};

export const PLAN_DISPLAY: Record<PlanTier, {
  name: string;
  price: string;
  priceMonthly: number; // cents
  color: string;
  badge: string;
  description: string;
}> = {
  free: {
    name: "Free",
    price: "Gratis",
    priceMonthly: 0,
    color: "#6B7280",
    badge: "Gratis",
    description: "Para empezar a explorar BuddyMarket",
  },
  basic: {
    name: "Pro",
    price: "9,99€/mes",
    priceMonthly: 999,
    color: "#F97316",
    badge: "Pro",
    description: "Para usuarios que quieren sacar el máximo partido",
  },
  premium: {
    name: "Pro Max",
    price: "19,99€/mes",
    priceMonthly: 1999,
    color: "#7c3aed",
    badge: "Pro Max",
    description: "Para profesionales de la salud y usuarios avanzados",
  },
  pro_max: {
    name: "Pro Max Plus",
    price: "19,99€/mes",
    priceMonthly: 1999,
    color: "#0EA5E9",
    badge: "Pro Max+",
    description: "Para equipos y profesionales con necesidades avanzadas",
  },
};

/** Helper: get the effective plan tier from a subscription plan string */
export function getPlanTier(plan: string | null | undefined): PlanTier {
  if (!plan || plan === "free") return "free";
  if (plan === "basic") return "basic";
  if (plan === "premium") return "premium";
  if (plan === "pro_max") return "pro_max";
  return "free";
}

/** Helper: check if a plan has access to a feature */
export function hasFeature(plan: PlanTier, feature: keyof PlanLimits): boolean {
  const limits = PLAN_LIMITS[plan];
  const val = limits[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  return false;
}

/** Helper: get the next upgrade plan */
export function getUpgradePlan(current: PlanTier): PlanTier | null {
  if (current === "free") return "basic";
  if (current === "basic") return "premium";
  if (current === "premium") return "pro_max";
  return null;
}

/** Human-readable feature descriptions for upgrade modals */
export const FEATURE_DESCRIPTIONS: Partial<Record<keyof PlanLimits, { title: string; requiredPlan: PlanTier }>> = {
  canCreateRecipes: { title: "Crear recetas propias", requiredPlan: "basic" },
  canGenerateAIMenus: { title: "Generar menús con IA", requiredPlan: "basic" },
  canAccessSpecializedMenus: { title: "Menús especializados (embarazo, diabetes...)", requiredPlan: "basic" },
  canAccessEventMenus: { title: "Menús para eventos especiales", requiredPlan: "free" },
  canAccessDiary: { title: "Diario nutricional", requiredPlan: "basic" },
  canUseBuddyIA: { title: "Asistente BuddyIA", requiredPlan: "basic" },
  canConnectSupermarket: { title: "Conectar supermercado", requiredPlan: "basic" },
  canTrackMetrics: { title: "Seguimiento de métricas", requiredPlan: "basic" },
  canAccessBuddyExperts: { title: "Acceso a BuddyExperts", requiredPlan: "free" },
  canBecomeBuddyMaker: { title: "Convertirte en BuddyMaker", requiredPlan: "free" },
  canBecomeBuddyExpert: { title: "Convertirte en BuddyExpert", requiredPlan: "free" },
  canExportData: { title: "Exportar tus datos", requiredPlan: "premium" },
  canManageMultipleProfiles: { title: "Gestionar múltiples perfiles familiares", requiredPlan: "premium" },
};
