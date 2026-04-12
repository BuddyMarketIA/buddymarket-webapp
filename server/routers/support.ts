import { z } from "zod";
import { eq, desc, and, ilike, inArray, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  supportTickets,
  supportMessages,
  users,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { Resend } from "resend";

const _resend = new Resend(process.env.RESEND_API_KEY);
const _FROM = process.env.EMAIL_FROM || "BuddyMarket <onboarding@resend.dev>";
async function sendEmail(opts: { to: string; subject: string; html: string }) {
  try {
    await _resend.emails.send({ from: _FROM, to: opts.to, subject: opts.subject, html: opts.html });
  } catch (e) {
    console.error("[Support email error]", e);
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  billing: "Facturación",
  technical: "Problema técnico",
  account: "Mi cuenta",
  feature: "Sugerencia",
  nutrition: "Nutrición",
  other: "Otro",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  in_progress: "En progreso",
  waiting_user: "Esperando respuesta",
  resolved: "Resuelto",
  closed: "Cerrado",
};

async function sendTicketConfirmationEmail(
  userEmail: string,
  userName: string,
  ticketId: number,
  subject: string
) {
  try {
    await sendEmail({
      to: userEmail,
      subject: `[BuddyMarket Soporte #${ticketId}] Hemos recibido tu consulta`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:linear-gradient(135deg,#F97316,#EA580C);padding:32px 40px;">
            <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">Hemos recibido tu consulta</h1>
            <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Ticket #${ticketId}</p>
          </div>
          <div style="padding:32px 40px;">
            <p style="color:#374151;font-size:15px;line-height:1.7;">Hola <strong>${userName}</strong>,</p>
            <p style="color:#374151;font-size:15px;line-height:1.7;">
              Hemos recibido tu consulta sobre <strong>"${subject}"</strong>.
              Nuestro equipo la revisará y te responderá lo antes posible.
            </p>
            <div style="background:#f9fafb;border-radius:12px;padding:20px 24px;margin:24px 0;">
              <p style="color:#6b7280;font-size:13px;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Número de ticket</p>
              <p style="color:#111827;font-size:24px;font-weight:800;margin:0;">#${ticketId}</p>
            </div>
            <p style="color:#374151;font-size:14px;line-height:1.7;">
              Puedes ver el estado de tu consulta y añadir más información en cualquier momento desde la sección
              <strong>Soporte</strong> de tu cuenta.
            </p>
            <div style="margin-top:28px;">
              <a href="https://buddymarketapp.com/soporte" style="background:#F97316;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
                Ver mi ticket →
              </a>
            </div>
          </div>
          <div style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">BuddyMarket · <a href="mailto:info@buddymarket.io" style="color:#F97316;text-decoration:none;">info@buddymarket.io</a></p>
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error("[Support] Error sending confirmation email:", e);
  }
}

async function sendAdminReplyEmail(
  userEmail: string,
  userName: string,
  ticketId: number,
  subject: string,
  replyMessage: string
) {
  try {
    await sendEmail({
      to: userEmail,
      subject: `[BuddyMarket Soporte #${ticketId}] Hemos respondido a tu consulta`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:linear-gradient(135deg,#F97316,#EA580C);padding:32px 40px;">
            <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">Tienes una respuesta</h1>
            <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Ticket #${ticketId} — ${subject}</p>
          </div>
          <div style="padding:32px 40px;">
            <p style="color:#374151;font-size:15px;line-height:1.7;">Hola <strong>${userName}</strong>,</p>
            <p style="color:#374151;font-size:15px;line-height:1.7;">El equipo de BuddyMarket ha respondido a tu consulta:</p>
            <div style="background:#f9fafb;border-left:4px solid #F97316;border-radius:0 12px 12px 0;padding:20px 24px;margin:20px 0;">
              <p style="color:#374151;font-size:14px;line-height:1.8;margin:0;white-space:pre-wrap;">${replyMessage}</p>
            </div>
            <div style="margin-top:28px;">
              <a href="https://buddymarketapp.com/soporte" style="background:#F97316;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
                Ver conversación completa →
              </a>
            </div>
          </div>
          <div style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">BuddyMarket · <a href="mailto:info@buddymarket.io" style="color:#F97316;text-decoration:none;">info@buddymarket.io</a></p>
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error("[Support] Error sending reply email:", e);
  }
}

// ─── router ─────────────────────────────────────────────────────────────────

export const supportRouter = router({
  // ── Usuario: crear ticket ────────────────────────────────────────────────
  createTicket: protectedProcedure
    .input(z.object({
      subject: z.string().min(5).max(256),
      category: z.enum(["billing", "technical", "account", "feature", "nutrition", "other"]).default("other"),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      message: z.string().min(10).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const [ticket] = await db.insert(supportTickets).values({
        userId: ctx.user.id,
        subject: input.subject,
        category: input.category,
        priority: input.priority,
        status: "open",
      }).returning();

      await db.insert(supportMessages).values({
        ticketId: ticket.id,
        authorId: ctx.user.id,
        authorRole: "user",
        message: input.message,
        isInternal: false,
      });

      // Email de confirmación al usuario
      if (ctx.user.email) {
        await sendTicketConfirmationEmail(
          ctx.user.email,
          ctx.user.name ?? "Usuario",
          ticket.id,
          input.subject
        );
      }

      // Notificar al owner si es urgente o alta prioridad
      if (input.priority === "urgent" || input.priority === "high") {
        await notifyOwner({
          title: `🚨 Nuevo ticket ${input.priority === "urgent" ? "URGENTE" : "de alta prioridad"} #${ticket.id}`,
          content: `**Asunto:** ${input.subject}\n**Categoría:** ${CATEGORY_LABELS[input.category]}\n**Usuario:** ${ctx.user.name ?? ctx.user.email ?? "Desconocido"}\n\n${input.message.slice(0, 300)}${input.message.length > 300 ? "..." : ""}`,
        });
      }

      return { ticketId: ticket.id };
    }),

  // ── Usuario: listar mis tickets ──────────────────────────────────────────
  getMyTickets: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();

      const tickets = await db
        .select({
          id: supportTickets.id,
          subject: supportTickets.subject,
          category: supportTickets.category,
          priority: supportTickets.priority,
          status: supportTickets.status,
          createdAt: supportTickets.createdAt,
          updatedAt: supportTickets.updatedAt,
          closedAt: supportTickets.closedAt,
        })
        .from(supportTickets)
        .where(eq(supportTickets.userId, ctx.user.id))
        .orderBy(desc(supportTickets.updatedAt));

      const ticketIds = tickets.map(t => t.id);
      const messageCounts = ticketIds.length > 0
        ? await db
            .select({
              ticketId: supportMessages.ticketId,
              count: sql<number>`count(*)::int`,
            })
            .from(supportMessages)
            .where(and(
              inArray(supportMessages.ticketId, ticketIds),
              eq(supportMessages.isInternal, false)
            ))
            .groupBy(supportMessages.ticketId)
        : [];

      const countMap = Object.fromEntries(messageCounts.map(m => [m.ticketId, m.count]));

      return tickets.map(t => ({
        ...t,
        messageCount: countMap[t.id] ?? 0,
        categoryLabel: CATEGORY_LABELS[t.category] ?? t.category,
        priorityLabel: PRIORITY_LABELS[t.priority] ?? t.priority,
        statusLabel: STATUS_LABELS[t.status] ?? t.status,
      }));
    }),

  // ── Usuario: ver detalle de ticket ───────────────────────────────────────
  getTicketDetail: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, input.ticketId));

      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ticket.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const whereClause = isAdmin
        ? eq(supportMessages.ticketId, input.ticketId)
        : and(
            eq(supportMessages.ticketId, input.ticketId),
            eq(supportMessages.isInternal, false)
          );

      const messages = await db
        .select({
          id: supportMessages.id,
          authorId: supportMessages.authorId,
          authorRole: supportMessages.authorRole,
          message: supportMessages.message,
          isInternal: supportMessages.isInternal,
          createdAt: supportMessages.createdAt,
        })
        .from(supportMessages)
        .where(whereClause)
        .orderBy(supportMessages.createdAt);

      const authorIds = [...new Set(messages.map(m => m.authorId))];
      const authors = authorIds.length > 0
        ? await db.select({ id: users.id, name: users.name, imageUrl: users.imageUrl, role: users.role })
            .from(users)
            .where(inArray(users.id, authorIds))
        : [];
      const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));

      return {
        ticket: {
          ...ticket,
          categoryLabel: CATEGORY_LABELS[ticket.category] ?? ticket.category,
          priorityLabel: PRIORITY_LABELS[ticket.priority] ?? ticket.priority,
          statusLabel: STATUS_LABELS[ticket.status] ?? ticket.status,
        },
        messages: messages.map(m => ({
          ...m,
          authorName: authorMap[m.authorId]?.name ?? "Usuario",
          authorImage: authorMap[m.authorId]?.imageUrl,
          authorIsAdmin: authorMap[m.authorId]?.role === "admin",
        })),
      };
    }),

  // ── Usuario/Admin: añadir mensaje ────────────────────────────────────────
  addMessage: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      message: z.string().min(1).max(5000),
      isInternal: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, input.ticketId));
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ticket.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (input.isInternal && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo admins pueden añadir notas internas" });
      }
      if (["resolved", "closed"].includes(ticket.status) && !isAdmin) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El ticket está cerrado" });
      }

      await db.insert(supportMessages).values({
        ticketId: input.ticketId,
        authorId: ctx.user.id,
        authorRole: isAdmin ? "admin" : "user",
        message: input.message,
        isInternal: input.isInternal,
      });

      const newStatus = isAdmin
        ? (input.isInternal ? ticket.status : "waiting_user")
        : "in_progress";

      await db.update(supportTickets)
        .set({ status: newStatus as any, updatedAt: new Date() })
        .where(eq(supportTickets.id, input.ticketId));

      // Notificar al usuario si el admin responde (no en notas internas)
      if (isAdmin && !input.isInternal) {
        const [ticketUser] = await db.select().from(users).where(eq(users.id, ticket.userId));
        if (ticketUser?.email) {
          await sendAdminReplyEmail(
            ticketUser.email,
            ticketUser.name ?? "Usuario",
            ticket.id,
            ticket.subject,
            input.message
          );
        }
      }

      return { ok: true };
    }),

  // ── Usuario: cerrar ticket ───────────────────────────────────────────────
  closeTicket: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, input.ticketId));
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ticket.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.update(supportTickets)
        .set({ status: "closed", closedAt: new Date(), updatedAt: new Date() })
        .where(eq(supportTickets.id, input.ticketId));

      return { ok: true };
    }),

  // ── Admin: listar todos los tickets ─────────────────────────────────────
  adminGetTickets: protectedProcedure
    .input(z.object({
      status: z.enum(["all", "open", "in_progress", "waiting_user", "resolved", "closed"]).default("all"),
      priority: z.enum(["all", "low", "medium", "high", "urgent"]).default("all"),
      category: z.enum(["all", "billing", "technical", "account", "feature", "nutrition", "other"]).default("all"),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();

      const conditions: ReturnType<typeof eq>[] = [];
      if (input.status !== "all") conditions.push(eq(supportTickets.status, input.status as any));
      if (input.priority !== "all") conditions.push(eq(supportTickets.priority, input.priority as any));
      if (input.category !== "all") conditions.push(eq(supportTickets.category, input.category as any));
      if (input.search) conditions.push(ilike(supportTickets.subject, `%${input.search}%`));

      const tickets = await db
        .select({
          id: supportTickets.id,
          subject: supportTickets.subject,
          category: supportTickets.category,
          priority: supportTickets.priority,
          status: supportTickets.status,
          userId: supportTickets.userId,
          assignedAdminId: supportTickets.assignedAdminId,
          createdAt: supportTickets.createdAt,
          updatedAt: supportTickets.updatedAt,
          closedAt: supportTickets.closedAt,
        })
        .from(supportTickets)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(supportTickets.updatedAt))
        .limit(input.limit)
        .offset(input.offset);

      const userIds = [...new Set(tickets.map(t => t.userId))];
      const ticketUsers = userIds.length > 0
        ? await db.select({ id: users.id, name: users.name, email: users.email, imageUrl: users.imageUrl })
            .from(users).where(inArray(users.id, userIds))
        : [];
      const userMap = Object.fromEntries(ticketUsers.map(u => [u.id, u]));

      const ticketIds = tickets.map(t => t.id);
      const messageCounts = ticketIds.length > 0
        ? await db.select({ ticketId: supportMessages.ticketId, count: sql<number>`count(*)::int` })
            .from(supportMessages).where(inArray(supportMessages.ticketId, ticketIds))
            .groupBy(supportMessages.ticketId)
        : [];
      const countMap = Object.fromEntries(messageCounts.map(m => [m.ticketId, m.count]));

      const [kpis] = await db.select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where status = 'open')::int`,
        in_progress: sql<number>`count(*) filter (where status = 'in_progress')::int`,
        waiting_user: sql<number>`count(*) filter (where status = 'waiting_user')::int`,
        resolved: sql<number>`count(*) filter (where status = 'resolved')::int`,
        closed: sql<number>`count(*) filter (where status = 'closed')::int`,
        urgent: sql<number>`count(*) filter (where priority = 'urgent')::int`,
        high: sql<number>`count(*) filter (where priority = 'high')::int`,
      }).from(supportTickets);

      return {
        tickets: tickets.map(t => ({
          ...t,
          user: userMap[t.userId] ?? null,
          messageCount: countMap[t.id] ?? 0,
          categoryLabel: CATEGORY_LABELS[t.category] ?? t.category,
          priorityLabel: PRIORITY_LABELS[t.priority] ?? t.priority,
          statusLabel: STATUS_LABELS[t.status] ?? t.status,
        })),
        kpis,
      };
    }),

  // ── Admin: actualizar ticket ─────────────────────────────────────────────
  adminUpdateTicket: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      status: z.enum(["open", "in_progress", "waiting_user", "resolved", "closed"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      assignedAdminId: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();

      const updates: Record<string, any> = { updatedAt: new Date() };
      if (input.status) updates.status = input.status;
      if (input.priority) updates.priority = input.priority;
      if (input.assignedAdminId !== undefined) updates.assignedAdminId = input.assignedAdminId;
      if (input.status === "closed" || input.status === "resolved") {
        updates.closedAt = new Date();
      }

      await db.update(supportTickets).set(updates).where(eq(supportTickets.id, input.ticketId));
      return { ok: true };
    }),
});
