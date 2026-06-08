import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { getUserPlanTier, requirePlanFeature } from "../planGuard";
import {
  households,
  householdMembers,
  householdInvitations,
  users,
} from "../../drizzle/schema";

// ─── Helper: cálculo nutricional pediátrico por edad (OMS / DRI) ─────────────────
function calcNutritionalNeeds(memberType: string, ageYears: number | null) {
  if (memberType === "baby") {
    const months = ageYears != null ? Math.round(ageYears * 12) : 6;
    if (months < 6) return { kcal: 550, protein: 9.1, carbs: 60, fat: 31, calcium: 200, iron: 0.27, label: "Bebé 0-6 meses", note: "Lactancia materna o fórmula exclusiva" };
    return { kcal: 700, protein: 11, carbs: 95, fat: 30, calcium: 260, iron: 11, label: "Bebé 6-12 meses", note: "Introducción de sólidos" };
  }
  if (memberType === "child") {
    const age = ageYears ?? 5;
    if (age <= 3)  return { kcal: 1200, protein: 13, carbs: 130, fat: 40, calcium: 700,  iron: 7,  label: "Niño 1-3 años", note: undefined };
    if (age <= 8)  return { kcal: 1500, protein: 19, carbs: 150, fat: 50, calcium: 1000, iron: 10, label: "Niño 4-8 años", note: undefined };
    if (age <= 13) return { kcal: 1900, protein: 34, carbs: 200, fat: 60, calcium: 1300, iron: 8,  label: "Niño 9-13 años", note: undefined };
    return       { kcal: 2200, protein: 52, carbs: 250, fat: 70, calcium: 1300, iron: 11, label: "Adolescente 14-18 años", note: undefined };
  }
  return { kcal: 2000, protein: 50, carbs: 250, fat: 70, calcium: 1000, iron: 8, label: "Adulto", note: undefined };
}
import { eq, and, or, inArray, count } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";


// ─── Email helper ─────────────────────────────────────────────────────────────
async function sendHouseholdInviteEmail(params: {
  invitedEmail: string;
  inviterName: string;
  householdName: string;
  inviteUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Luis de BuddyOne <luis@buddyone.io>",
    to: params.invitedEmail,
    subject: `${params.inviterName} te invita a unirte al hogar "${params.householdName}" en BuddyOne`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
          <h1 style="color:#f97316;margin:0;font-size:28px;font-weight:800;">BuddyOne</h1>
          <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Nutrición inteligente para toda la familia</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:22px;">¡Te han invitado al hogar familiar!</h2>
          <p style="color:#64748b;line-height:1.6;margin:0 0 24px;">
            <strong style="color:#1a1a2e;">${params.inviterName}</strong> te invita a unirte al hogar 
            <strong style="color:#f97316;">"${params.householdName}"</strong> en BuddyOne para compartir 
            el menú semanal y la lista de la compra.
          </p>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin:0 0 28px;">
            <p style="color:#9a3412;margin:0;font-size:14px;font-weight:600;">¿Qué podrás hacer?</p>
            <ul style="color:#c2410c;margin:8px 0 0;padding-left:20px;font-size:14px;line-height:1.8;">
              <li>Ver y editar el menú semanal compartido</li>
              <li>Añadir tus preferencias y restricciones dietéticas</li>
              <li>Colaborar en la lista de la compra del hogar</li>
              <li>Recibir notificaciones cuando se actualice el menú</li>
            </ul>
          </div>
          <div style="text-align:center;margin:0 0 28px;">
            <a href="${params.inviteUrl}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;">
              Aceptar invitación
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
            Este enlace expira en 7 días. Si no conoces a ${params.inviterName}, puedes ignorar este email.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© 2026 BuddyOne · <a href="https://buddyone.io" style="color:#f97316;text-decoration:none;">buddyone.io</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// ─── Dietary restriction options ─────────────────────────────────────────────
const DIETARY_RESTRICTIONS = [
  "gluten", "lactosa", "huevo", "frutos_secos", "mariscos", "pescado",
  "soja", "cacahuetes", "sesamo", "mostaza", "apio", "sulfitos",
  "vegetariano", "vegano", "halal", "kosher",
] as const;

// ─── Household Router ─────────────────────────────────────────────────────────
export const householdRouter = router({

  // Get the household of the current user (or null if not in one)
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Find household where user is a member
    const [membership] = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.userId, ctx.user.id))
      .limit(1);

    if (!membership) return null;

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, membership.householdId))
      .limit(1);

    if (!household) return null;

    // Get all members with user info
    const members = await db
      .select({
        id: householdMembers.id,
        userId: householdMembers.userId,
        role: householdMembers.role,
        displayName: householdMembers.displayName,
        dietaryRestrictions: householdMembers.dietaryRestrictions,
        allergies: householdMembers.allergies,
        preferences: householdMembers.preferences,
        joinedAt: householdMembers.joinedAt,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.imageUrl,
      })
      .from(householdMembers)
      .leftJoin(users, eq(users.id, householdMembers.userId))
      .where(eq(householdMembers.householdId, household.id));

    // Get pending invitations
    const invitations = await db
      .select()
      .from(householdInvitations)
      .where(
        and(
          eq(householdInvitations.householdId, household.id),
          eq(householdInvitations.status, "pending")
        )
      );

    return {
      ...household,
      myRole: membership.role,
      myMemberId: membership.id,
      members: members.map((m) => ({
        ...m,
        dietaryRestrictions: m.dietaryRestrictions ? JSON.parse(m.dietaryRestrictions) : [],
        allergies: m.allergies ? JSON.parse(m.allergies) : [],
        preferences: m.preferences ? JSON.parse(m.preferences) : {},
      })),
      pendingInvitations: invitations,
    };
  }),

  // Create a new household
  create: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(100) }))
    .mutation(async ({ ctx, input }) => {
      // ── Plan gate: Pro Max only ──────────────────────────────────────────────
      const tier = await getUserPlanTier(ctx.user.id, ctx.user.role);
      requirePlanFeature(tier, "canUseHousehold");

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user already belongs to a household
      const [existing] = await db
        .select()
        .from(householdMembers)
        .where(eq(householdMembers.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya perteneces a un hogar. Sal del hogar actual antes de crear uno nuevo.",
        });
      }

      // Create household
      const [household] = await db
        .insert(households)
        .values({ name: input.name, ownerId: ctx.user.id })
        .returning();

      // Add creator as owner member
      await db.insert(householdMembers).values({
        householdId: household.id,
        userId: ctx.user.id,
        role: "owner",
        displayName: ctx.user.name ?? "Propietario",
      });

      return household;
    }),

  // Update household name
  update: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [membership] = await db
        .select()
        .from(householdMembers)
        .where(
          and(
            eq(householdMembers.userId, ctx.user.id),
            or(
              eq(householdMembers.role, "owner"),
              eq(householdMembers.role, "admin")
            )
          )
        )
        .limit(1);

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permisos para editar este hogar." });
      }

      await db
        .update(households)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(households.id, membership.householdId));

      return { success: true };
    }),

  // Invite a member by email
  invite: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      origin: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [membership] = await db
        .select()
        .from(householdMembers)
        .where(eq(householdMembers.userId, ctx.user.id))
        .limit(1);

      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No perteneces a ningún hogar." });
      }

      if (!["owner", "admin"].includes(membership.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo el propietario o administradores pueden invitar miembros." });
      }

      // Check max members
      const [{ memberCount }] = await db
        .select({ memberCount: count() })
        .from(householdMembers)
        .where(eq(householdMembers.householdId, membership.householdId));

      const [household] = await db
        .select()
        .from(households)
        .where(eq(households.id, membership.householdId))
        .limit(1);

      if (memberCount >= (household?.maxMembers ?? 6)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `El hogar ya tiene el máximo de ${household?.maxMembers ?? 6} miembros.` });
      }

      // Check if email already invited or member
      const invitedUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (invitedUser[0]) {
        const [alreadyMember] = await db
          .select()
          .from(householdMembers)
          .where(
            and(
              eq(householdMembers.householdId, membership.householdId),
              eq(householdMembers.userId, invitedUser[0].id)
            )
          )
          .limit(1);

        if (alreadyMember) {
          throw new TRPCError({ code: "CONFLICT", message: "Este usuario ya es miembro del hogar." });
        }
      }

      // Generate token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Upsert invitation (cancel previous pending if exists)
      await db
        .update(householdInvitations)
        .set({ status: "expired" })
        .where(
          and(
            eq(householdInvitations.householdId, membership.householdId),
            eq(householdInvitations.invitedEmail, input.email),
            eq(householdInvitations.status, "pending")
          )
        );

      await db.insert(householdInvitations).values({
        householdId: membership.householdId,
        invitedByUserId: ctx.user.id,
        invitedEmail: input.email,
        token,
        expiresAt,
      });

      // Send email
      const inviteUrl = `${input.origin}/familia/unirse?token=${token}`;
      await sendHouseholdInviteEmail({
        invitedEmail: input.email,
        inviterName: ctx.user.name ?? "Un miembro",
        householdName: household?.name ?? "Hogar familiar",
        inviteUrl,
      });

      return { success: true, inviteUrl };
    }),

  // Accept an invitation by token
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [invitation] = await db
        .select()
        .from(householdInvitations)
        .where(
          and(
            eq(householdInvitations.token, input.token),
            eq(householdInvitations.status, "pending")
          )
        )
        .limit(1);

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitación no encontrada o ya utilizada." });
      }

      if (invitation.expiresAt < new Date()) {
        await db
          .update(householdInvitations)
          .set({ status: "expired" })
          .where(eq(householdInvitations.id, invitation.id));
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta invitación ha expirado." });
      }

      // Check if user already in a household
      const [existingMembership] = await db
        .select()
        .from(householdMembers)
        .where(eq(householdMembers.userId, ctx.user.id))
        .limit(1);

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya perteneces a un hogar. Sal del hogar actual antes de aceptar esta invitación.",
        });
      }

      // Add as member
      await db.insert(householdMembers).values({
        householdId: invitation.householdId,
        userId: ctx.user.id,
        role: "member",
        displayName: ctx.user.name ?? "Nuevo miembro",
      });

      // Mark invitation as accepted
      await db
        .update(householdInvitations)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(householdInvitations.id, invitation.id));

      return { success: true, householdId: invitation.householdId };
    }),

  // Update my own member preferences
  updateMyPreferences: protectedProcedure
    .input(z.object({
      displayName: z.string().min(1).max(80).optional(),
      dietaryRestrictions: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
      preferences: z.object({
        calories: z.number().optional(),
        goal: z.enum(["lose_weight", "maintain", "gain_muscle", "eat_healthy"]).optional(),
        mealsPerDay: z.number().min(1).max(6).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [membership] = await db
        .select()
        .from(householdMembers)
        .where(eq(householdMembers.userId, ctx.user.id))
        .limit(1);

      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No perteneces a ningún hogar." });
      }

      await db
        .update(householdMembers)
        .set({
          displayName: input.displayName ?? membership.displayName,
          dietaryRestrictions: input.dietaryRestrictions !== undefined
            ? JSON.stringify(input.dietaryRestrictions)
            : membership.dietaryRestrictions,
          allergies: input.allergies !== undefined
            ? JSON.stringify(input.allergies)
            : membership.allergies,
          preferences: input.preferences !== undefined
            ? JSON.stringify(input.preferences)
            : membership.preferences,
          updatedAt: new Date(),
        })
        .where(eq(householdMembers.id, membership.id));

      return { success: true };
    }),

  // Remove a member (owner/admin only, or self-leave)
  removeMember: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [myMembership] = await db
        .select()
        .from(householdMembers)
        .where(eq(householdMembers.userId, ctx.user.id))
        .limit(1);

      if (!myMembership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No perteneces a ningún hogar." });
      }

      const [targetMember] = await db
        .select()
        .from(householdMembers)
        .where(eq(householdMembers.id, input.memberId))
        .limit(1);

      if (!targetMember || targetMember.householdId !== myMembership.householdId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Miembro no encontrado." });
      }

      // Can remove self, or owner/admin can remove others
      const isSelf = targetMember.userId === ctx.user.id;
      const hasPermission = ["owner", "admin"].includes(myMembership.role);

      if (!isSelf && !hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permisos para eliminar este miembro." });
      }

      if (targetMember.role === "owner" && !isSelf) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No puedes eliminar al propietario del hogar." });
      }

      await db.delete(householdMembers).where(eq(householdMembers.id, input.memberId));

      // If owner leaves, delete the household or transfer ownership
      if (targetMember.role === "owner") {
        const remainingMembers = await db
          .select()
          .from(householdMembers)
          .where(eq(householdMembers.householdId, myMembership.householdId));

        if (remainingMembers.length === 0) {
          // Delete household if no members left
          await db.delete(households).where(eq(households.id, myMembership.householdId));
        } else {
          // Transfer ownership to first remaining member
          const newOwner = remainingMembers[0];
          await db
            .update(householdMembers)
            .set({ role: "owner" })
            .where(eq(householdMembers.id, newOwner.id));
          await db
            .update(households)
            .set({ ownerId: newOwner.userId ?? 0, updatedAt: new Date() })
            .where(eq(households.id, myMembership.householdId));
        }
      }

      return { success: true };
    }),

  // Cancel a pending invitation
  cancelInvitation: protectedProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [membership] = await db
        .select()
        .from(householdMembers)
        .where(
          and(
            eq(householdMembers.userId, ctx.user.id),
            or(
              eq(householdMembers.role, "owner"),
              eq(householdMembers.role, "admin")
            )
          )
        )
        .limit(1);

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permisos para cancelar invitaciones." });
      }

      await db
        .update(householdInvitations)
        .set({ status: "expired" })
        .where(
          and(
            eq(householdInvitations.id, input.invitationId),
            eq(householdInvitations.householdId, membership.householdId)
          )
        );

      return { success: true };
    }),

  // Get invitation details by token (public, for the accept page)
  getInviteByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [invitation] = await db
        .select()
        .from(householdInvitations)
        .where(eq(householdInvitations.token, input.token))
        .limit(1);

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitación no encontrada." });
      }

      const [household] = await db
        .select()
        .from(households)
        .where(eq(households.id, invitation.householdId))
        .limit(1);

      const [inviter] = await db
        .select({ name: users.name, imageUrl: users.imageUrl })
        .from(users)
        .where(eq(users.id, invitation.invitedByUserId))
        .limit(1);

      return {
        status: invitation.status,
        isExpired: invitation.expiresAt < new Date(),
        householdName: household?.name ?? "Hogar familiar",
        inviterName: inviter?.name ?? "Un miembro",
        inviterAvatar: inviter?.imageUrl ?? null,
        expiresAt: invitation.expiresAt,
      };
    }),

  // Update enriched member profile (type, birthDate, weight, height, feedingPhase, dislikedFoods)
  updateMemberProfile: protectedProcedure
    .input(z.object({
      memberId: z.number(),
      memberType: z.enum(["adult", "child", "baby"]).optional(),
      displayName: z.string().max(80).optional(),
      birthDate: z.string().optional().nullable(),
      weightKg: z.number().min(0).max(300).optional().nullable(),
      heightCm: z.number().min(0).max(250).optional().nullable(),
      feedingPhase: z.enum(["breastfeeding", "formula", "purees", "soft_solids", "normal"]).optional().nullable(),
      dislikedFoods: z.array(z.string()).optional(),
      dietaryRestrictions: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [myMembership] = await db.select().from(householdMembers)
        .where(eq(householdMembers.userId, ctx.user.id)).limit(1);
      if (!myMembership) throw new TRPCError({ code: "NOT_FOUND", message: "No perteneces a ningún hogar." });
      const [target] = await db.select().from(householdMembers)
        .where(eq(householdMembers.id, input.memberId)).limit(1);
      if (!target || target.householdId !== myMembership.householdId)
        throw new TRPCError({ code: "NOT_FOUND", message: "Miembro no encontrado." });
      const isSelf = target.userId === ctx.user.id;
      const hasPermission = ["owner", "admin"].includes(myMembership.role);
      if (!isSelf && !hasPermission)
        throw new TRPCError({ code: "FORBIDDEN", message: "Sin permisos para editar este perfil." });
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.memberType !== undefined) updateData.memberType = input.memberType;
      if (input.displayName !== undefined) updateData.displayName = input.displayName;
      if (input.birthDate !== undefined) updateData.birthDate = input.birthDate ? new Date(input.birthDate) : null;
      if (input.weightKg !== undefined) updateData.weightKg = input.weightKg;
      if (input.heightCm !== undefined) updateData.heightCm = input.heightCm;
      if (input.feedingPhase !== undefined) updateData.feedingPhase = input.feedingPhase as "breastfeeding" | "formula" | "purees" | "soft_solids" | "normal" | null;
      if (input.dislikedFoods !== undefined) updateData.dislikedFoods = JSON.stringify(input.dislikedFoods);
      if (input.dietaryRestrictions !== undefined) updateData.dietaryRestrictions = JSON.stringify(input.dietaryRestrictions);
      if (input.allergies !== undefined) updateData.allergies = JSON.stringify(input.allergies);
      await db.update(householdMembers)
        .set(updateData as Partial<typeof householdMembers.$inferInsert>)
        .where(eq(householdMembers.id, input.memberId));
      return { success: true };
    }),

  // Get nutritional needs for all members of the household
  getMembersNutrition: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [myMembership] = await db.select().from(householdMembers)
        .where(eq(householdMembers.userId, ctx.user.id)).limit(1);
      if (!myMembership) throw new TRPCError({ code: "NOT_FOUND", message: "No perteneces a ningún hogar." });
      const members = await db.select({
        id: householdMembers.id,
        displayName: householdMembers.displayName,
        memberType: householdMembers.memberType,
        birthDate: householdMembers.birthDate,
        weightKg: householdMembers.weightKg,
        heightCm: householdMembers.heightCm,
        feedingPhase: householdMembers.feedingPhase,
        userId: householdMembers.userId,
        userName: users.name,
        userAvatar: users.imageUrl,
      })
        .from(householdMembers)
        .leftJoin(users, eq(householdMembers.userId, users.id))
        .where(eq(householdMembers.householdId, myMembership.householdId));
      return members.map((m) => {
        const ageYears = m.birthDate
          ? (Date.now() - new Date(m.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          : null;
        const needs = calcNutritionalNeeds(m.memberType ?? "adult", ageYears);
        return { ...m, ageYears: ageYears ? Math.floor(ageYears) : null, nutritionalNeeds: needs };
      });
    }),
});
