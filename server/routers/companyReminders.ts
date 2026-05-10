import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  companies,
  companyActivationCodes,
  companyReminderCampaigns,
  companyReminderLogs,
} from "../../drizzle/schema";
import { eq, and, isNull, lt, count, sql } from "drizzle-orm";
import { sendCompanyReminderEmail } from "../email";

// ─── Helper: verify user is admin of the company ──────────────────────────────
async function getCompanyForAdmin(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.adminUserId, userId))
    .limit(1);
  if (!company) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tienes una empresa asociada a tu cuenta." });
  }
  return company;
}

// ─── Reminder Router ──────────────────────────────────────────────────────────
export const companyRemindersRouter = router({

  // Get list of pending (unused) activation codes for this company
  getPendingCodes: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyForAdmin(ctx.user.id);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const pending = await db
      .select({
        id: companyActivationCodes.id,
        code: companyActivationCodes.code,
        expiresAt: companyActivationCodes.expiresAt,
        createdAt: companyActivationCodes.createdAt,
      })
      .from(companyActivationCodes)
      .where(
        and(
          eq(companyActivationCodes.companyId, company.id),
          eq(companyActivationCodes.status, "available")
        )
      )
      .orderBy(companyActivationCodes.createdAt);
    return { company, pending };
  }),

  // List all campaigns for this company
  listCampaigns: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyForAdmin(ctx.user.id);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const campaigns = await db
      .select()
      .from(companyReminderCampaigns)
      .where(eq(companyReminderCampaigns.companyId, company.id))
      .orderBy(sql`${companyReminderCampaigns.createdAt} DESC`);
    return campaigns;
  }),

  // Get logs for a specific campaign
  getCampaignLogs: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ ctx, input }) => {
      const company = await getCompanyForAdmin(ctx.user.id);
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      // Verify campaign belongs to this company
      const [campaign] = await db
        .select()
        .from(companyReminderCampaigns)
        .where(
          and(
            eq(companyReminderCampaigns.id, input.campaignId),
            eq(companyReminderCampaigns.companyId, company.id)
          )
        )
        .limit(1);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      const logs = await db
        .select()
        .from(companyReminderLogs)
        .where(eq(companyReminderLogs.campaignId, input.campaignId))
        .orderBy(sql`${companyReminderLogs.createdAt} DESC`);
      return { campaign, logs };
    }),

  // Create and send a reminder campaign immediately
  sendNow: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        type: z.enum(["activation", "engagement", "expiry_warning", "custom"]),
        subject: z.string().min(1).max(255),
        customMessage: z.string().max(1000).optional(),
        // Recipients: array of { email, name, code? }
        recipients: z.array(
          z.object({
            email: z.string().email(),
            name: z.string(),
            activationCode: z.string().optional(),
            expiresAt: z.string().optional(),
          })
        ).min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyForAdmin(ctx.user.id);
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Create the campaign record
      const [campaign] = await db
        .insert(companyReminderCampaigns)
        .values({
          companyId: company.id,
          name: input.name,
          type: input.type,
          subject: input.subject,
          bodyHtml: input.customMessage || "",
          totalRecipients: input.recipients.length,
          status: "pending",
          createdByUserId: ctx.user.id,
        })
        .returning();

      // Create log entries for each recipient
      const logEntries = input.recipients.map((r) => ({
        campaignId: campaign.id,
        companyId: company.id,
        recipientEmail: r.email,
        recipientName: r.name,
        activationCode: r.activationCode,
        status: "pending" as const,
      }));
      await db.insert(companyReminderLogs).values(logEntries);

      // Send emails asynchronously (fire and forget with tracking)
      let sentCount = 0;
      let failedCount = 0;

      for (const recipient of input.recipients) {
        const result = await sendCompanyReminderEmail({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          companyName: company.name,
          type: input.type,
          subject: input.subject,
          activationCode: recipient.activationCode,
          expiresAt: recipient.expiresAt,
          customMessage: input.customMessage,
        });

        // Update log entry status
        await db
          .update(companyReminderLogs)
          .set({
            status: result.success ? "sent" : "failed",
            sentAt: result.success ? new Date() : undefined,
            errorMessage: result.error,
          })
          .where(
            and(
              eq(companyReminderLogs.campaignId, campaign.id),
              eq(companyReminderLogs.recipientEmail, recipient.email)
            )
          );

        if (result.success) sentCount++;
        else failedCount++;
      }

      // Update campaign with final counts
      await db
        .update(companyReminderCampaigns)
        .set({
          status: "sent",
          sentAt: new Date(),
          sentCount,
          failedCount,
          updatedAt: new Date(),
        })
        .where(eq(companyReminderCampaigns.id, campaign.id));

      return {
        campaignId: campaign.id,
        totalRecipients: input.recipients.length,
        sentCount,
        failedCount,
      };
    }),

  // Send activation reminders to all employees with pending codes
  sendActivationReminders: protectedProcedure
    .input(
      z.object({
        recipients: z.array(
          z.object({
            email: z.string().email(),
            name: z.string(),
            activationCode: z.string(),
            expiresAt: z.string().optional(),
          })
        ).min(1).max(500),
        customMessage: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyForAdmin(ctx.user.id);
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const campaignName = `Recordatorio activación — ${new Date().toLocaleDateString("es-ES")}`;
      const subject = `${company.name} te invita a activar BuddyMarket Pro`;

      const [campaign] = await db
        .insert(companyReminderCampaigns)
        .values({
          companyId: company.id,
          name: campaignName,
          type: "activation",
          subject,
          bodyHtml: input.customMessage || "",
          totalRecipients: input.recipients.length,
          status: "pending",
          createdByUserId: ctx.user.id,
        })
        .returning();

      const logEntries = input.recipients.map((r) => ({
        campaignId: campaign.id,
        companyId: company.id,
        recipientEmail: r.email,
        recipientName: r.name,
        activationCode: r.activationCode,
        status: "pending" as const,
      }));
      await db.insert(companyReminderLogs).values(logEntries);

      let sentCount = 0;
      let failedCount = 0;

      for (const recipient of input.recipients) {
        const result = await sendCompanyReminderEmail({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          companyName: company.name,
          type: "activation",
          subject,
          activationCode: recipient.activationCode,
          expiresAt: recipient.expiresAt,
          customMessage: input.customMessage,
        });

        await db
          .update(companyReminderLogs)
          .set({
            status: result.success ? "sent" : "failed",
            sentAt: result.success ? new Date() : undefined,
            errorMessage: result.error,
          })
          .where(
            and(
              eq(companyReminderLogs.campaignId, campaign.id),
              eq(companyReminderLogs.recipientEmail, recipient.email)
            )
          );

        if (result.success) sentCount++;
        else failedCount++;
      }

      await db
        .update(companyReminderCampaigns)
        .set({
          status: "sent",
          sentAt: new Date(),
          sentCount,
          failedCount,
          updatedAt: new Date(),
        })
        .where(eq(companyReminderCampaigns.id, campaign.id));

      return { campaignId: campaign.id, sentCount, failedCount };
    }),

  // Cancel a pending campaign
  cancelCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyForAdmin(ctx.user.id);
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [campaign] = await db
        .select()
        .from(companyReminderCampaigns)
        .where(
          and(
            eq(companyReminderCampaigns.id, input.campaignId),
            eq(companyReminderCampaigns.companyId, company.id),
            eq(companyReminderCampaigns.status, "pending")
          )
        )
        .limit(1);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaña no encontrada o ya enviada." });

      await db
        .update(companyReminderCampaigns)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(companyReminderCampaigns.id, input.campaignId));

      return { success: true };
    }),

  // Get stats summary for the dashboard
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyForAdmin(ctx.user.id);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const [totalCampaigns] = await db
      .select({ count: count() })
      .from(companyReminderCampaigns)
      .where(eq(companyReminderCampaigns.companyId, company.id));

    const [totalSent] = await db
      .select({ count: count() })
      .from(companyReminderLogs)
      .where(
        and(
          eq(companyReminderLogs.companyId, company.id),
          eq(companyReminderLogs.status, "sent")
        )
      );

    const [totalFailed] = await db
      .select({ count: count() })
      .from(companyReminderLogs)
      .where(
        and(
          eq(companyReminderLogs.companyId, company.id),
          eq(companyReminderLogs.status, "failed")
        )
      );

    const [pendingCodes] = await db
      .select({ count: count() })
      .from(companyActivationCodes)
      .where(
        and(
          eq(companyActivationCodes.companyId, company.id),
          eq(companyActivationCodes.status, "available")
        )
      );

    return {
      totalCampaigns: totalCampaigns?.count ?? 0,
      totalSent: totalSent?.count ?? 0,
      totalFailed: totalFailed?.count ?? 0,
      pendingCodes: pendingCodes?.count ?? 0,
    };
  }),
});
