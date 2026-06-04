/**
 * b2bTeams router — Equipos B2B para nutricionistas
 * Gestiona equipos de hasta 10 personas con condiciones similares,
 * miembros del equipo y planes nutricionales grupales generados con IA.
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Pérdida de peso",
  muscle_gain: "Ganancia muscular",
  energy_performance: "Energía y rendimiento",
  stress_management: "Gestión del estrés",
  balanced_diet: "Dieta equilibrada",
  cardiovascular_health: "Salud cardiovascular",
  digestive_health: "Salud digestiva",
  diabetes_management: "Control de diabetes",
  other: "Otro",
};

export const b2bTeamsRouter = router({
  // ─── Listar equipos del nutricionista ──────────────────────────────────────
  listTeams: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { b2bTeams, b2bTeamMembers, b2bTeamPlans, buddyExperts } = await import("../../drizzle/schema.js");

    const [expert] = await db.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id));
    if (!expert) throw new TRPCError({ code: "FORBIDDEN", message: "Solo nutricionistas pueden acceder" });

    const teams = await db
      .select()
      .from(b2bTeams)
      .where(and(eq(b2bTeams.expertId, expert.id), eq(b2bTeams.isActive, true)))
      .orderBy(desc(b2bTeams.createdAt));

    const teamsWithCount = await Promise.all(
      teams.map(async (team) => {
        const members = await db
          .select()
          .from(b2bTeamMembers)
          .where(and(eq(b2bTeamMembers.teamId, team.id), eq(b2bTeamMembers.isActive, true)));
        const plans = await db
          .select()
          .from(b2bTeamPlans)
          .where(eq(b2bTeamPlans.teamId, team.id))
          .orderBy(desc(b2bTeamPlans.createdAt))
          .limit(1);
        return { ...team, memberCount: members.length, lastPlan: plans[0] ?? null };
      })
    );

    return teamsWithCount;
  }),

  // ─── Crear equipo ──────────────────────────────────────────────────────────
  createTeam: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(256),
      companyName: z.string().max(256).optional(),
      goal: z.string(),
      conditions: z.string().optional(),
      dietaryRestrictions: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { b2bTeams, buddyExperts } = await import("../../drizzle/schema.js");

      const [expert] = await db.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id));
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });

      const [team] = await db.insert(b2bTeams).values({
        expertId: expert.id,
        name: input.name,
        companyName: input.companyName,
        goal: input.goal,
        conditions: input.conditions,
        dietaryRestrictions: input.dietaryRestrictions,
        notes: input.notes,
        maxMembers: 10,
      }).returning();

      return team;
    }),

  // ─── Actualizar equipo ─────────────────────────────────────────────────────
  updateTeam: protectedProcedure
    .input(z.object({
      teamId: z.number(),
      name: z.string().min(2).max(256).optional(),
      companyName: z.string().max(256).optional(),
      goal: z.string().optional(),
      conditions: z.string().optional(),
      dietaryRestrictions: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { b2bTeams, buddyExperts } = await import("../../drizzle/schema.js");

      const [expert] = await db.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id));
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });

      const { teamId, ...updates } = input;
      await db.update(b2bTeams).set({ ...updates, updatedAt: new Date() }).where(
        and(eq(b2bTeams.id, teamId), eq(b2bTeams.expertId, expert.id))
      );
      return { success: true };
    }),

  // ─── Eliminar equipo (soft delete) ────────────────────────────────────────
  deleteTeam: protectedProcedure
    .input(z.object({ teamId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { b2bTeams, buddyExperts } = await import("../../drizzle/schema.js");

      const [expert] = await db.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id));
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });

      await db.update(b2bTeams)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(b2bTeams.id, input.teamId), eq(b2bTeams.expertId, expert.id)));
      return { success: true };
    }),

  // ─── Obtener detalle de equipo con miembros y planes ──────────────────────
  getTeamDetail: protectedProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { b2bTeams, b2bTeamMembers, b2bTeamPlans, buddyExperts } = await import("../../drizzle/schema.js");

      const [expert] = await db.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id));
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });

      const [team] = await db.select().from(b2bTeams).where(
        and(eq(b2bTeams.id, input.teamId), eq(b2bTeams.expertId, expert.id))
      );
      if (!team) throw new TRPCError({ code: "NOT_FOUND" });

      const members = await db
        .select()
        .from(b2bTeamMembers)
        .where(and(eq(b2bTeamMembers.teamId, input.teamId), eq(b2bTeamMembers.isActive, true)));

      const plans = await db
        .select()
        .from(b2bTeamPlans)
        .where(eq(b2bTeamPlans.teamId, input.teamId))
        .orderBy(desc(b2bTeamPlans.createdAt));

      return { team, members, plans };
    }),

  // ─── Añadir miembro al equipo ──────────────────────────────────────────────
  addMember: protectedProcedure
    .input(z.object({
      teamId: z.number(),
      name: z.string().min(2).max(256),
      email: z.string().email().optional(),
      age: z.number().min(16).max(100).optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      weight: z.number().min(30).max(300).optional(),
      height: z.number().min(100).max(250).optional(),
      specificConditions: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { b2bTeams, b2bTeamMembers, buddyExperts } = await import("../../drizzle/schema.js");

      const [expert] = await db.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id));
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });

      const [team] = await db.select().from(b2bTeams).where(
        and(eq(b2bTeams.id, input.teamId), eq(b2bTeams.expertId, expert.id))
      );
      if (!team) throw new TRPCError({ code: "NOT_FOUND" });

      const currentMembers = await db
        .select()
        .from(b2bTeamMembers)
        .where(and(eq(b2bTeamMembers.teamId, input.teamId), eq(b2bTeamMembers.isActive, true)));

      if (currentMembers.length >= 10) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El equipo ya tiene el máximo de 10 miembros" });
      }

      const { teamId, ...memberData } = input;
      const [member] = await db.insert(b2bTeamMembers).values({ teamId, ...memberData }).returning();
      return member;
    }),

  // ─── Eliminar miembro ─────────────────────────────────────────────────────
  removeMember: protectedProcedure
    .input(z.object({ memberId: z.number(), teamId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { b2bTeamMembers } = await import("../../drizzle/schema.js");

      await db.update(b2bTeamMembers)
        .set({ isActive: false })
        .where(eq(b2bTeamMembers.id, input.memberId));
      return { success: true };
    }),

  // ─── Generar plan grupal con IA ───────────────────────────────────────────
  generateTeamPlan: protectedProcedure
    .input(z.object({
      teamId: z.number(),
      planTitle: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { b2bTeams, b2bTeamMembers, b2bTeamPlans, buddyExperts } = await import("../../drizzle/schema.js");

      const [expert] = await db.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id));
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });

      const [team] = await db.select().from(b2bTeams).where(
        and(eq(b2bTeams.id, input.teamId), eq(b2bTeams.expertId, expert.id))
      );
      if (!team) throw new TRPCError({ code: "NOT_FOUND" });

      const members = await db
        .select()
        .from(b2bTeamMembers)
        .where(and(eq(b2bTeamMembers.teamId, input.teamId), eq(b2bTeamMembers.isActive, true)));

      if (members.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El equipo no tiene miembros" });
      }

      const goalLabel = GOAL_LABELS[team.goal] ?? team.goal;

      const membersSummary = members.map((m, i) => {
        const parts = [`${i + 1}. ${m.name}`];
        if (m.age) parts.push(`${m.age} años`);
        if (m.gender) parts.push(m.gender === "male" ? "hombre" : m.gender === "female" ? "mujer" : "otro");
        if (m.weight && m.height) parts.push(`${m.weight}kg / ${m.height}cm`);
        if (m.specificConditions) parts.push(`Condiciones específicas: ${m.specificConditions}`);
        return parts.join(", ");
      }).join("\n");

      const prompt = `Eres un nutricionista experto. Genera un plan nutricional grupal semanal para un equipo de empresa con las siguientes características:

**Equipo:** ${team.name}${team.companyName ? ` (${team.companyName})` : ""}
**Objetivo común:** ${goalLabel}
**Condiciones similares del grupo:** ${team.conditions ?? "No especificadas"}
**Restricciones dietéticas comunes:** ${team.dietaryRestrictions ?? "Ninguna"}
**Notas del nutricionista:** ${team.notes ?? "Ninguna"}

**Miembros del equipo (${members.length} personas):**
${membersSummary}

Genera un plan que incluya:
1. **Resumen ejecutivo** del plan para el equipo (2-3 párrafos)
2. **Menú semanal grupal** (Lunes a Domingo, desayuno, comida y cena) adaptado al objetivo común
3. **Recomendaciones grupales** (5-7 puntos clave de nutrición para este equipo)
4. **Adaptaciones individuales** para los miembros con condiciones específicas
5. **Snacks recomendados** para el entorno laboral
6. **Hidratación y suplementación** básica recomendada

Responde en español, con formato markdown claro y profesional.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Eres un nutricionista clínico experto en nutrición corporativa y bienestar empresarial. Tus planes son prácticos, basados en evidencia y adaptados al entorno laboral." },
          { role: "user", content: prompt },
        ],
      });

      const planContent = response.choices[0]?.message?.content ?? "";

      const recoResponse = await invokeLLM({
        messages: [
          { role: "system", content: "Extrae recomendaciones clave de forma concisa." },
          { role: "user", content: `Del siguiente plan nutricional, extrae SOLO las 5 recomendaciones más importantes en formato de lista numerada, muy concisas (máximo 2 líneas cada una):\n\n${planContent}` },
        ],
      });
      const recommendations = recoResponse.choices[0]?.message?.content ?? "";

      const title = input.planTitle ?? `Plan ${goalLabel} — ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`;

      const [plan] = await db.insert(b2bTeamPlans).values({
        teamId: input.teamId,
        expertId: expert.id,
        title,
        description: `Plan grupal para ${members.length} miembros. Objetivo: ${goalLabel}`,
        planContent,
        recommendations,
        isAiGenerated: true,
      }).returning();

      return plan;
    }),

  // ─── Listar planes de un equipo ───────────────────────────────────────────
  listTeamPlans: protectedProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { b2bTeamPlans } = await import("../../drizzle/schema.js");

      return db
        .select()
        .from(b2bTeamPlans)
        .where(eq(b2bTeamPlans.teamId, input.teamId))
        .orderBy(desc(b2bTeamPlans.createdAt));
    }),
});
