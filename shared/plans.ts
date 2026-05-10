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
  canUseDiaryPhotoAI: boolean;  // IA para identificar alimentos por foto

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

  // Household / Familia
  canUseHousehold: boolean;

  // Support
  prioritySupport: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  // FREE — 0€ (acceso completo con límites generosos para descubrir la app)
  free: {
    canCreateRecipes: true,           // ✅ Puede crear 1 receta propia
    maxSavedRecipes: 15,              // 15 recetas guardadas

    maxMenusPerMonth: 2,              // 2 menús manuales al mes
    canGenerateAIMenus: true,         // ✅ 1 menú IA de prueba al mes
    canAccessSpecializedMenus: true,  // ✅ 1 menú especializado de prueba

    canAccessEventMenus: true,        // ✅ 1 menú de evento gratis
    maxEventMenusPerMonth: 1,

    canAccessDiary: true,             // ✅ DIARIO COMPLETAMENTE GRATIS
    maxDiaryEntriesPerDay: -1,        // Sin límite de entradas
    canUseDiaryPhotoAI: false,        // ❌ Foto IA = solo premium

    canAccessInventory: true,         // ✅ Inventario básico
    maxInventoryItems: 25,            // 25 productos

    canUseBuddyIA: true,              // ✅ 5 mensajes/día de prueba
    maxBuddyIAMessagesPerDay: 5,

    canGenerateShoppingList: true,    // ✅ Listas de compra
    maxShoppingListsPerMonth: 3,      // 3 listas al mes
    canConnectSupermarket: false,     // ❌ Sin supermercado online (premium)

    canTrackMetrics: true,            // ✅ Métricas básicas gratis (peso, medidas)
    maxMetricsHistory: 90,            // 90 días de historial

    canAccessBuddyMakers: true,       // ✅ Ver BuddyMakers
    canAccessBuddyExperts: true,      // ✅ Ver BuddyExperts
    canBecomeBuddyMaker: true,
    canBecomeBuddyExpert: true,

    canExportData: false,             // ❌ Sin exportar datos (premium)
    canManageMultipleProfiles: false, // ❌ Sin perfiles familiares (premium)
    canUseHousehold: false,           // ❌ Sin modo familia (premium)

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
    canUseDiaryPhotoAI: true,         // ✅ Foto IA en diario (Pro)

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
    canUseHousehold: false,

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
    canUseDiaryPhotoAI: true,         // ✅ Foto IA en diario (Pro Max)

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
    canUseHousehold: true,

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
    canUseDiaryPhotoAI: true,         // ✅ Foto IA en diario (Pro Max Plus)

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
    canUseHousehold: true,

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
  canCreateRecipes: { title: "Crear recetas propias", requiredPlan: "free" },
  canGenerateAIMenus: { title: "Generar menús con IA (ilimitado)", requiredPlan: "basic" },
  canAccessSpecializedMenus: { title: "Menús especializados ilimitados", requiredPlan: "basic" },
  canAccessEventMenus: { title: "Menús para eventos especiales", requiredPlan: "free" },
  canAccessDiary: { title: "Diario nutricional", requiredPlan: "free" },
  canUseDiaryPhotoAI: { title: "Identificar alimentos por foto con IA", requiredPlan: "basic" },
  canUseBuddyIA: { title: "Asistente BuddyIA (ilimitado)", requiredPlan: "basic" },
  canConnectSupermarket: { title: "Conectar supermercado online", requiredPlan: "basic" },
  canTrackMetrics: { title: "Seguimiento de métricas de salud", requiredPlan: "free" },
  canAccessBuddyExperts: { title: "Acceso a BuddyExperts", requiredPlan: "free" },
  canBecomeBuddyMaker: { title: "Convertirte en BuddyMaker", requiredPlan: "free" },
  canBecomeBuddyExpert: { title: "Convertirte en BuddyExpert", requiredPlan: "free" },
  canExportData: { title: "Exportar tus datos", requiredPlan: "premium" },
  canManageMultipleProfiles: { title: "Gestionar múltiples perfiles familiares", requiredPlan: "premium" },
  canUseHousehold: { title: "Modo Familia — hogar compartido", requiredPlan: "premium" },
};
