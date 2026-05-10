import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import Stripe from "stripe";
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const sessionPackagesRouter = router({
  // ─── Experto: gestionar sus paquetes ─────────────────────────────────────

  getMyPackages: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { sessionPackages } = await import("../../drizzle/schema.js");
    const { eq } = await import("drizzle-orm");

    return db.select().from(sessionPackages).where(eq(sessionPackages.expertId, ctx.user.id));
  }),

  createPackage: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(256),
      description: z.string().optional(),
      sessionsCount: z.number().int().min(1).max(100),
      price: z.number().min(0.5),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sessionPackages } = await import("../../drizzle/schema.js");

      const [pkg] = await db.insert(sessionPackages).values({
        expertId: ctx.user.id,
        name: input.name,
        description: input.description ?? null,
        sessionsCount: input.sessionsCount,
        price: input.price,
        isActive: true,
      }).returning();
      return pkg;
    }),

  updatePackage: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(256).optional(),
      description: z.string().optional(),
      sessionsCount: z.number().int().min(1).max(100).optional(),
      price: z.number().min(0.5).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sessionPackages } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [existing] = await db.select().from(sessionPackages)
        .where(and(eq(sessionPackages.id, input.id), eq(sessionPackages.expertId, ctx.user.id)));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Paquete no encontrado" });

      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.sessionsCount !== undefined) updates.sessionsCount = input.sessionsCount;
      if (input.price !== undefined) updates.price = input.price;
      if (input.isActive !== undefined) updates.isActive = input.isActive;

      const [updated] = await db.update(sessionPackages)
        .set(updates)
        .where(eq(sessionPackages.id, input.id))
        .returning();
      return updated;
    }),

  deletePackage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sessionPackages } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [existing] = await db.select().from(sessionPackages)
        .where(and(eq(sessionPackages.id, input.id), eq(sessionPackages.expertId, ctx.user.id)));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      await db.delete(sessionPackages).where(eq(sessionPackages.id, input.id));
      return { success: true };
    }),

  // ─── Experto: ver paquetes de un paciente ─────────────────────────────────

  getPatientPackages: protectedProcedure
    .input(z.object({ expertPatientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { patientPackages, sessionPackages, expertPatients } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [rel] = await db.select().from(expertPatients)
        .where(and(
          eq(expertPatients.id, input.expertPatientId),
          eq(expertPatients.expertId, ctx.user.id)
        ));
      if (!rel) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente no encontrado" });

      return db.select({
        id: patientPackages.id,
        sessionsUsed: patientPackages.sessionsUsed,
        sessionsTotal: patientPackages.sessionsTotal,
        stripePaymentId: patientPackages.stripePaymentId,
        purchasedAt: patientPackages.purchasedAt,
        expiresAt: patientPackages.expiresAt,
        packageName: sessionPackages.name,
        packageDescription: sessionPackages.description,
        packagePrice: sessionPackages.price,
      })
        .from(patientPackages)
        .leftJoin(sessionPackages, eq(patientPackages.packageId, sessionPackages.id))
        .where(eq(patientPackages.expertPatientId, input.expertPatientId));
    }),

  // Marcar sesión como usada
  useSession: protectedProcedure
    .input(z.object({ patientPackageId: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { patientPackages } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");

      const [pp] = await db.select().from(patientPackages)
        .where(eq(patientPackages.id, input.patientPackageId));
      if (!pp) throw new TRPCError({ code: "NOT_FOUND" });
      if (pp.sessionsUsed >= pp.sessionsTotal) throw new TRPCError({ code: "BAD_REQUEST", message: "No quedan sesiones disponibles" });

      const [updated] = await db.update(patientPackages)
        .set({ sessionsUsed: pp.sessionsUsed + 1 })
        .where(eq(patientPackages.id, input.patientPackageId))
        .returning();
      return updated;
    }),

  // ─── Experto: asignar paquete manualmente a un paciente ──────────────────

  assignPackageToPatient: protectedProcedure
    .input(z.object({
      expertPatientId: z.number(),
      packageId: z.number(),
      expiresInDays: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sessionPackages, patientPackages } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [pkg] = await db.select().from(sessionPackages)
        .where(and(eq(sessionPackages.id, input.packageId), eq(sessionPackages.expertId, ctx.user.id)));
      if (!pkg) throw new TRPCError({ code: "NOT_FOUND", message: "Paquete no encontrado" });

      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const [pp] = await db.insert(patientPackages).values({
        expertPatientId: input.expertPatientId,
        packageId: input.packageId,
        sessionsUsed: 0,
        sessionsTotal: pkg.sessionsCount,
        expiresAt,
      }).returning();
      return pp;
    }),

  // ─── Checkout Stripe: el experto genera link de pago para el paciente ────

  createPackageCheckout: protectedProcedure
    .input(z.object({
      packageId: z.number(),
      expertPatientId: z.number(),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sessionPackages, expertPatients, users } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");

      const [pkg] = await db.select().from(sessionPackages)
        .where(eq(sessionPackages.id, input.packageId));
      if (!pkg || !pkg.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Paquete no disponible" });

      const [expertRel] = await db.select().from(expertPatients)
        .where(eq(expertPatients.id, input.expertPatientId));
      const [expert] = expertRel?.expertId
        ? await db.select().from(users).where(eq(users.id, expertRel.expertId))
        : [null];

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: ctx.user.email ?? undefined,
        allow_promotion_codes: true,
        line_items: [{
          price_data: {
            currency: "eur",
            product_data: {
              name: `${pkg.name} — ${expert?.name ?? "Nutricionista"}`,
              description: pkg.description ?? `${pkg.sessionsCount} sesiones de nutrición personalizada`,
            },
            unit_amount: Math.round(pkg.price * 100),
          },
          quantity: 1,
        }],
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          package_id: input.packageId.toString(),
          expert_patient_id: input.expertPatientId.toString(),
          sessions_count: pkg.sessionsCount.toString(),
        },
        client_reference_id: ctx.user.id.toString(),
        success_url: `${input.origin}/app/expert/patients?package_success=1`,
        cancel_url: `${input.origin}/app/expert/patients`,
      });

      return { checkoutUrl: session.url };
    }),

  // ─── Paquetes activos del experto (para que el paciente vea opciones) ────

  getExpertPackages: protectedProcedure
    .input(z.object({ expertId: z.number() }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sessionPackages } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      return db.select().from(sessionPackages)
        .where(and(eq(sessionPackages.expertId, input.expertId), eq(sessionPackages.isActive, true)));
    }),
});
