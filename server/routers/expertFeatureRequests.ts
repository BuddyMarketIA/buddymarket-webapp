import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sql, count, asc } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { notifyOwner } from "../_core/notification";

const CATEGORY_LABELS: Record<string, string> = {
  patient_management: "Gestión de pacientes",
  plans_menus: "Planes y menús",
  tracking_metrics: "Seguimiento y métricas",
  communication: "Comunicación",
  billing: "Facturación",
  integrations: "Integraciones",
  other: "Otro",
};

const STATUS_LABELS: Record<string, string> = {
  under_review: "En revisión",
  planned: "Planificado",
  in_progress: "En desarrollo",
  completed: "Completado",
  declined: "Descartado",
};

export const expertFeatureRequestsRouter = router({

  /** Listar solicitudes con filtros, ordenación y votos del usuario actual */
  list: protectedProcedure
    .input(z.object({
      category: z.enum([
        "patient_management", "plans_menus", "tracking_metrics",
        "communication", "billing", "integrations", "other",
      ]).optional(),
      status: z.enum([
        "under_review", "planned", "in_progress", "completed", "declined",
      ]).optional(),
      sortBy: z.enum(["votes", "newest", "oldest"]).default("votes"),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { expertFeatureRequests, expertFeatureVotes, users: usersTable } = await import("../../drizzle/schema.js");
      const opts = input ?? {};
      const userId = ctx.user.id;

      // Build conditions
      const conditions: any[] = [];
      if (opts.category) conditions.push(eq(expertFeatureRequests.category, opts.category));
      if (opts.status) conditions.push(eq(expertFeatureRequests.status, opts.status));

      // Get total count
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [{ total }] = await drizzleDb
        .select({ total: count() })
        .from(expertFeatureRequests)
        .where(whereClause);

      // Get requests
      const orderBy = opts.sortBy === "newest"
        ? desc(expertFeatureRequests.createdAt)
        : opts.sortBy === "oldest"
          ? asc(expertFeatureRequests.createdAt)
          : desc(expertFeatureRequests.voteCount);

      const requests = await drizzleDb
        .select({
          id: expertFeatureRequests.id,
          userId: expertFeatureRequests.userId,
          title: expertFeatureRequests.title,
          description: expertFeatureRequests.description,
          category: expertFeatureRequests.category,
          status: expertFeatureRequests.status,
          adminNote: expertFeatureRequests.adminNote,
          voteCount: expertFeatureRequests.voteCount,
          createdAt: expertFeatureRequests.createdAt,
          updatedAt: expertFeatureRequests.updatedAt,
          authorName: usersTable.name,
          authorImage: usersTable.imageUrl,
        })
        .from(expertFeatureRequests)
        .leftJoin(usersTable, eq(expertFeatureRequests.userId, usersTable.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(opts.limit ?? 50)
        .offset(opts.offset ?? 0);

      // Get current user's votes
      const userVotes = await drizzleDb
        .select({ requestId: expertFeatureVotes.requestId })
        .from(expertFeatureVotes)
        .where(eq(expertFeatureVotes.userId, userId));

      const votedIds = new Set(userVotes.map(v => v.requestId));

      // Get stats by category
      const categoryStats = await drizzleDb
        .select({
          category: expertFeatureRequests.category,
          count: count(),
        })
        .from(expertFeatureRequests)
        .groupBy(expertFeatureRequests.category);

      // Get stats by status
      const statusStats = await drizzleDb
        .select({
          status: expertFeatureRequests.status,
          count: count(),
        })
        .from(expertFeatureRequests)
        .groupBy(expertFeatureRequests.status);

      return {
        requests: requests.map(r => ({
          ...r,
          hasVoted: votedIds.has(r.id),
          categoryLabel: CATEGORY_LABELS[r.category] ?? r.category,
          statusLabel: STATUS_LABELS[r.status] ?? r.status,
        })),
        total,
        categoryStats: categoryStats.map(c => ({
          category: c.category,
          label: CATEGORY_LABELS[c.category] ?? c.category,
          count: c.count,
        })),
        statusStats: statusStats.map(s => ({
          status: s.status,
          label: STATUS_LABELS[s.status] ?? s.status,
          count: s.count,
        })),
      };
    }),

  /** Crear nueva solicitud */
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(5, "El título debe tener al menos 5 caracteres").max(255),
      description: z.string().min(20, "La descripción debe tener al menos 20 caracteres").max(2000),
      category: z.enum([
        "patient_management", "plans_menus", "tracking_metrics",
        "communication", "billing", "integrations", "other",
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { expertFeatureRequests } = await import("../../drizzle/schema.js");

      // Verificar que es buddyexpert
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo los BuddyExperts pueden enviar solicitudes" });
      }

      const [request] = await drizzleDb
        .insert(expertFeatureRequests)
        .values({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          category: input.category,
          status: "under_review",
          voteCount: 1, // Auto-voto del creador
        })
        .returning();

      // Auto-voto del creador
      const { expertFeatureVotes } = await import("../../drizzle/schema.js");
      await drizzleDb.insert(expertFeatureVotes).values({
        requestId: request.id,
        userId: ctx.user.id,
      }).onConflictDoNothing();

      // Notificar al owner
      await notifyOwner({
        title: `Nueva solicitud de BuddyExpert: ${input.title}`,
        content: `**${ctx.user.name ?? "Un BuddyExpert"}** ha enviado una nueva solicitud de personalización.\n\n**Categoría:** ${CATEGORY_LABELS[input.category]}\n**Título:** ${input.title}\n**Descripción:** ${input.description}`,
      }).catch(() => {});

      return { id: request.id, message: "Solicitud enviada correctamente" };
    }),

  /** Votar / desvotar una solicitud */
  toggleVote: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { expertFeatureRequests, expertFeatureVotes } = await import("../../drizzle/schema.js");

      // Verificar que la solicitud existe
      const [request] = await drizzleDb
        .select({ id: expertFeatureRequests.id })
        .from(expertFeatureRequests)
        .where(eq(expertFeatureRequests.id, input.requestId))
        .limit(1);

      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Solicitud no encontrada" });

      // Verificar si ya votó
      const [existingVote] = await drizzleDb
        .select({ id: expertFeatureVotes.id })
        .from(expertFeatureVotes)
        .where(and(
          eq(expertFeatureVotes.requestId, input.requestId),
          eq(expertFeatureVotes.userId, ctx.user.id),
        ))
        .limit(1);

      if (existingVote) {
        // Desvotar
        await drizzleDb.delete(expertFeatureVotes).where(eq(expertFeatureVotes.id, existingVote.id));
        await drizzleDb
          .update(expertFeatureRequests)
          .set({ voteCount: sql`GREATEST(${expertFeatureRequests.voteCount} - 1, 0)` })
          .where(eq(expertFeatureRequests.id, input.requestId));
        return { voted: false };
      } else {
        // Votar
        await drizzleDb.insert(expertFeatureVotes).values({
          requestId: input.requestId,
          userId: ctx.user.id,
        }).onConflictDoNothing();
        await drizzleDb
          .update(expertFeatureRequests)
          .set({ voteCount: sql`${expertFeatureRequests.voteCount} + 1` })
          .where(eq(expertFeatureRequests.id, input.requestId));
        return { voted: true };
      }
    }),

  /** Obtener mis solicitudes */
  getMine: protectedProcedure
    .query(async ({ ctx }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { expertFeatureRequests } = await import("../../drizzle/schema.js");

      const requests = await drizzleDb
        .select()
        .from(expertFeatureRequests)
        .where(eq(expertFeatureRequests.userId, ctx.user.id))
        .orderBy(desc(expertFeatureRequests.createdAt));

      return requests.map(r => ({
        ...r,
        categoryLabel: CATEGORY_LABELS[r.category] ?? r.category,
        statusLabel: STATUS_LABELS[r.status] ?? r.status,
      }));
    }),

  /** Admin: actualizar estado de una solicitud */
  updateStatus: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      status: z.enum(["under_review", "planned", "in_progress", "completed", "declined"]),
      adminNote: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores pueden cambiar el estado" });
      }

      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { expertFeatureRequests } = await import("../../drizzle/schema.js");

      await drizzleDb
        .update(expertFeatureRequests)
        .set({
          status: input.status,
          adminNote: input.adminNote ?? null,
          updatedAt: new Date(),
        })
        .where(eq(expertFeatureRequests.id, input.requestId));

      return { success: true };
    }),
});
