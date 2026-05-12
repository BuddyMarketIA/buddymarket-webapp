/**
 * Router: codes
 * Sistema unificado de códigos de acceso:
 *  - Empresa (tipo MERCADONA2024): activa Pro Max gratis al empleado, empresa paga por licencias activas
 *  - Referido (BuddyExpert/Maker): aplica descuento en el checkout de Stripe
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { notifyOwner } from "../_core/notification";

/** Genera un código de empresa limpio: NOMBRE + AÑO, max 20 chars, solo mayúsculas y números */
function generateCompanyCode(companyName: string): string {
  const year = new Date().getFullYear();
  const clean = companyName
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/[^A-Z0-9]/g, "")       // solo alfanumérico
    .slice(0, 12);
  return `${clean}${year}`;
}

export const codesRouter = router({
  /**
   * Validar un código (público) — devuelve tipo y beneficio sin aplicarlo.
   * Usado para mostrar preview en tiempo real mientras el usuario escribe.
   */
  validate: publicProcedure
    .input(z.object({ code: z.string().min(3).max(50) }))
    .query(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;

      const {
        companies,
        referralCodes,
        users: usersTable,
      } = await import("../../drizzle/schema.js");

      const codeUpper = input.code.toUpperCase().trim();

      // 1. ¿Es un código de empresa?
      const [company] = await drizzleDb
        .select({
          id: companies.id,
          name: companies.name,
          accessCode: companies.accessCode,
          status: companies.status,
          licensesTotal: companies.licensesTotal,
          licensesActive: companies.licensesActive,
          welcomeMessage: companies.welcomeMessage,
        })
        .from(companies)
        .where(
          and(
            eq(companies.accessCode, codeUpper),
            sql`${companies.status} IN ('active', 'trial')`
          )
        )
        .limit(1);

      if (company) {
        const licensesLeft = company.licensesTotal - company.licensesActive;
        return {
          type: "company" as const,
          code: codeUpper,
          companyName: company.name,
          welcomeMessage: company.welcomeMessage,
          hasCapacity: licensesLeft > 0,
          licensesLeft,
          benefit: "Pro Max gratis — tu empresa cubre el coste",
          discountPercent: 100,
        };
      }

      // 2. ¿Es un código de referido de BuddyExpert/Maker?
      const rows = await drizzleDb
        .select({
          rc: referralCodes,
          ownerName: usersTable.name,
          ownerImage: usersTable.imageUrl,
        })
        .from(referralCodes)
        .leftJoin(usersTable, eq(referralCodes.userId, usersTable.id))
        .where(
          and(
            eq(referralCodes.code, codeUpper),
            eq(referralCodes.isActive, true)
          )
        )
        .limit(1);

      if (rows[0]) {
        const rc = rows[0].rc;
        return {
          type: rc.ownerType as "buddyexpert" | "buddymaker",
          code: codeUpper,
          ownerName: rows[0].ownerName,
          ownerImage: rows[0].ownerImage,
          discountPercent: rc.discountPercent,
          stripeCouponId: rc.stripeCouponId,
          stripePromoCodeId: rc.stripePromoCodeId,
          benefit: `${rc.discountPercent}% de descuento en tu suscripción`,
          hasCapacity: true,
          licensesLeft: null,
          companyName: null,
          welcomeMessage: null,
        };
      }

      return null;
    }),

  /**
   * Aplicar un código de empresa (protegido).
   * Activa Pro Max al usuario y lo vincula como empleado de la empresa.
   * La empresa paga por licencias activas a final de mes.
   */
  applyCompanyCode: protectedProcedure
    .input(z.object({ code: z.string().min(3).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const {
        companies,
        companyMembers,
        userSubscriptions,
        users: usersTable,
      } = await import("../../drizzle/schema.js");

      const codeUpper = input.code.toUpperCase().trim();
      const userId = ctx.user.id;

      // 1. Buscar empresa activa con ese código
      const [company] = await drizzleDb
        .select()
        .from(companies)
        .where(
          and(
            eq(companies.accessCode, codeUpper),
            sql`${companies.status} IN ('active', 'trial')`
          )
        )
        .limit(1);

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Código de empresa no válido o expirado. Contacta con tu departamento de RRHH.",
        });
      }

      // 2. Verificar que no supera el límite de licencias
      const [memberCount] = await drizzleDb
        .select({ count: sql<number>`count(*)` })
        .from(companyMembers)
        .where(and(eq(companyMembers.companyId, company.id), eq(companyMembers.isActive, true)));

      if ((memberCount?.count ?? 0) >= company.licensesTotal) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "El plan de empresa ha alcanzado el límite de licencias. Contacta con RRHH para ampliar.",
        });
      }

      // 3. Verificar que el usuario no es ya miembro de esta empresa
      const [existingMember] = await drizzleDb
        .select({ id: companyMembers.id })
        .from(companyMembers)
        .where(and(eq(companyMembers.companyId, company.id), eq(companyMembers.userId, userId)))
        .limit(1);

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya eres miembro de esta empresa en BuddyMarket.",
        });
      }

      const contractEnd = company.contractEndAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      // 4. Crear miembro de empresa
      await drizzleDb.insert(companyMembers).values({
        companyId: company.id,
        userId,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        isActive: true,
      });

      // 5. Actualizar contador de licencias activas
      await drizzleDb
        .update(companies)
        .set({ licensesActive: sql`${companies.licensesActive} + 1`, updatedAt: new Date() })
        .where(eq(companies.id, company.id));

      // 6. Activar Pro Max para el empleado
      const [existingSub] = await drizzleDb
        .select({ id: userSubscriptions.id })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId))
        .limit(1);

      if (existingSub) {
        await drizzleDb
          .update(userSubscriptions)
          .set({
            plan: "pro_max",
            status: "active",
            manualPlan: "pro_max",
            manualPlanNote: `Empresa: ${company.name} (código: ${codeUpper})`,
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
          manualPlanNote: `Empresa: ${company.name} (código: ${codeUpper})`,
          currentPeriodEnd: contractEnd,
        });
      }

      // 7. Guardar el código usado en el perfil del usuario
      await drizzleDb
        .update(usersTable)
        .set({ usedReferralCode: codeUpper, referralCodeType: "company", updatedAt: new Date() })
        .where(eq(usersTable.id, userId));

      // 8. Notificar al owner
      await notifyOwner({
        title: `🏢 Nuevo empleado activado: ${company.name}`,
        content: `El usuario #${userId} activó el código empresarial ${codeUpper} de ${company.name}. Licencias activas: ${(memberCount?.count ?? 0) + 1}/${company.licensesTotal}`,
      }).catch(() => {});

      return {
        success: true,
        companyName: company.name,
        welcomeMessage: company.welcomeMessage,
        message: `¡Bienvenido al plan empresarial de ${company.name}! Tu acceso Pro Max está activo.`,
      };
    }),

  /**
   * Obtener el código de empresa del usuario actual (si tiene uno activo).
   * Usado en el perfil para mostrar "Mi empresa".
   */
  getMyCompanyAccess: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await getDb();
    if (!drizzleDb) return null;

    const { companyMembers, companies } = await import("../../drizzle/schema.js");

    const [row] = await drizzleDb
      .select({
        member: companyMembers,
        company: companies,
      })
      .from(companyMembers)
      .leftJoin(companies, eq(companyMembers.companyId, companies.id))
      .where(and(eq(companyMembers.userId, ctx.user.id), eq(companyMembers.isActive, true)))
      .limit(1);

    if (!row?.company) return null;

    return {
      companyName: row.company.name,
      accessCode: row.company.accessCode,
      plan: row.company.plan,
      contractEndAt: row.company.contractEndAt,
      joinedAt: row.member.joinedAt,
    };
  }),

  /**
   * Generar o regenerar el código de acceso de una empresa (solo admin de empresa).
   * El código se basa en el nombre de la empresa + año actual.
   */
  generateCompanyCode: protectedProcedure
    .input(z.object({ customCode: z.string().min(4).max(20).optional() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { companies } = await import("../../drizzle/schema.js");

      const [company] = await drizzleDb
        .select()
        .from(companies)
        .where(eq(companies.adminUserId, ctx.user.id))
        .limit(1);

      if (!company) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No tienes una empresa asociada." });
      }

      // Generar o usar código personalizado
      let newCode = input.customCode
        ? input.customCode.toUpperCase().replace(/[^A-Z0-9]/g, "")
        : generateCompanyCode(company.name);

      // Verificar que no esté en uso por otra empresa
      const [existing] = await drizzleDb
        .select({ id: companies.id })
        .from(companies)
        .where(and(eq(companies.accessCode, newCode), sql`${companies.id} != ${company.id}`))
        .limit(1);

      if (existing) {
        // Añadir sufijo numérico para hacerlo único
        newCode = `${newCode.slice(0, 16)}${Math.floor(Math.random() * 90 + 10)}`;
      }

      await drizzleDb
        .update(companies)
        .set({ accessCode: newCode, updatedAt: new Date() })
        .where(eq(companies.id, company.id));

      return { code: newCode };
    }),

  /**
   * Admin: crear empresa manualmente y generar su código de acceso.
   * Usado desde el panel de administración para activar empresas tras pago.
   */
  adminCreateCompany: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(255),
      contactEmail: z.string().email(),
      contactName: z.string().optional(),
      plan: z.enum(["starter", "growth", "business", "enterprise", "corporate", "global"]).default("starter"),
      licensesTotal: z.number().int().min(1).max(10000).default(10),
      adminUserId: z.number().int().optional(),
      customCode: z.string().min(4).max(20).optional(),
      welcomeMessage: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo los administradores pueden crear empresas." });
      }

      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { companies } = await import("../../drizzle/schema.js");

      const accessCode = input.customCode
        ? input.customCode.toUpperCase().replace(/[^A-Z0-9]/g, "")
        : generateCompanyCode(input.name);

      const [newCompany] = await drizzleDb
        .insert(companies)
        .values({
          name: input.name,
          contactEmail: input.contactEmail,
          contactName: input.contactName,
          plan: input.plan,
          status: "active",
          licensesTotal: input.licensesTotal,
          licensesActive: 0,
          accessCode,
          welcomeMessage: input.welcomeMessage,
          adminUserId: input.adminUserId,
          contractStartAt: new Date(),
          contractEndAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        })
        .returning();

      await notifyOwner({
        title: `🏢 Nueva empresa creada: ${input.name}`,
        content: `Plan: ${input.plan} | Licencias: ${input.licensesTotal} | Código: ${accessCode}`,
      }).catch(() => {});

      return { company: newCompany, accessCode };
    }),

  /**
   * Admin: listar todas las empresas con sus métricas.
   */
  adminListCompanies: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const drizzleDb = await getDb();
    if (!drizzleDb) return [];

    const { companies } = await import("../../drizzle/schema.js");

    return drizzleDb
      .select()
      .from(companies)
      .orderBy(sql`${companies.createdAt} DESC`)
      .limit(200);
  }),

  /**
   * Admin: listar leads B2B recibidos.
   */
  adminListLeads: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const drizzleDb = await getDb();
    if (!drizzleDb) return [];

    const { companyLeads } = await import("../../drizzle/schema.js");

    return drizzleDb
      .select()
      .from(companyLeads)
      .orderBy(sql`${companyLeads.createdAt} DESC`)
      .limit(200);
  }),

  /**
   * Admin: marcar un lead como contactado.
   */
  adminMarkLeadContacted: protectedProcedure
    .input(z.object({ leadId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { companyLeads } = await import("../../drizzle/schema.js");

      await drizzleDb
        .update(companyLeads)
        .set({ contacted: true })
        .where(eq(companyLeads.id, input.leadId));

      return { success: true };
    }),
});
