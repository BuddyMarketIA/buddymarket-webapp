import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { randomBytes } from "crypto";

export const expertPatientsRouter = router({
  // ─── Obtener pacientes del expert ────────────────────────────────────────
  getPatients: protectedProcedure
    .input(z.object({
      status: z.enum(["invited", "active", "paused", "discharged", "all"]).optional().default("all"),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo BuddyExperts pueden acceder a esta sección" });
      }
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients, buddyExperts, users, userProfiles, expertMessages, expertAppointments } = await import("../../drizzle/schema.js");
      const { eq, and, or, ilike, sql } = await import("drizzle-orm");

      // Obtener el buddyExpert del usuario actual
      const [expert] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil de BuddyExpert no encontrado" });

      const conditions = [eq(expertPatients.expertId, expert.id)];
      if (input.status !== "all") {
        conditions.push(eq(expertPatients.status, input.status));
      }

      const rows = await drizzleDb.select({
        patient: expertPatients,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          imageUrl: users.imageUrl,
        },
        profile: {
          weight: userProfiles.weight,
          height: userProfiles.height,
          age: userProfiles.age,
          mainGoal: userProfiles.mainGoal,
          menuAllergies: userProfiles.menuAllergies,
          menuRestrictions: userProfiles.menuRestrictions,
        },
      })
        .from(expertPatients)
        .leftJoin(users, eq(users.id, expertPatients.patientUserId))
        .leftJoin(userProfiles, eq(userProfiles.userId, expertPatients.patientUserId))
        .where(and(...conditions));

      // Filtrar por búsqueda si se proporciona
      let filtered = rows;
      if (input.search) {
        const s = input.search.toLowerCase();
        filtered = rows.filter(r =>
          r.user?.name?.toLowerCase().includes(s) ||
          r.user?.email?.toLowerCase().includes(s)
        );
      }

      // Obtener mensajes no leídos y próximas citas para cada paciente
      const patientIds = filtered.map(r => r.patient.id);
      const unreadCounts: Record<number, number> = {};
      const nextAppointments: Record<number, Date | null> = {};

      for (const pid of patientIds) {
        const [unread] = await drizzleDb.select({ count: sql<number>`count(*)` })
          .from(expertMessages)
          .where(and(
            eq(expertMessages.expertPatientId, pid),
            eq(expertMessages.isRead, false),
            eq(expertMessages.senderRole, "patient")
          ));
        unreadCounts[pid] = Number(unread?.count ?? 0);

        const [nextAppt] = await drizzleDb.select({ startTime: expertAppointments.startTime })
          .from(expertAppointments)
          .where(and(
            eq(expertAppointments.expertPatientId, pid),
            eq(expertAppointments.status, "scheduled")
          ))
          .orderBy(expertAppointments.startTime)
          .limit(1);
        nextAppointments[pid] = nextAppt?.startTime ?? null;
      }

      return filtered.map(r => ({
        ...r.patient,
        user: r.user,
        profile: r.profile,
        unreadMessages: unreadCounts[r.patient.id] ?? 0,
        nextAppointment: nextAppointments[r.patient.id] ?? null,
      }));
    }),

  // ─── Obtener detalle de un paciente ──────────────────────────────────────
  getPatientDetail: protectedProcedure
    .input(z.object({ patientRelId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients, buddyExperts, users, userProfiles, userMedicalProfiles, expertMessages, expertAppointments, expertAssignedMenus, patientProgress } = await import("../../drizzle/schema.js");
      const { eq, and, desc } = await import("drizzle-orm");

      const [expert] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "NOT_FOUND" });

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.id, input.patientRelId), eq(expertPatients.expertId, expert.id)))
        .limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente no encontrado" });

      const [patientUser] = await drizzleDb.select().from(users)
        .where(eq(users.id, rel.patientUserId)).limit(1);
      const [profile] = await drizzleDb.select().from(userProfiles)
        .where(eq(userProfiles.userId, rel.patientUserId)).limit(1);
      const [medProfile] = await drizzleDb.select().from(userMedicalProfiles)
        .where(eq(userMedicalProfiles.userId, rel.patientUserId)).limit(1);

      const messages = await drizzleDb.select().from(expertMessages)
        .where(eq(expertMessages.expertPatientId, input.patientRelId))
        .orderBy(expertMessages.createdAt)
        .limit(50);

      const appointments = await drizzleDb.select().from(expertAppointments)
        .where(eq(expertAppointments.expertPatientId, input.patientRelId))
        .orderBy(desc(expertAppointments.startTime))
        .limit(20);

      const assignedMenus = await drizzleDb.select().from(expertAssignedMenus)
        .where(eq(expertAssignedMenus.expertPatientId, input.patientRelId))
        .orderBy(desc(expertAssignedMenus.createdAt))
        .limit(10);

      const progressRecords = await drizzleDb.select().from(patientProgress)
        .where(eq(patientProgress.expertPatientId, input.patientRelId))
        .orderBy(desc(patientProgress.recordedAt))
        .limit(30);

      // Marcar mensajes del paciente como leídos
      const { isRead, senderRole } = await import("../../drizzle/schema.js").then(s => ({
        isRead: s.expertMessages.isRead,
        senderRole: s.expertMessages.senderRole,
      }));
      await drizzleDb.update(expertMessages)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
          eq(expertMessages.expertPatientId, input.patientRelId),
          eq(expertMessages.senderRole, "patient"),
          eq(expertMessages.isRead, false)
        ));

      return {
        relation: rel,
        user: patientUser,
        profile,
        medicalProfile: medProfile,
        messages,
        appointments,
        assignedMenus,
        progressRecords,
      };
    }),

  // ─── Invitar paciente ─────────────────────────────────────────────────────
  invitePatient: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients, buddyExperts, users } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [expert] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "NOT_FOUND" });

      // Buscar usuario por email
      const [patientUser] = await drizzleDb.select().from(users)
        .where(eq(users.email, input.email)).limit(1);

      const token = randomBytes(32).toString("hex");
      const patientUserId = patientUser?.id ?? 0;

      // Verificar si ya existe la relación
      if (patientUser) {
        const [existing] = await drizzleDb.select().from(expertPatients)
          .where(and(
            eq(expertPatients.expertId, expert.id),
            eq(expertPatients.patientUserId, patientUser.id)
          )).limit(1);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Este paciente ya está en tu lista" });
      }

      const [newRel] = await drizzleDb.insert(expertPatients).values({
        expertId: expert.id,
        patientUserId,
        status: "invited",
        notes: input.notes,
        inviteToken: token,
      }).returning();

      // Enviar email de invitación
      try {
        const { sendEmail } = await import("../email.js");
        const expertName = ctx.user.name ?? "Tu nutricionista";
        await sendEmail({
          to: input.email,
          subject: `${expertName} te ha invitado a BuddyMarket`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#f97316">¡Tienes una invitación de tu nutricionista!</h2>
              <p><strong>${expertName}</strong> te ha invitado a seguir tu plan nutricional en BuddyMarket.</p>
              <p>Acepta la invitación para acceder a tus menús personalizados, mensajería directa y seguimiento de evolución.</p>
              <a href="https://buddymarket.io/accept-invite?token=${token}" 
                 style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
                Aceptar invitación
              </a>
              <p style="color:#666;font-size:14px">Si no esperabas esta invitación, puedes ignorar este email.</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Error enviando email de invitación:", e);
      }

      return { success: true, inviteToken: token, patientFound: !!patientUser };
    }),

  // ─── Aceptar invitación ───────────────────────────────────────────────────
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(eq(expertPatients.inviteToken, input.token)).limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND", message: "Invitación no válida o expirada" });

      await drizzleDb.update(expertPatients)
        .set({
          patientUserId: ctx.user.id,
          status: "active",
          inviteAcceptedAt: new Date(),
          startDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(expertPatients.id, rel.id));

      return { success: true, expertId: rel.expertId };
    }),

  // ─── Actualizar estado del paciente ──────────────────────────────────────
  updatePatientStatus: protectedProcedure
    .input(z.object({
      patientRelId: z.number(),
      status: z.enum(["active", "paused", "discharged"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [expert] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "NOT_FOUND" });

      await drizzleDb.update(expertPatients)
        .set({
          status: input.status,
          notes: input.notes,
          endDate: input.status === "discharged" ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where(and(eq(expertPatients.id, input.patientRelId), eq(expertPatients.expertId, expert.id)));

      return { success: true };
    }),

  // ─── Mensajería ──────────────────────────────────────────────────────────
  getMessages: protectedProcedure
    .input(z.object({
      patientRelId: z.number(),
      limit: z.number().optional().default(50),
      before: z.number().optional(), // message id cursor
    }))
    .query(async ({ ctx, input }) => {
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertMessages, expertPatients, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and, lt, desc } = await import("drizzle-orm");

      // Verificar acceso
      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(eq(expertPatients.id, input.patientRelId)).limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });

      const isExpert = ctx.user.role === "buddyexpert" || ctx.user.role === "admin";
      const isPatient = rel.patientUserId === ctx.user.id;
      if (!isExpert && !isPatient) throw new TRPCError({ code: "FORBIDDEN" });

      if (isExpert) {
        const [expert] = await drizzleDb.select().from(buddyExperts)
          .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert || expert.id !== rel.expertId) throw new TRPCError({ code: "FORBIDDEN" });
      }

      const conditions = [eq(expertMessages.expertPatientId, input.patientRelId)];
      if (input.before) conditions.push(lt(expertMessages.id, input.before));

      const messages = await drizzleDb.select().from(expertMessages)
        .where(and(...conditions))
        .orderBy(desc(expertMessages.createdAt))
        .limit(input.limit);

      return messages.reverse();
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      patientRelId: z.number(),
      content: z.string().min(1).max(2000),
      attachmentUrl: z.string().optional(),
      attachmentType: z.enum(["image", "pdf", "menu"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertMessages, expertPatients, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(eq(expertPatients.id, input.patientRelId)).limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });

      const isExpert = ctx.user.role === "buddyexpert" || ctx.user.role === "admin";
      const isPatient = rel.patientUserId === ctx.user.id;
      if (!isExpert && !isPatient) throw new TRPCError({ code: "FORBIDDEN" });

      let senderRole: "expert" | "patient" = "patient";
      if (isExpert) {
        const [expert] = await drizzleDb.select().from(buddyExperts)
          .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert || expert.id !== rel.expertId) throw new TRPCError({ code: "FORBIDDEN" });
        senderRole = "expert";
      }

      const [msg] = await drizzleDb.insert(expertMessages).values({
        expertPatientId: input.patientRelId,
        senderId: ctx.user.id,
        senderRole,
        content: input.content,
        attachmentUrl: input.attachmentUrl,
        attachmentType: input.attachmentType,
        isRead: false,
      }).returning();

      return msg;
    }),

  markMessagesRead: protectedProcedure
    .input(z.object({ patientRelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertMessages, expertPatients } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(eq(expertPatients.id, input.patientRelId)).limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });

      const isExpert = ctx.user.role === "buddyexpert" || ctx.user.role === "admin";
      const readRole = isExpert ? "patient" : "expert";

      await drizzleDb.update(expertMessages)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
          eq(expertMessages.expertPatientId, input.patientRelId),
          eq(expertMessages.senderRole, readRole),
          eq(expertMessages.isRead, false)
        ));

      return { success: true };
    }),

  // ─── Citas ────────────────────────────────────────────────────────────────
  getAppointments: protectedProcedure
    .input(z.object({
      patientRelId: z.number().optional(),
      upcoming: z.boolean().optional().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertAppointments, expertPatients, buddyExperts, users } = await import("../../drizzle/schema.js");
      const { eq, and, gte, desc } = await import("drizzle-orm");

      const isExpert = ctx.user.role === "buddyexpert" || ctx.user.role === "admin";
      const conditions = [];

      if (isExpert) {
        const [expert] = await drizzleDb.select().from(buddyExperts)
          .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "NOT_FOUND" });
        conditions.push(eq(expertAppointments.expertId, expert.id));
      } else {
        conditions.push(eq(expertAppointments.patientUserId, ctx.user.id));
      }

      if (input.patientRelId) {
        conditions.push(eq(expertAppointments.expertPatientId, input.patientRelId));
      }

      if (input.upcoming) {
        conditions.push(gte(expertAppointments.startTime, new Date()));
      }

      const appointments = await drizzleDb.select({
        appointment: expertAppointments,
        patientName: users.name,
        patientEmail: users.email,
        patientImage: users.imageUrl,
      })
        .from(expertAppointments)
        .leftJoin(users, eq(users.id, expertAppointments.patientUserId))
        .where(and(...conditions))
        .orderBy(expertAppointments.startTime)
        .limit(50);

      return appointments;
    }),

  createAppointment: protectedProcedure
    .input(z.object({
      patientRelId: z.number(),
      title: z.string().min(1).max(256),
      description: z.string().optional(),
      startTime: z.string(), // ISO string
      endTime: z.string(),   // ISO string
      modality: z.enum(["online", "presencial"]).default("online"),
      meetingUrl: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertAppointments, expertPatients, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [expert] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "NOT_FOUND" });

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.id, input.patientRelId), eq(expertPatients.expertId, expert.id)))
        .limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });

      const startTime = new Date(input.startTime);
      const endTime = new Date(input.endTime);

      // Generar link de Google Calendar
      const gcalTitle = encodeURIComponent(input.title);
      const gcalStart = startTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const gcalEnd = endTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const gcalDetails = encodeURIComponent(input.description ?? "Consulta nutricional BuddyMarket");
      const gcalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalStart}/${gcalEnd}&details=${gcalDetails}`;

      const [appt] = await drizzleDb.insert(expertAppointments).values({
        expertPatientId: input.patientRelId,
        expertId: expert.id,
        patientUserId: rel.patientUserId,
        title: input.title,
        description: input.description,
        startTime,
        endTime,
        status: "scheduled",
        modality: input.modality,
        meetingUrl: input.meetingUrl,
        location: input.location,
        googleCalendarLink: gcalLink,
      }).returning();

      // Enviar mensaje automático al paciente
      const { expertMessages } = await import("../../drizzle/schema.js");
      const dateStr = startTime.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const timeStr = startTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      await drizzleDb.insert(expertMessages).values({
        expertPatientId: input.patientRelId,
        senderId: ctx.user.id,
        senderRole: "expert",
        content: `📅 He programado una cita para el **${dateStr}** a las **${timeStr}**.\n\n**Modalidad:** ${input.modality === "online" ? "Online" : "Presencial"}\n${input.meetingUrl ? `**Enlace:** ${input.meetingUrl}` : ""}\n\n[Añadir a Google Calendar](${gcalLink})`,
        isRead: false,
      });

      return appt;
    }),

  updateAppointment: protectedProcedure
    .input(z.object({
      appointmentId: z.number(),
      status: z.enum(["confirmed", "completed", "cancelled"]).optional(),
      cancelReason: z.string().optional(),
      meetingUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertAppointments, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [appt] = await drizzleDb.select().from(expertAppointments)
        .where(eq(expertAppointments.id, input.appointmentId)).limit(1);
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" });

      const isExpert = ctx.user.role === "buddyexpert" || ctx.user.role === "admin";
      const isPatient = appt.patientUserId === ctx.user.id;
      if (!isExpert && !isPatient) throw new TRPCError({ code: "FORBIDDEN" });

      await drizzleDb.update(expertAppointments)
        .set({
          status: input.status ?? appt.status,
          cancelReason: input.cancelReason,
          cancelledAt: input.status === "cancelled" ? new Date() : appt.cancelledAt,
          meetingUrl: input.meetingUrl ?? appt.meetingUrl,
          updatedAt: new Date(),
        })
        .where(eq(expertAppointments.id, input.appointmentId));

      return { success: true };
    }),

  // ─── Asignar menú con adaptación IA ──────────────────────────────────────
  assignMenu: protectedProcedure
    .input(z.object({
      patientRelId: z.number(),
      menuId: z.number().optional(),
      menuTitle: z.string().optional(),
      menuData: z.string().optional(), // JSON del menú original
      expertNotes: z.string().optional(),
      weekStartDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertAssignedMenus, expertPatients, buddyExperts, userProfiles, userMedicalProfiles, menus } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [expert] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "NOT_FOUND" });

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.id, input.patientRelId), eq(expertPatients.expertId, expert.id)))
        .limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });

      // Obtener datos del paciente para adaptar el menú
      const [patientProfile] = await drizzleDb.select().from(userProfiles)
        .where(eq(userProfiles.userId, rel.patientUserId)).limit(1);
      const [patientMedical] = await drizzleDb.select().from(userMedicalProfiles)
        .where(eq(userMedicalProfiles.userId, rel.patientUserId)).limit(1);

      // Obtener datos del menú original si se proporciona ID
      let originalMenuData = input.menuData;
      let menuTitle = input.menuTitle ?? "Menú personalizado";
      if (input.menuId) {
        const [menu] = await drizzleDb.select().from(menus)
          .where(eq(menus.id, input.menuId)).limit(1);
        if (menu) {
          menuTitle = menu.title ?? menuTitle;
          originalMenuData = menu.menuData ?? originalMenuData;
        }
      }

      // Crear registro inicial
      const [assigned] = await drizzleDb.insert(expertAssignedMenus).values({
        expertPatientId: input.patientRelId,
        expertId: expert.id,
        patientUserId: rel.patientUserId,
        originalMenuId: input.menuId,
        originalMenuTitle: menuTitle,
        adaptedMenuData: originalMenuData,
        status: "pending_adaptation",
        weekStartDate: input.weekStartDate ? new Date(input.weekStartDate) : undefined,
        expertNotes: input.expertNotes,
      }).returning();

      // Adaptar el menú con IA si hay datos del paciente y del menú
      if (originalMenuData && patientProfile) {
        try {
          const allergies = patientProfile.menuAllergies ? JSON.parse(patientProfile.menuAllergies) : [];
          const restrictions = patientProfile.menuRestrictions ? JSON.parse(patientProfile.menuRestrictions) : [];
          const medConditions = patientMedical?.medicalConditions ?? "";
          const calGoal = patientProfile.dailyCalorieGoal ?? 2000;
          const mainGoal = patientProfile.mainGoal ?? "maintain";

          if (allergies.length > 0 || restrictions.length > 0 || medConditions) {
            const prompt = `Eres un nutricionista experto. Adapta el siguiente menú semanal para un paciente con estas características:

RESTRICCIONES ALIMENTARIAS: ${allergies.join(", ") || "ninguna"}
RESTRICCIONES DIETÉTICAS: ${restrictions.join(", ") || "ninguna"}
CONDICIONES MÉDICAS: ${medConditions || "ninguna"}
OBJETIVO CALÓRICO: ${calGoal} kcal/día
OBJETIVO PRINCIPAL: ${mainGoal}

MENÚ ORIGINAL:
${originalMenuData.substring(0, 3000)}

Devuelve el menú adaptado en el mismo formato JSON, sustituyendo ingredientes problemáticos por alternativas equivalentes. También devuelve una lista de los cambios realizados.

Responde en JSON con este formato:
{
  "adaptedMenu": <mismo formato que el menú original>,
  "changes": ["cambio 1", "cambio 2", ...]
}`;

            const response = await invokeLLM({
              messages: [
                { role: "system", content: "Eres un nutricionista experto que adapta menús a las necesidades específicas de cada paciente." },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            });

            const content = response.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              const adaptedData = typeof parsed.adaptedMenu === "string"
                ? parsed.adaptedMenu
                : JSON.stringify(parsed.adaptedMenu);
              const changes = parsed.changes ?? [];

              await drizzleDb.update(expertAssignedMenus)
                .set({
                  adaptedMenuData: adaptedData,
                  adaptationNotes: changes.join("\n• "),
                  status: "adapted",
                  updatedAt: new Date(),
                })
                .where(eq(expertAssignedMenus.id, assigned.id));
            }
          } else {
            // No hay restricciones, marcar como adaptado directamente
            await drizzleDb.update(expertAssignedMenus)
              .set({ status: "adapted", updatedAt: new Date() })
              .where(eq(expertAssignedMenus.id, assigned.id));
          }
        } catch (e) {
          console.error("Error adaptando menú con IA:", e);
          await drizzleDb.update(expertAssignedMenus)
            .set({ status: "adapted", updatedAt: new Date() })
            .where(eq(expertAssignedMenus.id, assigned.id));
        }
      }

      // Notificar al paciente via mensaje
      const { expertMessages } = await import("../../drizzle/schema.js");
      await drizzleDb.insert(expertMessages).values({
        expertPatientId: input.patientRelId,
        senderId: ctx.user.id,
        senderRole: "expert",
        content: `🥗 He asignado un nuevo menú personalizado: **${menuTitle}**\n\n${input.expertNotes ? `📝 ${input.expertNotes}\n\n` : ""}El menú ha sido adaptado a tus necesidades específicas. Puedes verlo en la sección "Mis Menús".`,
        isRead: false,
      });

      return { success: true, assignedMenuId: assigned.id };
    }),

  // ─── Seguimiento de evolución ─────────────────────────────────────────────
  getPatientProgress: protectedProcedure
    .input(z.object({ patientRelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { patientProgress, expertPatients, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and, asc } = await import("drizzle-orm");

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(eq(expertPatients.id, input.patientRelId)).limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });

      const isExpert = ctx.user.role === "buddyexpert" || ctx.user.role === "admin";
      const isPatient = rel.patientUserId === ctx.user.id;
      if (!isExpert && !isPatient) throw new TRPCError({ code: "FORBIDDEN" });

      const records = await drizzleDb.select().from(patientProgress)
        .where(eq(patientProgress.expertPatientId, input.patientRelId))
        .orderBy(asc(patientProgress.recordedAt));

      return records;
    }),

  addProgressRecord: protectedProcedure
    .input(z.object({
      patientRelId: z.number(),
      weight: z.number().optional(),
      bodyFat: z.number().optional(),
      muscleMass: z.number().optional(),
      waist: z.number().optional(),
      hip: z.number().optional(),
      chest: z.number().optional(),
      arm: z.number().optional(),
      thigh: z.number().optional(),
      photoUrl: z.string().optional(),
      notes: z.string().optional(),
      recordedAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { patientProgress, expertPatients, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(eq(expertPatients.id, input.patientRelId)).limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });

      const isExpert = ctx.user.role === "buddyexpert" || ctx.user.role === "admin";
      const isPatient = rel.patientUserId === ctx.user.id;
      if (!isExpert && !isPatient) throw new TRPCError({ code: "FORBIDDEN" });

      const [record] = await drizzleDb.insert(patientProgress).values({
        expertPatientId: input.patientRelId,
        patientUserId: rel.patientUserId,
        recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
        weight: input.weight,
        bodyFat: input.bodyFat,
        muscleMass: input.muscleMass,
        waist: input.waist,
        hip: input.hip,
        chest: input.chest,
        arm: input.arm,
        thigh: input.thigh,
        photoUrl: input.photoUrl,
        notes: input.notes,
      }).returning();

      return record;
    }),

  addExpertComment: protectedProcedure
    .input(z.object({
      progressId: z.number(),
      comment: z.string().min(1).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { patientProgress } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");

      await drizzleDb.update(patientProgress)
        .set({ expertComment: input.comment })
        .where(eq(patientProgress.id, input.progressId));

      return { success: true };
    }),

  // ─── Menús asignados al paciente (vista del paciente) ────────────────────
  getMyAssignedMenus: protectedProcedure
    .query(async ({ ctx }) => {
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertAssignedMenus, expertPatients, buddyExperts, users } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const menus = await drizzleDb.select({
        menu: expertAssignedMenus,
        expertUser: {
          name: users.name,
          imageUrl: users.imageUrl,
        },
      })
        .from(expertAssignedMenus)
        .leftJoin(buddyExperts, eq(buddyExperts.id, expertAssignedMenus.expertId))
        .leftJoin(users, eq(users.id, buddyExperts.userId))
        .where(and(
          eq(expertAssignedMenus.patientUserId, ctx.user.id),
          eq(expertAssignedMenus.status, "adapted")
        ))
        .orderBy(expertAssignedMenus.createdAt);

      return menus;
    }),

  // ─── Mis experts (vista del paciente) ────────────────────────────────────
  getMyExperts: protectedProcedure
    .query(async ({ ctx }) => {
      const { db: getDb } = await import("../db.js");
      const drizzleDb = await getDb.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients, buddyExperts, users } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const relations = await drizzleDb.select({
        relation: expertPatients,
        expert: buddyExperts,
        expertUser: {
          name: users.name,
          email: users.email,
          imageUrl: users.imageUrl,
        },
      })
        .from(expertPatients)
        .leftJoin(buddyExperts, eq(buddyExperts.id, expertPatients.expertId))
        .leftJoin(users, eq(users.id, buddyExperts.userId))
        .where(and(
          eq(expertPatients.patientUserId, ctx.user.id),
          eq(expertPatients.status, "active")
        ));

      return relations;
    }),
});
