import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, count, desc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { notifyOwner } from "../_core/notification";

// ─── Planes empresariales ─────────────────────────────────────────────────
const COMPANY_PLANS = {
  starter: {
    name: "BuddyMarket for Business — Starter",
    pricePerEmployee: 8,
    minEmployees: 10,
    maxEmployees: 49,
    description: "Para equipos de 10 a 49 personas",
    features: [
      "App completa con menús IA para todos los empleados",
      "Lista de la compra automática por supermercado",
      "Seguimiento de macros y calorías",
      "Soporte por email",
    ],
  },
  business: {
    name: "BuddyMarket for Business — Business",
    pricePerEmployee: 6,
    minEmployees: 50,
    maxEmployees: 199,
    description: "Para equipos de 50 a 199 personas",
    features: [
      "Todo lo de Starter",
      "Panel de RRHH con métricas de activación",
      "BuddyCoach asignado (sesión grupal mensual)",
      "Onboarding dedicado",
      "Alta masiva de empleados por CSV",
    ],
  },
  enterprise: {
    name: "BuddyMarket for Business — Enterprise",
    pricePerEmployee: 4.5,
    minEmployees: 200,
    maxEmployees: 499,
    description: "Para equipos de 200 a 499 personas",
    features: [
      "Todo lo de Business",
      "Integración SSO (Google / Microsoft)",
      "Informes mensuales en PDF para dirección",
      "SLA 99,9% garantizado",
      "Cuenta ejecutiva dedicada",
    ],
  },
  corporate: {
    name: "BuddyMarket for Business — Corporate",
    pricePerEmployee: 0, // A medida
    minEmployees: 500,
    maxEmployees: 99999,
    description: "Para equipos de 500+ personas",
    features: [
      "Todo lo de Enterprise",
      "Integración con HRIS (Workday, SAP, BambooHR)",
      "API dedicada",
      "Precio a medida",
    ],
  },
} as const;

/** Genera un código de activación único de 10 caracteres */
function generateActivationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const companyRouter = router({

  /** Planes disponibles (público) */
  getPlans: publicProcedure.query(() => {
    return Object.entries(COMPANY_PLANS).map(([key, plan]) => ({
      id: key as keyof typeof COMPANY_PLANS,
      ...plan,
    }));
  }),

  /** Formulario de contacto desde la landing /empresas */
  submitLead: publicProcedure
    .input(z.object({
      companyName: z.string().min(2).max(255),
      contactName: z.string().min(2).max(255),
      contactEmail: z.string().email(),
      contactPhone: z.string().max(30).optional(),
      employeeCount: z.number().int().min(1).optional(),
      industry: z.string().max(100).optional(),
      planInterest: z.enum(["starter", "business", "enterprise", "corporate"]).optional(),
      message: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { companyLeads } = await import("../../drizzle/schema.js");

      const [lead] = await drizzleDb.insert(companyLeads).values({
        companyName: input.companyName,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        employeeCount: input.employeeCount,
        industry: input.industry,
        planInterest: input.planInterest,
        message: input.message,
      }).returning();

      await notifyOwner({
        title: `🏢 Nuevo lead B2B: ${input.companyName}`,
        content: `**Empresa:** ${input.companyName}\n**Contacto:** ${input.contactName} (${input.contactEmail})\n**Empleados:** ${input.employeeCount || "No indicado"}\n**Plan:** ${input.planInterest || "No indicado"}\n**Mensaje:** ${input.message || "Sin mensaje"}`,
      });

      return { success: true, leadId: lead.id };
    }),

  /** Crear checkout Stripe para plan empresarial */
  createCheckout: publicProcedure
    .input(z.object({
      plan: z.enum(["starter", "business", "enterprise"]),
      employeeCount: z.number().int().min(1).max(10000),
      companyName: z.string().min(2).max(255),
      contactEmail: z.string().email(),
      contactName: z.string().min(2).max(255),
      origin: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const planConfig = COMPANY_PLANS[input.plan];
      const totalMonthly = Math.round(planConfig.pricePerEmployee * input.employeeCount * 100);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: input.contactEmail,
        allow_promotion_codes: true,
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: planConfig.name,
                description: `${input.employeeCount} empleados × ${planConfig.pricePerEmployee}€/mes`,
                metadata: {
                  plan: input.plan,
                  employeeCount: input.employeeCount.toString(),
                },
              },
              unit_amount: totalMonthly,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: "company_subscription",
          plan: input.plan,
          employeeCount: input.employeeCount.toString(),
          companyName: input.companyName,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
        },
        client_reference_id: `company_${input.companyName.replace(/\s+/g, "_").slice(0, 40)}`,
        success_url: `${input.origin}/empresa/dashboard?setup=success`,
        cancel_url: `${input.origin}/empresas?cancelled=true`,
      });

      return { checkoutUrl: session.url };
    }),

  /** Activar código de empresa (el empleado introduce su código) */
  activateCode: protectedProcedure
    .input(z.object({
      code: z.string().min(6).max(20),
    }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const {
        companyActivationCodes,
        companyMembers,
        companies,
        userSubscriptions,
      } = await import("../../drizzle/schema.js");

      const userId = ctx.user.id;
      const codeUpper = input.code.toUpperCase().trim();

      // Verificar que el usuario no ya es miembro activo
      const existingMembership = await drizzleDb
        .select({ id: companyMembers.id })
        .from(companyMembers)
        .where(and(
          eq(companyMembers.userId, userId),
          eq(companyMembers.isActive, true)
        ))
        .limit(1);

      if (existingMembership.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ya tienes un plan empresarial activo.",
        });
      }

      // Buscar el código
      const [activationCode] = await drizzleDb
        .select()
        .from(companyActivationCodes)
        .where(eq(companyActivationCodes.code, codeUpper))
        .limit(1);

      if (!activationCode) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Código no válido. Verifica que lo has introducido correctamente.",
        });
      }

      if (activationCode.status !== "available") {
        const msg = activationCode.status === "used"
          ? "Este código ya ha sido utilizado."
          : "Este código no está disponible.";
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }

      if (activationCode.expiresAt && activationCode.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este código ha caducado. Contacta con el responsable de RRHH.",
        });
      }

      // Verificar empresa activa
      const [company] = await drizzleDb
        .select()
        .from(companies)
        .where(eq(companies.id, activationCode.companyId))
        .limit(1);

      if (!company || (company.status !== "active" && company.status !== "trial")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El plan empresarial no está activo. Contacta con RRHH.",
        });
      }

      const contractEnd = company.contractEndAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      // 1. Marcar código como usado
      await drizzleDb.update(companyActivationCodes)
        .set({ status: "used", redeemedByUserId: userId, redeemedAt: new Date() })
        .where(eq(companyActivationCodes.id, activationCode.id));

      // 2. Crear miembro
      await drizzleDb.insert(companyMembers).values({
        companyId: company.id,
        userId,
        activationCodeId: activationCode.id,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        isActive: true,
      });

      // 3. Activar Pro Max
      const existingSub = await drizzleDb
        .select({ id: userSubscriptions.id })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId))
        .limit(1);

      if (existingSub.length > 0) {
        await drizzleDb.update(userSubscriptions)
          .set({
            plan: "pro_max",
            status: "active",
            manualPlan: "pro_max",
            manualPlanNote: `Activado por empresa: ${company.name}`,
            currentPeriodEnd: contractEnd,
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.userId, userId));
      } else {
        await drizzleDb.insert(userSubscriptions).values({
          userId,
          plan: "pro_max",
          status: "active",
          manualPlan: "pro_max",
          manualPlanNote: `Activado por empresa: ${company.name}`,
          currentPeriodEnd: contractEnd,
        });
      }

      return {
        success: true,
        companyName: company.name,
        message: `¡Bienvenido al plan empresarial de ${company.name}! Tu acceso Pro Max está activo.`,
      };
    }),

  /** Panel RRHH — solo para admin de empresa */
  getDashboard: protectedProcedure
    .query(async ({ ctx }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const {
        companies,
        companyActivationCodes,
        companyMembers,
      } = await import("../../drizzle/schema.js");

      const userId = ctx.user.id;

      const [company] = await drizzleDb
        .select()
        .from(companies)
        .where(eq(companies.adminUserId, userId))
        .limit(1);

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No tienes una empresa asociada.",
        });
      }

      const [totalCodesResult] = await drizzleDb
        .select({ total: count() })
        .from(companyActivationCodes)
        .where(eq(companyActivationCodes.companyId, company.id));

      const [usedCodesResult] = await drizzleDb
        .select({ used: count() })
        .from(companyActivationCodes)
        .where(and(
          eq(companyActivationCodes.companyId, company.id),
          eq(companyActivationCodes.status, "used")
        ));

      const [activeMembersResult] = await drizzleDb
        .select({ active: count() })
        .from(companyMembers)
        .where(and(
          eq(companyMembers.companyId, company.id),
          eq(companyMembers.isActive, true)
        ));

      const recentMembers = await drizzleDb
        .select({
          id: companyMembers.id,
          joinedAt: companyMembers.joinedAt,
          lastActiveAt: companyMembers.lastActiveAt,
        })
        .from(companyMembers)
        .where(eq(companyMembers.companyId, company.id))
        .orderBy(desc(companyMembers.joinedAt))
        .limit(10);

      const availableCodes = await drizzleDb
        .select({ code: companyActivationCodes.code })
        .from(companyActivationCodes)
        .where(and(
          eq(companyActivationCodes.companyId, company.id),
          eq(companyActivationCodes.status, "available")
        ))
        .limit(100);

      const totalCodes = totalCodesResult?.total ?? 0;
      const usedCodes = usedCodesResult?.used ?? 0;
      const activeMembers = activeMembersResult?.active ?? 0;
      const activationRate = totalCodes > 0 ? Math.round((usedCodes / totalCodes) * 100) : 0;

      return {
        company,
        metrics: {
          licensesTotal: company.licensesTotal,
          licensesUsed: usedCodes,
          licensesAvailable: totalCodes - usedCodes,
          activeMembers,
          activationRate,
        },
        recentMembers,
        availableCodes: availableCodes.map((c) => c.code),
      };
    }),

  /** Empresa del usuario actual (si es miembro) */
  getMyCompany: protectedProcedure
    .query(async ({ ctx }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;

      const { companyMembers, companies } = await import("../../drizzle/schema.js");
      const userId = ctx.user.id;

      const [membership] = await drizzleDb
        .select({ companyId: companyMembers.companyId, joinedAt: companyMembers.joinedAt })
        .from(companyMembers)
        .where(and(
          eq(companyMembers.userId, userId),
          eq(companyMembers.isActive, true)
        ))
        .limit(1);

      if (!membership) return null;

      const [company] = await drizzleDb
        .select({ id: companies.id, name: companies.name, plan: companies.plan, status: companies.status })
        .from(companies)
        .where(eq(companies.id, membership.companyId))
        .limit(1);

      return company ? { ...company, joinedAt: membership.joinedAt } : null;
    }),
});
