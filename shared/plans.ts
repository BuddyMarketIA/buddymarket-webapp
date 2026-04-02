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
  free: {
    canCreateRecipes: false,
    maxSavedRecipes: 10,

    maxMenusPerMonth: 3,
    canGenerateAIMenus: false,
    canAccessSpecializedMenus: false,

    canAccessDiary: false,
    maxDiaryEntriesPerDay: 0,

    canAccessInventory: true,
    maxInventoryItems: 20,

    canUseBuddyIA: false,
    maxBuddyIAMessagesPerDay: 0,

    canGenerateShoppingList: true,
    canConnectSupermarket: false,

    canTrackMetrics: false,
    maxMetricsHistory: 0,

    canAccessBuddyMakers: true, // can view
    canAccessBuddyExperts: false,
    canBecomeBuddyMaker: false,
    canBecomeBuddyExpert: false,

    canExportData: false,
    canManageMultipleProfiles: false,

    prioritySupport: false,
  },

  basic: {
    canCreateRecipes: true,
    maxSavedRecipes: 100,

    maxMenusPerMonth: 20,
    canGenerateAIMenus: true,
    canAccessSpecializedMenus: true,

    canAccessDiary: true,
    maxDiaryEntriesPerDay: 5,

    canAccessInventory: true,
    maxInventoryItems: 200,

    canUseBuddyIA: true,
    maxBuddyIAMessagesPerDay: 20,

    canGenerateShoppingList: true,
    canConnectSupermarket: true,

    canTrackMetrics: true,
    maxMetricsHistory: 90,

    canAccessBuddyMakers: true,
    canAccessBuddyExperts: false,
    canBecomeBuddyMaker: true,
    canBecomeBuddyExpert: false,

    canExportData: false,
    canManageMultipleProfiles: false,

    prioritySupport: false,
  },

  premium: {
    canCreateRecipes: true,
    maxSavedRecipes: -1,

    maxMenusPerMonth: -1,
    canGenerateAIMenus: true,
    canAccessSpecializedMenus: true,

    canAccessDiary: true,
    maxDiaryEntriesPerDay: -1,

    canAccessInventory: true,
    maxInventoryItems: -1,

    canUseBuddyIA: true,
    maxBuddyIAMessagesPerDay: 100,

    canGenerateShoppingList: true,
    canConnectSupermarket: true,

    canTrackMetrics: true,
    maxMetricsHistory: 365,

    canAccessBuddyMakers: true,
    canAccessBuddyExperts: true,
    canBecomeBuddyMaker: true,
    canBecomeBuddyExpert: true,

    canExportData: true,
    canManageMultipleProfiles: false,

    prioritySupport: false,
  },

  pro_max: {
    canCreateRecipes: true,
    maxSavedRecipes: -1,

    maxMenusPerMonth: -1,
    canGenerateAIMenus: true,
    canAccessSpecializedMenus: true,

    canAccessDiary: true,
    maxDiaryEntriesPerDay: -1,

    canAccessInventory: true,
    maxInventoryItems: -1,

    canUseBuddyIA: true,
    maxBuddyIAMessagesPerDay: -1,

    canGenerateShoppingList: true,
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
    price: "4,99€/mes",
    priceMonthly: 499,
    color: "#F97316",
    badge: "Pro",
    description: "Para usuarios que quieren sacar el máximo partido",
  },
  premium: {
    name: "Pro Max",
    price: "9,99€/mes",
    priceMonthly: 999,
    color: "#8B5CF6",
    badge: "Pro Max",
    description: "Para usuarios avanzados y profesionales de la salud",
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
  canAccessDiary: { title: "Diario nutricional", requiredPlan: "basic" },
  canUseBuddyIA: { title: "Asistente BuddyIA", requiredPlan: "basic" },
  canConnectSupermarket: { title: "Conectar supermercado", requiredPlan: "basic" },
  canTrackMetrics: { title: "Seguimiento de métricas", requiredPlan: "basic" },
  canAccessBuddyExperts: { title: "Acceso a BuddyExperts", requiredPlan: "premium" },
  canBecomeBuddyMaker: { title: "Convertirte en BuddyMaker", requiredPlan: "basic" },
  canBecomeBuddyExpert: { title: "Convertirte en BuddyExpert", requiredPlan: "premium" },
  canExportData: { title: "Exportar tus datos", requiredPlan: "premium" },
  canManageMultipleProfiles: { title: "Gestionar múltiples perfiles", requiredPlan: "pro_max" },
};
