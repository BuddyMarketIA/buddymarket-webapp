import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  emailContacts,
  emailLists,
  emailListMembers,
  emailCampaigns,
  emailCampaignSends,
} from "../../drizzle/schema";
import { eq, and, desc, count, sql, inArray, like, ilike } from "drizzle-orm";
import { Resend } from "resend";
import { TRPCError } from "@trpc/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || "BuddyMarket <info@buddymarket.io>";

// Rate limit: max 10 emails per second (Resend free tier limit)
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const emailCampaignsRouter = router({
  // ─── CONTACTS ───────────────────────────────────────────────────────────────

  listContacts: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      search: z.string().optional(),
      subscribedOnly: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const offset = (input.page - 1) * input.limit;
      const conditions = [];
      if (input.subscribedOnly) conditions.push(eq(emailContacts.subscribed, true));
      if (input.search) {
        conditions.push(
          sql`(${emailContacts.email} ILIKE ${'%' + input.search + '%'} OR ${emailContacts.name} ILIKE ${'%' + input.search + '%'})`
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [contacts, totalResult] = await Promise.all([
        db.select().from(emailContacts).where(where).orderBy(desc(emailContacts.createdAt)).limit(input.limit).offset(offset),
        db.select({ count: count() }).from(emailContacts).where(where),
      ]);

      return {
        contacts,
        total: totalResult[0]?.count ?? 0,
        page: input.page,
        totalPages: Math.ceil((totalResult[0]?.count ?? 0) / input.limit),
      };
    }),

  createContact: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().optional(),
      company: z.string().optional(),
      tags: z.array(z.string()).optional(),
      source: z.string().default("manual"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const existing = await db.select().from(emailContacts).where(eq(emailContacts.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "El contacto ya existe" });
      }

      const [contact] = await db.insert(emailContacts).values({
        email: input.email,
        name: input.name || null,
        company: input.company || null,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        source: input.source,
      }).returning();

      return contact;
    }),

  importContacts: protectedProcedure
    .input(z.object({
      contacts: z.array(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        company: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })),
      listId: z.number().optional(),
      source: z.string().default("csv_import"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      let imported = 0;
      let skipped = 0;

      for (const c of input.contacts) {
        try {
          const existing = await db.select({ id: emailContacts.id }).from(emailContacts).where(eq(emailContacts.email, c.email)).limit(1);
          if (existing.length > 0) {
            skipped++;
            // If listId provided, add existing contact to list
            if (input.listId) {
              await db.insert(emailListMembers).values({
                listId: input.listId,
                contactId: existing[0].id,
              }).onConflictDoNothing();
            }
            continue;
          }

          const [newContact] = await db.insert(emailContacts).values({
            email: c.email,
            name: c.name || null,
            company: c.company || null,
            tags: c.tags ? JSON.stringify(c.tags) : null,
            source: input.source,
          }).returning();

          if (input.listId && newContact) {
            await db.insert(emailListMembers).values({
              listId: input.listId,
              contactId: newContact.id,
            }).onConflictDoNothing();
          }

          imported++;
        } catch {
          skipped++;
        }
      }

      // Update list contact count
      if (input.listId) {
        const countResult = await db.select({ count: count() }).from(emailListMembers).where(eq(emailListMembers.listId, input.listId));
        await db.update(emailLists).set({ contactCount: countResult[0]?.count ?? 0, updatedAt: new Date() }).where(eq(emailLists.id, input.listId));
      }

      return { imported, skipped, total: input.contacts.length };
    }),

  deleteContact: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.delete(emailListMembers).where(eq(emailListMembers.contactId, input.id));
      await db.delete(emailContacts).where(eq(emailContacts.id, input.id));
      return { success: true };
    }),

  // ─── LISTS ──────────────────────────────────────────────────────────────────

  listLists: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    return db.select().from(emailLists).orderBy(desc(emailLists.createdAt));
  }),

  createList: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      color: z.string().default("#F97316"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [list] = await db.insert(emailLists).values({
        name: input.name,
        description: input.description || null,
        color: input.color,
      }).returning();

      return list;
    }),

  deleteList: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.delete(emailListMembers).where(eq(emailListMembers.listId, input.id));
      await db.delete(emailLists).where(eq(emailLists.id, input.id));
      return { success: true };
    }),

  addContactsToList: protectedProcedure
    .input(z.object({
      listId: z.number(),
      contactIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      for (const contactId of input.contactIds) {
        await db.insert(emailListMembers).values({
          listId: input.listId,
          contactId,
        }).onConflictDoNothing();
      }

      const countResult = await db.select({ count: count() }).from(emailListMembers).where(eq(emailListMembers.listId, input.listId));
      await db.update(emailLists).set({ contactCount: countResult[0]?.count ?? 0, updatedAt: new Date() }).where(eq(emailLists.id, input.listId));

      return { success: true, count: countResult[0]?.count ?? 0 };
    }),

  getListContacts: protectedProcedure
    .input(z.object({ listId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const members = await db
        .select({
          id: emailContacts.id,
          email: emailContacts.email,
          name: emailContacts.name,
          company: emailContacts.company,
          subscribed: emailContacts.subscribed,
        })
        .from(emailListMembers)
        .innerJoin(emailContacts, eq(emailListMembers.contactId, emailContacts.id))
        .where(eq(emailListMembers.listId, input.listId));

      return members;
    }),

  // ─── CAMPAIGNS ──────────────────────────────────────────────────────────────

  listCampaigns: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    return db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
  }),

  getCampaign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, input.id));
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaña no encontrada" });

      // Get sends if campaign was sent
      const sends = campaign.status === "sent" || campaign.status === "sending"
        ? await db.select().from(emailCampaignSends).where(eq(emailCampaignSends.campaignId, input.id)).orderBy(desc(emailCampaignSends.sentAt))
        : [];

      return { ...campaign, sends };
    }),

  createCampaign: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      subject: z.string().min(1),
      previewText: z.string().optional(),
      htmlContent: z.string().min(1),
      listId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [campaign] = await db.insert(emailCampaigns).values({
        name: input.name,
        subject: input.subject,
        previewText: input.previewText || null,
        htmlContent: input.htmlContent,
        listId: input.listId || null,
        status: "draft",
      }).returning();

      return campaign;
    }),

  updateCampaign: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      subject: z.string().optional(),
      previewText: z.string().optional(),
      htmlContent: z.string().optional(),
      listId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const { id, ...updates } = input;
      const [campaign] = await db.update(emailCampaigns)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(emailCampaigns.id, id))
        .returning();

      return campaign;
    }),

  deleteCampaign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.delete(emailCampaignSends).where(eq(emailCampaignSends.campaignId, input.id));
      await db.delete(emailCampaigns).where(eq(emailCampaigns.id, input.id));
      return { success: true };
    }),

  // ─── SEND CAMPAIGN ──────────────────────────────────────────────────────────

  sendCampaign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, input.id));
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaña no encontrada" });
      if (campaign.status === "sent" || campaign.status === "sending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La campaña ya fue enviada" });
      }

      // Get recipients from list
      let recipients: { id: number; email: string; name: string | null }[] = [];
      if (campaign.listId) {
        recipients = await db
          .select({
            id: emailContacts.id,
            email: emailContacts.email,
            name: emailContacts.name,
          })
          .from(emailListMembers)
          .innerJoin(emailContacts, eq(emailListMembers.contactId, emailContacts.id))
          .where(and(
            eq(emailListMembers.listId, campaign.listId),
            eq(emailContacts.subscribed, true),
          ));
      } else {
        // Send to all subscribed contacts
        recipients = await db
          .select({
            id: emailContacts.id,
            email: emailContacts.email,
            name: emailContacts.name,
          })
          .from(emailContacts)
          .where(eq(emailContacts.subscribed, true));
      }

      if (recipients.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No hay destinatarios suscritos" });
      }

      // Mark as sending
      await db.update(emailCampaigns).set({
        status: "sending",
        totalRecipients: recipients.length,
        updatedAt: new Date(),
      }).where(eq(emailCampaigns.id, input.id));

      // Send emails in batches (2 per second to respect rate limits)
      let totalSent = 0;
      let totalFailed = 0;

      for (const recipient of recipients) {
        try {
          // Personalize HTML content
          const personalizedHtml = campaign.htmlContent
            .replace(/\{\{name\}\}/g, recipient.name || "")
            .replace(/\{\{email\}\}/g, recipient.email);

          const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipient.email,
            subject: campaign.subject,
            html: personalizedHtml,
          });

          await db.insert(emailCampaignSends).values({
            campaignId: input.id,
            contactId: recipient.id,
            email: recipient.email,
            status: error ? "failed" : "sent",
            messageId: data?.id || null,
            sentAt: new Date(),
            errorMessage: error?.message || null,
          });

          if (error) {
            totalFailed++;
            console.error(`[Campaign] Failed to send to ${recipient.email}:`, error.message);
          } else {
            totalSent++;
          }

          // Rate limit: wait 150ms between sends (≈6-7/sec)
          await sleep(150);
        } catch (err: any) {
          totalFailed++;
          await db.insert(emailCampaignSends).values({
            campaignId: input.id,
            contactId: recipient.id,
            email: recipient.email,
            status: "failed",
            sentAt: new Date(),
            errorMessage: err?.message || "Unknown error",
          });
        }
      }

      // Mark as sent
      await db.update(emailCampaigns).set({
        status: totalFailed === recipients.length ? "failed" : "sent",
        sentAt: new Date(),
        totalSent,
        totalFailed,
        updatedAt: new Date(),
      }).where(eq(emailCampaigns.id, input.id));

      return { success: true, totalSent, totalFailed, totalRecipients: recipients.length };
    }),

  // ─── SEND TEST EMAIL ────────────────────────────────────────────────────────

  sendTestEmail: protectedProcedure
    .input(z.object({
      to: z.string().email(),
      subject: z.string(),
      htmlContent: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: input.to,
          subject: `[TEST] ${input.subject}`,
          html: input.htmlContent,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, messageId: data?.id };
      } catch (err: any) {
        return { success: false, error: err?.message || "Error desconocido" };
      }
    }),

  // ─── STATS ──────────────────────────────────────────────────────────────────

  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const [contactsCount] = await db.select({ count: count() }).from(emailContacts).where(eq(emailContacts.subscribed, true));
    const [listsCount] = await db.select({ count: count() }).from(emailLists);
    const [campaignsCount] = await db.select({ count: count() }).from(emailCampaigns);
    const [sentCount] = await db.select({ count: count() }).from(emailCampaigns).where(eq(emailCampaigns.status, "sent"));

    const recentCampaigns = await db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt)).limit(5);

    return {
      totalContacts: contactsCount?.count ?? 0,
      totalLists: listsCount?.count ?? 0,
      totalCampaigns: campaignsCount?.count ?? 0,
      totalSent: sentCount?.count ?? 0,
      recentCampaigns,
    };
  }),
});
