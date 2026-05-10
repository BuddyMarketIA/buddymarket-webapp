import { hasRole } from "@shared/const";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  expertAppointments,
  expertMenuTemplates,
  pdfMenuImports,
  expertPatients,
  buddyExperts,
  expertMessages,
  users,
  userProfiles,
  expertAssignedMenus,
} from "../../drizzle/schema";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

// ── helpers ──────────────────────────────────────────────────────────────────

async function getExpertId(userId: number): Promise<number> {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const [expert] = await db
    .select({ id: buddyExperts.id })
    .from(buddyExperts)
    .where(and(eq(buddyExperts.userId, userId), eq(buddyExperts.isApproved, true)))
    .limit(1);
  if (!expert) throw new TRPCError({ code: "FORBIDDEN", message: "No eres un BuddyExpert aprobado" });
  return expert.id;
}

// ── router ───────────────────────────────────────────────────────────────────

export const expertDashboardRouter = router({

  // ── MÉTRICAS DEL DASHBOARD ─────────────────────────────────────────────────
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const expertId = await getExpertId(ctx.user.id);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Pacientes activos
    const [activePatients] = await db
      .select({ count: count() })
      .from(expertPatients)
      .where(and(eq(expertPatients.expertId, expertId), eq(expertPatients.status, "active")));

    // Nuevos pacientes este mes
    const [newPatientsMonth] = await db
      .select({ count: count() })
      .from(expertPatients)
      .where(and(
        eq(expertPatients.expertId, expertId),
        gte(expertPatients.createdAt, startOfMonth),
      ));

    // Citas de hoy
    const todayAppointments = await db
      .select({
        id: expertAppointments.id,
        title: expertAppointments.title,
        startTime: expertAppointments.startTime,
        endTime: expertAppointments.endTime,
        status: expertAppointments.status,
        modality: expertAppointments.modality,
        meetingUrl: expertAppointments.meetingUrl,
        patientUserId: expertAppointments.patientUserId,
        patientName: users.name,
        patientImage: users.imageUrl,
      })
      .from(expertAppointments)
      .leftJoin(users, eq(users.id, expertAppointments.patientUserId))
      .where(and(
        eq(expertAppointments.expertId, expertId),
        gte(expertAppointments.startTime, startOfToday),
        lte(expertAppointments.startTime, endOfToday),
        sql`${expertAppointments.status} != 'cancelled'`,
      ))
      .orderBy(expertAppointments.startTime);

    // Próximas citas (7 días)
    const upcomingAppointments = await db
      .select({
        id: expertAppointments.id,
        title: expertAppointments.title,
        startTime: expertAppointments.startTime,
        endTime: expertAppointments.endTime,
        status: expertAppointments.status,
        modality: expertAppointments.modality,
        meetingUrl: expertAppointments.meetingUrl,
        patientUserId: expertAppointments.patientUserId,
        patientName: users.name,
        patientImage: users.imageUrl,
      })
      .from(expertAppointments)
      .leftJoin(users, eq(users.id, expertAppointments.patientUserId))
      .where(and(
        eq(expertAppointments.expertId, expertId),
        gte(expertAppointments.startTime, now),
        lte(expertAppointments.startTime, new Date(now.getTime() + 7 * 86400000)),
        sql`${expertAppointments.status} != 'cancelled'`,
      ))
      .orderBy(expertAppointments.startTime)
      .limit(10);

    // Mensajes sin leer
    const [unreadMessages] = await db
      .select({ count: count() })
      .from(expertMessages)
      .innerJoin(expertPatients, eq(expertPatients.id, expertMessages.expertPatientId))
      .where(and(
        eq(expertPatients.expertId, expertId),
        eq(expertMessages.isRead, false),
        sql`${expertMessages.senderRole} = 'patient'`,
      ));

    // Pacientes sin actividad en 7 días (alertas)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const patientsWithoutCheckin = await db
      .select({
        patientUserId: expertPatients.patientUserId,
        patientName: users.name,
        patientImage: users.imageUrl,
        lastActivity: expertPatients.updatedAt,
      })
      .from(expertPatients)
      .leftJoin(users, eq(users.id, expertPatients.patientUserId))
      .where(and(
        eq(expertPatients.expertId, expertId),
        eq(expertPatients.status, "active"),
        lte(expertPatients.updatedAt, sevenDaysAgo),
      ))
      .limit(5);

    // Invitaciones pendientes
    const [pendingInvites] = await db
      .select({ count: count() })
      .from(expertPatients)
      .where(and(
        eq(expertPatients.expertId, expertId),
        eq(expertPatients.status, "invited"),
      ));

    // Últimos pacientes activos
    const recentPatients = await db
      .select({
        id: expertPatients.id,
        patientUserId: expertPatients.patientUserId,
        status: expertPatients.status,
        startDate: expertPatients.startDate,
        patientName: users.name,
        patientEmail: users.email,
        patientImage: users.imageUrl,
        mainGoal: userProfiles.mainGoal,
        weight: userProfiles.weight,
        targetWeight: userProfiles.targetWeight,
      })
      .from(expertPatients)
      .leftJoin(users, eq(users.id, expertPatients.patientUserId))
      .leftJoin(userProfiles, eq(userProfiles.userId, expertPatients.patientUserId))
      .where(and(
        eq(expertPatients.expertId, expertId),
        eq(expertPatients.status, "active"),
      ))
      .orderBy(desc(expertPatients.updatedAt))
      .limit(6);

    // Plantillas de menú
    const [menuTemplatesCount] = await db
      .select({ count: count() })
      .from(expertMenuTemplates)
      .where(and(eq(expertMenuTemplates.expertId, expertId), eq(expertMenuTemplates.isActive, true)));

    return {
      stats: {
        activePatients: activePatients.count,
        newPatientsMonth: newPatientsMonth.count,
        unreadMessages: unreadMessages.count,
        pendingInvites: pendingInvites.count,
        todayAppointmentsCount: todayAppointments.length,
        menuTemplatesCount: menuTemplatesCount.count,
      },
      todayAppointments,
      upcomingAppointments,
      recentPatients,
      alerts: {
        patientsWithoutCheckin,
        hasAlerts: patientsWithoutCheckin.length > 0 || unreadMessages.count > 0 || pendingInvites.count > 0,
      },
    };
  }),

  // ── PLANTILLAS DE MENÚ ────────────────────────────────────────────────────
  listTemplates: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const expertId = await getExpertId(ctx.user.id);
      const templates = await db
        .select()
        .from(expertMenuTemplates)
        .where(and(
          eq(expertMenuTemplates.expertId, expertId),
          eq(expertMenuTemplates.isActive, true),
          input?.category ? eq(expertMenuTemplates.category, input.category) : undefined,
        ))
        .orderBy(desc(expertMenuTemplates.createdAt));
      return templates;
    }),

  createTemplate: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      category: z.string().default("dieta_equilibrada"),
      targetGoal: z.string().optional(),
      dailyCalories: z.number().optional(),
      durationDays: z.number().default(7),
      menuData: z.string(),
      restrictions: z.string().optional(),
      allergensFree: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const expertId = await getExpertId(ctx.user.id);
      const [template] = await db
        .insert(expertMenuTemplates)
        .values({ expertId, ...input })
        .returning();
      return template;
    }),

  updateTemplate: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      targetGoal: z.string().optional(),
      dailyCalories: z.number().optional(),
      menuData: z.string().optional(),
      restrictions: z.string().optional(),
      allergensFree: z.string().optional(),
      tags: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const expertId = await getExpertId(ctx.user.id);
      const { id, ...data } = input;
      const [updated] = await db
        .update(expertMenuTemplates)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(expertMenuTemplates.id, id), eq(expertMenuTemplates.expertId, expertId)))
        .returning();
      return updated;
    }),

  deleteTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const expertId = await getExpertId(ctx.user.id);
      await db
        .update(expertMenuTemplates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(expertMenuTemplates.id, input.id), eq(expertMenuTemplates.expertId, expertId)));
      return { success: true };
    }),

  // Asignar plantilla a paciente
  assignTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      patientUserId: z.number(),
      expertNotes: z.string().optional(),
      weekStartDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const expertId = await getExpertId(ctx.user.id);

      const [relation] = await db
        .select({ id: expertPatients.id })
        .from(expertPatients)
        .where(and(
          eq(expertPatients.expertId, expertId),
          eq(expertPatients.patientUserId, input.patientUserId),
          eq(expertPatients.status, "active"),
        ))
        .limit(1);
      if (!relation) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente no encontrado" });

      const [template] = await db
        .select()
        .from(expertMenuTemplates)
        .where(and(eq(expertMenuTemplates.id, input.templateId), eq(expertMenuTemplates.expertId, expertId)))
        .limit(1);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Plantilla no encontrada" });

      const [patientProfile] = await db
        .select({
          menuAllergies: userProfiles.menuAllergies,
          menuRestrictions: userProfiles.menuRestrictions,
          mainGoal: userProfiles.mainGoal,
        })
        .from(userProfiles)
        .where(eq(userProfiles.userId, input.patientUserId))
        .limit(1);

      await db
        .update(expertMenuTemplates)
        .set({ timesAssigned: sql`${expertMenuTemplates.timesAssigned} + 1`, updatedAt: new Date() })
        .where(eq(expertMenuTemplates.id, input.templateId));

      const [assignment] = await db
        .insert(expertAssignedMenus)
        .values({
          expertPatientId: relation.id,
          expertId,
          patientUserId: input.patientUserId,
          originalMenuId: template.id,
          originalMenuTitle: template.title,
          adaptedMenuData: template.menuData,
          expertNotes: input.expertNotes,
          weekStartDate: input.weekStartDate ? new Date(input.weekStartDate) : undefined,
          status: "active",
        })
        .returning();

      return {
        assignment,
        patientRestrictions: patientProfile ? {
          allergies: patientProfile.menuAllergies ? JSON.parse(patientProfile.menuAllergies) : [],
          restrictions: patientProfile.menuRestrictions ? JSON.parse(patientProfile.menuRestrictions) : [],
          mainGoal: patientProfile.mainGoal,
        } : null,
      };
    }),

  // Restricciones del paciente
  getPatientRestrictions: protectedProcedure
    .input(z.object({ patientUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const expertId = await getExpertId(ctx.user.id);
      const [relation] = await db
        .select({ id: expertPatients.id })
        .from(expertPatients)
        .where(and(
          eq(expertPatients.expertId, expertId),
          eq(expertPatients.patientUserId, input.patientUserId),
        ))
        .limit(1);
      if (!relation) throw new TRPCError({ code: "NOT_FOUND" });

      const [profile] = await db
        .select({
          menuAllergies: userProfiles.menuAllergies,
          menuRestrictions: userProfiles.menuRestrictions,
          menuDietType: userProfiles.menuDietType,
          mainGoal: userProfiles.mainGoal,
          weight: userProfiles.weight,
          targetWeight: userProfiles.targetWeight,
          dailyCalorieGoal: userProfiles.dailyCalorieGoal,
        })
        .from(userProfiles)
        .where(eq(userProfiles.userId, input.patientUserId))
        .limit(1);

      return profile ?? null;
    }),

  // ── IMPORTACIÓN DE PDF ────────────────────────────────────────────────────
  uploadPdfForMenu: protectedProcedure
    .input(z.object({
      filename: z.string(),
      fileBase64: z.string(),
      mimeType: z.string().default("application/pdf"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const expertId = await getExpertId(ctx.user.id);

      const buffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `expert-pdfs/${expertId}/${Date.now()}-${input.filename}`;
      const { url: pdfUrl } = await storagePut(fileKey, buffer, input.mimeType);

      const [importRecord] = await db
        .insert(pdfMenuImports)
        .values({
          expertId,
          originalFilename: input.filename,
          pdfUrl,
          status: "processing",
        })
        .returning();

      return { importId: importRecord.id, pdfUrl };
    }),

  parsePdfWithAI: protectedProcedure
    .input(z.object({
      importId: z.number(),
      pdfUrl: z.string().url(),
      title: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const expertId = await getExpertId(ctx.user.id);

      const [importRecord] = await db
        .select()
        .from(pdfMenuImports)
        .where(and(eq(pdfMenuImports.id, input.importId), eq(pdfMenuImports.expertId, expertId)))
        .limit(1);
      if (!importRecord) throw new TRPCError({ code: "NOT_FOUND" });

      try {
        const aiResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Eres un asistente especializado en nutrición. Tu tarea es extraer la información de un menú nutricional de un PDF y convertirlo a formato JSON estructurado.

El formato de salida debe ser exactamente este JSON:
{
  "title": "Nombre del menú",
  "description": "Descripción breve",
  "dailyCalories": 2000,
  "category": "dieta_equilibrada",
  "durationDays": 7,
  "days": [
    {
      "day": "Lunes",
      "meals": [
        { "name": "Desayuno", "food": "Descripción del alimento", "calories": 400 },
        { "name": "Media mañana", "food": "...", "calories": 150 },
        { "name": "Comida", "food": "...", "calories": 600 },
        { "name": "Merienda", "food": "...", "calories": 200 },
        { "name": "Cena", "food": "...", "calories": 500 }
      ]
    }
  ],
  "restrictions": [],
  "allergensFree": [],
  "tags": []
}

Extrae toda la información disponible del PDF. Si no hay información de calorías, estímala. Si el menú no tiene todos los días, repite el patrón disponible.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Por favor extrae el menú nutricional de este PDF y conviértelo al formato JSON especificado. El título sugerido es: "${input.title || importRecord.originalFilename}".`,
                },
                {
                  type: "file_url",
                  file_url: {
                    url: input.pdfUrl,
                    mime_type: "application/pdf",
                  },
                } as any,
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "menu_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  dailyCalories: { type: "number" },
                  category: { type: "string" },
                  durationDays: { type: "number" },
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string" },
                        meals: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              food: { type: "string" },
                              calories: { type: "number" },
                            },
                            required: ["name", "food", "calories"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["day", "meals"],
                      additionalProperties: false,
                    },
                  },
                  restrictions: { type: "array", items: { type: "string" } },
                  allergensFree: { type: "array", items: { type: "string" } },
                  tags: { type: "array", items: { type: "string" } },
                },
                required: ["title", "description", "dailyCalories", "category", "durationDays", "days", "restrictions", "allergensFree", "tags"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = aiResponse.choices[0]?.message?.content;
        if (!content) throw new Error("No AI response");

        const parsedMenu = JSON.parse(content);

        const [template] = await db
          .insert(expertMenuTemplates)
          .values({
            expertId,
            title: parsedMenu.title || input.title || importRecord.originalFilename,
            description: parsedMenu.description,
            category: parsedMenu.category || "dieta_equilibrada",
            dailyCalories: parsedMenu.dailyCalories,
            durationDays: parsedMenu.durationDays || 7,
            menuData: JSON.stringify(parsedMenu.days),
            restrictions: JSON.stringify(parsedMenu.restrictions || []),
            allergensFree: JSON.stringify(parsedMenu.allergensFree || []),
            tags: JSON.stringify(parsedMenu.tags || []),
            sourceType: "pdf_import",
            sourcePdfUrl: importRecord.pdfUrl,
          })
          .returning();

        await db
          .update(pdfMenuImports)
          .set({
            status: "completed",
            parsedMenuData: content,
            templateId: template.id,
            updatedAt: new Date(),
          })
          .where(eq(pdfMenuImports.id, input.importId));

        return { template, parsedMenu };
      } catch (err: any) {
        await db
          .update(pdfMenuImports)
          .set({ status: "failed", errorMessage: err.message, updatedAt: new Date() })
          .where(eq(pdfMenuImports.id, input.importId));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al procesar el PDF: " + err.message });
      }
    }),

  // Historial de importaciones PDF
  listPdfImports: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const expertId = await getExpertId(ctx.user.id);
    return db
      .select()
      .from(pdfMenuImports)
      .where(eq(pdfMenuImports.expertId, expertId))
      .orderBy(desc(pdfMenuImports.createdAt))
      .limit(20);
  }),
});
