// @ts-nocheck
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

// ─── Helper: get expert record for current user ─────────────────────────────
async function getExpertForUser(userId: number) {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return null;
  const { buddyExperts } = await import("../../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, userId)).limit(1);
  return expert ?? null;
}

export const expertEnhancedRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. AI PLAN GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  generateAIPlan: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      objective: z.string().min(10).max(2000),
      restrictions: z.string().max(1000).optional(),
      durationWeeks: z.number().min(1).max(12).default(1),
      mealsPerDay: z.number().min(3).max(6).default(5),
      calorieTarget: z.number().min(800).max(5000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const expert = await getExpertForUser(ctx.user.id);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN", message: "No eres un experto registrado" });

      // Get patient info
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients, users, userProfiles } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const [patientRel] = await drizzleDb.select()
        .from(expertPatients)
        .where(and(eq(expertPatients.id, input.patientId), eq(expertPatients.expertId, expert.id)))
        .limit(1);
      if (!patientRel) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente no encontrado" });

      const [patientUser] = await drizzleDb.select().from(users).where(eq(users.id, patientRel.patientUserId)).limit(1);
      const [profile] = await drizzleDb.select().from(userProfiles).where(eq(userProfiles.userId, patientRel.patientUserId)).limit(1);

      const { invokeLLM } = await import("../_core/llm");
      const mealLabels = ["Desayuno", "Media mañana", "Comida", "Merienda", "Cena", "Resopón"].slice(0, input.mealsPerDay);

      const prompt = `Eres un nutricionista profesional. Genera un menú semanal personalizado en formato JSON.

PACIENTE: ${patientUser?.name || "Paciente"}
OBJETIVO: ${input.objective}
${input.restrictions ? `RESTRICCIONES: ${input.restrictions}` : ""}
${input.calorieTarget ? `CALORÍAS OBJETIVO: ${input.calorieTarget} kcal/día` : ""}
${profile?.weight ? `PESO ACTUAL: ${profile.weight} kg` : ""}
${profile?.targetWeight ? `PESO OBJETIVO: ${profile.targetWeight} kg` : ""}
${profile?.mainGoal ? `META PRINCIPAL: ${profile.mainGoal}` : ""}
COMIDAS POR DÍA: ${input.mealsPerDay} (${mealLabels.join(", ")})

Genera un menú para 7 días (lunes a domingo) con ${input.mealsPerDay} comidas por día.
Para cada comida incluye: nombre del plato, ingredientes principales, calorías aproximadas.

Responde SOLO con JSON válido con esta estructura:
{
  "weeklyPlan": {
    "monday": { "breakfast": {"dish": "...", "ingredients": "...", "kcal": 350}, ... },
    ...
  },
  "dailyTotals": { "monday": 1800, ... },
  "notes": "Notas generales del plan"
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Eres un nutricionista profesional experto en planificación de menús. Responde siempre en JSON válido." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices?.[0]?.message?.content || "{}";
      let plan;
      try { plan = JSON.parse(content); } catch { plan = { raw: content }; }

      return { plan, patientName: patientUser?.name || "Paciente" };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. WEEKLY CHECK-INS
  // ═══════════════════════════════════════════════════════════════════════════
  submitCheckin: protectedProcedure
    .input(z.object({
      expertPatientId: z.number().optional(),
      weight: z.number().min(20).max(300).optional(),
      adherenceRating: z.number().min(1).max(10).optional(),
      hungerRating: z.number().min(1).max(10).optional(),
      energyRating: z.number().min(1).max(10).optional(),
      difficultyNotes: z.string().max(2000).optional(),
      generalNotes: z.string().max(2000).optional(),
      photoUrl: z.string().max(1024).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { weeklyCheckins } = await import("../../drizzle/schema");

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      const weekStartStr = weekStart.toISOString().split("T")[0];

      const [checkin] = await drizzleDb.insert(weeklyCheckins).values({
        userId: ctx.user.id,
        expertPatientId: input.expertPatientId ?? null,
        weekStart: weekStartStr,
        weight: input.weight ?? null,
        adherenceRating: input.adherenceRating ?? null,
        hungerRating: input.hungerRating ?? null,
        energyRating: input.energyRating ?? null,
        difficultyNotes: input.difficultyNotes ?? null,
        generalNotes: input.generalNotes ?? null,
        photoUrl: input.photoUrl ?? null,
      }).returning();

      return checkin;
    }),

  getCheckins: protectedProcedure
    .input(z.object({ expertPatientId: z.number().optional(), limit: z.number().max(52).default(12) }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { weeklyCheckins } = await import("../../drizzle/schema");
      const { eq, desc, and } = await import("drizzle-orm");

      const conditions = [eq(weeklyCheckins.userId, ctx.user.id)];
      if (input.expertPatientId) conditions.push(eq(weeklyCheckins.expertPatientId, input.expertPatientId));

      return drizzleDb.select().from(weeklyCheckins)
        .where(and(...conditions))
        .orderBy(desc(weeklyCheckins.createdAt))
        .limit(input.limit);
    }),

  getPatientCheckins: protectedProcedure
    .input(z.object({ expertPatientId: z.number(), limit: z.number().max(52).default(12) }))
    .query(async ({ ctx, input }) => {
      const expert = await getExpertForUser(ctx.user.id);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { weeklyCheckins } = await import("../../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");

      return drizzleDb.select().from(weeklyCheckins)
        .where(eq(weeklyCheckins.expertPatientId, input.expertPatientId))
        .orderBy(desc(weeklyCheckins.createdAt))
        .limit(input.limit);
    }),

  addCheckinFeedback: protectedProcedure
    .input(z.object({ checkinId: z.number(), feedback: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const expert = await getExpertForUser(ctx.user.id);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { weeklyCheckins } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await drizzleDb.update(weeklyCheckins).set({
        expertFeedback: input.feedback,
        expertFeedbackAt: new Date(),
      }).where(eq(weeklyCheckins.id, input.checkinId));
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. SMART ALERTS
  // ═══════════════════════════════════════════════════════════════════════════
  getAlerts: protectedProcedure
    .input(z.object({ status: z.enum(["active", "acknowledged", "resolved"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const expert = await getExpertForUser(ctx.user.id);
      if (!expert) return [];
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { patientAlerts, users } = await import("../../drizzle/schema");
      const { eq, and, desc } = await import("drizzle-orm");

      const conditions = [eq(patientAlerts.expertId, expert.id)];
      if (input?.status) conditions.push(eq(patientAlerts.status, input.status));

      return drizzleDb.select({
        alert: patientAlerts,
        patientName: users.name,
        patientImage: users.imageUrl,
      })
        .from(patientAlerts)
        .leftJoin(users, eq(patientAlerts.patientUserId, users.id))
        .where(and(...conditions))
        .orderBy(desc(patientAlerts.createdAt))
        .limit(50);
    }),

  acknowledgeAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const expert = await getExpertForUser(ctx.user.id);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { patientAlerts } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      await drizzleDb.update(patientAlerts).set({
        status: "acknowledged",
        acknowledgedAt: new Date(),
      }).where(and(eq(patientAlerts.id, input.alertId), eq(patientAlerts.expertId, expert.id)));
      return { success: true };
    }),

  resolveAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const expert = await getExpertForUser(ctx.user.id);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { patientAlerts } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      await drizzleDb.update(patientAlerts).set({
        status: "resolved",
        resolvedAt: new Date(),
      }).where(and(eq(patientAlerts.id, input.alertId), eq(patientAlerts.expertId, expert.id)));
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. PDF REPORT (generates data for client-side PDF)
  // ═══════════════════════════════════════════════════════════════════════════
  getPatientReport: protectedProcedure
    .input(z.object({ expertPatientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const expert = await getExpertForUser(ctx.user.id);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients, users, userProfiles, patientProgress, weeklyCheckins, expertPatientNotes, expertAssignedMenus } = await import("../../drizzle/schema");
      const { eq, and, desc } = await import("drizzle-orm");

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.id, input.expertPatientId), eq(expertPatients.expertId, expert.id))).limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });

      const [patient] = await drizzleDb.select().from(users).where(eq(users.id, rel.patientUserId)).limit(1);
      const [profile] = await drizzleDb.select().from(userProfiles).where(eq(userProfiles.userId, rel.patientUserId)).limit(1);
      const progress = await drizzleDb.select().from(patientProgress)
        .where(eq(patientProgress.expertPatientId, input.expertPatientId))
        .orderBy(desc(patientProgress.recordedAt)).limit(20);
      const checkins = await drizzleDb.select().from(weeklyCheckins)
        .where(eq(weeklyCheckins.expertPatientId, input.expertPatientId))
        .orderBy(desc(weeklyCheckins.createdAt)).limit(12);
      const notes = await drizzleDb.select().from(expertPatientNotes)
        .where(eq(expertPatientNotes.expertPatientId, input.expertPatientId))
        .orderBy(desc(expertPatientNotes.createdAt)).limit(10);
      const menus = await drizzleDb.select().from(expertAssignedMenus)
        .where(eq(expertAssignedMenus.expertPatientId, input.expertPatientId))
        .orderBy(desc(expertAssignedMenus.createdAt)).limit(5);

      return {
        patient: { name: patient?.name, email: patient?.email, imageUrl: patient?.imageUrl },
        profile: profile ? { weight: profile.weight, targetWeight: profile.targetWeight, height: profile.height, mainGoal: profile.mainGoal, activityLevel: profile.activityLevel } : null,
        expert: { name: expert.displayName, specialty: expert.specialty },
        progress: progress.reverse(),
        checkins: checkins.reverse(),
        notes,
        menus,
        generatedAt: new Date().toISOString(),
      };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. VIDEO CONSULTATION
  // ═══════════════════════════════════════════════════════════════════════════
  createVideoRoom: protectedProcedure
    .input(z.object({ appointmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const expert = await getExpertForUser(ctx.user.id);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { videoRooms, expertAppointments } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const [appt] = await drizzleDb.select().from(expertAppointments)
        .where(and(eq(expertAppointments.id, input.appointmentId), eq(expertAppointments.expertId, expert.id))).limit(1);
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" });

      const roomCode = `buddy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const [room] = await drizzleDb.insert(videoRooms).values({
        appointmentId: input.appointmentId,
        expertId: expert.id,
        patientUserId: appt.patientUserId,
        roomCode,
      }).returning();

      return { roomCode: room.roomCode, roomUrl: `https://meet.jit.si/${room.roomCode}` };
    }),

  getVideoRoom: protectedProcedure
    .input(z.object({ appointmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { videoRooms } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const [room] = await drizzleDb.select().from(videoRooms)
        .where(eq(videoRooms.appointmentId, input.appointmentId)).limit(1);
      if (!room) return null;
      return { ...room, roomUrl: `https://meet.jit.si/${room.roomCode}` };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. VERIFIED REVIEWS
  // ═══════════════════════════════════════════════════════════════════════════
  submitReview: protectedProcedure
    .input(z.object({
      expertPatientId: z.number(),
      rating: z.number().min(1).max(5),
      title: z.string().max(256).optional(),
      content: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertPatients, expertReviews } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.id, input.expertPatientId), eq(expertPatients.patientUserId, ctx.user.id))).limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });

      // Calculate weeks with expert
      const weeksWithExpert = Math.floor((Date.now() - new Date(rel.createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000));
      const isVerified = weeksWithExpert >= 4;

      const [review] = await drizzleDb.insert(expertReviews).values({
        expertId: rel.expertId,
        patientUserId: ctx.user.id,
        expertPatientId: input.expertPatientId,
        rating: input.rating,
        title: input.title ?? null,
        content: input.content ?? null,
        isVerified,
        weeksWithExpert,
      }).returning();

      // Update expert average rating
      const { buddyExperts } = await import("../../drizzle/schema");
      const { avg, count } = await import("drizzle-orm");
      const [stats] = await drizzleDb.select({
        avgRating: avg(expertReviews.rating),
        total: count(expertReviews.id),
      }).from(expertReviews).where(eq(expertReviews.expertId, rel.expertId));

      if (stats) {
        await drizzleDb.update(buddyExperts).set({
          rating: parseFloat(String(stats.avgRating || 0)),
          reviewsCount: Number(stats.total || 0),
        }).where(eq(buddyExperts.id, rel.expertId));
      }

      return review;
    }),

  getExpertReviews: publicProcedure
    .input(z.object({ expertId: z.number(), limit: z.number().max(50).default(20) }))
    .query(async ({ input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { expertReviews, users } = await import("../../drizzle/schema");
      const { eq, and, desc } = await import("drizzle-orm");

      return drizzleDb.select({
        review: expertReviews,
        patientName: users.name,
        patientImage: users.imageUrl,
      })
        .from(expertReviews)
        .leftJoin(users, eq(expertReviews.patientUserId, users.id))
        .where(and(eq(expertReviews.expertId, input.expertId), eq(expertReviews.isPublic, true)))
        .orderBy(desc(expertReviews.createdAt))
        .limit(input.limit);
    }),

  respondToReview: protectedProcedure
    .input(z.object({ reviewId: z.number(), response: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const expert = await getExpertForUser(ctx.user.id);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertReviews } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      await drizzleDb.update(expertReviews).set({
        expertResponse: input.response,
        expertRespondedAt: new Date(),
      }).where(and(eq(expertReviews.id, input.reviewId), eq(expertReviews.expertId, expert.id)));
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. REFERRAL PROGRAM
  // ═══════════════════════════════════════════════════════════════════════════
  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const expert = await getExpertForUser(ctx.user.id);
    if (!expert) return null;
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return null;
    const { referralCodes, referralSubscriptions, referralEarnings } = await import("../../drizzle/schema");
    const { eq, and, sum, count } = await import("drizzle-orm");

    const [code] = await drizzleDb.select().from(referralCodes)
      .where(and(eq(referralCodes.userId, ctx.user.id), eq(referralCodes.ownerType, "buddyexpert"))).limit(1);
    if (!code) return { code: null, activeSubs: 0, totalEarned: 0, pendingEarnings: 0 };

    const [subStats] = await drizzleDb.select({ total: count() })
      .from(referralSubscriptions)
      .where(and(eq(referralSubscriptions.referrerId, ctx.user.id), eq(referralSubscriptions.isActive, true)));

    const [earnStats] = await drizzleDb.select({ total: sum(referralEarnings.commissionAmount) })
      .from(referralEarnings).where(eq(referralEarnings.referrerId, ctx.user.id));

    return {
      code: code.code,
      discountPercent: code.discountPercent,
      commissionPercent: code.commissionPercent,
      usageCount: code.usageCount,
      activeSubs: Number(subStats?.total || 0),
      totalEarned: Number(earnStats?.total || 0),
    };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. AVAILABILITY & BOOKING
  // ═══════════════════════════════════════════════════════════════════════════
  getAvailability: protectedProcedure.query(async ({ ctx }) => {
    const expert = await getExpertForUser(ctx.user.id);
    if (!expert) return [];
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return [];
    const { expertAvailabilitySlots } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    return drizzleDb.select().from(expertAvailabilitySlots)
      .where(eq(expertAvailabilitySlots.expertId, expert.id));
  }),

  setAvailability: protectedProcedure
    .input(z.object({
      slots: z.array(z.object({
        dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        slotDurationMinutes: z.number().min(15).max(120).default(60),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const expert = await getExpertForUser(ctx.user.id);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertAvailabilitySlots } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Replace all slots
      await drizzleDb.delete(expertAvailabilitySlots).where(eq(expertAvailabilitySlots.expertId, expert.id));
      if (input.slots.length > 0) {
        await drizzleDb.insert(expertAvailabilitySlots).values(
          input.slots.map(s => ({ ...s, expertId: expert.id }))
        );
      }
      return { success: true, count: input.slots.length };
    }),

  getPublicAvailability: publicProcedure
    .input(z.object({ expertId: z.number() }))
    .query(async ({ input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { expertAvailabilitySlots } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      return drizzleDb.select().from(expertAvailabilitySlots)
        .where(and(eq(expertAvailabilitySlots.expertId, input.expertId), eq(expertAvailabilitySlots.isActive, true)));
    }),

  bookSlot: protectedProcedure
    .input(z.object({
      expertId: z.number(),
      slotId: z.number(),
      date: z.string(), // "2026-05-15"
      title: z.string().max(256).default("Primera consulta"),
      description: z.string().max(1000).optional(),
      modality: z.enum(["online", "presencial"]).default("online"),
    }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { expertAvailabilitySlots, expertAppointments, expertPatients, buddyExperts } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      // Get slot
      const [slot] = await drizzleDb.select().from(expertAvailabilitySlots)
        .where(and(eq(expertAvailabilitySlots.id, input.slotId), eq(expertAvailabilitySlots.expertId, input.expertId))).limit(1);
      if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Horario no disponible" });

      // Get or create patient relationship
      const [be] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.id, input.expertId)).limit(1);
      if (!be) throw new TRPCError({ code: "NOT_FOUND" });

      let [patientRel] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.expertId, be.id), eq(expertPatients.patientUserId, ctx.user.id))).limit(1);

      if (!patientRel) {
        [patientRel] = await drizzleDb.insert(expertPatients).values({
          expertId: be.id,
          patientUserId: ctx.user.id,
          status: "active",
        }).returning();
      }

      // Create appointment
      const startTime = new Date(`${input.date}T${slot.startTime}:00`);
      const endTime = new Date(startTime.getTime() + slot.slotDurationMinutes * 60 * 1000);

      const [appt] = await drizzleDb.insert(expertAppointments).values({
        expertPatientId: patientRel.id,
        expertId: be.id,
        patientUserId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        startTime,
        endTime,
        modality: input.modality,
        status: "scheduled",
      }).returning();

      return appt;
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. B2B COMPANIES
  // ═══════════════════════════════════════════════════════════════════════════
  getB2bDashboard: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return null;
    const { b2bEmployees, b2bCompanies, users } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    // Check if user is an HR manager
    const [emp] = await drizzleDb.select({ employee: b2bEmployees, company: b2bCompanies })
      .from(b2bEmployees)
      .leftJoin(b2bCompanies, eq(b2bEmployees.companyId, b2bCompanies.id))
      .where(and(eq(b2bEmployees.userId, ctx.user.id), eq(b2bEmployees.role, "hr_manager"))).limit(1);

    if (!emp?.company) return null;

    // Get employees
    const employees = await drizzleDb.select({ employee: b2bEmployees, user: { name: users.name, email: users.email, imageUrl: users.imageUrl } })
      .from(b2bEmployees)
      .leftJoin(users, eq(b2bEmployees.userId, users.id))
      .where(eq(b2bEmployees.companyId, emp.company.id));

    return {
      company: emp.company,
      employees,
      seatsUsed: employees.length,
      seatsAvailable: emp.company.maxSeats - employees.length,
    };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. PATIENT TREND ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════
  getPatientTrends: protectedProcedure
    .input(z.object({ expertPatientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const expert = await getExpertForUser(ctx.user.id);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { patientProgress, weeklyCheckins, expertPatients, userProfiles } = await import("../../drizzle/schema");
      const { eq, and, asc } = await import("drizzle-orm");

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(eq(expertPatients.id, input.expertPatientId), eq(expertPatients.expertId, expert.id))).limit(1);
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });

      const [profile] = await drizzleDb.select().from(userProfiles)
        .where(eq(userProfiles.userId, rel.patientUserId)).limit(1);

      const progress = await drizzleDb.select().from(patientProgress)
        .where(eq(patientProgress.expertPatientId, input.expertPatientId))
        .orderBy(asc(patientProgress.recordedAt)).limit(52);

      const checkins = await drizzleDb.select().from(weeklyCheckins)
        .where(eq(weeklyCheckins.expertPatientId, input.expertPatientId))
        .orderBy(asc(weeklyCheckins.createdAt)).limit(52);

      // Calculate trends
      const weightData = progress.filter(p => p.weight).map(p => ({ date: p.recordedAt, value: p.weight! }));
      const bodyFatData = progress.filter(p => p.bodyFat).map(p => ({ date: p.recordedAt, value: p.bodyFat! }));
      const adherenceData = checkins.filter(c => c.adherenceRating).map(c => ({ date: c.createdAt, value: c.adherenceRating! }));
      const energyData = checkins.filter(c => c.energyRating).map(c => ({ date: c.createdAt, value: c.energyRating! }));

      // Weight prediction
      let predictedWeeksToGoal = null;
      if (weightData.length >= 2 && profile?.targetWeight) {
        const first = weightData[0];
        const last = weightData[weightData.length - 1];
        const weeksDiff = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weeklyChange = (last.value - first.value) / weeksDiff;
        if (weeklyChange !== 0) {
          const remaining = profile.targetWeight - last.value;
          const weeks = Math.abs(remaining / weeklyChange);
          if (weeks > 0 && weeks < 200) predictedWeeksToGoal = Math.ceil(weeks);
        }
      }

      // Adherence-weight correlation
      let adherenceWeightCorrelation = null;
      if (adherenceData.length >= 3 && weightData.length >= 3) {
        const minLen = Math.min(adherenceData.length, weightData.length);
        const adhSlice = adherenceData.slice(-minLen).map(d => d.value);
        const wSlice = weightData.slice(-minLen).map(d => d.value);
        const avgAdh = adhSlice.reduce((a, b) => a + b, 0) / minLen;
        const avgW = wSlice.reduce((a, b) => a + b, 0) / minLen;
        let num = 0, denA = 0, denW = 0;
        for (let i = 0; i < minLen; i++) {
          const da = adhSlice[i] - avgAdh;
          const dw = wSlice[i] - avgW;
          num += da * dw; denA += da * da; denW += dw * dw;
        }
        const den = Math.sqrt(denA * denW);
        if (den > 0) adherenceWeightCorrelation = Math.round((num / den) * 100) / 100;
      }

      return {
        weightData,
        bodyFatData,
        adherenceData,
        energyData,
        targetWeight: profile?.targetWeight ?? null,
        currentWeight: weightData.length > 0 ? weightData[weightData.length - 1].value : null,
        predictedWeeksToGoal,
        adherenceWeightCorrelation,
        totalProgressEntries: progress.length,
        totalCheckins: checkins.length,
      };
    }),
});
