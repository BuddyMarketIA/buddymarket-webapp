/**
 * planGuard.ts — Server-side plan access validation helpers
 *
 * Usage inside tRPC procedures:
 *   const tier = await getUserPlanTier(ctx.user.id, ctx.user.role);
 *   requirePlanFeature(tier, "canUseBuddyIA");
 */
import { TRPCError } from "@trpc/server";
import { getPlanTier, PLAN_LIMITS, PLAN_DISPLAY, type PlanTier, type PlanLimits } from "../shared/plans";
import * as db from "./db";

/**
 * Get the current plan tier for a user.
 * - Admins always get pro_max tier regardless of subscription.
 * - Users with a manual plan override (set by admin) use that plan.
 * - Otherwise, uses the active Stripe subscription.
 */
export async function getUserPlanTier(userId: number, userRole?: string): Promise<PlanTier> {
  // Admins have full access to all features — no subscription needed
  if (userRole === "admin") return "pro_max";

  const sub = await db.getUserSubscription(userId);
  if (!sub) return "free";

  // Manual plan assigned by admin (no Stripe required)
  if (sub.manualPlan && sub.manualPlan !== "free") {
    return getPlanTier(sub.manualPlan);
  }

  // Stripe subscription
  if (sub.status === "active" && sub.plan) {
    return getPlanTier(sub.plan);
  }

  return "free";
}

/** Throw FORBIDDEN if user doesn't have the required feature */
export function requirePlanFeature(tier: PlanTier, feature: keyof PlanLimits): void {
  const limits = PLAN_LIMITS[tier];
  const val = limits[feature];
  const hasAccess = typeof val === "boolean" ? val : (typeof val === "number" ? val !== 0 : false);
  if (!hasAccess) {
    const requiredPlan = getRequiredPlan(feature);
    const planName = PLAN_DISPLAY[requiredPlan].name;
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `PLAN_UPGRADE_REQUIRED:${feature}:${requiredPlan}:Esta función requiere el plan ${planName}`,
    });
  }
}

/** Check a numeric limit — throw if at or over limit */
export function requireUnderLimit(
  tier: PlanTier,
  feature: "maxSavedRecipes" | "maxMenusPerMonth" | "maxInventoryItems" | "maxBuddyIAMessagesPerDay" | "maxDiaryEntriesPerDay",
  current: number
): void {
  const limit = PLAN_LIMITS[tier][feature] as number;
  if (limit === -1) return; // unlimited
  if (current >= limit) {
    const requiredPlan = getUpgradePlan(tier) ?? "basic";
    const planName = PLAN_DISPLAY[requiredPlan].name;
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `PLAN_LIMIT_REACHED:${feature}:${requiredPlan}:Has alcanzado el límite de tu plan. Actualiza a ${planName} para continuar.`,
    });
  }
}

function getRequiredPlan(feature: keyof PlanLimits): PlanTier {
  // Determine the minimum plan that has this feature
  const tiers: PlanTier[] = ["free", "basic", "premium", "pro_max"];
  for (const tier of tiers) {
    const val = PLAN_LIMITS[tier][feature];
    const hasIt = typeof val === "boolean" ? val : (typeof val === "number" ? val !== 0 : false);
    if (hasIt) return tier;
  }
  return "pro_max";
}

function getUpgradePlan(current: PlanTier): PlanTier | null {
  if (current === "free") return "basic";
  if (current === "basic") return "premium";
  if (current === "premium") return "pro_max";
  return null;
}
