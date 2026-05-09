/**
 * Router tRPC para mejoras de BuddyMakers
 * Incluye: monetización, reputación, badges, colaboraciones, marketing
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  makerBadges,
  makerStats,
  makerReferralCodes,
  makerCollaborations,
  collaborationRequests,
  makerResources,
  makerResourceProgress,
  makerNotifications,
  buddyMakers,
  recipes,
} from "../../drizzle/schema";
import { eq, and, desc, asc, gt, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createHash, randomBytes } from "crypto";

// ═══════════════════════════════════════════════════════════════════════════
// BADGES Y LOGROS
// ═══════════════════════════════════════════════════════════════════════════

export const makerBadgesRouter = router({
  /**
   * Obtener todos los badges de un Maker
   */
  getMyBadges: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const maker = await db.query.buddyMakers.findFirst({
      where: eq(buddyMakers.userId, ctx.user.id),
    });

    if (!maker) {
      return [];
    }

    return await db.query.makerBadges.findMany({
      where: eq(makerBadges.makerId, maker.id),
      orderBy: desc(makerBadges.earnedAt),
    });
  }),

  /**
   * Obtener badges de otro Maker (público)
   */
  getByMakerId: publicProcedure
    .input(z.object({ makerId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return await db.query.makerBadges.findMany({
        where: eq(makerBadges.makerId, input.makerId),
        orderBy: desc(makerBadges.earnedAt),
      });
    }),

  /**
   * Crear badge (solo admin)
   */
  create: protectedProcedure
    .input(
      z.object({
        makerId: z.number(),
        badgeType: z.string(),
        title: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar que sea admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = getDb();
      const result = await db.insert(makerBadges).values({
        makerId: input.makerId,
        badgeType: input.badgeType,
        title: input.title,
        description: input.description,
        icon: input.icon,
      });

      return result;
    }),
});

// ═══════════════════════════════════════════════════════════════════════════
// ESTADÍSTICAS Y ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export const makerStatsRouter = router({
  /**
   * Obtener estadísticas de mis recetas
   */
  getMyStats: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const maker = await db.query.buddyMakers.findFirst({
        where: eq(buddyMakers.userId, ctx.user.id),
      });

      if (!maker) {
        return [];
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      return await db.query.makerStats.findMany({
        where: and(
          eq(makerStats.makerId, maker.id),
          gte(makerStats.date, startDate.toISOString().split("T")[0])
        ),
        orderBy: desc(makerStats.date),
      });
    }),

  /**
   * Obtener resumen de estadísticas (total de vistas, descargas, etc.)
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const maker = await db.query.buddyMakers.findFirst({
      where: eq(buddyMakers.userId, ctx.user.id),
    });

    if (!maker) {
      return null;
    }

    const stats = await db.query.makerStats.findMany({
      where: eq(makerStats.makerId, maker.id),
    });

    return {
      totalViews: stats.reduce((sum, s) => sum + (s.views || 0), 0),
      totalDownloads: stats.reduce((sum, s) => sum + (s.downloads || 0), 0),
      totalShares: stats.reduce((sum, s) => sum + (s.shares || 0), 0),
      totalSaves: stats.reduce((sum, s) => sum + (s.saves || 0), 0),
      averageRating: stats.length > 0 ? stats.reduce((sum, s) => sum + (s.averageRating || 0), 0) / stats.length : 0,
      recipesTracked: stats.length,
    };
  }),

  /**
   * Registrar una vista de receta
   */
  recordView: publicProcedure
    .input(z.object({ recipeId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const recipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, input.recipeId),
      });

      if (!recipe || !recipe.buddyMakerId) {
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const existing = await db.query.makerStats.findFirst({
        where: and(
          eq(makerStats.makerId, recipe.buddyMakerId),
          eq(makerStats.recipeId, input.recipeId),
          eq(makerStats.date, today)
        ),
      });

      if (existing) {
        await db
          .update(makerStats)
          .set({ views: (existing.views || 0) + 1 })
          .where(eq(makerStats.id, existing.id));
      } else {
        await db.insert(makerStats).values({
          makerId: recipe.buddyMakerId,
          recipeId: input.recipeId,
          date: today,
          views: 1,
        });
      }
    }),
});

// ═══════════════════════════════════════════════════════════════════════════
// CÓDIGOS DE REFERENCIA
// ═══════════════════════════════════════════════════════════════════════════

export const makerReferralRouter = router({
  /**
   * Generar código de referencia único
   */
  generateCode: protectedProcedure
    .input(
      z.object({
        discountPercent: z.number().default(10).min(1).max(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const maker = await db.query.buddyMakers.findFirst({
        where: eq(buddyMakers.userId, ctx.user.id),
      });

      if (!maker) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Maker profile not found" });
      }

      // Generar código único
      const code = `MAKER${maker.id}${randomBytes(4).toString("hex").toUpperCase()}`.slice(0, 32);

      const result = await db.insert(makerReferralCodes).values({
        makerId: maker.id,
        code,
        discountPercent: input.discountPercent,
      });

      return { code, discountPercent: input.discountPercent };
    }),

  /**
   * Obtener mis códigos de referencia
   */
  getMyCodes: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const maker = await db.query.buddyMakers.findFirst({
      where: eq(buddyMakers.userId, ctx.user.id),
    });

    if (!maker) {
      return [];
    }

    return await db.query.makerReferralCodes.findMany({
      where: eq(makerReferralCodes.makerId, maker.id),
      orderBy: desc(makerReferralCodes.createdAt),
    });
  }),

  /**
   * Desactivar código de referencia
   */
  deactivateCode: protectedProcedure
    .input(z.object({ codeId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const code = await db.query.makerReferralCodes.findFirst({
        where: eq(makerReferralCodes.id, input.codeId),
      });

      if (!code) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const maker = await db.query.buddyMakers.findFirst({
        where: eq(buddyMakers.userId, ctx.user.id),
      });

      if (!maker || maker.id !== code.makerId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.update(makerReferralCodes).set({ isActive: false }).where(eq(makerReferralCodes.id, input.codeId));

      return { success: true };
    }),
});

// ═══════════════════════════════════════════════════════════════════════════
// COLABORACIONES ENTRE MAKERS
// ═══════════════════════════════════════════════════════════════════════════

export const makerCollaborationRouter = router({
  /**
   * Enviar solicitud de colaboración
   */
  sendRequest: protectedProcedure
    .input(
      z.object({
        toMakerId: z.number(),
        recipeId: z.number().optional(),
        message: z.string().optional(),
        proposedRole: z.enum(["co-creator", "contributor"]),
        proposedCommissionShare: z.number().default(0.5).min(0).max(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const maker = await db.query.buddyMakers.findFirst({
        where: eq(buddyMakers.userId, ctx.user.id),
      });

      if (!maker) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Maker profile not found" });
      }

      const result = await db.insert(collaborationRequests).values({
        fromMakerId: maker.id,
        toMakerId: input.toMakerId,
        recipeId: input.recipeId,
        message: input.message,
        proposedRole: input.proposedRole,
        proposedCommissionShare: input.proposedCommissionShare,
      });

      return result;
    }),

  /**
   * Obtener mis solicitudes de colaboración pendientes
   */
  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const maker = await db.query.buddyMakers.findFirst({
      where: eq(buddyMakers.userId, ctx.user.id),
    });

    if (!maker) {
      return [];
    }

    return await db.query.collaborationRequests.findMany({
      where: eq(collaborationRequests.toMakerId, maker.id),
      orderBy: desc(collaborationRequests.createdAt),
    });
  }),

  /**
   * Aprobar solicitud de colaboración
   */
  approveRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const request = await db.query.collaborationRequests.findFirst({
        where: eq(collaborationRequests.id, input.requestId),
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const maker = await db.query.buddyMakers.findFirst({
        where: eq(buddyMakers.userId, ctx.user.id),
      });

      if (!maker || maker.id !== request.toMakerId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Crear colaboración
      if (request.recipeId) {
        await db.insert(makerCollaborations).values({
          recipeId: request.recipeId,
          primaryMakerId: request.fromMakerId,
          collaboratorMakerId: maker.id,
          role: request.proposedRole as any,
          commissionShare: request.proposedCommissionShare || 0.5,
          status: "approved",
          approvedAt: new Date(),
        });
      }

      // Marcar solicitud como aprobada
      await db
        .update(collaborationRequests)
        .set({ status: "approved", respondedAt: new Date() })
        .where(eq(collaborationRequests.id, input.requestId));

      return { success: true };
    }),

  /**
   * Rechazar solicitud de colaboración
   */
  rejectRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const request = await db.query.collaborationRequests.findFirst({
        where: eq(collaborationRequests.id, input.requestId),
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const maker = await db.query.buddyMakers.findFirst({
        where: eq(buddyMakers.userId, ctx.user.id),
      });

      if (!maker || maker.id !== request.toMakerId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db
        .update(collaborationRequests)
        .set({ status: "rejected", respondedAt: new Date() })
        .where(eq(collaborationRequests.id, input.requestId));

      return { success: true };
    }),
});

// ═══════════════════════════════════════════════════════════════════════════
// RECURSOS DE CAPACITACIÓN
// ═══════════════════════════════════════════════════════════════════════════

export const makerResourcesRouter = router({
  /**
   * Obtener recursos disponibles
   */
  getAll: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const where = input.category ? eq(makerResources.category, input.category) : undefined;

      return await db.query.makerResources.findMany({
        where,
        orderBy: asc(makerResources.order),
      });
    }),

  /**
   * Obtener mi progreso en recursos
   */
  getMyProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const maker = await db.query.buddyMakers.findFirst({
      where: eq(buddyMakers.userId, ctx.user.id),
    });

    if (!maker) {
      return [];
    }

    return await db.query.makerResourceProgress.findMany({
      where: eq(makerResourceProgress.makerId, maker.id),
    });
  }),

  /**
   * Marcar recurso como completado
   */
  markAsCompleted: protectedProcedure
    .input(z.object({ resourceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const maker = await db.query.buddyMakers.findFirst({
        where: eq(buddyMakers.userId, ctx.user.id),
      });

      if (!maker) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const existing = await db.query.makerResourceProgress.findFirst({
        where: and(
          eq(makerResourceProgress.makerId, maker.id),
          eq(makerResourceProgress.resourceId, input.resourceId)
        ),
      });

      if (existing) {
        await db
          .update(makerResourceProgress)
          .set({ completed: true, completedAt: new Date() })
          .where(eq(makerResourceProgress.id, existing.id));
      } else {
        await db.insert(makerResourceProgress).values({
          makerId: maker.id,
          resourceId: input.resourceId,
          completed: true,
          completedAt: new Date(),
        });
      }

      return { success: true };
    }),
});

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES PARA MAKERS
// ═══════════════════════════════════════════════════════════════════════════

export const makerNotificationsRouter = router({
  /**
   * Obtener mis notificaciones
   */
  getMyNotifications: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const maker = await db.query.buddyMakers.findFirst({
        where: eq(buddyMakers.userId, ctx.user.id),
      });

      if (!maker) {
        return [];
      }

      const where = input.unreadOnly
        ? and(eq(makerNotifications.makerId, maker.id), eq(makerNotifications.isRead, false))
        : eq(makerNotifications.makerId, maker.id);

      return await db.query.makerNotifications.findMany({
        where,
        orderBy: desc(makerNotifications.createdAt),
        limit: input.limit,
      });
    }),

  /**
   * Marcar notificación como leída
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const notif = await db.query.makerNotifications.findFirst({
        where: eq(makerNotifications.id, input.notificationId),
      });

      if (!notif) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const maker = await db.query.buddyMakers.findFirst({
        where: eq(buddyMakers.userId, ctx.user.id),
      });

      if (!maker || maker.id !== notif.makerId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.update(makerNotifications).set({ isRead: true }).where(eq(makerNotifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Marcar todas las notificaciones como leídas
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = getDb();
    const maker = await db.query.buddyMakers.findFirst({
      where: eq(buddyMakers.userId, ctx.user.id),
    });

    if (!maker) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    await db
      .update(makerNotifications)
      .set({ isRead: true })
      .where(and(eq(makerNotifications.makerId, maker.id), eq(makerNotifications.isRead, false)));

    return { success: true };
  }),
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export const buddyMakersImprovementsRouter = router({
  badges: makerBadgesRouter,
  stats: makerStatsRouter,
  referral: makerReferralRouter,
  collaboration: makerCollaborationRouter,
  resources: makerResourcesRouter,
  notifications: makerNotificationsRouter,
});
