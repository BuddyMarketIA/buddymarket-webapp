import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  patientDocuments,
  expertPatients,
  patientClinicalMetrics,
  patientDailyDiary,
  patientProgress,
  buddyExperts,
} from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { storagePut } from "../storage";

export const expertDocumentsRouter = router({
  // ─── Upload document (expert or patient) ────────────────────────────────
  uploadDocument: protectedProcedure
    .input(
      z.object({
        expertPatientId: z.number(),
        title: z.string().min(1).max(256),
        description: z.string().max(1000).optional(),
        documentType: z.enum([
          "nutrition_plan",
          "blood_test",
          "medical_report",
          "scale_export",
          "progress_photo",
          "consent_form",
          "other",
        ]),
        visibility: z.enum(["expert_only", "shared"]).default("shared"),
        // Base64 encoded file
        fileBase64: z.string(),
        fileName: z.string().max(256),
        mimeType: z.string().max(128),
        fileSize: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Get the relation to verify access
      const rel = await db
        .select()
        .from(expertPatients)
        .where(eq(expertPatients.id, input.expertPatientId))
        .limit(1);

      if (!rel.length) throw new Error("Relación no encontrada");

      const relation = rel[0];
      const isExpert =
        ctx.user.id === relation.expertId ||
        (await db
          .select()
          .from(buddyExperts)
          .where(eq(buddyExperts.userId, ctx.user.id))
          .limit(1)
          .then((r) => r.length > 0 && r[0].id === relation.expertId));
      const isPatient = ctx.user.id === relation.patientUserId;

      if (!isExpert && !isPatient) throw new Error("Sin acceso");

      // Upload to S3
      const buffer = Buffer.from(input.fileBase64, "base64");
      const suffix = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      const fileKey = `patient-docs/${relation.expertId}/${relation.patientUserId}/${suffix}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      const [doc] = await db
        .insert(patientDocuments)
        .values({
          expertPatientId: input.expertPatientId,
          expertId: relation.expertId,
          patientUserId: relation.patientUserId,
          uploadedBy: ctx.user.id,
          uploaderRole: isExpert ? "expert" : "patient",
          title: input.title,
          description: input.description ?? null,
          fileUrl: url,
          fileKey,
          fileName: input.fileName,
          fileSize: input.fileSize ?? null,
          mimeType: input.mimeType,
          documentType: input.documentType,
          visibility: input.visibility,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return doc;
    }),

  // ─── List documents for a patient relation ──────────────────────────────
  getDocuments: protectedProcedure
    .input(
      z.object({
        expertPatientId: z.number(),
        documentType: z
          .enum([
            "nutrition_plan",
            "blood_test",
            "medical_report",
            "scale_export",
            "progress_photo",
            "consent_form",
            "other",
            "all",
          ])
          .optional()
          .default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const rel = await db
        .select()
        .from(expertPatients)
        .where(eq(expertPatients.id, input.expertPatientId))
        .limit(1);

      if (!rel.length) throw new Error("Relación no encontrada");
      const relation = rel[0];

      const isExpert = await db
        .select()
        .from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id))
        .limit(1)
        .then((r) => r.length > 0 && r[0].id === relation.expertId);
      const isPatient = ctx.user.id === relation.patientUserId;

      if (!isExpert && !isPatient) throw new Error("Sin acceso");

      const conditions = [eq(patientDocuments.expertPatientId, input.expertPatientId)];

      // Patients only see shared documents
      if (isPatient && !isExpert) {
        conditions.push(eq(patientDocuments.visibility, "shared"));
      }

      if (input.documentType !== "all") {
        conditions.push(eq(patientDocuments.documentType, input.documentType));
      }

      const docs = await db
        .select()
        .from(patientDocuments)
        .where(and(...conditions))
        .orderBy(desc(patientDocuments.createdAt));

      return docs;
    }),

  // ─── Delete document ─────────────────────────────────────────────────────
  deleteDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const doc = await db
        .select()
        .from(patientDocuments)
        .where(eq(patientDocuments.id, input.documentId))
        .limit(1);

      if (!doc.length) throw new Error("Documento no encontrado");

      // Only uploader or expert can delete
      if (doc[0].uploadedBy !== ctx.user.id) {
        const expertRecord = await db
          .select()
          .from(buddyExperts)
          .where(eq(buddyExperts.userId, ctx.user.id))
          .limit(1);
        if (!expertRecord.length || expertRecord[0].id !== doc[0].expertId) {
          throw new Error("Sin permiso para eliminar");
        }
      }

      await db
        .delete(patientDocuments)
        .where(eq(patientDocuments.id, input.documentId));

      return { success: true };
    }),

  // ─── Update document visibility ──────────────────────────────────────────
  updateVisibility: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        visibility: z.enum(["expert_only", "shared"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const doc = await db
        .select()
        .from(patientDocuments)
        .where(eq(patientDocuments.id, input.documentId))
        .limit(1);

      if (!doc.length) throw new Error("Documento no encontrado");

      // Only expert can change visibility
      const expertRecord = await db
        .select()
        .from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id))
        .limit(1);
      if (!expertRecord.length || expertRecord[0].id !== doc[0].expertId) {
        throw new Error("Solo el expert puede cambiar la visibilidad");
      }

      await db
        .update(patientDocuments)
        .set({ visibility: input.visibility, updatedAt: new Date() })
        .where(eq(patientDocuments.id, input.documentId));

      return { success: true };
    }),

  // ─── Add clinical metrics ────────────────────────────────────────────────
  addClinicalMetrics: protectedProcedure
    .input(
      z.object({
        expertPatientId: z.number(),
        recordedAt: z.string().optional(),
        bloodPressureSystolic: z.number().min(60).max(300).optional(),
        bloodPressureDiastolic: z.number().min(40).max(200).optional(),
        heartRate: z.number().min(30).max(250).optional(),
        glucoseFasting: z.number().min(40).max(600).optional(),
        hba1c: z.number().min(3).max(20).optional(),
        totalCholesterol: z.number().min(50).max(600).optional(),
        ldlCholesterol: z.number().min(20).max(500).optional(),
        hdlCholesterol: z.number().min(10).max(200).optional(),
        triglycerides: z.number().min(20).max(2000).optional(),
        boneMass: z.number().min(0.5).max(10).optional(),
        waterPercentage: z.number().min(10).max(80).optional(),
        visceralFat: z.number().min(1).max(59).optional(),
        metabolicAge: z.number().min(10).max(100).optional(),
        calf: z.number().min(10).max(100).optional(),
        neck: z.number().min(20).max(80).optional(),
        shoulder: z.number().min(50).max(200).optional(),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const rel = await db
        .select()
        .from(expertPatients)
        .where(eq(expertPatients.id, input.expertPatientId))
        .limit(1);
      if (!rel.length) throw new Error("Relación no encontrada");

      const [metric] = await db
        .insert(patientClinicalMetrics)
        .values({
          expertPatientId: input.expertPatientId,
          patientUserId: rel[0].patientUserId,
          recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
          bloodPressureSystolic: input.bloodPressureSystolic ?? null,
          bloodPressureDiastolic: input.bloodPressureDiastolic ?? null,
          heartRate: input.heartRate ?? null,
          glucoseFasting: input.glucoseFasting ?? null,
          hba1c: input.hba1c ?? null,
          totalCholesterol: input.totalCholesterol ?? null,
          ldlCholesterol: input.ldlCholesterol ?? null,
          hdlCholesterol: input.hdlCholesterol ?? null,
          triglycerides: input.triglycerides ?? null,
          boneMass: input.boneMass ?? null,
          waterPercentage: input.waterPercentage ?? null,
          visceralFat: input.visceralFat ?? null,
          metabolicAge: input.metabolicAge ?? null,
          calf: input.calf ?? null,
          neck: input.neck ?? null,
          shoulder: input.shoulder ?? null,
          notes: input.notes ?? null,
          createdAt: new Date(),
        })
        .returning();

      return metric;
    }),

  // ─── Get clinical metrics history ────────────────────────────────────────
  getClinicalMetrics: protectedProcedure
    .input(z.object({ expertPatientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const metrics = await db
        .select()
        .from(patientClinicalMetrics)
        .where(eq(patientClinicalMetrics.expertPatientId, input.expertPatientId))
        .orderBy(asc(patientClinicalMetrics.recordedAt));

      return metrics;
    }),

  // ─── Add/update daily diary entry ────────────────────────────────────────
  saveDailyDiary: protectedProcedure
    .input(
      z.object({
        expertPatientId: z.number().optional(),
        diaryDate: z.string(), // YYYY-MM-DD
        weight: z.number().min(20).max(300).optional(),
        energyLevel: z.number().min(1).max(5).optional(),
        digestiveComfort: z.number().min(1).max(5).optional(),
        sleepQuality: z.number().min(1).max(5).optional(),
        moodLevel: z.number().min(1).max(5).optional(),
        stressLevel: z.number().min(1).max(5).optional(),
        planAdherence: z.enum(["full", "partial", "no"]).optional(),
        activityType: z.string().max(64).optional(),
        activityDuration: z.number().min(0).max(600).optional(),
        activityIntensity: z.enum(["low", "medium", "high"]).optional(),
        sleepHours: z.number().min(0).max(24).optional(),
        symptoms: z.string().max(1000).optional(),
        generalNotes: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Check if entry exists for this date
      const existing = await db
        .select()
        .from(patientDailyDiary)
        .where(
          and(
            eq(patientDailyDiary.userId, ctx.user.id),
            eq(patientDailyDiary.diaryDate, input.diaryDate)
          )
        )
        .limit(1);

      const values = {
        userId: ctx.user.id,
        expertPatientId: input.expertPatientId ?? null,
        diaryDate: input.diaryDate,
        weight: input.weight ?? null,
        energyLevel: input.energyLevel ?? null,
        digestiveComfort: input.digestiveComfort ?? null,
        sleepQuality: input.sleepQuality ?? null,
        moodLevel: input.moodLevel ?? null,
        stressLevel: input.stressLevel ?? null,
        planAdherence: input.planAdherence ?? null,
        activityType: input.activityType ?? null,
        activityDuration: input.activityDuration ?? null,
        activityIntensity: input.activityIntensity ?? null,
        sleepHours: input.sleepHours ?? null,
        symptoms: input.symptoms ?? null,
        generalNotes: input.generalNotes ?? null,
        updatedAt: new Date(),
      };

      if (existing.length) {
        const [updated] = await db
          .update(patientDailyDiary)
          .set(values)
          .where(eq(patientDailyDiary.id, existing[0].id))
          .returning();
        return updated;
      } else {
        const [created] = await db
          .insert(patientDailyDiary)
          .values({ ...values, createdAt: new Date() })
          .returning();
        return created;
      }
    }),

  // ─── Get daily diary entries ──────────────────────────────────────────────
  getDailyDiary: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(), // expert viewing patient's diary
        limit: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const targetUserId = input.userId ?? ctx.user.id;

      const entries = await db
        .select()
        .from(patientDailyDiary)
        .where(eq(patientDailyDiary.userId, targetUserId))
        .orderBy(desc(patientDailyDiary.diaryDate))
        .limit(input.limit);

      return entries;
    }),

  // ─── Expert adds feedback to diary entry ─────────────────────────────────
  addDiaryFeedback: protectedProcedure
    .input(
      z.object({
        diaryId: z.number(),
        feedback: z.string().max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const [updated] = await db
        .update(patientDailyDiary)
        .set({
          expertFeedback: input.feedback,
          expertFeedbackAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(patientDailyDiary.id, input.diaryId))
        .returning();

      return updated;
    }),

  // ─── Get full progress history (weight + body composition + clinical) ────
  getFullProgressHistory: protectedProcedure
    .input(z.object({ expertPatientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const [progress, clinical] = await Promise.all([
        db
          .select()
          .from(patientProgress)
          .where(eq(patientProgress.expertPatientId, input.expertPatientId))
          .orderBy(asc(patientProgress.recordedAt)),
        db
          .select()
          .from(patientClinicalMetrics)
          .where(eq(patientClinicalMetrics.expertPatientId, input.expertPatientId))
          .orderBy(asc(patientClinicalMetrics.recordedAt)),
      ]);

      return { progress, clinical };
    }),
});
