// @ts-nocheck
import { z } from "zod";
import { eq, and, desc, asc, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  offlinePatients,
  offlinePatientLabels,
  offlinePatientLabelAssignments,
  offlineBodyMeasurements,
  offlineProgressPhotos,
  offlinePatientChangeLog,
  offlineQuestionnaires,
  offlineQuestionnaireResponses,
  offlineInvoices,
  offlinePatientKanban,
  patientWeightHistory,
} from "../../drizzle/schema";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";

function requireExpert(ctx: any) {
  if (!ctx.user || (ctx.user.role !== "buddyexpert" && ctx.user.role !== "admin")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo para expertos" });
  }
}

function randomSuffix() {
  return Math.random().toString(36).substring(2, 10);
}

export const expertProRouter = router({
  // ─── LABELS ────────────────────────────────────────────────────────────────
  listLabels: protectedProcedure.query(async ({ ctx }) => {
    requireExpert(ctx);
    return getDb().select().from(offlinePatientLabels)
      .where(eq(offlinePatientLabels.expertUserId, ctx.user.id))
      .orderBy(offlinePatientLabels.name);
  }),

  createLabel: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(64), color: z.string().default("#6366f1") }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [label] = await getDb().insert(offlinePatientLabels).values({
        expertUserId: ctx.user.id,
        name: input.name,
        color: input.color,
      }).returning();
      return label;
    }),

  deleteLabel: protectedProcedure
    .input(z.object({ labelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      await getDb().delete(offlinePatientLabelAssignments)
        .where(and(eq(offlinePatientLabelAssignments.labelId, input.labelId), eq(offlinePatientLabelAssignments.expertUserId, ctx.user.id)));
      await getDb().delete(offlinePatientLabels)
        .where(and(eq(offlinePatientLabels.id, input.labelId), eq(offlinePatientLabels.expertUserId, ctx.user.id)));
      return { ok: true };
    }),

  assignLabel: protectedProcedure
    .input(z.object({ patientId: z.number(), labelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      // Verify patient belongs to expert
      const [patient] = await getDb().select().from(offlinePatients)
        .where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      // Upsert assignment
      await getDb().insert(offlinePatientLabelAssignments).values({
        patientId: input.patientId,
        labelId: input.labelId,
        expertUserId: ctx.user.id,
      }).onConflictDoNothing();
      return { ok: true };
    }),

  removeLabel: protectedProcedure
    .input(z.object({ patientId: z.number(), labelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      await getDb().delete(offlinePatientLabelAssignments)
        .where(and(
          eq(offlinePatientLabelAssignments.patientId, input.patientId),
          eq(offlinePatientLabelAssignments.labelId, input.labelId),
          eq(offlinePatientLabelAssignments.expertUserId, ctx.user.id),
        ));
      return { ok: true };
    }),

  getPatientLabels: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      const assignments = await getDb().select({
        id: offlinePatientLabels.id,
        name: offlinePatientLabels.name,
        color: offlinePatientLabels.color,
      })
        .from(offlinePatientLabelAssignments)
        .innerJoin(offlinePatientLabels, eq(offlinePatientLabelAssignments.labelId, offlinePatientLabels.id))
        .where(and(
          eq(offlinePatientLabelAssignments.patientId, input.patientId),
          eq(offlinePatientLabelAssignments.expertUserId, ctx.user.id),
        ));
      return assignments;
    }),

  // ─── BODY MEASUREMENTS ─────────────────────────────────────────────────────
  listBodyMeasurements: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      return getDb().select().from(offlineBodyMeasurements)
        .where(and(eq(offlineBodyMeasurements.patientId, input.patientId), eq(offlineBodyMeasurements.expertUserId, ctx.user.id)))
        .orderBy(desc(offlineBodyMeasurements.recordedAt));
    }),

  addBodyMeasurement: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      recordedAt: z.string().optional(),
      waist: z.number().optional(),
      hip: z.number().optional(),
      chest: z.number().optional(),
      leftArm: z.number().optional(),
      rightArm: z.number().optional(),
      leftThigh: z.number().optional(),
      rightThigh: z.number().optional(),
      leftCalf: z.number().optional(),
      rightCalf: z.number().optional(),
      neck: z.number().optional(),
      shoulder: z.number().optional(),
      bodyFatPct: z.number().optional(),
      muscleMassPct: z.number().optional(),
      bmi: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [patient] = await getDb().select().from(offlinePatients)
        .where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      const { patientId, recordedAt, ...rest } = input;
      const [record] = await getDb().insert(offlineBodyMeasurements).values({
        patientId,
        expertUserId: ctx.user.id,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        ...rest,
      }).returning();
      return record;
    }),

  deleteBodyMeasurement: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      await getDb().delete(offlineBodyMeasurements)
        .where(and(eq(offlineBodyMeasurements.id, input.id), eq(offlineBodyMeasurements.expertUserId, ctx.user.id)));
      return { ok: true };
    }),

  // ─── PROGRESS PHOTOS ───────────────────────────────────────────────────────
  listProgressPhotos: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      return getDb().select().from(offlineProgressPhotos)
        .where(and(eq(offlineProgressPhotos.patientId, input.patientId), eq(offlineProgressPhotos.expertUserId, ctx.user.id)))
        .orderBy(desc(offlineProgressPhotos.takenAt));
    }),

  uploadProgressPhoto: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      base64: z.string(),
      mimeType: z.string().default("image/jpeg"),
      photoType: z.enum(["progress", "before", "after"]).default("progress"),
      angle: z.enum(["front", "back", "side_left", "side_right"]).default("front"),
      notes: z.string().optional(),
      isVisibleToPatient: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [patient] = await getDb().select().from(offlinePatients)
        .where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      // Upload to S3
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] || "jpg";
      const key = `expert-${ctx.user.id}/patient-${input.patientId}/progress/${randomSuffix()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      const [photo] = await getDb().insert(offlineProgressPhotos).values({
        patientId: input.patientId,
        expertUserId: ctx.user.id,
        photoUrl: url,
        photoType: input.photoType,
        angle: input.angle,
        notes: input.notes,
        isVisibleToPatient: input.isVisibleToPatient,
      }).returning();
      return photo;
    }),

  deleteProgressPhoto: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      await getDb().delete(offlineProgressPhotos)
        .where(and(eq(offlineProgressPhotos.id, input.id), eq(offlineProgressPhotos.expertUserId, ctx.user.id)));
      return { ok: true };
    }),

  togglePhotoVisibility: protectedProcedure
    .input(z.object({ id: z.number(), isVisible: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      await getDb().update(offlineProgressPhotos)
        .set({ isVisibleToPatient: input.isVisible })
        .where(and(eq(offlineProgressPhotos.id, input.id), eq(offlineProgressPhotos.expertUserId, ctx.user.id)));
      return { ok: true };
    }),

  // ─── CHANGE LOG ────────────────────────────────────────────────────────────
  getChangeLog: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      return getDb().select().from(offlinePatientChangeLog)
        .where(and(eq(offlinePatientChangeLog.patientId, input.patientId), eq(offlinePatientChangeLog.expertUserId, ctx.user.id)))
        .orderBy(desc(offlinePatientChangeLog.changedAt))
        .limit(100);
    }),

  // ─── KANBAN ────────────────────────────────────────────────────────────────
  getKanbanBoard: protectedProcedure.query(async ({ ctx }) => {
    requireExpert(ctx);
    // Get all patients with their kanban stage
    const patients = await getDb().select().from(offlinePatients)
      .where(and(eq(offlinePatients.expertUserId, ctx.user.id), eq(offlinePatients.isActive, true)))
      .orderBy(offlinePatients.name);
    const kanbanRows = await getDb().select().from(offlinePatientKanban)
      .where(eq(offlinePatientKanban.expertUserId, ctx.user.id));
    const kanbanMap = new Map(kanbanRows.map(k => [k.patientId, k]));
    return patients.map(p => ({
      ...p,
      stage: kanbanMap.get(p.id)?.stage ?? "new",
      stageOrder: kanbanMap.get(p.id)?.stageOrder ?? 0,
    }));
  }),

  updateKanbanStage: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      stage: z.enum(["new", "active", "follow_up", "inactive", "discharged"]),
      stageOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [patient] = await getDb().select().from(offlinePatients)
        .where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      await getDb().insert(offlinePatientKanban).values({
        patientId: input.patientId,
        expertUserId: ctx.user.id,
        stage: input.stage,
        stageOrder: input.stageOrder ?? 0,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: [offlinePatientKanban.patientId],
        set: { stage: input.stage, stageOrder: input.stageOrder ?? 0, updatedAt: new Date() },
      });
      return { ok: true };
    }),

  // ─── ADHERENCE ─────────────────────────────────────────────────────────────
  getAdherenceStats: protectedProcedure
    .input(z.object({ patientId: z.number(), days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [patient] = await getDb().select().from(offlinePatients)
        .where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      // Count weight records in last N days as proxy for adherence
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const weightRecords = await getDb().select().from(patientWeightHistory)
        .where(and(
          eq(patientWeightHistory.patientId, input.patientId),
          eq(patientWeightHistory.expertUserId, ctx.user.id),
          sql`${patientWeightHistory.recordedAt} >= ${since}`,
        ));
      const photoRecords = await getDb().select().from(offlineProgressPhotos)
        .where(and(
          eq(offlineProgressPhotos.patientId, input.patientId),
          eq(offlineProgressPhotos.expertUserId, ctx.user.id),
          sql`${offlineProgressPhotos.takenAt} >= ${since}`,
        ));
      const measureRecords = await getDb().select().from(offlineBodyMeasurements)
        .where(and(
          eq(offlineBodyMeasurements.patientId, input.patientId),
          eq(offlineBodyMeasurements.expertUserId, ctx.user.id),
          sql`${offlineBodyMeasurements.recordedAt} >= ${since}`,
        ));
      const adherencePct = Math.min(100, Math.round((weightRecords.length / Math.max(1, input.days / 7)) * 100));
      return {
        days: input.days,
        weightCheckins: weightRecords.length,
        progressPhotos: photoRecords.length,
        bodyMeasurements: measureRecords.length,
        adherencePct,
        lastWeightDate: weightRecords[0]?.recordedAt ?? null,
        daysSinceLastCheckin: weightRecords[0]
          ? Math.floor((Date.now() - new Date(weightRecords[0].recordedAt).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };
    }),

  // ─── QUESTIONNAIRES ────────────────────────────────────────────────────────
  listQuestionnaires: protectedProcedure.query(async ({ ctx }) => {
    requireExpert(ctx);
    return getDb().select().from(offlineQuestionnaires)
      .where(eq(offlineQuestionnaires.expertUserId, ctx.user.id))
      .orderBy(desc(offlineQuestionnaires.createdAt));
  }),

  createQuestionnaire: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(256),
      description: z.string().optional(),
      questions: z.array(z.object({
        id: z.string(),
        type: z.enum(["text", "number", "scale", "choice", "multiChoice", "yesno"]),
        label: z.string(),
        options: z.array(z.string()).optional(),
        required: z.boolean().default(false),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [q] = await getDb().insert(offlineQuestionnaires).values({
        expertUserId: ctx.user.id,
        title: input.title,
        description: input.description,
        questions: JSON.stringify(input.questions),
      }).returning();
      return q;
    }),

  deleteQuestionnaire: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      await getDb().delete(offlineQuestionnaires)
        .where(and(eq(offlineQuestionnaires.id, input.id), eq(offlineQuestionnaires.expertUserId, ctx.user.id)));
      return { ok: true };
    }),

  saveQuestionnaireResponse: protectedProcedure
    .input(z.object({
      questionnaireId: z.number(),
      patientId: z.number(),
      answers: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [resp] = await getDb().insert(offlineQuestionnaireResponses).values({
        questionnaireId: input.questionnaireId,
        patientId: input.patientId,
        expertUserId: ctx.user.id,
        answers: JSON.stringify(input.answers),
        completedAt: new Date(),
      }).returning();
      return resp;
    }),

  getQuestionnaireResponses: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      const responses = await getDb().select({
        id: offlineQuestionnaireResponses.id,
        questionnaireId: offlineQuestionnaireResponses.questionnaireId,
        answers: offlineQuestionnaireResponses.answers,
        completedAt: offlineQuestionnaireResponses.completedAt,
        createdAt: offlineQuestionnaireResponses.createdAt,
        title: offlineQuestionnaires.title,
      })
        .from(offlineQuestionnaireResponses)
        .innerJoin(offlineQuestionnaires, eq(offlineQuestionnaireResponses.questionnaireId, offlineQuestionnaires.id))
        .where(and(
          eq(offlineQuestionnaireResponses.patientId, input.patientId),
          eq(offlineQuestionnaireResponses.expertUserId, ctx.user.id),
        ))
        .orderBy(desc(offlineQuestionnaireResponses.createdAt));
      return responses;
    }),

  // ─── INVOICES ──────────────────────────────────────────────────────────────
  listInvoices: protectedProcedure
    .input(z.object({ patientId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      const conditions = [eq(offlineInvoices.expertUserId, ctx.user.id)];
      if (input.patientId) conditions.push(eq(offlineInvoices.patientId, input.patientId));
      return getDb().select().from(offlineInvoices)
        .where(and(...conditions))
        .orderBy(desc(offlineInvoices.issuedAt));
    }),

  createInvoice: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      concept: z.string().min(1).max(256),
      amount: z.number().positive(),
      dueAt: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [patient] = await getDb().select().from(offlinePatients)
        .where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      // Generate invoice number: EXP-{userId}-{timestamp}
      const invoiceNumber = `BDY-${ctx.user.id}-${Date.now().toString(36).toUpperCase()}`;
      const [invoice] = await getDb().insert(offlineInvoices).values({
        expertUserId: ctx.user.id,
        patientId: input.patientId,
        invoiceNumber,
        concept: input.concept,
        amount: input.amount,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        notes: input.notes,
        status: "draft",
      }).returning();
      return invoice;
    }),

  updateInvoiceStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const updateData: any = { status: input.status, updatedAt: new Date() };
      if (input.status === "paid") updateData.paidAt = new Date();
      await getDb().update(offlineInvoices)
        .set(updateData)
        .where(and(eq(offlineInvoices.id, input.id), eq(offlineInvoices.expertUserId, ctx.user.id)));
      return { ok: true };
    }),

  deleteInvoice: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      await getDb().delete(offlineInvoices)
        .where(and(eq(offlineInvoices.id, input.id), eq(offlineInvoices.expertUserId, ctx.user.id)));
      return { ok: true };
    }),

  // ─── EXPERT KPIs ───────────────────────────────────────────────────────────
  getExpertKPIs: protectedProcedure.query(async ({ ctx }) => {
    requireExpert(ctx);
    const patients = await getDb().select().from(offlinePatients)
      .where(and(eq(offlinePatients.expertUserId, ctx.user.id), eq(offlinePatients.isActive, true)));
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const activePatients = patients.length;
    const newPatientsThisMonth = patients.filter(p => new Date(p.createdAt) >= startOfMonth).length;
    const invitedPatients = patients.filter(p => p.inviteAcceptedAt).length;
    // Weight records for adherence
    const weightRecords = await getDb().select().from(patientWeightHistory)
      .where(eq(patientWeightHistory.expertUserId, ctx.user.id))
      .orderBy(patientWeightHistory.patientId, desc(patientWeightHistory.recordedAt));
    const lastWeightByPatient = new Map<number, Date>();
    for (const r of weightRecords) {
      const existing = lastWeightByPatient.get(r.patientId);
      if (!existing) {
        lastWeightByPatient.set(r.patientId, new Date(r.recordedAt));
      }
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const patientsWithoutLogList = patients
      .filter(p => {
        const last = lastWeightByPatient.get(p.id);
        return !last || last < sevenDaysAgo;
      })
      .map(p => {
        const last = lastWeightByPatient.get(p.id);
        return {
          id: p.id,
          name: p.name,
          daysWithoutLog: last
            ? Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24))
            : 999,
        };
      });
    const patientsWithoutLog = patientsWithoutLogList.length;
    const patientsWithLog = patients.filter(p => {
      const last = lastWeightByPatient.get(p.id);
      return last && last >= sevenDaysAgo;
    }).length;
    const avgAdherence = patients.length > 0 ? Math.round((patientsWithLog / patients.length) * 100) : 0;
    // On track
    const patientWeightsMap: Record<number, number[]> = {};
    for (const r of weightRecords) {
      const existing2 = patientWeightsMap[r.patientId];
      if (!existing2) patientWeightsMap[r.patientId] = [];
      patientWeightsMap[r.patientId].push(r.weightKg);
    }
    const patientsOnTrack = Object.values(patientWeightsMap).filter(ws => ws.length >= 2 && ws[0] - ws[ws.length - 1] >= 0.5).length;
    const patientsOnTrackPct = patients.length > 0 ? Math.round((patientsOnTrack / patients.length) * 100) : 0;
    // Revenue
    const invoices = await getDb().select().from(offlineInvoices)
      .where(eq(offlineInvoices.expertUserId, ctx.user.id));
    const monthRevenue = invoices
      .filter(i => i.status === "paid" && i.paidAt && new Date(i.paidAt) >= startOfMonth)
      .reduce((sum, i) => sum + i.amount, 0);
    const totalRevenue = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
    const pendingRevenue = invoices.filter(i => i.status === "sent" || i.status === "draft").reduce((sum, i) => sum + i.amount, 0);
    const deltas = Object.values(patientWeightsMap)
      .filter(ws => ws.length >= 2)
      .map(ws => ws[ws.length - 1] - ws[0]);
    const avgWeightDelta = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
    return {
      activePatients,
      totalPatients: activePatients,
      newPatientsThisMonth,
      invitedPatients,
      avgAdherence,
      patientsWithoutLog,
      patientsWithoutLogList,
      patientsOnTrack: patientsOnTrackPct,
      appointmentsThisMonth: 0,
      monthRevenue: Math.round(monthRevenue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingRevenue: Math.round(pendingRevenue * 100) / 100,
      avgWeightDelta: Math.round(avgWeightDelta * 10) / 10,
      patientsWithProgress: deltas.length,
    };
  }),

  // ─── PORTFOLIO STATS ───────────────────────────────────────────────────────
  getPortfolioStats: protectedProcedure.query(async ({ ctx }) => {
    requireExpert(ctx);
    const patients = await getDb().select().from(offlinePatients)
      .where(and(eq(offlinePatients.expertUserId, ctx.user.id), eq(offlinePatients.isActive, true)));
    // Distribution by objective
    const byObjective: Record<string, number> = {};
    for (const p of patients) {
      const obj = p.objective ?? "sin_objetivo";
      byObjective[obj] = (byObjective[obj] ?? 0) + 1;
    }
    // Distribution by gender
    const byGender: Record<string, number> = {};
    for (const p of patients) {
      const g = p.gender ?? "no_especificado";
      byGender[g] = (byGender[g] ?? 0) + 1;
    }
    // Age distribution
    const now = new Date();
    const ages = patients
      .filter(p => p.birthDate)
      .map(p => Math.floor((now.getTime() - new Date(p.birthDate!).getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
    const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null;
    // Kanban distribution
    const kanbanRows = await getDb().select().from(offlinePatientKanban)
      .where(eq(offlinePatientKanban.expertUserId, ctx.user.id));
    const byStage: Record<string, number> = { new: 0, active: 0, follow_up: 0, inactive: 0, discharged: 0 };
    const kanbanMap = new Map(kanbanRows.map(k => [k.patientId, k.stage]));
    for (const p of patients) {
      const stage = kanbanMap.get(p.id) ?? "new";
      byStage[stage] = (byStage[stage] ?? 0) + 1;
    }
    // Weight loss average
    const allWeightRows = await getDb().select().from(patientWeightHistory)
      .where(eq(patientWeightHistory.expertUserId, ctx.user.id))
      .orderBy(patientWeightHistory.patientId, patientWeightHistory.recordedAt);
    const weightByPat = new Map<number, number[]>();
    for (const w of allWeightRows) {
      const arr = weightByPat.get(w.patientId) ?? [];
      arr.push(w.weightKg);
      weightByPat.set(w.patientId, arr);
    }
    const losses: number[] = [];
    for (const [, ws] of weightByPat) {
      if (ws.length >= 2) losses.push(ws[ws.length - 1] - ws[0]);
    }
    const avgWeightLoss = losses.length > 0
      ? parseFloat((losses.reduce((a, b) => a + b, 0) / losses.length).toFixed(1))
      : undefined;
    const withBuddyAccount = patients.filter(p => p.linkedUserId).length;
    const invitesSent = patients.filter(p => p.inviteSentAt).length;
    return {
      total: patients.length,
      totalPatients: patients.length,
      byObjective: Object.entries(byObjective).map(([objective, count]) => ({ objective, count })),
      byGender: Object.entries(byGender).map(([gender, count]) => ({ gender, count })),
      avgAge,
      byStage,
      withBuddyAccount,
      invitesSent,
      avgWeightLoss,
    };
  }),

  // ─── SEND QUESTIONNAIRE ────────────────────────────────────────────────────
  sendQuestionnaire: protectedProcedure
    .input(z.object({
      questionnaireId: z.number(),
      patientId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [q] = await getDb().select().from(offlineQuestionnaires)
        .where(and(eq(offlineQuestionnaires.id, input.questionnaireId), eq(offlineQuestionnaires.expertUserId, ctx.user.id)));
      if (!q) throw new TRPCError({ code: "NOT_FOUND" });
      const [patient] = await getDb().select().from(offlinePatients)
        .where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      const newCount = (q.sentCount ?? 0) + 1;
      await getDb().update(offlineQuestionnaires)
        .set({ sentCount: newCount })
        .where(eq(offlineQuestionnaires.id, q.id));
      return { success: true };
    }),

  // ─── AI SESSION SUMMARY ────────────────────────────────────────────────────
  generateSessionSummary: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      rawNotes: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [patient] = await getDb().select().from(offlinePatients)
        .where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Eres un asistente para nutricionistas y dietistas. Tu tarea es estructurar las notas de una sesión clínica en un formato profesional conciso. Responde en español.`,
          },
          {
            role: "user",
            content: `Paciente: ${patient.name}\nNotas de sesión:\n${input.rawNotes}\n\nGenera un resumen estructurado con: 1) Motivo de consulta, 2) Evolución desde última sesión, 3) Acuerdos y objetivos, 4) Próximos pasos. Sé conciso y profesional.`,
          },
        ],
      });
      const summary = response.choices[0]?.message?.content ?? "";
      return { summary };
    }),
});
