import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  offlinePatients,
  patientWeightHistory,
  patientPlansSent,
  offlinePatientPrivacy,
  offlinePatientLabels,
  offlinePatientLabelAssignments,
} from "../../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import crypto from "crypto";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { generatePatientReportPdf } from "../patientReportPdf";
import { storagePut } from "../storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function requireExpert(ctx: any) {
  const u = ctx.user;
  const isExpert =
    u.role === "buddyexpert" ||
    u.accountType === "buddyexpert" ||
    (u.secondaryRoles ?? []).includes("buddyexpert");
  if (!isExpert) throw new TRPCError({ code: "FORBIDDEN", message: "Solo nutricionistas pueden acceder a esta función" });
  return u;
}

// Build a plain-text weekly menu from menuData JSON for WhatsApp / email body
function buildMenuText(menuData: any, patientName: string, weekLabel: string): string {
  const days = menuData?.days ?? menuData?.menu ?? [];
  const lines: string[] = [
    `🥗 PLAN NUTRICIONAL — ${patientName}`,
    `📅 Semana: ${weekLabel}`,
    "",
  ];
  for (const day of days) {
    lines.push(`━━ ${day.day ?? day.name ?? ""} ━━`);
    for (const meal of day.meals ?? []) {
      const food = typeof meal.food === "string" ? meal.food : (meal.food ?? []).join(", ");
      if (food) lines.push(`  • ${meal.name}: ${food}`);
    }
    lines.push("");
  }
  lines.push("─────────────────────────────");
  lines.push("Generado con BuddyOne · buddyone.app");
  return lines.join("\n");
}

// Build HTML email for the patient plan
function buildMenuHtml(menuData: any, patientName: string, weekLabel: string, weightHistory: any[]): string {
  const days = menuData?.days ?? menuData?.menu ?? [];

  // Weight evolution table
  let weightSection = "";
  if (weightHistory.length > 0) {
    const rows = weightHistory
      .slice(-6)
      .map((w) => {
        const date = new Date(w.recordedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
        return `<tr><td style="padding:6px 12px;border-bottom:1px solid #f3f4f6">${date}</td><td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-weight:700">${w.weightKg} kg</td>${w.bodyFatPct ? `<td style="padding:6px 12px;border-bottom:1px solid #f3f4f6">${w.bodyFatPct}%</td>` : "<td></td>"}</tr>`;
      })
      .join("");
    weightSection = `
      <h2 style="color:#1B2B4B;font-size:16px;margin:24px 0 8px">📊 Tu evolución de peso</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#374151">
        <thead><tr style="background:#f9fafb"><th style="padding:8px 12px;text-align:left">Fecha</th><th style="padding:8px 12px;text-align:left">Peso</th><th style="padding:8px 12px;text-align:left">% Grasa</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  // Menu days
  const daysHtml = days
    .map((day: any) => {
      const meals = (day.meals ?? [])
        .filter((m: any) => m.food)
        .map((m: any) => {
          const food = typeof m.food === "string" ? m.food : (m.food ?? []).join(", ");
          return `<tr><td style="padding:5px 10px;color:#6b7280;font-size:12px;width:110px">${m.name}</td><td style="padding:5px 10px;font-size:13px">${food}</td></tr>`;
        })
        .join("");
      if (!meals) return "";
      return `
        <div style="margin-bottom:16px">
          <div style="background:#F97316;color:#fff;font-weight:700;font-size:13px;padding:6px 12px;border-radius:8px 8px 0 0">${day.day ?? day.name}</div>
          <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #f3f4f6;border-top:none;border-radius:0 0 8px 8px">${meals}</table>
        </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">
    <div style="background:linear-gradient(135deg,#F97316,#FB923C);border-radius:16px;padding:24px;margin-bottom:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">🥗 Tu Plan Nutricional</h1>
      <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:14px">Semana: ${weekLabel}</p>
    </div>
    <div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
      <p style="margin:0 0 4px;font-size:14px;color:#6b7280">Hola,</p>
      <h2 style="margin:0 0 16px;color:#1B2B4B;font-size:18px">${patientName}</h2>
      <p style="color:#374151;font-size:14px;margin:0 0 20px">Tu nutricionista ha preparado el siguiente plan para esta semana. Recuerda hidratarte bien y consultar cualquier duda en tu próxima cita.</p>
      ${weightSection}
      <h2 style="color:#1B2B4B;font-size:16px;margin:24px 0 12px">📅 Menú semanal</h2>
      ${daysHtml}
    </div>
    <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">Generado con <strong>BuddyOne</strong> · buddyone.app · Este plan es orientativo y no sustituye el consejo médico profesional.</p>
  </div>
</body>
</html>`;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const offlinePatientsRouter = router({
  // List all patients for the expert
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      const db = getDb();
      const { ilike, or } = await import('drizzle-orm');
      let query = db
        .select()
        .from(offlinePatients)
        .where(and(
          eq(offlinePatients.expertUserId, ctx.user.id),
          eq(offlinePatients.isActive, true),
          input?.search ? or(
            ilike(offlinePatients.name, `%${input.search}%`),
            ilike(offlinePatients.email, `%${input.search}%`)
          ) : undefined
        ))
        .orderBy(desc(offlinePatients.createdAt));
      const patients = await query;
      // Get latest weight for each patient
      const patientIds = patients.map(p => p.id);
      const { inArray, max } = await import('drizzle-orm');
      const latestWeights = await db
        .select({ patientId: patientWeightHistory.patientId, weight: max(patientWeightHistory.weightKg) })
        .from(patientWeightHistory)
        .where(inArray(patientWeightHistory.patientId, patientIds))
        .groupBy(patientWeightHistory.patientId);
      const weightMap = new Map(latestWeights.map(w => [w.patientId, w.weight]));
      // Get labels for each patient
      const labelAssignments = patientIds.length > 0 ? await db
        .select({
          patientId: offlinePatientLabelAssignments.patientId,
          labelId: offlinePatientLabels.id,
          labelName: offlinePatientLabels.name,
          labelColor: offlinePatientLabels.color,
        })
        .from(offlinePatientLabelAssignments)
        .innerJoin(offlinePatientLabels, eq(offlinePatientLabelAssignments.labelId, offlinePatientLabels.id))
        .where(inArray(offlinePatientLabelAssignments.patientId, patientIds)) : [];
      const labelsMap = new Map<number, Array<{ id: number; name: string; color: string }>>();
      for (const a of labelAssignments) {
        if (!labelsMap.has(a.patientId)) labelsMap.set(a.patientId, []);
        labelsMap.get(a.patientId)!.push({ id: a.labelId, name: a.labelName, color: a.labelColor });
      }
      return patients.map(p => ({ ...p, lastWeight: weightMap.get(p.id) ?? p.initialWeightKg, labels: labelsMap.get(p.id) ?? [] }));
    }),

  // Get single patient
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [patient] = await getDb()
        .select()
        .from(offlinePatients)
        .where(and(eq(offlinePatients.id, input.id), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      return patient;
    }),

  // Create single patient
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      birthDate: z.string().optional(),
      gender: z.string().optional(),
      heightCm: z.number().optional(),
      initialWeightKg: z.number().optional(),
      targetWeightKg: z.number().optional(),
      activityLevel: z.string().optional(),
      objective: z.string().optional(),
      allergies: z.string().optional(),
      pathologies: z.string().optional(),
      medications: z.string().optional(),
      notes: z.string().optional(),
      consultationFrequencyWeeks: z.number().default(2),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [created] = await getDb().insert(offlinePatients).values({
        ...input,
        birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
        expertUserId: ctx.user.id,
      }).returning();
      return created;
    }),

  // Update patient
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      birthDate: z.string().optional(),
      gender: z.string().optional(),
      heightCm: z.number().optional(),
      initialWeightKg: z.number().optional(),
      targetWeightKg: z.number().optional(),
      activityLevel: z.string().optional(),
      objective: z.string().optional(),
      allergies: z.string().optional(),
      pathologies: z.string().optional(),
      medications: z.string().optional(),
      notes: z.string().optional(),
      consultationFrequencyWeeks: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const { id, ...data } = input;
      const [updated] = await db
        .update(offlinePatients)
        .set({ ...data, birthDate: data.birthDate ? new Date(data.birthDate) : undefined, updatedAt: new Date() })
        .where(and(eq(offlinePatients.id, id), eq(offlinePatients.expertUserId, ctx.user.id)))
        .returning();
      return updated;
    }),

  // Soft-delete patient
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      await db
        .update(offlinePatients)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(offlinePatients.id, input.id), eq(offlinePatients.expertUserId, ctx.user.id)));
      return { success: true };
    }),

  // Bulk import from parsed CSV/Excel data
  bulkImport: protectedProcedure
    .input(z.object({
      patients: z.array(z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        birthDate: z.string().optional(),
        gender: z.string().optional(),
        heightCm: z.number().optional(),
        initialWeightKg: z.number().optional(),
        targetWeightKg: z.number().optional(),
        activityLevel: z.string().optional(),
        objective: z.string().optional(),
        allergies: z.string().optional(),
        pathologies: z.string().optional(),
        medications: z.string().optional(),
        notes: z.string().optional(),
        consultationFrequencyWeeks: z.number().optional(),
      })).min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const rows = input.patients.map((p) => ({
        ...p,
        email: p.email || undefined,
        birthDate: p.birthDate ? new Date(p.birthDate) : undefined,
        expertUserId: ctx.user.id,
        isActive: true,
      }));
      const created = await getDb().insert(offlinePatients).values(rows).returning();
      return { imported: created.length, patients: created };
    }),

  // AI-powered field mapping: given raw CSV headers + sample row, return column mapping
  suggestColumnMapping: protectedProcedure
    .input(z.object({
      headers: z.array(z.string()),
      sampleRow: z.record(z.string(), z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Eres un asistente que mapea columnas de CSV de pacientes de nutricionistas a campos estándar.
Campos estándar disponibles: name, email, phone, birthDate (YYYY-MM-DD), gender (male/female/other), heightCm (número), initialWeightKg (número), targetWeightKg (número), activityLevel (sedentary/light/moderate/active/very_active), objective (texto), allergies (texto), pathologies (texto), medications (texto), notes (texto), consultationFrequencyWeeks (número).
Devuelve SOLO un JSON con el mapping: { "columna_csv": "campo_estandar" }. Si una columna no corresponde a ningún campo, omítela.`,
          },
          {
            role: "user",
            content: `Cabeceras CSV: ${input.headers.join(", ")}\nFila de ejemplo: ${JSON.stringify(input.sampleRow)}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "column_mapping",
            strict: true,
            schema: {
              type: "object",
              properties: {
                mapping: {
                  type: "object",
                  description: "Mapping from CSV column name to standard field name",
                  additionalProperties: { type: "string" },
                },
              },
              required: ["mapping"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);
      return parsed.mapping ?? {};
    }),

  // ─── Weight History ────────────────────────────────────────────────────────
  getWeightHistory: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      return getDb()
        .select()
        .from(patientWeightHistory)
        .where(and(eq(patientWeightHistory.patientId, input.patientId), eq(patientWeightHistory.expertUserId, ctx.user.id)))
        .orderBy(patientWeightHistory.recordedAt);
    }),

  addWeightRecord: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      weightKg: z.number(),
      bodyFatPct: z.number().optional(),
      muscleMassPct: z.number().optional(),
      waistCm: z.number().optional(),
      hipCm: z.number().optional(),
      notes: z.string().optional(),
      recordedAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      // Verify patient belongs to expert
      const [patient] = await getDb().select().from(offlinePatients).where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      const [record] = await getDb().insert(patientWeightHistory).values({
        patientId: input.patientId,
        expertUserId: ctx.user.id,
        weightKg: input.weightKg,
        bodyFatPct: input.bodyFatPct,
        muscleMassPct: input.muscleMassPct,
        waistCm: input.waistCm,
        hipCm: input.hipCm,
        notes: input.notes,
        recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
      }).returning();
      return record;
    }),

  deleteWeightRecord: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      await getDb().delete(patientWeightHistory).where(and(eq(patientWeightHistory.id, input.id), eq(patientWeightHistory.expertUserId, ctx.user.id)));
      return { success: true };
    }),

  // ─── Generate AI menu for offline patient ─────────────────────────────────
  generatePatientMenu: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      durationWeeks: z.number().min(1).max(2).default(1),
      extraInstructions: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [patient] = await getDb().select().from(offlinePatients).where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      const weightRecords = await getDb().select().from(patientWeightHistory).where(eq(patientWeightHistory.patientId, input.patientId)).orderBy(desc(patientWeightHistory.recordedAt)).limit(3);
      const currentWeight = weightRecords[0]?.weightKg ?? patient.initialWeightKg;

      const systemPrompt = `Eres un nutricionista experto. Genera un menú semanal completo y personalizado en JSON.
Estructura: { "days": [ { "day": "Lunes", "meals": [ { "name": "Desayuno", "food": "descripción" }, ... ] }, ... ] }
Incluye: Desayuno, Media mañana, Comida, Merienda, Cena para cada día.
Responde SOLO con el JSON, sin texto adicional.`;

      const userPrompt = `Paciente: ${patient.name}
Objetivo: ${patient.objective ?? "dieta equilibrada"}
Peso actual: ${currentWeight ? currentWeight + " kg" : "no especificado"}
Peso objetivo: ${patient.targetWeightKg ? patient.targetWeightKg + " kg" : "no especificado"}
Altura: ${patient.heightCm ? patient.heightCm + " cm" : "no especificada"}
Alergias: ${patient.allergies ?? "ninguna"}
Patologías: ${patient.pathologies ?? "ninguna"}
Medicación: ${patient.medications ?? "ninguna"}
Nivel de actividad: ${patient.activityLevel ?? "moderado"}
${input.extraInstructions ? "Instrucciones adicionales: " + input.extraInstructions : ""}
Duración: ${input.durationWeeks} semana(s)`;

      const response = await invokeLLM({ messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] });
      const content = response.choices[0]?.message?.content ?? "{}";
      let menuData: any;
      try {
        menuData = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        menuData = jsonMatch ? JSON.parse(jsonMatch[0]) : { days: [] };
      }
      return { menuData, patientName: patient.name };
    }),

  // ─── Generate PDF report and upload to S3 ─────────────────────────────────
  generatePdfReport: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      menuData: z.any(),
      weekStartDate: z.string(),
      weekEndDate: z.string(),
      customMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [patient] = await getDb().select().from(offlinePatients).where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      const weightHistory = await getDb().select().from(patientWeightHistory)
        .where(and(eq(patientWeightHistory.patientId, input.patientId), eq(patientWeightHistory.expertUserId, ctx.user.id)))
        .orderBy(patientWeightHistory.recordedAt);

      const weekLabel = `${new Date(input.weekStartDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })} – ${new Date(input.weekEndDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`;

      const pdfBuffer = await generatePatientReportPdf({
        patient: {
          name: patient.name,
          email: patient.email,
          heightCm: patient.heightCm,
          initialWeightKg: patient.initialWeightKg,
          targetWeightKg: patient.targetWeightKg,
          objective: patient.objective,
          allergies: patient.allergies,
          pathologies: patient.pathologies,
          consultationFrequencyWeeks: patient.consultationFrequencyWeeks,
        },
        weightHistory: weightHistory.map(w => ({ recordedAt: w.recordedAt, weightKg: w.weightKg, notes: w.notes })),
        menuData: input.menuData,
        weekLabel,
        expertName: ctx.user.name ?? undefined,
        customMessage: input.customMessage,
      });

      const suffix = Date.now();
      const fileKey = `expert-${ctx.user.id}/patient-reports/${input.patientId}-${suffix}.pdf`;
      const { url: pdfUrl } = await storagePut(fileKey, pdfBuffer, "application/pdf");

      return { pdfUrl, weekLabel };
    }),

  // ─── Send plan PDF by email ──────────────────────────────────────────────────
  sendPlanByEmail: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      menuData: z.any(),
      weekStartDate: z.string(),
      weekEndDate: z.string(),
      customMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [patient] = await getDb().select().from(offlinePatients).where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      if (!patient.email) throw new TRPCError({ code: "BAD_REQUEST", message: "El paciente no tiene email registrado" });

      const weightHistory = await getDb().select().from(patientWeightHistory)
        .where(and(eq(patientWeightHistory.patientId, input.patientId), eq(patientWeightHistory.expertUserId, ctx.user.id)))
        .orderBy(patientWeightHistory.recordedAt);

      const weekLabel = `${new Date(input.weekStartDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })} – ${new Date(input.weekEndDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`;

      // Generate PDF with Puppeteer
      const pdfBuffer = await generatePatientReportPdf({
        patient: {
          name: patient.name,
          email: patient.email,
          heightCm: patient.heightCm,
          initialWeightKg: patient.initialWeightKg,
          targetWeightKg: patient.targetWeightKg,
          objective: patient.objective,
          allergies: patient.allergies,
          pathologies: patient.pathologies,
          consultationFrequencyWeeks: patient.consultationFrequencyWeeks,
        },
        weightHistory: weightHistory.map(w => ({ recordedAt: w.recordedAt, weightKg: w.weightKg, notes: w.notes })),
        menuData: input.menuData,
        weekLabel,
        expertName: ctx.user.name ?? undefined,
        customMessage: input.customMessage,
      });

      // Upload to S3
      const suffix = Date.now();
      const fileKey = `expert-${ctx.user.id}/patient-reports/${input.patientId}-${suffix}.pdf`;
      const { url: pdfUrl } = await storagePut(fileKey, pdfBuffer, "application/pdf");

      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Email no configurado" });

      const resend = new Resend(resendKey);
      const dateLabel = new Date(input.weekStartDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
      await resend.emails.send({
        from: "Luis de BuddyOne <luis@buddyone.io>",
        to: patient.email,
        subject: `Tu informe nutricional — semana del ${dateLabel}`,
        html: `<!DOCTYPE html><html lang="es"><body style="font-family:system-ui,sans-serif;background:#f9fafb;padding:24px">
          <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <h1 style="color:#F97316;margin:0 0 8px">🥗 BuddyOne</h1>
            <h2 style="color:#1B2B4B;margin:0 0 16px">Hola ${patient.name},</h2>
            <p style="color:#374151">Tu nutricionista ha preparado tu informe nutricional para la semana del <strong>${dateLabel}</strong>.</p>
            <p style="color:#374151;margin-top:12px">El informe incluye tu <strong>evolución de peso</strong> y tu <strong>plan de alimentación semanal</strong>.</p>
            ${input.customMessage ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0"><strong>Mensaje de tu nutricionista:</strong><br>${input.customMessage}</div>` : ""}
            <a href="${pdfUrl}" style="display:inline-block;margin:20px 0;background:#F97316;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700">📄 Descargar informe PDF</a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">Generado con <strong>BuddyOne</strong> · buddyone.app</p>
          </div>
        </body></html>`,
      });

      // Log the send
      await getDb().insert(patientPlansSent).values({
        patientId: input.patientId,
        expertUserId: ctx.user.id,
        channel: "email",
        subject: `Informe PDF semana ${weekLabel}`,
        menuData: JSON.stringify(input.menuData),
        weekStartDate: new Date(input.weekStartDate),
        weekEndDate: new Date(input.weekEndDate),
      });

      return { success: true, pdfUrl };
    }),

  // ─── Get WhatsApp message (returns text, user sends manually) ─────────────
  getWhatsAppMessage: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      menuData: z.any(),
      weekStartDate: z.string(),
      weekEndDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [patient] = await getDb().select().from(offlinePatients).where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      const weekLabel = `${new Date(input.weekStartDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })} – ${new Date(input.weekEndDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`;
      const text = buildMenuText(input.menuData, patient.name, weekLabel);

      // Log the send
      await getDb().insert(patientPlansSent).values({
        patientId: input.patientId,
        expertUserId: ctx.user.id,
        channel: "whatsapp",
        subject: `Plan semana ${weekLabel}`,
        menuData: JSON.stringify(input.menuData),
        weekStartDate: new Date(input.weekStartDate),
        weekEndDate: new Date(input.weekEndDate),
      });

      const phone = patient.phone?.replace(/\D/g, "");
      const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : null;
      return { text, waUrl, phone: patient.phone };
    }),

  // ─── Send invite to register in BuddyOne (with secure token) ────────────────
  sendInvite: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const [patient] = await getDb().select().from(offlinePatients).where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      if (!patient.email) throw new TRPCError({ code: "BAD_REQUEST", message: "El paciente no tiene email registrado" });

      // Generate secure token (valid for 30 days)
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const expertName = ctx.user.name ?? "Tu nutricionista";
      const acceptUrl = `${input.origin}/patient-invite/${token}`;

      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Email no configurado" });

      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Luis de BuddyOne <luis@buddyone.io>",
        to: patient.email,
        subject: `${expertName} te invita a unirte a BuddyOne`,
        html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif">
          <div style="max-width:520px;margin:0 auto;padding:32px 16px">
            <div style="background:linear-gradient(135deg,#F97316,#FB923C);border-radius:16px;padding:24px;margin-bottom:24px;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:22px">🥗 BuddyOne</h1>
              <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:14px">Nutrición inteligente</p>
            </div>
            <div style="background:#fff;border-radius:16px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
              <h2 style="color:#1B2B4B;margin:0 0 12px;font-size:20px">Hola ${patient.name} 👋</h2>
              <p style="color:#374151;line-height:1.6"><strong>${expertName}</strong> te ha invitado a unirte a <strong>BuddyOne</strong>, la plataforma de nutrición inteligente donde podrás:</p>
              <ul style="color:#374151;line-height:2;padding-left:20px">
                <li>📅 Ver tus menús y planes nutricionales</li>
                <li>📊 Seguir tu evolución de peso y medidas</li>
                <li>💬 Comunicarte directamente con tu nutricionista</li>
                <li>🎯 Registrar tu diario de alimentación</li>
              </ul>
              <div style="text-align:center;margin:24px 0">
                <a href="${acceptUrl}" style="display:inline-block;background:linear-gradient(135deg,#F97316,#ef4444);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(249,115,22,0.4)">✨ Crear mi cuenta gratis</a>
              </div>
              <p style="color:#6b7280;font-size:13px;text-align:center">Este enlace es válido durante 30 días. Si no esperabas este mensaje, puedes ignorarlo.</p>
            </div>
            <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">BuddyOne · buddyone.io</p>
          </div>
        </body></html>`,
      });

      await getDb().update(offlinePatients).set({
        inviteSentAt: new Date(),
        inviteToken: token,
        inviteExpiresAt: expiresAt,
        updatedAt: new Date(),
      }).where(eq(offlinePatients.id, input.patientId));
      return { success: true, tokenGenerated: true };
    }),

  // ─── Get invite info by token (public — for the accept page) ─────────────
  getOfflineInviteInfo: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de datos no disponible" });
      const [patient] = await db
        .select()
        .from(offlinePatients)
        .where(eq(offlinePatients.inviteToken, input.token))
        .limit(1);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Invitación no válida o expirada" });
      if (patient.inviteExpiresAt && new Date() > patient.inviteExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta invitación ha expirado" });
      }
      // Get expert name
      const { users } = await import("../../drizzle/schema");
      const [expertUser] = await db.select({ name: users.name, imageUrl: users.imageUrl }).from(users).where(eq(users.id, patient.expertUserId)).limit(1);
      return {
        patientName: patient.name,
        expertName: expertUser?.name ?? "Tu nutricionista",
        expertImage: expertUser?.imageUrl ?? null,
        alreadyAccepted: !!patient.inviteAcceptedAt,
        token: input.token,
      };
    }),

  // ─── Accept offline invite (links BuddyOne account to offline patient) ────
  acceptOfflineInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [patient] = await getDb()
        .select()
        .from(offlinePatients)
        .where(eq(offlinePatients.inviteToken, input.token))
        .limit(1);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Invitación no válida" });
      if (patient.inviteExpiresAt && new Date() > patient.inviteExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta invitación ha expirado" });
      }
      if (patient.inviteAcceptedAt) {
        throw new TRPCError({ code: "CONFLICT", message: "Esta invitación ya fue aceptada" });
      }
      // Link the BuddyOne account to the offline patient record
      await getDb().update(offlinePatients).set({
        buddyUserId: ctx.user.id,
        inviteAcceptedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(offlinePatients.id, patient.id));
      // Get expert name for the success page
      const { users } = await import("../../drizzle/schema");
      const [expertUser] = await getDb().select({ name: users.name }).from(users).where(eq(users.id, patient.expertUserId)).limit(1);
      return { success: true, expertUserId: patient.expertUserId, patientId: patient.id, expertName: expertUser?.name ?? null, patientName: patient.name };
    }),

  // ─── Export all patients as CSV data ──────────────────────────────────────
  exportPatients: protectedProcedure
    .input(z.object({ includeWeightHistory: z.boolean().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      const patients = await getDb()
        .select()
        .from(offlinePatients)
        .where(and(
          eq(offlinePatients.expertUserId, ctx.user.id),
          eq(offlinePatients.isActive, true),
        ))
        .orderBy(offlinePatients.name);

      // Get weight history if requested
      let weightMap: Map<number, any[]> = new Map();
      if (input?.includeWeightHistory && patients.length > 0) {
        const patientIds = patients.map(p => p.id);
        const weights = await getDb()
          .select()
          .from(patientWeightHistory)
          .where(and(
            inArray(patientWeightHistory.patientId, patientIds),
            eq(patientWeightHistory.expertUserId, ctx.user.id),
          ))
          .orderBy(patientWeightHistory.recordedAt);
        for (const w of weights) {
          if (!weightMap.has(w.patientId)) weightMap.set(w.patientId, []);
          weightMap.get(w.patientId)!.push(w);
        }
      }

      // Build CSV
      const headers = [
        "ID", "Nombre", "Email", "Teléfono", "Fecha nacimiento", "Género",
        "Altura (cm)", "Peso inicial (kg)", "Peso objetivo (kg)", "Nivel actividad",
        "Objetivo", "Alergias", "Patologías", "Medicación", "Notas",
        "Frecuencia consulta (semanas)", "Invitación enviada", "Invitación aceptada",
        "Fecha creación",
      ];

      const escapeCSV = (val: any) => {
        if (val == null) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = patients.map(p => [
        p.id,
        p.name,
        p.email ?? "",
        p.phone ?? "",
        p.birthDate ? new Date(p.birthDate).toLocaleDateString("es-ES") : "",
        p.gender ?? "",
        p.heightCm ?? "",
        p.initialWeightKg ?? "",
        p.targetWeightKg ?? "",
        p.activityLevel ?? "",
        p.objective ?? "",
        p.allergies ?? "",
        p.pathologies ?? "",
        p.medications ?? "",
        p.notes ?? "",
        p.consultationFrequencyWeeks ?? "",
        p.inviteSentAt ? new Date(p.inviteSentAt).toLocaleDateString("es-ES") : "No",
        p.inviteAcceptedAt ? new Date(p.inviteAcceptedAt).toLocaleDateString("es-ES") : "No",
        new Date(p.createdAt).toLocaleDateString("es-ES"),
      ].map(escapeCSV).join(","));

      const csv = [headers.join(","), ...rows].join("\n");
      const totalPatients = patients.length;
      const withEmail = patients.filter(p => p.email).length;
      const withInvite = patients.filter(p => p.inviteSentAt).length;
      const accepted = patients.filter(p => p.inviteAcceptedAt).length;

      return {
        csv,
        stats: { total: totalPatients, withEmail, withInvite, accepted },
        filename: `pacientes_buddyone_${new Date().toISOString().split("T")[0]}.csv`,
      };
    }),

  // ─── Get privacy settings for a patient ──────────────────────────────────
  getPrivacySettings: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      // Verify patient belongs to expert
      const [patient] = await getDb().select().from(offlinePatients).where(and(eq(offlinePatients.id, input.patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      const [settings] = await getDb()
        .select()
        .from(offlinePatientPrivacy)
        .where(eq(offlinePatientPrivacy.offlinePatientId, input.patientId))
        .limit(1);

      // Return defaults if no settings exist yet
      if (!settings) {
        return {
          offlinePatientId: input.patientId,
          showWeight: true,
          showBodyFat: true,
          showMeasurements: true,
          showPathologies: false,
          showMedications: false,
          showExpertNotes: false,
          showSessionNotes: false,
          showInternalAssessment: false,
          showAssignedMenus: true,
          showPlanHistory: true,
          showAppointmentHistory: true,
        };
      }
      return settings;
    }),

  // ─── Update privacy settings for a patient ───────────────────────────────
  updatePrivacySettings: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      showWeight: z.boolean().optional(),
      showBodyFat: z.boolean().optional(),
      showMeasurements: z.boolean().optional(),
      showPathologies: z.boolean().optional(),
      showMedications: z.boolean().optional(),
      showExpertNotes: z.boolean().optional(),
      showSessionNotes: z.boolean().optional(),
      showInternalAssessment: z.boolean().optional(),
      showAssignedMenus: z.boolean().optional(),
      showPlanHistory: z.boolean().optional(),
      showAppointmentHistory: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const { patientId, ...settings } = input;
      // Verify patient belongs to expert
      const [patient] = await getDb().select().from(offlinePatients).where(and(eq(offlinePatients.id, patientId), eq(offlinePatients.expertUserId, ctx.user.id)));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      const [existing] = await getDb().select().from(offlinePatientPrivacy).where(eq(offlinePatientPrivacy.offlinePatientId, patientId)).limit(1);

      if (existing) {
        const [updated] = await getDb()
          .update(offlinePatientPrivacy)
          .set({ ...settings, updatedAt: new Date() })
          .where(eq(offlinePatientPrivacy.offlinePatientId, patientId))
          .returning();
        return updated;
      } else {
        const [created] = await getDb()
          .insert(offlinePatientPrivacy)
          .values({
            offlinePatientId: patientId,
            expertUserId: ctx.user.id,
            ...settings,
          })
          .returning();
        return created;
      }
    }),


  // ─── Bulk message (email) to multiple patients ────────────────────────────
  bulkSendMessage: protectedProcedure
    .input(z.object({
      patientIds: z.array(z.number()).min(1).max(200),
      subject: z.string().min(1).max(200),
      message: z.string().min(1).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Email no configurado" });
      // Get patients that belong to this expert and have email
      const { inArray: inArr } = await import('drizzle-orm');
      const patients = await getDb().select().from(offlinePatients).where(
        and(
          inArr(offlinePatients.id, input.patientIds),
          eq(offlinePatients.expertUserId, ctx.user.id),
          eq(offlinePatients.isActive, true),
        )
      );
      const withEmail = patients.filter(p => p.email);
      if (withEmail.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Ninguno de los pacientes seleccionados tiene email registrado" });
      const expertName = ctx.user.name ?? "Tu nutricionista";
      const resend = new Resend(resendKey);
      const results: { patientId: number; name: string; email: string; sent: boolean; error?: string }[] = [];
      for (const patient of withEmail) {
        try {
          await resend.emails.send({
            from: `${expertName} via BuddyOne <noreply@buddyone.io>`,
            to: patient.email!,
            subject: input.subject,
            html: `<!DOCTYPE html><html lang="es"><body style="font-family:system-ui,sans-serif;background:#f9fafb;padding:24px">
              <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
                <h1 style="color:#F97316;margin:0 0 8px">🥗 BuddyOne</h1>
                <h2 style="color:#1B2B4B;margin:0 0 16px">Hola ${patient.name},</h2>
                <div style="color:#374151;line-height:1.6;white-space:pre-wrap">${input.message.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
                <p style="color:#6b7280;font-size:13px;margin-top:24px;border-top:1px solid #f3f4f6;padding-top:16px">Enviado por <strong>${expertName}</strong> a través de BuddyOne · buddyone.app</p>
              </div>
            </body></html>`,
          });
          results.push({ patientId: patient.id, name: patient.name, email: patient.email!, sent: true });
        } catch (err: any) {
          results.push({ patientId: patient.id, name: patient.name, email: patient.email!, sent: false, error: err?.message });
        }
      }
      const sent = results.filter(r => r.sent).length;
      const failed = results.filter(r => !r.sent).length;
      return { sent, failed, results, skippedNoEmail: patients.length - withEmail.length };
    }),

  // ─── Bulk assign a nutritional plan (AI-generated menu) to multiple patients ─
  bulkAssignPlan: protectedProcedure
    .input(z.object({
      patientIds: z.array(z.number()).min(1).max(100),
      planTitle: z.string().min(1).max(200),
      planDescription: z.string().optional(),
      menuData: z.any(),
      weekStartDate: z.string(),
      weekEndDate: z.string(),
      sendByEmail: z.boolean().default(false),
      customMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireExpert(ctx);
      const { inArray: inArr } = await import('drizzle-orm');
      const patients = await getDb().select().from(offlinePatients).where(
        and(
          inArr(offlinePatients.id, input.patientIds),
          eq(offlinePatients.expertUserId, ctx.user.id),
          eq(offlinePatients.isActive, true),
        )
      );
      if (patients.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontraron pacientes" });
      const weekLabel = `${new Date(input.weekStartDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })} – ${new Date(input.weekEndDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`;
      const results: { patientId: number; name: string; assigned: boolean; emailSent?: boolean; error?: string }[] = [];
      const resendKey = process.env.RESEND_API_KEY;
      for (const patient of patients) {
        try {
          // Log the plan assignment
          await getDb().insert(patientPlansSent).values({
            patientId: patient.id,
            expertUserId: ctx.user.id,
            weekStartDate: new Date(input.weekStartDate),
            weekEndDate: new Date(input.weekEndDate),
            menuData: input.menuData,
            sentVia: input.sendByEmail && patient.email ? "email" : "manual",
            sentAt: new Date(),
          });
          let emailSent = false;
          // Optionally send by email
          if (input.sendByEmail && patient.email && resendKey) {
            try {
              const resend = new Resend(resendKey);
              const expertName = ctx.user.name ?? "Tu nutricionista";
              const dateLabel = new Date(input.weekStartDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
              await resend.emails.send({
                from: `${expertName} via BuddyOne <noreply@buddyone.io>`,
                to: patient.email,
                subject: `Tu plan nutricional — semana del ${dateLabel}`,
                html: buildMenuHtml(input.menuData, patient.name, weekLabel, []),
              });
              emailSent = true;
            } catch {}
          }
          results.push({ patientId: patient.id, name: patient.name, assigned: true, emailSent });
        } catch (err: any) {
          results.push({ patientId: patient.id, name: patient.name, assigned: false, error: err?.message });
        }
      }
      const assigned = results.filter(r => r.assigned).length;
      const emailsSent = results.filter(r => r.emailSent).length;
      return { assigned, emailsSent, results };
    }),
  // ─── Plans sent history ────────────────────────────────────────────────────
  getPlansSent: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireExpert(ctx);
      return getDb()
        .select()
        .from(patientPlansSent)
        .where(and(eq(patientPlansSent.patientId, input.patientId), eq(patientPlansSent.expertUserId, ctx.user.id)))
        .orderBy(desc(patientPlansSent.sentAt));
    }),
});
