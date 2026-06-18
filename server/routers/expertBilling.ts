import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { expertInvoices, expertPatients, buddyExperts } from "../../drizzle/schema";
import { eq, and, desc, count, sum } from "drizzle-orm";

export const expertBillingRouter = router({
  // ─── List invoices for the expert ────────────────────────────────────────
  listInvoices: protectedProcedure
    .input(z.object({
      expertPatientId: z.number().optional(),
      status: z.enum(["draft", "sent", "paid", "cancelled"]).optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const conditions = [eq(expertInvoices.expertUserId, ctx.user.id)];
      if (input.status) {
        const { sql } = await import("drizzle-orm");
        conditions.push(sql`${expertInvoices.status} = ${input.status}`);
      }
      if (input.expertPatientId) {
        conditions.push(eq(expertInvoices.expertPatientId, input.expertPatientId));
      }
      const invoices = await db
        .select()
        .from(expertInvoices)
        .where(and(...conditions))
        .orderBy(desc(expertInvoices.issuedAt))
        .limit(input.limit);
      return invoices;
    }),

  // ─── Get billing summary for expert ──────────────────────────────────────
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const [totalRow] = await db
      .select({ total: sum(expertInvoices.amount), cnt: count() })
      .from(expertInvoices)
      .where(and(
        eq(expertInvoices.expertUserId, ctx.user.id),
        eq(expertInvoices.status, "paid"),
      ));
    const [pendingRow] = await db
      .select({ total: sum(expertInvoices.amount), cnt: count() })
      .from(expertInvoices)
      .where(and(
        eq(expertInvoices.expertUserId, ctx.user.id),
        eq(expertInvoices.status, "sent"),
      ));
    const [draftRow] = await db
      .select({ cnt: count() })
      .from(expertInvoices)
      .where(and(
        eq(expertInvoices.expertUserId, ctx.user.id),
        eq(expertInvoices.status, "draft"),
      ));
    return {
      totalPaid: Number(totalRow?.total ?? 0),
      paidCount: Number(totalRow?.cnt ?? 0),
      totalPending: Number(pendingRow?.total ?? 0),
      pendingCount: Number(pendingRow?.cnt ?? 0),
      draftCount: Number(draftRow?.cnt ?? 0),
    };
  }),

  // ─── Create invoice ────────────────────────────────────────────────────────
  createInvoice: protectedProcedure
    .input(z.object({
      expertPatientId: z.number().optional(),
      patientUserId: z.number().optional(),
      patientName: z.string().max(256).optional(),
      patientEmail: z.string().email().optional(),
      concept: z.string().min(1).max(512),
      amount: z.number().min(0), // in euros (will be stored as cents)
      currency: z.string().default("EUR"),
      dueDate: z.string().optional(), // ISO date string
      notes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      // Generate invoice number: INV-{year}-{count+1}
      const year = new Date().getFullYear();
      const [countRow] = await db
        .select({ cnt: count() })
        .from(expertInvoices)
        .where(eq(expertInvoices.expertUserId, ctx.user.id));
      const invoiceNum = `INV-${year}-${String(Number(countRow?.cnt ?? 0) + 1).padStart(4, "0")}`;

      // If expertPatientId provided, get patient info
      let patientName = input.patientName;
      let patientEmail = input.patientEmail;
      let patientUserId = input.patientUserId;

      if (input.expertPatientId && !patientName) {
        const { users } = await import("../../drizzle/schema.js");
        const rel = await db
          .select({ patientUserId: expertPatients.patientUserId })
          .from(expertPatients)
          .where(and(
            eq(expertPatients.id, input.expertPatientId),
            eq(expertPatients.expertUserId, ctx.user.id),
          ))
          .limit(1);
        if (rel.length) {
          patientUserId = rel[0].patientUserId;
          const patient = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, rel[0].patientUserId))
            .limit(1);
          if (patient.length) {
            patientName = patient[0].name ?? undefined;
            patientEmail = patient[0].email ?? undefined;
          }
        }
      }

      const [invoice] = await db.insert(expertInvoices).values({
        expertUserId: ctx.user.id,
        patientUserId: patientUserId ?? null,
        expertPatientId: input.expertPatientId ?? null,
        invoiceNumber: invoiceNum,
        concept: input.concept,
        amount: Math.round(input.amount * 100), // store as cents
        currency: input.currency,
        status: "draft",
        patientName: patientName ?? null,
        patientEmail: patientEmail ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        notes: input.notes ?? null,
      }).returning();
      return invoice;
    }),

  // ─── Update invoice status ─────────────────────────────────────────────────
  updateStatus: protectedProcedure
    .input(z.object({
      invoiceId: z.number(),
      status: z.enum(["draft", "sent", "paid", "cancelled"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const existing = await db
        .select()
        .from(expertInvoices)
        .where(and(
          eq(expertInvoices.id, input.invoiceId),
          eq(expertInvoices.expertUserId, ctx.user.id),
        ))
        .limit(1);
      if (!existing.length) throw new Error("Factura no encontrada");
      const [updated] = await db
        .update(expertInvoices)
        .set({
          status: input.status,
          paidAt: input.status === "paid" ? new Date() : existing[0].paidAt,
          updatedAt: new Date(),
        })
        .where(eq(expertInvoices.id, input.invoiceId))
        .returning();
      return updated;
    }),

  // ─── Delete invoice (only drafts) ─────────────────────────────────────────
  deleteInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const existing = await db
        .select()
        .from(expertInvoices)
        .where(and(
          eq(expertInvoices.id, input.invoiceId),
          eq(expertInvoices.expertUserId, ctx.user.id),
        ))
        .limit(1);
      if (!existing.length) throw new Error("Factura no encontrada");
      if (existing[0].status !== "draft") throw new Error("Solo se pueden eliminar facturas en borrador");
      await db.delete(expertInvoices).where(eq(expertInvoices.id, input.invoiceId));
      return { success: true };
    }),
});
