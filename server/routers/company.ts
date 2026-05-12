import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, count, desc, sql, gte } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { notifyOwner } from "../_core/notification";

// ─── Planes empresariales (modelo Gympass — 6 tramos) ────────────────────
import type { B2BPlanId } from "../stripe-b2b-products";
import { B2B_PLANS as STRIPE_B2B_PLANS, getPlanForEmployeeCount, calculateB2BCost } from "../stripe-b2b-products";

const COMPANY_PLANS = {
  starter: {
    name: "Buddy One for Business — Starter",
    pricePerEmployee: 3.90,
    benefitPerEmployee: 2.50,
    minEmployees: 10,
    maxEmployees: 49,
    description: "Para equipos de 10 a 49 personas",
    features: [
      "App completa con menús IA para todos los empleados",
      "Lista de la compra automática por supermercado",
      "Seguimiento de macros y calorías",
      "Códigos de activación individuales",
      "Soporte por email",
    ],
  },
  growth: {
    name: "Buddy One for Business — Growth",
    pricePerEmployee: 3.50,
    benefitPerEmployee: 2.10,
    minEmployees: 50,
    maxEmployees: 199,
    description: "Para equipos de 50 a 199 personas",
    features: [
      "Todo lo de Starter",
      "Panel RRHH con métricas agregadas",
      "Onboarding dedicado",
      "Alta masiva de empleados por CSV",
      "Soporte prioritario",
    ],
  },
  business: {
    name: "Buddy One for Business — Business",
    pricePerEmployee: 3.40,
    benefitPerEmployee: 2.00,
    minEmployees: 200,
    maxEmployees: 499,
    description: "Para equipos de 200 a 499 personas",
    features: [
      "Todo lo de Growth",
      "BuddyCoach grupal mensual",
      "Informes PDF mensuales para dirección",
      "Webinars de nutrición para empleados",
      "Cuenta ejecutiva dedicada",
    ],
  },
  enterprise: {
    name: "Buddy One for Business — Enterprise",
    pricePerEmployee: 2.50,
    benefitPerEmployee: 1.10,
    minEmployees: 500,
    maxEmployees: 999,
    description: "Para equipos de 500 a 999 personas",
    features: [
      "Todo lo de Business",
      "Integración SSO (Google / Microsoft)",
      "SLA 99,9% garantizado",
      "API de integración con HRIS",
      "Soporte 24/5",
    ],
  },
  corporate: {
    name: "Buddy One for Business — Corporate",
    pricePerEmployee: 2.20,
    benefitPerEmployee: 0.80,
    minEmployees: 1000,
    maxEmployees: 4999,
    description: "Para equipos de 1.000 a 4.999 personas",
    features: [
      "Todo lo de Enterprise",
      "Integración HRIS (Workday, SAP, BambooHR)",
      "Programa de bienestar personalizado",
      "Eventos de nutrición presenciales",
      "Soporte 24/7",
    ],
  },
  global: {
    name: "Buddy One for Business — Global",
    pricePerEmployee: 1.90,
    benefitPerEmployee: 0.50,
    minEmployees: 5000,
    maxEmployees: 99999,
    description: "Para equipos de 5.000+ personas",
    features: [
      "Todo lo de Corporate",
      "Multi-país / multi-idioma",
      "API dedicada con SLA premium",
      "Consultoría nutricional estratégica",
      "Precio y condiciones a medida",
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
      planInterest: z.enum(["starter", "growth", "business", "enterprise", "corporate", "global"]).optional(),
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

  /** Crear checkout Stripe para plan empresarial — facturación por licencias activas */
  createCheckout: publicProcedure
    .input(z.object({
      plan: z.enum(["starter", "growth", "business", "enterprise", "corporate", "global"]),
      employeeCount: z.number().int().min(1).max(100000),
      companyName: z.string().min(2).max(255),
      contactEmail: z.string().email(),
      contactName: z.string().min(2).max(255),
      origin: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const { getStripePriceId } = await import("../stripe-b2b-products.js");

      const b2bPlanConfig = STRIPE_B2B_PLANS[input.plan as B2BPlanId];
      const stripePriceId = getStripePriceId(input.plan as B2BPlanId);

      // Construir line_items: precio unitario por licencia con quantity = empleados estimados
      // La quantity se actualizará mensualmente según licencias activas reales
      const lineItem = stripePriceId
        ? {
            // Precio unitario preconfigurado en Stripe (produccción)
            price: stripePriceId,
            quantity: input.employeeCount,
          }
        : {
            // Fallback: price_data dinámico (desarrollo/test sin Price ID configurado)
            price_data: {
              currency: "eur",
              product_data: {
                name: b2bPlanConfig.name,
                description: `${b2bPlanConfig.description} — Facturación por licencias activas`,
                metadata: { plan: input.plan, type: "b2b_per_license" },
              },
              unit_amount: Math.round(b2bPlanConfig.pricePerEmployee * 100), // precio unitario por empleado
              recurring: { interval: "month" as const },
            },
            quantity: input.employeeCount, // cantidad inicial = empleados estimados
          };

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: input.contactEmail,
        allow_promotion_codes: true,
        line_items: [lineItem],
        subscription_data: {
          metadata: {
            type: "company_subscription",
            plan: input.plan,
            companyName: input.companyName,
            billing_model: "per_active_license",
          },
        },
        metadata: {
          type: "company_subscription",
          plan: input.plan,
          employeeCount: input.employeeCount.toString(),
          companyName: input.companyName,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          billing_model: "per_active_license",
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

  /** Historial de facturación de la empresa (para el panel RRHH) */
  getBillingHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { companies, companyBillingSnapshots } = await import("../../drizzle/schema.js");
      const userId = ctx.user.id;

      // Verificar que el usuario es admin de la empresa
      const [company] = await drizzleDb
        .select()
        .from(companies)
        .where(eq(companies.adminUserId, userId))
        .limit(1);

      if (!company) throw new TRPCError({ code: "FORBIDDEN", message: "No eres administrador de ninguna empresa" });

      const snapshots = await drizzleDb
        .select()
        .from(companyBillingSnapshots)
        .where(eq(companyBillingSnapshots.companyId, company.id))
        .orderBy(desc(companyBillingSnapshots.billingPeriodStart))
        .limit(24); // Últimos 24 meses

      return {
        company: {
          id: company.id,
          name: company.name,
          plan: company.plan,
          licensesActive: company.licensesActive,
          licensesTotal: company.licensesTotal,
        },
        snapshots: snapshots.map(s => ({
          id: s.id,
          billingPeriodStart: s.billingPeriodStart,
          billingPeriodEnd: s.billingPeriodEnd,
          activeLicenses: s.activeLicenses,
          pricePerLicense: parseFloat(s.pricePerLicense),
          totalAmount: parseFloat(s.totalAmount),
          stripeInvoiceId: s.stripeInvoiceId,
          status: s.status,
          createdAt: s.createdAt,
        })),
      };
    }),

  /** Disparar sincronización manual de licencias activas (solo admin de BuddyMarket) */
  triggerBillingSync: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { syncActiveLicenses } = await import("../jobs/billing-sync.js");
      return await syncActiveLicenses();
    }),

  // ─── ENDPOINTS EXCLUSIVOS PARA EL PANEL ADMIN DE BUDDYMARKET ────────────────

  /** Listar todas las empresas con métricas agregadas */
  adminGetCompanies: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "trial", "active", "suspended", "cancelled", "all"]).optional().default("all"),
      plan: z.enum(["starter", "growth", "business", "enterprise", "corporate", "global", "all"]).optional().default("all"),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { companies, companyMembers } = await import("../../drizzle/schema.js");
      const { ilike, or } = await import("drizzle-orm");

      const allCompanies = await drizzleDb.select({
        id: companies.id,
        name: companies.name,
        contactEmail: companies.contactEmail,
        contactName: companies.contactName,
        plan: companies.plan,
        status: companies.status,
        licensesTotal: companies.licensesTotal,
        licensesActive: companies.licensesActive,
        accessCode: companies.accessCode,
        stripeCustomerId: companies.stripeCustomerId,
        stripeSubscriptionId: companies.stripeSubscriptionId,
        industry: companies.industry,
        contractStartAt: companies.contractStartAt,
        createdAt: companies.createdAt,
        notes: companies.notes,
      }).from(companies).orderBy(desc(companies.createdAt));

      let filtered = allCompanies;
      if (input.status !== "all") filtered = filtered.filter(c => c.status === input.status);
      if (input.plan !== "all") filtered = filtered.filter(c => c.plan === input.plan);
      if (input.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(c => c.name.toLowerCase().includes(s) || c.contactEmail.toLowerCase().includes(s));
      }

      const memberCounts = await drizzleDb
        .select({ companyId: companyMembers.companyId, total: count() })
        .from(companyMembers)
        .where(eq(companyMembers.isActive, true))
        .groupBy(companyMembers.companyId);
      const memberMap = new Map(memberCounts.map(m => [m.companyId, Number(m.total)]));

      const prices: Record<string, number> = { starter: 3.90, growth: 3.50, business: 3.40, enterprise: 2.50, corporate: 2.20, global: 1.90 };
      const withMetrics = filtered.map(c => ({
        ...c,
        activeMembersCount: memberMap.get(c.id) || 0,
        estimatedMRR: (c.licensesActive || 0) * (prices[c.plan] || 0),
      }));

      return {
        companies: withMetrics,
        summary: {
          total: allCompanies.length,
          active: allCompanies.filter(c => c.status === "active").length,
          totalLicensesActive: allCompanies.reduce((s, c) => s + (c.licensesActive || 0), 0),
          totalMRR: allCompanies.reduce((s, c) => s + (c.licensesActive || 0) * (prices[c.plan] || 0), 0),
        },
      };
    }),

  /** Detalle completo de una empresa */
  adminGetCompanyDetail: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { companies, companyMembers, companyBillingSnapshots, users } = await import("../../drizzle/schema.js");

      const [company] = await drizzleDb.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company) throw new TRPCError({ code: "NOT_FOUND" });

      const members = await drizzleDb
        .select({
          id: companyMembers.id,
          userId: companyMembers.userId,
          joinedAt: companyMembers.joinedAt,
          lastActiveAt: companyMembers.lastActiveAt,
          isActive: companyMembers.isActive,
          userName: users.name,
          userEmail: users.email,
        })
        .from(companyMembers)
        .leftJoin(users, eq(companyMembers.userId, users.id))
        .where(eq(companyMembers.companyId, input.companyId))
        .orderBy(desc(companyMembers.joinedAt))
        .limit(100);

      const snapshots = await drizzleDb
        .select().from(companyBillingSnapshots)
        .where(eq(companyBillingSnapshots.companyId, input.companyId))
        .orderBy(desc(companyBillingSnapshots.billingPeriodStart))
        .limit(12);

      return {
        company,
        members,
        snapshots: snapshots.map(s => ({
          ...s,
          pricePerLicense: parseFloat(s.pricePerLicense),
          totalAmount: parseFloat(s.totalAmount),
        })),
        stats: {
          totalMembers: members.length,
          activeMembers: members.filter(m => m.isActive).length,
          totalBilled: snapshots.reduce((s, snap) => s + parseFloat(snap.totalAmount), 0),
        },
      };
    }),

  /** Actualizar estado, plan, licencias o notas de una empresa */
  adminUpdateCompany: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      status: z.enum(["pending", "trial", "active", "suspended", "cancelled"]).optional(),
      plan: z.enum(["starter", "growth", "business", "enterprise", "corporate", "global"]).optional(),
      licensesTotal: z.number().min(1).max(10000).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { companies } = await import("../../drizzle/schema.js");
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (input.status !== undefined) updates.status = input.status;
      if (input.plan !== undefined) updates.plan = input.plan;
      if (input.licensesTotal !== undefined) updates.licensesTotal = input.licensesTotal;
      if (input.notes !== undefined) updates.notes = input.notes;
      await drizzleDb.update(companies).set(updates).where(eq(companies.id, input.companyId));
      return { success: true };
    }),

  /** Listar leads corporativos */
  adminGetLeads: protectedProcedure
    .input(z.object({ contacted: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { companyLeads } = await import("../../drizzle/schema.js");
      const rows = input.contacted !== undefined
        ? await drizzleDb.select().from(companyLeads).where(eq(companyLeads.contacted, input.contacted)).orderBy(desc(companyLeads.createdAt))
        : await drizzleDb.select().from(companyLeads).orderBy(desc(companyLeads.createdAt));
      return rows;
    }),

  /** Marcar lead como contactado */
  adminUpdateLead: protectedProcedure
    .input(z.object({ leadId: z.number(), contacted: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { companyLeads } = await import("../../drizzle/schema.js");
      await drizzleDb.update(companyLeads).set({ contacted: input.contacted }).where(eq(companyLeads.id, input.leadId));
      return { success: true };
    }),

  /** Forzar sincronización de facturación para una empresa específica */
  adminTriggerCompanyBillingSync: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { companies, companyMembers, companyBillingSnapshots } = await import("../../drizzle/schema.js");
      const { gt } = await import("drizzle-orm");
      const [company] = await drizzleDb.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company) throw new TRPCError({ code: "NOT_FOUND" });
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [{ total }] = await drizzleDb
        .select({ total: count() })
        .from(companyMembers)
        .where(and(eq(companyMembers.companyId, input.companyId), eq(companyMembers.isActive, true), gt(companyMembers.lastActiveAt, thirtyDaysAgo)));
      const prices: Record<string, number> = { starter: 3.90, growth: 3.50, business: 3.40, enterprise: 2.50, corporate: 2.20, global: 1.90 };
      const pricePerLicense = prices[company.plan] || 0;
      const activeLicenses = Number(total);
      const totalAmount = activeLicenses * pricePerLicense;
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      await drizzleDb.insert(companyBillingSnapshots).values({
        companyId: input.companyId,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        activeLicenses,
        pricePerLicense: pricePerLicense.toString(),
        totalAmount: totalAmount.toString(),
        status: "confirmed",
      });
      await drizzleDb.update(companies).set({ licensesActive: activeLicenses, updatedAt: new Date() }).where(eq(companies.id, input.companyId));
      return { success: true, activeLicenses, totalAmount };
    }),

  // ─── PANEL DE LICENCIAS ───────────────────────────────────────────────────

  /** KPIs globales de licencias: MRR, ARR, tasa de uso, evolución mensual */
  adminGetLicensesOverview: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { companies, companyBillingSnapshots } = await import("../../drizzle/schema.js");
      const prices: Record<string, number> = { starter: 3.90, growth: 3.50, business: 3.40, enterprise: 2.50, corporate: 2.20, global: 1.90 };

      const allCompanies = await drizzleDb.select().from(companies);
      const activeCompanies = allCompanies.filter(c => c.status === "active");

      const totalLicensesContracted = activeCompanies.reduce((s, c) => s + (c.licensesTotal || 0), 0);
      const totalLicensesActive = activeCompanies.reduce((s, c) => s + (c.licensesActive || 0), 0);
      const usageRate = totalLicensesContracted > 0 ? (totalLicensesActive / totalLicensesContracted) * 100 : 0;
      const mrr = activeCompanies.reduce((s, c) => s + (c.licensesActive || 0) * (prices[c.plan] || 0), 0);
      const arr = mrr * 12;

      const byPlan = ["starter", "growth", "business", "enterprise", "corporate", "global"].map(plan => ({
        plan,
        totalCompanies: allCompanies.filter(c => c.plan === plan).length,
        activeCompanies: activeCompanies.filter(c => c.plan === plan).length,
        licensesContracted: activeCompanies.filter(c => c.plan === plan).reduce((s, c) => s + (c.licensesTotal || 0), 0),
        licensesActive: activeCompanies.filter(c => c.plan === plan).reduce((s, c) => s + (c.licensesActive || 0), 0),
        mrr: activeCompanies.filter(c => c.plan === plan).reduce((s, c) => s + (c.licensesActive || 0) * (prices[plan] || 0), 0),
        pricePerLicense: prices[plan] || 0,
      }));

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const snapshots = await drizzleDb
        .select({
          month: sql<string>`to_char(${companyBillingSnapshots.billingPeriodStart}, 'YYYY-MM')`,
          totalLicenses: sql<number>`sum(${companyBillingSnapshots.activeLicenses})`,
          totalRevenue: sql<number>`sum(${companyBillingSnapshots.totalAmount}::numeric)`,
        })
        .from(companyBillingSnapshots)
        .where(gte(companyBillingSnapshots.billingPeriodStart, sixMonthsAgo))
        .groupBy(sql`to_char(${companyBillingSnapshots.billingPeriodStart}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${companyBillingSnapshots.billingPeriodStart}, 'YYYY-MM')`);

      const topCompanies = activeCompanies
        .map(c => ({
          id: c.id,
          name: c.name,
          plan: c.plan,
          licensesContracted: c.licensesTotal || 0,
          licensesActive: c.licensesActive || 0,
          usageRate: c.licensesTotal ? Math.round(((c.licensesActive || 0) / c.licensesTotal) * 100) : 0,
          mrr: (c.licensesActive || 0) * (prices[c.plan] || 0),
          status: c.status,
          contactEmail: c.contactEmail,
          accessCode: c.accessCode,
        }))
        .sort((a, b) => b.mrr - a.mrr);

      return {
        summary: {
          totalCompanies: allCompanies.length,
          activeCompanies: activeCompanies.length,
          totalLicensesContracted,
          totalLicensesActive,
          usageRate: Math.round(usageRate * 10) / 10,
          mrr: Math.round(mrr * 100) / 100,
          arr: Math.round(arr * 100) / 100,
        },
        byPlan,
        monthlyEvolution: snapshots.map(s => ({
          month: s.month,
          totalLicenses: Number(s.totalLicenses) || 0,
          totalRevenue: Number(s.totalRevenue) || 0,
        })),
        topCompanies,
      };
    }),

  /** Listado paginado de todas las licencias (miembros) con filtros */
  adminGetAllLicenses: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      isActive: z.boolean().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { companies, companyMembers, users } = await import("../../drizzle/schema.js");

      let rows = await drizzleDb
        .select({
          memberId: companyMembers.id,
          companyId: companyMembers.companyId,
          userId: companyMembers.userId,
          joinedAt: companyMembers.joinedAt,
          lastActiveAt: companyMembers.lastActiveAt,
          isActive: companyMembers.isActive,
          userName: users.name,
          userEmail: users.email,
          companyName: companies.name,
          companyPlan: companies.plan,
          companyStatus: companies.status,
        })
        .from(companyMembers)
        .leftJoin(users, eq(companyMembers.userId, users.id))
        .leftJoin(companies, eq(companyMembers.companyId, companies.id))
        .orderBy(desc(companyMembers.joinedAt));

      if (input.companyId !== undefined) rows = rows.filter(r => r.companyId === input.companyId);
      if (input.isActive !== undefined) rows = rows.filter(r => r.isActive === input.isActive);
      if (input.search) {
        const s = input.search.toLowerCase();
        rows = rows.filter(r =>
          r.userName?.toLowerCase().includes(s) ||
          r.userEmail?.toLowerCase().includes(s) ||
          r.companyName?.toLowerCase().includes(s)
        );
      }

      const total = rows.length;
      const paginated = rows.slice(input.offset, input.offset + input.limit);
      return { licenses: paginated, total };
    }),

  /** Ajustar licencias contratadas de una empresa */
  adminAdjustLicense: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      licensesTotal: z.number().min(1).max(10000),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { companies } = await import("../../drizzle/schema.js");
      const [company] = await drizzleDb.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company) throw new TRPCError({ code: "NOT_FOUND" });
      const noteEntry = input.reason
        ? `\n[${new Date().toISOString().slice(0, 10)}] Ajuste licencias: ${company.licensesTotal} → ${input.licensesTotal}. Motivo: ${input.reason}`
        : "";
      await drizzleDb.update(companies).set({
        licensesTotal: input.licensesTotal,
        notes: ((company.notes || "") + noteEntry).trim() || null,
        updatedAt: new Date(),
      }).where(eq(companies.id, input.companyId));
      return { success: true, previousTotal: company.licensesTotal, newTotal: input.licensesTotal };
    }),

  /** Revocar licencia de un empleado específico */
  adminRevokeLicense: protectedProcedure
    .input(z.object({
      memberId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { companyMembers, companies, userSubscriptions } = await import("../../drizzle/schema.js");
      const [member] = await drizzleDb.select().from(companyMembers).where(eq(companyMembers.id, input.memberId)).limit(1);
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });
      await drizzleDb.update(companyMembers).set({ isActive: false }).where(eq(companyMembers.id, input.memberId));
      await drizzleDb.update(userSubscriptions).set({
        plan: "free" as any,
        manualPlan: null,
        manualPlanNote: null,
        updatedAt: new Date(),
      }).where(eq(userSubscriptions.userId, member.userId));
      const [company] = await drizzleDb.select().from(companies).where(eq(companies.id, member.companyId)).limit(1);
      if (company) {
        await drizzleDb.update(companies).set({
          licensesActive: Math.max(0, (company.licensesActive || 0) - 1),
          updatedAt: new Date(),
        }).where(eq(companies.id, member.companyId));
      }
      return { success: true };
    }),

  /** Reactivar licencia de un empleado */
  adminReactivateLicense: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { companyMembers, companies, userSubscriptions } = await import("../../drizzle/schema.js");
      const [member] = await drizzleDb.select().from(companyMembers).where(eq(companyMembers.id, input.memberId)).limit(1);
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });
      const [company] = await drizzleDb.select().from(companies).where(eq(companies.id, member.companyId)).limit(1);
      if (!company) throw new TRPCError({ code: "NOT_FOUND" });
      if ((company.licensesActive || 0) >= (company.licensesTotal || 0)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La empresa ha alcanzado el límite de licencias contratadas" });
      }
      await drizzleDb.update(companyMembers).set({ isActive: true, lastActiveAt: new Date() }).where(eq(companyMembers.id, input.memberId));
      await drizzleDb.update(userSubscriptions).set({
        plan: "pro_max" as any,
        manualPlan: "pro_max" as any,
        manualPlanNote: `Reactivado por admin — empresa ${company.name}`,
        updatedAt: new Date(),
      }).where(eq(userSubscriptions.userId, member.userId));
      await drizzleDb.update(companies).set({
        licensesActive: (company.licensesActive || 0) + 1,
        updatedAt: new Date(),
      }).where(eq(companies.id, member.companyId));
      return { success: true };
    }),
});
