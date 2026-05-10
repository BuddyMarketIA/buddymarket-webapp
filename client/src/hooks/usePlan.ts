import { trpc } from "@/lib/trpc";
import { getPlanTier, PLAN_LIMITS, PLAN_DISPLAY, hasFeature, getUpgradePlan, type PlanTier, type PlanLimits } from "@shared/plans";

/**
 * usePlan — hook to check the current user's plan and feature access.
 *
 * Usage:
 *   const { tier, can, limits, upgradeTo, planDisplay } = usePlan();
 *   if (!can("canUseBuddyIA")) return <UpgradeGate feature="canUseBuddyIA" />;
 */
export function usePlan() {
  const { data: sub } = trpc.subscriptions.getStatus.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const tier: PlanTier = getPlanTier(sub?.plan);
  const limits = PLAN_LIMITS[tier];
  const planDisplay = PLAN_DISPLAY[tier];
  const upgradeTo = getUpgradePlan(tier);

  const can = (feature: keyof PlanLimits): boolean => {
    return hasFeature(tier, feature);
  };

  const isAtLimit = (feature: "maxSavedRecipes" | "maxMenusPerMonth" | "maxInventoryItems" | "maxBuddyIAMessagesPerDay" | "maxDiaryEntriesPerDay", current: number): boolean => {
    const limit = limits[feature] as number;
    if (limit === -1) return false; // unlimited
    return current >= limit;
  };

  const isFree = tier === "free";
  const isPro = tier === "basic";
  const isProMax = tier === "premium" || tier === "pro_max";
  const isProMaxPlus = tier === "pro_max";
  const isActive = sub?.status === "active" || tier === "free";

  return {
    tier,
    limits,
    planDisplay,
    upgradeTo,
    can,
    isAtLimit,
    isFree,
    isPro,
    isProMax,
    isProMaxPlus,
    isActive,
    subscription: sub,
  };
}
