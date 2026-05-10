import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, referralEarnings, referralCodes } from "../../drizzle/schema";
import { eq, gte, lte, and, count, sql } from "drizzle-orm";

export const analyticsRouter = router({
  /**
   * Get viral growth metrics
   */
  getViralMetrics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Total users
    const totalUsers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.active, true));

    // Users with referral codes
    const usersWithCodes = await db
      .select({ count: count() })
      .from(referralCodes)
      .where(eq(referralCodes.isActive, true));

    // Total referrals made
    const totalReferrals = await db
      .select({ count: count() })
      .from(referralEarnings);

    // Average referrals per user
    const avgReferralsPerUser =
      usersWithCodes[0]?.count > 0
        ? (totalReferrals[0]?.count || 0) / usersWithCodes[0].count
        : 0;

    return {
      totalUsers: totalUsers[0]?.count || 0,
      usersWithCodes: usersWithCodes[0]?.count || 0,
      totalReferrals: totalReferrals[0]?.count || 0,
      avgReferralsPerUser: Math.round(avgReferralsPerUser * 100) / 100,
      conversionRate:
        totalUsers[0]?.count > 0
          ? Math.round(
              ((usersWithCodes[0]?.count || 0) / totalUsers[0].count) * 10000
            ) / 100
          : 0,
    };
  }),

  /**
   * Get growth trend over time (last 30 days)
   */
  getGrowthTrend: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Daily new users
    const dailyNewUsers = await db
      .select({
        date: sql`DATE(${users.createdAt})`,
        count: count(),
      })
      .from(users)
      .where(
        and(
          gte(users.createdAt, thirtyDaysAgo),
          eq(users.active, true)
        )
      )
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    // Daily referrals
    const dailyReferrals = await db
      .select({
        date: sql`DATE(${referralEarnings.createdAt})`,
        count: count(),
      })
      .from(referralEarnings)
      .where(gte(referralEarnings.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${referralEarnings.createdAt})`)
      .orderBy(sql`DATE(${referralEarnings.createdAt})`);

    return {
      dailyNewUsers: dailyNewUsers.map((d) => ({
        date: d.date,
        count: d.count,
      })),
      dailyReferrals: dailyReferrals.map((d) => ({
        date: d.date,
        count: d.count,
      })),
    };
  }),

  /**
   * Get top referrers
   */
  getTopReferrers: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const topReferrers = await db
        .select({
          userId: referralCodes.userId,
          userName: users.name,
          userEmail: users.email,
          referralCount: count(referralEarnings.id),
          totalEarnings: sql<number>`COALESCE(SUM(${referralEarnings.amount}), 0)`,
        })
        .from(referralCodes)
        .leftJoin(users, eq(referralCodes.userId, users.id))
        .leftJoin(
          referralEarnings,
          eq(referralCodes.id, referralEarnings.referralCodeId)
        )
        .groupBy(referralCodes.userId, users.name, users.email)
        .orderBy(sql`COUNT(${referralEarnings.id}) DESC`)
        .limit(input.limit);

      return topReferrers.map((r) => ({
        userId: r.userId,
        name: r.userName || "Usuario",
        email: r.userEmail,
        referralCount: r.referralCount,
        totalEarnings: r.totalEarnings || 0,
      }));
    }),

  /**
   * Get cohort analysis (retention by signup date)
   */
  getCohortAnalysis: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get users grouped by signup week
    const cohorts = await db
      .select({
        cohortWeek: sql`DATE_TRUNC('week', ${users.createdAt})`,
        count: count(),
      })
      .from(users)
      .where(eq(users.active, true))
      .groupBy(sql`DATE_TRUNC('week', ${users.createdAt})`)
      .orderBy(sql`DATE_TRUNC('week', ${users.createdAt}) DESC`)
      .limit(12); // Last 12 weeks

    return cohorts.map((c) => ({
      week: c.cohortWeek,
      usersSignedUp: c.count,
    }));
  }),

  /**
   * Get referral performance by plan tier
   */
  getReferralByPlanTier: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // This is a simplified version - in production, you'd join with subscription data
    const referralsByUser = await db
      .select({
        userId: referralCodes.userId,
        referralCount: count(referralEarnings.id),
      })
      .from(referralCodes)
      .leftJoin(
        referralEarnings,
        eq(referralCodes.id, referralEarnings.referralCodeId)
      )
      .groupBy(referralCodes.userId);

    // Categorize by referral count
    const categories = {
      noReferrals: referralsByUser.filter((r) => r.referralCount === 0).length,
      oneToThree: referralsByUser.filter(
        (r) => r.referralCount >= 1 && r.referralCount <= 3
      ).length,
      fourToTen: referralsByUser.filter(
        (r) => r.referralCount >= 4 && r.referralCount <= 10
      ).length,
      moreThanTen: referralsByUser.filter(
        (r) => r.referralCount > 10
      ).length,
    };

    return categories;
  }),

  /**
   * Get viral loop efficiency (time from signup to first referral)
   */
  getViralLoopEfficiency: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get users who have made referrals
    const usersWithReferrals = await db
      .select({
        userId: referralEarnings.userId,
        userSignupDate: users.createdAt,
        firstReferralDate: sql<Date>`MIN(${referralEarnings.createdAt})`,
      })
      .from(referralEarnings)
      .innerJoin(users, eq(referralEarnings.userId, users.id))
      .groupBy(referralEarnings.userId, users.createdAt);

    // Calculate average days to first referral
    const avgDaysToFirstReferral =
      usersWithReferrals.length > 0
        ? usersWithReferrals.reduce((sum, u) => {
            const daysToReferral = Math.floor(
              (new Date(u.firstReferralDate!).getTime() -
                new Date(u.userSignupDate).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + daysToReferral;
          }, 0) / usersWithReferrals.length
        : 0;

    return {
      usersWhoReferred: usersWithReferrals.length,
      avgDaysToFirstReferral: Math.round(avgDaysToFirstReferral * 10) / 10,
    };
  }),
});
