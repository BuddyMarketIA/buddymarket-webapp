import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
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
      const { eq, and, or, ilike, sql, isNull } = await import("drizzle-orm");

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
          deletedAt: users.deletedAt,
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
        .leftJoin(users, and(eq(users.id, expertPatients.patientUserId), isNull(users.deletedAt)))
        .leftJoin(userProfiles, eq(userProfiles.userId, expertPatients.patientUserId))
        .where(and(...conditions));

      // Filtrar relaciones huerófanas (usuario borrado) y por búsqueda si se proporciona
      let filtered = rows.filter(r => r.user?.id != null);
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
        inviteEmail: input.email,
      }).returning();

      // Enviar email de invitación
      try {
        const expertName = ctx.user.name ?? "Tu nutricionista";
        const appUrl = process.env.PUBLIC_APP_URL || "https://buddymarketapp.com";
        const isNewUser = !patientUser;
        const { sendEmail } = await import("../email");
        // URL de acción: si el usuario no existe, primero registrarse y luego aceptar
        const actionUrl = isNewUser
          ? `${appUrl}/register?invite=${token}&email=${encodeURIComponent(input.email)}`
          : `${appUrl}/accept-invite?token=${token}`;
        const actionLabel = isNewUser ? "Crear cuenta y aceptar invitación" : "Aceptar invitación";
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
              ${isNewUser ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #FED7AA;border-radius:12px;overflow:hidden;">
                <tr><td style="background:#FFF7ED;padding:16px 20px;">
                  <p style="color:#92400E;font-size:14px;font-weight:700;margin:0 0 8px;">¿Qué es BuddyMarket?</p>
                  <p style="color:#78350F;font-size:13px;margin:0 0 6px;">BuddyMarket es la plataforma de nutrición inteligente que conecta a nutricionistas con sus pacientes. Con BuddyMarket podrás:</p>
                  <ul style="color:#78350F;font-size:13px;margin:4px 0 0;padding-left:18px;">
                    <li style="margin-bottom:4px;">Acceder a tus menús personalizados creados por tu nutricionista</li>
                    <li style="margin-bottom:4px;">Comunicarte directamente con ${expertName} por mensajes</li>
                    <li style="margin-bottom:4px;">Registrar tu diario alimenticio y ver tu evolución</li>
                    <li>Recibir citas y recordatorios de seguimiento</li>
                  </ul>
                </td></tr>
              </table>
              ` : ""}
              <p style="color:#374151;font-size:15px;margin:0 0 24px;">
                ${isNewUser
                  ? "Para empezar, crea tu cuenta gratuita en BuddyMarket. Solo tarda 1 minuto y no necesitas tarjeta de crédito."
                  : "Acepta la invitación para acceder a tus menús personalizados, mensajería directa con tu nutricionista y seguimiento de tu evolución."
                }
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 20px;">
                <tr><td align="center">
                  <a href="${actionUrl}" style="display:inline-block;background:linear-gradient(135deg,#F97316,#EA580C);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;">
                    ${actionLabel}
                  </a>
                </td></tr>
              </table>
              ${isNewUser ? `<p style="color:#6b7280;font-size:13px;text-align:center;margin:0 0 16px;">Es completamente gratuito para pacientes ✔️</p>` : ""}
              <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">Si no esperabas esta invitación, puedes ignorar este email de forma segura.</p>
            </td></tr>
          `,
        });
      } catch (e) {
        console.error("Error enviando email de invitación:", e);
      }

      return { success: true, inviteToken: token, patientFound: !!patientUser };
    }),

  // ─── Recordatorio de invitación ───────────────────────────────────────────────────────────
  sendReminderInvite: protectedProcedure
    .input(z.object({ patientRelId: z.number() }))
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
      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.id, input.patientRelId), eq(expertPatients.expertId, expert.id))).limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });
      if (rel.status !== "invited") throw new TRPCError({ code: "BAD_REQUEST", message: "El paciente ya aceptó la invitación" });
      if (!rel.inviteEmail && !rel.inviteToken) throw new TRPCError({ code: "BAD_REQUEST", message: "No hay email de invitación registrado" });
      // Obtener el email del paciente desde la relación o el usuario
      const patientEmail = (rel as any).inviteEmail;
      if (!patientEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "No se encontró el email del paciente" });
      const expertName = ctx.user.name ?? "Tu nutricionista";
      const appUrl = process.env.PUBLIC_APP_URL || "https://buddymarketapp.com";
      const token = rel.inviteToken ?? "";
      const actionUrl = `${appUrl}/register?invite=${token}&email=${encodeURIComponent(patientEmail)}`;
      const { sendEmail } = await import("../email");
      await sendEmail({
        to: patientEmail,
        subject: `Recordatorio: ${expertName} te espera en BuddyMarket`,
        html: `
          <tr>
            <td style="background:linear-gradient(135deg,#F97316 0%,#EA580C 100%);padding:44px 40px 36px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;">⏰</div>
              <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 8px;">Recordatorio de invitación</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">${expertName} te está esperando en BuddyMarket</p>
            </td>
          </tr>
          <tr><td style="padding:40px;">
            <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hola,</p>
            <p style="color:#374151;font-size:15px;margin:0 0 16px;">
              <strong>${expertName}</strong> te invitó a BuddyMarket hace unos días y aún no has creado tu cuenta.
            </p>
            <p style="color:#374151;font-size:15px;margin:0 0 24px;">
              BuddyMarket es la plataforma donde podrás acceder a tus menús personalizados, chatear con tu nutricionista y registrar tu progreso. ¡Es gratis para pacientes!
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 20px;">
              <tr><td align="center">
                <a href="${actionUrl}" style="display:inline-block;background:linear-gradient(135deg,#F97316,#EA580C);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;">
                  Crear cuenta gratuita
                </a>
              </td></tr>
            </table>
            <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">Si no esperabas esta invitación, puedes ignorar este email.</p>
          </td></tr>
        `,
      });
      return { success: true };
    }),

  // ─── Obtener info de invitación (público, sin auth) ─────────────────────
  getInviteInfo: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients, buddyExperts, users } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(eq(expertPatients.inviteToken, input.token)).limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND", message: "Invitación no válida o expirada" });

      const [expert] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.id, rel.expertId)).limit(1);
      const [expertUser] = expert ? await drizzleDb.select({ name: users.name, imageUrl: users.imageUrl, email: users.email })
        .from(users).where(eq(users.id, expert.userId)).limit(1) : [null];

      return {
        token: input.token,
        status: rel.status,
        expertName: expertUser?.name ?? "Tu nutricionista",
        expertImage: expertUser?.imageUrl ?? null,
        expertSpecialty: expert?.specialty ?? null,
        alreadyAccepted: rel.status === "active",
      };
    }),

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

  // ─── Eliminar paciente de la lista ─────────────────────────────────────────
  deletePatient: protectedProcedure
    .input(z.object({ patientRelId: z.number() }))
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
      // Verify ownership
      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.id, input.patientRelId), eq(expertPatients.expertId, expert.id))).limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });
      await drizzleDb.delete(expertPatients).where(eq(expertPatients.id, input.patientRelId));
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

      // Enviar email de confirmación de cita al paciente
      try {
        const { users } = await import("../../drizzle/schema.js");
        const patientUser = await drizzleDb.select({ name: users.name, email: users.email })
          .from(users).where(eq(users.id, rel.patientUserId)).limit(1);
        if (patientUser[0]?.email) {
          const { sendAppointmentConfirmedEmail } = await import("../email.js");
          await sendAppointmentConfirmedEmail({
            patientEmail: patientUser[0].email,
            patientName: patientUser[0].name ?? "Paciente",
            expertName: expert.displayName ?? "tu nutricionista",
            appointmentTitle: input.title,
            startTime,
            endTime,
            modality: input.modality,
            meetingUrl: finalMeetUrl ?? null,
            location: input.location ?? null,
            gcalLink,
          });
        }
      } catch (emailErr) {
        console.error("[Email] Error sending appointment confirmed email:", emailErr);
      }

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

      // Enviar email al paciente notificando el nuevo menú
      try {
        const patientUser = await drizzleDb.select({ name: users.name, email: users.email })
          .from(users).where(eq(users.id, patientRel[0].patientUserId)).limit(1);
        const expertUser = await drizzleDb.select({ displayName: buddyExperts.displayName })
          .from(buddyExperts).where(eq(buddyExperts.id, patientRel[0].expertId)).limit(1);
        if (patientUser[0]?.email && expertUser[0]) {
          const { sendMenuAssignedEmail } = await import("../email.js");
          await sendMenuAssignedEmail({
            patientEmail: patientUser[0].email,
            patientName: patientUser[0].name ?? "Paciente",
            expertName: expertUser[0].displayName ?? "tu nutricionista",
            menuTitle,
            menuDescription: input.customDescription ?? null,
            menuCalories: null,
            menuNotes: input.expertNotes ?? null,
          });
        }
      } catch (emailErr) {
        console.error("[Email] Error sending menu assigned email:", emailErr);
      }

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
      const { expertAssignedMenus, expertPatients, buddyExperts, users, expertMenus } = await import("../../drizzle/schema.js");
      const { eq, and, or, inArray } = await import("drizzle-orm");

      const menus = await drizzleDb.select({
        menu: expertAssignedMenus,
        expertUser: {
          name: users.name,
          imageUrl: users.imageUrl,
        },
        originalMenu: {
          menuData: expertMenus.menuData,
          title: expertMenus.title,
          description: expertMenus.description,
          targetCalories: expertMenus.targetCalories,
          category: expertMenus.category,
        },
      })
        .from(expertAssignedMenus)
        .leftJoin(buddyExperts, eq(buddyExperts.id, expertAssignedMenus.expertId))
        .leftJoin(users, eq(users.id, buddyExperts.userId))
        .leftJoin(expertMenus, eq(expertMenus.id, expertAssignedMenus.originalMenuId))
        .where(and(
          eq(expertAssignedMenus.patientUserId, ctx.user.id),
          or(
            eq(expertAssignedMenus.status, "adapted"),
            eq(expertAssignedMenus.status, "active")
          )
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

// ─── Session Notes (Historial de sesiones) ─────────────────────────────
  getSessionNotes: protectedProcedure
    .input(z.object({ expertPatientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sessionNotes, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and, desc } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      return drizzleDb.select().from(sessionNotes)
        .where(and(eq(sessionNotes.expertPatientId, input.expertPatientId), eq(sessionNotes.expertId, expert.id)))
        .orderBy(desc(sessionNotes.sessionDate));
    }),
  addSessionNote: protectedProcedure
    .input(z.object({
      expertPatientId: z.number(),
      patientUserId: z.number(),
      sessionDate: z.string(),
      summary: z.string().min(1),
      agreements: z.string().optional(),
      nextObjectives: z.string().optional(),
      nextAppointmentDate: z.string().optional(),
      patientWeight: z.number().optional(),
      patientMood: z.number().min(1).max(5).optional(),
      adherenceScore: z.number().min(1).max(10).optional(),
      privateNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sessionNotes, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const [note] = await drizzleDb.insert(sessionNotes).values({
        expertId: expert.id,
        patientUserId: input.patientUserId,
        expertPatientId: input.expertPatientId,
        sessionDate: input.sessionDate,
        summary: input.summary,
        agreements: input.agreements,
        nextObjectives: input.nextObjectives,
        nextAppointmentDate: input.nextAppointmentDate,
        patientWeight: input.patientWeight,
        patientMood: input.patientMood,
        adherenceScore: input.adherenceScore,
        privateNotes: input.privateNotes,
      }).returning();
      return note;
    }),
  updateSessionNote: protectedProcedure
    .input(z.object({
      noteId: z.number(),
      summary: z.string().min(1).optional(),
      agreements: z.string().optional(),
      nextObjectives: z.string().optional(),
      nextAppointmentDate: z.string().optional(),
      patientWeight: z.number().optional(),
      patientMood: z.number().min(1).max(5).optional(),
      adherenceScore: z.number().min(1).max(10).optional(),
      privateNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sessionNotes, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const { noteId, ...updateData } = input;
      const [updated] = await drizzleDb.update(sessionNotes).set({ ...updateData, updatedAt: new Date() }).where(eq(sessionNotes.id, noteId)).returning();
      return updated;
    }),
  deleteSessionNote: protectedProcedure
    .input(z.object({ noteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sessionNotes, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      await drizzleDb.delete(sessionNotes).where(eq(sessionNotes.id, input.noteId));
      return { success: true };
    }),
  // ─── Menu Templates (Plantillas de menús reutilizables) ──────────────────
  getMenuTemplates: protectedProcedure
    .query(async ({ ctx }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { menuTemplates, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, desc } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      return drizzleDb.select().from(menuTemplates).where(eq(menuTemplates.expertId, expert.id)).orderBy(desc(menuTemplates.createdAt));
    }),
  createMenuTemplate: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.string().optional(),
      targetCalories: z.number().optional(),
      weekData: z.string(),
      isPublic: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { menuTemplates, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const [template] = await drizzleDb.insert(menuTemplates).values({
        expertId: expert.id,
        name: input.name,
        description: input.description,
        category: input.category || "general",
        targetCalories: input.targetCalories,
        weekData: input.weekData,
        isPublic: input.isPublic,
      }).returning();
      return template;
    }),
  deleteMenuTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { menuTemplates, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      await drizzleDb.delete(menuTemplates).where(eq(menuTemplates.id, input.templateId));
      return { success: true };
    }),
  // ─── Food Substitutions (Banco de sustituciones) ─────────────────────────
  getFoodSubstitutions: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { foodSubstitutions, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and, ilike } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const conditions: any[] = [eq(foodSubstitutions.expertId, expert.id)];
      if (input.search) conditions.push(ilike(foodSubstitutions.originalFood, `%${input.search}%`));
      return drizzleDb.select().from(foodSubstitutions).where(and(...conditions));
    }),
  addFoodSubstitution: protectedProcedure
    .input(z.object({
      originalFood: z.string().min(1),
      originalAmount: z.string().optional(),
      substitutes: z.string(),
      category: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { foodSubstitutions, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const [sub] = await drizzleDb.insert(foodSubstitutions).values({
        expertId: expert.id,
        originalFood: input.originalFood,
        originalAmount: input.originalAmount,
        substitutes: input.substitutes,
        category: input.category || "general",
        notes: input.notes,
      }).returning();
      return sub;
    }),
  deleteFoodSubstitution: protectedProcedure
    .input(z.object({ substitutionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { foodSubstitutions, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      await drizzleDb.delete(foodSubstitutions).where(eq(foodSubstitutions.id, input.substitutionId));
      return { success: true };
    }),
  // ─── Análisis de tendencias con IA ───────────────────────────────────────
  analyzePatientTrends: protectedProcedure
    .input(z.object({ expertPatientId: z.number(), patientUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { buddyExperts, userMetrics, patientWellbeingLogs, sessionNotes, users, userProfiles } = await import("../../drizzle/schema.js");
      const { eq, and, desc, gte } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const dateStr = ninetyDaysAgo.toISOString().split("T")[0];
      const [metrics, wellbeing, sessions, patientUser, patientProfile] = await Promise.all([
        drizzleDb.select().from(userMetrics).where(and(eq(userMetrics.userId, input.patientUserId), gte(userMetrics.date, dateStr))).orderBy(desc(userMetrics.date)).limit(20),
        drizzleDb.select().from(patientWellbeingLogs).where(and(eq(patientWellbeingLogs.userId, input.patientUserId), gte(patientWellbeingLogs.logDate, dateStr))).orderBy(desc(patientWellbeingLogs.logDate)).limit(20),
        drizzleDb.select().from(sessionNotes).where(and(eq(sessionNotes.expertPatientId, input.expertPatientId), eq(sessionNotes.expertId, expert.id))).orderBy(desc(sessionNotes.sessionDate)).limit(5),
        drizzleDb.select().from(users).where(eq(users.id, input.patientUserId)).limit(1),
        drizzleDb.select().from(userProfiles).where(eq(userProfiles.userId, input.patientUserId)).limit(1),
      ]);
      const patientName = patientUser[0]?.name || "el paciente";
      const profile = patientProfile[0];
      const metricsText = metrics.map(m => `- ${m.date}: peso ${m.weight || "N/A"} kg, grasa ${m.bodyFat || "N/A"}%, músculo ${m.muscleMass || "N/A"} kg`).join("\n") || "Sin registros";
      const wellbeingText = wellbeing.map(w => `- ${w.logDate}: energía ${w.energyLevel}/10, ánimo ${w.moodLevel}/10, sueño ${w.sleepQuality}/10, digestión ${w.digestiveComfort}/10`).join("\n") || "Sin registros";
      const sessionsText = sessions.map(s => `- ${s.sessionDate}: ${s.summary}. Adherencia: ${s.adherenceScore}/10`).join("\n") || "Sin sesiones";
      const prompt = `Eres un asistente de nutrición clínica. Analiza los siguientes datos de ${patientName} y proporciona un análisis profesional en español.\n\nPerfil: Peso objetivo: ${profile?.targetWeight || "no definido"} kg, Objetivo: ${profile?.mainGoal || "no definido"}, Nivel actividad: ${profile?.activityLevel || "no definido"}\n\nRegistros de peso/métricas (últimos 90 días):\n${metricsText}\n\nBienestar registrado:\n${wellbeingText}\n\nÚltimas sesiones:\n${sessionsText}\n\nProporciona:\n1. TENDENCIA GENERAL (2-3 frases sobre la evolución del paciente)\n2. PUNTOS FUERTES (2-3 aspectos positivos observados)\n3. ÁREAS DE MEJORA (2-3 aspectos a trabajar)\n4. RECOMENDACIONES PARA EL EXPERTO (3-4 acciones concretas para las próximas semanas)\n5. ALERTAS (si hay algún patrón preocupante, menciónalo)\n\nSé específico, usa los datos reales y habla en tono profesional pero accesible.`;
      const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      const analysis = response.choices?.[0]?.message?.content || "No se pudo generar el análisis.";
      return { analysis, generatedAt: new Date().toISOString() };
    }),

  // ─── Comprobar adherencia de pacientes ─────────────────────────────────────
  checkPatientsAdherence: protectedProcedure
    .query(async ({ ctx }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { buddyExperts, expertPatients, mealLogs } = await import("../../drizzle/schema.js");
      const { eq, and, desc } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const activePatients = await drizzleDb.select({
        patientId: expertPatients.id,
        patientUserId: expertPatients.patientUserId,
      }).from(expertPatients).where(and(eq(expertPatients.expertId, expert.id), eq(expertPatients.status, "active")));
      const deviations: Record<number, { daysWithoutLog: number; lastLogDate: string | null }> = {};
      for (const p of activePatients) {
        const [lastLog] = await drizzleDb.select({ logDate: mealLogs.logDate })
          .from(mealLogs)
          .where(eq(mealLogs.userId, p.patientUserId))
          .orderBy(desc(mealLogs.logDate))
          .limit(1);
        const lastLogDate = lastLog?.logDate ?? null;
        if (!lastLogDate) {
          deviations[p.patientId] = { daysWithoutLog: 999, lastLogDate: null };
        } else {
          const last = new Date(lastLogDate);
          const today = new Date();
          const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 2) {
            deviations[p.patientId] = { daysWithoutLog: diffDays, lastLogDate };
          }
        }
      }
      return deviations;
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

  // ─── Solicitar cita (vista del paciente) ─────────────────────────────────
  requestAppointment: protectedProcedure
    .input(z.object({
      patientRelId: z.number(),
      preferredDate: z.string().optional(), // ISO date string
      preferredTime: z.string().optional(), // e.g. "10:00"
      notes: z.string().max(500).optional(),
      modality: z.enum(["online", "in_person"]).optional().default("online"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients, buddyExperts, users, expertMessages } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      // Verify the relation belongs to this patient
      const [rel] = await drizzleDb.select()
        .from(expertPatients)
        .where(and(
          eq(expertPatients.id, input.patientRelId),
          eq(expertPatients.patientUserId, ctx.user.id)
        ))
        .limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND", message: "Relación no encontrada" });

      // Get patient name
      const [patientUser] = await drizzleDb.select({ name: users.name })
        .from(users).where(eq(users.id, ctx.user.id)).limit(1);

      // Build message content
      const dateStr = input.preferredDate
        ? new Date(input.preferredDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
        : "sin fecha preferida";
      const timeStr = input.preferredTime ?? "sin hora preferida";
      const modalityStr = input.modality === "online" ? "Online (videollamada)" : "Presencial";
      const notesStr = input.notes ? `\n\nNotas adicionales: ${input.notes}` : "";

      const messageContent = `📅 **Solicitud de cita**\n\nHola, me gustaría pedir una cita contigo.\n\n**Fecha preferida:** ${dateStr}\n**Hora preferida:** ${timeStr}\n**Modalidad:** ${modalityStr}${notesStr}\n\n*Este mensaje fue generado automáticamente desde la sección Mi Nutricionista.*`;

      // Send as a chat message from patient to expert
      await drizzleDb.insert(expertMessages).values({
        expertPatientId: input.patientRelId,
        senderRole: "patient",
        senderUserId: ctx.user.id,
        content: messageContent,
        isRead: false,
      });

      // Notify expert via notification system
      try {
        const { notifyOwner } = await import("../_core/notification.js");
        await notifyOwner({
          title: `📅 Solicitud de cita de ${patientUser?.name ?? "un paciente"}`,
          content: `${patientUser?.name ?? "Un paciente"} ha solicitado una cita.\nFecha: ${dateStr} · Hora: ${timeStr} · ${modalityStr}`,
        });
      } catch (_) { /* ignore notification errors */ }

      return { success: true };
    }),

  // ─── Dar feedback a un menú asignado (vista del paciente) ────────────────
  submitMenuFeedback: protectedProcedure
    .input(z.object({
      assignedMenuId: z.number(),
      rating: z.number().min(1).max(5),
      feedback: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertAssignedMenus } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      await drizzleDb.update(expertAssignedMenus)
        .set({
          patientRating: input.rating,
          patientFeedback: input.feedback ?? null,
          updatedAt: new Date(),
        })
        .where(and(
          eq(expertAssignedMenus.id, input.assignedMenuId),
          eq(expertAssignedMenus.patientUserId, ctx.user.id)
        ));

      return { success: true };
    }),

  // ── Solicitudes de contratación (paciente → nutricionista) ─────────────────
  sendHireRequest: protectedProcedure
    .input(z.object({
      expertId: z.number(),
      servicePlanId: z.number().optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertHireRequests, expertPatients, buddyExperts, users } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");
      // Verificar que no hay ya una solicitud pendiente
      const existing = await drizzleDb.select().from(expertHireRequests)
        .where(and(
          eq(expertHireRequests.patientUserId, ctx.user.id),
          eq(expertHireRequests.expertId, input.expertId),
          eq(expertHireRequests.status, "pending")
        )).limit(1);
      if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "Ya tienes una solicitud pendiente con este nutricionista" });
      // Verificar que no es ya paciente
      const existingRelation = await drizzleDb.select().from(expertPatients)
        .where(and(
          eq(expertPatients.patientUserId, ctx.user.id),
          eq(expertPatients.expertId, input.expertId)
        )).limit(1);
      if (existingRelation[0]) throw new TRPCError({ code: "CONFLICT", message: "Ya eres paciente de este nutricionista" });
      const [request] = await drizzleDb.insert(expertHireRequests).values({
        patientUserId: ctx.user.id,
        expertId: input.expertId,
        servicePlanId: input.servicePlanId ?? null,
        message: input.message ?? null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      // Notificar al nutricionista
      try {
        const expert = await drizzleDb.select({ userId: buddyExperts.userId, displayName: buddyExperts.displayName })
          .from(buddyExperts).where(eq(buddyExperts.id, input.expertId)).limit(1);
        const patient = await drizzleDb.select({ name: users.name, email: users.email })
          .from(users).where(eq(users.id, ctx.user.id)).limit(1);
        if (expert[0] && patient[0]) {
          const expertUser = await drizzleDb.select({ email: users.email })
            .from(users).where(eq(users.id, expert[0].userId)).limit(1);
          if (expertUser[0]?.email) {
            const { sendNewHireRequestEmail } = await import("../email.js");
            // Get plan info if any
            let planName = "Sin plan especificado";
            let planPrice = "";
            if (input.servicePlanId) {
              const { expertServicePlans } = await import("../../drizzle/schema.js");
              const plan = await drizzleDb.select({ name: expertServicePlans.name, price: expertServicePlans.price, billingPeriod: expertServicePlans.billingPeriod })
                .from(expertServicePlans).where(eq(expertServicePlans.id, input.servicePlanId)).limit(1);
              if (plan[0]) { planName = plan[0].name; planPrice = `${plan[0].price}€/${plan[0].billingPeriod}`; }
            }
            await sendNewHireRequestEmail({
              expertEmail: expertUser[0].email,
              expertName: expert[0].displayName ?? "Experto",
              patientName: patient[0].name ?? "Paciente",
              patientEmail: patient[0].email ?? "",
              planName,
              planPrice,
              message: input.message ?? null,
            });
          }
        }
      } catch (_) {}
      return { id: request.id, status: "pending" };
    }),

  getMyHireRequests: protectedProcedure
    .query(async ({ ctx }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertHireRequests, buddyExperts, expertServicePlans } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const rows = await drizzleDb.select({
        id: expertHireRequests.id,
        status: expertHireRequests.status,
        message: expertHireRequests.message,
        expertResponse: expertHireRequests.expertResponse,
        createdAt: expertHireRequests.createdAt,
        respondedAt: expertHireRequests.respondedAt,
        expert: { id: buddyExperts.id, displayName: buddyExperts.displayName, avatarUrl: buddyExperts.avatarUrl, specialty: buddyExperts.specialty },
        plan: { id: expertServicePlans.id, name: expertServicePlans.name, price: expertServicePlans.price, billingPeriod: expertServicePlans.billingPeriod },
      })
        .from(expertHireRequests)
        .leftJoin(buddyExperts, eq(expertHireRequests.expertId, buddyExperts.id))
        .leftJoin(expertServicePlans, eq(expertHireRequests.servicePlanId, expertServicePlans.id))
        .where(eq(expertHireRequests.patientUserId, ctx.user.id))
        .orderBy(expertHireRequests.createdAt);
      return rows;
    }),

  getExpertHireRequests: protectedProcedure
    .query(async ({ ctx }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertHireRequests, buddyExperts, expertServicePlans, users } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const expert = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert[0]) return [];
      const rows = await drizzleDb.select({
        id: expertHireRequests.id,
        status: expertHireRequests.status,
        message: expertHireRequests.message,
        createdAt: expertHireRequests.createdAt,
        patient: { id: users.id, name: users.name, email: users.email, imageUrl: users.imageUrl },
        plan: { id: expertServicePlans.id, name: expertServicePlans.name, price: expertServicePlans.price, billingPeriod: expertServicePlans.billingPeriod },
      })
        .from(expertHireRequests)
        .leftJoin(users, eq(expertHireRequests.patientUserId, users.id))
        .leftJoin(expertServicePlans, eq(expertHireRequests.servicePlanId, expertServicePlans.id))
        .where(eq(expertHireRequests.expertId, expert[0].id))
        .orderBy(expertHireRequests.createdAt);
      return rows;
    }),

  respondHireRequest: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      action: z.enum(["accept", "reject"]),
      response: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertHireRequests, buddyExperts, expertPatients, users } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");
      const expert = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert[0]) throw new TRPCError({ code: "FORBIDDEN" });
      const request = await drizzleDb.select().from(expertHireRequests)
        .where(and(eq(expertHireRequests.id, input.requestId), eq(expertHireRequests.expertId, expert[0].id))).limit(1);
      if (!request[0]) throw new TRPCError({ code: "NOT_FOUND" });
      if (request[0].status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Esta solicitud ya fue respondida" });
      let expertPatientId: number | undefined;
      if (input.action === "accept") {
        const [rel] = await drizzleDb.insert(expertPatients).values({
          expertId: expert[0].id,
          patientUserId: request[0].patientUserId,
          status: "active",
          inviteEmail: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning({ id: expertPatients.id });
        expertPatientId = rel.id;
      }
      await drizzleDb.update(expertHireRequests).set({
        status: input.action === "accept" ? "accepted" : "rejected",
        expertResponse: input.response ?? null,
        expertPatientId: expertPatientId ?? null,
        respondedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(expertHireRequests.id, input.requestId));
      // Notificar al paciente
      try {
        const patient = await drizzleDb.select({ name: users.name, email: users.email })
          .from(users).where(eq(users.id, request[0].patientUserId)).limit(1);
        if (patient[0]?.email) {
          const { sendHireRequestResponseEmail } = await import("../email.js");
          const accepted = input.action === "accept";
          // Get plan name
          let planName = "tu plan solicitado";
          if (request[0].servicePlanId) {
            const { expertServicePlans } = await import("../../drizzle/schema.js");
            const plan = await drizzleDb.select({ name: expertServicePlans.name })
              .from(expertServicePlans).where(eq(expertServicePlans.id, request[0].servicePlanId)).limit(1);
            if (plan[0]) planName = plan[0].name;
          }
          await sendHireRequestResponseEmail({
            patientEmail: patient[0].email,
            patientName: patient[0].name ?? "Paciente",
            expertName: expert[0].displayName ?? "tu nutricionista",
            planName,
            accepted,
            message: input.response ?? null,
          });
        }
      } catch (_) {}
      return { ok: true, action: input.action, expertPatientId };
    }),

  // ── Proactive: Get patients inactive for N+ days ───────────────────────────
  getInactivePatients: protectedProcedure
    .input(z.object({ inactiveDays: z.number().int().min(1).max(30).default(3) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'buddyexpert' && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const { getDb } = await import('../db');
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { expertPatients, buddyExperts, users, mealLogs } = await import('../../drizzle/schema.js');
      const { eq, and, desc, isNull } = await import('drizzle-orm');
      const [expert] = await drizzleDb.select({ id: buddyExperts.id })
        .from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) return [];
      const patients = await drizzleDb.select({
        expertPatientId: expertPatients.id,
        patientUserId: expertPatients.patientUserId,
        patientName: users.name,
        patientEmail: users.email,
        patientAvatar: users.imageUrl,
      })
        .from(expertPatients)
        .innerJoin(users, and(eq(users.id, expertPatients.patientUserId), isNull(users.deletedAt)))
        .where(and(eq(expertPatients.expertId, expert.id), eq(expertPatients.status, 'active')))
        .limit(50);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - input.inactiveDays);
      const cutoffStr = cutoff.toISOString().split('T')[0]!;
      const inactive: Array<typeof patients[0] & { lastLogDate: string | null }> = [];
      for (const p of patients) {
        const [lastLog] = await drizzleDb.select({ logDate: mealLogs.logDate })
          .from(mealLogs).where(eq(mealLogs.userId, p.patientUserId))
          .orderBy(desc(mealLogs.logDate)).limit(1);
        const lastLogDate = lastLog?.logDate ? String(lastLog.logDate) : null;
        if (!lastLogDate || lastLogDate < cutoffStr) {
          inactive.push({ ...p, lastLogDate });
        }
      }
      return inactive;
    }),

  sendProactiveMessage: protectedProcedure
    .input(z.object({ expertPatientId: z.number().int(), message: z.string().min(1).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'buddyexpert' && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const { getDb } = await import('../db');
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { expertMessages, expertPatients, buddyExperts } = await import('../../drizzle/schema.js');
      const { eq, and } = await import('drizzle-orm');
      const [expert] = await drizzleDb.select({ id: buddyExperts.id })
        .from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: 'FORBIDDEN', message: 'No eres un experto' });
      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.id, input.expertPatientId), eq(expertPatients.expertId, expert.id))).limit(1);
      if (!rel) throw new TRPCError({ code: 'NOT_FOUND', message: 'Relación no encontrada' });
      await drizzleDb.insert(expertMessages).values({
        expertPatientId: input.expertPatientId,
        senderId: ctx.user.id,
        senderRole: 'expert',
        content: input.message,
        isRead: false,
      });
      return { ok: true };
    }),
});
