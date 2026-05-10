import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { referralCodes, referralEarnings, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const referralRouter = router({
  /**
   * Get user's referral code or create one if doesn't exist
   */
  getOrCreateReferralCode: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Check if user already has a referral code
    const existingCode = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, userId))
      .limit(1);

    if (existingCode.length > 0) {
      return existingCode[0];
    }

    // Generate new referral code
    const code = `BDY${userId}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newCode = await db
      .insert(referralCodes)
      .values({
        userId,
        code,
        isActive: true,
      })
      .returning();

    return newCode[0];
  }),

  /**
   * Get referral statistics for current user
   */
  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get referral code
    const code = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, userId))
      .limit(1);

    if (code.length === 0) {
      return {
        totalReferrals: 0,
        totalEarnings: 0,
        totalPoints: 0,
        referralCode: null,
      };
    }

    const referralCodeId = code[0].id;

    // Get total earnings
    const earnings = await db
      .select()
      .from(referralEarnings)
      .where(eq(referralEarnings.referralCodeId, referralCodeId));

    const totalEarnings = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalReferrals = earnings.length;

    // Calculate points (500 per referral, 1000 for 3 referrals, 3000 for 10 referrals)
    let totalPoints = 0;
    if (totalReferrals >= 10) {
      totalPoints = 3000; // Bonus for 10 referrals
    } else if (totalReferrals >= 3) {
      totalPoints = 1000; // Bonus for 3 referrals
    } else {
      totalPoints = totalReferrals * 500; // 500 points per referral
    }

    return {
      totalReferrals,
      totalEarnings,
      totalPoints,
      referralCode: code[0].code,
    };
  }),

  /**
   * Get list of referred users
   */
  getReferredUsers: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get referral code
    const code = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, userId))
      .limit(1);

    if (code.length === 0) {
      return [];
    }

    const referralCodeId = code[0].id;

    // Get referred users
    const referredUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: referralEarnings.createdAt,
        amount: referralEarnings.amount,
      })
      .from(referralEarnings)
      .innerJoin(users, eq(referralEarnings.userId, users.id))
      .where(eq(referralEarnings.referralCodeId, referralCodeId));

    return referredUsers;
  }),

  /**
   * Apply referral code when user signs up
   */
  applyReferralCode: protectedProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Find referral code
      const refCode = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.code, input.code))
        .limit(1);

      if (refCode.length === 0) {
        throw new Error("Invalid referral code");
      }

      if (!refCode[0].isActive) {
        throw new Error("Referral code is not active");
      }

      // Update user with referral code
      await db
        .update(users)
        .set({ usedReferralCode: input.code })
        .where(eq(users.id, userId));

      // Create referral earning
      await db.insert(referralEarnings).values({
        referralCodeId: refCode[0].id,
        userId,
        amount: 500, // Base reward
      });

      return { success: true };
    }),

  /**
   * Get referral rewards tiers
   */
  getRewardsTiers: protectedProcedure.query(async () => {
    return [
      {
        tier: 1,
        referrals: 1,
        points: 500,
        reward: "500 puntos",
        description: "Invita 1 amigo",
      },
      {
        tier: 2,
        referrals: 3,
        points: 1000,
        reward: "1 mes Pro gratis",
        description: "Invita 3 amigos",
      },
      {
        tier: 3,
        referrals: 10,
        points: 3000,
        reward: "3 meses Pro Max gratis",
        description: "Invita 10 amigos",
      },
    ];
  }),
});
