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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
        const expertName = ctx.user.name ?? "Tu nutricionista";
        const appUrl = process.env.PUBLIC_APP_URL || "https://buddymarketapp.com";
        const { sendEmail } = await import("../email");
        await sendEmail({
          to: input.email,
          subject: `${expertName} te ha invitado a BuddyMarket`,
          html: `
            <tr>
              <td style="background:linear-gradient(135deg,#F97316 0%,#EA580C 100%);padding:44px 40px 36px;text-align:center;">
                <div style="font-size:48px;margin-bottom:12px;">🎓</div>
                <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 8px;">¡Tienes una invitación!</h1>
                <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">${expertName} te ha invitado a BuddyMarket</p>
              </td>
            </tr>
            <tr><td style="padding:40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hola,</p>
              <p style="color:#374151;font-size:15px;margin:0 0 16px;">
                <strong>${expertName}</strong> te ha invitado a seguir tu plan nutricional personalizado en BuddyMarket.
              </p>
              <p style="color:#374151;font-size:15px;margin:0 0 24px;">
                Acepta la invitación para acceder a tus menús personalizados, mensajería directa con tu nutricionista y seguimiento de tu evolución.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 20px;">
                <tr><td align="center">
                  <a href="${appUrl}/accept-invite?token=${token}" style="display:inline-block;background:linear-gradient(135deg,#F97316,#EA580C);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;">
                    Aceptar invitación
                  </a>
                </td></tr>
              </table>
              <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">Si no esperabas esta invitación, puedes ignorar este email de forma segura.</p>
            </td></tr>
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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

      // Check for conflicts in local DB
      const { ne, lte, gte } = await import("drizzle-orm");
      const localConflicts = await drizzleDb.select({ id: expertAppointments.id })
        .from(expertAppointments)
        .where(and(
          eq(expertAppointments.expertId, expert.id),
          ne(expertAppointments.status, "cancelled"),
          lte(expertAppointments.startTime, endTime),
          gte(expertAppointments.endTime, startTime),
        ));
      if (localConflicts.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Ya tienes una cita programada en ese horario. Por favor elige otro horario." });
      }

      // Try to create Google Calendar event if connected
      let googleEventId: string | undefined;
      let googleMeetUrl: string | undefined;
      let gcalLink: string;

      if (expert.googleCalendarConnected && expert.googleCalendarRefreshToken) {
        try {
          const { getValidAccessToken, createCalendarEvent } = await import("../googleCalendar.js");
          const accessToken = await getValidAccessToken(expert);
          // Also check Google Calendar for conflicts
          const { hasConflict } = await import("../googleCalendar.js");
          const gcalConflict = await hasConflict(accessToken, startTime, endTime);
          if (gcalConflict.conflict) {
            throw new TRPCError({ code: "CONFLICT", message: `Conflicto en Google Calendar: tienes un evento "${gcalConflict.conflictingEvent?.title ?? "otro evento"}" en ese horario.` });
          }
          const event = await createCalendarEvent(accessToken, {
            title: input.title,
            description: input.description,
            startTime,
            endTime,
            addMeet: input.modality === "online",
            location: input.location,
          });
          googleEventId = event.id;
          googleMeetUrl = event.meetUrl;
          gcalLink = event.htmlLink;
        } catch (err: any) {
          if (err.code === "CONFLICT") throw err;
          // Non-fatal: continue without Google Calendar
          console.warn("[createAppointment] Google Calendar error (non-fatal):", err.message);
          const gcalTitle = encodeURIComponent(input.title);
          const gcalStart = startTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
          const gcalEnd = endTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
          gcalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalStart}/${gcalEnd}`;
        }
      } else {
        const gcalTitle = encodeURIComponent(input.title);
        const gcalStart = startTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        const gcalEnd = endTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        const gcalDetails = encodeURIComponent(input.description ?? "Consulta nutricional BuddyMarket");
        gcalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalStart}/${gcalEnd}&details=${gcalDetails}`;
      }

      const finalMeetUrl = googleMeetUrl ?? input.meetingUrl;

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
        meetingUrl: finalMeetUrl,
        googleMeetUrl: googleMeetUrl,
        location: input.location,
        googleCalendarLink: gcalLink,
        googleCalendarEventId: googleEventId,
      }).returning();

      // Enviar mensaje automático al paciente
      const { expertMessages } = await import("../../drizzle/schema.js");
      const dateStr = startTime.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const timeStr = startTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      await drizzleDb.insert(expertMessages).values({
        expertPatientId: input.patientRelId,
        senderId: ctx.user.id,
        senderRole: "expert",
        content: `📅 He programado una cita para el **${dateStr}** a las **${timeStr}**.\n\n**Modalidad:** ${input.modality === "online" ? "Online" : "Presencial"}\n${finalMeetUrl ? `**Enlace:** ${finalMeetUrl}` : ""}\n\n[Añadir a Google Calendar](${gcalLink})`,
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertAssignedMenus, expertPatients, buddyExperts, userProfiles, userMedicalProfiles, menuOrganizers } = await import("../../drizzle/schema.js");
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
        const [menu] = await drizzleDb.select().from(menuOrganizers)
          .where(eq(menuOrganizers.id, input.menuId)).limit(1);
        if (menu) {
          menuTitle = menu.name ?? menuTitle;
          originalMenuData = originalMenuData; // menuOrganizers uses dayParts structure
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
              const contentStr = typeof content === "string" ? content : JSON.stringify(content);
              const parsed = JSON.parse(contentStr);
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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

  // ─── Notas internas del experto sobre el paciente ──────────────────────────
  addPatientNote: protectedProcedure
    .input(z.object({
      patientRelId: z.number(),
      content: z.string().min(1).max(5000),
      noteType: z.enum(["general", "clinical", "diet", "goal", "alert"]).optional().default("general"),
      isPinned: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo BuddyExperts pueden añadir notas" });
      }
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatientNotes, expertPatients, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [expert] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "NOT_FOUND" });

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.id, input.patientRelId), eq(expertPatients.expertId, expert.id)))
        .limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente no encontrado" });

      const [note] = await drizzleDb.insert(expertPatientNotes).values({
        expertId: expert.id,
        patientUserId: rel.patientUserId,
        expertPatientId: input.patientRelId,
        content: input.content,
        noteType: input.noteType,
        isPinned: input.isPinned,
        isPrivate: true,
      }).returning();

      return note;
    }),

  getPatientNotes: protectedProcedure
    .input(z.object({ patientRelId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatientNotes, expertPatients, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and, desc } = await import("drizzle-orm");

      const [expert] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "NOT_FOUND" });

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.id, input.patientRelId), eq(expertPatients.expertId, expert.id)))
        .limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });

      const notes = await drizzleDb.select().from(expertPatientNotes)
        .where(and(
          eq(expertPatientNotes.expertPatientId, input.patientRelId),
          eq(expertPatientNotes.expertId, expert.id)
        ))
        .orderBy(desc(expertPatientNotes.isPinned), desc(expertPatientNotes.createdAt));

      return notes;
    }),

  updatePatientNote: protectedProcedure
    .input(z.object({
      noteId: z.number(),
      content: z.string().min(1).max(5000).optional(),
      noteType: z.enum(["general", "clinical", "diet", "goal", "alert"]).optional(),
      isPinned: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatientNotes, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [expert] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "NOT_FOUND" });

      const [note] = await drizzleDb.select().from(expertPatientNotes)
        .where(and(eq(expertPatientNotes.id, input.noteId), eq(expertPatientNotes.expertId, expert.id)))
        .limit(1);
      if (!note) throw new TRPCError({ code: "NOT_FOUND" });

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.content !== undefined) updates.content = input.content;
      if (input.noteType !== undefined) updates.noteType = input.noteType;
      if (input.isPinned !== undefined) updates.isPinned = input.isPinned;

      await drizzleDb.update(expertPatientNotes)
        .set(updates)
        .where(eq(expertPatientNotes.id, input.noteId));

      return { success: true };
    }),

  deletePatientNote: protectedProcedure
    .input(z.object({ noteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatientNotes, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const [expert] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "NOT_FOUND" });

      await drizzleDb.delete(expertPatientNotes)
        .where(and(eq(expertPatientNotes.id, input.noteId), eq(expertPatientNotes.expertId, expert.id)));

      return { success: true };
    }),

  // ─── Vista detallada del paciente (datos completos para el experto) ────────
  getPatientFullDetail: protectedProcedure
    .input(z.object({ patientRelId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const {
        expertPatients, buddyExperts, users, userProfiles, userMedicalProfiles,
        expertMessages, expertAppointments, expertAssignedMenus, patientProgress,
        expertPatientNotes, userMetrics,
      } = await import("../../drizzle/schema.js");
      const { eq, and, desc, asc } = await import("drizzle-orm");

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

      // Historial de progreso (peso, grasa, músculo, medidas)
      const progressHistory = await drizzleDb.select().from(patientProgress)
        .where(eq(patientProgress.expertPatientId, input.patientRelId))
        .orderBy(asc(patientProgress.recordedAt))
        .limit(60);

      // Métricas del usuario (desde la app de usuario)
      const userMetricsHistory = await drizzleDb.select().from(userMetrics)
        .where(eq(userMetrics.userId, rel.patientUserId))
        .orderBy(asc(userMetrics.date))
        .limit(60);

      // Menús asignados
      const assignedMenus = await drizzleDb.select().from(expertAssignedMenus)
        .where(eq(expertAssignedMenus.expertPatientId, input.patientRelId))
        .orderBy(desc(expertAssignedMenus.createdAt))
        .limit(20);

      // Citas (historial)
      const appointments = await drizzleDb.select().from(expertAppointments)
        .where(eq(expertAppointments.expertPatientId, input.patientRelId))
        .orderBy(desc(expertAppointments.startTime))
        .limit(30);

      // Notas internas del experto
      const notes = await drizzleDb.select().from(expertPatientNotes)
        .where(and(
          eq(expertPatientNotes.expertPatientId, input.patientRelId),
          eq(expertPatientNotes.expertId, expert.id)
        ))
        .orderBy(desc(expertPatientNotes.isPinned), desc(expertPatientNotes.createdAt));

      // Mensajes recientes
      const recentMessages = await drizzleDb.select().from(expertMessages)
        .where(eq(expertMessages.expertPatientId, input.patientRelId))
        .orderBy(desc(expertMessages.createdAt))
        .limit(20);

      return {
        relation: rel,
        user: patientUser,
        profile,
        medicalProfile: medProfile,
        progressHistory,
        userMetricsHistory,
        assignedMenus,
        appointments,
        notes,
        recentMessages,
      };
    }),

  // ─── Dashboard stats del experto ──────────────────────────────────────────
  getExpertDashboardStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients, buddyExperts, expertMessages, expertAppointments, expertAssignedMenus, patientProgress, users, userProfiles } = await import("../../drizzle/schema.js");
      const { eq, and, gte, lte, lt, desc, asc, count, sql } = await import("drizzle-orm");

      // Obtener el perfil del experto
      const [expertProfile] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expertProfile) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil de experto no encontrado" });

      const expertId = expertProfile.id;

      // Pacientes activos
      const allPatients = await drizzleDb.select({
        rel: expertPatients,
        patientUser: { id: users.id, name: users.name, email: users.email, imageUrl: users.imageUrl },
        profile: { weight: userProfiles.weight, mainGoal: userProfiles.mainGoal },
      })
        .from(expertPatients)
        .leftJoin(users, eq(users.id, expertPatients.patientUserId))
        .leftJoin(userProfiles, eq(userProfiles.userId, expertPatients.patientUserId))
        .where(eq(expertPatients.expertId, expertId))
        .orderBy(desc(expertPatients.createdAt));

      const activePatients = allPatients.filter(p => p.rel.status === "active");

      // Mensajes sin leer
      const unreadMessages = await drizzleDb.select()
        .from(expertMessages)
        .innerJoin(expertPatients, eq(expertPatients.id, expertMessages.expertPatientId))
        .where(and(
          eq(expertPatients.expertId, expertId),
          eq(expertMessages.senderRole, "patient"),
          eq(expertMessages.isRead, false)
        ));

      // Citas de hoy y próximas 7 días
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
      const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);

      const upcomingAppointments = await drizzleDb.select({
        appt: expertAppointments,
        patientUser: { id: users.id, name: users.name, email: users.email, imageUrl: users.imageUrl },
      })
        .from(expertAppointments)
        .innerJoin(expertPatients, eq(expertPatients.id, expertAppointments.expertPatientId))
        .leftJoin(users, eq(users.id, expertPatients.patientUserId))
        .where(and(
          eq(expertPatients.expertId, expertId),
          gte(expertAppointments.startTime, now),
          lte(expertAppointments.startTime, weekEnd)
        ))
        .orderBy(asc(expertAppointments.startTime))
        .limit(10);

      const todayAppointments = upcomingAppointments.filter(a => {
        const d = new Date(a.appt.startTime);
        return d >= todayStart && d <= todayEnd;
      });

      // Menús asignados este mes
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const menusThisMonth = await drizzleDb.select()
        .from(expertAssignedMenus)
        .innerJoin(expertPatients, eq(expertPatients.id, expertAssignedMenus.expertPatientId))
        .where(and(
          eq(expertPatients.expertId, expertId),
          gte(expertAssignedMenus.createdAt, monthStart)
        ));

      // Registros de progreso recientes (últimos 30 días)
      const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentProgress = await drizzleDb.select({
        progress: patientProgress,
        patientUser: { id: users.id, name: users.name, imageUrl: users.imageUrl },
      })
        .from(patientProgress)
        .innerJoin(expertPatients, eq(expertPatients.id, patientProgress.expertPatientId))
        .leftJoin(users, eq(users.id, expertPatients.patientUserId))
        .where(and(
          eq(expertPatients.expertId, expertId),
          gte(patientProgress.recordedAt, thirtyDaysAgo)
        ))
        .orderBy(desc(patientProgress.recordedAt))
        .limit(5);

      // Pacientes recientes (últimos 5)
      const recentPatients = allPatients.slice(0, 5);

      // Pacientes con mensajes sin leer (agrupar por paciente)
      const unreadByPatient = new Map<number, number>();
      for (const msg of unreadMessages) {
        const pid = (msg as any).expertMessages?.expertPatientId ?? 0;
        unreadByPatient.set(pid, (unreadByPatient.get(pid) ?? 0) + 1);
      }

      // Distribución de pacientes por estado para gráfico de anillos
      const patientsByStatus = {
        active: allPatients.filter(p => p.rel.status === "active").length,
        invited: allPatients.filter(p => p.rel.status === "invited").length,
        paused: allPatients.filter(p => p.rel.status === "paused").length,
        discharged: allPatients.filter(p => p.rel.status === "discharged").length,
      };

      return {
        stats: {
          totalPatients: allPatients.length,
          activePatients: activePatients.length,
          unreadMessages: unreadMessages.length,
          todayAppointments: todayAppointments.length,
          upcomingAppointmentsWeek: upcomingAppointments.length,
          menusAssignedThisMonth: menusThisMonth.length,
          recentProgressRecords: recentProgress.length,
        },
        patientsByStatus,
        upcomingAppointments,
        recentPatients,
        recentProgress,
        expertProfile,
      };
    }),

  // ─── Google Calendar Integration ─────────────────────────────────────────
  getGoogleCalendarAuthUrl: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getGoogleAuthUrl } = await import("../googleCalendar.js");
      const redirectUri = `${input.origin}/api/google/calendar/callback`;
      const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, origin: input.origin })).toString("base64url");
      const url = getGoogleAuthUrl(redirectUri, state);
      return { url };
    }),

  getGoogleCalendarStatus: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { buddyExperts } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select({
        connected: buddyExperts.googleCalendarConnected,
        email: buddyExperts.googleCalendarEmail,
      }).from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      return expert ?? { connected: false, email: null };
    }),

  disconnectGoogleCalendar: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { buddyExperts } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "NOT_FOUND" });
      if (expert.googleCalendarAccessToken) {
        try {
          const { revokeToken } = await import("../googleCalendar.js");
          await revokeToken(expert.googleCalendarAccessToken);
        } catch {}
      }
      await drizzleDb.update(buddyExperts).set({
        googleCalendarConnected: false,
        googleCalendarAccessToken: null,
        googleCalendarRefreshToken: null,
        googleCalendarTokenExpiry: null,
        googleCalendarEmail: null,
        updatedAt: new Date(),
      }).where(eq(buddyExperts.userId, ctx.user.id));
      return { success: true };
    }),

  checkCalendarAvailability: protectedProcedure
    .input(z.object({ startTime: z.string(), endTime: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { buddyExperts, expertAppointments } = await import("../../drizzle/schema.js");
      const { eq, and, lte, gte, ne } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      const start = new Date(input.startTime);
      const end = new Date(input.endTime);
      // Always check local DB first
      const localConflicts = await drizzleDb.select({ id: expertAppointments.id, title: expertAppointments.title, startTime: expertAppointments.startTime, endTime: expertAppointments.endTime })
        .from(expertAppointments)
        .where(and(
          eq(expertAppointments.expertId, expert?.id ?? 0),
          ne(expertAppointments.status, "cancelled"),
          lte(expertAppointments.startTime, end),
          gte(expertAppointments.endTime, start),
        ));
      if (localConflicts.length > 0) {
        return { conflict: true, source: "local", conflictingEvent: { start: localConflicts[0].startTime.toISOString(), end: localConflicts[0].endTime.toISOString(), title: localConflicts[0].title } };
      }
      // If Google Calendar connected, also check there
      if (expert?.googleCalendarConnected && expert.googleCalendarRefreshToken) {
        try {
          const { getValidAccessToken, hasConflict } = await import("../googleCalendar.js");
          const accessToken = await getValidAccessToken(expert);
          const result = await hasConflict(accessToken, start, end);
          return { ...result, source: "google" };
        } catch {}
      }
      return { conflict: false, source: "local" };
    }),

  // ─── Diario del paciente (vista del experto) ───────────────────────────
  getPatientDiary: protectedProcedure
    .input(z.object({
      expertPatientId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients, mealLogs, patientWellbeingLogs, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and, gte, lte } = await import("drizzle-orm");

      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      const [relation] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.id, input.expertPatientId), expert ? eq(expertPatients.expertId, expert.id) : eq(expertPatients.id, input.expertPatientId)))
        .limit(1);
      if (!relation) throw new TRPCError({ code: "NOT_FOUND" });
      const patientUserId = relation.patientUserId;

      const meals = await drizzleDb.select().from(mealLogs)
        .where(and(eq(mealLogs.userId, patientUserId), gte(mealLogs.logDate, input.startDate), lte(mealLogs.logDate, input.endDate)))
        .orderBy(mealLogs.logDate);

      const wellbeing = await drizzleDb.select().from(patientWellbeingLogs)
        .where(and(eq(patientWellbeingLogs.userId, patientUserId), gte(patientWellbeingLogs.logDate, input.startDate), lte(patientWellbeingLogs.logDate, input.endDate)))
        .orderBy(patientWellbeingLogs.logDate);

      const mealsByDate: Record<string, typeof meals> = {};
      for (const meal of meals) {
        if (!mealsByDate[meal.logDate]) mealsByDate[meal.logDate] = [];
        mealsByDate[meal.logDate].push(meal);
      }

      const days: Array<{ date: string; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; mealCount: number; meals: typeof meals; wellbeing: (typeof wellbeing)[0] | null; adherenceScore: number }> = [];
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const dayMeals = mealsByDate[dateStr] || [];
        const dayWellbeing = wellbeing.find(w => w.logDate === dateStr) || null;
        days.push({
          date: dateStr,
          totalCalories: dayMeals.reduce((s, m) => s + (m.calories || 0), 0),
          totalProtein: dayMeals.reduce((s, m) => s + (m.proteins || 0), 0),
          totalCarbs: dayMeals.reduce((s, m) => s + (m.carbohydrates || 0), 0),
          totalFat: dayMeals.reduce((s, m) => s + (m.fats || 0), 0),
          mealCount: dayMeals.length,
          meals: dayMeals,
          wellbeing: dayWellbeing,
          adherenceScore: Math.min(100, dayMeals.length * 33),
        });
      }
      return { days, patientUserId };
    }),

  // ─── Hitos del paciente ───────────────────────────────────────────────────
  getPatientMilestones: protectedProcedure
    .input(z.object({ expertPatientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { patientMilestones } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      return drizzleDb.select().from(patientMilestones)
        .where(eq(patientMilestones.expertPatientId, input.expertPatientId))
        .orderBy(patientMilestones.milestoneDate);
    }),

  addPatientMilestone: protectedProcedure
    .input(z.object({
      expertPatientId: z.number(),
      patientUserId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      milestoneDate: z.string(),
      icon: z.string().optional().default("🏆"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { patientMilestones, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const [milestone] = await drizzleDb.insert(patientMilestones).values({
        expertId: expert.id,
        patientUserId: input.patientUserId,
        expertPatientId: input.expertPatientId,
        title: input.title,
        description: input.description,
        milestoneDate: input.milestoneDate,
        icon: input.icon,
      }).returning();
      return milestone;
    }),

  deletePatientMilestone: protectedProcedure
    .input(z.object({ milestoneId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { patientMilestones } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      await drizzleDb.delete(patientMilestones).where(eq(patientMilestones.id, input.milestoneId));
      return { success: true };
    }),

  // ─── Mis experts (vista del paciente) ────────────────────────────────────
  getMyExperts: protectedProcedure
    .query(async ({ ctx }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
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
