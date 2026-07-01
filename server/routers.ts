import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS, hasRole } from "@shared/const";
import { createCheckoutSession } from "./stripe-webhook";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { companyRouter } from "./routers/company";
import { companyRemindersRouter } from "./routers/companyReminders";
import { codesRouter } from "./routers/codes";
import { supportRouter } from "./routers/support";
import { householdRouter } from "./routers/household";
import { householdRecipesRouter } from "./routers/householdRecipes";
import { householdMenusRouter } from "./routers/householdMenus";
import { offlinePatientsRouter } from "./routers/offlinePatients";
import { expertPatientsRouter } from "./routers/expertPatients";
import { expertDashboardRouter } from "./routers/expertDashboard";
import { makerAnalyticsRouter } from "./routers/makerAnalytics";
import { contentSyncRouter } from "./routers/contentSync";
import { weeklyCheckinsRouter } from "./routers/weeklyCheckins";
import { sessionPackagesRouter } from "./routers/sessionPackages";
import { retentionRouter } from "./routers/retention";
import { buddyKidsRouter } from "./routers/buddyKids";
import { savedMenusRouter } from "./routers/savedMenus";
import { referralRouter } from "./routers/referral";
import { analyticsRouter } from "./routers/analytics";
import { wearablesRouter } from "./routers/wearables";
import { recommendationsRouter } from "./routers/recommendations";
import { wellnessGoalsRouter } from "./routers/wellnessGoals";
import { healthHubRouter } from "./routers/health-hub";
import { ecosystemSyncRouter } from "./routers/ecosystemSync";
import { ecosystemEnhancedRouter } from "./routers/ecosystemEnhanced";
import { expertEnhancedRouter } from "./routers/expertEnhanced";
import { expertProRouter } from "./routers/expertPro";
import { expertRecipesRouter } from "./routers/expertRecipes";
import { expertMealPlannerRouter } from "./routers/expertMealPlanner";
import { profileSetupRouter } from "./routers/profileSetup";
import { expertDocumentsRouter } from "./routers/expertDocuments";
import { expertBillingRouter } from "./routers/expertBilling";
import { patientDiaryRouter } from "./routers/patientDiary";
import { expertFeatureRequestsRouter } from "./routers/expertFeatureRequests";
import { recipeImagesRouter } from "./routers/recipeImages";
import { instagramRecipeRouter } from "./routers/instagramRecipe";
import { quickSuggestRouter } from "./routers/quickSuggest";
import { mealPrepRouter } from "./routers/mealPrep";
import { sustainabilityRouter } from "./routers/sustainability";
import { marketplaceRouter } from "./routers/marketplace";
import { corporateDashboardRouter } from "./routers/corporateDashboard";
import { priceCompareRouter } from "./routers/priceCompare";
import { nutritionChatRouter } from "./routers/nutritionChat";
import { emailCampaignsRouter } from "./routers/emailCampaigns";
import { contextualRecommendationsRouter } from "./routers/contextualRecommendations";
import { b2bTeamsRouter } from "./routers/b2bTeams";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import * as db from "./db";
import { getUserPlanTier, requirePlanFeature, requireUnderLimit } from "./planGuard";
import { sendOTPEmail } from "./email";
import { sendSMSOTP, normalizePhone, isValidPhone } from "./sms";
import { sdk } from "./_core/sdk";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

// =============================================================================
// HELPERS
// =============================================================================

function requireOwnership(resourceUserId: number, ctxUserId: number, role: string, secondaryRoles?: string[] | null) {
  if (resourceUserId !== ctxUserId && !hasRole({ role, secondaryRoles }, "admin")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para realizar esta acción" });
  }
}

// Tipos para el ecosistema
interface WorkoutSummary {
  weeklySessionCount: number;
  weeklyVolumeKg: number;
  monthlyVolumeKg: number;
  latestWeight: number | null;
  latestWeightDate: string | null;
  streak: number;
  bestPrExercise: string | null;
  bestPrWeightKg: number | null;
  bestPrReps: number | null;
  estimatedCaloriesBurned: number;
  lastUpdated: string;
}

async function createInAppNotif(userId: number, opts: {
  title: string;
  body: string;
  type?: "info" | "success" | "warning" | "error" | "promo" | "system";
  link?: string;
}) {
  try {
    const { inAppNotifications } = await import("../drizzle/schema.js");
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return;
    await drizzleDb.insert(inAppNotifications).values({
      userId,
      title: opts.title,
      body: opts.body,
      type: opts.type ?? "info",
      link: opts.link ?? null,
    });
  } catch (_e) {
    // Non-critical - never block the main flow
  }
}

// =============================================================================
// SAFETY: Forbidden ingredients helpers (CRITICAL for user health)
// =============================================================================

/**
 * Builds a strongly-worded block for AI prompts listing ALL ingredients
 * the user must never receive, based on their allergies, diet restrictions,
 * disliked ingredients, and any extra exclusions.
 *
 * This is a CRITICAL SAFETY function — used in every AI food generation call.
 */
function buildForbiddenIngredientsBlock(params: {
  allergies: Array<{ allergy: { nameEs: string; nameEn?: string | null } }>;
  restrictions: Array<{ restriction: { nameEs: string; nameEn?: string | null } }>;
  dislikedIngredients?: string | null;
  extraExclusions?: string[];
}): string {
  const lines: string[] = [];

  const allergyNames = params.allergies
    .map((a) => a.allergy.nameEs)
    .filter(Boolean);

  const restrictionNames = params.restrictions
    .map((r) => r.restriction.nameEs)
    .filter(Boolean);

  // Parse disliked ingredients (stored as JSON array or comma-separated)
  let dislikedList: string[] = [];
  if (params.dislikedIngredients) {
    try {
      const parsed = JSON.parse(params.dislikedIngredients);
      dislikedList = Array.isArray(parsed) ? parsed : [params.dislikedIngredients];
    } catch {
      dislikedList = params.dislikedIngredients.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  const extraList = params.extraExclusions?.filter(Boolean) ?? [];

  const allForbidden = [
    ...allergyNames,
    ...restrictionNames,
    ...dislikedList,
    ...extraList,
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  if (allForbidden.length === 0) return '';

  lines.push('\n🚨 RESTRICCIONES CRÍTICAS DE SALUD — INCUMPLIRLAS PUEDE CAUSAR DAÑO GRAVE AL USUARIO 🚨');
  lines.push('BAJO NINGUNA CIRCUNSTANCIA incluyas los siguientes ingredientes en ningún plato, receta o menú:');

  if (allergyNames.length > 0) {
    lines.push(`❌ ALERGIAS (pueden causar reacción alérgica grave o anafilaxia): ${allergyNames.join(', ')}`);
    lines.push('   → No uses estos ingredientes NI en trazas, NI como condimento, NI como guarnición, NI en salsas.');
    lines.push('   → Si una receta tradicional los lleva, CAMBIA la receta completa por otra que no los contenga.');
  }
  if (restrictionNames.length > 0) {
    lines.push(`❌ RESTRICCIONES DIETÉTICAS OBLIGATORIAS: ${restrictionNames.join(', ')}`);
  }
  if (dislikedList.length > 0) {
    lines.push(`❌ INGREDIENTES QUE EL USUARIO NO QUIERE: ${dislikedList.join(', ')}`);
  }
  if (extraList.length > 0) {
    lines.push(`❌ EXCLUSIONES ADICIONALES: ${extraList.join(', ')}`);
  }

  lines.push(`\nLISTA COMPLETA PROHIBIDA: ${allForbidden.join(', ')}`);
  lines.push('ANTES de finalizar tu respuesta, revisa CADA plato y CADA ingrediente de la lista contra esta lista prohibida.');
  lines.push('Si detectas alguno, REEMPLAZA el plato completo por una alternativa sin ese ingrediente.');
  lines.push('🚨 FIN RESTRICCIONES CRÍTICAS 🚨\n');

  return lines.join('\n');
}

/**
 * Map of common derived/hidden forms of allergenic ingredients (rec. #10).
 * Key: base allergen name (lowercase), Value: array of derived terms to also check.
 */
const ALLERGY_DERIVATIVES: Record<string, string[]> = {
  "gluten": ["trigo", "cebada", "centeno", "espelta", "kamut", "harina", "pan rallado", "sémola", "bulgur", "farro"],
  "leche": ["lactosa", "mantequilla", "nata", "queso", "yogur", "crema", "caseína", "suero", "ghee", "requesón"],
  "huevo": ["clara", "yema", "mayonesa", "merengue", "tortilla"],
  "cacahuete": ["maní", "mantequilla de cacahuete", "pasta de cacahuete"],
  "soja": ["tofu", "tempeh", "miso", "edamame", "tamari", "salsa de soja"],
  "marisco": ["gamba", "langostino", "cangrejo", "langosta", "bogavante", "centollo", "nécora"],
  "pescado": ["anchoa", "bacalao", "salmón", "atún", "sardina", "boquerón", "merluza", "lubina"],
  "frutos secos": ["nuez", "almendra", "avellana", "pistacho", "anacardo", "piñón", "nuez de macadamia"],
  "mostaza": ["semilla de mostaza"],
  "apio": ["semilla de apio", "sal de apio"],
  "sésamo": ["tahini", "tahína", "semilla de sésamo"],
  "sulfitos": ["dióxido de azufre", "metabisulfito"],
  "moluscos": ["mejillón", "almeja", "ostra", "calamar", "pulpo", "sepia", "caracol"],
};

/**
 * Post-generation validator: checks if any ALLERGY ingredient (or its derivatives)
 * appears in the stringified AI response. Returns a list of violations found.
 * Only flags allergies (health-critical), not dislikes. (rec. #1, #3, #10)
 */
function detectAllergyViolations(
  responseText: string,
  allergies: Array<{ allergy: { nameEs: string } }>
): string[] {
  const lowerResponse = responseText.toLowerCase();
  const violations: string[] = [];
  for (const row of allergies) {
    const name = row.allergy.nameEs.toLowerCase();
    // Check direct match
    if (name.length > 2 && lowerResponse.includes(name)) {
      violations.push(row.allergy.nameEs);
      continue;
    }
    // Check derived ingredients (rec. #10)
    const derivatives = ALLERGY_DERIVATIVES[name] ?? [];
    for (const derivative of derivatives) {
      if (lowerResponse.includes(derivative.toLowerCase())) {
        violations.push(`${row.allergy.nameEs} (derivado: ${derivative})`);
        break;
      }
    }
  }
  return violations;
}

/**
 * Async version: logs violations to DB and sends admin alert if repeated (rec. #3, #4).
 */
async function detectAndLogAllergyViolations(
  responseText: string,
  allergies: Array<{ allergy: { nameEs: string } }>,
  userId: number,
  generationType: string,
  restrictionsSnapshot?: object
): Promise<string[]> {
  const violations = detectAllergyViolations(responseText, allergies);
  if (violations.length > 0) {
    // Log to DB (rec. #3)
    try {
      await db.logAllergyViolation({
        userId,
        generationType,
        forbiddenIngredients: violations,
        detectedInText: responseText.slice(0, 500),
        restrictionsSnapshot,
      });
    } catch (_) {}
    // Check if this ingredient has been violated multiple times recently (rec. #4)
    try {
      const mainIngredient = violations[0].split(' (')[0];
      const recentCount = await db.countRecentViolationsForIngredient(mainIngredient, 24);
      if (recentCount >= 3) {
        // Send admin alert
        const { notifyOwner } = await import("./_core/notification.js");
        await notifyOwner({
          title: `🚨 ALERTA SEGURIDAD: Violación de alergia repetida`,
          content: `El ingrediente "${mainIngredient}" ha aparecido en ${recentCount} menús/recetas generados en las últimas 24h a pesar de estar marcado como alérgeno. Usuario afectado: ${userId}. Tipo: ${generationType}. Revisar el sistema de prompts urgentemente.`,
        });
      }
    } catch (_) {}
  }
  return violations;
}

// =============================================================================
// MAIN ROUTER
// =============================================================================

export const appRouter = router({
  system: systemRouter,
  company: companyRouter,
  companyReminders: companyRemindersRouter,
  codes: codesRouter,
  support: supportRouter,
  household: householdRouter,
  householdRecipes: householdRecipesRouter,
  householdMenus: householdMenusRouter,
  offlinePatients: offlinePatientsRouter,
  expertPatients: expertPatientsRouter,
  expertDashboard: expertDashboardRouter,
  expertFeatureRequests: expertFeatureRequestsRouter,
  makerAnalytics: makerAnalyticsRouter,
  contentSync: contentSyncRouter,
  weeklyCheckins: weeklyCheckinsRouter,
  sessionPackages: sessionPackagesRouter,
  retention: retentionRouter,
  buddyKids: buddyKidsRouter,
  savedMenus: savedMenusRouter,
  referral: referralRouter,
  analytics: analyticsRouter,
  wearables: wearablesRouter,
  recommendations: recommendationsRouter,
  wellnessGoals: wellnessGoalsRouter,
  healthHub: healthHubRouter,
  ecosystemSync: ecosystemSyncRouter,
  ecosystemEnhanced: ecosystemEnhancedRouter,
  expertEnhanced: expertEnhancedRouter,
  expertPro: expertProRouter,
  expertRecipes: expertRecipesRouter,
  expertMealPlanner: expertMealPlannerRouter,
  profileSetup: profileSetupRouter,
  expertDocuments: expertDocumentsRouter,
  expertBilling: expertBillingRouter,
  patientDiary: patientDiaryRouter,
  recipeImages: recipeImagesRouter,
  instagramRecipe: instagramRecipeRouter,
  quickSuggest: quickSuggestRouter,
  mealPrep: mealPrepRouter,
  sustainability: sustainabilityRouter,
  marketplace: marketplaceRouter,
  corporateDashboard: corporateDashboardRouter,
  priceCompare: priceCompareRouter,
  nutritionChat: nutritionChatRouter,
  emailCampaigns: emailCampaignsRouter,
  contextualRecommendations: contextualRecommendationsRouter,
  b2bTeams: b2bTeamsRouter,

  // ---------------------------------------------------------------------------
  // ECOSYSTEM (BuddyCoach, BuddyCare, BuddyShop)
  // ---------------------------------------------------------------------------
  ecosystem: router({
    getBuddyCoachSummary: protectedProcedure.query(async ({ ctx }) => {
      try {
        const openId = ctx.user.openId;
        const BUDDYCOACH_URL = process.env.BUDDYCOACH_API_URL ?? "https://buddycoach.io";
        const ECOSYSTEM_SECRET = process.env.ECOSYSTEM_SECRET ?? "buddyone-ecosystem-shared-secret";

        const res = await fetch(
          `${BUDDYCOACH_URL}/api/ecosystem/data?openId=${encodeURIComponent(openId)}`,
          {
            headers: {
              "x-ecosystem-secret": ECOSYSTEM_SECRET,
              "x-source-app": "buddyone",
            },
            signal: AbortSignal.timeout(5000),
          }
        );
        if (!res.ok) return null;
        const data = await res.json() as { workout?: WorkoutSummary };
        return data.workout ?? null;
      } catch {
        return null;
      }
    }),
  }),

  // ---------------------------------------------------------------------------
  // AUTH
  // ---------------------------------------------------------------------------
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      const expiredDate = new Date(0);
      // Primary clear
      ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
      // Fallback: overwrite with expired cookie using same options (only if cookie() is available)
      if (typeof ctx.res.cookie === "function") {
        ctx.res.cookie(COOKIE_NAME, "", { ...cookieOptions, expires: expiredDate, maxAge: 0 });
        // Fallback without domain (covers cookies set without domain attribute)
        ctx.res.cookie(COOKIE_NAME, "", { httpOnly: true, path: "/", sameSite: "none", secure: cookieOptions.secure, expires: expiredDate, maxAge: 0 });
        // Fallback for lax/non-HTTPS environments
        ctx.res.cookie(COOKIE_NAME, "", { httpOnly: true, path: "/", sameSite: "lax", expires: expiredDate, maxAge: 0 });
      }
      return { success: true } as const;
    }),
    // ── OTP Login ─────────────────────────────────────────────────────────
    sendOTP: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const email = input.email.toLowerCase().trim();
        // Rate limit: max 5 OTP requests per hour per email
        const recentCount = await db.countRecentOtpRequests(email, 3600000);
        if (recentCount >= 5) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Has solicitado demasiados códigos. Espera un momento antes de intentarlo de nuevo.",
          });
        }
        // Generate 6-digit OTP
        const otpCode = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const codeHash = hashOtpCode(otpCode);
        await db.createOtpToken({ email, codeHash, expiresAt });
        await sendOTPEmail(email, otpCode);
        return { success: true, message: "Código enviado. Revisa tu email." };
      }),
    verifyOTP: publicProcedure
      .input(z.object({ email: z.string().email(), code: z.string().length(6) }))
      .mutation(async ({ input, ctx }) => {
        const email = input.email.toLowerCase().trim();
        const inputHash = hashOtpCode(input.code);
        // First get the latest active token for this email to check attempts
        const latestToken = await db.getLatestActiveOtpToken(email);
        if (!latestToken) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Código no válido o expirado. Solicita uno nuevo.",
          });
        }
        // Check max attempts (5)
        if (latestToken.attempts >= 5) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Demasiados intentos fallidos. Solicita un nuevo código.",
          });
        }
        // Verify hash matches
        const token = await db.getActiveOtpTokenByHash(email, inputHash);
        if (!token) {
          await db.incrementOtpAttempts(latestToken.id);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Código incorrecto. Inténtalo de nuevo.",
          });
        }
        // Mark token as used
        await db.markOtpTokenUsed(token.id);
        // Upsert user (create if not exists)
        const openId = `otp:${email}`;
        let user = await db.getUserByEmail(email);
        if (!user) {
          await db.upsertUser({
            openId,
            email,
            loginMethod: "otp",
            lastSignedIn: new Date(),
          });
          user = await db.getUserByEmail(email);
        } else {
          await db.updateUser(user.id, { lastSignedIn: new Date(), loginMethod: "otp" });
        }
        if (!user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al crear la sesión." });
        }
        // Create session cookie
        const sessionToken = await sdk.createSessionToken(user.openId ?? openId, {
          name: user.name ?? email,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user: { id: user.id, email: user.email, name: user.name } };
      }),

    // ── Phone OTP ─────────────────────────────────────────────────────────
    sendPhoneOTP: publicProcedure
      .input(z.object({ phone: z.string().min(7).max(20) }))
      .mutation(async ({ input }) => {
        const phone = normalizePhone(input.phone);
        if (!isValidPhone(phone)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Número de teléfono no válido. Usa el formato internacional (ej: +34612345678).",
          });
        }
        const recentCount = await db.countRecentPhoneOtpRequests(phone, 3600000);
        if (recentCount >= 5) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Has solicitado demasiados códigos. Espera un momento antes de intentarlo de nuevo.",
          });
        }
        const otpCode = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const codeHash = hashOtpCode(otpCode);
        await db.createPhoneOtpToken({ phone, codeHash, expiresAt });
        await sendSMSOTP(phone, otpCode);
        return { success: true, message: "Código enviado. Revisa tus SMS.", phone };
      }),
    verifyPhoneOTP: publicProcedure
      .input(z.object({ phone: z.string().min(7).max(20), code: z.string().length(6) }))
      .mutation(async ({ input, ctx }) => {
        const phone = normalizePhone(input.phone);
        const inputHash = hashOtpCode(input.code);
        const latestToken = await db.getLatestActivePhoneOtpToken(phone);
        if (!latestToken) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Código no válido o expirado. Solicita uno nuevo.",
          });
        }
        if (latestToken.attempts >= 5) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Demasiados intentos fallidos. Solicita un nuevo código.",
          });
        }
        const token = await db.getActivePhoneOtpTokenByHash(phone, inputHash);
        if (!token) {
          await db.incrementPhoneOtpAttempts(latestToken.id);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Código incorrecto. Inténtalo de nuevo.",
          });
        }
        await db.markPhoneOtpTokenUsed(token.id);
        const openId = `phone:${phone}`;
        // First look up by phone field (covers all login methods that stored the phone)
        let user = await db.getUserByPhone(phone) ?? await db.getUserByOpenId(openId);
        if (!user) {
          // New user — create account
          await db.upsertUser({ openId, phone, loginMethod: "phone", lastSignedIn: new Date() });
          user = await db.getUserByPhone(phone) ?? await db.getUserByOpenId(openId);
        } else {
          // Existing user — update last sign-in and ensure phone is stored
          await db.updateUser(user.id, { lastSignedIn: new Date(), loginMethod: "phone", phone });
        }
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al crear la sesión." });
        const sessionToken = await sdk.createSessionToken(user.openId ?? openId, {
          name: user.name ?? phone,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user: { id: user.id, phone: user.phone, name: user.name } };
      }),
    // ── Email/Password Register ───────────────────────────────────────────
    register: publicProcedure
      .input(z.object({
        name: z.string().min(2).max(100).trim(),
        email: z.string().email(),
        password: z.string().min(8).max(128),
      }))
      .mutation(async ({ input, ctx }) => {
        const email = input.email.toLowerCase().trim();
        const existing = await db.getUserByEmail(email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe una cuenta con este email. Inicia sesión.",
          });
        }
        const passwordHash = await bcrypt.hash(input.password, 12);
        const openId = `email:${email}`;
        await db.upsertUser({
          openId,
          email,
          name: input.name,
          loginMethod: "email",
          lastSignedIn: new Date(),
        });
        const newUser = await db.getUserByEmail(email);
        if (!newUser) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al crear la cuenta." });
        const drizzleDb = await db.getDb();
        if (drizzleDb) {
          const { users } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          await drizzleDb.update(users).set({ passwordHash }).where(eq(users.id, newUser.id));
        }
        // ── Check if this is a founder email and grant PRO automatically ──────
        let isFounder = false;
        try {
          const drizzleDb2 = await db.getDb();
          if (drizzleDb2) {
            const { founderEmails } = await import("../drizzle/schema.js");
            const { eq: eqF } = await import("drizzle-orm");
            const founderRecord = await drizzleDb2
              .select()
              .from(founderEmails)
              .where(eqF(founderEmails.email, email))
              .limit(1);
            if (founderRecord.length > 0 && !founderRecord[0].claimedAt) {
              isFounder = true;
              // Activate PRO for 1 year
              await db.upsertUserSubscription(newUser.id, {
                status: "active",
                plan: "premium",
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              });
              // Mark as claimed
              await drizzleDb2
                .update(founderEmails)
                .set({ claimedAt: new Date(), claimedByUserId: newUser.id })
                .where(eqF(founderEmails.email, email));
              // In-app notification
              await createInAppNotif(newUser.id, {
                title: "\uD83C\uDF81 \u00a1Tu a\u00f1o PRO est\u00e1 activado!",
                body: "Como usuario original de BuddyOne, tienes 1 a\u00f1o de PRO gratis. \u00a1Bienvenido/a de vuelta!",
                type: "promo",
                link: "/app/dashboard",
              });
              // Send special founder welcome email (non-blocking)
              import("./email.js").then(({ sendFounderWelcomeEmail }) => {
                sendFounderWelcomeEmail({ userName: input.name, userEmail: email }).catch(() => {});
              }).catch(() => {});
              console.log(`[Register] Founder PRO activated for ${email}`);
            }
          }
        } catch (founderErr) {
          console.error("[Register] Error checking founder status:", founderErr);
        }
        // Conceder insignia de bienvenida y fundador (no bloquea)
        try {
          await db.awardBadge(newUser.id, "welcome_buddy");
          if (isFounder) await db.awardBadge(newUser.id, "founder_badge");
        } catch (badgeErr) {
          console.warn("[Register] Error awarding welcome badge:", badgeErr);
        }
        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, isFounder, user: { id: newUser.id, email: newUser.email, name: newUser.name } };
      }),
    // ── Email/Password Login ───────────────────────────────────────────────
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const email = input.email.toLowerCase().trim();
        const user = await db.getUserByEmail(email);
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email o contraseña incorrectos." });
        }
        if (!user.passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Esta cuenta usa acceso por código OTP. Usa esa opción para entrar.",
          });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email o contraseña incorrectos." });
        }
        await db.updateUser(user.id, { lastSignedIn: new Date() });
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name ?? email,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user: { id: user.id, email: user.email, name: user.name } };
      }),

    // ── Forgot Password ───────────────────────────────────────────────────
    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email(), origin: z.string().url() }))
      .mutation(async ({ input }) => {
        const email = input.email.toLowerCase().trim();
        const user = await db.getUserByEmail(email);
        if (!user) return { success: true };
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const drizzleDb = await db.getDb();
        if (drizzleDb) {
          const { users } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          await drizzleDb.update(users).set({
            passwordResetToken: token,
            passwordResetExpiresAt: expiresAt,
          }).where(eq(users.id, user.id));
        }
        const resetUrl = `${input.origin}/reset-password?token=${token}`;
        try {
          const emailMod = await import("./email.js");
          if ((emailMod as any).sendPasswordResetEmail) {
            await (emailMod as any).sendPasswordResetEmail(email, user.name ?? email, resetUrl);
          }
        } catch (_emailErr) { /* email not critical */ }
        return { success: true };
      }),

    // ── Reset Password ────────────────────────────────────────────────────
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1),
        password: z.string().min(8).max(128),
      }))
      .mutation(async ({ input, ctx }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { users } = await import("../drizzle/schema.js");
        const { eq, and, gt } = await import("drizzle-orm");
        const [user] = await drizzleDb.select().from(users).where(
          and(
            eq(users.passwordResetToken, input.token),
            gt(users.passwordResetExpiresAt, new Date()),
          )
        ).limit(1);
        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "El enlace de recuperación no es válido o ha expirado.",
          });
        }
        const passwordHash = await bcrypt.hash(input.password, 12);
        await drizzleDb.update(users).set({
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        }).where(eq(users.id, user.id));
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name ?? user.email ?? "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true };
      }),
    // ── Terms & Conditions Acceptance ────────────────────────────────────
    acceptTerms: protectedProcedure
      .input(z.object({
        termsVersion: z.string().default("2.0"),
        acceptPrivacy: z.boolean(),
        marketingConsent: z.boolean().optional().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { users: usersTable } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const now = new Date();
        await drizzleDb.update(usersTable).set({
          termsAcceptedAt: now,
          termsVersion: input.termsVersion,
          privacyAcceptedAt: input.acceptPrivacy ? now : undefined,
          marketingConsent: input.marketingConsent ?? false,
          marketingConsentAt: input.marketingConsent ? now : undefined,
        }).where(eq(usersTable.id, ctx.user.id));
        return { success: true, acceptedAt: now };
      }),
    getTermsStatus: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { users: usersTable } = await import("../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const rows = await drizzleDb.select({
        termsAcceptedAt: usersTable.termsAcceptedAt,
        termsVersion: usersTable.termsVersion,
        privacyAcceptedAt: usersTable.privacyAcceptedAt,
        marketingConsent: usersTable.marketingConsent,
        marketingConsentAt: usersTable.marketingConsentAt,
      }).from(usersTable).where(eq(usersTable.id, ctx.user.id)).limit(1);
      return rows[0] ?? null;
    }),
  }),
  // ---------------------------------------------------------------------------
  // SEED (admin only - initialize catalogs)
  // ---------------------------------------------------------------------------
  seed: router({
    catalogs: protectedProcedure.mutation(async ({ ctx }) => {
      if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      await db.seedCatalogs();
      return { success: true };
    }),
  }),

  // ---------------------------------------------------------------------------
  // USER PROFILE
  // ---------------------------------------------------------------------------
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const [profile, medicalProfile, prefs, allergiesData, restrictions, categories, subscription] = await Promise.all([
        db.getUserProfile(ctx.user.id),
        db.getUserMedicalProfile(ctx.user.id),
        db.getUserPreferences(ctx.user.id),
        db.getUserAllergies(ctx.user.id),
        db.getUserDietRestrictions(ctx.user.id),
        db.getUserFoodCategories(ctx.user.id),
        db.getUserSubscription(ctx.user.id),
      ]);
      return {
        user: ctx.user,
        profile,
        medicalProfile,
        preferences: prefs,
        allergies: allergiesData.map((a) => a.allergy),
        dietRestrictions: restrictions.map((r) => r.restriction),
        foodCategories: categories.map((c) => c.category),
        subscription,
      };
    }),

    updateBasic: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100).trim().optional(),
          phone: z.string().max(20).trim().optional(),
          description: z.string().max(500).trim().optional(),
          locale: z.string().max(10).trim().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateUser(ctx.user.id, input);
        return { success: true };
      }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          age: z.number().int().min(1).max(120).optional(),
          height: z.number().min(50).max(300).optional(),
          weight: z.number().min(20).max(500).optional(),
          targetWeight: z.number().min(20).max(500).optional(),
          gender: z.enum(["male", "female", "other"]).optional(),
          cookingLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
          activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
          mainGoal: z.enum(["lose_weight", "gain_muscle", "maintain", "improve_health", "eat_healthier"]).optional(),
          dailyCalorieGoal: z.number().optional(),
          dailyProteinGoal: z.number().optional(),
          dailyCarbsGoal: z.number().optional(),
          dailyFatGoal: z.number().optional(),
          sleepHours: z.number().min(0).max(24).optional(),
          dailyMeals: z.number().int().min(1).max(10).optional(),
          practicesSports: z.boolean().optional(),
          heightUnit: z.enum(["cm", "ft"]).optional(),
          weightUnit: z.enum(["kg", "lb"]).optional(),
          // Extended lifestyle
          sportsFrequency: z.enum(["never", "1_2_week", "3_4_week", "5_plus_week", "daily"]).optional(),
          sportsTypes: z.string().optional(),
          workType: z.enum(["sedentary_desk", "light_standing", "moderate_physical", "heavy_physical"]).optional(),
          stressLevel: z.enum(["low", "moderate", "high", "very_high"]).optional(),
          waterIntake: z.number().min(0).max(20).optional(),
          alcoholConsumption: z.enum(["none", "occasional", "moderate", "frequent"]).optional(),
          smokingStatus: z.enum(["non_smoker", "ex_smoker", "smoker"]).optional(),
          weightChangeRate: z.number().min(0).max(5).optional(),
          mealPrepTime: z.enum(["under_15", "15_30", "30_60", "over_60"]).optional(),
          budgetPerWeek: z.number().min(0).max(10000).optional(),
          favoriteCuisines: z.string().max(500).trim().optional(),
          dislikedIngredients: z.string().max(500).trim().optional(),
          cookingEquipment: z.string().max(500).trim().optional(),
          mealsPerDayDetail: z.string().max(200).trim().optional(),
          snackingHabits: z.enum(["never", "rarely", "sometimes", "often"]).optional(),
          eatOutFrequency: z.enum(["never", "1_2_month", "1_2_week", "3_plus_week"]).optional(),
          fitnessGoalDetail: z.string().max(500).trim().optional(),
          motivationLevel: z.enum(["low", "medium", "high", "very_high"]).optional(),
          previousDietExperience: z.string().max(1000).trim().optional(),
          birthYear: z.number().int().min(1900).max(2025).optional(),
          bodyFatPercentage: z.number().min(1).max(70).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Recalculate dailyCalorieGoal when physical data changes,
        // but ONLY if the user has NOT provided a manual override.
        const profileData: typeof input & { dailyCalorieGoal?: number } = { ...input };
        const hasManualCalorieOverride = input.dailyCalorieGoal !== undefined && input.dailyCalorieGoal > 0;
        const hasPhysicalData = input.height || input.weight || input.age || input.gender || input.activityLevel || input.mainGoal || input.weightChangeRate;
        if (hasPhysicalData && !hasManualCalorieOverride) {
          // Get existing profile to fill in missing values
          const existing = await db.getUserProfile(ctx.user.id);
          const height = input.height ?? existing?.height;
          const weight = input.weight ?? existing?.weight;
          const age = input.age ?? (existing?.birthYear ? new Date().getFullYear() - existing.birthYear : undefined);
          const gender = input.gender ?? existing?.gender;
          const activityLevel = input.activityLevel ?? existing?.activityLevel ?? 'moderate';
          const mainGoal = input.mainGoal ?? existing?.mainGoal;
          const weightChangeRate = input.weightChangeRate ?? existing?.weightChangeRate ?? 0.5;
          if (height && weight && age && gender) {
            // Mifflin-St Jeor formula
            const tmb = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
            const activityFactors: Record<string, number> = {
              sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
            };
            const tdee = Math.round(tmb * (activityFactors[activityLevel] ?? 1.55));
            // Apply deficit/surplus based on goal and rate
            const weeklyKcalPerKg = 7700; // ~7700 kcal per kg of body weight
            const dailyAdjustment = Math.round((weightChangeRate * weeklyKcalPerKg) / 7);
            if (mainGoal === 'lose_weight') {
              profileData.dailyCalorieGoal = Math.max(1200, tdee - dailyAdjustment);
            } else if (mainGoal === 'gain_muscle') {
              profileData.dailyCalorieGoal = Math.max(1500, tdee + dailyAdjustment);
            } else {
              profileData.dailyCalorieGoal = Math.max(1200, tdee);
            }
          }
        }
        await db.upsertUserProfile(ctx.user.id, profileData);
        return { success: true };
      }),

    updateMedical: protectedProcedure
      .input(
        z.object({
          nutritionalSupplements: z.string().max(500).trim().optional(),
          useNutritionalSupplements: z.boolean().optional(),
          medicalDiet: z.string().max(500).trim().optional(),
          hasMedicalDiet: z.boolean().optional(),
          surgery: z.string().max(500).trim().optional(),
          hasSurgery: z.boolean().optional(),
          medicalFamilyBackground: z.string().max(1000).trim().optional(),
          hasMedicalFamilyBackground: z.boolean().optional(),
          metabolismMedication: z.string().max(500).trim().optional(),
          useMetabolismMedication: z.boolean().optional(),
          medicalConditions: z.string().max(1000).trim().optional(),
          hasMedicalConditions: z.boolean().optional(),
          // New health profile fields
          dietaryPattern: z.string().max(100).trim().optional(),
          lifestyle: z.string().max(2000).trim().optional(), // JSON array
          specialNeeds: z.string().max(2000).trim().optional(), // JSON array
          pregnancyWeek: z.number().int().min(1).max(42).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserMedicalProfile(ctx.user.id, input);
        return { success: true };
      }),

    updatePreferences: protectedProcedure
      .input(
        z.object({
          purchaseFrequency: z.string().optional(),
          purchaseLocation: z.string().optional(),
          suggestHealthierProducts: z.boolean().optional(),
          suggestCheaperProducts: z.boolean().optional(),
          organicProducts: z.boolean().optional(),
          interestedInNutritionalAdvices: z.boolean().optional(),
          notifications: z.boolean().optional(),
          newsletter: z.boolean().optional(),
          acceptTerms: z.boolean().optional(),
          preferredMealComplexity: z.enum(["simple", "moderate", "complex"]).optional(),
          portionSize: z.enum(["small", "medium", "large"]).optional(),
          preferSeasonalIngredients: z.boolean().optional(),
          preferLocalProducts: z.boolean().optional(),
          avoidProcessedFood: z.boolean().optional(),
          interestedInMealPrep: z.boolean().optional(),
          wantsShoppingListAutomation: z.boolean().optional(),
          wantsCalorieTracking: z.boolean().optional(),
          wantsMacroTracking: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserPreferences(ctx.user.id, input);
        return { success: true };
      }),

    setAllergies: protectedProcedure
      .input(z.object({
        allergyIds: z.array(z.number()),
        severities: z.record(z.string(), z.enum(["medical", "intolerance", "preference"])).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get current allergies to compute diff for history log (rec. #5)
        const currentAllergies = await db.getUserAllergies(ctx.user.id);
        const currentIds = new Set(currentAllergies.map((a) => a.allergy.id));
        const newIds = new Set(input.allergyIds);
        const allAllergies = await db.getAllAllergies();
        const allergyMap = new Map(allAllergies.map((a) => [a.id, a.nameEs]));
        // Log removed allergies
        for (const id of Array.from(currentIds)) {
          if (!newIds.has(id)) {
            await db.logAllergyChange({
              userId: ctx.user.id, allergyId: id,
              allergyNameEs: allergyMap.get(id) ?? String(id),
              action: "removed",
              severity: input.severities?.[String(id)] ?? "medical",
            });
          }
        }
        // Log added allergies
        for (const id of Array.from(newIds)) {
          if (!currentIds.has(id)) {
            await db.logAllergyChange({
              userId: ctx.user.id, allergyId: id,
              allergyNameEs: allergyMap.get(id) ?? String(id),
              action: "added",
              severity: input.severities?.[String(id)] ?? "medical",
            });
          }
        }
        // Save allergies
        await db.setUserAllergies(ctx.user.id, input.allergyIds);
        // Save severity for each allergy (rec. #8)
        if (input.severities) {
          for (const [allergyIdStr, severity] of Object.entries(input.severities)) {
            const allergyId = parseInt(allergyIdStr);
            if (!isNaN(allergyId) && newIds.has(allergyId)) {
              await db.upsertUserAllergySeverity(ctx.user.id, allergyId, severity);
            }
          }
        }
        return { success: true };
      }),


    setDietRestrictions: protectedProcedure
      .input(z.object({ restrictionIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        await db.setUserDietRestrictions(ctx.user.id, input.restrictionIds);
        return { success: true };
      }),

    setFoodCategories: protectedProcedure
      .input(z.object({ categoryIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        await db.setUserFoodCategories(ctx.user.id, input.categoryIds);
        return { success: true };
      }),

    completeOnboarding: protectedProcedure
      .input(z.object({
        mainGoal: z.string().optional(),
        restrictions: z.array(z.string()).optional(),
        dailyMeals: z.number().int().min(1).max(8).optional(),
        mealTimes: z.array(z.string()).optional(),
        mealPrepTime: z.string().optional(),
        budgetPerWeek: z.number().min(0).optional(),
        cookingLevel: z.string().optional(),
        generateMenu: z.boolean().optional(),
        // Datos físicos para cálculo TMB/TDEE (Mifflin-St Jeor)
        gender: z.enum(["male", "female"]).optional(),
        age: z.number().int().min(15).max(100).optional(),
        heightCm: z.number().min(100).max(250).optional(),
        weightKg: z.number().min(30).max(300).optional(),
        activityLevel: z.string().optional(),
        dailyCalorieGoal: z.number().optional(),
        basalMetabolicRate: z.number().optional(),
      }).optional())
      .mutation(async ({ ctx, input }) => {
      await db.updateUser(ctx.user.id, { onboardingCompleted: true, registrationStep: "completed" as any });

      // Save profile data from setup wizard
      if (input) {
        const drizzleDb = await db.getDb();
        if (drizzleDb) {
          const { userProfiles, userDietRestrictions, dietRestrictions } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          // Upsert user profile
          const existing = await drizzleDb.select().from(userProfiles).where(eq(userProfiles.userId, ctx.user.id)).limit(1);
          const profileData: Record<string, unknown> = { userId: ctx.user.id };
          if (input.mainGoal) profileData.mainGoal = input.mainGoal as any;
          if (input.dailyMeals) profileData.dailyMeals = input.dailyMeals;
          if (input.mealPrepTime) profileData.mealPrepTime = input.mealPrepTime as any;
          if (input.budgetPerWeek !== undefined) profileData.budgetPerWeek = input.budgetPerWeek;
          if (input.cookingLevel) profileData.cookingLevel = input.cookingLevel as any;
          if (input.mealTimes) profileData.mealsPerDayDetail = JSON.stringify(input.mealTimes);
          // Datos físicos y calorías calculadas
          if (input.gender) profileData.gender = input.gender as any;
          if (input.age) profileData.age = input.age;
          if (input.heightCm) profileData.height = input.heightCm;
          if (input.weightKg) profileData.weight = input.weightKg;
          if (input.activityLevel) profileData.activityLevel = input.activityLevel as any;
          if (input.dailyCalorieGoal) profileData.dailyCalorieGoal = input.dailyCalorieGoal;
          if (input.basalMetabolicRate) profileData.basalMetabolicRate = input.basalMetabolicRate;
          if (existing.length > 0) {
            await drizzleDb.update(userProfiles).set(profileData).where(eq(userProfiles.userId, ctx.user.id));
          } else {
            await drizzleDb.insert(userProfiles).values(profileData as any);
          }
          // Save diet restrictions
          if (input.restrictions && input.restrictions.length > 0 && !input.restrictions.includes("ninguna")) {
            const allRestrictions = await drizzleDb.select().from(dietRestrictions);
            for (const rName of input.restrictions) {
              const found = allRestrictions.find((r) => r.nameEs.toLowerCase().includes(rName.toLowerCase()) || rName.toLowerCase().includes(r.nameEs.toLowerCase()) || r.apiParam.toLowerCase().includes(rName.toLowerCase()));
              if (found) {
                try {
                  await drizzleDb.insert(userDietRestrictions).values({ userId: ctx.user.id, dietRestrictionId: found.id });
                } catch (_) { /* ignore duplicate */ }
              }
            }
          }
          // Generate first menu with AI if requested
          if (input.generateMenu) {
            try {
              const { invokeLLM } = await import("./_core/llm");
              const goalLabel: Record<string, string> = {
                lose_weight: "pérdida de peso", gain_muscle: "ganancia muscular",
                maintain: "mantenimiento", improve_health: "mejorar salud", eat_healthier: "comer más sano"
              };
              // Calcular calorías en servidor si no vienen del cliente
              let serverCalorieGoal = input.dailyCalorieGoal;
              if (!serverCalorieGoal && input.gender && input.age && input.heightCm && input.weightKg) {
                const tmb = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + (input.gender === 'male' ? 5 : -161);
                const activityFactors: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
                const tdee = Math.round(tmb * (activityFactors[input.activityLevel ?? 'moderate'] ?? 1.375));
                if (input.mainGoal === 'lose_weight') serverCalorieGoal = Math.max(1200, tdee - 400);
                else if (input.mainGoal === 'gain_muscle') serverCalorieGoal = Math.max(1500, tdee + 250);
                else serverCalorieGoal = Math.max(1200, tdee);
              }
              const calorieInfo = serverCalorieGoal
                ? `Calorías objetivo diarias: ${serverCalorieGoal} kcal (calculadas con Mifflin-St Jeor). Distribuye las calorías entre las comidas del día de forma equilibrada.`
                : 'Calorías: ajusta según el objetivo declarado.';
              const physicalInfo = (input.gender && input.age && input.heightCm && input.weightKg)
                ? `Perfil físico: ${input.gender === 'male' ? 'hombre' : 'mujer'}, ${input.age} años, ${input.heightCm} cm, ${input.weightKg} kg, actividad: ${input.activityLevel ?? 'moderada'}.`
                : '';
              // Menstrual cycle phase (for women with tracking enabled)
              const setupCycleData = await db.getMenstrualCycleData(ctx.user.id);
              const setupCycleBlock = db.buildCyclePhaseBlock(setupCycleData?.phaseInfo);
              const prompt = `Eres un nutricionista experto. Genera un menú semanal personalizado en JSON para un usuario con objetivo: ${goalLabel[input.mainGoal ?? ""] ?? input.mainGoal}. ${physicalInfo} ${calorieInfo} ${setupCycleBlock} Restricciones: ${(input.restrictions ?? []).join(", ") || "ninguna"}. Comidas al día: ${input.dailyMeals ?? 3} (${(input.mealTimes ?? []).join(", ")}). Tiempo de cocina: ${input.mealPrepTime ?? "15_30"} min. Presupuesto: ${input.budgetPerWeek ?? 60}€/semana. Nivel: ${input.cookingLevel ?? "intermediate"}.

REGLAS OBLIGATORIAS POR FRANJA HORARIA:
- DESAYUNO: tostadas, cereales, avena, yogur, fruta, huevos revueltos, smoothie, batido, pan con aceite. NUNCA ensaladas, guisos, arroces, pastas, carnes asadas, pescados al horno, legumbres.
- MEDIA MAÑANA: snack pequeño (fruta, yogur, frutos secos, barrita). NUNCA platos completos.
- COMIDA: plato principal completo con proteína + carbohidrato + verdura. Aquí sí pueden ir ensaladas, arroces, pastas, carnes, pescados, legumbres.
- MERIENDA: snack pequeño (fruta, yogur, tostada). NUNCA platos completos.
- CENA: comida ligera (ensalada, crema de verduras, pescado a la plancha, tortilla, revueltos). Evitar platos muy pesados.

Devuelve SOLO JSON válido con esta estructura:
{
  "name": "Menú personalizado - [objetivo]",
  "description": "descripción breve",
  "days": [
    { "day": 1, "meals": [{"mealTime": "desayuno", "recipeName": "...", "kcal": 350}, ...] },
    ...
  ]
}`;
              const aiResp = await invokeLLM({
                messages: [
                  { role: "system", content: "Eres un nutricionista experto. Responde SOLO con JSON válido, sin markdown." },
                  { role: "user", content: prompt },
                ],
                response_format: { type: "json_object" },
              });
              const rawContent = aiResp?.choices?.[0]?.message?.content;
              const content = typeof rawContent === "string" ? rawContent : null;
              if (content) {
                const parsed = JSON.parse(content);
                // Save as user menu
                const { menuOrganizers, menuOrganizerDayParts, menuOrganizerDayPartRecipes, dayParts, recipes: recipesTable } = await import("../drizzle/schema");
                const allRecipes = await drizzleDb.select({ id: recipesTable.id, name: recipesTable.name }).from(recipesTable).limit(500);
                const allDayParts = await drizzleDb.select().from(dayParts);
                const now = new Date();
                const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const [menuInsert] = await drizzleDb.insert(menuOrganizers).values({
                  userId: ctx.user.id,
                  name: parsed.name ?? "Mi primer menú",
                  startDate: now.toISOString().split("T")[0],
                  endDate: nextWeek.toISOString().split("T")[0],
                  type: "weekly",
                  isActive: true,
                  generatedByAI: true,
                  persons: 1,
                  objective: parsed.description ?? "",
                }).returning({ id: menuOrganizers.id });
                const menuId = menuInsert?.id;
                if (menuId && parsed.days) {
                  for (const dayData of parsed.days) {
                    if (dayData.meals) {
                      for (const meal of dayData.meals) {
                        const mealTimeName = meal.mealTime ?? "comida";
                        // Mapa de nombres alternativos para mejorar el matching
                        const mealTimeAliases: Record<string, string[]> = {
                          breakfast: ["desayuno", "breakfast"],
                          mid_morning: ["media_manana", "media mañana", "media manana", "mid_morning", "mid morning", "almuerzo"],
                          lunch: ["comida", "almuerzo", "lunch"],
                          afternoon_snack: ["merienda", "afternoon_snack", "snack"],
                          dinner: ["cena", "dinner"],
                        };
                        const normalizedMeal = mealTimeName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_-]+/g, "_");
                        const dayPart = allDayParts.find((dp) => {
                          const aliases = mealTimeAliases[dp.apiParam ?? ""] ?? [];
                          return aliases.some(a => normalizedMeal.includes(a.replace(/[\s_-]+/g, "_")) || a.replace(/[\s_-]+/g, "_").includes(normalizedMeal)) ||
                            dp.nameEs?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_-]+/g, "_").includes(normalizedMeal) ||
                            normalizedMeal.includes((dp.nameEs ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_-]+/g, "_")) ||
                            dp.apiParam?.toLowerCase().replace(/[\s_-]+/g, "_").includes(normalizedMeal);
                        });
                        if (!dayPart) continue;
                        const [dpInsert] = await drizzleDb.insert(menuOrganizerDayParts).values({
                          menuOrganizerId: menuId,
                          dayPartId: dayPart.id,
                          dayNumber: dayData.day,
                          name: mealTimeName,
                        }).returning({ id: menuOrganizerDayParts.id });
                        const dpId = dpInsert?.id;
                        if (dpId) {
                          const matched = allRecipes.find((r) => r.name.toLowerCase().includes((meal.recipeName ?? "").toLowerCase().slice(0, 10)));
                          if (matched) {
                            try {
                              await drizzleDb.insert(menuOrganizerDayPartRecipes).values({ menuOrganizerDayPartId: dpId, recipeId: matched.id, servings: 1 });
                            } catch (_) { /* ignore duplicate */ }
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (err) {
              console.error("[BuddySetup] Error generating first menu:", err);
            }
          }
        }
      }
      // Send welcome email asynchronously (don't block the response)
      if (ctx.user.email) {
        const { sendWelcomeEmail, scheduleOnboardingSequence } = await import("./email");
        sendWelcomeEmail({
          to: ctx.user.email,
          name: ctx.user.name ?? ctx.user.email,
          accountType: (ctx.user as any).accountType ?? "user",
        }).catch((err) => console.error("[Email] Welcome email error:", err));
        scheduleOnboardingSequence({
          userId: ctx.user.id,
          email: ctx.user.email,
          name: ctx.user.name ?? ctx.user.email,
        }).catch((err) => console.error("[Email] Schedule sequence error:", err));
      }
      // Welcome in-app notification
      createInAppNotif(ctx.user.id, {
        title: `Bienvenido a BuddyOne, ${ctx.user.name?.split(" ")[0] || "usuario"}!`,
        body: "Tu perfil esta listo. Explora recetas, genera menus con IA y lleva un seguimiento de tu nutricion diaria.",
        type: "success",
        link: "/app/dashboard",
      });
      return { success: true };
    }),

    // ── Registration flow ──────────────────────────────────────────
    getRegistrationStatus: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { users: usersTable, buddyApplications: appsTable } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const userRows = await drizzleDb.select().from(usersTable).where(eq(usersTable.id, ctx.user.id)).limit(1);
      const user = userRows[0];
      if (!user) return null;
      const apps = await drizzleDb.select().from(appsTable)
        .where(eq(appsTable.userId, ctx.user.id))
        .orderBy(desc(appsTable.appliedAt))
        .limit(1);
      const latestApp = apps[0] ?? null;
      return {
        accountType: (user as any).accountType ?? "user",
        registrationStep: (user as any).registrationStep ?? "account_type",
        onboardingCompleted: user.onboardingCompleted,
        application: latestApp ? {
          id: latestApp.id,
          type: latestApp.type,
          status: latestApp.status,
          adminNote: latestApp.adminNote,
          appliedAt: latestApp.appliedAt,
        } : null,
      };
    }),

    setAccountType: protectedProcedure
      .input(z.object({
        accountType: z.enum(["user", "buddymaker", "buddyexpert", "business"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const nextStep = "profile_setup";
        await db.updateUser(ctx.user.id, {
          accountType: input.accountType as any,
          registrationStep: nextStep as any,
        });
        return { success: true, nextStep };
      }),

    advanceRegistrationStep: protectedProcedure
      .input(z.object({
        step: z.enum(["profile_setup", "application", "pending_approval", "completed"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUser(ctx.user.id, { registrationStep: input.step as any });
        // Send welcome email when a regular user completes registration
        if (input.step === "completed" && ctx.user.email) {
           const { sendWelcomeEmail, scheduleOnboardingSequence } = await import("./email");
          sendWelcomeEmail({
            to: ctx.user.email,
            name: ctx.user.name ?? ctx.user.email,
            accountType: (ctx.user as any).accountType ?? "user",
          }).catch((err) => console.error("[Email] Welcome email error:", err));
          scheduleOnboardingSequence({
            userId: ctx.user.id,
            email: ctx.user.email,
            name: ctx.user.name ?? ctx.user.email,
          }).catch((err) => console.error("[Email] Schedule sequence error:", err));
        }
        return { success: true };
      }),
    submitRegistrationApplication: protectedProcedure
      .input(z.object({
        type: z.enum(["expert", "maker"]),
        displayName: z.string().min(2).max(128),
        bio: z.string().max(1000).optional(),
        specialty: z.string().max(128).optional(),
        instagramHandle: z.string().max(64).optional(),
        youtubeHandle: z.string().max(64).optional(),
        tiktokHandle: z.string().max(64).optional(),
        websiteUrl: z.string().optional(),
        motivation: z.string().max(2000).optional(),
        experience: z.string().max(2000).optional(),
        expertCategory: z.string().max(64).optional(),
        certifications: z.string().max(2000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyApplications: appsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await drizzleDb.select().from(appsTable)
          .where(eq(appsTable.userId, ctx.user.id))
          .limit(1);
        if (existing.length && existing[0].status === "pending") {
          throw new TRPCError({ code: "CONFLICT", message: "Ya tienes una solicitud pendiente de revisión" });
        }
        await drizzleDb.insert(appsTable).values({
          userId: ctx.user.id,
          type: input.type,
          displayName: input.displayName,
          bio: input.bio ?? null,
          specialty: input.specialty ?? null,
          instagramHandle: input.instagramHandle ?? null,
          youtubeHandle: input.youtubeHandle ?? null,
          tiktokHandle: input.tiktokHandle ?? null,
          websiteUrl: input.websiteUrl || null,
          motivation: input.motivation ?? null,
          experience: input.experience ?? null,
          expertCategory: input.expertCategory ?? null,
          certifications: input.certifications ?? null,
          status: "pending",
        });
        await db.updateUser(ctx.user.id, { registrationStep: "pending_approval" as any });
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({
          title: `Nueva solicitud de ${input.type === "expert" ? "BuddyExpert" : "BuddyMaker"}: ${input.displayName}`,
          content: `El usuario ${ctx.user.name ?? ctx.user.email ?? ctx.user.id} ha solicitado ser ${input.type === "expert" ? "BuddyExpert" : "BuddyMaker"}. Especialidad: ${input.specialty ?? "No especificada"}. Revísala en el panel de administración.`,
        });
        return { success: true };
      }),

    deleteAccount: protectedProcedure
      .input(z.object({ confirmation: z.literal("DELETE MY ACCOUNT") }))
      .mutation(async ({ ctx }) => {
        await db.deleteUserAccount(ctx.user.id);
        return { success: true };
      }),

    // -- Export all user data (GDPR-compliant data portability) ---------------
    exportMyData: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user.id;
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { userProfiles, userMedicalProfiles, userPreferences, userAllergies, userDietRestrictions,
          userHealthMetrics, mealLogs, menuOrganizers, shoppingLists, userInventoryItems, userFavoriteRecipes } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const [profile, medicalProfile, preferences, allergies, dietRestrictions, metrics, logs, menus, lists, inventory, favorites] = await Promise.all([
          drizzleDb.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1),
          drizzleDb.select().from(userMedicalProfiles).where(eq(userMedicalProfiles.userId, userId)).limit(1),
          drizzleDb.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1),
          drizzleDb.select().from(userAllergies).where(eq(userAllergies.userId, userId)),
          drizzleDb.select().from(userDietRestrictions).where(eq(userDietRestrictions.userId, userId)),
          drizzleDb.select().from(userHealthMetrics).where(eq(userHealthMetrics.userId, userId)).orderBy(userHealthMetrics.recordedAt),
          drizzleDb.select().from(mealLogs).where(eq(mealLogs.userId, userId)).orderBy(mealLogs.logDate).limit(500),
          drizzleDb.select().from(menuOrganizers).where(eq(menuOrganizers.userId, userId)).limit(50),
          drizzleDb.select().from(shoppingLists).where(eq(shoppingLists.userId, userId)).limit(50),
          drizzleDb.select().from(userInventoryItems).where(eq(userInventoryItems.userId, userId)).limit(200),
          drizzleDb.select().from(userFavoriteRecipes).where(eq(userFavoriteRecipes.userId, userId)),
        ]);

        return {
          exportedAt: new Date().toISOString(),
          user: { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email },
          profile: profile[0] ?? null,
          medicalProfile: medicalProfile[0] ?? null,
          preferences: preferences[0] ?? null,
          allergies,
          dietRestrictions,
          healthMetrics: metrics,
          mealLogs: logs,
          menus,
          shoppingLists: lists,
          inventory,
          favoriteRecipes: favorites,
        };
      }),

    // -- Upload profile photo to S3 and update imageUrl/avatarUrl ---------------
    uploadProfilePhoto: protectedProcedure
      .input(z.object({
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { users: usersTable, buddyExperts: beTable, buddyMakers: bmTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const imageBuffer = Buffer.from(input.imageBase64, "base64");
        const ext = input.mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
        const fileKey = `profile-photos/${ctx.user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, imageBuffer, input.mimeType);
        // Update imageUrl on the users table
        await drizzleDb.update(usersTable).set({ imageUrl: url }).where(eq(usersTable.id, ctx.user.id));
        // Also sync avatarUrl on buddyExperts if the user is an expert
        const expertRow = await drizzleDb.select({ id: beTable.id }).from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (expertRow.length > 0) {
          await drizzleDb.update(beTable).set({ avatarUrl: url }).where(eq(beTable.userId, ctx.user.id));
        }
        // Also sync avatarUrl on buddyMakers if the user is a maker
        const makerRow = await drizzleDb.select({ id: bmTable.id }).from(bmTable).where(eq(bmTable.userId, ctx.user.id)).limit(1);
        if (makerRow.length > 0) {
          await drizzleDb.update(bmTable).set({ avatarUrl: url }).where(eq(bmTable.userId, ctx.user.id));
        }
        return { url };
      }),

    getMenuPreferences: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getUserProfile(ctx.user.id);
      if (!profile) return null;
      return {
        dietType: profile.menuDietType ?? undefined,
        allergies: profile.menuAllergies ? (() => { try { return JSON.parse(profile.menuAllergies!); } catch { return []; } })() : [],
        restrictions: profile.menuRestrictions ? (() => { try { return JSON.parse(profile.menuRestrictions!); } catch { return []; } })() : [],
        dislikedFoods: profile.menuDislikedFoods ?? "",
        proteinSource: profile.menuProteinSource ?? undefined,
        cookingTime: profile.menuCookingTime ?? undefined,
        cookingSkill: profile.menuCookingSkill ?? undefined,
        kitchenEquipment: profile.menuKitchenEquipment ? (() => { try { return JSON.parse(profile.menuKitchenEquipment!); } catch { return []; } })() : [],
        supplementsUsed: profile.menuSupplements ?? "",
        specialNotes: profile.menuSpecialNotes ?? "",
        persons: profile.menuPersons ?? 1,
        mealsPerDay: profile.menuMealsPerDay ?? 3,
        updatedAt: profile.menuPreferencesUpdatedAt ?? null,
      };
    }),

    saveMenuPreferences: protectedProcedure
      .input(z.object({
        dietType: z.string().max(32).optional(),
        allergies: z.array(z.string()).optional(),
        restrictions: z.array(z.string()).optional(),
        dislikedFoods: z.string().max(1000).optional(),
        proteinSource: z.string().max(32).optional(),
        cookingTime: z.string().max(32).optional(),
        cookingSkill: z.string().max(32).optional(),
        kitchenEquipment: z.array(z.string()).optional(),
        supplementsUsed: z.string().max(500).optional(),
        specialNotes: z.string().max(1000).optional(),
        persons: z.number().int().min(1).max(20).optional(),
        mealsPerDay: z.number().int().min(1).max(8).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
        const { userProfiles } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await drizzleDb.select({ id: userProfiles.id }).from(userProfiles).where(eq(userProfiles.userId, ctx.user.id)).limit(1);
        const profileData: Record<string, unknown> = {
          menuPreferencesUpdatedAt: new Date(),
        };
        if (input.dietType !== undefined) profileData.menuDietType = input.dietType || null;
        if (input.allergies !== undefined) profileData.menuAllergies = JSON.stringify(input.allergies);
        if (input.restrictions !== undefined) profileData.menuRestrictions = JSON.stringify(input.restrictions);
        if (input.dislikedFoods !== undefined) profileData.menuDislikedFoods = input.dislikedFoods;
        if (input.proteinSource !== undefined) profileData.menuProteinSource = input.proteinSource || null;
        if (input.cookingTime !== undefined) profileData.menuCookingTime = input.cookingTime || null;
        if (input.cookingSkill !== undefined) profileData.menuCookingSkill = input.cookingSkill || null;
        if (input.kitchenEquipment !== undefined) profileData.menuKitchenEquipment = JSON.stringify(input.kitchenEquipment);
        if (input.supplementsUsed !== undefined) profileData.menuSupplements = input.supplementsUsed;
        if (input.specialNotes !== undefined) profileData.menuSpecialNotes = input.specialNotes;
        if (input.persons !== undefined) profileData.menuPersons = input.persons;
        if (input.mealsPerDay !== undefined) profileData.menuMealsPerDay = input.mealsPerDay;
        if (existing.length > 0) {
          await drizzleDb.update(userProfiles).set(profileData).where(eq(userProfiles.userId, ctx.user.id));
        } else {
          await drizzleDb.insert(userProfiles).values({ userId: ctx.user.id, ...profileData } as any);
        }
        return { success: true };
      }),
  }),

  // ---------------------------------------------------------------------------
  // CATALOGS
  // ---------------------------------------------------------------------------
  catalogs: router({
    allergies: publicProcedure.query(() => db.getAllAllergies()),
    dietRestrictions: publicProcedure.query(() => db.getAllDietRestrictions()),
    foodCategories: publicProcedure.query(() => db.getAllFoodCategories()),
    measures: publicProcedure.query(() => db.getAllMeasures()),
    dayParts: publicProcedure.query(() => db.getAllDayParts()),
    storageLocations: publicProcedure.query(() => db.getAllStorageLocations()),
  }),

  // ---------------------------------------------------------------------------
  // INGREDIENTS
  // ---------------------------------------------------------------------------
  ingredients: router({
    search: publicProcedure
       .input(z.object({ query: z.string().min(1).max(100).trim(), limit: z.number().int().min(1).max(50).optional() }))
      .query(({ input }) => db.searchIngredients(input.query, input.limit)),
    getAll: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).optional(), offset: z.number().int().min(0).optional() }))
      .query(({ input }) => db.getAllIngredients(input.limit, input.offset)),

    getById: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ input }) => db.getIngredientById(input.id)),

    create: protectedProcedure
      .input(
        z.object({
          apiParam: z.string().min(1).max(100).trim(),
          nameEs: z.string().min(1).max(150).trim(),
          nameEn: z.string().max(150).trim().optional(),
          imageUrl: z.string().url().optional(),
          calories: z.number().min(0).max(9000).optional(),
          proteins: z.number().min(0).max(500).optional(),
          carbohydrates: z.number().min(0).max(500).optional(),
          fats: z.number().min(0).max(500).optional(),
          fiber: z.number().min(0).max(200).optional(),
          sugars: z.number().min(0).max(500).optional(),
          sodium: z.number().min(0).max(50000).optional(),
          allergyIds: z.array(z.number().int().positive()).max(20).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const { allergyIds, ...data } = input;
        return db.createIngredientWithAllergies(data as any, allergyIds || []);
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), data: z.record(z.string().max(50), z.unknown()) }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        await db.updateIngredient(input.id, input.data as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        await db.deleteIngredient(input.id);
        return { success: true };
      }),
  }),

  // ---------------------------------------------------------------------------
  // RECIPES
  // ---------------------------------------------------------------------------
  recipes: router({
    list: publicProcedure
      .input(
        z.object({
          search: z.string().max(200).trim().optional(),
          userId: z.number().int().positive().optional(),
          categoryIds: z.array(z.number().int().positive()).max(20).optional(),
          allergyIds: z.array(z.number().int().positive()).max(20).optional(),
          restrictionIds: z.array(z.number().int().positive()).max(20).optional(),
          difficulty: z.enum(["facil", "medio", "dificil"]).optional(),
          maxTime: z.number().int().min(0).max(1440).optional(),
          minCalories: z.number().int().min(0).max(5000).optional(),
          maxCalories: z.number().int().min(0).max(5000).optional(),
          isPublic: z.boolean().optional(),
          mealTime: z.string().max(50).trim().optional(),
          tag: z.string().max(50).trim().optional(),
          buddyMakerId: z.number().int().positive().optional(),
          isSeeded: z.boolean().optional(),
          excludeUserAllergens: z.boolean().optional(),
          cuisineType: z.string().max(50).trim().optional(),
          cookingMethod: z.string().max(50).trim().optional(),
          foodType: z.string().max(50).trim().optional(),
          limit: z.number().int().min(1).max(100).optional(),
          cursor: z.number().int().min(0).optional(), // offset cursor for infinite scroll
        })
      )
      .query(async ({ input, ctx }) => {
        const limit = input.limit ?? 20;
        const offset = input.cursor ?? 0;
        const items = await db.getRecipes({ ...input, limit: limit + 1, offset, currentUserId: ctx.user?.id });
        const hasMore = items.length > limit;
        const recipes = hasMore ? items.slice(0, limit) : items;
        const nextCursor = hasMore ? offset + limit : undefined;
        return { recipes, nextCursor, total: undefined };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const recipe = await db.getRecipeById(input.id);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        const [ingredients, steps, categories, recipeAllergies] = await Promise.all([
          db.getRecipeIngredients(input.id),
          db.getRecipeSteps(input.id),
          db.getRecipeCategories(input.id),
          db.getRecipeAllergies(input.id),
        ]);
        return { ...recipe, ingredients, steps, categories: categories.map((c) => c.category), allergies: recipeAllergies.map((a) => a.allergy) };
      }),

    searchSuggestions: publicProcedure
      .input(z.object({ query: z.string().min(1).max(100).trim(), limit: z.number().int().min(1).max(50).optional() }))
      .query(({ input }) => db.searchRecipeSuggestions(input.query, input.limit ?? 8)),
    myRecipes: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).optional(), offset: z.number().int().min(0).optional() }))
      .query(({ ctx, input }) => db.getRecipes({ userId: ctx.user.id, ...input })),

    favorites: protectedProcedure.query(async ({ ctx }) => {
      const favs = await db.getFavoriteRecipes(ctx.user.id);
      return favs.map((f) => f.recipe);
    }),

    toggleFavorite: protectedProcedure
      .input(z.object({ recipeId: z.number() }))
      .mutation(({ ctx, input }) => db.toggleFavoriteRecipe(ctx.user.id, input.recipeId)),

    isFavorite: protectedProcedure
      .input(z.object({ recipeId: z.number() }))
      .query(({ ctx, input }) => db.isRecipeFavorite(ctx.user.id, input.recipeId)),

    getFavoriteIds: protectedProcedure.query(async ({ ctx }) => {
      const favs = await db.getFavoriteRecipes(ctx.user.id);
      return favs.map((f) => f.recipe.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre no puede superar 100 caracteres").trim(),
          description: z.string().max(2000, "La descripción no puede superar 2000 caracteres").optional(),
          imageUrl: z.string().url("URL de imagen inválida").optional().or(z.literal("")),
          preparationTime: z.number().int().min(0).max(1440, "El tiempo de preparación no puede superar 24 horas").optional(),
          cookTime: z.number().int().min(0).max(1440, "El tiempo de cocción no puede superar 24 horas").optional(),
          servings: z.number().int().min(1, "Mínimo 1 ración").max(100, "Máximo 100 raciones").optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
          isPublic: z.boolean().optional(),
          mealTime: z.string().optional(),
          calories: z.number().int().min(0).optional(),
          protein: z.number().min(0).optional(),
          carbs: z.number().min(0).optional(),
          fat: z.number().min(0).optional(),
          ingredientsJson: z.string().optional(),
          instructionsJson: z.string().optional(),
          categoryIds: z.array(z.number().int().positive()).max(10, "Máximo 10 categorías").optional(),
          allergyIds: z.array(z.number().int().positive()).max(20, "Máximo 20 alergias").optional(),
          restrictionIds: z.array(z.number().int().positive()).max(20, "Máximo 20 restricciones").optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tier = await getUserPlanTier(ctx.user.id, ctx.user.role);
        requirePlanFeature(tier, "canCreateRecipes");
        const { categoryIds, allergyIds, restrictionIds, calories, protein, carbs, fat, ...recipeData } = input;
        const result = await db.createRecipe({
          ...recipeData,
          userId: ctx.user.id,
          caloriesPerServing: calories,
          proteinsPerServing: protein,
          carbsPerServing: carbs,
          fatsPerServing: fat,
          mealTime: (recipeData.mealTime as any) ?? "cualquiera",
        });
        if (result) {
          await Promise.all([
            categoryIds?.length ? db.setRecipeCategories(result.id, categoryIds) : Promise.resolve(),
            allergyIds?.length ? db.setRecipeAllergies(result.id, allergyIds) : Promise.resolve(),
            restrictionIds?.length ? db.setRecipeDietRestrictions(result.id, restrictionIds) : Promise.resolve(),
          ]);
        }
        return result;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(2).max(100).trim().optional(),
          description: z.string().max(2000).optional(),
          imageUrl: z.string().url().optional().or(z.literal("")),
          preparationTime: z.number().int().min(0).max(1440).optional(),
          cookTime: z.number().int().min(0).max(1440).optional(),
          servings: z.number().int().min(1).max(100).optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
          isPublic: z.boolean().optional(),
          categoryIds: z.array(z.number().int().positive()).max(10).optional(),
          allergyIds: z.array(z.number().int().positive()).max(20).optional(),
          restrictionIds: z.array(z.number().int().positive()).max(20).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getRecipeById(input.id);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(recipe.userId, ctx.user.id, ctx.user.role);
        const { id, categoryIds, allergyIds, restrictionIds, ...data } = input;
        await db.updateRecipe(id, data);
        if (categoryIds) await db.setRecipeCategories(id, categoryIds);
        if (allergyIds) await db.setRecipeAllergies(id, allergyIds);
        if (restrictionIds) await db.setRecipeDietRestrictions(id, restrictionIds);
        // Award badges when sharing a recipe for the first time
        if (data.isPublic === true && !recipe.isPublic) {
          try {
            const drizzleDb = await db.getDb();
            if (drizzleDb) {
              const { recipes: recipesTable } = await import("../drizzle/schema.js");
              const { eq, and, count } = await import("drizzle-orm");
              const [sharedCount] = await drizzleDb.select({ count: count() }).from(recipesTable)
                .where(and(eq(recipesTable.userId, ctx.user.id), eq(recipesTable.isPublic, true)));
              const total = Number(sharedCount?.count ?? 0);
              if (total >= 1) await db.awardBadge(ctx.user.id, "first_share");
              if (total >= 5) await db.awardBadge(ctx.user.id, "recipe_sharer");
              if (total >= 10) await db.awardBadge(ctx.user.id, "recipe_influencer");
            }
          } catch { /* non-critical */ }
        }
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getRecipeById(input.id);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(recipe.userId, ctx.user.id, ctx.user.role);
        await db.deleteRecipe(input.id);
        return { success: true };
      }),

    addIngredient: protectedProcedure
      .input(
        z.object({
          recipeId: z.number(),
          ingredientId: z.number(),
          measureId: z.number().optional(),
          amount: z.number(),
          optional: z.boolean().optional(),
          notes: z.string().optional(),
          order: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getRecipeById(input.recipeId);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(recipe.userId, ctx.user.id, ctx.user.role);
        await db.addRecipeIngredient(input);
        return { success: true };
      }),

    removeIngredient: protectedProcedure
      .input(z.object({ id: z.number(), recipeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getRecipeById(input.recipeId);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(recipe.userId, ctx.user.id, ctx.user.role);
        await db.deleteRecipeIngredient(input.id);
        return { success: true };
      }),

    addStep: protectedProcedure
      .input(
        z.object({
          recipeId: z.number().int().positive(),
          stepNumber: z.number().int().min(1).max(50, "Máximo 50 pasos por receta"),
          instruction: z.string().min(5, "La instrucción debe tener al menos 5 caracteres").max(1000, "La instrucción no puede superar 1000 caracteres").trim(),
          imageUrl: z.string().url().optional().or(z.literal("")),
          timing: z.number().int().min(0).max(480).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getRecipeById(input.recipeId);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(recipe.userId, ctx.user.id, ctx.user.role);
        await db.addRecipeStep(input);
        return { success: true };
      }),

    removeStep: protectedProcedure
      .input(z.object({ id: z.number(), recipeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getRecipeById(input.recipeId);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(recipe.userId, ctx.user.id, ctx.user.role);
        await db.deleteRecipeStep(input.id);
        return { success: true };
      }),

    generateWithAI: protectedProcedure
      .input(
        z.object({
          prompt: z.string().min(10, "El prompt debe tener al menos 10 caracteres").max(500, "El prompt no puede superar 500 caracteres").trim(),
          servings: z.number().int().min(1).max(100).optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
          maxTime: z.number().int().min(5).max(480).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Eres un chef experto en nutrición. Genera recetas saludables y deliciosas en formato JSON. 
              Responde SOLO con JSON válido con esta estructura:
              {
                "name": "nombre de la receta",
                "description": "descripción breve",
                "preparationTime": número en minutos,
                "cookTime": número en minutos,
                "servings": número,
                "difficulty": "easy"|"medium"|"hard",
                "ingredients": [{"name": "nombre", "amount": número, "unit": "unidad"}],
                "steps": [{"stepNumber": 1, "instruction": "instrucción"}],
                "caloriesPerServing": número aproximado,
                "proteinsPerServing": número en gramos,
                "carbsPerServing": número en gramos,
                "fatsPerServing": número en gramos
              }`,
              },
              {
                role: "user",
                content: `Genera una receta para: ${input.prompt}. ${input.servings ? `Para ${input.servings} personas.` : ""} ${input.maxTime ? `Tiempo máximo: ${input.maxTime} minutos.` : ""} ${input.difficulty ? `Dificultad: ${input.difficulty}.` : ""}`,
              },
            ],
            response_format: { type: "json_object" },
          });
          const content = response.choices[0]?.message?.content as string | undefined;
          if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error generando receta con IA. Inténtalo de nuevo." });
          try {
            return JSON.parse(content);
          } catch {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La IA devolvió una respuesta inválida. Inténtalo de nuevo." });
          }
        } catch (err: any) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al generar la receta. El servicio de IA no está disponible en este momento. Inténtalo de nuevo." });
        }
      }),

    // ── Generar imagen de receta con IA (auto, para recetas sin foto) ──────────
    generateAIImage: protectedProcedure
      .input(z.object({ recipeId: z.number() }))
      .mutation(async ({ input }) => {
        const recipe = await db.getRecipeById(input.recipeId);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        if (recipe.imageUrl && !recipe.imageUrl.includes('placeholder')) {
          return { url: recipe.imageUrl, cached: true };
        }
        try {
          const { generateImage } = await import("./_core/imageGeneration");
          const prompt = `Professional food photography of "${recipe.name}". ${recipe.description ? recipe.description + '.' : ''} Plated beautifully on a clean white plate, natural lighting, top-down or 45-degree angle shot, vibrant colors, appetizing, restaurant quality, no text, no watermarks.`;
          const { url: generatedUrl } = await generateImage({ prompt });
          if (!generatedUrl) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se obtuvo URL de imagen generada" });
          const response = await fetch(generatedUrl as string);
          const arrayBuffer = await response.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);
          const fileKey = `recipe-images/ai-${input.recipeId}-${Date.now()}.jpg`;
          const { storagePut } = await import("./storage");
          const { url: s3Url } = await storagePut(fileKey, imageBuffer, "image/jpeg");
          await db.updateRecipe(input.recipeId, { imageUrl: s3Url });
          return { url: s3Url, cached: false };
        } catch (err) {
          console.error(`[generateAIImage] Error for recipe ${input.recipeId}:`, err);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error generando imagen" });
        }
      }),

    // ── Adapt recipe for user — replaces forbidden ingredients with safe alternatives ──
    adaptForUser: protectedProcedure
      .input(z.object({
        recipeId: z.number(),
        forbiddenIngredients: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const [recipe, userAllergies, userRestrictions, userProfile] = await Promise.all([
          db.getRecipeById(input.recipeId),
          db.getUserAllergies(ctx.user.id),
          db.getUserDietRestrictions(ctx.user.id),
          db.getUserProfile(ctx.user.id),
        ]);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });

        // Build the complete forbidden list
        const allergyNames = userAllergies.map((a: any) => a.allergy.nameEs).filter(Boolean);
        const restrictionNames = userRestrictions.map((r: any) => r.restriction.nameEs).filter(Boolean);
        const extraForbidden = input.forbiddenIngredients || [];
        const allForbidden = [...allergyNames, ...restrictionNames, ...extraForbidden]
          .filter((v, i, a) => a.indexOf(v) === i);

        if (allForbidden.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No hay restricciones configuradas en tu perfil" });
        }

        // Build ingredients text for the prompt
        const recipeIngredientRows = await db.getRecipeIngredients(recipe.id).catch(() => []);
        let ingredientsText = "";
        if (recipeIngredientRows.length > 0) {
          ingredientsText = recipeIngredientRows
            .map((ing: any) => `- ${ing.ingredient?.nameEs || ing.customName || "Ingrediente"}: ${ing.amount || ""} ${ing.measure?.nameEs || "g"}`)
            .join("\n");
        } else if (recipe.ingredientsJson) {
          try {
            const parsed = JSON.parse(recipe.ingredientsJson as string);
            if (Array.isArray(parsed)) {
              ingredientsText = parsed.map((i: any) => `- ${i.name || i.ingredient}: ${i.amount || ""} ${i.unit || "g"}`).join("\n");
            }
          } catch {}
        }

        const systemPrompt = `Eres un chef nutricionista experto. Tu tarea es adaptar recetas sustituyendo ingredientes que el usuario no puede comer por alternativas seguras y deliciosas.

⚠️ RESTRICCIONES ABSOLUTAS DEL USUARIO (NUNCA uses estos ingredientes):
${allForbidden.map((f) => `- ${f}`).join("\n")}

Responde SIEMPRE en JSON con este formato exacto:
{
  "adaptedName": "nombre de la receta adaptada",
  "description": "descripción breve de los cambios realizados",
  "substitutions": [
    { "original": "ingrediente original", "replacement": "ingrediente sustituto", "reason": "por qué es una buena alternativa" }
  ],
  "adaptedIngredients": "lista completa de ingredientes adaptados con cantidades",
  "adaptedInstructions": "instrucciones adaptadas si es necesario",
  "nutritionalNote": "nota sobre el impacto nutricional de los cambios"
}`;

        const userMessage = `Receta original: "${recipe.name}"

Ingredientes:
${ingredientsText || "(no disponibles)"}

Descripción: ${recipe.description || ""}

Adapta esta receta eliminando los ingredientes prohibidos y sustituyéndolos por alternativas seguras y sabrosas.`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system" as const, content: systemPrompt },
              { role: "user" as const, content: userMessage },
            ],
            response_format: { type: "json_object" },
          });

          const rawContent = response.choices?.[0]?.message?.content;
          if (!rawContent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No response from LLM" });
          const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
          let adaptedData: any;
          try {
            adaptedData = JSON.parse(content);;
          } catch {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error procesando la respuesta de la IA" });
          }

          // Conceder insignias de adaptación (no bloquea la respuesta)
          const badgesAwarded: any[] = [];
          try {
            // Primera adaptación
            const firstAdapt = await db.awardBadge(ctx.user.id, "first_adaptation", { recipeId: input.recipeId, recipeName: recipe.name });
            if (firstAdapt.awarded) badgesAwarded.push(firstAdapt.badge);
            // Insignia de guardián de alergias (si tiene alergias configuradas)
            if (allForbidden.length > 0) {
              const guardianBadge = await db.awardBadge(ctx.user.id, "allergy_guardian");
              if (guardianBadge.awarded) badgesAwarded.push(guardianBadge.badge);
            }
            // Contar adaptaciones totales para insignias de progresión
            const totalAdaptations = await db.countUserAdaptations(ctx.user.id);
            if (totalAdaptations >= 5) {
              const apprentice = await db.awardBadge(ctx.user.id, "adaptation_apprentice");
              if (apprentice.awarded) badgesAwarded.push(apprentice.badge);
            }
            if (totalAdaptations >= 25) {
              const master = await db.awardBadge(ctx.user.id, "adaptation_master");
              if (master.awarded) badgesAwarded.push(master.badge);
            }
            if (totalAdaptations >= 100) {
              const legend = await db.awardBadge(ctx.user.id, "adaptation_legend");
              if (legend.awarded) badgesAwarded.push(legend.badge);
            }
          } catch (badgeErr) {
            console.warn("[adaptForUser] Error awarding badges (non-critical):", badgeErr);
          }

          return {
            success: true,
            originalName: recipe.name,
            adaptedName: adaptedData.adaptedName || `${recipe.name} (adaptada)`,
            description: adaptedData.description || "",
            substitutions: (adaptedData.substitutions || []) as Array<{ original: string; replacement: string; reason: string }>,
            adaptedIngredients: adaptedData.adaptedIngredients || "",
            adaptedInstructions: adaptedData.adaptedInstructions || "",
            nutritionalNote: adaptedData.nutritionalNote || "",
            forbiddenRemoved: allForbidden,
            badgesAwarded,
          };
        } catch (err) {
          console.error(`[adaptForUser] Error adapting recipe ${input.recipeId}:`, err);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al adaptar la receta" });
        }
      }),

    // -------------------------------------------------------------------------
    // SAVE ADAPTED RECIPE AS PUBLIC (with AI image generation)
    // -------------------------------------------------------------------------
    saveAdaptedAsPublic: protectedProcedure
      .input(z.object({
        originalRecipeId: z.number().int(),
        adaptedName: z.string().min(2).max(256),
        description: z.string().optional(),
        adaptedIngredients: z.string().optional(),
        adaptedInstructions: z.string().optional(),
        nutritionalNote: z.string().optional(),
        substitutions: z.array(z.object({
          original: z.string(),
          replacement: z.string(),
          reason: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { recipes: recipesTable } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");

        // Get original recipe for context
        const [original] = await drizzleDb.select().from(recipesTable).where(eq(recipesTable.id, input.originalRecipeId)).limit(1);
        if (!original) throw new TRPCError({ code: "NOT_FOUND", message: "Receta original no encontrada" });

        // Generate AI image for the adapted recipe
        let imageUrl: string | undefined;
        try {
          const { generateImage } = await import("./_core/imageGeneration.js");
          const imagePrompt = `Professional food photography of "${input.adaptedName}", a healthy adapted recipe. Beautiful plating, natural lighting, appetizing presentation, white background, high quality.`;
          const result = await generateImage({ prompt: imagePrompt });
          imageUrl = result.url;
        } catch (imgErr) {
          console.warn("[saveAdaptedAsPublic] Image generation failed (non-critical):", imgErr);
          imageUrl = original.imageUrl ?? undefined;
        }

        // Build ingredients JSON from adapted text
        const ingredientsJson = input.adaptedIngredients
          ? JSON.stringify([{ name: input.adaptedIngredients, amount: "", unit: "", category: "General" }])
          : original.ingredientsJson;

        // Build instructions JSON from adapted text
        const instructionsJson = input.adaptedInstructions
          ? JSON.stringify([{ step: 1, text: input.adaptedInstructions }])
          : original.instructionsJson;

        // Insert new public recipe
        const [newRecipe] = await drizzleDb.insert(recipesTable).values({
          userId: ctx.user.id,
          name: input.adaptedName,
          description: input.description ?? `Versión adaptada de "${original.name}" sin alérgenos. ${input.nutritionalNote ?? ""}`.trim(),
          imageUrl: imageUrl ?? original.imageUrl,
          preparationTime: original.preparationTime,
          cookTime: original.cookTime,
          servings: original.servings,
          difficulty: original.difficulty,
          mealTime: original.mealTime,
          cuisineType: original.cuisineType,
          cookingMethod: original.cookingMethod,
          caloriesPerServing: original.caloriesPerServing,
          proteinsPerServing: original.proteinsPerServing,
          carbsPerServing: original.carbsPerServing,
          fatsPerServing: original.fatsPerServing,
          ingredientsJson,
          instructionsJson,
          tags: JSON.stringify(["adaptada", "sin-alergenos", "ia"]),
          isPublic: true,
          isSeeded: false,
        }).returning({ id: recipesTable.id });

        return { success: true, recipeId: newRecipe?.id ?? 0, imageUrl };
      }),
    calculateNutrition: protectedProcedure
      .input(z.object({
        ingredients: z.array(z.object({
          name: z.string(),
          quantity: z.number(),
          unit: z.string(),
        })).min(1).max(50),
        servings: z.number().int().positive().optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const servings = input.servings ?? 1;
        const ingredientsList = input.ingredients
          .map(i => `- ${i.quantity} ${i.unit} de ${i.name}`)
          .join("\n");
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "Eres un nutricionista experto. Calcula los valores nutricionales totales de una receta y devuelve JSON con los valores por porción. Responde SOLO con JSON válido, sin texto adicional.",
              },
              {
                role: "user",
                content: `Calcula los valores nutricionales por porción de esta receta (${servings} porciones en total).\n\nIngredientes:\n${ingredientsList}\n\nDevuelve SOLO este JSON:\n{"calories": <número>, "protein": <número>, "carbs": <número>, "fat": <número>}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "nutrition_values",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    calories: { type: "number", description: "Calorías por porción (kcal)" },
                    protein: { type: "number", description: "Proteínas por porción (g)" },
                    carbs: { type: "number", description: "Carbohidratos por porción (g)" },
                    fat: { type: "number", description: "Grasas por porción (g)" },
                  },
                  required: ["calories", "protein", "carbs", "fat"],
                  additionalProperties: false,
                },
              },
            },
          });
          const rawContent = response?.choices?.[0]?.message?.content;
          const raw = typeof rawContent === "string" ? rawContent : null;
          if (!raw) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo calcular la nutrición" });
          const parsed = JSON.parse(raw);
          return {
            calories: Math.round(parsed.calories ?? 0),
            protein: Math.round((parsed.protein ?? 0) * 10) / 10,
            carbs: Math.round((parsed.carbs ?? 0) * 10) / 10,
            fat: Math.round((parsed.fat ?? 0) * 10) / 10,
          };
        } catch (err: any) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al calcular la nutrición. Inténtalo de nuevo." });
        }
      }),
    // ── Recetas con lo que tienes (basado en inventario) ──────────────────────
    withInventory: protectedProcedure
      .input(z.object({
        limit: z.number().int().min(1).max(50).optional(),
        minMatchPercent: z.number().min(0).max(100).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const limit = input.limit ?? 20;
        const minMatch = (input.minMatchPercent ?? 40) / 100;
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userInventoryItems, recipeIngredients, recipes: recipesTable } = await import("../drizzle/schema.js");
        const { eq, and, inArray, sql } = await import("drizzle-orm");
        // Get user's inventory ingredient IDs
        const inventoryRows = await drizzleDb
          .select({ ingredientId: userInventoryItems.ingredientId })
          .from(userInventoryItems)
          .where(eq(userInventoryItems.userId, ctx.user.id))
          .limit(200);
        const inventoryIngredientIds = inventoryRows
          .map((r: any) => r.ingredientId)
          .filter((id: any): id is number => id !== null && id !== undefined);
        if (inventoryIngredientIds.length === 0) {
          return { recipes: [], inventoryCount: 0 };
        }
        // Get all recipe ingredient counts and matches
        const allRecipeStats = await drizzleDb
          .select({
            recipeId: recipeIngredients.recipeId,
            totalIngredients: sql<number>`COUNT(*)`,
            matchedIngredients: sql<number>`SUM(CASE WHEN ${recipeIngredients.ingredientId} = ANY(ARRAY[${sql.raw(inventoryIngredientIds.join(','))}]::int[]) THEN 1 ELSE 0 END)`,
          })
          .from(recipeIngredients)
          .groupBy(recipeIngredients.recipeId)
          .having(sql`COUNT(*) > 0`)
          .limit(500);
        // Filter by match percentage and sort by match rate
        const matched = allRecipeStats
          .map((r: any) => ({
            recipeId: r.recipeId,
            total: Number(r.totalIngredients),
            matched: Number(r.matchedIngredients),
            matchRate: Number(r.matchedIngredients) / Number(r.totalIngredients),
          }))
          .filter((r: any) => r.matchRate >= minMatch && r.matched > 0)
          .sort((a: any, b: any) => b.matchRate - a.matchRate)
          .slice(0, limit);
        if (matched.length === 0) {
          return { recipes: [], inventoryCount: inventoryIngredientIds.length };
        }
        // Fetch full recipe data
        const recipeIds = matched.map((r: any) => r.recipeId);
        const recipeRows = await drizzleDb
          .select()
          .from(recipesTable)
          .where(inArray(recipesTable.id, recipeIds));
        // Merge match data
        const matchMap = new Map(matched.map((r: any) => [r.recipeId, r]));
        const recipes = recipeRows
          .map((r: any) => ({
            ...r,
            matchRate: matchMap.get(r.id)?.matchRate ?? 0,
            matchedIngredients: matchMap.get(r.id)?.matched ?? 0,
            totalIngredients: matchMap.get(r.id)?.total ?? 0,
          }))
          .sort((a: any, b: any) => b.matchRate - a.matchRate);
        return { recipes, inventoryCount: inventoryIngredientIds.length };
      }),
  }),
  // ---------------------------------------------------------------------------
  // MENU ORGANIZERS
  // ---------------------------------------------------------------------------
  menus: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const userMenus = await db.getMenuOrganizers(ctx.user.id);
      const seededMenus = await db.getSeededMenus();
      // Merge: user menus first, then seeded menus not already in user menus
      const userMenuIds = new Set(userMenus.map((m: any) => m.id));
      const extraSeeded = seededMenus.filter((m: any) => !userMenuIds.has(m.id));
      return [...userMenus, ...extraSeeded];
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const menu = await db.getMenuOrganizerById(input.id);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        const dayParts = await db.getMenuDayParts(input.id);
        return { ...menu, dayParts };
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(80, "El nombre no puede superar 80 caracteres").trim(),
          startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido, usa YYYY-MM-DD"),
          endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido, usa YYYY-MM-DD"),
          type: z.enum(["weekly", "monthly", "custom"]).optional(),
          objective: z.string().max(200).optional(),
          dailyMealsCount: z.number().int().min(1).max(10).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createMenuOrganizer({ ...input, userId: ctx.user.id, startDate: input.startDate, endDate: input.endDate })
      ),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(2).max(80).trim().optional(),
          objective: z.string().max(200).optional(),
          dailyMealsCount: z.number().int().min(1).max(10).optional(),
          isPublic: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const menu = await db.getMenuOrganizerById(input.id);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        const { id, ...data } = input;
        await db.updateMenuOrganizer(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const menu = await db.getMenuOrganizerById(input.id);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        await db.deleteMenuOrganizer(input.id);
        return { success: true };
      }),
    duplicate: protectedProcedure
      .input(z.object({ id: z.number(), startDate: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const menu = await db.getMenuOrganizerById(input.id);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        const result = await db.copyMenuForUser(input.id, ctx.user.id, menu.persons ?? 1, input.startDate);
        return result;
      }),

    addRecipeToDayPart: protectedProcedure
      .input(z.object({ menuOrganizerDayPartId: z.number(), recipeId: z.number(), servings: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { menuOrganizerDayParts, menuOrganizers } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        // Verify ownership: dayPart → menuOrganizer → userId
        const [dp] = await drizzleDb.select({ menuOrganizerId: menuOrganizerDayParts.menuOrganizerId })
          .from(menuOrganizerDayParts).where(eq(menuOrganizerDayParts.id, input.menuOrganizerDayPartId)).limit(1);
        if (!dp) throw new TRPCError({ code: "NOT_FOUND" });
        const [menu] = await drizzleDb.select({ userId: menuOrganizers.userId })
          .from(menuOrganizers).where(eq(menuOrganizers.id, dp.menuOrganizerId)).limit(1);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        return db.addRecipeToMenuDayPart(input.menuOrganizerDayPartId, input.recipeId, input.servings);
      }),

    removeRecipeFromDayPart: protectedProcedure
      .input(z.object({ menuOrganizerDayPartId: z.number(), recipeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { menuOrganizerDayParts, menuOrganizers } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        // Verify ownership: dayPart → menuOrganizer → userId
        const [dp] = await drizzleDb.select({ menuOrganizerId: menuOrganizerDayParts.menuOrganizerId })
          .from(menuOrganizerDayParts).where(eq(menuOrganizerDayParts.id, input.menuOrganizerDayPartId)).limit(1);
        if (!dp) throw new TRPCError({ code: "NOT_FOUND" });
        const [menu] = await drizzleDb.select({ userId: menuOrganizers.userId })
          .from(menuOrganizers).where(eq(menuOrganizers.id, dp.menuOrganizerId)).limit(1);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        return db.removeRecipeFromMenuDayPart(input.menuOrganizerDayPartId, input.recipeId);
      }),

    // Get all items for a specific date across all user menus
    getItemsByDate: protectedProcedure
      .input(z.object({ date: z.string(), menuId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        let userMenus = await db.getMenuOrganizers(ctx.user.id);
        if (!userMenus.length) return [];
        // If menuId is provided, filter to only that specific menu
        if (input.menuId) {
          userMenus = userMenus.filter((m: any) => m.id === input.menuId);
          if (!userMenus.length) return [];
        }
        const results: any[] = [];
        const targetDate = new Date(input.date + "T00:00:00Z");
        for (const menu of userMenus) {
          const dayParts = await db.getMenuDayParts(menu.id);
          // Calculate dayNumber for this date relative to menu start
          let targetDayNumber: number | null = null;
          if ((menu as any).startDate) {
            // startDate may come as Date object or string from Drizzle
            const rawStart = (menu as any).startDate;
            const startDateStr = rawStart instanceof Date
              ? rawStart.toISOString().slice(0, 10)
              : String(rawStart).slice(0, 10);
            const startDate = new Date(startDateStr + "T00:00:00Z");
            const diffMs = targetDate.getTime() - startDate.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            targetDayNumber = diffDays + 1; // dayNumber is 1-based
          }
          // Match by dayNumber relative to startDate (primary) OR by exact date (fallback)
          const dateMatchingParts = dayParts.filter((dp: any) => {
            // Primary: if menu has startDate and dayPart has dayNumber, use relative mapping
            if (targetDayNumber !== null && dp.dayPart.dayNumber !== null && dp.dayPart.dayNumber === targetDayNumber) return true;
            // Fallback: match by exact date string (normalize Date objects)
            if (targetDayNumber === null) {
              const dpDate = dp.dayPart.date instanceof Date
                ? dp.dayPart.date.toISOString().slice(0, 10)
                : (dp.dayPart.date ? String(dp.dayPart.date).slice(0, 10) : null);
              if (dpDate === input.date) return true;
            }
            return false;
          });
          for (const dp of dateMatchingParts) {
            const recipeItems = await db.getMenuDayPartRecipes(dp.dayPart.id);
            results.push({
              menuId: menu.id,
              menuName: menu.name,
              dayPartId: dp.dayPart.id,
              dayPartName: dp.dayPartInfo?.nameEs ?? dp.dayPartInfo?.apiParam ?? "Comida",
              dayPartKey: dp.dayPartInfo?.apiParam ?? "meal",
              recipes: recipeItems.map((r: any) => ({ ...r.menuRecipe, recipe: r.recipe })),
            });
          }
        }
        return results;
      }),

    // Ensure a day part exists for a date+mealType, return its id
    ensureDayPart: protectedProcedure
      .input(z.object({
        menuId: z.number().int().positive(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido, usa YYYY-MM-DD"),
        mealType: z.string().min(1).max(50).trim(),
      }))
      .mutation(async ({ ctx, input }) => {
        const menu = await db.getMenuOrganizerById(input.menuId);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        // Find or create the day part
        const dayParts = await db.getMenuDayParts(input.menuId);
        const existing = dayParts.find((dp: any) => dp.dayPart.date === input.date && (dp.dayPartInfo?.name === input.mealType || dp.dayPartInfo?.nameEs === input.mealType));
        if (existing) return { id: existing.dayPart.id };
        // Create new day part - find the dayPartId from catalog
        const dayPartId = await db.getDayPartIdByName(input.mealType);
        const id = await db.createMenuDayPart(input.menuId, dayPartId, input.date);
        return { id };
      }),

    generateWithAI: protectedProcedure
      .input(
        z.object({
          days: z.number().min(1).max(30),
          mealsPerDay: z.number().min(1).max(6),
          objective: z.string().optional(),
          preferences: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tier = await getUserPlanTier(ctx.user.id, ctx.user.role);
        requirePlanFeature(tier, "canGenerateAIMenus");
        const [profile, allergies, restrictions, cycleData] = await Promise.all([
          db.getUserProfile(ctx.user.id),
          db.getUserAllergies(ctx.user.id),
          db.getUserDietRestrictions(ctx.user.id),
          db.getMenstrualCycleData(ctx.user.id),
        ]);
        const profileInfo = profile
          ? `Objetivo: ${profile.mainGoal || "mantener peso"}, Actividad: ${profile.activityLevel || "moderada"}, Calorías diarias: ${profile.dailyCalorieGoal || 2000}`
          : "";
        const allergyInfo = allergies.length > 0 ? `Alergias: ${allergies.map((a) => a.allergy?.nameEs).join(", ")}` : "";
        const restrictionInfo = restrictions.length > 0 ? `Restricciones: ${restrictions.map((r) => r.restriction?.nameEs).join(", ")}` : "";
        // CRITICAL SAFETY: Build forbidden ingredients block
        const menuForbiddenBlock = buildForbiddenIngredientsBlock({
          allergies,
          restrictions,
          dislikedIngredients: profile?.dislikedIngredients,
        });
        // Menstrual cycle phase block (only for women with tracking enabled)
        const cyclePhaseBlock = db.buildCyclePhaseBlock(cycleData?.phaseInfo);

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Eres un nutricionista experto. Genera planes de menú semanales personalizados en formato JSON.
${cyclePhaseBlock}
⚠️ REGLAS ESTRICTAS POR FRANJA HORARIA (OBLIGATORIO):
- DESAYUNO: tostadas, cereales, avena, yogur, fruta, huevos revueltos, smoothie, batido, pan con aceite. NUNCA: ensaladas, guisos, gazpacho, sopas, arroces, pastas, carnes asadas, pescados al horno, legumbres, potajes.
- MEDIA MAÑANA: snack pequeño (fruta, yogur, frutos secos, barrita). NUNCA platos completos.
- COMIDA: plato principal completo con proteína + carbohidrato + verdura. Aquí sí pueden ir ensaladas, arroces, pastas, carnes, pescados, legumbres.
- MERIENDA: snack pequeño (fruta, yogur, tostada). NUNCA platos completos.
- CENA: comida ligera (ensalada, crema de verduras, pescado a la plancha, tortilla, revueltos). NUNCA: gazpacho de cena si es invierno, platos muy pesados.
Responde SOLO con JSON válido con esta estructura:
              {
                "menuName": "nombre del menú",
                "days": [
                  {
                    "dayNumber": 1,
                    "meals": [
                      {
                        "mealType": "desayuno|comida|cena|merienda",
                        "recipeName": "nombre de la receta",
                        "description": "descripción breve",
                        "estimatedCalories": número,
                        "preparationTime": número en minutos
                      }
                    ]
                  }
                ]
              }
              ${menuForbiddenBlock}`,
              },
              {
                role: "user",
                content: `Genera un menú para ${input.days} días con ${input.mealsPerDay} comidas por día.
              ${profileInfo}
              ${allergyInfo}
              ${restrictionInfo}
              ${input.objective ? `Objetivo específico: ${input.objective}` : ""}
              ${input.preferences ? `Preferencias: ${input.preferences}` : ""}`,
              },
            ],
            response_format: { type: "json_object" },
          });
          const content = response.choices[0]?.message?.content as string | undefined;
          if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error generando menú con IA" });
          try {
            return JSON.parse(content);
          } catch {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La IA devolvió una respuesta inválida. Inténtalo de nuevo." });
          }
        } catch (err: any) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al generar el menú con IA. Inténtalo de nuevo." });
        }
      }),
    // ── Library: predefined seeded menus ─────────────────────────────────────────
    library: publicProcedure
      .input(
        z.object({
          goal: z.enum(["perdida_peso", "ganancia_muscular", "tonificacion", "perdida_grasa", "mantenimiento", "bienestar", "vegano"]).optional(),
          difficulty: z.enum(["easy", "medium", "hard", "facil", "medio", "dificil"]).optional(),
          limit: z.number().optional().default(50),
        })
      )
      .query(async ({ input }) => {
        const allMenus = await db.getSeededMenus();
        let filtered = allMenus;
        if (input.goal) filtered = filtered.filter((m: any) => m.goal === input.goal);
        // Map frontend difficulty labels to DB values
        if (input.difficulty) {
          const diffMap: Record<string, string> = { facil: "easy", medio: "medium", dificil: "hard" };
          const dbDiff = diffMap[input.difficulty] ?? input.difficulty;
          filtered = filtered.filter((m: any) => m.difficulty === dbDiff);
        }
        return filtered.slice(0, input.limit ?? 50);
      }),
    libraryDetail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const menu = await db.getSeededMenuDetail(input.id);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        return menu;
      }),
    // ── Recommended menus based on user profile ──────────────────────────────
    recommended: protectedProcedure.query(async ({ ctx }) => {
      const allMenus = await db.getSeededMenus();
      const profile = await db.getUserProfile(ctx.user.id);
      const restrictions = await db.getUserDietRestrictions(ctx.user.id);
      const restrictionIds = restrictions.map((r: any) => r.restriction);
      const goalMap: Record<string, string> = {
        lose_weight: "perdida_peso",
        gain_muscle: "ganancia_muscular",
        maintain: "mantenimiento",
        improve_health: "bienestar",
        eat_healthier: "bienestar",
      };
      const userGoal = profile?.mainGoal ? goalMap[profile.mainGoal] : null;
      const scored = allMenus.map((m: any) => {
        let score = 0;
        if (userGoal && m.goal === userGoal) score += 10;
        if (restrictionIds.includes("vegano") && m.goal === "vegano") score += 8;
        if (restrictionIds.includes("vegetariano") && m.goal === "vegano") score += 4;
        if (profile?.dailyCalorieGoal && m.dailyCalories) {
          const diff = Math.abs(m.dailyCalories - profile.dailyCalorieGoal);
          if (diff < 200) score += 5;
          else if (diff < 400) score += 3;
          else if (diff < 600) score += 1;
        }
        return { ...m, score };
      });
      scored.sort((a: any, b: any) => b.score - a.score);
      return {
        recommended: scored.slice(0, 6),
        all: allMenus,
        hasProfile: !!profile,
        userGoal,
        totalMenus: allMenus.length,
      };
    }),
    saveFromLibrary: protectedProcedure
      .input(
        z.object({
          menuId: z.number(),
          persons: z.number().min(1).max(20).default(1),
          startDate: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.copyMenuForUser(input.menuId, ctx.user.id, input.persons, input.startDate);
        // Auto-activate the newly saved menu
        if (result?.menuId) {
          const drizzleDb = await db.getDb();
          if (drizzleDb) {
            const { menuOrganizers } = await import("../drizzle/schema.js");
            const { eq, and } = await import("drizzle-orm");
            await drizzleDb.update(menuOrganizers).set({ isActive: false }).where(eq(menuOrganizers.userId, ctx.user.id));
            await drizzleDb.update(menuOrganizers).set({ isActive: true }).where(and(eq(menuOrganizers.id, result.menuId), eq(menuOrganizers.userId, ctx.user.id)));
          }
        }
        return result;
      }),

    // Set a menu as active (menú en curso)
    setActive: protectedProcedure
      .input(z.object({ menuId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        let menu = await db.getMenuOrganizerById(input.menuId);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        // If the menu doesn't belong to the user (e.g. seeded library menu),
        // copy it for the user first, then activate the copy.
        let targetMenuId = input.menuId;
        if (menu.userId !== ctx.user.id && !hasRole({ role: ctx.user.role, secondaryRoles: ctx.user.secondaryRoles }, "admin")) {
          const todayStr = new Date().toISOString().split("T")[0];
          const copied = await db.copyMenuForUser(input.menuId, ctx.user.id, menu.persons ?? 1, todayStr);
          if (!copied) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo copiar el menú" });
          targetMenuId = copied.id;
        }
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { menuOrganizers } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        await drizzleDb.update(menuOrganizers).set({ isActive: false }).where(eq(menuOrganizers.userId, ctx.user.id));
        // Set startDate to today so the menu always starts from today when activated
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        await drizzleDb.update(menuOrganizers).set({ isActive: true, startDate: todayDate as any }).where(eq(menuOrganizers.id, targetMenuId));
        return { success: true, newMenuId: targetMenuId !== input.menuId ? targetMenuId : undefined };
      }),
    // Get the currently active menu with full week detail
    getActive: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { menuOrganizers, menuOrganizerDayParts, menuOrganizerDayPartRecipes, dayParts, recipes } = await import("../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");
      const [activeMenu] = await drizzleDb
        .select()
        .from(menuOrganizers)
        .where(and(eq(menuOrganizers.userId, ctx.user.id), eq(menuOrganizers.isActive, true)))
        .limit(1);
      if (!activeMenu) return null;
      const dpRows = await drizzleDb
        .select({ dp: menuOrganizerDayParts, dpInfo: dayParts })
        .from(menuOrganizerDayParts)
        .leftJoin(dayParts, eq(menuOrganizerDayParts.dayPartId, dayParts.id))
        .where(eq(menuOrganizerDayParts.menuOrganizerId, activeMenu.id));
      const dayPartsWithRecipes = await Promise.all(
        dpRows.map(async (row) => {
          const recipeRows = await drizzleDb
            .select({ dpRecipe: menuOrganizerDayPartRecipes, recipe: recipes })
            .from(menuOrganizerDayPartRecipes)
            .leftJoin(recipes, eq(menuOrganizerDayPartRecipes.recipeId, recipes.id))
            .where(eq(menuOrganizerDayPartRecipes.menuOrganizerDayPartId, row.dp.id));
          return {
            ...row.dp,
            dayPartInfo: row.dpInfo,
            recipes: recipeRows.map((r) => ({ ...r.dpRecipe, recipe: r.recipe })),
          };
        })
      );
      return { ...activeMenu, dayParts: dayPartsWithRecipes };
    }),

    // Update start date of a menu (shifts all day parts accordingly)
    updateStartDate: protectedProcedure
      .input(
        z.object({
          menuId: z.number(),
          startDate: z.string(), // ISO date string YYYY-MM-DD
        })
      )
      .mutation(async ({ ctx, input }) => {
        const menu = await db.getMenuOrganizerById(input.menuId);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);

        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { menuOrganizerDayParts, menuOrganizers } = await import("../drizzle/schema.js");
        const { eq, and } = await import("drizzle-orm");

        // Get all day parts for this menu
        const dayPartRows = await drizzleDb
          .select()
          .from(menuOrganizerDayParts)
          .where(eq(menuOrganizerDayParts.menuOrganizerId, input.menuId));

        // Calculate offset from original start date
        const oldStart = menu.startDate ? new Date(menu.startDate) : null;
        const newStart = new Date(input.startDate);
        const offsetMs = oldStart ? newStart.getTime() - oldStart.getTime() : 0;
        const offsetDays = Math.round(offsetMs / (1000 * 60 * 60 * 24));

        // Update each day part date
        for (const dp of dayPartRows) {
          if (dp.date) {
            const oldDate = new Date(dp.date);
            const newDate = new Date(oldDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
            await drizzleDb
              .update(menuOrganizerDayParts)
              .set({ date: (newDate instanceof Date ? newDate.toISOString().split("T")[0] : newDate) as any })
              .where(eq(menuOrganizerDayParts.id, dp.id));
          }
        }

        // Update menu start/end dates
        const newStartDate = newStart;
        const daysCount = dayPartRows.length > 0 ? Math.max(...dayPartRows.map(dp => {
          if (!dp.date) return 0;
          const d = new Date(dp.date);
          return Math.round((d.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24));
        })) : 0;
        const newEndDate = new Date(newStart.getTime() + daysCount * 24 * 60 * 60 * 1000);

        await drizzleDb
          .update(menuOrganizers)
          .set({ startDate: (newStartDate instanceof Date ? newStartDate.toISOString().split("T")[0] : newStartDate) as any, endDate: (newEndDate instanceof Date ? newEndDate.toISOString().split("T")[0] : newEndDate) as any })
          .where(eq(menuOrganizers.id, input.menuId));

        return { success: true };
      }),

    // Apply menu meals to the food diary (meal_logs) from a given start date
    applyToCalendar: protectedProcedure
      .input(
        z.object({
          menuId: z.number(),
          startDate: z.string(), // ISO date string YYYY-MM-DD
          overwrite: z.boolean().default(false), // if true, delete existing logs for those dates first
        })
      )
      .mutation(async ({ ctx, input }) => {
        let menu = await db.getMenuOrganizerById(input.menuId);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        // If the menu doesn't belong to the user (e.g. seeded library menu),
        // copy it for the user first, then operate on the copy.
        let targetMenuId = input.menuId;
        if (menu.userId !== ctx.user.id && !hasRole({ role: ctx.user.role, secondaryRoles: ctx.user.secondaryRoles }, "admin")) {
          const copied = await db.copyMenuForUser(input.menuId, ctx.user.id, menu.persons ?? 1, input.startDate);
          if (!copied) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo copiar el menú" });
          targetMenuId = copied.id;
          const copiedMenu = await db.getMenuOrganizerById(targetMenuId);
          if (!copiedMenu) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          menu = copiedMenu;
        }

        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { menuOrganizerDayParts, menuOrganizers, dayParts } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");

        // Get all day parts to recalculate their dates
        const dayPartRows = await drizzleDb
          .select({ dp: menuOrganizerDayParts, dpInfo: dayParts })
          .from(menuOrganizerDayParts)
          .leftJoin(dayParts, eq(menuOrganizerDayParts.dayPartId, dayParts.id))
          .where(eq(menuOrganizerDayParts.menuOrganizerId, targetMenuId));

        if (dayPartRows.length === 0) {
          return { success: true, logsCreated: 0, newMenuId: targetMenuId !== input.menuId ? targetMenuId : undefined };
        }

        // Determine the original menu start date to calculate offsets
        const menuOriginalStart = menu.startDate ? new Date(menu.startDate) : new Date(dayPartRows[0].dp.date!);
        const newStart = new Date(input.startDate);
        const offsetDays = Math.round((newStart.getTime() - menuOriginalStart.getTime()) / (1000 * 60 * 60 * 24));

        // Only update the dates of the menu day parts - do NOT insert into mealLogs.
        // The diary is filled only when the user manually confirms each meal via confirmDayPart.
        const allTargetDates: string[] = [];
        for (const { dp } of dayPartRows) {
          let targetDate: string;
          if (dp.date) {
            const originalDate = new Date(dp.date);
            const shifted = new Date(originalDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
            targetDate = shifted.toISOString().split("T")[0];
          } else if (dp.dayNumber != null) {
            const shifted = new Date(newStart.getTime() + (dp.dayNumber - 1) * 24 * 60 * 60 * 1000);
            targetDate = shifted.toISOString().split("T")[0];
          } else {
            targetDate = input.startDate;
          }
          allTargetDates.push(targetDate);
          await drizzleDb
            .update(menuOrganizerDayParts)
            .set({ date: targetDate as any })
            .where(eq(menuOrganizerDayParts.id, dp.id));
        }

        // Update menu start/end dates to match the new range
        const sortedDates = [...allTargetDates].sort();
        const minDate = sortedDates[0];
        const maxDate = sortedDates[sortedDates.length - 1];
        await drizzleDb
          .update(menuOrganizers)
          .set({ startDate: minDate as any, endDate: maxDate as any })
          .where(eq(menuOrganizers.id, targetMenuId));
        return { success: true, logsCreated: 0, newMenuId: targetMenuId !== input.menuId ? targetMenuId : undefined };
      }),
        // Confirm a single day part (meal slot) - logs its recipes to the diary and marks it completed
    confirmDayPart: protectedProcedure
      .input(z.object({
        dayPartId: z.number(), // menuOrganizerDayPart.id
        logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
        undo: z.boolean().default(false), // if true, unmark as completed and remove logs
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { menuOrganizerDayParts, menuOrganizerDayPartRecipes, mealLogs, recipes, menuOrganizers } = await import("../drizzle/schema.js");
        const { eq, and } = await import("drizzle-orm");
        // Verify ownership via menu
        const [dp] = await drizzleDb.select().from(menuOrganizerDayParts).where(eq(menuOrganizerDayParts.id, input.dayPartId)).limit(1);
        if (!dp) throw new TRPCError({ code: "NOT_FOUND" });
        const [menu] = await drizzleDb.select().from(menuOrganizers).where(eq(menuOrganizers.id, dp.menuOrganizerId)).limit(1);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        if (input.undo) {
          // Unmark as completed
          await drizzleDb.update(menuOrganizerDayParts).set({ completed: false }).where(eq(menuOrganizerDayParts.id, input.dayPartId));
          // Remove meal logs added from this day part on this date (those with notes containing menu name)
          // Remove meal logs for this day part on this date
          const { sql: sqlTag } = await import("drizzle-orm");
          await drizzleDb.delete(mealLogs).where(
            and(
              eq(mealLogs.userId, ctx.user.id),
              sqlTag`${mealLogs.logDate} = ${input.logDate}`,
              eq(mealLogs.dayPartId, dp.dayPartId ?? 0)
            )
          );
          return { success: true, logsCreated: 0 };
        }
        // Get recipes for this day part
        const dpRecipes = await drizzleDb
          .select({ dpRecipe: menuOrganizerDayPartRecipes, recipe: recipes })
          .from(menuOrganizerDayPartRecipes)
          .leftJoin(recipes, eq(menuOrganizerDayPartRecipes.recipeId, recipes.id))
          .where(eq(menuOrganizerDayPartRecipes.menuOrganizerDayPartId, input.dayPartId));
        let logsCreated = 0;
        for (const { dpRecipe, recipe } of dpRecipes) {
          if (!recipe) continue;
          await drizzleDb.insert(mealLogs).values({
            userId: ctx.user.id,
            recipeId: recipe.id,
            customMealName: recipe.name,
            dayPartId: dp.dayPartId,
            logDate: input.logDate,
            servings: dpRecipe.servings || 1,
            calories: recipe.caloriesPerServing ? Math.round(recipe.caloriesPerServing * (dpRecipe.servings || 1)) : null,
            proteins: recipe.proteinsPerServing ? recipe.proteinsPerServing * (dpRecipe.servings || 1) : null,
            carbohydrates: recipe.carbsPerServing ? recipe.carbsPerServing * (dpRecipe.servings || 1) : null,
            fats: recipe.fatsPerServing ? recipe.fatsPerServing * (dpRecipe.servings || 1) : null,
            notes: `Del menú: ${menu.name}`,
          } as any);
          logsCreated++;
        }
        // Mark day part as completed
        await drizzleDb.update(menuOrganizerDayParts).set({ completed: true }).where(eq(menuOrganizerDayParts.id, input.dayPartId));
        return { success: true, logsCreated };
      }),

    // ── Rename menu ─────────────────────────────────────────────────────────────
    rename: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1).max(256) }))
      .mutation(async ({ ctx, input }) => {
        const menu = await db.getMenuOrganizerById(input.id);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { menuOrganizers } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        await drizzleDb.update(menuOrganizers).set({ name: input.name }).where(eq(menuOrganizers.id, input.id));
        return { success: true };
      }),

    // ── Menu Complements CRUD ────────────────────────────────────────────────────
    listComplements: protectedProcedure
      .input(z.object({ menuId: z.number() }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { menuComplements, complements } = await import("../drizzle/schema.js");
        const { eq, and } = await import("drizzle-orm");
        // Verify ownership
        const menu = await db.getMenuOrganizerById(input.menuId);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        const rows = await drizzleDb
          .select({ mc: menuComplements, c: complements })
          .from(menuComplements)
          .leftJoin(complements, eq(menuComplements.complementId, complements.id))
          .where(and(eq(menuComplements.menuOrganizerId, input.menuId), eq(menuComplements.userId, ctx.user.id)));
        return rows.map(({ mc, c }) => ({ ...mc, complement: c ?? null }));
      }),

    addComplement: protectedProcedure
      .input(z.object({
        menuId: z.number(),
        complementId: z.number().optional(),
        customName: z.string().max(256).optional(),
        emoji: z.string().max(8).optional(),
        mealTime: z.enum(["desayuno", "media_manana", "comida", "merienda", "cena", "otro"]).default("otro"),
        quantity: z.number().min(0.1).default(1),
        unit: z.string().max(32).optional(),
        calories: z.number().optional(),
        notes: z.string().optional(),
        isDefault: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const menu = await db.getMenuOrganizerById(input.menuId);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        const { menuComplements } = await import("../drizzle/schema.js");
        const [row] = await drizzleDb.insert(menuComplements).values({
          menuOrganizerId: input.menuId,
          userId: ctx.user.id,
          complementId: input.complementId ?? null,
          customName: input.customName ?? null,
          emoji: input.emoji ?? "☕",
          mealTime: input.mealTime,
          quantity: input.quantity,
          unit: input.unit ?? "ud",
          calories: input.calories ?? null,
          notes: input.notes ?? null,
          isDefault: input.isDefault,
        } as any).returning({ id: menuComplements.id });
        return { success: true, id: (row as any)?.id };
      }),

    updateComplement: protectedProcedure
      .input(z.object({
        id: z.number(),
        mealTime: z.enum(["desayuno", "media_manana", "comida", "merienda", "cena", "otro"]).optional(),
        quantity: z.number().min(0.1).optional(),
        unit: z.string().max(32).optional(),
        calories: z.number().optional(),
        notes: z.string().optional(),
        isDefault: z.boolean().optional(),
        emoji: z.string().max(8).optional(),
        customName: z.string().max(256).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { menuComplements } = await import("../drizzle/schema.js");
        const { eq, and } = await import("drizzle-orm");
        const [existing] = await drizzleDb.select().from(menuComplements).where(and(eq(menuComplements.id, input.id), eq(menuComplements.userId, ctx.user.id))).limit(1);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        const { id, ...data } = input;
        await drizzleDb.update(menuComplements).set(data as any).where(eq(menuComplements.id, id));
        return { success: true };
      }),

    removeComplement: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { menuComplements } = await import("../drizzle/schema.js");
        const { eq, and } = await import("drizzle-orm");
        const [existing] = await drizzleDb.select().from(menuComplements).where(and(eq(menuComplements.id, input.id), eq(menuComplements.userId, ctx.user.id))).limit(1);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        await drizzleDb.delete(menuComplements).where(eq(menuComplements.id, input.id));
        return { success: true };
      }),
    // ── Terms & Conditions Acceptance ────────────────────────────────────
    acceptTerms: protectedProcedure
      .input(z.object({
        termsVersion: z.string().default("2.0"),
        acceptPrivacy: z.boolean(),
        marketingConsent: z.boolean().optional().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { users: usersTable } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const now = new Date();
        await drizzleDb.update(usersTable).set({
          termsAcceptedAt: now,
          termsVersion: input.termsVersion,
          privacyAcceptedAt: input.acceptPrivacy ? now : undefined,
          marketingConsent: input.marketingConsent ?? false,
          marketingConsentAt: input.marketingConsent ? now : undefined,
        }).where(eq(usersTable.id, ctx.user.id));
        return { success: true, acceptedAt: now };
      }),
    getTermsStatus: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { users: usersTable } = await import("../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const rows = await drizzleDb.select({
        termsAcceptedAt: usersTable.termsAcceptedAt,
        termsVersion: usersTable.termsVersion,
        privacyAcceptedAt: usersTable.privacyAcceptedAt,
        marketingConsent: usersTable.marketingConsent,
        marketingConsentAt: usersTable.marketingConsentAt,
      }).from(usersTable).where(eq(usersTable.id, ctx.user.id)).limit(1);
      return rows[0] ?? null;
    }),
  }),
  // ---------------------------------------------------------------------------
  // SEED (admin only - initialize catalogs)
  // ---------------------------------------------------------------------------
  shoppingLists: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const lists = await db.getShoppingLists(ctx.user.id);
      if (!lists.length) return [];
      // Enrich each list with item counts
      const { shoppingListItems } = await import("../drizzle/schema.js");
      const { eq, count, sql } = await import("drizzle-orm");
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return lists;
      const enriched = await Promise.all(lists.map(async (list) => {
        const rows = await drizzleDb
          .select({
            total: count(),
            purchased: sql<number>`SUM(CASE WHEN ${shoppingListItems.checked} = true THEN 1 ELSE 0 END)`,
          })
          .from(shoppingListItems)
          .where(eq(shoppingListItems.shoppingListId, list.id));
        const { total, purchased } = rows[0] ?? { total: 0, purchased: 0 };
        return { ...list, itemCount: Number(total), purchasedCount: Number(purchased) };
      }));
      return enriched;
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const list = await db.getShoppingListById(input.id);
        if (!list) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(list.userId, ctx.user.id, ctx.user.role);
        const rawItems = await db.getShoppingListItems(input.id);
        // Flatten nested {item, ingredient, measure} structure for frontend
        const items = rawItems.map(({ item, ingredient, measure }) => ({
          ...item,
          isPurchased: item.checked,
          ingredient: ingredient ? { ...ingredient } : null,
          measure: measure ? { ...measure } : null,
        }));
        return { ...list, items };
      }),

    create: protectedProcedure
      .input(z.object({ name: z.string(), menuOrganizerId: z.number().optional() }))
      .mutation(({ ctx, input }) => db.createShoppingList({ ...input, userId: ctx.user.id })),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const list = await db.getShoppingListById(input.id);
        if (!list) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(list.userId, ctx.user.id, ctx.user.role);
        await db.deleteShoppingList(input.id);
        return { success: true };
      }),
    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { shoppingLists, shoppingListItems } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const list = await db.getShoppingListById(input.id);
        if (!list) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(list.userId, ctx.user.id, ctx.user.role);
        // Create new list
        const [newList] = await drizzleDb.insert(shoppingLists).values({
          userId: ctx.user.id,
          name: `${list.name} (copia)`,
          menuOrganizerId: null,
          supermarket: (list as any).supermarket ?? "general",
          persons: (list as any).persons ?? 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning({ id: shoppingLists.id });
        // Copy items
        const items = await drizzleDb.select().from(shoppingListItems).where(eq(shoppingListItems.shoppingListId, input.id));
        for (const item of items) {
          await drizzleDb.insert(shoppingListItems).values({
            shoppingListId: newList.id,
            ingredientId: item.ingredientId,
            customName: item.customName,
            amount: item.amount,
            measureId: item.measureId,
            category: item.category,
            checked: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return { success: true, id: newList.id, name: `${list.name} (copia)` };
      }),

    addItem: protectedProcedure
      .input(
        z.object({
          shoppingListId: z.number(),
          ingredientId: z.number().optional(),
          customName: z.string().optional(),
          amount: z.number().optional(),
          measureId: z.number().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify ownership of the shopping list before adding items
        const list = await db.getShoppingListById(input.shoppingListId);
        if (!list) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(list.userId, ctx.user.id, ctx.user.role);
        return db.addShoppingListItem(input);
      }),

    updateItem: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          amount: z.number().optional(),
          checked: z.boolean().optional(),
          customName: z.string().optional(),
          packageSize: z.string().max(64).optional().nullable(),
          packageNotes: z.string().max(256).optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { shoppingListItems, shoppingLists } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        // Verify ownership via the parent shopping list
        const [item] = await drizzleDb.select({ shoppingListId: shoppingListItems.shoppingListId })
          .from(shoppingListItems).where(eq(shoppingListItems.id, input.id)).limit(1);
        if (!item) throw new TRPCError({ code: "NOT_FOUND" });
        const [list] = await drizzleDb.select({ userId: shoppingLists.userId })
          .from(shoppingLists).where(eq(shoppingLists.id, item.shoppingListId)).limit(1);
        if (!list) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(list.userId, ctx.user.id, ctx.user.role);
        const { id, ...data } = input;
        return db.updateShoppingListItem(id, data);
      }),

    toggleItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { shoppingListItems, shoppingLists } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        // Get current state + item details for pantry upsert
        const [item] = await drizzleDb
          .select()
          .from(shoppingListItems)
          .where(eq(shoppingListItems.id, input.id))
          .limit(1);
        if (!item) throw new TRPCError({ code: "NOT_FOUND" });
        // Verify ownership via the parent shopping list
        const [list] = await drizzleDb.select({ userId: shoppingLists.userId })
          .from(shoppingLists).where(eq(shoppingLists.id, item.shoppingListId)).limit(1);
        if (!list) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(list.userId, ctx.user.id, ctx.user.role);
        const newChecked = !item.checked;
        await drizzleDb
          .update(shoppingListItems)
          .set({ checked: newChecked })
          .where(eq(shoppingListItems.id, input.id));
        // When marking as purchased, register in pantry stock
        if (newChecked && item.customName) {
          try {
            const { normalizeToCommercialUnit } = await import("../shared/supermarketUnits.js");
            const normalized = normalizeToCommercialUnit(item.customName, item.amount ?? 1, "ud");
            await db.upsertPantryStock(
              ctx.user.id,
              item.customName,
              normalized.label,
              item.amount ?? 1,
              normalized.hasCommercialUnit ? normalized.originalQty : null,
              item.category
            );
          } catch {
            // Non-critical: pantry update failure should not block the toggle
          }
        }
        return { success: true, checked: newChecked };
      }),
    togglePantry: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { shoppingListItems, shoppingLists } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const [current] = await drizzleDb.select({ inPantry: shoppingListItems.inPantry, shoppingListId: shoppingListItems.shoppingListId })
          .from(shoppingListItems)
          .where(eq(shoppingListItems.id, input.id));
        if (!current) throw new TRPCError({ code: "NOT_FOUND" });
        // Verify ownership via the parent shopping list
        const [list] = await drizzleDb.select({ userId: shoppingLists.userId })
          .from(shoppingLists).where(eq(shoppingLists.id, current.shoppingListId)).limit(1);
        if (!list) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(list.userId, ctx.user.id, ctx.user.role);
        await drizzleDb.update(shoppingListItems)
          .set({ inPantry: !current.inPantry })
          .where(eq(shoppingListItems.id, input.id));
        return { success: true, inPantry: !current.inPantry };
      }),

    removeItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { shoppingListItems, shoppingLists } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const [item] = await drizzleDb.select({ shoppingListId: shoppingListItems.shoppingListId })
          .from(shoppingListItems).where(eq(shoppingListItems.id, input.id)).limit(1);
        if (!item) throw new TRPCError({ code: "NOT_FOUND" });
        const [list] = await drizzleDb.select({ userId: shoppingLists.userId })
          .from(shoppingLists).where(eq(shoppingLists.id, item.shoppingListId)).limit(1);
        if (!list) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(list.userId, ctx.user.id, ctx.user.role);
        return db.deleteShoppingListItem(input.id);
      }),
    // ── OCR: parse shopping list from photo ────────────────────────────────
    parseFromPhoto: protectedProcedure
      .input(z.object({ imageBase64: z.string().min(10) }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: input.imageBase64, detail: "high" },
                },
                {
                  type: "text",
                  text: `Eres un asistente de lista de la compra. Analiza la imagen y extrae todos los productos o alimentos que aparecen escritos. Devuelve SOLO un JSON con este formato exacto, sin texto adicional:\n{"items": [{"name": "nombre del producto", "amount": 1, "category": "categoría"}]}\nCategorías posibles: Frutas y verduras, Carnes y pescados, Lácteos y huevos, Pan y cereales, Bebidas, Congelados, Conservas, Limpieza, Higiene, Otros.\nSi no hay cantidad visible, usa 1. Normaliza los nombres al español. Devuelve máximo 50 items.`,
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "shopping_list",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        amount: { type: "number" },
                        category: { type: "string" },
                      },
                      required: ["name", "amount", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices?.[0]?.message?.content;
        if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo analizar la imagen" });
        const parsed = typeof content === "string" ? JSON.parse(content) : content;
        return parsed as { items: { name: string; amount: number; category: string }[] };
      }),

    // ── Generate shopping list from a menu ──────────────────────────────────
    generateFromMenu: protectedProcedure
      .input(
        z.object({
          menuId: z.number(),
          persons: z.number().min(1).max(20).default(1),
          supermarket: z.enum(["general", "mercadona", "lidl", "carrefour", "alcampo", "dia", "el_corte_ingles", "consum", "hiperdino"]).default("general"),
          name: z.string().optional(),
          replaceExisting: z.boolean().optional().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { shoppingLists, shoppingListItems } = await import("../drizzle/schema.js");
        const { eq, and } = await import("drizzle-orm");
        // Check for existing list with same menu + supermarket to prevent duplicates
        const existing = await drizzleDb
          .select({ id: shoppingLists.id, name: shoppingLists.name })
          .from(shoppingLists)
          .where(and(
            eq(shoppingLists.userId, ctx.user.id),
            eq(shoppingLists.menuOrganizerId, input.menuId),
            eq(shoppingLists.supermarket, input.supermarket as any)
          ))
          .limit(1);
        if (existing.length > 0 && !input.replaceExisting) {
          // Return signal to frontend to ask user what to do
          return { success: false as const, existingListId: existing[0].id, existingListName: existing[0].name, requiresConfirmation: true as const, shoppingListId: existing[0].id, itemCount: 0, name: existing[0].name };
        }
        // If replacing, delete the old list and its items first
        if (existing.length > 0 && input.replaceExisting) {
          await drizzleDb.delete(shoppingListItems).where(eq(shoppingListItems.shoppingListId, existing[0].id));
          await drizzleDb.delete(shoppingLists).where(eq(shoppingLists.id, existing[0].id));
        }
        const result = await db.generateShoppingListFromMenu(ctx.user.id, input.menuId, input.persons, input.supermarket, input.name);
        return { ...result, requiresConfirmation: false as const };
      }),
    // -------------------------------------------------------------------------
    // SHOPPING LIST TEMPLATES
    // -------------------------------------------------------------------------
    saveAsTemplate: protectedProcedure
      .input(z.object({
        listId: z.number(),
        name: z.string().min(1).max(256),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { shoppingLists, shoppingListItems, shoppingListTemplates, ingredients, measures } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const list = await drizzleDb.select().from(shoppingLists)
          .where(and(eq(shoppingLists.id, input.listId), eq(shoppingLists.userId, ctx.user.id)))
          .limit(1);
        if (list.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Lista no encontrada" });
        const items = await drizzleDb.select({
          customName: shoppingListItems.customName,
          amount: shoppingListItems.amount,
          category: shoppingListItems.category,
          ingredientName: ingredients.nameEs,
          measureName: measures.nameEs,
        })
          .from(shoppingListItems)
          .leftJoin(ingredients, eq(shoppingListItems.ingredientId, ingredients.id))
          .leftJoin(measures, eq(shoppingListItems.measureId, measures.id))
          .where(eq(shoppingListItems.shoppingListId, input.listId));
        const itemsJson = JSON.stringify(items.map(i => ({
          name: i.ingredientName ?? i.customName ?? "Producto",
          qty: i.amount ? String(i.amount) : "",
          unit: i.measureName ?? "",
          category: i.category ?? "General",
        })));
        await drizzleDb.insert(shoppingListTemplates).values({
          userId: ctx.user.id,
          name: input.name,
          supermarket: (list[0] as any).supermarket ?? "general",
          itemsJson,
        });
        return { success: true, name: input.name };
      }),
    listTemplates: protectedProcedure
      .query(async ({ ctx }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { shoppingListTemplates } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        const templates = await drizzleDb.select().from(shoppingListTemplates)
          .where(eq(shoppingListTemplates.userId, ctx.user.id))
          .orderBy(desc(shoppingListTemplates.createdAt));
        return templates.map(t => ({
          ...t,
          items: (() => { try { return JSON.parse(t.itemsJson) as { name: string; qty: string; unit: string; category: string }[]; } catch { return []; } })(),
        }));
      }),
    createFromTemplate: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        name: z.string().min(1).max(256).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { shoppingListTemplates, shoppingLists, shoppingListItems } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const template = await drizzleDb.select().from(shoppingListTemplates)
          .where(and(eq(shoppingListTemplates.id, input.templateId), eq(shoppingListTemplates.userId, ctx.user.id)))
          .limit(1);
        if (template.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Plantilla no encontrada" });
        const t = template[0];
        const listName = input.name ?? (t.name + " (copia)");
        const [listResult] = await drizzleDb.insert(shoppingLists).values({
          userId: ctx.user.id,
          name: listName,
          supermarket: (t.supermarket ?? "general") as "general" | "mercadona" | "lidl" | "carrefour" | "alcampo" | "dia" | "el_corte_ingles",
          persons: 1,
        }).returning({ id: shoppingLists.id });
        const newListId = listResult?.id;
        let items: { name: string; qty: string; unit: string; category: string }[] = [];
        try { items = JSON.parse(t.itemsJson); } catch { items = []; }
        if (items.length > 0) {
          await drizzleDb.insert(shoppingListItems).values(
            items.map(item => ({
              shoppingListId: newListId,
              customName: item.name,
              amount: item.qty ? parseFloat(item.qty) || null : null,
              category: item.category ?? "General",
              checked: false,
            }))
          );
        }
        return { id: newListId, name: listName };
      }),
    deleteTemplate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { shoppingListTemplates } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        await drizzleDb.delete(shoppingListTemplates)
          .where(and(eq(shoppingListTemplates.id, input.id), eq(shoppingListTemplates.userId, ctx.user.id)));
        return { success: true };
      }),
    // ── Pantry Stock (Despensa Inteligente) ────────────────────────────────
    getPantryStock: protectedProcedure
      .query(({ ctx }) => db.getPantryStock(ctx.user.id)),
    clearExpiredPantry: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.clearExpiredPantryStock(ctx.user.id);
        return { success: true };
      }),
    removePantryItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removePantryStockItem(input.id, ctx.user.id);
        return { success: true };
      }),
    checkPantryAvailability: protectedProcedure
      .input(z.object({ ingredientNames: z.array(z.string()) }))
      .query(async ({ ctx, input }) => {
        const available = await db.checkPantryAvailability(ctx.user.id, input.ingredientNames);
        return { availableKeys: Array.from(available) };
      }),
    // ── Generate AI menu from shopping list items ──────────────────────────
    generateMenuFromList: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const [listData, listItems, userAllergies, userRestrictions, userProfile] = await Promise.all([
          db.getShoppingListById(input.listId),
          db.getShoppingListItems(input.listId),
          db.getUserAllergies(ctx.user.id),
          db.getUserDietRestrictions(ctx.user.id),
          db.getUserProfile(ctx.user.id),
        ]);
        if (!listData) throw new TRPCError({ code: "NOT_FOUND", message: "Lista no encontrada" });
        // Verify ownership
        if ((listData as any).userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const items = (listItems ?? []) as any[];
        if (items.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "La lista está vacía" });
        const ingredientList = items
          .slice(0, 20)
          .map((row: any) => row.ingredient?.nameEs ?? row.item?.customName ?? row.item?.name ?? null)
          .filter(Boolean)
          .map((name: string) => `- ${name}`)
          .join("\n");
        const forbiddenBlock = buildForbiddenIngredientsBlock({
          allergies: userAllergies,
          restrictions: userRestrictions,
          dislikedIngredients: userProfile?.dislikedIngredients,
        });
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Eres un chef y nutricionista experto en cocina española y mediterránea. Genera un menú semanal completo usando principalmente los ingredientes de la lista de la compra del usuario. Responde SOLO con JSON válido.${forbiddenBlock ? '\n' + forbiddenBlock : ''}`,
            },
            {
              role: "user",
              content: `El usuario ha comprado estos ingredientes:\n${ingredientList}\n\nGenera un menú semanal para 7 días (lunes a domingo) con desayuno, comida y cena para cada día. Aprovecha al máximo los ingredientes de la lista. Para cada plato incluye: nombre del plato, momento del día (desayuno/comida/cena), ingredientes principales usados de la lista, calorías aproximadas y emoji representativo.
REGLAS OBLIGATORIAS POR FRANJA HORARIA:
- DESAYUNO: tostadas, cereales, avena, yogur, fruta, huevos revueltos, smoothie, batido, pan con aceite, granola. NUNCA: ensaladas, guisos, gazpacho, sopas, arroces, pastas, carnes asadas, pescados al horno, legumbres.
- COMIDA: plato principal completo con proteína + carbohidrato + verdura (ensaladas, arroces, pastas, carnes, pescados, legumbres, guisos).
- CENA: comida ligera (ensalada, crema de verduras, pescado a la plancha, tortilla, revueltos, verduras salteadas). NUNCA platos muy pesados ni gazpacho de cena.
Para cada plato incluye también: lista de ingredientes con cantidades (ingredients), tiempo de preparación (prepTime) y receta con pasos detallados (recipe.steps) y consejo (recipe.tips).`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "weekly_menu_from_list",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  menuName: { type: "string" },
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
                              mealType: { type: "string" },
                              name: { type: "string" },
                              emoji: { type: "string" },
                              calories: { type: "integer" },
                              usedIngredients: { type: "array", items: { type: "string" } },
                              ingredients: { type: "array", items: { type: "string" } },
                              prepTime: { type: "string" },
                              recipe: {
                                type: "object",
                                properties: {
                                  steps: { type: "array", items: { type: "string" } },
                                  tips: { type: "string" },
                                },
                                required: ["steps", "tips"],
                                additionalProperties: false,
                              },
                            },
                            required: ["mealType", "name", "emoji", "calories", "usedIngredients", "ingredients", "prepTime", "recipe"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["day", "meals"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["menuName", "days"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response?.choices?.[0]?.message?.content;
        const parsed = JSON.parse(typeof content === "string" ? content : '{"menuName":"Menú semanal","days":[]}');
        return { menu: parsed, ingredientCount: items.length };
      }),
  }),
  // ---------------------------------------------------------------------------
  // INVENTORYY
  // ---------------------------------------------------------------------------
  inventory: router({
    list: protectedProcedure.query(({ ctx }) => db.getInventoryItems(ctx.user.id)),

    add: protectedProcedure
      .input(
        z.object({
          ingredientId: z.number().optional(),
          customName: z.string().max(100, "Nombre máximo 100 caracteres").optional(),
          amount: z.number().min(0, "Cantidad no puede ser negativa").max(99999, "Cantidad demasiado grande"),
          measureId: z.number().optional(),
          storageLocationId: z.number().optional(),
          expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido").optional(),
          purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido").optional(),
          notes: z.string().max(200, "Notas máximo 200 caracteres").optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        if (!input.ingredientId && !input.customName?.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Debes indicar el nombre del alimento" });
        }
        return db.addInventoryItem({ ...input, userId: ctx.user.id } as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          amount: z.number().min(0, "Cantidad no puede ser negativa").max(99999).optional(),
          expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido").optional(),
          storageLocationId: z.number().optional(),
          notes: z.string().max(200, "Notas máximo 200 caracteres").optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userInventoryItems } = await import("../drizzle/schema.js");
        const { eq, and } = await import("drizzle-orm");
        // Verify ownership before updating
        const [existing] = await drizzleDb.select({ id: userInventoryItems.id })
          .from(userInventoryItems)
          .where(and(eq(userInventoryItems.id, input.id), eq(userInventoryItems.userId, ctx.user.id)))
          .limit(1);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
        const { id, ...data } = input;
        return db.updateInventoryItem(id, data as any);
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userInventoryItems } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // Verify ownership before deleting
        const existing = await drizzleDb.select().from(userInventoryItems)
          .where(and(eq(userInventoryItems.id, input.id), eq(userInventoryItems.userId, ctx.user.id)))
          .limit(1);
        if (existing.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
        await drizzleDb.delete(userInventoryItems).where(eq(userInventoryItems.id, input.id));
        return { success: true };
      }),

    // Import purchased items from a shopping list into the inventory
    importFromShoppingList: protectedProcedure
      .input(z.object({
        shoppingListId: z.number(),
        onlyChecked: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { shoppingListItems, shoppingLists, userInventoryItems } = await import("../drizzle/schema.js");
        const { eq, and } = await import("drizzle-orm");
        // Verify ownership
        const [list] = await drizzleDb.select({ userId: shoppingLists.userId })
          .from(shoppingLists).where(eq(shoppingLists.id, input.shoppingListId)).limit(1);
        if (!list) throw new TRPCError({ code: "NOT_FOUND", message: "Lista no encontrada" });
        requireOwnership(list.userId, ctx.user.id, ctx.user.role);
        // Get items from the shopping list
        const conditions = [eq(shoppingListItems.shoppingListId, input.shoppingListId)];
        if (input.onlyChecked) conditions.push(eq(shoppingListItems.checked, true));
        const items = await drizzleDb.select().from(shoppingListItems).where(and(...conditions));
        if (items.length === 0) return { imported: 0, skipped: 0 };
        let imported = 0;
        let skipped = 0;
        const today = new Date().toISOString().split("T")[0];
        for (const item of items) {
          if (!item.customName && !item.ingredientId) { skipped++; continue; }
          try {
            // Check if item already exists in inventory (by name or ingredientId)
            let existingItems: any[] = [];
            if (item.ingredientId) {
              existingItems = await drizzleDb.select({ id: userInventoryItems.id, amount: userInventoryItems.amount })
                .from(userInventoryItems)
                .where(and(eq(userInventoryItems.userId, ctx.user.id), eq(userInventoryItems.ingredientId, item.ingredientId)))
                .limit(1);
            } else if (item.customName) {
              const { ilike } = await import("drizzle-orm");
              existingItems = await drizzleDb.select({ id: userInventoryItems.id, amount: userInventoryItems.amount })
                .from(userInventoryItems)
                .where(and(eq(userInventoryItems.userId, ctx.user.id), ilike(userInventoryItems.customName, item.customName)))
                .limit(1);
            }
            if (existingItems.length > 0) {
              // Increment existing item amount
              const existing = existingItems[0];
              await drizzleDb.update(userInventoryItems)
                .set({ amount: (existing.amount ?? 0) + (item.amount ?? 1), updatedAt: new Date() })
                .where(eq(userInventoryItems.id, existing.id));
            } else {
              // Insert new inventory item
              await drizzleDb.insert(userInventoryItems).values({
                userId: ctx.user.id,
                ingredientId: item.ingredientId ?? undefined,
                customName: item.customName ?? undefined,
                amount: item.amount ?? 1,
                measureId: item.measureId ?? undefined,
                purchaseDate: today,
              });
            }
            imported++;
          } catch {
            skipped++;
          }
        }
        return { imported, skipped };
      }),

    // Deduct ingredients from inventory when a meal is consumed
    deductIngredients: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          name: z.string(),
          amount: z.number().min(0),
          ingredientId: z.number().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userInventoryItems } = await import("../drizzle/schema.js");
        const { eq, and, ilike } = await import("drizzle-orm");
        let deducted = 0;
        let notFound = 0;
        for (const item of input.items) {
          try {
            let existingItems: any[] = [];
            if (item.ingredientId) {
              existingItems = await drizzleDb.select({ id: userInventoryItems.id, amount: userInventoryItems.amount })
                .from(userInventoryItems)
                .where(and(eq(userInventoryItems.userId, ctx.user.id), eq(userInventoryItems.ingredientId, item.ingredientId)))
                .limit(1);
            }
            if (existingItems.length === 0 && item.name) {
              existingItems = await drizzleDb.select({ id: userInventoryItems.id, amount: userInventoryItems.amount })
                .from(userInventoryItems)
                .where(and(eq(userInventoryItems.userId, ctx.user.id), ilike(userInventoryItems.customName, item.name)))
                .limit(1);
            }
            if (existingItems.length === 0) { notFound++; continue; }
            const existing = existingItems[0];
            const newAmount = Math.max(0, (existing.amount ?? 0) - item.amount);
            if (newAmount === 0) {
              // Remove item from inventory if fully consumed
              await drizzleDb.delete(userInventoryItems).where(eq(userInventoryItems.id, existing.id));
            } else {
              await drizzleDb.update(userInventoryItems)
                .set({ amount: newAmount, updatedAt: new Date() })
                .where(eq(userInventoryItems.id, existing.id));
            }
            deducted++;
          } catch {
            notFound++;
          }
        }
        return { deducted, notFound };
      }),

    // Analyse a photo of fridge/pantry with vision LLM and return detected products
    analyzePhoto: protectedProcedure
      .input(z.object({ imageUrl: z.string() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Eres un asistente de nutrición. Analiza la imagen del frigorífico o despensa y devuelve ÚNICAMENTE un JSON válido con los productos detectados. Formato exacto:
{"products": [{"name": "Leche entera", "amount": 1, "unit": "litro", "category": "lácteo"}, ...]}
Si no puedes detectar productos, devuelve {"products": []}. No incluyas texto adicional fuera del JSON.`,
            },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: input.imageUrl, detail: "high" } },
                { type: "text", text: "Lista todos los productos alimenticios que ves en esta imagen con su cantidad aproximada y unidad." },
              ],
            },
          ],
        });
        const rawContent = response?.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "{\"products\": []}";
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          return JSON.parse(jsonMatch ? jsonMatch[0] : content) as { products: { name: string; amount: number; unit: string; category: string }[] };
        } catch {
          return { products: [] };
        }
      }),

    // Get items expiring soon (within N days)
    getExpiringItems: protectedProcedure
      .input(z.object({ days: z.number().default(7) }))
      .query(async ({ ctx, input }) => {
        const items = await db.getInventoryItems(ctx.user.id);
        const now = new Date();
        const cutoff = new Date(now.getTime() + input.days * 24 * 60 * 60 * 1000);
        return items.filter((row: any) => {
          const expDate = row.item?.expirationDate ?? row.expirationDate;
          if (!expDate) return false;
          const exp = new Date(expDate);
          return exp <= cutoff;
        }).sort((a: any, b: any) => {
          const aDate = a.item?.expirationDate ?? a.expirationDate;
          const bDate = b.item?.expirationDate ?? b.expirationDate;
          return new Date(aDate).getTime() - new Date(bDate).getTime();
        });
      }),

    // Get recipe recommendations based on expiring inventory ingredients
    getRecipesByExpiring: protectedProcedure
      .query(async ({ ctx }) => {
        const items = await db.getInventoryItems(ctx.user.id);
        const now = new Date();
        const cutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiring = items
          .filter((row: any) => row.item?.expirationDate && new Date(row.item.expirationDate) <= cutoff)
          .map((row: any) => row.ingredient?.nameEs ?? row.item?.customName ?? null)
          .filter(Boolean)
          .slice(0, 10);
        if (expiring.length === 0) {
          // Return some recent recipes if nothing is expiring
          const result = await db.getRecipes({ userId: ctx.user.id, limit: 6 });
          const recipes = Array.isArray(result) ? result : (result as any).recipes ?? result;
          return { recipes, expiringIngredients: [] };
        }
        // Search recipes that match expiring ingredients
        const result = await db.getRecipes({ userId: ctx.user.id, search: expiring[0] as string, limit: 6 });
        const recipes = Array.isArray(result) ? result : (result as any).recipes ?? result;
        return { recipes, expiringIngredients: expiring };
      }),

    // Recetas con lo que tienes en casa: cruza ingredientes del inventario con recetas
    getRecipesFromInventory: protectedProcedure
      .query(async ({ ctx }) => {
        // Obtener ingredientes del inventario del usuario
        const items = await db.getInventoryItems(ctx.user.id);
        const ingredientNames = items
          .map((row: any) => row.ingredient?.nameEs ?? row.item?.customName ?? null)
          .filter(Boolean)
          .slice(0, 15) as string[];

        if (ingredientNames.length === 0) {
          return { recipes: [], inventoryIngredients: [] };
        }

        // Buscar recetas que coincidan con los ingredientes del inventario
        // Hacemos varias búsquedas y desduplicamos por ID
        const recipeMap = new Map<number, any>();
        const searchTerms = ingredientNames.slice(0, 5); // Top 5 ingredientes
        for (const term of searchTerms) {
          const result = await db.getRecipes({ userId: ctx.user.id, search: term, limit: 8 });
          const found = Array.isArray(result) ? result : (result as any).recipes ?? result;
          for (const r of found) {
            if (!recipeMap.has(r.id)) recipeMap.set(r.id, r);
          }
          if (recipeMap.size >= 12) break;
        }

        // Ordenar por cuántos ingredientes del inventario coinciden
        const recipes = Array.from(recipeMap.values())
          .map(r => {
            const ingText = (r.ingredientsJson ?? r.ingredients ?? "").toString().toLowerCase();
            const matches = ingredientNames.filter(n => ingText.includes(n.toLowerCase())).length;
            return { ...r, _inventoryMatches: matches };
          })
          .sort((a, b) => b._inventoryMatches - a._inventoryMatches)
          .slice(0, 9);

        return { recipes, inventoryIngredients: ingredientNames };
      }),

    // Suggest expiration date for a product using AI (with fast lookup table fallback)
    suggestExpirationDate: protectedProcedure
      .input(z.object({ productName: z.string().min(1) }))
      .mutation(async ({ input }) => {
        // Fast lookup table for common products (avoids LLM call for most cases)
        const lookup: Record<string, number> = {
          // Lácteos
          leche: 7, "leche entera": 7, "leche desnatada": 7, "leche semidesnatada": 7,
          yogur: 14, "yogur griego": 14, queso: 21, "queso fresco": 5, "queso curado": 60,
          mantequilla: 30, nata: 7, "nata para cocinar": 14,
          // Carnes
          pollo: 3, "pechuga de pollo": 3, "muslos de pollo": 3,
          ternera: 4, "carne picada": 2, cerdo: 4, "lomo de cerdo": 4,
          "jamón": 5, "jamón serrano": 30, "jamón cocido": 7,
          salchichas: 5, chorizo: 14, "chorizo curado": 30,
          // Pescados
          "salmón": 2, merluza: 2, "atún": 2, "atún en lata": 730, bacalao: 3,
          gambas: 2, mejillones: 2,
          // Frutas
          manzana: 14, pera: 7, "plátano": 5, naranja: 14, "limón": 21,
          fresa: 4, uva: 7, "melón": 5, "sandía": 5, "melocotón": 5,
          aguacate: 4, mango: 5, "piña": 5, kiwi: 7,
          // Verduras
          lechuga: 5, tomate: 7, cebolla: 30, ajo: 60, patata: 30,
          zanahoria: 14, pimiento: 7, "calabacín": 7, berenjena: 7,
          espinacas: 4, "brócoli": 5, coliflor: 7, pepino: 7,
          // Huevos
          huevos: 28, huevo: 28,
          // Panadería
          pan: 3, "pan de molde": 7, baguette: 2, croissant: 2,
          // Pasta, arroz, legumbres
          pasta: 730, arroz: 730, lentejas: 730, garbanzos: 730,
          alubias: 730, quinoa: 730, avena: 365,
          // Conservas
          "tomate triturado": 730, "tomate frito": 730, aceitunas: 365,
          "aceite de oliva": 730, aceite: 365, vinagre: 730,
          // Bebidas
          zumo: 7, "zumo de naranja": 7, cerveza: 180, vino: 365,
          // Congelados
          "guisantes congelados": 365, "judías verdes congeladas": 365,
          // Salsas y condimentos
          mayonesa: 60, ketchup: 90, mostaza: 180, salsa: 14,
          // Dulces y snacks
          chocolate: 180, galletas: 90, cereales: 180,
        };

        const nameLower = input.productName.toLowerCase().trim();
        let days: number | undefined = lookup[nameLower];
        if (!days) {
          for (const [key, val] of Object.entries(lookup)) {
            if (nameLower.includes(key) || key.includes(nameLower)) {
              days = val;
              break;
            }
          }
        }

        if (days) {
          const date = new Date();
          date.setDate(date.getDate() + days);
          return { expirationDate: date.toISOString().split("T")[0], daysFromNow: days, source: "lookup" as const };
        }

        // Fallback: ask LLM for unknown products
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Eres un experto en seguridad alimentaria. Dado el nombre de un alimento, responde SOLO con un JSON con el campo "daysUntilExpiry" (número entero de días desde hoy hasta la caducidad típica en nevera/despensa). Sin texto adicional.`,
              },
              { role: "user", content: `Alimento: "${input.productName}"` },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "expiry_suggestion",
                strict: true,
                schema: {
                  type: "object",
                  properties: { daysUntilExpiry: { type: "integer", description: "Días hasta caducidad típica" } },
                  required: ["daysUntilExpiry"],
                  additionalProperties: false,
                },
              },
            },
          });
          const content = response?.choices?.[0]?.message?.content;
          const parsed = JSON.parse(typeof content === "string" ? content : "{}");
          const llmDays = Math.max(1, Math.min(3650, parsed.daysUntilExpiry || 7));
          const date = new Date();
          date.setDate(date.getDate() + llmDays);
          return { expirationDate: date.toISOString().split("T")[0], daysFromNow: llmDays, source: "ai" as const };
        } catch {
          const date = new Date();
          date.setDate(date.getDate() + 7);
          return { expirationDate: date.toISOString().split("T")[0], daysFromNow: 7, source: "fallback" as const };
        }
      }),

    // Generate AI recipes using expiring ingredients
    generateRecipesFromExpiring: protectedProcedure
      .mutation(async ({ ctx }) => {
        // CRITICAL SAFETY: Load user allergies and restrictions before generating
        const [items, expiringAllergies, expiringRestrictions, expiringProfile] = await Promise.all([
          db.getInventoryItems(ctx.user.id),
          db.getUserAllergies(ctx.user.id),
          db.getUserDietRestrictions(ctx.user.id),
          db.getUserProfile(ctx.user.id),
        ]);
        const now = new Date();
        const cutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiring = items
          .filter((row: any) => row.item?.expirationDate && new Date(row.item.expirationDate) <= cutoff)
          .map((row: any) => ({
            name: row.ingredient?.nameEs ?? row.item?.customName ?? "Alimento",
            daysLeft: Math.ceil((new Date(row.item.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          }))
          .slice(0, 8);

        if (expiring.length === 0) {
          return { recipes: [], message: "No tienes productos próximos a caducar." };
        }

        const ingredientList = expiring.map((e: any) => `- ${e.name} (caduca en ${e.daysLeft} días)`).join("\n");
        const expiringForbiddenBlock = buildForbiddenIngredientsBlock({
          allergies: expiringAllergies,
          restrictions: expiringRestrictions,
          dislikedIngredients: expiringProfile?.dislikedIngredients,
        });
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Eres un chef experto en cocina española y mediterránea. Genera recetas usando los ingredientes que están a punto de caducar para evitar el desperdicio alimentario. Responde SOLO con JSON válido.${expiringForbiddenBlock ? '\n' + expiringForbiddenBlock : ''}`,
              },
              {
                role: "user",
                content: `Tengo estos ingredientes próximos a caducar:\n${ingredientList}\n\nGenera 3 recetas que aprovechen estos ingredientes. Para cada receta incluye: nombre, descripción breve (1 frase), tiempo de preparación en minutos, dificultad (Fácil/Media/Difícil), ingredientes principales usados de la lista, y emoji representativo.`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "expiring_recipes",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    recipes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          description: { type: "string" },
                          prepTime: { type: "integer" },
                          difficulty: { type: "string" },
                          usedIngredients: { type: "array", items: { type: "string" } },
                          emoji: { type: "string" },
                        },
                        required: ["name", "description", "prepTime", "difficulty", "usedIngredients", "emoji"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["recipes"],
                  additionalProperties: false,
                },
              },
            },
          });
          const content = response?.choices?.[0]?.message?.content;
          const parsed = JSON.parse(typeof content === "string" ? content : '{"recipes":[]}');
          return { recipes: parsed.recipes || [], expiringIngredients: expiring };
        } catch {
          return { recipes: [], expiringIngredients: expiring, message: "No se pudieron generar recetas en este momento. Inténtalo de nuevo." };
        }
      }),
    // Generate AI recipes using ALL inventory items (not just expiring)
    generateRecipesFromInventory: protectedProcedure
      .mutation(async ({ ctx }) => {
        const [items, userAllergies, userRestrictions, userProfile] = await Promise.all([
          db.getInventoryItems(ctx.user.id),
          db.getUserAllergies(ctx.user.id),
          db.getUserDietRestrictions(ctx.user.id),
          db.getUserProfile(ctx.user.id),
        ]);
        if (items.length === 0) {
          return { recipes: [], message: "Tu inventario está vacío. Añade productos primero." };
        }
        const ingredientList = items
          .slice(0, 15)
          .map((row: any) => row.ingredient?.nameEs ?? row.item?.customName ?? null)
          .filter(Boolean)
          .map((name: string) => `- ${name}`)
          .join("\n");
        const forbiddenBlock = buildForbiddenIngredientsBlock({
          allergies: userAllergies,
          restrictions: userRestrictions,
          dislikedIngredients: userProfile?.dislikedIngredients,
        });
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Eres un chef experto en cocina española y mediterránea. Genera recetas usando los ingredientes disponibles en el inventario del usuario. Responde SOLO con JSON válido.${forbiddenBlock ? '\n' + forbiddenBlock : ''}`,
              },
              {
                role: "user",
                content: `Tengo estos ingredientes en mi despensa/nevera:\n${ingredientList}\n\nGenera 4 recetas variadas (desayuno, comida, cena, snack) que aprovechen estos ingredientes. Para cada receta incluye: nombre, descripción breve (1 frase), tiempo de preparación en minutos, dificultad (Fácil/Media/Difícil), calorías aproximadas, ingredientes principales usados de la lista, y emoji representativo y tipo de comida (desayuno/comida/cena/snack).`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "inventory_recipes",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    recipes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          description: { type: "string" },
                          prepTime: { type: "integer" },
                          difficulty: { type: "string" },
                          calories: { type: "integer" },
                          usedIngredients: { type: "array", items: { type: "string" } },
                          emoji: { type: "string" },
                          mealType: { type: "string" },
                        },
                        required: ["name", "description", "prepTime", "difficulty", "calories", "usedIngredients", "emoji", "mealType"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["recipes"],
                  additionalProperties: false,
                },
              },
            },
          });
          const content2 = response?.choices?.[0]?.message?.content;
          const parsed2 = JSON.parse(typeof content2 === "string" ? content2 : '{"recipes":[]}');
          return { recipes: parsed2.recipes || [] };
        } catch {
          return { recipes: [], message: "No se pudieron generar recetas. Inténtalo de nuevo." };
        }
      }),
  }),
  // ---------------------------------------------------------------------------
  // MEAL LOGSS
  // ---------------------------------------------------------------------------
  mealLogs: router({
    list: protectedProcedure
      .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(({ ctx, input }) => db.getMealLogs(ctx.user.id, input.startDate, input.endDate)),

    dailySummary: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(({ ctx, input }) => db.getDailyNutritionSummary(ctx.user.id, input.date)),

    exportCSV: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const logs = await db.getMealLogs(ctx.user.id, input.startDate, input.endDate);
        if (!logs || (logs as any[]).length === 0) return { csv: "", count: 0 };

        const rows = logs as any[];
        const headers = ["Fecha", "Franja", "Nombre", "Calorías", "Proteínas (g)", "Carbohidratos (g)", "Grasas (g)", "Fibra (g)", "Fuente"];
        const csvRows = rows.map((r: any) => [
          r.logDate ?? r.date ?? "",
          r.dayPartName ?? r.mealType ?? "",
          (r.foodName ?? r.name ?? "").replace(/,/g, ";"),
          r.calories ?? 0,
          r.protein ?? 0,
          r.carbs ?? 0,
          r.fat ?? 0,
          r.fiber ?? 0,
          r.source ?? "manual",
        ].join(","));

        const csv = [headers.join(","), ...csvRows].join("\n");
        return { csv, count: rows.length };
      }),

    monthlySummary: protectedProcedure
      .input(z.object({
        year: z.number().int().min(2020).max(2100),
        month: z.number().int().min(1).max(12),
        calorieGoal: z.number().int().min(500).max(10000).default(2000),
        goalType: z.enum(["perdida_peso", "ganancia_muscular", "tonificacion", "perdida_grasa", "mantenimiento", "bienestar", "vegano"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const days = await db.getMonthlyCalorieSummary(ctx.user.id, input.year, input.month);
        const goal = input.calorieGoal;
        const isWeightLoss = input.goalType === "perdida_peso" || input.goalType === "perdida_grasa";
        const result = days.map((d) => {
          const pct = goal > 0 ? d.calories / goal : 0;
          let color: "green" | "red" | "orange" | null = null;
          if (d.hasLogs) {
            if (isWeightLoss) {
              if (pct > 1.0) color = "red";
              else if (pct >= 0.34) color = "green";
              else color = "orange";
            } else {
              if (pct > 1.1) color = "red";
              else if (pct >= 0.66) color = "green";
              else color = "orange";
            }
          }
          return { date: d.date, calories: d.calories, color };
        });
        return { days: result, goal, isWeightLoss };
      }),

    add: protectedProcedure
      .input(
        z.object({
          recipeId: z.number().optional(),
          customMealName: z.string().max(100, "Nombre máximo 100 caracteres").optional(),
          dayPartId: z.number().optional(),
          logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
          servings: z.number().min(0.1, "Raciones mínimas 0.1").max(20, "Raciones máximas 20").optional(),
          calories: z.number().min(0, "Calorías no pueden ser negativas").max(10000, "Calorías demasiado altas").optional(),
          proteins: z.number().min(0).max(1000).optional(),
          carbohydrates: z.number().min(0).max(1000).optional(),
          fats: z.number().min(0).max(1000).optional(),
          notes: z.string().max(300, "Notas máximo 300 caracteres").optional(),
          photoUrl: z.string().url("URL de foto inválida").optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tier = await getUserPlanTier(ctx.user.id, ctx.user.role);
        requirePlanFeature(tier, "canAccessDiary");
        if (!input.recipeId && !input.customMealName?.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Debes indicar el nombre de la comida" });
        }
        // Pass logDate as plain string (YYYY-MM-DD) to avoid UTC midnight timezone shift
        // new Date('2026-04-06') creates UTC midnight which PostgreSQL converts to the previous day in some timezones
        return db.addMealLog({ ...input, userId: ctx.user.id, logDate: input.logDate } as any);
      }),

    analyzeFood: protectedProcedure
      .input(z.object({
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        // 0. Load user allergies from profile (for allergen detection)
        const userAllergyRows = await db.getUserAllergies(ctx.user.id);
        const userAllergyNames = userAllergyRows.map((r) => r.allergy.nameEs.toLowerCase());
        // Also load menuAllergies (free-text from questionnaire preferences)
        let menuAllergyNames: string[] = [];
        try {
          const drizzleDb = await db.getDb();
          if (drizzleDb) {
            const { userProfiles } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const profileRow = await drizzleDb.select({ menuAllergies: userProfiles.menuAllergies }).from(userProfiles).where(eq(userProfiles.userId, ctx.user.id)).limit(1);
            if (profileRow[0]?.menuAllergies) {
              menuAllergyNames = (JSON.parse(profileRow[0].menuAllergies) as string[]).map((a) => a.toLowerCase());
            }
          }
        } catch { /* non-critical */ }
        const allUserAllergyNames = Array.from(new Set([...userAllergyNames, ...menuAllergyNames]));

        // 1. Upload image to S3 (non-critical — for display purposes only)
        let photoUrl: string | null = null;
        try {
          const imageBuffer = Buffer.from(input.imageBase64, "base64");
          const fileKey = `meal-photos/${ctx.user.id}-${Date.now()}.jpg`;
          const result = await storagePut(fileKey, imageBuffer, input.mimeType);
          photoUrl = result.url;
        } catch {
          // S3 failure is non-critical; analysis can still proceed
        }

        // 2. Analyze with vision AI — prefer S3 URL (avoids base64 size limits that cause 10001 errors),
        // fall back to data URL only if S3 upload failed
        const imageUrl = photoUrl ?? `data:${input.mimeType};base64,${input.imageBase64}`;
        // Build allergen context for the prompt if user has allergies
        const allergenContext = allUserAllergyNames.length > 0
          ? `\n\nIMPORTANTE - ALERGIAS DEL USUARIO: El usuario es alérgico a: ${allUserAllergyNames.join(", ")}. Para cada alimento identificado, añade el campo "allergens" con un array de los alérgenos de esa lista que contiene ese alimento (puede estar vacío []). También añade al JSON raíz el campo "detectedUserAllergens" con los alérgenos del usuario que hayas detectado en el plato.`
          : "";

        let analysis: { mealName: string; foods: Array<{ name: string; quantity: string; calories: number; proteins: number; carbs: number; fats: number; allergens?: string[] }>; totalCalories: number; totalProteins: number; totalCarbs: number; totalFats: number; confidence: string; notes: string; detectedUserAllergens?: string[] };
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Eres un nutricionista experto en análisis visual de alimentos. Analiza la imagen de comida y devuelve SOLO un JSON válido con los alimentos detectados y sus valores nutricionales estimados por porción visible. Sé específico con los alimentos identificados.`,
              },
              {
                role: "user",
                content: [
                  { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
                  {
                    type: "text",
                    text: `Analiza esta imagen de comida y devuelve SOLO este JSON (sin texto adicional, sin markdown, sin explicaciones):
{"mealName":"nombre descriptivo del plato","foods":[{"name":"nombre del alimento","quantity":"cantidad estimada (ej: 150g, 1 unidad)","calories":0,"proteins":0,"carbs":0,"fats":0,"allergens":[]}],"totalCalories":0,"totalProteins":0,"totalCarbs":0,"totalFats":0,"confidence":"alta|media|baja","notes":"observaciones nutricionales relevantes","detectedUserAllergens":[]}

IMPORTANTE: Estima los valores nutricionales basándote en las porciones visibles. Si no puedes identificar la comida con certeza, indica confidence "baja".${allergenContext}`,
                  },
                ],
              },
            ],
          });
          const content = response.choices[0]?.message?.content ?? "{}";
          const jsonStr = typeof content === "string" ? content : JSON.stringify(content);
          const cleaned = jsonStr
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          analysis = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
          if (!analysis.foods) analysis.foods = [];
          if (!analysis.totalCalories) analysis.totalCalories = analysis.foods.reduce((s: number, f: any) => s + (f.calories || 0), 0);
          if (!analysis.totalProteins) analysis.totalProteins = analysis.foods.reduce((s: number, f: any) => s + (f.proteins || 0), 0);
          if (!analysis.totalCarbs) analysis.totalCarbs = analysis.foods.reduce((s: number, f: any) => s + (f.carbs || 0), 0);
          if (!analysis.totalFats) analysis.totalFats = analysis.foods.reduce((s: number, f: any) => s + (f.fats || 0), 0);
          // Fallback allergen detection: cross-check food names against user allergy list
          // in case the LLM didn't fill detectedUserAllergens
          if (!analysis.detectedUserAllergens || analysis.detectedUserAllergens.length === 0) {
            const detected = new Set<string>();
            for (const allergyName of allUserAllergyNames) {
              const allergyKeywords = allergyName.split(/[\s,/]+/);
              for (const food of analysis.foods) {
                const foodLower = food.name.toLowerCase();
                if (allergyKeywords.some((kw: string) => kw.length > 3 && foodLower.includes(kw))) {
                  detected.add(allergyName);
                }
              }
            }
            analysis.detectedUserAllergens = Array.from(detected);
          }
        } catch {
          analysis = {
            mealName: "Comida detectada",
            foods: [],
            totalCalories: 0,
            totalProteins: 0,
            totalCarbs: 0,
            totalFats: 0,
            confidence: "baja",
            notes: "No se pudo analizar la imagen automáticamente. Por favor, introduce los valores manualmente.",
            detectedUserAllergens: [],
          };
        }
        return { photoUrl, analysis };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { mealLogs } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // Verify ownership before deleting
        const existing = await drizzleDb.select().from(mealLogs)
          .where(and(eq(mealLogs.id, input.id), eq(mealLogs.userId, ctx.user.id)))
          .limit(1);
        if (existing.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Registro no encontrado" });
        await drizzleDb.delete(mealLogs).where(eq(mealLogs.id, input.id));
        return { success: true };
      }),

    getStreak: protectedProcedure.query(async ({ ctx }) => {
      try {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { currentStreak: 0, longestStreak: 0 };
        const { mealLogs: logsTable } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        // Get all unique log dates (descending)
        const rows = await drizzleDb
          .selectDistinct({ logDate: logsTable.logDate })
          .from(logsTable)
          .where(eq(logsTable.userId, ctx.user.id))
          .orderBy(desc(logsTable.logDate));
        if (rows.length === 0) return { currentStreak: 0, longestStreak: 0 };
        // Sort dates descending
        const dates = rows
          .map(r => new Date(r.logDate).toISOString().split("T")[0])
          .sort()
          .reverse();
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        // Current streak: must include today or yesterday
        let currentStreak = 0;
        if (dates[0] === today || dates[0] === yesterday) {
          currentStreak = 1;
          for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i - 1]);
            const curr = new Date(dates[i]);
            const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
            if (diffDays === 1) currentStreak++;
            else break;
          }
        }
        // Longest streak
        let longestStreak = currentStreak;
        let tempStreak = 1;
        for (let i = 1; i < dates.length; i++) {
          const prev = new Date(dates[i - 1]);
          const curr = new Date(dates[i]);
          const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
          if (diffDays === 1) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 1;
          }
        }
        return { currentStreak, longestStreak };
      } catch {
        return { currentStreak: 0, longestStreak: 0 };
      }
    }),

    lookupBarcode: protectedProcedure
      .input(z.object({ barcode: z.string().min(4).max(30) }))
      .query(async ({ ctx, input }) => {
        const OFF_URL = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(input.barcode)}.json?fields=product_name,product_name_es,nutriments,image_front_small_url,image_front_url,brands,quantity,serving_size,nutriscore_grade,nova_group,ecoscore_grade`;
        // Retry helper: try up to 2 times with 10s timeout each
        const fetchWithRetry = async (url: string, attempts = 2): Promise<Response> => {
          for (let i = 0; i < attempts; i++) {
            try {
              const res = await fetch(url, {
                headers: { "User-Agent": "BuddyOne/1.0 (luis@buddyone.io)" },
                signal: AbortSignal.timeout(10000),
              });
              if (res.ok) return res;
              if (res.status === 404) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
            } catch (e: any) {
              if (e instanceof TRPCError) throw e;
              if (i === attempts - 1) throw e; // last attempt: propagate
              await new Promise(r => setTimeout(r, 1500)); // wait before retry
            }
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo conectar con la base de datos de productos" });
        };
        try {
          const response = await fetchWithRetry(OFF_URL);
          const data = await response.json() as any;
          if (data.status !== 1 || !data.product) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado en la base de datos" });
          }
          const p = data.product;
          const n = p.nutriments || {};
          // Track barcode scan usage (fire-and-forget, non-blocking)
          const drizzleDb = await db.getDb();
          if (drizzleDb) {
            const { featureEvents } = await import("../drizzle/schema.js");
            drizzleDb.insert(featureEvents).values({
              userId: ctx.user.id,
              feature: "barcode_scan",
              metadata: JSON.stringify({ barcode: input.barcode, found: true }),
            }).catch(() => {});
          }
          return {
            barcode: input.barcode,
            name: (p.product_name_es || p.product_name || "Producto desconocido").trim(),
            brand: p.brands ? p.brands.split(",")[0].trim() : null,
            quantity: p.quantity || null,
            imageUrl: p.image_front_url || p.image_front_small_url || null,
            nutriScore: (p.nutriscore_grade as string | null) || null,
            novaGroup: p.nova_group ? Number(p.nova_group) : null,
            per100g: {
              calories: Math.round(Number(n["energy-kcal_100g"]) || 0),
              proteins: Math.round((Number(n["proteins_100g"]) || 0) * 10) / 10,
              carbohydrates: Math.round((Number(n["carbohydrates_100g"]) || 0) * 10) / 10,
              fats: Math.round((Number(n["fat_100g"]) || 0) * 10) / 10,
              fiber: Math.round((Number(n["fiber_100g"]) || 0) * 10) / 10,
              sugars: Math.round((Number(n["sugars_100g"]) || 0) * 10) / 10,
              saturatedFat: Math.round((Number(n["saturated-fat_100g"]) || 0) * 10) / 10,
              salt: Math.round((Number(n["salt_100g"]) || 0) * 100) / 100,
            },
          };
        } catch (err: any) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al consultar la base de datos de productos" });
        }
      }),

    nutritionalHistory: protectedProcedure
      .input(z.object({ days: z.number().min(7).max(90).default(30) }))
      .query(async ({ ctx, input }) => {
        try {
          const drizzleDb = await db.getDb();
          if (!drizzleDb) return { data: [] };
          const { mealLogs: logsTable } = await import("../drizzle/schema");
          const { eq, gte, sql } = await import("drizzle-orm");
          // Calculate start date
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);
          const startDateStr = startDate.toISOString().split("T")[0];
          // Get daily aggregated data
          const rows = await drizzleDb
            .select({
              date: logsTable.logDate,
              calories: sql<number>`COALESCE(SUM(${logsTable.calories}), 0)`,
              proteins: sql<number>`COALESCE(SUM(${logsTable.proteins}), 0)`,
              carbohydrates: sql<number>`COALESCE(SUM(${logsTable.carbohydrates}), 0)`,
              fats: sql<number>`COALESCE(SUM(${logsTable.fats}), 0)`,
            })
            .from(logsTable)
            .where(eq(logsTable.userId, ctx.user.id))
            .groupBy(logsTable.logDate)
            .orderBy(logsTable.logDate);
          // Filter by date range and format
          const data = rows
            .filter(r => {
              const dateStr = new Date(r.date).toISOString().split("T")[0];
              return dateStr >= startDateStr;
            })
            .map(r => ({
              date: new Date(r.date).toISOString().split("T")[0],
              calories: Math.round(Number(r.calories) || 0),
              proteins: Math.round(Number(r.proteins) || 0),
              carbohydrates: Math.round(Number(r.carbohydrates) || 0),
              fats: Math.round(Number(r.fats) || 0),
            }));
          return { data };
        } catch {
          return { data: [] };
        }
      }),

    getDailyAnalysis: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          const drizzleDb = await db.getDb();
          if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
        const { menus, menuRecipesgsTable, userProfiles } = await import("../drizzle/schema");
          const { eq, and, gte, lte } = await import("drizzle-orm");
          const [profile] = await drizzleDb.select().from(userProfiles).where(eq(userProfiles.userId, ctx.user.id)).limit(1);
          const logs = await drizzleDb.select().from(mealLogsTable).where(and(eq(mealLogsTable.userId, ctx.user.id), gte(mealLogsTable.logDate, input.date), lte(mealLogsTable.logDate, input.date)));
          if (logs.length === 0) return { hasData: false, analysis: null, totalCalories: 0, totalProteins: 0, totalCarbs: 0, totalFats: 0, dailyCalorieGoal: 2000, tmb: 0, tdee: 0, deficit: 0, deficitExplanation: '', goal: 'maintenance' };
          const totalCalories = logs.reduce((s, l) => s + (Number(l.calories) || 0), 0);
          const totalProteins = logs.reduce((s, l) => s + (Number(l.proteins) || 0), 0);
          const totalCarbs = logs.reduce((s, l) => s + (Number(l.carbohydrates) || 0), 0);
          const totalFats = logs.reduce((s, l) => s + (Number(l.fats) || 0), 0);
          const weight = profile?.weight ? Number(profile.weight) : 70;
          const height = profile?.height ? Number(profile.height) : 170;
          const age = profile?.age ? Number(profile.age) : 30;
          const gender = profile?.gender ?? 'male';
          const activityLevel = (profile as any)?.activityLevel ?? 'moderate';
          const goal = (profile as any)?.goal ?? 'maintenance';
          const trainingDays = (profile as any)?.trainingDaysPerWeek ?? (profile as any)?.weeklyTrainingDays ?? null;
          const dailyCalorieGoal = profile?.dailyCalorieGoal ? Number(profile.dailyCalorieGoal) : 2000;
          const tmb = gender === 'female' ? 655 + (9.6 * weight) + (1.8 * height) - (4.7 * age) : 66 + (13.7 * weight) + (5 * height) - (6.8 * age);
          const actMult: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
          const tdee = Math.round(tmb * (actMult[activityLevel] ?? 1.55));
          const deficit = dailyCalorieGoal - Math.round(totalCalories);
          const goalLabels: Record<string, string> = { weight_loss: 'p\u00e9rdida de peso', muscle_gain: 'ganancia muscular', maintenance: 'mantenimiento', toning: 'tonificaci\u00f3n', fat_loss: 'p\u00e9rdida de grasa' };
          const goalLabel = goalLabels[goal] ?? goal;
          const deficitExplanation = `Tu TDEE (gasto energ\u00e9tico total) es ~${tdee} kcal/d\u00eda. Tu objetivo cal\u00f3rico de ${dailyCalorieGoal} kcal est\u00e1 ajustado para ${goalLabel}. ${deficit > 0 ? `Te quedan ${deficit} kcal para llegar a tu objetivo.` : deficit < 0 ? `Has superado tu objetivo en ${Math.abs(deficit)} kcal.` : '\u00a1Has alcanzado exactamente tu objetivo!'}`;
          const mealNames = logs.map(l => l.customMealName ?? 'comida').join(', ');

          // ── Historial 7 dias para deteccion de tendencias ──
          const sevenDaysAgo = new Date(input.date);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
          const historyLogs = await drizzleDb.select().from(mealLogsTable).where(
            and(eq(mealLogsTable.userId, ctx.user.id), gte(mealLogsTable.logDate, sevenDaysAgoStr), lte(mealLogsTable.logDate, input.date))
          );
          const dayMap: Record<string, { kcal: number; prot: number; carbs: number; fats: number }> = {};
          for (const l of historyLogs) {
            const d = l.logDate;
            if (!dayMap[d]) dayMap[d] = { kcal: 0, prot: 0, carbs: 0, fats: 0 };
            dayMap[d].kcal += Number(l.calories) || 0;
            dayMap[d].prot += Number(l.proteins) || 0;
            dayMap[d].carbs += Number(l.carbohydrates) || 0;
            dayMap[d].fats += Number(l.fats) || 0;
          }
          const historyDays = Object.entries(dayMap).filter(([d]) => d !== input.date).slice(-6);
          const targetProteins = Math.round(dailyCalorieGoal * 0.30 / 4);
          const targetCarbs = Math.round(dailyCalorieGoal * 0.45 / 4);
          const targetFats = Math.round(dailyCalorieGoal * 0.25 / 9);
          const trendDays = historyDays.length;
          const lowProtDays = historyDays.filter(([, v]) => v.prot < targetProteins * 0.8).length;
          const highFatDays = historyDays.filter(([, v]) => v.fats > targetFats * 1.1).length;
          const lowCarbDays = historyDays.filter(([, v]) => v.carbs < targetCarbs * 0.7).length;
          const excessCalDays = historyDays.filter(([, v]) => v.kcal > dailyCalorieGoal * 1.1).length;
          const lowCalDays = historyDays.filter(([, v]) => v.kcal > 0 && v.kcal < dailyCalorieGoal * 0.75).length;
          const trends: string[] = [];
          if (trendDays >= 3) {
            if (lowProtDays >= 3) trends.push(`TENDENCIA (${lowProtDays}/${trendDays} dias): Proteina baja de forma repetida. Puede estar frenando la recomposicion corporal.`);
            if (highFatDays >= 3) trends.push(`TENDENCIA (${highFatDays}/${trendDays} dias): Grasas elevadas de forma repetida. Revisa aceite y frutos secos.`);
            if (lowCarbDays >= 3) trends.push(`TENDENCIA (${lowCarbDays}/${trendDays} dias): Carbohidratos muy bajos de forma repetida. Puede afectar el rendimiento en entrenamientos.`);
            if (excessCalDays >= 3) trends.push(`TENDENCIA (${excessCalDays}/${trendDays} dias): Exceso calorico repetido. Revisa cenas o snacks.`);
            if (lowCalDays >= 3) trends.push(`TENDENCIA (${lowCalDays}/${trendDays} dias): Deficit excesivo repetido (<75% objetivo). Riesgo de perdida muscular.`);
          }
          const trendsText = trends.length > 0 ? `\n\nTENDENCIAS DETECTADAS EN LOS ULTIMOS 7 DIAS:\n${trends.join('\n')}` : '';

          const activityLabels: Record<string, string> = { sedentary: 'sedentario', light: 'ligero', moderate: 'moderado', active: 'activo', very_active: 'muy activo' };
          const activityLabel = activityLabels[activityLevel] ?? activityLevel;
          const trainingInfo = trainingDays ? `fuerza ${trainingDays} dias/semana` : 'entrenamiento regular';

          const systemPrompt = `Eres un nutricionista deportivo experto en recomposicion corporal (perdida de grasa manteniendo masa muscular). Tu objetivo es analizar el dia nutricional del usuario y proporcionarle recomendaciones claras, accionables y personalizadas. Responde SIEMPRE en espanol. Tono: cercano, directo, motivador. Sin tecnicismos innecesarios. Maximo 150 palabras en el campo evaluation.`;

          const userPrompt = `CONTEXTO DEL USUARIO:
- Peso: ${weight} kg | Altura: ${height} cm | Edad: ${age} anos | Sexo: ${gender === 'female' ? 'mujer' : 'hombre'}
- Nivel de actividad: ${activityLabel}
- Entrenamiento: ${trainingInfo}
- Objetivo: ${goalLabel}
- TDEE estimado: ${tdee} kcal/dia

DATOS DEL DIA (${input.date}):
- Calorias: ${Math.round(totalCalories)} / ${dailyCalorieGoal} kcal (${Math.round((totalCalories/dailyCalorieGoal)*100)}%)
- Proteina: ${Math.round(totalProteins)}g / ${targetProteins}g (${Math.round((totalProteins/targetProteins)*100)}%) — rango optimo recomposicion: ${(weight*1.6).toFixed(0)}-${(weight*2.2).toFixed(0)}g/dia
- Carbohidratos: ${Math.round(totalCarbs)}g / ${targetCarbs}g (${Math.round((totalCarbs/targetCarbs)*100)}%)
- Grasas: ${Math.round(totalFats)}g / ${targetFats}g (${Math.round((totalFats/targetFats)*100)}%)
- Comidas registradas: ${mealNames}${trendsText}

REGLAS DE ANALISIS:
1. Si el objetivo es perder grasa: prioriza proteina alta (1.6-2.2g/kg), detecta carbos bajos (rinde peor), grasas desplazando macros, deficit extremo.
2. Evalua el BALANCE REAL: equilibrado? permite rendir? sostenible?
3. Detecta errores: proteina correcta pero mala distribucion, deficit excesivo, falta energia, exceso grasas.
4. Adapta al contexto: no es lo mismo sedentario que alguien que entrena fuerza.
5. Si hay tendencias, incluyelas en el analisis como patron repetido y en trend_alert.`;

          const aiResp = await invokeLLM({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_schema', json_schema: { name: 'daily_analysis', strict: true, schema: { type: 'object', properties: { headline: { type: 'string' }, evaluation: { type: 'string' }, score: { type: 'number' }, strengths: { type: 'array', items: { type: 'string' } }, improvements: { type: 'array', items: { type: 'string' } }, recommendations: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, calories: { type: 'number' }, reason: { type: 'string' } }, required: ['name', 'calories', 'reason'], additionalProperties: false } }, impact: { type: 'string' }, trend_alert: { type: ['string', 'null'] } }, required: ['headline', 'evaluation', 'score', 'strengths', 'improvements', 'recommendations', 'impact', 'trend_alert'], additionalProperties: false } } }
          });
          let analysis: any = null;
          try { const c = aiResp?.choices?.[0]?.message?.content; analysis = typeof c === 'string' ? JSON.parse(c) : c; } catch (_) {}
          return { hasData: true, totalCalories: Math.round(totalCalories), totalProteins: Math.round(totalProteins), totalCarbs: Math.round(totalCarbs), totalFats: Math.round(totalFats), dailyCalorieGoal, tmb: Math.round(tmb), tdee, deficit, deficitExplanation, goal, analysis };
        } catch (e) {
          console.error('[getDailyAnalysis] error:', e);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error al generar el an\u00e1lisis' });
        }
      }),

    transcribeVoice: protectedProcedure
      .input(z.object({
        audioBase64: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Upload audio to S3 temporarily
          const { storagePut } = await import('./storage');
          const audioBuffer = Buffer.from(input.audioBase64, 'base64');
          const fileKey = `voice-logs/tmp-${Date.now()}.webm`;
          const { url: audioUrl } = await storagePut(fileKey, audioBuffer, 'audio/webm');

          // Transcribe with Whisper
          const { transcribeAudio } = await import('./_core/voiceTranscription');
          const transcription = await transcribeAudio({ audioUrl, language: 'es' });
          const transcript = transcription.text?.trim() || '';

          if (!transcript) {
            return { transcript: '', mealName: '', calories: 0, proteins: 0, carbs: 0, fats: 0 };
          }

          // Estimate nutrition from transcript
          const { invokeLLM } = await import('./_core/llm');
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'Eres un nutricionista experto. Responde siempre con JSON válido.' },
              { role: 'user', content: `El usuario ha dicho: "${transcript}". Estima los valores nutricionales.\nResponde SOLO con JSON: {"mealName":"...","calories":0,"proteins":0,"carbs":0,"fats":0}` },
            ],
            response_format: { type: 'json_schema', json_schema: {
              name: 'voice_nutrition',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  mealName: { type: 'string' },
                  calories: { type: 'number' },
                  proteins: { type: 'number' },
                  carbs: { type: 'number' },
                  fats: { type: 'number' },
                },
                required: ['mealName', 'calories', 'proteins', 'carbs', 'fats'],
                additionalProperties: false,
              },
            }},
          });
          const content = response.choices?.[0]?.message?.content;
          const data = typeof content === 'string' ? JSON.parse(content) : (content || {});
          return {
            transcript,
            mealName: String(data.mealName || transcript),
            calories: Math.round(Number(data.calories) || 0),
            proteins: Math.round(Number(data.proteins) || 0),
            carbs: Math.round(Number(data.carbs) || 0),
            fats: Math.round(Number(data.fats) || 0),
          };
        } catch (e) {
          console.error('[transcribeVoice] error:', e);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error al procesar el audio' });
        }
      }),

    estimateFromText: protectedProcedure
      .input(z.object({
        text: z.string().min(2).max(300),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        const prompt = `Eres un nutricionista experto. El usuario ha escrito: "${input.text}".
Estima los valores nutricionales aproximados para esa comida/alimento.
Responde SOLO con JSON válido, sin texto adicional:
{
  "mealName": "nombre normalizado del alimento",
  "calories": número,
  "proteins": número en gramos,
  "carbs": número en gramos,
  "fats": número en gramos,
  "confidence": "alta" | "media" | "baja"
}`;
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'Eres un nutricionista experto. Responde siempre con JSON válido.' },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_schema', json_schema: {
              name: 'nutrition_estimate',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  mealName: { type: 'string' },
                  calories: { type: 'number' },
                  proteins: { type: 'number' },
                  carbs: { type: 'number' },
                  fats: { type: 'number' },
                  confidence: { type: 'string' },
                },
                required: ['mealName', 'calories', 'proteins', 'carbs', 'fats', 'confidence'],
                additionalProperties: false,
              },
            }},
          });
          const content = response.choices?.[0]?.message?.content;
          if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No response from LLM" });
          const data = typeof content === 'string' ? JSON.parse(content) : content;
          return {
            mealName: String(data.mealName || input.text),
            calories: Math.round(Number(data.calories) || 0),
            proteins: Math.round(Number(data.proteins) || 0),
            carbs: Math.round(Number(data.carbs) || 0),
            fats: Math.round(Number(data.fats) || 0),
            confidence: String(data.confidence || 'media'),
          };
        } catch (e) {
          console.error('[estimateFromText] error:', e);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No se pudo estimar las calorías' });
        }
      }),

    submitAIFeedback: protectedProcedure
      .input(z.object({
        mealLogId: z.number().optional(),
        rating: z.number().min(1).max(5),
        accurate: z.boolean(),
        comment: z.string().max(500).optional(),
        detectedDishName: z.string().max(256).optional(),
        detectedCalories: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const drizzleDb = await db.getDb();
          if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
          const { aiFeedback: aiFeedbackTable } = await import("../drizzle/schema.js");
          await drizzleDb.insert(aiFeedbackTable).values({
            userId: ctx.user.id,
            mealLogId: input.mealLogId ?? null,
            rating: input.rating,
            accurate: input.accurate,
            comment: input.comment ?? null,
            detectedDishName: input.detectedDishName ?? null,
            detectedCalories: input.detectedCalories ?? null,
          });
          return { success: true };
        } catch (e) {
          console.error("[AIFeedback] error:", e);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo guardar el feedback" });
        }
      }),
  }),

  // ---------------------------------------------------------------------------
  // MENU PREVIEW (public-ish, no ownership required for seeded menus)
  // ---------------------------------------------------------------------------
  menuPreview: router({
    // Get full menu preview with all day parts and recipes (works for seeded and owned menus)
    get: protectedProcedure
      .input(z.object({ menuId: z.number() }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { menuOrganizers, menuOrganizerDayParts, menuOrganizerDayPartRecipes, dayParts, recipes } = await import("../drizzle/schema.js");
        const { eq, asc } = await import("drizzle-orm");
        const [menu] = await drizzleDb
          .select()
          .from(menuOrganizers)
          .where(eq(menuOrganizers.id, input.menuId))
          .limit(1);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        if (!menu.isSeeded && menu.userId !== ctx.user.id && !hasRole({ role: ctx.user.role, secondaryRoles: ctx.user.secondaryRoles }, "admin")) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const dpRows = await drizzleDb
          .select({ dp: menuOrganizerDayParts, dpInfo: dayParts })
          .from(menuOrganizerDayParts)
          .leftJoin(dayParts, eq(menuOrganizerDayParts.dayPartId, dayParts.id))
          .where(eq(menuOrganizerDayParts.menuOrganizerId, input.menuId))
          .orderBy(asc(menuOrganizerDayParts.dayNumber), asc(menuOrganizerDayParts.date));
        const dayPartsWithRecipes = await Promise.all(
          dpRows.map(async (row) => {
            const recipeRows = await drizzleDb
              .select({ dpRecipe: menuOrganizerDayPartRecipes, recipe: recipes })
              .from(menuOrganizerDayPartRecipes)
              .leftJoin(recipes, eq(menuOrganizerDayPartRecipes.recipeId, recipes.id))
              .where(eq(menuOrganizerDayPartRecipes.menuOrganizerDayPartId, row.dp.id));
            return {
              id: row.dp.id,
              dayNumber: row.dp.dayNumber,
              date: row.dp.date,
              mealType: row.dpInfo?.name ?? "comida",
              recipes: recipeRows
                .filter(r => r.recipe !== null)
                .map(r => ({
                  id: r.recipe!.id,
                  name: r.recipe!.name,
                  imageUrl: r.recipe!.imageUrl,
                  calories: r.recipe!.calories,
                  proteins: r.recipe!.proteins,
                  carbs: r.recipe!.carbs,
                  fats: r.recipe!.fats,
                  prepTime: r.recipe!.prepTime,
                  mealTime: r.recipe!.mealTime,
                })),
            };
          })
        );
        const dayMap = new Map<number, typeof dayPartsWithRecipes>();
        for (const dp of dayPartsWithRecipes) {
          const dayNum = dp.dayNumber ?? 1;
          if (!dayMap.has(dayNum)) dayMap.set(dayNum, []);
          dayMap.get(dayNum)!.push(dp);
        }
        const days = Array.from(dayMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([dayNumber, parts]) => ({ dayNumber, parts }));
        return {
          id: menu.id,
          name: menu.name,
          objective: menu.objective,
          goal: menu.goal,
          dailyCalories: menu.dailyCalories,
          coverImage: menu.coverImage,
          isSeeded: menu.isSeeded,
          persons: menu.persons,
          days,
          totalDays: days.length,
        };
      }),
  }),
  // ---------------------------------------------------------------------------
  // STRIPE SUBSCRIPTIONS
  // ---------------------------------------------------------------------------
  subscriptions: router({
    createCheckout: protectedProcedure
      .input(z.object({
        plan: z.enum(["basic", "premium", "pro_max"]),
        origin: z.string(),
        referralCode: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Resolve referral code -> Stripe promotion code
        let stripePromoCodeId: string | undefined;
        let referralCodeId: number | undefined;
        if (input.referralCode) {
          try {
            const drizzleDb = await db.getDb();
            if (drizzleDb) {
              const { referralCodes } = await import("../drizzle/schema");
              const { eq, and } = await import("drizzle-orm");
              const [rc] = await drizzleDb.select().from(referralCodes)
                .where(and(eq(referralCodes.code, input.referralCode.toUpperCase()), eq(referralCodes.isActive, true)))
                .limit(1);
              if (rc) {
                stripePromoCodeId = rc.stripePromoCodeId ?? undefined;
                referralCodeId = rc.id;
              }
            }
          } catch (e) { console.error("[Referral] lookup error:", e); }
        }
        const session = await createCheckoutSession({
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          userName: ctx.user.name,
          plan: input.plan,
          origin: input.origin,
          stripePromoCodeId,
          referralCodeId,
        });
        return { url: session.url };
      }),
    createExpertPlanCheckout: protectedProcedure
      .input(z.object({
        planId: z.number(),
        origin: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertPlans: epTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [plan] = await drizzleDb.select().from(epTable).where(eq(epTable.id, input.planId)).limit(1);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan no encontrado" });
        if (!plan.isPublic) throw new TRPCError({ code: "FORBIDDEN", message: "Este plan no está disponible" });
        if ((plan.price ?? 0) <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Este plan es gratuito, usa copyPlan" });
        const [expert] = await drizzleDb.select({ displayName: beTable.displayName }).from(beTable).where(eq(beTable.id, plan.expertId)).limit(1);
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: ctx.user.email ?? undefined,
          allow_promotion_codes: true,
          line_items: [{
            price_data: {
              currency: "eur",
              product_data: {
                name: plan.title,
                description: `Plan nutricional de ${expert?.displayName ?? "BuddyExpert"} — ${plan.durationWeeks} semanas`,
              },
              unit_amount: Math.round((plan.price ?? 0) * 100),
            },
            quantity: 1,
          }],
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email ?? "",
            customer_name: ctx.user.name ?? "",
            expert_plan_id: plan.id.toString(),
            expert_id: plan.expertId.toString(),
            type: "expert_plan",
          },
          success_url: `${input.origin}/app/buddy-experts?plan_purchased=true`,
          cancel_url: `${input.origin}/app/buddy-experts`,
        });
        return { url: session.url! };
      }),

    getStatus: protectedProcedure.query(async ({ ctx }) => {
      // Admins always have pro_max
      if (hasRole(ctx.user, "admin")) {
        return { plan: "pro_max" as const, status: "active" as const, tier: "pro_max" as const };
      }
      const sub = await db.getUserSubscription(ctx.user.id);
      const { getPlanTier } = await import("../shared/plans");
      // Manual plan assigned by admin takes priority over Stripe subscription
      if (sub?.manualPlan && sub.manualPlan !== "free") {
        return { ...sub, plan: sub.manualPlan, status: "active" as const, tier: getPlanTier(sub.manualPlan) };
      }
      if (!sub || sub.status !== "active") {
        return { plan: "free" as const, status: "inactive" as const, tier: "free" as const };
      }
      return { ...sub, tier: getPlanTier(sub.plan) };
    }),
    getMonthlyUsage: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return { menusThisMonth: 0, shoppingListsThisMonth: 0, eventMenusThisMonth: 0, savedRecipes: 0, inventoryItems: 0 };
      const { menuOrganizers, shoppingLists, recipes, userInventoryItems } = await import("../drizzle/schema");
      const { eq, and, gte, count } = await import("drizzle-orm");
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const [menusCount] = await drizzleDb.select({ count: count() }).from(menuOrganizers)
        .where(and(eq(menuOrganizers.userId, ctx.user.id), gte(menuOrganizers.createdAt, startOfMonth)));
      const [listsCount] = await drizzleDb.select({ count: count() }).from(shoppingLists)
        .where(and(eq(shoppingLists.userId, ctx.user.id), gte(shoppingLists.createdAt, startOfMonth)));
      const [savedRecipesCount] = await drizzleDb.select({ count: count() }).from(recipes)
        .where(eq(recipes.userId, ctx.user.id));
      const [inventoryCount] = await drizzleDb.select({ count: count() }).from(userInventoryItems)
        .where(eq(userInventoryItems.userId, ctx.user.id));
      return {
        menusThisMonth: menusCount?.count ?? 0,
        shoppingListsThisMonth: listsCount?.count ?? 0,
        eventMenusThisMonth: 0,
        savedRecipes: savedRecipesCount?.count ?? 0,
        inventoryItems: inventoryCount?.count ?? 0,
      };
    }),



    // ── Apple StoreKit 2 IAP verification ────────────────────────────────────────
    verifyAppleIAP: protectedProcedure
      .input(z.object({
        transactionId: z.string().min(1, "transactionId is required"),
        productId: z.string().min(1, "productId is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { verifyAppleTransaction } = await import("./_core/iap/appleIAP");
        const result = await verifyAppleTransaction(input.transactionId);

        if (!result.valid || !result.plan) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.error ?? "Apple IAP verification failed",
          });
        }

        // Prevent replay attacks: check if this transaction is already used
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userSubscriptions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await drizzleDb
          .select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.iapTransactionId, result.transactionId))
          .limit(1);
        if (existing.length > 0 && existing[0].userId !== ctx.user.id) {
          throw new TRPCError({ code: "CONFLICT", message: "Transaction already used by another account" });
        }

        // Activate subscription in DB
        await db.upsertUserSubscription(ctx.user.id, {
          status: "active",
          plan: result.plan,
          currentPeriodStart: new Date(),
          currentPeriodEnd: result.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          iapPlatform: "apple",
          iapTransactionId: result.transactionId,
          iapOriginalTransactionId: result.originalTransactionId,
          iapProductId: result.productId,
          iapEnvironment: result.environment,
          iapExpiresAt: result.expiresAt ?? undefined,
          iapLastVerifiedAt: new Date(),
        } as any);

        console.log(`[Apple IAP] Activated plan=${result.plan} env=${result.environment} for user=${ctx.user.id} txId=${result.transactionId}`);
        return { success: true, plan: result.plan, environment: result.environment, expiresAt: result.expiresAt };
      }),

    // ── Google Play Billing verification ───────────────────────────────────────
    verifyGoogleIAP: protectedProcedure
      .input(z.object({
        productId: z.string().min(1, "productId is required"),
        purchaseToken: z.string().min(1, "purchaseToken is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { verifyGooglePurchase } = await import("./_core/iap/googleIAP");
        const result = await verifyGooglePurchase(input.productId, input.purchaseToken);

        if (!result.valid || !result.plan) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.error ?? "Google Play IAP verification failed",
          });
        }

        // Prevent replay attacks
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userSubscriptions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await drizzleDb
          .select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.iapTransactionId, result.purchaseToken))
          .limit(1);
        if (existing.length > 0 && existing[0].userId !== ctx.user.id) {
          throw new TRPCError({ code: "CONFLICT", message: "Purchase token already used by another account" });
        }

        // Activate subscription in DB
        await db.upsertUserSubscription(ctx.user.id, {
          status: "active",
          plan: result.plan,
          currentPeriodStart: new Date(),
          currentPeriodEnd: result.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          iapPlatform: "google",
          iapTransactionId: result.purchaseToken,
          iapOriginalTransactionId: result.orderId,
          iapProductId: result.productId,
          iapEnvironment: result.environment,
          iapExpiresAt: result.expiresAt ?? undefined,
          iapLastVerifiedAt: new Date(),
        } as any);

        console.log(`[Google IAP] Activated plan=${result.plan} env=${result.environment} for user=${ctx.user.id} orderId=${result.orderId}`);
        return { success: true, plan: result.plan, environment: result.environment, expiresAt: result.expiresAt };
      }),

    // ── Historial de pagos del usuario normal ─────────────────────────────────
    getUserPayments: protectedProcedure.query(async ({ ctx }) => {
      try {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { payments: [], subscription: null };
        const { userSubscriptions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        // Get subscription from DB
        const sub = await db.getUserSubscription(ctx.user.id);
        // If user has a stripeCustomerId, fetch invoices from Stripe
        const [subRow] = await drizzleDb.select().from(userSubscriptions).where(eq(userSubscriptions.userId, ctx.user.id)).limit(1);
        let stripePayments: any[] = [];
        if (subRow?.stripeCustomerId) {
          try {
            const Stripe = (await import("stripe")).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
            const invoices = await stripe.invoices.list({ customer: subRow.stripeCustomerId, limit: 24 });
            stripePayments = invoices.data
              .filter(inv => inv.status === 'paid')
              .map(inv => ({
                id: inv.id,
                amount: inv.amount_paid,
                currency: inv.currency,
                status: inv.status,
                description: inv.lines?.data?.[0]?.description ?? 'Suscripción BuddyOne',
                created: inv.created,
                receiptUrl: inv.hosted_invoice_url ?? null,
                pdfUrl: inv.invoice_pdf ?? null,
                periodStart: inv.period_start,
                periodEnd: inv.period_end,
              }));
          } catch (e: any) {
            console.error('[Stripe] getUserPayments invoices error:', e.message);
          }
        }
        // Also include IAP payments from DB if any
        const iapPayments = subRow?.iapPlatform ? [{
          id: subRow.iapTransactionId ?? 'iap-' + subRow.id,
          amount: null,
          currency: null,
          status: subRow.status,
          description: `Suscripción ${subRow.plan} (${subRow.iapPlatform === 'apple' ? 'App Store' : 'Google Play'})`,
          created: subRow.createdAt ? Math.floor(new Date(subRow.createdAt).getTime() / 1000) : null,
          receiptUrl: null,
          pdfUrl: null,
          periodStart: subRow.currentPeriodStart ? Math.floor(new Date(subRow.currentPeriodStart).getTime() / 1000) : null,
          periodEnd: subRow.currentPeriodEnd ? Math.floor(new Date(subRow.currentPeriodEnd).getTime() / 1000) : null,
          platform: subRow.iapPlatform,
        }] : [];
        return {
          payments: [...stripePayments, ...iapPayments],
          subscription: sub ?? null,
        };
      } catch (err: any) {
        console.error('[Stripe] getUserPayments error:', err?.message);
        return { payments: [], subscription: null };
      }
    }),
  }),
  // ---------------------------------------------------------------------------
  // HEALTH METRICS
  // ---------------------------------------------------------------------------
  healthMetrics: router({
    list: protectedProcedure
       .input(z.object({ limit: z.number().int().min(1).max(365).optional() }))
      .query(({ ctx, input }) => db.getHealthMetrics(ctx.user.id, input.limit)),
    add: protectedProcedure
      .input(
        z.object({
          weight: z.number().min(20, "Peso mínimo 20 kg").max(500, "Peso máximo 500 kg").optional(),
          bodyFatPercentage: z.number().min(1).max(70).optional(),
          muscleMass: z.number().min(10).max(200).optional(),
          recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Formato de fecha inválido"),
          notes: z.string().max(500).optional(),
        })
      )
      .mutation(({ ctx, input }) => db.addHealthMetric({ ...input, userId: ctx.user.id, recordedAt: new Date(input.recordedAt) } as any)),
  }),

  // ---------------------------------------------------------------------------
  // ADMIN
  // ---------------------------------------------------------------------------
  admin: router({
    users: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).optional(), offset: z.number().int().min(0).optional(), search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const userList = await db.getAllUsers(input.limit, input.offset, input.search);
        // Enrich with subscription data for each user
        const enriched = await Promise.all(
          userList.map(async (u) => {
            const subscription = await db.getUserSubscription(u.id);
            return { ...u, subscription: subscription ?? null };
          })
        );
        return enriched;
      }),

    updateUserRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin", "buddyexpert"]),
        secondaryRoles: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const updateData: Record<string, unknown> = { role: input.role };
        if (input.secondaryRoles !== undefined) {
          updateData.secondaryRoles = input.secondaryRoles;
        }
        await db.updateUser(input.userId, updateData as any);
        return { success: true };
      }),
    addSecondaryRole: protectedProcedure
      .input(z.object({ userId: z.number(), secondaryRole: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const targetUser = await db.getUserById(input.userId);
        if (!targetUser) throw new TRPCError({ code: "NOT_FOUND" });
        const currentSecondary = targetUser.secondaryRoles ?? [];
        if (!currentSecondary.includes(input.secondaryRole)) {
          await db.updateUser(input.userId, { secondaryRoles: [...currentSecondary, input.secondaryRole] } as any);
        }
        return { success: true };
      }),
    removeSecondaryRole: protectedProcedure
      .input(z.object({ userId: z.number(), secondaryRole: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const targetUser = await db.getUserById(input.userId);
        if (!targetUser) throw new TRPCError({ code: "NOT_FOUND" });
        const currentSecondary = (targetUser.secondaryRoles ?? []).filter((r: string) => r !== input.secondaryRole);
        await db.updateUser(input.userId, { secondaryRoles: currentSecondary } as any);
        return { success: true };
      }),

    grantProAccess: protectedProcedure
      .input(z.object({ userId: z.number(), plan: z.enum(["basic", "premium", "pro_max"]) }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        await db.upsertUserSubscription(input.userId, {
          status: "active",
          plan: input.plan,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
        return { success: true };
      }),
    // ── Admin: cambiar plan sin pago ──────────────────────────────────────────
    setUserPlan: protectedProcedure
      .input(z.object({
        userId: z.number(),
        plan: z.enum(["free", "basic", "premium", "pro_max"]),
        notify: z.boolean().optional().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { users: usersTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const targetUsers = await drizzleDb.select().from(usersTable).where(eq(usersTable.id, input.userId)).limit(1);
        const targetUser = targetUsers[0];
        if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
        if (input.plan === "free") {
          await db.upsertUserSubscription(input.userId, {
            status: "cancelled",
            plan: "basic",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(),
          });
        } else {
          await db.upsertUserSubscription(input.userId, {
            status: "active",
            plan: input.plan,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          });
        }
        if (input.notify) {
          const planLabels: Record<string, string> = { free: "Free", basic: "Pro", premium: "Pro", pro_max: "Pro Max" };
          const planLabel = planLabels[input.plan] ?? input.plan;
          try {
            const { notifyOwner } = await import("./_core/notification");
            await notifyOwner({
              title: `Plan actualizado: ${targetUser.name ?? targetUser.email}`,
              content: `El administrador ha cambiado el plan de ${targetUser.name ?? targetUser.email} a ${planLabel}.`,
            });
          } catch (_) { /* non-critical */ }
        }
        return { success: true, plan: input.plan };
      }),

    // ── Admin: cambiar tipo de cuenta ─────────────────────────────────────────
    setUserAccountType: protectedProcedure
      .input(z.object({
        userId: z.number(),
        accountType: z.enum(["user", "buddymaker", "buddyexpert", "business"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        await db.updateUser(input.userId, {
          accountType: input.accountType as any,
          registrationStep: "completed" as any,
        });
        if (input.accountType === "buddyexpert") {
          await db.updateUser(input.userId, { role: "buddyexpert" as any });
        }
        return { success: true, accountType: input.accountType };
      }),

    // ── Admin: suscripción de un usuario ──────────────────────────────────────
    getUserSubscriptionDetails: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        return db.getUserSubscription(input.userId);
      }),

    // ── Admin: Gestión de cuentas duplicadas ────────────────────────────────
    findDuplicateAccounts: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { users: usersTable } = await import("../drizzle/schema.js");
        const { or, ilike } = await import("drizzle-orm");
        const email = input.email.toLowerCase().trim();
        const rows = await drizzleDb
          .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, imageUrl: usersTable.imageUrl, openId: usersTable.openId, role: usersTable.role, accountType: usersTable.accountType, loginMethod: usersTable.loginMethod, createdAt: usersTable.createdAt, deletedAt: usersTable.deletedAt, lastSignedIn: usersTable.lastSignedIn })
          .from(usersTable)
          .where(ilike(usersTable.email, email));
        return rows;
      }),
    mergeAccounts: protectedProcedure
      .input(z.object({ keepUserId: z.number(), deleteUserIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { users: usersTable } = await import("../drizzle/schema.js");
        const { inArray } = await import("drizzle-orm");
        // Soft-delete the duplicate accounts
        await drizzleDb.update(usersTable).set({ deletedAt: new Date(), active: false }).where(inArray(usersTable.id, input.deleteUserIds));
        return { success: true, deleted: input.deleteUserIds.length };
      }),
    // ── Admin: Borrar usuario completamente ──────────────────────────────────────────
    deleteUser: protectedProcedure
      .input(z.object({ userId: z.number(), hardDelete: z.boolean().optional().default(false) }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes borrarte a ti mismo" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { users: usersTable, expertPatients, userProfiles, userMedicalProfiles, userPreferences } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        // Limpiar relaciones huerófanas de expertPatients en cualquier caso
        await drizzleDb.delete(expertPatients).where(eq(expertPatients.patientUserId, input.userId));
        if (input.hardDelete) {
          // Hard delete: eliminar perfil y datos del usuario, luego el usuario
          await drizzleDb.delete(userProfiles).where(eq(userProfiles.userId, input.userId));
          await drizzleDb.delete(userMedicalProfiles).where(eq(userMedicalProfiles.userId, input.userId));
          await drizzleDb.delete(userPreferences).where(eq(userPreferences.userId, input.userId));
          await drizzleDb.delete(usersTable).where(eq(usersTable.id, input.userId));
          return { success: true, method: "hard_delete" };
        } else {
          // Soft delete: marcar como borrado
          await drizzleDb.update(usersTable).set({ deletedAt: new Date(), active: false }).where(eq(usersTable.id, input.userId));
          return { success: true, method: "soft_delete" };
        }
      }),
    promoteToAdminProMax: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        await db.updateUser(input.userId, { role: "admin" as any });
        await db.upsertUserSubscription(input.userId, {
          status: "active",
          plan: "pro_max",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years
        });
        return { success: true };
      }),
    // ── Admin: Founder Emails Management ──────────────────────────────────
    getFounderEmails: protectedProcedure
      .query(async ({ ctx }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { founderEmails } = await import("../drizzle/schema.js");
        const { desc } = await import("drizzle-orm");
        const rows = await drizzleDb
          .select({
            id: founderEmails.id,
            email: founderEmails.email,
            claimedAt: founderEmails.claimedAt,
            claimedByUserId: founderEmails.claimedByUserId,
            addedAt: founderEmails.addedAt,
            addedBy: founderEmails.addedBy,
            notes: founderEmails.notes,
          })
          .from(founderEmails)
          .orderBy(desc(founderEmails.addedAt));
        return rows;
      }),
    addFounderEmail: protectedProcedure
      .input(z.object({ email: z.string().email(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { founderEmails } = await import("../drizzle/schema.js");
        const email = input.email.toLowerCase().trim();
        await drizzleDb.insert(founderEmails).values({
          email,
          addedBy: ctx.user.name ?? "admin",
          notes: input.notes ?? null,
        }).onConflictDoNothing();
        return { success: true };
      }),
    removeFounderEmail: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { founderEmails } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        await drizzleDb.delete(founderEmails).where(eq(founderEmails.id, input.id));
        return { success: true };
      }),
    getFounderStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { total: 0, claimed: 0, pending: 0 };
        const { founderEmails } = await import("../drizzle/schema.js");
        const { count, isNotNull, isNull } = await import("drizzle-orm");
        const [totalRow] = await drizzleDb.select({ count: count() }).from(founderEmails);
        const [claimedRow] = await drizzleDb.select({ count: count() }).from(founderEmails).where(isNotNull(founderEmails.claimedAt));
        return {
          total: Number(totalRow.count),
          claimed: Number(claimedRow.count),
          pending: Number(totalRow.count) - Number(claimedRow.count),
        };
      }),

    createAllergy: protectedProcedure
      .input(z.object({ apiParam: z.string(), nameEs: z.string(), nameEn: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        return db.createAllergy(input);
      }),

    updateAllergy: protectedProcedure
      .input(z.object({ id: z.number(), nameEs: z.string().optional(), nameEn: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await db.updateAllergy(id, data);
        return { success: true };
      }),

    deleteAllergy: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        await db.deleteAllergy(input.id);
        return { success: true };
      }),

    createDietRestriction: protectedProcedure
      .input(z.object({ apiParam: z.string(), nameEs: z.string(), nameEn: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        return db.createDietRestriction(input);
      }),

    updateDietRestriction: protectedProcedure
      .input(z.object({ id: z.number(), nameEs: z.string().optional(), nameEn: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await db.updateDietRestriction(id, data);
        return { success: true };
      }),

    createFoodCategory: protectedProcedure
      .input(z.object({ apiParam: z.string(), nameEs: z.string(), nameEn: z.string().optional(), imageUrl: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        return db.createFoodCategory(input);
      }),

    updateFoodCategory: protectedProcedure
      .input(z.object({ id: z.number(), nameEs: z.string().optional(), nameEn: z.string().optional(), imageUrl: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await db.updateFoodCategory(id, data);
        return { success: true };
      }),

    createMeasure: protectedProcedure
      .input(z.object({ apiParam: z.string(), nameEs: z.string(), nameEn: z.string().optional(), abbreviation: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        return db.createMeasure(input);
      }),
    deleteDietRestriction: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        await db.deleteDietRestriction(input.id);
        return { success: true };
      }),
    deleteFoodCategory: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        await db.deleteFoodCategory(input.id);
        return { success: true };
      }),
    deleteMeasure: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        await db.deleteMeasure(input.id);
        return { success: true };
      }),
    stats: protectedProcedure.query(async ({ ctx }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        // Use direct COUNT queries to avoid helper filters (e.g. active=true, deletedAt IS NULL)
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
        const { users: usersTable, recipes: recipesTable, ingredients: ingredientsTable, menuOrganizers, allergies: allergiesTable, foodCategories: foodCategoriesTable, dietRestrictions: dietRestrictionsTable } = await import("../drizzle/schema");
        const { count } = await import("drizzle-orm");
        const [[uCount], [rCount], [iCount], [mCount], [aCount], [cCount], [dCount]] = await Promise.all([
          drizzleDb.select({ n: count() }).from(usersTable),
          drizzleDb.select({ n: count() }).from(recipesTable),
          drizzleDb.select({ n: count() }).from(ingredientsTable),
          drizzleDb.select({ n: count() }).from(menuOrganizers),
          drizzleDb.select({ n: count() }).from(allergiesTable),
          drizzleDb.select({ n: count() }).from(foodCategoriesTable),
          drizzleDb.select({ n: count() }).from(dietRestrictionsTable),
        ]);
        return {
          totalUsers: uCount?.n ?? 0,
          totalRecipes: rCount?.n ?? 0,
          totalIngredients: iCount?.n ?? 0,
          totalMenus: mCount?.n ?? 0,
          totalAllergies: aCount?.n ?? 0,
          totalCategories: cCount?.n ?? 0,
          totalDiets: dCount?.n ?? 0,
        };
      }),
    // ── Admin: list all recipes with pagination + search ──────────────────────
    recipes: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        search: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { recipes: [], total: 0 };
        const { recipes: recipesTable, users: usersTable } = await import("../drizzle/schema");
        const { like, or, count, eq: eqFn } = await import("drizzle-orm");
        const whereClause = input.search
          ? or(like(recipesTable.name, `%${input.search}%`), like(recipesTable.description, `%${input.search}%`))
          : undefined;
        const [rows, countRows] = await Promise.all([
          drizzleDb
            .select({ id: recipesTable.id, name: recipesTable.name, description: recipesTable.description, imageUrl: recipesTable.imageUrl, isPublic: recipesTable.isPublic, createdAt: recipesTable.createdAt, userName: usersTable.name })
            .from(recipesTable)
            .leftJoin(usersTable, eqFn(usersTable.id, recipesTable.userId))
            .where(whereClause)
            .orderBy(recipesTable.id)
            .limit(input.limit)
            .offset(input.offset),
          drizzleDb.select({ total: count() }).from(recipesTable).where(whereClause),
        ]);
        return { recipes: rows, total: countRows[0]?.total ?? 0 };
      }),
    // ── Admin: upload recipe image to S3 ──────────────────────────────────────
    uploadRecipeImage: protectedProcedure
      .input(z.object({
        recipeId: z.number(),
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const imageBuffer = Buffer.from(input.imageBase64, "base64");
        const ext = input.mimeType.split("/")[1] ?? "jpg";
        const fileKey = `recipe-images/${input.recipeId}-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, imageBuffer, input.mimeType);
        await db.updateRecipe(input.recipeId, { imageUrl: url });
        return { url };
      }),
    // ── Admin: update any recipe field ───────────────────────────────────────
    updateRecipe: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        preparationTime: z.number().optional(),
        cookTime: z.number().optional(),
        servings: z.number().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await db.updateRecipe(id, data);
        return { success: true };
      }),

    // ── API Health Monitor ────────────────────────────────────────────────────
    getApiMonitors: protectedProcedure.query(async ({ ctx }) => {
      if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { apiMonitors } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      return drizzleDb.select().from(apiMonitors).orderBy(desc(apiMonitors.lastCheckedAt));
    }),

    getApiLogs: protectedProcedure
      .input(z.object({ monitorId: z.number(), limit: z.number().optional().default(50) }))
      .query(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { apiHealthLogs } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return drizzleDb
          .select()
          .from(apiHealthLogs)
          .where(eq(apiHealthLogs.monitorId, input.monitorId))
          .orderBy(desc(apiHealthLogs.checkedAt))
          .limit(input.limit);
      }),

    recheckApi: protectedProcedure
      .input(z.object({ monitorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { apiMonitors, apiHealthLogs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const monitors = await drizzleDb.select().from(apiMonitors).where(eq(apiMonitors.id, input.monitorId)).limit(1);
        const monitor = monitors[0];
        if (!monitor) throw new TRPCError({ code: "NOT_FOUND" });
        const { checkEndpoint } = await import("./apiMonitor");
        const result = await checkEndpoint(monitor.endpoint, monitor.method, monitor.expectedStatus, "http://localhost:3000");
        await drizzleDb.insert(apiHealthLogs).values({
          monitorId: monitor.id,
          status: result.status,
          latencyMs: result.latencyMs,
          httpStatus: result.httpStatus ?? undefined,
          errorMessage: result.errorMessage,
        });
        const newFailCount = result.status === "ok" ? 0 : (monitor.failCount ?? 0) + 1;
        await drizzleDb.update(apiMonitors).set({
          lastStatus: result.status,
          lastLatencyMs: result.latencyMs,
          lastCheckedAt: new Date(),
          lastErrorMessage: result.errorMessage,
          failCount: newFailCount,
          updatedAt: new Date(),
        }).where(eq(apiMonitors.id, monitor.id));
        return { success: true, result };
      }),

    toggleMonitor: protectedProcedure
      .input(z.object({ monitorId: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { apiMonitors } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await drizzleDb.update(apiMonitors).set({ isActive: input.isActive, updatedAt: new Date() }).where(eq(apiMonitors.id, input.monitorId));
        return { success: true };
      }),

    // Reset error count and mark a monitor as OK (manual override after fixing the issue)
    resetMonitorErrors: protectedProcedure
      .input(z.object({ monitorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { apiMonitors } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await drizzleDb.update(apiMonitors).set({
          failCount: 0,
          lastStatus: "ok",
          lastErrorMessage: null,
          updatedAt: new Date(),
        }).where(eq(apiMonitors.id, input.monitorId));
        return { success: true };
      }),

    // Get LLM error logs from server console (last N errors)
    getLLMErrorLogs: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
      .query(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        // Read from the in-memory error log ring buffer
        const logs = (global as any).__llmErrorLog ?? [];
        return logs.slice(-input.limit).reverse();
      }),

    // Test LLM connection directly from admin panel
    testLLMConnection: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const startTime = Date.now();
        try {
          const response = await invokeLLM({
            messages: [{ role: "user", content: 'Respond with exactly: {"status":"ok"}' }],
            response_format: { type: "json_object" },
          });
          const latencyMs = Date.now() - startTime;
          const content = response.choices?.[0]?.message?.content ?? "";
          const finishReason = response.choices?.[0]?.finish_reason;
          const usage = response.usage;
          // Persist to DB for historical chart
          const drizzleDb = await db.getDb();
          if (drizzleDb) {
            const { llmLatencyLogs } = await import("../drizzle/schema.js");
            await drizzleDb.insert(llmLatencyLogs).values({
              procedure: "testLLMConnection",
              latencyMs,
              success: true,
              finishReason: finishReason ?? null,
              totalTokens: (usage as any)?.total_tokens ?? null,
            });
          }
          return {
            success: true,
            latencyMs,
            finishReason,
            content: typeof content === "string" ? content.slice(0, 200) : "",
            usage,
          };
        } catch (err: any) {
          const latencyMs = Date.now() - startTime;
          // Persist error too
          const drizzleDb = await db.getDb();
          if (drizzleDb) {
            const { llmLatencyLogs } = await import("../drizzle/schema.js");
            await drizzleDb.insert(llmLatencyLogs).values({
              procedure: "testLLMConnection",
              latencyMs,
              success: false,
              errorMessage: err?.message ?? String(err),
            });
          }
          return {
            success: false,
            latencyMs,
            error: err?.message || String(err),
          };
        }
      }),

    // Get LLM latency history for the last N days (for the line chart)
    getLLMLatencyHistory: protectedProcedure
      .input(z.object({ days: z.number().int().min(1).max(30).default(7) }))
      .query(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { llmLatencyLogs } = await import("../drizzle/schema.js");
        const { gte, desc } = await import("drizzle-orm");
        const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
        const rows = await drizzleDb
          .select({
            id: llmLatencyLogs.id,
            procedure: llmLatencyLogs.procedure,
            latencyMs: llmLatencyLogs.latencyMs,
            success: llmLatencyLogs.success,
            finishReason: llmLatencyLogs.finishReason,
            totalTokens: llmLatencyLogs.totalTokens,
            recordedAt: llmLatencyLogs.recordedAt,
          })
          .from(llmLatencyLogs)
          .where(gte(llmLatencyLogs.recordedAt, since))
          .orderBy(desc(llmLatencyLogs.recordedAt))
          .limit(500);
        return rows;
      }),

    // Get API health summary (all monitors status at a glance)
    getApiHealthSummary: protectedProcedure
      .query(async ({ ctx }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { ok: 0, down: 0, degraded: 0, unknown: 0, total: 0, lastCheckedAt: null };
        const { apiMonitors } = await import("../drizzle/schema");
        const monitors = await drizzleDb.select({
          lastStatus: apiMonitors.lastStatus,
          lastCheckedAt: apiMonitors.lastCheckedAt,
          isActive: apiMonitors.isActive,
        }).from(apiMonitors);
        const active = monitors.filter((m) => m.isActive);
        const ok = active.filter((m) => m.lastStatus === "ok").length;
        const down = active.filter((m) => m.lastStatus === "down").length;
        const degraded = active.filter((m) => m.lastStatus === "degraded").length;
        const unknown = active.filter((m) => !m.lastStatus).length;
        const lastCheckedAt = active.reduce((latest, m) => {
          if (!m.lastCheckedAt) return latest;
          return !latest || m.lastCheckedAt > latest ? m.lastCheckedAt : latest;
        }, null as Date | null);
        return { ok, down, degraded, unknown, total: active.length, lastCheckedAt };
      }),


    // ─── Admin: Vet Clinics Management ────────────────────────────────────────
    getAllVetClinics: protectedProcedure
      .query(async ({ ctx }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { vetClinics, petClinicLinks, pets } = await import("../drizzle/schema.js");
        const { count, eq: eqOp } = await import("drizzle-orm");
        const clinics = await drizzleDb.select({
          id: vetClinics.id,
          name: vetClinics.name,
          city: vetClinics.city,
          province: vetClinics.province,
          phone: vetClinics.phone,
          email: vetClinics.email,
          accessCode: vetClinics.accessCode,
          isVerified: vetClinics.isVerified,
          isActive: vetClinics.isActive,
          specialtiesJson: vetClinics.specialtiesJson,
          createdAt: vetClinics.createdAt,
        }).from(vetClinics).orderBy(vetClinics.createdAt);
        // Get patient counts
        const linkCounts = await drizzleDb.select({
          clinicId: petClinicLinks.clinicId,
          count: count(),
        }).from(petClinicLinks).groupBy(petClinicLinks.clinicId);
        const countMap = Object.fromEntries(linkCounts.map(r => [r.clinicId, r.count]));
        return clinics.map(c => ({ ...c, patientCount: countMap[c.id] ?? 0 }));
      }),
    verifyVetClinic: protectedProcedure
      .input(z.object({ clinicId: z.number().int(), isVerified: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { vetClinics } = await import("../drizzle/schema.js");
        const { eq: eqOp } = await import("drizzle-orm");
        await drizzleDb.update(vetClinics).set({ isVerified: input.isVerified }).where(eqOp(vetClinics.id, input.clinicId));
        return { success: true };
      }),
    toggleVetClinicActive: protectedProcedure
      .input(z.object({ clinicId: z.number().int(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { vetClinics } = await import("../drizzle/schema.js");
        const { eq: eqOp } = await import("drizzle-orm");
        await drizzleDb.update(vetClinics).set({ isActive: input.isActive }).where(eqOp(vetClinics.id, input.clinicId));
        return { success: true };
      }),
    deleteVetClinic: protectedProcedure
      .input(z.object({ clinicId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { vetClinics, petClinicLinks } = await import("../drizzle/schema.js");
        const { eq: eqOp } = await import("drizzle-orm");
        await drizzleDb.delete(petClinicLinks).where(eqOp(petClinicLinks.clinicId, input.clinicId));
        await drizzleDb.delete(vetClinics).where(eqOp(vetClinics.id, input.clinicId));
        return { success: true };
      }),
    tagKidFriendlyRecipes: protectedProcedure
      .input(z.object({ batchSize: z.number().int().min(1).max(50).default(20) }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { recipes } = await import("../drizzle/schema.js");
        const { eq: eqOp } = await import("drizzle-orm");
        const untagged = await drizzleDb.select({ id: recipes.id, name: recipes.name, tags: recipes.tags, allergens: recipes.allergens, ingredientsJson: recipes.ingredientsJson })
          .from(recipes)
          .where(eqOp(recipes.isKidFriendly, false))
          .limit(input.batchSize);
        if (untagged.length === 0) return { tagged: 0, message: "No hay recetas sin etiquetar" };
        let tagged = 0;
        for (const recipe of untagged) {
          try {
            const prompt = `Analiza esta receta y determina si es apta para niños.\nNombre: "${recipe.name}"\nIngredientes: ${recipe.ingredientsJson ?? "no especificados"}\nAlérgenos: ${recipe.allergens ?? "ninguno"}\nTags: ${recipe.tags ?? "ninguno"}\n\nResponde SOLO con JSON válido:\n- isKidFriendly: true si es apta para niños >1 año (sin picante, sin alcohol)\n- isBabyFriendly: true si es apta para bebés 6-12 meses (sin sal, sin azúcar, texturas blandas)\n- isFingerFood: true si el niño puede comerla con las manos\n- noAddedSugar: true si no lleva azúcar añadido\n- highIron: true si es rica en hierro (carnes, legumbres, espinacas)\n- highCalcium: true si es rica en calcio (lácteos, brócoli, sardinas)`;
            const response = await invokeLLM({
              messages: [{ role: "user", content: prompt }],
              response_format: { type: "json_schema", json_schema: { name: "kid_tags", strict: true, schema: { type: "object", properties: { isKidFriendly: { type: "boolean" }, isBabyFriendly: { type: "boolean" }, isFingerFood: { type: "boolean" }, noAddedSugar: { type: "boolean" }, highIron: { type: "boolean" }, highCalcium: { type: "boolean" } }, required: ["isKidFriendly", "isBabyFriendly", "isFingerFood", "noAddedSugar", "highIron", "highCalcium"], additionalProperties: false } } }
            });
            const rawContent = response.choices?.[0]?.message?.content;
            const content = typeof rawContent === 'string' ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: any) => c.text ?? '').join('') : '');
            if (content) {
              const tags = JSON.parse(content);
              await drizzleDb.update(recipes).set({
                isKidFriendly: tags.isKidFriendly,
                isBabyFriendly: tags.isBabyFriendly,
                isFingerFood: tags.isFingerFood,
                noAddedSugar: tags.noAddedSugar,
                highIron: tags.highIron,
                highCalcium: tags.highCalcium,
              }).where(eqOp(recipes.id, recipe.id));
              tagged++;
            }
          } catch (e) {
            console.error(`[KidTag] Error tagging recipe ${recipe.id}:`, e);
          }
        }
        return { tagged, total: untagged.length, message: `${tagged} recetas etiquetadas` };
      }),
  }),
  // Mercadona integrationn — proxy to tienda.mercadona.es unofficial API
  mercadona: router({
    // Search products from local DB with enhanced matching (tildes, synonyms, multi-word)
    searchProducts: publicProcedure
      .input(z.object({ query: z.string().min(1), limit: z.number().optional().default(30) }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { mercadonaProducts } = await import("../drizzle/schema");
        const { like, or, sql } = await import("drizzle-orm");

        // Normalize: remove accents, lowercase, strip extra whitespace
        const normalize = (s: string) =>
          s.toLowerCase()
           .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
           .replace(/[^a-z0-9\s]/g, " ")
           .replace(/\s+/g, " ")
           .trim();

        // Synonym map for common grocery ingredients
        const SYNONYMS: Record<string, string[]> = {
          "yogur": ["yogurt", "yogures", "yogur"],
          "yogurt": ["yogur", "yogures"],
          "salmon": ["salmón", "salmon"],
          "salmón": ["salmon", "salmón"],
          "garbanzo": ["garbanzos", "garbanzo"],
          "garbanzos": ["garbanzo", "garbanzos"],
          "lenteja": ["lentejas", "lenteja"],
          "lentejas": ["lenteja", "lentejas"],
          "harina": ["harina", "preparado reposteria"],
          "mantequilla": ["mantequilla", "margarina"],
          "nata": ["nata", "crema"],
          "pechuga": ["pechuga", "filete pollo", "pollo"],
          "jamon": ["jamón", "jamon", "jamon serrano", "jamon cocido"],
          "jamón": ["jamon", "jamón", "jamon serrano", "jamon cocido"],
          "tomate": ["tomate", "tomates", "tomate triturado", "tomate frito"],
          "tomates": ["tomate", "tomates"],
          "cebolla": ["cebolla", "cebollas"],
          "zanahoria": ["zanahoria", "zanahorias"],
          "pimiento": ["pimiento", "pimientos"],
          "espinaca": ["espinacas", "espinaca"],
          "espinacas": ["espinaca", "espinacas"],
          "lechuga": ["lechuga", "ensalada"],
          "queso": ["queso", "quesos"],
          "huevo": ["huevo", "huevos"],
          "huevos": ["huevo", "huevos"],
          "leche": ["leche", "bebida vegetal"],
          "arroz": ["arroz"],
          "pasta": ["pasta", "fideos", "macarrones", "espagueti"],
          "macarrones": ["pasta", "macarrones"],
          "espagueti": ["pasta", "espaguetis", "espagueti", "spaghetti"],
          "atun": ["atún", "atun"],
          "atún": ["atun", "atún"],
          "bacalao": ["bacalao"],
          "merluza": ["merluza"],
          "aceite": ["aceite", "aceite oliva"],
          "aceite de oliva": ["aceite oliva", "aceite de oliva virgen"],
          "vinagre": ["vinagre"],
          "sal": ["sal"],
          "azucar": ["azúcar", "azucar"],
          "azúcar": ["azucar", "azúcar"],
          "pollo": ["pollo", "pechuga", "muslo pollo"],
          "ternera": ["ternera", "carne ternera", "carne picada"],
          "cerdo": ["cerdo", "lomo", "costilla"],
          "pan": ["pan", "barra pan", "pan molde"],
          "pan de molde": ["pan molde", "pan sandwich"],
          "limon": ["limón", "limon"],
          "limón": ["limon", "limón"],
          "naranja": ["naranja", "naranjas"],
          "manzana": ["manzana", "manzanas"],
          "platano": ["plátano", "platano", "bananas"],
          "plátano": ["platano", "plátano", "bananas"],
          "fresa": ["fresas", "fresa"],
          "fresas": ["fresa", "fresas"],
          "brocoli": ["brócoli", "brocoli"],
          "brócoli": ["brocoli", "brócoli"],
          "calabacin": ["calabacín", "calabacin"],
          "calabacín": ["calabacin", "calabacín"],
          "berenjenas": ["berenjena", "berenjenas"],
          "berenjena": ["berenjena", "berenjenas"],
          "champiñon": ["champiñones", "champiñon", "setas"],
          "champiñones": ["champiñon", "champiñones", "setas"],
          "setas": ["setas", "champiñones"],
          "lenguado": ["lenguado", "pescado blanco"],
          "dorada": ["dorada", "lubina"],
          "lubina": ["lubina", "dorada"],
          "gambas": ["gambas", "langostinos"],
          "langostinos": ["langostinos", "gambas"],
          "mejillones": ["mejillones"],
          "almejas": ["almejas"],
          "leche de coco": ["leche coco", "crema coco"],
          "curry": ["curry", "especias"],
          "comino": ["comino", "especias"],
          "oregano": ["orégano", "oregano"],
          "orégano": ["oregano", "orégano"],
          "pimienta": ["pimienta", "pimienta negra"],
          "paprika": ["pimentón", "paprika"],
          "pimenton": ["pimentón", "paprika"],
          "pimentón": ["pimenton", "pimentón"],
          "canela": ["canela"],
          "nuez moscada": ["nuez moscada"],
          "levadura": ["levadura"],
          "bicarbonato": ["bicarbonato"],
          "miel": ["miel"],
          "mermelada": ["mermelada", "confitura"],
          "manteca": ["manteca", "mantequilla"],
          "aceitunas": ["aceitunas", "olivas"],
          "olivas": ["olivas", "aceitunas"],
          "pepinillos": ["pepinillos", "pepino"],
          "alcaparras": ["alcaparras"],
          "anchoas": ["anchoas", "boquerones"],
          "boquerones": ["boquerones", "anchoas"],
          "sardinas": ["sardinas"],
          "caballa": ["caballa"],
          "caldo": ["caldo", "caldo de pollo", "caldo de verduras"],
          "caldo de pollo": ["caldo pollo", "caldo"],
          "caldo de verduras": ["caldo verduras", "caldo"],
          "soja": ["soja", "salsa de soja"],
          "salsa de soja": ["salsa soja", "soja"],
          "tofu": ["tofu"],
          "tempeh": ["tempeh"],
          "avena": ["avena", "copos de avena"],
          "quinoa": ["quinoa", "quinua"],
          "bulgur": ["bulgur", "trigo"],
          "cuscus": ["cuscús", "cuscus"],
          "cuscús": ["cuscus", "cuscús"],
          "lentejas rojas": ["lentejas rojas", "lentejas"],
          "alubias": ["alubias", "judias", "judías"],
          "judias": ["judías", "alubias"],
          "judías": ["judias", "alubias"],
          "guisantes": ["guisantes"],
          "maiz": ["maíz", "maiz", "mazorca"],
          "maíz": ["maiz", "maíz"],
          "pepino": ["pepino", "pepinos"],
          "apio": ["apio"],
          "puerro": ["puerro", "puerros"],
          "ajo": ["ajo", "ajos"],
          "ajos": ["ajo", "ajos"],
          "jengibre": ["jengibre"],
          "aguacate": ["aguacate", "aguacates"],
          "mango": ["mango"],
          "pina": ["piña", "pina"],
          "piña": ["pina", "piña"],
          "uva": ["uvas", "uva"],
          "uvas": ["uva", "uvas"],
          "pera": ["pera", "peras"],
          "melocoton": ["melocotón", "melocoton"],
          "melocotón": ["melocoton", "melocotón"],
          "ciruela": ["ciruela", "ciruelas"],
          "cereza": ["cerezas", "cereza"],
          "kiwi": ["kiwi"],
          "sandia": ["sandía", "sandia"],
          "sandía": ["sandia", "sandía"],
          "melon": ["melón", "melon"],
          "melón": ["melon", "melón"],
          "nectarina": ["nectarina"],
          "albaricoque": ["albaricoque"],
          "higo": ["higos", "higo"],
          "granada": ["granada"],
          "frambuesa": ["frambuesas", "frambuesa"],
          "arandano": ["arándanos", "arandano"],
          "arándanos": ["arandano", "arándanos"],
          "moras": ["moras", "mora"],
          "queso fresco": ["queso fresco", "queso"],
          "queso rallado": ["queso rallado", "queso"],
          "queso manchego": ["queso manchego", "queso curado"],
          "mozzarella": ["mozzarella", "queso mozzarella"],
          "parmesano": ["parmesano", "queso parmesano"],
          "ricotta": ["ricotta", "requesón"],
          "requeson": ["requesón", "ricotta"],
          "requesón": ["requeson", "ricotta"],
          "nata para cocinar": ["nata cocinar", "nata"],
          "nata para montar": ["nata montar", "nata"],
          "leche evaporada": ["leche evaporada"],
          "leche condensada": ["leche condensada"],
          "bebida de avena": ["bebida avena", "leche avena"],
          "bebida de almendra": ["bebida almendra", "leche almendra"],
          "bebida de soja": ["bebida soja", "leche soja"],
          "proteina": ["proteína", "whey"],
          "proteína": ["proteina", "whey"],
        };

        const rawQuery = input.query.trim();
        const normQuery = normalize(rawQuery);

        // Build candidate search terms
        const searchTerms = new Set<string>();
        searchTerms.add(rawQuery);
        searchTerms.add(normQuery);

        // Add synonyms
        const synonymKey = normQuery.split(" ")[0];
        if (SYNONYMS[synonymKey]) {
          SYNONYMS[synonymKey].forEach(s => searchTerms.add(s));
        }
        // Also check full query as synonym key
        if (SYNONYMS[normQuery]) {
          SYNONYMS[normQuery].forEach(s => searchTerms.add(s));
        }

        // Split multi-word queries and search for each word
        const words = normQuery.split(" ").filter(w => w.length > 2);
        words.forEach(w => searchTerms.add(w));

        // Also add normalized versions of each search term for tilde-insensitive matching
        const normalizedTerms = new Set<string>();
        Array.from(searchTerms).forEach(t => {
          normalizedTerms.add(normalize(t));
          normalizedTerms.add(t);
        });

        // Build OR conditions for all search terms (both original and normalized)
        const conditions = Array.from(normalizedTerms).flatMap(term => [
          like(mercadonaProducts.name, `%${term}%`),
          like(mercadonaProducts.subcategoryName, `%${term}%`),
        ]);

        const rows = await drizzleDb
          .select()
          .from(mercadonaProducts)
          .where(or(...conditions))
          .limit(input.limit * 3); // fetch more to allow client-side ranking

        // Score and rank results: exact name match > starts with > contains
        const scored = rows.map(p => {
          const pName = normalize(p.name);
          let score = 0;
          if (pName === normQuery) score = 100;
          else if (pName.startsWith(normQuery)) score = 85;
          else if (pName.includes(normQuery)) score = 65;
          else {
            // Check if all words match
            const matchedWords = words.filter(w => pName.includes(w));
            const matchRatio = matchedWords.length / Math.max(words.length, 1);
            score = matchRatio * 50;
            // Bonus if first word matches (most important word)
            if (words.length > 0 && pName.includes(words[0])) score += 15;
            // Bonus if first word of product matches first word of query
            const pFirstWord = pName.split(" ")[0];
            if (words.length > 0 && pFirstWord === words[0]) score += 20;
          }
          // Penalty for very long product names (less specific)
          if (pName.length > 60) score -= 5;
          return { ...p, _score: score };
        });

        // IMPORTANT: Only return results with a meaningful score (>= 10).
        // Never return random products when there's no real match — that's the "inventing" bug.
        const withScore = scored.filter(p => p._score >= 10);
        if (withScore.length === 0) return []; // No match found — return empty, not random products
        const sorted = withScore
          .sort((a, b) => b._score - a._score)
          .slice(0, input.limit);

        return sorted.map(p => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          packaging: p.packaging,
          thumbnail: p.thumbnail,
          price: p.unitPrice ? parseFloat(p.unitPrice) : 0,
          priceStr: p.unitPrice ? `${p.unitPrice}€` : "—",
          unit: p.referenceFormat ?? "",
          category: p.categoryName,
          subcategory: p.subcategoryName,
          shareUrl: p.shareUrl,
        }));
      }),

    // Get all categories from DB
    categories: publicProcedure.query(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { mercadonaProducts } = await import("../drizzle/schema");
      const { sql } = await import("drizzle-orm");
      const result = await drizzleDb.execute(
        sql`SELECT category_name, subcategory_name, COUNT(*) as count FROM mercadona_products GROUP BY category_name, subcategory_name ORDER BY category_name, count DESC`
      );
      const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
      return (rows as any[]).map((r: any) => ({
        categoryName: r.category_name as string,
        subcategoryName: r.subcategory_name as string,
        count: Number(r.count),
      }));
    }),

    // Get products by category from DB
    byCategory: publicProcedure
      .input(z.object({ categoryName: z.string(), subcategoryName: z.string().optional(), limit: z.number().optional().default(50) }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { mercadonaProducts } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const conditions: any[] = [eq(mercadonaProducts.categoryName, input.categoryName)];
        if (input.subcategoryName) conditions.push(eq(mercadonaProducts.subcategoryName, input.subcategoryName));
        const rows = await drizzleDb
          .select()
          .from(mercadonaProducts)
          .where(and(...conditions))
          .limit(input.limit);
        return rows.map(p => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          packaging: p.packaging,
          thumbnail: p.thumbnail,
          price: p.unitPrice ? parseFloat(p.unitPrice) : 0,
          priceStr: p.unitPrice ? `${p.unitPrice}€` : "—",
          unit: p.referenceFormat ?? "",
          category: p.categoryName,
          subcategory: p.subcategoryName,
          shareUrl: p.shareUrl,
        }));
      }),

    // ── Mercadona Account Integration ──────────────────────────────────────────
    // Authenticate with Mercadona account and get token + customer info
    login: protectedProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1), postalCode: z.string().optional().default("28001") }))
      .mutation(async ({ input }) => {
        const MERC_BASE = "https://tienda.mercadona.es/api";
        const HEADERS = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          "Origin": "https://tienda.mercadona.es",
          "Referer": "https://tienda.mercadona.es/",
        };
        // Step 1: Set warehouse by postal code
        await fetch(`${MERC_BASE}/postal_codes/${input.postalCode}/`, { headers: HEADERS }).catch(() => {});
        // Step 2: Authenticate
        const authRes = await fetch(`${MERC_BASE}/auth/tokens/`, {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify({ username: input.email, password: input.password }),
        });
        if (!authRes.ok) {
          const errText = await authRes.text();
          if (authRes.status === 400 || authRes.status === 401) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Email o contraseña incorrectos" });
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Error de Mercadona: ${errText}` });
        }
        const authData = await authRes.json() as { access_token: string; customer_id: string };
        // Step 3: Get customer info (includes cart_id)
        const custRes = await fetch(`${MERC_BASE}/customers/${authData.customer_id}/`, {
          headers: { ...HEADERS, "Authorization": `Bearer ${authData.access_token}` },
        });
        const custData = custRes.ok ? await custRes.json() as any : {};
        // If no cart_id, try to get/create one via the cart endpoint
        let cartId = custData.cart_id ?? null;
        if (!cartId) {
          try {
            const cartRes = await fetch(`${MERC_BASE}/customers/${authData.customer_id}/cart/`, {
              headers: { ...HEADERS, "Authorization": `Bearer ${authData.access_token}` },
            });
            if (cartRes.ok) {
              const cartData = await cartRes.json() as any;
              cartId = cartData.id ?? cartData.cart_id ?? null;
            }
          } catch { /* ignore */ }
        }
        return {
          accessToken: authData.access_token,
          customerId: authData.customer_id,
          cartId,
          customerName: custData.first_name ?? custData.name ?? null,
        };
      }),

    // Add a list of products to the Mercadona cart
    addToCart: protectedProcedure
      .input(z.object({
        accessToken: z.string(),
        customerId: z.string(),
        cartId: z.string(),
        items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1) })),
      }))
      .mutation(async ({ input }) => {
        const MERC_BASE = "https://tienda.mercadona.es/api";
        const HEADERS = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${input.accessToken}`,
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          "Origin": "https://tienda.mercadona.es",
          "Referer": "https://tienda.mercadona.es/",
        };
        // Get current cart to get its version
        const cartRes = await fetch(`${MERC_BASE}/customers/${input.customerId}/cart/`, { headers: HEADERS });
        if (!cartRes.ok) {
          const errText = await cartRes.text();
          throw new TRPCError({ code: "UNAUTHORIZED", message: `Sesión expirada. Por favor vuelve a iniciar sesión en Mercadona. (${cartRes.status})` });
        }
        const cartData = await cartRes.json() as any;
        const currentVersion = cartData.version ?? 1;
        const existingLines: any[] = cartData.lines ?? [];
        // Use the cart id from the response (more reliable than stored one)
        const actualCartId = cartData.id ?? input.cartId;
        // Merge existing lines with new items
        const newLines = [...existingLines];
        for (const item of input.items) {
          // Mercadona uses numeric product IDs
          const productId = isNaN(Number(item.productId)) ? item.productId : Number(item.productId);
          const existingIdx = newLines.findIndex((l: any) => String(l.product_id) === String(item.productId));
          if (existingIdx >= 0) {
            newLines[existingIdx] = { ...newLines[existingIdx], quantity: newLines[existingIdx].quantity + item.quantity };
          } else {
            newLines.push({ quantity: item.quantity, product_id: productId, sources: [] });
          }
        }
        // PUT updated cart
        const putRes = await fetch(`${MERC_BASE}/customers/${input.customerId}/cart/`, {
          method: "PUT",
          headers: HEADERS,
          body: JSON.stringify({ id: actualCartId, version: currentVersion, lines: newLines }),
        });
        if (!putRes.ok) {
          const errText = await putRes.text();
          let userMsg = `Error al añadir al carrito de Mercadona`;
          if (putRes.status === 401 || putRes.status === 403) userMsg = "Sesión de Mercadona expirada. Por favor vuelve a iniciar sesión.";
          else if (putRes.status === 400) userMsg = `Datos incorrectos al añadir productos. Intenta de nuevo.`;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: userMsg });
        }
        const result = await putRes.json() as any;
        return {
          success: true,
          itemsAdded: input.items.length,
          cartLines: result.lines?.length ?? newLines.length,
          cartTotal: result.total_price ?? null,
        };
      }),
  }),

  // ===========================================================================
  // CARREFOUR INTEGRATION
  // ===========================================================================
  carrefour: router({
    searchProducts: publicProcedure
      .input(z.object({ q: z.string().max(100).trim().optional(), category: z.string().max(50).trim().optional(), subcategory: z.string().max(50).trim().optional(), limit: z.number().int().min(1).max(100).optional() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { carrefourProducts } = await import("../drizzle/schema");
        const { like, eq, and, or, desc } = await import("drizzle-orm");
        const q = input.q?.trim();
        const conditions: any[] = [];
        if (q && q.length > 0) {
          conditions.push(or(
            like(carrefourProducts.name, `%${q}%`),
            like(carrefourProducts.subcategory, `%${q}%`),
            like(carrefourProducts.category, `%${q}%`),
            like(carrefourProducts.brand, `%${q}%`),
          ));
        }
        if (input.category) conditions.push(eq(carrefourProducts.category, input.category));
        if (input.subcategory) conditions.push(eq(carrefourProducts.subcategory, input.subcategory));
        const rows = await drizzleDb
          .select()
          .from(carrefourProducts)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(carrefourProducts.price))
          .limit(input.limit ?? 48);
        return rows;
      }),
    categories: publicProcedure.query(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { sql } = await import("drizzle-orm");
      const result = await drizzleDb.execute(
        sql`SELECT category, subcategory, COUNT(*) as count FROM carrefour_products GROUP BY category, subcategory ORDER BY category, count DESC`
      );
      const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
      return rows as Array<{ category: string; subcategory: string; count: number }>;
    }),
    byCategory: publicProcedure
      .input(z.object({ category: z.string(), subcategory: z.string().optional(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { carrefourProducts } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(carrefourProducts.category, input.category)];
        if (input.subcategory) conditions.push(eq(carrefourProducts.subcategory, input.subcategory));
        return drizzleDb
          .select()
          .from(carrefourProducts)
          .where(and(...conditions))
          .orderBy(desc(carrefourProducts.price))
          .limit(input.limit ?? 48);
      }),
  }),

  // ===========================================================================
  // ALCAMPO INTEGRATION
  // ===========================================================================
  alcampo: router({
    searchProducts: publicProcedure
      .input(z.object({ q: z.string().max(100).trim().optional(), category: z.string().max(50).trim().optional(), subcategory: z.string().max(50).trim().optional(), limit: z.number().int().min(1).max(100).optional() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { alcampoProducts } = await import("../drizzle/schema.js");
        const { like, eq, and, or, desc } = await import("drizzle-orm");
        const q = input.q?.trim();
        const conditions: any[] = [];
        if (q && q.length > 0) {
          conditions.push(or(
            like(alcampoProducts.name, `%${q}%`),
            like(alcampoProducts.subcategory, `%${q}%`),
            like(alcampoProducts.category, `%${q}%`),
            like(alcampoProducts.brand, `%${q}%`),
          ));
        }
        if (input.category) conditions.push(eq(alcampoProducts.category, input.category));
        if (input.subcategory) conditions.push(eq(alcampoProducts.subcategory, input.subcategory));
        const rows = await drizzleDb
          .select()
          .from(alcampoProducts)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(alcampoProducts.price))
          .limit(input.limit ?? 48);
        return rows;
      }),
    categories: publicProcedure.query(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { sql } = await import("drizzle-orm");
      const result = await drizzleDb.execute(
        sql`SELECT category, subcategory, COUNT(*) as count FROM alcampo_products GROUP BY category, subcategory ORDER BY category, count DESC`
      );
      const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
      return rows as Array<{ category: string; subcategory: string; count: number }>;
    }),
    byCategory: publicProcedure
      .input(z.object({ category: z.string(), subcategory: z.string().optional(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { alcampoProducts } = await import("../drizzle/schema.js");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(alcampoProducts.category, input.category)];
        if (input.subcategory) conditions.push(eq(alcampoProducts.subcategory, input.subcategory));
        return drizzleDb
          .select()
          .from(alcampoProducts)
          .where(and(...conditions))
          .orderBy(desc(alcampoProducts.price))
          .limit(input.limit ?? 48);
      }),
  }),
  // ===========================================================================
  // LIDL INTEGRATION
  // ===========================================================================
  lidl: router({
    // Search products — accepts both `q` (LidlShop) and `query` (legacy)
    searchProducts: publicProcedure
      .input(z.object({
        q: z.string().optional(),
        query: z.string().optional(),
        limit: z.number().optional().default(48),
      }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { lidlProducts } = await import("../drizzle/schema");
        const { like, or } = await import("drizzle-orm");
        const term = (input.q ?? input.query ?? "").trim();
        if (!term) return [];
        // Normalize: remove accents, lowercase
        const normalize = (s: string) =>
          s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
        const normTerm = normalize(term);
        const words = normTerm.split(" ").filter(w => w.length > 2);
        // Build search terms: original + normalized + individual words
        const searchTerms = new Set([term, normTerm, ...words]);
        const q = `%${term}%`;
        const qNorm = `%${normTerm}%`;
        const conditions = Array.from(searchTerms).flatMap(t => [
          like(lidlProducts.name, `%${t}%`),
          like(lidlProducts.fullTitle, `%${t}%`),
        ]);
        const rows = await drizzleDb
          .select()
          .from(lidlProducts)
          .where(or(...conditions))
          .limit(input.limit * 3);
        // Score and filter results
        const scored = rows.map(p => {
          const pName = normalize(p.name ?? "");
          let score = 0;
          if (pName === normTerm) score = 100;
          else if (pName.startsWith(normTerm)) score = 85;
          else if (pName.includes(normTerm)) score = 65;
          else {
            const matchedWords = words.filter(w => pName.includes(w));
            score = (matchedWords.length / Math.max(words.length, 1)) * 50;
            if (words.length > 0 && pName.includes(words[0])) score += 15;
          }
          return { ...p, _score: score };
        });
        const withScore = scored.filter(p => p._score >= 10);
        if (withScore.length === 0) return [];
        const sortedRows = withScore.sort((a, b) => b._score - a._score).slice(0, input.limit);
        return sortedRows.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand ?? "",
          image: p.image ?? null,
          price: p.price ?? null,
          packaging: p.packaging ?? "",
          category: p.category ?? "",
          productUrl: p.canonicalPath ? `https://www.lidl.es${p.canonicalPath}` : null,
        }));
      }),
    // Get all categories from DB
    categories: publicProcedure.query(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { sql } = await import("drizzle-orm");
      const result = await drizzleDb.execute(
        sql`SELECT category, COUNT(*) as count FROM lidl_products GROUP BY category ORDER BY count DESC`
      );
      const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
      return rows as Array<{ category: string; count: number }>;
    }),
    // Get products by category
    byCategory: publicProcedure
      .input(z.object({
        category: z.string(),
        limit: z.number().optional().default(48),
      }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { lidlProducts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await drizzleDb
          .select()
          .from(lidlProducts)
          .where(eq(lidlProducts.category, input.category))
          .limit(input.limit);
        return rows.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand ?? "",
          image: p.image ?? null,
          price: p.price ?? null,
          packaging: p.packaging ?? "",
          category: p.category ?? "",
          productUrl: p.canonicalPath ? `https://www.lidl.es${p.canonicalPath}` : null,
        }));
      }),
  }),
  // ===========================================================================
  // HIPERDINO
  // ===========================================================================
  hiperdino: router({
    searchProducts: publicProcedure
      .input(z.object({
        q: z.string().optional(),
        query: z.string().optional(),
        limit: z.number().optional().default(48),
      }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { hiperdinoProducts } = await import("../drizzle/schema.js");
        const { like, or } = await import("drizzle-orm");
        const term = (input.q ?? input.query ?? "").trim();
        if (!term) return [];
        const q = `%${term}%`;
        const rows = await drizzleDb
          .select()
          .from(hiperdinoProducts)
          .where(or(
            like(hiperdinoProducts.name, q),
            like(hiperdinoProducts.brand, q),
            like(hiperdinoProducts.category, q),
          ))
          .limit(input.limit);
        return rows.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand ?? "",
          image: p.image ?? null,
          price: p.price ?? null,
          packaging: p.packaging ?? "",
          category: p.category ?? "",
          productUrl: p.shareUrl ?? null,
        }));
      }),
    categories: publicProcedure.query(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { sql } = await import("drizzle-orm");
      const result = await drizzleDb.execute(
        sql`SELECT category, COUNT(*) as count FROM hiperdino_products GROUP BY category ORDER BY count DESC`
      );
      const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
      return rows as Array<{ category: string; count: number }>;
    }),
    byCategory: publicProcedure
      .input(z.object({
        category: z.string(),
        limit: z.number().optional().default(48),
      }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { hiperdinoProducts } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const rows = await drizzleDb
          .select()
          .from(hiperdinoProducts)
          .where(eq(hiperdinoProducts.category, input.category))
          .limit(input.limit);
        return rows.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand ?? "",
          image: p.image ?? null,
          price: p.price ?? null,
          packaging: p.packaging ?? "",
          category: p.category ?? "",
          productUrl: p.shareUrl ?? null,
        }));
      }),
  }),
  // ===========================================================================
  // BASKET PRICE COMPARATOR
  // ===========================================================================
  basketComparator: router({
    compare: publicProcedure
      .input(z.object({
        items: z.array(z.object({
          name: z.string().min(1).max(100).trim(),
          qty: z.string().max(20).trim().optional(),
          unit: z.string().max(20).trim().optional(),
        })).min(1).max(50),
      }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
         if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { mercadonaProducts, carrefourProducts, alcampoProducts, lidlProducts } = await import("../drizzle/schema");
        const { ilike, or } = await import("drizzle-orm");

        // Normalize text: remove accents, lowercase
        const normalize = (s: string) =>
          s.toLowerCase()
           .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
           .replace(/[^a-z0-9\s]/g, " ")
           .replace(/\s+/g, " ")
           .trim();

        // Synonym map for common grocery ingredients
        const SYNONYMS: Record<string, string[]> = {
          "pollo": ["pollo", "pechuga", "contramuslo", "muslo"],
          "pechuga": ["pechuga", "pollo"],
          "salmon": ["salmon", "salmón"],
          "salmón": ["salmón", "salmon"],
          "atun": ["atun", "atún"],
          "atún": ["atún", "atun"],
          "garbanzo": ["garbanzo", "garbanzos"],
          "garbanzos": ["garbanzos", "garbanzo"],
          "lenteja": ["lenteja", "lentejas"],
          "lentejas": ["lentejas", "lenteja"],
          "huevo": ["huevo", "huevos"],
          "huevos": ["huevos", "huevo"],
          "espinaca": ["espinaca", "espinacas"],
          "espinacas": ["espinacas", "espinaca"],
          "tomate": ["tomate", "tomates"],
          "zanahoria": ["zanahoria", "zanahorias"],
          "pimiento": ["pimiento", "pimientos"],
          "cebolla": ["cebolla", "cebollas"],
          "jamon": ["jamon", "jamón"],
          "jamón": ["jamón", "jamon"],
          "yogur": ["yogur", "yogurt"],
          "yogurt": ["yogurt", "yogur"],
          "pasta": ["pasta", "macarron", "espagueti", "fideo"],
          "macarrones": ["macarron", "pasta"],
          "espaguetis": ["espagueti", "pasta"],
          "azucar": ["azucar", "azúcar"],
          "azúcar": ["azúcar", "azucar"],
          "aceite de oliva": ["aceite oliva", "aceite virgen"],
          "aceite": ["aceite"],
          "leche": ["leche"],
          "queso": ["queso"],
          "arroz": ["arroz"],
          "harina": ["harina"],
          "mantequilla": ["mantequilla"],
          "nata": ["nata", "crema"],
          "lechuga": ["lechuga", "ensalada"],
          "aguacate": ["aguacate"],
          "brocoli": ["brocoli", "brócoli"],
          "brócoli": ["brócoli", "brocoli"],
          "quinoa": ["quinoa", "quinua"],
          "avena": ["avena"],
          "platano": ["platano", "plátano"],
          "plátano": ["plátano", "platano"],
          "manzana": ["manzana"],
          "naranja": ["naranja"],
          "limon": ["limon", "limón"],
          "limón": ["limón", "limon"],
          "ajo": ["ajo", "ajos"],
          "pepino": ["pepino"],
          "calabacin": ["calabacin", "calabacín"],
          "calabacín": ["calabacín", "calabacin"],
          "berberecho": ["berberecho", "berberechos"],
          "mejillon": ["mejillon", "mejillón"],
          "mejillón": ["mejillón", "mejillon"],
          "gambas": ["gambas", "gamba"],
          "merluza": ["merluza"],
          "bacalao": ["bacalao"],
          "sardina": ["sardina", "sardinas"],
          "ternera": ["ternera", "vaca", "res"],
          "cerdo": ["cerdo", "lomo", "costilla"],
          "cordero": ["cordero"],
          "tofu": ["tofu"],
          "tempeh": ["tempeh"],
          "almendra": ["almendra", "almendras"],
          "nuez": ["nuez", "nueces"],
          "nueces": ["nueces", "nuez"],
          "cacahuete": ["cacahuete", "cacahuetes", "mani"],
          "anacardo": ["anacardo", "anacardos"],
          "semilla": ["semilla", "semillas"],
          "chia": ["chia", "chía"],
          "linaza": ["linaza", "lino"],
        };

        const searchInTable = async (
          table: any,
          nameCol: any,
          extraCols: any[],
          urlFn: (row: any) => string,
          query: string
        ) => {
          const normQ = normalize(query);
          const searchTerms = new Set<string>();
          searchTerms.add(query);
          searchTerms.add(normQ);
          // Add synonyms
          const firstWord = normQ.split(" ")[0];
          if (SYNONYMS[firstWord]) SYNONYMS[firstWord].forEach(s => searchTerms.add(s));
          if (SYNONYMS[normQ]) SYNONYMS[normQ].forEach(s => searchTerms.add(s));
          // Split multi-word and search each word > 2 chars
          normQ.split(" ").filter((w: string) => w.length > 2).forEach((w: string) => searchTerms.add(w));

          const conditions = Array.from(searchTerms).flatMap(term => [
            ilike(nameCol, `%${term}%`),
            ...extraCols.map(col => ilike(col, `%${term}%`)),
          ]);
          const rows = await drizzleDb
            .select()
            .from(table)
            .where(or(...conditions))
            .limit(5);
          if (rows.length === 0) return null;
          // Pick the row whose name best matches the query
          const queryWords = normQ.split(" ").filter((w: string) => w.length > 2);
          const scored = rows.map((r: any) => {
            const rName = normalize(r.name ?? "");
            let score = 0;
            if (rName === normQ) score = 100;
            else if (rName.startsWith(normQ)) score = 80;
            else if (rName.includes(normQ)) score = 60;
            else {
              // Count how many query words appear in the product name
              const matchedWords = queryWords.filter((w: string) => rName.includes(w));
              const matchRatio = queryWords.length > 0 ? matchedWords.length / queryWords.length : 0;
              // Require at least 50% of query words to match to avoid false positives
              if (matchRatio >= 0.5) score = Math.round(40 * matchRatio);
              else score = 0; // Too weak a match
            }
            return { r, score };
          });
          scored.sort((a: any, b: any) => b.score - a.score);
          // Reject if best match has score 0 (no meaningful match)
          if (scored[0].score === 0) return null;
          const row = scored[0].r as any;
          // Drizzle returns camelCase; fallback to snake_case for raw queries
          const rawPrice = row.unitPrice ?? row.unit_price ?? row.price ?? row.bulkPrice ?? row.bulk_price;
          const price = rawPrice ? parseFloat(String(rawPrice)) : 0;
          return {
            productName: row.name ?? "",
            price: isNaN(price) ? 0 : price,
            thumbnail: row.thumbnail ?? row.image ?? row.imageUrl ?? row.image_url ?? "",
            url: urlFn(row),
          };
        };

        const supermarkets = [
          {
            id: "mercadona",
            name: "Mercadona",
            emoji: "🟠",
            color: "#00A650",
            search: (q: string) => searchInTable(
              mercadonaProducts,
              mercadonaProducts.name,
              [mercadonaProducts.subcategoryName, mercadonaProducts.categoryName],
              (r: any) => r.share_url ?? `https://tienda.mercadona.es`,
              q
            ),
          },
          {
            id: "carrefour",
            name: "Carrefour",
            emoji: "🔵",
            color: "#004A96",
            search: (q: string) => searchInTable(
              carrefourProducts,
              carrefourProducts.name,
              [carrefourProducts.category, carrefourProducts.subcategory],
              (r: any) => r.product_url ?? `https://www.carrefour.es/supermercado/buscar?query=${encodeURIComponent(q)}`,
              q
            ),
          },
          {
            id: "alcampo",
            name: "Alcampo",
            emoji: "🟡",
            color: "#E30613",
            search: (q: string) => searchInTable(
              alcampoProducts,
              alcampoProducts.name,
              [alcampoProducts.category, alcampoProducts.subcategory],
              (r: any) => r.product_url ?? `https://www.alcampo.es/compra-online/buscar/?q=${encodeURIComponent(q)}`,
              q
            ),
          },
          {
            id: "lidl",
            name: "Lidl",
            emoji: "🔴",
            color: "#0050AA",
            search: (q: string) => searchInTable(
              lidlProducts,
              lidlProducts.name,
              [lidlProducts.category, lidlProducts.fullTitle],
              (r: any) => r.canonical_path ? `https://www.lidl.es${r.canonical_path}` : `https://www.lidl.es`,
              q
            ),
          },
        ];

        const results = await Promise.all(
          supermarkets.map(async (sm) => {
            const itemResults = await Promise.all(
              input.items.map(async (item) => {
                const found = await sm.search(item.name);
                return {
                  ingredient: item.name,
                  found: found !== null && found.price > 0,
                  productName: found?.productName ?? "",
                  price: found?.price ?? 0,
                  thumbnail: found?.thumbnail ?? "",
                  url: found?.url ?? "",
                };
              })
            );
            const total = itemResults.reduce((sum, i) => sum + (i.found ? i.price : 0), 0);
            return {
              supermarket: sm.name,
              emoji: sm.emoji,
              color: sm.color,
              total: Math.round(total * 100) / 100,
              found: itemResults.filter((i) => i.found).length,
              notFound: itemResults.filter((i) => !i.found).length,
              items: itemResults,
            };
          })
        );

        // Sort cheapest first
        results.sort((a, b) => a.total - b.total);
        return results;
      }),
  }),

  // ===========================================================================
  // USER BODY METRICS
  // ===========================================================================
  metrics: router({
    add: protectedProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
        weight: z.number().min(20, "Peso mínimo 20kg").max(500, "Peso máximo 500kg").optional(),
        bodyFat: z.number().min(1, "% grasa mínimo 1%").max(70, "% grasa máximo 70%").optional(),
        muscleMass: z.number().min(5, "Masa muscular mínima 5kg").max(200, "Masa muscular máxima 200kg").optional(),
        bmi: z.number().min(10, "IMC mínimo 10").max(80, "IMC máximo 80").optional(),
        waist: z.number().min(30, "Cintura mínima 30cm").max(300, "Cintura máxima 300cm").optional(),
        hip: z.number().min(30, "Cadera mínima 30cm").max(300, "Cadera máxima 300cm").optional(),
        chest: z.number().min(30, "Pecho mínimo 30cm").max(300, "Pecho máximo 300cm").optional(),
        arm: z.number().min(10, "Brazo mínimo 10cm").max(100, "Brazo máximo 100cm").optional(),
        thigh: z.number().min(10, "Muslo mínimo 10cm").max(150, "Muslo máximo 150cm").optional(),
        calf: z.number().min(10, "Gemelo mínimo 10cm").max(100, "Gemelo máximo 100cm").optional(),
        neck: z.number().min(10, "Cuello mínimo 10cm").max(80, "Cuello máximo 80cm").optional(),
        visceralFat: z.number().min(1, "Grasa visceral mínima 1").max(30, "Grasa visceral máxima 30").optional(),
        boneMass: z.number().min(0.5, "Masa ósea mínima 0.5kg").max(10, "Masa ósea máxima 10kg").optional(),
        waterPercentage: z.number().min(20, "% agua mínimo 20%").max(80, "% agua máximo 80%").optional(),
        metabolicAge: z.number().min(10, "Edad metabólica mínima 10").max(100, "Edad metabólica máxima 100").optional(),
        basalMetabolism: z.number().min(500, "Metabolismo basal mínimo 500kcal").max(5000, "Metabolismo basal máximo 5000kcal").optional(),
        notes: z.string().max(500, "Notas máximo 500 caracteres").optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validar que al menos un campo numérico esté presente
        const hasData = input.weight || input.bodyFat || input.muscleMass || input.bmi || 
          input.waist || input.hip || input.chest || input.arm || input.thigh || 
          input.calf || input.neck || input.visceralFat || input.boneMass || 
          input.waterPercentage || input.metabolicAge || input.basalMetabolism;
        if (!hasData && !input.notes) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Debes proporcionar al menos una medición o nota" 
          });
        }
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userMetrics } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // Upsert: si ya existe una medición para ese día, la actualiza
        const existing = await drizzleDb.select().from(userMetrics)
          .where(and(eq(userMetrics.userId, ctx.user.id), eq(userMetrics.date, input.date as any)))
          .limit(1);
        const data = {
          userId: ctx.user.id,
          date: input.date as any,
          weight: input.weight ?? null,
          bodyFat: input.bodyFat ?? null,
          muscleMass: input.muscleMass ?? null,
          bmi: input.bmi ?? null,
          waist: input.waist ?? null,
          hip: input.hip ?? null,
          chest: input.chest ?? null,
          arm: input.arm ?? null,
          thigh: input.thigh ?? null,
          calf: input.calf ?? null,
          neck: input.neck ?? null,
          visceralFat: input.visceralFat ?? null,
          boneMass: input.boneMass ?? null,
          waterPercentage: input.waterPercentage ?? null,
          metabolicAge: input.metabolicAge ?? null,
          basalMetabolism: input.basalMetabolism ?? null,
          notes: input.notes ?? null,
        };
        if (existing.length > 0) {
          await drizzleDb.update(userMetrics).set(data).where(eq(userMetrics.id, existing[0].id));
        } else {
          await drizzleDb.insert(userMetrics).values(data);
        }
        // Sync weight to user profile so all sections (diary, progress, goals) stay up-to-date
        if (input.weight) {
          await db.upsertUserProfile(ctx.user.id, { weight: input.weight } as any);
        }
        return { updated: existing.length > 0 };
      }),
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).nullish())
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { userMetrics } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return drizzleDb.select().from(userMetrics)
          .where(eq(userMetrics.userId, ctx.user.id))
          .orderBy(desc(userMetrics.date))
          .limit(input?.limit ?? 90);
      }),
    getLatest: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { userMetrics } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const rows = await drizzleDb.select().from(userMetrics)
        .where(eq(userMetrics.userId, ctx.user.id))
        .orderBy(desc(userMetrics.date))
        .limit(1);
      return rows[0] ?? null;
    }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userMetrics } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        await drizzleDb.delete(userMetrics)
          .where(and(eq(userMetrics.id, input.id), eq(userMetrics.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  // ===========================================================================
  // BUDDY APPLICATIONS — Solicitudes Expert/Maker
  // ===========================================================================
  buddyApplications: router({
    submitApplication: protectedProcedure
      .input(z.object({
        type: z.enum(["expert", "maker"]),
        displayName: z.string().min(2),
        bio: z.string().optional(),
        specialty: z.string().optional(),
        instagramHandle: z.string().optional(),
        youtubeHandle: z.string().optional(),
        tiktokHandle: z.string().optional(),
        websiteUrl: z.string().optional(),
        motivation: z.string().optional(),
        experience: z.string().optional(),
        expertCategory: z.string().optional(),
        certifications: z.string().optional(),
        // BuddyExpert specific
        collegiateNumber: z.string().optional(),
        yearsExperience: z.number().int().min(0).max(50).optional(),
        servicesOffered: z.string().optional(), // JSON array
        consultationPrice: z.number().min(0).max(9999).optional(),
        targetAudience: z.string().optional(),
        // BuddyMaker specific
        contentNiche: z.string().optional(),
        platforms: z.string().optional(), // JSON
        followersCount: z.number().int().min(0).optional(),
        contentFrequency: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyApplications: appsTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // Check if already has a pending/approved application of this type
        const existing = await drizzleDb.select().from(appsTable)
          .where(and(eq(appsTable.userId, ctx.user.id), eq(appsTable.type, input.type)))
          .limit(1);
        if (existing.length > 0 && existing[0].status !== "rejected") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ya tienes una solicitud activa para este rol" });
        }
        const insertData = {
          userId: ctx.user.id,
          type: input.type,
          status: "pending" as const,
          displayName: input.displayName,
          bio: input.bio ?? null,
          specialty: input.specialty ?? null,
          instagramHandle: input.instagramHandle ?? null,
          youtubeHandle: input.youtubeHandle ?? null,
          tiktokHandle: input.tiktokHandle ?? null,
          websiteUrl: input.websiteUrl ?? null,
          motivation: input.motivation ?? null,
          experience: input.experience ?? null,
          expertCategory: input.expertCategory ?? null,
          certifications: input.certifications ?? null,
          collegiateNumber: input.collegiateNumber ?? null,
          yearsExperience: input.yearsExperience ?? null,
          servicesOffered: input.servicesOffered ?? null,
          consultationPrice: input.consultationPrice ?? null,
          targetAudience: input.targetAudience ?? null,
          contentNiche: input.contentNiche ?? null,
          platforms: input.platforms ?? null,
          followersCount: input.followersCount ?? null,
          contentFrequency: input.contentFrequency ?? null,
        };
        const { users: usersTable } = await import("../drizzle/schema");
        if (existing.length > 0 && existing[0].status === "rejected") {
          // Allow re-apply after rejection — update the existing record
          await drizzleDb.update(appsTable).set({
            ...insertData,
            adminNote: null,
            reviewedAt: null,
            reviewedBy: null,
          }).where(eq(appsTable.id, existing[0].id));
          // Update registrationStep to pending_approval so the wizard shows the correct screen
          await drizzleDb.update(usersTable).set({ registrationStep: "pending_approval" as any }).where(eq(usersTable.id, ctx.user.id));
          // Notify owner
          try { const { notifyOwner } = await import("./_core/notification"); await notifyOwner({ title: `Nueva solicitud ${input.type}: ${input.displayName}`, content: `${ctx.user.name || ctx.user.email} quiere ser ${input.type === "expert" ? "BuddyExpert" : "BuddyMaker"}. Especialidad: ${input.specialty || "N/A"}` }); } catch {}
          return { success: true, id: existing[0].id };
        }
        const result = await drizzleDb.insert(appsTable).values(insertData);
        // Update registrationStep to pending_approval so the wizard shows the correct screen
        await drizzleDb.update(usersTable).set({ registrationStep: "pending_approval" as any }).where(eq(usersTable.id, ctx.user.id));
        // Notify owner
        try { const { notifyOwner } = await import("./_core/notification"); await notifyOwner({ title: `Nueva solicitud ${input.type}: ${input.displayName}`, content: `${ctx.user.name || ctx.user.email} quiere ser ${input.type === "expert" ? "BuddyExpert" : "BuddyMaker"}. Especialidad: ${input.specialty || "N/A"}` }); } catch {}
        return { success: true, id: (result as any)[0]?.id ?? 0 };
      }),
    getMyApplication: protectedProcedure
      .input(z.object({ type: z.enum(["expert", "maker"]) }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return null;
        const { buddyApplications: appsTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const rows = await drizzleDb.select().from(appsTable)
          .where(and(eq(appsTable.userId, ctx.user.id), eq(appsTable.type, input.type)))
          .orderBy(desc(appsTable.appliedAt))
          .limit(1);
        if (rows[0]) return rows[0];
        // Fallback: if user has the matching accountType, treat as approved automatically
        const accountTypeMap: Record<string, string> = { expert: "buddyexpert", maker: "buddymaker" };
        if (ctx.user.accountType === accountTypeMap[input.type]) {
          return {
            id: -1,
            userId: ctx.user.id,
            type: input.type as "expert" | "maker",
            status: "approved" as const,
            displayName: ctx.user.name,
            bio: null,
            specialty: null,
            appliedAt: new Date(),
            updatedAt: new Date(),
            reviewedAt: new Date(),
          } as any;
        }
        return null;
      }),
    // ADMIN: list all pending applications
    listPending: protectedProcedure
      .input(z.object({ type: z.enum(["expert", "maker", "all"]).optional(), status: z.enum(["pending", "approved", "rejected", "all"]).optional() }).nullish())
      .query(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { buddyApplications: appsTable, users: usersTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [];
        if (input?.type && input.type !== "all") conditions.push(eq(appsTable.type, input.type));
        const statusFilter = input?.status ?? "pending";
        if (statusFilter !== "all") conditions.push(eq(appsTable.status, statusFilter as any));
        const rows = await drizzleDb
          .select({ app: appsTable, user: { name: usersTable.name, email: usersTable.email, imageUrl: usersTable.imageUrl } })
          .from(appsTable)
          .leftJoin(usersTable, eq(appsTable.userId, usersTable.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(appsTable.appliedAt))
          .limit(100);
        return rows;
      }),
    // ADMIN: approve or reject application
    review: protectedProcedure
      .input(z.object({
        id: z.number(),
        action: z.enum(["approve", "reject"]),
        adminNote: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyApplications: appsTable, buddyExperts, buddyMakers, users: usersTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const apps = await drizzleDb.select().from(appsTable).where(eq(appsTable.id, input.id)).limit(1);
        if (!apps.length) throw new TRPCError({ code: "NOT_FOUND" });
        const app = apps[0];
        const newStatus = input.action === "approve" ? "approved" : "rejected";
        await drizzleDb.update(appsTable).set({
          status: newStatus,
          adminNote: input.adminNote ?? null,
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
        }).where(eq(appsTable.id, input.id));
        // Update user registrationStep, role and accountType
        const roleForType = app.type === "expert" ? "buddyexpert" : "buddymaker";
        await drizzleDb.update(usersTable).set({
          registrationStep: (input.action === "approve" ? "completed" : "application") as any,
          ...(input.action === "approve" ? {
            onboardingCompleted: true,
            role: roleForType as any,
            accountType: roleForType as any,
          } : {}),
        }).where(eq(usersTable.id, app.userId));
        // Notify the applicant
        try {
          const { notifyOwner } = await import("./_core/notification");
          if (input.action === "approve") {
            await notifyOwner({
              title: `✅ Tu solicitud de ${app.type === "expert" ? "BuddyExpert" : "BuddyMaker"} ha sido aprobada`,
              content: `¡Enhorabuena ${app.displayName}! Tu cuenta ha sido verificada. Ya puedes acceder a todas las funciones de ${app.type === "expert" ? "BuddyExpert" : "BuddyMaker"} en BuddyOne.`,
            });
          } else {
            await notifyOwner({
              title: `Tu solicitud de ${app.type === "expert" ? "BuddyExpert" : "BuddyMaker"} ha sido revisada`,
              content: `Hemos revisado tu solicitud. ${input.adminNote ? `Motivo: ${input.adminNote}` : "Puedes volver a solicitarlo cuando quieras."}`,
            });
          }
        } catch {}
        // If approved, create the expert/maker profile if it doesn't exist
        if (input.action === "approve") {
          const userRows = await drizzleDb.select().from(usersTable).where(eq(usersTable.id, app.userId)).limit(1);
          const user = userRows[0];
          // Send welcome email to the expert
          if (user?.email) {
            try {
              const { sendExpertWelcomeEmail } = await import("./email");
              await sendExpertWelcomeEmail({
                expertEmail: user.email,
                expertName: app.displayName ?? user.name ?? "Experto",
              });
            } catch (emailErr) {
              console.error("[Email] Error sending expert welcome email:", emailErr);
            }
          }
          if (app.type === "expert") {
            const existing = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, app.userId)).limit(1);
            if (!existing.length) {
              await drizzleDb.insert(buddyExperts).values({
                userId: app.userId,
                displayName: app.displayName,
                bio: app.bio ?? null,
                avatarUrl: user?.imageUrl ?? null,
                instagramHandle: app.instagramHandle ?? null,
                specialty: app.specialty ?? null,
                category: (app.expertCategory as any) ?? "dieta_equilibrada",
                verified: true,
              });
            } else {
              await drizzleDb.update(buddyExperts).set({ verified: true }).where(eq(buddyExperts.userId, app.userId));
            }
          } else {
            const existing = await drizzleDb.select().from(buddyMakers).where(eq(buddyMakers.userId, app.userId)).limit(1);
            if (!existing.length) {
              await drizzleDb.insert(buddyMakers).values({
                userId: app.userId,
                displayName: app.displayName,
                bio: app.bio ?? null,
                avatarUrl: user?.imageUrl ?? null,
                instagramHandle: app.instagramHandle ?? null,
                youtubeHandle: app.youtubeHandle ?? null,
                tiktokHandle: app.tiktokHandle ?? null,
                specialty: app.specialty ?? null,
                verified: true,
              });
            } else {
              await drizzleDb.update(buddyMakers).set({ verified: true }).where(eq(buddyMakers.userId, app.userId));
            }
          }
          // AUTO-ACTIVATE PRO MAX (free for experts/makers as ambassadors)
          try {
            await db.upsertUserSubscription(app.userId, {
              status: "active",
              plan: "pro_max",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
            });
            console.log("[Approval] Pro Max activated for userId=" + app.userId + " (" + app.type + ")");
          } catch (proErr) {
            console.error("[Approval] Failed to activate Pro Max:", proErr);
          }
          // AUTO-GENERATE REFERRAL CODE + STRIPE COUPON
          try {
            const { referralCodes: refCodesTable } = await import("../drizzle/schema");
            const ownerType = app.type === "expert" ? "expert" : "maker";
            const existingCode = await drizzleDb.select().from(refCodesTable)
              .where(and(eq(refCodesTable.userId, app.userId), eq(refCodesTable.ownerType, ownerType as any)))
              .limit(1);
            if (!existingCode.length) {
              const baseName = (app.displayName ?? user?.name ?? "BUDDY").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
              const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
              const code = baseName + suffix;
              let stripeCouponId = null;
              let stripePromoCodeId = null;
              try {
                const Stripe = (await import("stripe")).default;
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
                const coupon = await stripe.coupons.create({
                  percent_off: 15,
                  duration: "once",
                  name: "Referido " + code + " - 15% descuento",
                  metadata: { referral_code: code, creator_user_id: app.userId.toString(), creator_type: ownerType },
                });
                stripeCouponId = coupon.id;
                const promoCode = await stripe.promotionCodes.create({
                  coupon: coupon.id,
                  code,
                  metadata: { referral_code: code, creator_user_id: app.userId.toString() },
                } as any);
                stripePromoCodeId = promoCode.id;
              } catch (stripeErr) {
                console.error("[Approval] Stripe coupon creation failed:", stripeErr);
              }
              await drizzleDb.insert(refCodesTable).values({
                userId: app.userId,
                ownerType: ownerType as any,
                code,
                stripeCouponId,
                stripePromoCodeId,
                discountPercent: 15,
                commissionPercent: 20,
              });
              console.log("[Approval] Referral code '" + code + "' created for userId=" + app.userId);
              if (user?.email) {
                try {
                  const { sendEmail } = await import("./email");
                  const roleLabel = app.type === "expert" ? "BuddyExpert" : "BuddyMaker";
                  await sendEmail({
                    to: user.email,
                    subject: "Bienvenido a BuddyOne - Tu codigo de referido es " + code,
                    html: "<div style='font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px'>" +
                      "<h1 style='color:#f97316'>Tu cuenta " + roleLabel + " esta activa!</h1>" +
                      "<p>Hola <strong>" + (app.displayName ?? user.name ?? "Embajador") + "</strong>,</p>" +
                      "<p>Tu solicitud ha sido aprobada. Como embajador de BuddyOne tienes acceso a <strong>Pro Max de forma completamente gratuita</strong>.</p>" +
                      "<h2 style='color:#f97316'>Tu codigo de referido exclusivo:</h2>" +
                      "<div style='background:#fff7ed;border:2px solid #f97316;border-radius:12px;padding:24px;text-align:center;margin:16px 0 24px'>" +
                      "<span style='font-size:36px;font-weight:bold;letter-spacing:6px;color:#ea580c'>" + code + "</span>" +
                      "</div>" +
                      "<p>Comparte este codigo con tu comunidad:</p>" +
                      "<ul><li>Ellos reciben un <strong>15% de descuento</strong> en su primera suscripcion</li>" +
                      "<li>Tu recibes el <strong>20% de comision</strong> de cada pago mientras la suscripcion este activa</li></ul>" +
                      "<p>Puedes ver tus ganancias en tu dashboard de BuddyOne.</p>" +
                      "</div>",
                  });
                } catch (emailErr) {
                  console.error("[Approval] Failed to send referral code email:", emailErr);
                }
              }
            }
          } catch (refErr) {
            console.error("[Approval] Failed to generate referral code:", refErr);
          }
        }
        return { success: true };
      }),
  }),
  // ===========================================================================
  // BUDDY EXPERTS
  // ===========================================================================
  buddyExperts: router({
    list: publicProcedure
      .input(z.object({ category: z.string().max(50).trim().optional(), search: z.string().max(100).trim().optional(), featured: z.boolean().optional() }).nullish())
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { buddyExperts: beTable, users: usersTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(beTable.verified, true)];
        if (input?.category) conditions.push(eq(beTable.category, input.category as any));
        if (input?.featured) conditions.push(eq(beTable.featured, true));
        const rows = await drizzleDb
          .select({ expert: beTable, user: { name: usersTable.name, imageUrl: usersTable.imageUrl, email: usersTable.email } })
          .from(beTable)
          .leftJoin(usersTable, eq(beTable.userId, usersTable.id))
          .where(and(...conditions))
          .orderBy(desc(beTable.followersCount))
          .limit(50);
        return rows;
      }),

    getPlans: publicProcedure
      .input(z.object({ expertId: z.number(), category: z.string().optional() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { expertPlans: epTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(epTable.expertId, input.expertId), eq(epTable.isPublic, true)];
        if (input.category) conditions.push(eq(epTable.category, input.category as any));
        return drizzleDb.select().from(epTable).where(and(...conditions)).orderBy(desc(epTable.copiesCount)).limit(20);
      }),

    getAllPlans: publicProcedure
      .input(z.object({ category: z.string().max(50).trim().optional(), search: z.string().max(100).trim().optional() }).nullish())
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { expertPlans: epTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(epTable.isPublic, true)];
        if (input?.category) conditions.push(eq(epTable.category, input.category as any));
        return drizzleDb
          .select({ plan: epTable, expert: { id: beTable.id, displayName: beTable.displayName, specialty: beTable.specialty, avatarUrl: beTable.avatarUrl, verified: beTable.verified } })
          .from(epTable)
          .leftJoin(beTable, eq(epTable.expertId, beTable.id))
          .where(and(...conditions))
          .orderBy(desc(epTable.copiesCount))
          .limit(30);
      }),

    getMenus: publicProcedure
      .input(z.object({ expertId: z.number().optional(), category: z.string().optional() }).nullish())
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { expertMenus: emTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(emTable.isPublic, true)];
        if (input?.expertId) conditions.push(eq(emTable.expertId, input.expertId));
        if (input?.category) conditions.push(eq(emTable.category, input.category as any));
        return drizzleDb
          .select({ menu: emTable, expert: { id: beTable.id, displayName: beTable.displayName, avatarUrl: beTable.avatarUrl, verified: beTable.verified, specialty: beTable.specialty } })
          .from(emTable)
          .leftJoin(beTable, eq(emTable.expertId, beTable.id))
          .where(and(...conditions))
          .orderBy(desc(emTable.copiesCount))
          .limit(30);
      }),

    copyPlan: protectedProcedure
      .input(z.object({ planId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertPlans: epTable, userExpertPlanCopies: copiesTable } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        const plan = await drizzleDb.select().from(epTable).where(eq(epTable.id, input.planId)).limit(1);
        if (!plan[0]) throw new TRPCError({ code: "NOT_FOUND" });
        await drizzleDb.insert(copiesTable).values({ userId: ctx.user.id, planId: input.planId, expertId: plan[0].expertId });
        await drizzleDb.update(epTable).set({ copiesCount: sql`${epTable.copiesCount} + 1` }).where(eq(epTable.id, input.planId));
        return { success: true };
      }),

    copyMenu: protectedProcedure
      .input(z.object({ menuId: z.number(), startDate: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertMenus: emTable, menuOrganizers, menuOrganizerDayParts } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        // Load the expert menu
        const [menu] = await drizzleDb.select().from(emTable).where(eq(emTable.id, input.menuId)).limit(1);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND", message: "Menú no encontrado" });
        // Parse menuData to determine number of days
        let menuData: any = null;
        try {
          const raw = typeof menu.menuData === "string" ? menu.menuData : JSON.stringify(menu.menuData);
          const parsed = JSON.parse(raw);
          menuData = typeof parsed === "string" ? JSON.parse(parsed) : parsed;
        } catch { menuData = null; }
        const days: any[] = menuData?.days ?? [];
        const numDays = days.length > 0 ? days.length : 7;
        // Determine start date
        const start = input.startDate ? new Date(input.startDate) : new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + numDays - 1);
        const fmt = (d: Date) => d.toISOString().split("T")[0];
        // Create the menu organizer for the user
        const [newMenu] = await drizzleDb.insert(menuOrganizers).values({
          userId: ctx.user.id,
          name: `${menu.title} (Expert)`,
          startDate: fmt(start),
          endDate: fmt(end),
          type: "weekly",
          dailyCalories: menu.dailyCalories,
          isActive: false,
          generatedByAI: false,
          isSeeded: false,
        }).returning();
        if (!newMenu) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al crear el menú" });
        // Create day parts from menuData if available
        if (days.length > 0) {
          const mealKeys = ["desayuno", "media_manana", "comida", "merienda", "cena"];
          const mealNames: Record<string, string> = {
            desayuno: "Desayuno", media_manana: "Media mañana", comida: "Comida",
            merienda: "Merienda", cena: "Cena"
          };
          for (let i = 0; i < days.length; i++) {
            const day = days[i];
            const dayDate = new Date(start);
            dayDate.setDate(dayDate.getDate() + i);
            const mealsArray: { name: string; food: string }[] = Array.isArray(day.meals)
              ? day.meals
              : Object.entries(day.meals || {}).map(([k, v]) => ({ name: mealNames[k] ?? k, food: v as string }));
            for (let j = 0; j < mealsArray.length; j++) {
              const meal = mealsArray[j];
              await drizzleDb.insert(menuOrganizerDayParts).values({
                menuOrganizerId: newMenu.id,
                dayPartId: j + 1,
                date: fmt(dayDate),
                dayNumber: i + 1,
                mealNumber: j + 1,
                name: `${meal.name}: ${meal.food}`,
                notes: null,
                completed: false,
              });
            }
          }
        }
        // Increment copies count on the expert menu
        await drizzleDb.update(emTable).set({ copiesCount: sql`${emTable.copiesCount} + 1` }).where(eq(emTable.id, input.menuId));
        return { success: true, menuId: newMenu.id, menuName: newMenu.name };
      }),

    follow: protectedProcedure
      .input(z.object({ expertId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertFollowers: efTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, sql, and } = await import("drizzle-orm");
        const existing = await drizzleDb.select().from(efTable).where(and(eq(efTable.userId, ctx.user.id), eq(efTable.expertId, input.expertId))).limit(1);
        if (existing[0]) {
          await drizzleDb.delete(efTable).where(and(eq(efTable.userId, ctx.user.id), eq(efTable.expertId, input.expertId)));
          await drizzleDb.update(beTable).set({ followersCount: sql`${beTable.followersCount} - 1` }).where(eq(beTable.id, input.expertId));
          return { following: false };
        }
        await drizzleDb.insert(efTable).values({ userId: ctx.user.id, expertId: input.expertId });
        await drizzleDb.update(beTable).set({ followersCount: sql`${beTable.followersCount} + 1` }).where(eq(beTable.id, input.expertId));
        // Notify the expert about the new follower
        try {
          const { users: usersTable } = await import("../drizzle/schema");
          const [follower, expert] = await Promise.all([
            drizzleDb.select({ name: usersTable.name, imageUrl: usersTable.imageUrl }).from(usersTable).where(eq(usersTable.id, ctx.user.id)).limit(1),
            drizzleDb.select({ userId: beTable.userId, displayName: beTable.displayName }).from(beTable).where(eq(beTable.id, input.expertId)).limit(1),
          ]);
          if (expert[0]) {
            await createInAppNotif(expert[0].userId, {
              title: "Nuevo seguidor 🎉",
              body: `${follower[0]?.name || "Alguien"} ha empezado a seguirte. ¡Ya tienes un nuevo fan!`,
              type: "success",
              link: "/app/buddy-expert-stats",
            });
          }
        } catch (e) { console.error("[Notif] follow expert:", e); }
        return { following: true };
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return null;
        const { buddyExperts: beTable, users: usersTable, expertPlans: epTable, expertMenus: emTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const rows = await drizzleDb
          .select({ expert: beTable, user: { name: usersTable.name, imageUrl: usersTable.imageUrl, email: usersTable.email } })
          .from(beTable)
          .leftJoin(usersTable, eq(beTable.userId, usersTable.id))
          .where(eq(beTable.id, input.id))
          .limit(1);
        if (!rows[0]) return null;
        const plans = await drizzleDb.select().from(epTable).where(and(eq(epTable.expertId, input.id), eq(epTable.isPublic, true))).orderBy(desc(epTable.copiesCount)).limit(6);
        const menus = await drizzleDb.select().from(emTable).where(and(eq(emTable.expertId, input.id), eq(emTable.isPublic, true))).orderBy(desc(emTable.copiesCount)).limit(3);
        return { ...rows[0], plans, menus };
      }),

    isFollowing: protectedProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { following: false };
        const { expertFollowers: efTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const row = await drizzleDb.select().from(efTable).where(and(eq(efTable.userId, ctx.user.id), eq(efTable.expertId, input.expertId))).limit(1);
        return { following: !!row[0] };
      }),

    getFollowing: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { expertFollowers: efTable, buddyExperts: beTable } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      return drizzleDb
        .select({ expert: beTable, followedAt: efTable.followedAt })
        .from(efTable)
        .leftJoin(beTable, eq(efTable.expertId, beTable.id))
        .where(eq(efTable.userId, ctx.user.id))
        .orderBy(desc(efTable.followedAt))
        .limit(50);
    }),

    seedDemoExperts: publicProcedure.mutation(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { buddyExperts: beTable, expertPlans: epTable, expertMenus: emTable, users: usersTable } = await import("../drizzle/schema");
      const existing = await drizzleDb.select().from(beTable).limit(1);
      if (existing.length > 0) return { seeded: false, message: "Already seeded" };
      const demoExperts = [
        { displayName: "Miranda Jiménez", specialty: "Dietista", bio: "Especialista en pérdida de peso saludable con más de 10 años de experiencia.", category: "perdida_peso" as const, verified: true, featured: true, followersCount: 12400, plansCount: 8, rating: 4.9, reviewsCount: 234, avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80" },
        { displayName: "Carlos Ruiz", specialty: "Nutricionista deportivo", bio: "Nutricionista especializado en rendimiento deportivo y ganancia muscular.", category: "ganancia_muscular" as const, verified: true, featured: true, followersCount: 28900, plansCount: 12, rating: 4.8, reviewsCount: 456, avatarUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80" },
        { displayName: "Laura Gómez", specialty: "Nutricionista", bio: "Experta en dietas antiinflamatorias y bienestar digestivo.", category: "bienestar" as const, verified: true, featured: false, followersCount: 8700, plansCount: 6, rating: 4.7, reviewsCount: 189, avatarUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80" },
        { displayName: "Enrique Ortiz", specialty: "Dietista", bio: "Especialista en nutrición vegana y plant-based.", category: "vegano" as const, verified: true, featured: false, followersCount: 15200, plansCount: 9, rating: 4.6, reviewsCount: 312, avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80" },
      ];
      for (const expert of demoExperts) {
        const [userRes] = await drizzleDb.insert(usersTable).values({ openId: `demo_expert_${expert.displayName.replace(/ /g, "_")}`, name: expert.displayName, email: `${expert.displayName.toLowerCase().replace(/ /g, ".")}@buddyone.io`, role: "buddyexpert" }).returning({ id: usersTable.id });
        const userId = userRes?.id ?? 0;
        const [expRes] = await drizzleDb.insert(beTable).values({ userId, ...expert }).returning({ id: beTable.id });
        const expertId = expRes?.id ?? 0;
        await drizzleDb.insert(epTable).values({
          expertId,
          title: `Plan ${expert.category === "perdida_peso" ? "pérdida de peso" : expert.category === "ganancia_muscular" ? "fitness" : expert.category === "bienestar" ? "antiinflamatorio" : "vegano"}`,
          description: `Plan nutricional de 4 semanas creado por ${expert.displayName}.`,
          category: expert.category,
          durationWeeks: 4,
          dailyCalories: expert.category === "perdida_peso" ? 1500 : expert.category === "ganancia_muscular" ? 2200 : 1700,
          level: "principiante",
          isPublic: true,
          isFeatured: expert.featured,
          coverUrl: expert.coverUrl,
        });
        // Menú semanal gratuito para ganar seguidores
        await drizzleDb.insert(emTable).values({
          expertId,
          title: `Menú semanal de ${expert.displayName}`,
          description: `Menú semanal gratuito compartido por ${expert.displayName} para que puedas conocer su estilo de alimentación.`,
          category: expert.category,
          dailyCalories: expert.category === "perdida_peso" ? 1500 : expert.category === "ganancia_muscular" ? 2200 : 1700,
          isFree: true,
          isPublic: true,
          coverUrl: expert.coverUrl,
          menuData: JSON.stringify({
            days: [
              { day: "Lunes", meals: [{ name: "Desayuno", food: "Avena con frutas" }, { name: "Comida", food: "Pollo a la plancha con ensalada" }, { name: "Cena", food: "Salmón con verduras" }] },
              { day: "Martes", meals: [{ name: "Desayuno", food: "Tostadas con aguacate" }, { name: "Comida", food: "Lentejas con arroz" }, { name: "Cena", food: "Tortilla de espinacas" }] },
              { day: "Miércoles", meals: [{ name: "Desayuno", food: "Yogur con granola" }, { name: "Comida", food: "Pasta integral con atún" }, { name: "Cena", food: "Crema de verduras" }] },
              { day: "Jueves", meals: [{ name: "Desayuno", food: "Batido de proteínas" }, { name: "Comida", food: "Arroz con pollo" }, { name: "Cena", food: "Ensalada César" }] },
              { day: "Viernes", meals: [{ name: "Desayuno", food: "Frutas con queso" }, { name: "Comida", food: "Merluza al horno" }, { name: "Cena", food: "Revuelto de champiñones" }] },
              { day: "Sábado", meals: [{ name: "Desayuno", food: "Pancakes de avena" }, { name: "Comida", food: "Paella de verduras" }, { name: "Cena", food: "Gazpacho con tostadas" }] },
              { day: "Domingo", meals: [{ name: "Desayuno", food: "Huevos revueltos" }, { name: "Comida", food: "Cocido tradicional" }, { name: "Cena", food: "Sopa de pollo" }] },
            ]
          }),
        });
      }
      return { seeded: true };
    }),

    // ── Expert self-management (panel propio) ────────────────────────────────────────
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { buddyExperts: beTable } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [row] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
      return row ?? null;
    }),

    createProfile: protectedProcedure
      .input(z.object({
        displayName: z.string().min(2).max(128),
        bio: z.string().optional(),
        specialty: z.string().max(128).optional(),
        avatarUrl: z.string().url().optional(),
        coverUrl: z.string().url().optional(),
        category: z.enum(["perdida_peso","ganancia_muscular","definicion","dieta_equilibrada","rendimiento","bienestar","vegano"]).optional(),
        instagramHandle: z.string().max(64).optional(),
        websiteUrl: z.string().url().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "Ya tienes un perfil de experto" });
        const [res] = await drizzleDb.insert(beTable).values({
          userId: ctx.user.id,
          displayName: input.displayName,
          bio: input.bio,
          specialty: input.specialty,
          avatarUrl: input.avatarUrl,
          coverUrl: input.coverUrl,
          category: input.category ?? "dieta_equilibrada",
          instagramHandle: input.instagramHandle,
          websiteUrl: input.websiteUrl,
          verified: false,
          featured: false,
        }).returning({ id: beTable.id });
        return { id: res?.id ?? 0 };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        displayName: z.string().min(2).max(128).optional(),
        bio: z.string().optional(),
        specialty: z.string().max(128).optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
        coverUrl: z.string().url().optional().or(z.literal("")),
        category: z.enum(["perdida_peso","ganancia_muscular","definicion","dieta_equilibrada","rendimiento","bienestar","vegano"]).optional(),
        instagramHandle: z.string().max(64).optional(),
        youtubeHandle: z.string().max(64).optional(),
        tiktokHandle: z.string().max(64).optional(),
        priceMonthly: z.number().positive().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const updates: Record<string, any> = {};
        if (input.displayName !== undefined) updates.displayName = input.displayName;
        if (input.bio !== undefined) updates.bio = input.bio;
        if (input.specialty !== undefined) updates.specialty = input.specialty;
        if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;
        if (input.coverUrl !== undefined) updates.coverUrl = input.coverUrl;
        if (input.category !== undefined) updates.category = input.category;
        if (input.instagramHandle !== undefined) updates.instagramHandle = input.instagramHandle;
        if (input.youtubeHandle !== undefined) updates.youtubeHandle = input.youtubeHandle;
        if (input.tiktokHandle !== undefined) updates.tiktokHandle = input.tiktokHandle;
        if (input.priceMonthly !== undefined) updates.priceMonthly = input.priceMonthly;
        await drizzleDb.update(beTable).set(updates).where(eq(beTable.userId, ctx.user.id));
        return { success: true };
      }),

    uploadAvatar: protectedProcedure
      .input(z.object({ imageBase64: z.string(), mimeType: z.string().default("image/jpeg") }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const buffer = Buffer.from(input.imageBase64, "base64");
        const ext = input.mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
        const key = `expert-avatars/${ctx.user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await drizzleDb.update(beTable).set({ avatarUrl: url }).where(eq(beTable.userId, ctx.user.id));
        return { url };
      }),

    uploadCoverImage: protectedProcedure
      .input(z.object({ imageBase64: z.string(), mimeType: z.string().default("image/jpeg") }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const buffer = Buffer.from(input.imageBase64, "base64");
        const ext = input.mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
        const key = `expert-covers/${ctx.user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await drizzleDb.update(beTable).set({ coverUrl: url }).where(eq(beTable.userId, ctx.user.id));
        return { url };
      }),

    getMyMenus: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { expertMenus: emTable, buddyExperts: beTable } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
      if (!expert) return [];
      return drizzleDb.select().from(emTable).where(eq(emTable.expertId, expert.id));
    }),

    createMenu: protectedProcedure
      .input(z.object({
        title: z.string().min(2).max(256),
        description: z.string().optional(),
        coverUrl: z.string().url().optional().or(z.literal("")),
        category: z.enum(["perdida_peso","ganancia_muscular","definicion","dieta_equilibrada","rendimiento","bienestar","vegano"]).optional(),
        dailyCalories: z.number().int().positive().optional(),
        isPublic: z.boolean().optional().default(true),
        menuData: z.string().optional(), // JSON string
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertMenus: emTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN", message: "Necesitas un perfil de experto para publicar menús" });
        const [res] = await drizzleDb.insert(emTable).values({
          expertId: expert.id,
          title: input.title,
          description: input.description,
          coverUrl: input.coverUrl,
          category: input.category ?? "dieta_equilibrada",
          dailyCalories: input.dailyCalories,
          isFree: true,
          isPublic: input.isPublic ?? true,
          menuData: input.menuData,
        }).returning({ id: emTable.id });
        return { id: res?.id ?? 0 };
      }),

    updateMenu: protectedProcedure
      .input(z.object({
        menuId: z.number().int(),
        title: z.string().min(2).max(256).optional(),
        description: z.string().optional(),
        coverUrl: z.string().url().optional().or(z.literal("")),
        category: z.enum(["perdida_peso","ganancia_muscular","definicion","dieta_equilibrada","rendimiento","bienestar","vegano"]).optional(),
        dailyCalories: z.number().int().positive().optional(),
        isPublic: z.boolean().optional(),
        menuData: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertMenus: emTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        const updates: Record<string, any> = {};
        if (input.title !== undefined) updates.title = input.title;
        if (input.description !== undefined) updates.description = input.description;
        if (input.coverUrl !== undefined) updates.coverUrl = input.coverUrl;
        if (input.category !== undefined) updates.category = input.category;
        if (input.dailyCalories !== undefined) updates.dailyCalories = input.dailyCalories;
        if (input.isPublic !== undefined) updates.isPublic = input.isPublic;
        if (input.menuData !== undefined) updates.menuData = input.menuData;
        await drizzleDb.update(emTable).set(updates).where(and(eq(emTable.id, input.menuId), eq(emTable.expertId, expert.id)));
        return { success: true };
      }),

    deleteMenu: protectedProcedure
      .input(z.object({ menuId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertMenus: emTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        await drizzleDb.delete(emTable).where(and(eq(emTable.id, input.menuId), eq(emTable.expertId, expert.id)));
        return { success: true };
      }),

    // ── Expert plan self-management ──────────────────────────────────────────────
    getMyPlans: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { expertPlans: epTable, buddyExperts: beTable } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
      if (!expert) return [];
      return drizzleDb.select().from(epTable).where(eq(epTable.expertId, expert.id));
    }),

    createPlan: protectedProcedure
      .input(z.object({
        title: z.string().min(2).max(256),
        description: z.string().optional(),
        coverUrl: z.string().url().optional().or(z.literal("")),
        category: z.enum(["perdida_peso","ganancia_muscular","definicion","dieta_equilibrada","rendimiento","bienestar","vegano"]).optional(),
        durationWeeks: z.number().int().min(1).max(52).optional(),
        dailyCalories: z.number().int().positive().optional(),
        dailyMeals: z.number().int().min(1).max(8).optional(),
        level: z.enum(["principiante","intermedio","avanzado"]).optional(),
        price: z.number().min(0).optional(),
        isPublic: z.boolean().optional().default(true),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertPlans: epTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN", message: "Necesitas un perfil de experto para crear planes" });
        const [res] = await drizzleDb.insert(epTable).values({
          expertId: expert.id,
          title: input.title,
          description: input.description,
          coverUrl: input.coverUrl || null,
          category: input.category ?? "dieta_equilibrada",
          durationWeeks: input.durationWeeks ?? 4,
          dailyCalories: input.dailyCalories,
          dailyMeals: input.dailyMeals ?? 3,
          level: input.level ?? "principiante",
          price: input.price ?? 0,
          isPublic: input.isPublic ?? true,
          tags: input.tags,
        }).returning({ id: epTable.id });
        // Increment plansCount on expert profile
        await drizzleDb.update(beTable).set({ plansCount: sql`${beTable.plansCount} + 1` }).where(eq(beTable.id, expert.id));
        return { id: res?.id ?? 0 };
      }),
    updatePlan: protectedProcedure
      .input(z.object({
        planId: z.number().int(),
        title: z.string().min(2).max(256).optional(),
        description: z.string().optional(),
        coverUrl: z.string().url().optional().or(z.literal("")),
        category: z.enum(["perdida_peso","ganancia_muscular","definicion","dieta_equilibrada","rendimiento","bienestar","vegano"]).optional(),
        durationWeeks: z.number().int().min(1).max(52).optional(),
        dailyCalories: z.number().int().positive().optional(),
        dailyMeals: z.number().int().min(1).max(8).optional(),
        level: z.enum(["principiante","intermedio","avanzado"]).optional(),
        price: z.number().min(0).optional(),
        isPublic: z.boolean().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertPlans: epTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        const updates: Record<string, any> = {};
        if (input.title !== undefined) updates.title = input.title;
        if (input.description !== undefined) updates.description = input.description;
        if (input.coverUrl !== undefined) updates.coverUrl = input.coverUrl || null;
        if (input.category !== undefined) updates.category = input.category;
        if (input.durationWeeks !== undefined) updates.durationWeeks = input.durationWeeks;
        if (input.dailyCalories !== undefined) updates.dailyCalories = input.dailyCalories;
        if (input.dailyMeals !== undefined) updates.dailyMeals = input.dailyMeals;
        if (input.level !== undefined) updates.level = input.level;
        if (input.price !== undefined) updates.price = input.price;
        if (input.isPublic !== undefined) updates.isPublic = input.isPublic;
        if (input.tags !== undefined) updates.tags = input.tags;
        await drizzleDb.update(epTable).set(updates).where(and(eq(epTable.id, input.planId), eq(epTable.expertId, expert.id)));
        return { success: true };
      }),

    deletePlan: protectedProcedure
      .input(z.object({ planId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertPlans: epTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, and, sql } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        await drizzleDb.delete(epTable).where(and(eq(epTable.id, input.planId), eq(epTable.expertId, expert.id)));
        await drizzleDb.update(beTable).set({ plansCount: sql`GREATEST(${beTable.plansCount} - 1, 0)` }).where(eq(beTable.id, expert.id));
        return { success: true };
      }),

    getMyCopiedPlans: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { userExpertPlanCopies: copiesTable, expertPlans: epTable, buddyExperts: beTable } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      return drizzleDb
        .select({
          copy: copiesTable,
          plan: epTable,
          expert: { id: beTable.id, displayName: beTable.displayName, avatarUrl: beTable.avatarUrl, specialty: beTable.specialty, verified: beTable.verified },
        })
        .from(copiesTable)
        .leftJoin(epTable, eq(copiesTable.planId, epTable.id))
        .leftJoin(beTable, eq(copiesTable.expertId, beTable.id))
        .where(eq(copiesTable.userId, ctx.user.id))
        .orderBy(desc(copiesTable.copiedAt))
        .limit(50);
    }),

    hasCopiedPlan: protectedProcedure
      .input(z.object({ planId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { copied: false };
        const { userExpertPlanCopies: copiesTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [row] = await drizzleDb.select().from(copiesTable).where(and(eq(copiesTable.userId, ctx.user.id), eq(copiesTable.planId, input.planId))).limit(1);
        return { copied: !!row };
      }),
    // ── Creator Dashboard Stats ─────────────────────────────────────────────
    getMyStats: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { buddyExperts: beTable, expertFollowers: efTable, expertPlans: epTable, expertMenus: emTable, creatorEarnings: ceTable } = await import("../drizzle/schema");
      const { eq, count, desc } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
      if (!expert) return null;
      const [followerRow] = await drizzleDb.select({ total: count() }).from(efTable).where(eq(efTable.expertId, expert.id));
      const [planRow] = await drizzleDb.select({ total: count() }).from(epTable).where(eq(epTable.expertId, expert.id));
      const [menuRow] = await drizzleDb.select({ total: count() }).from(emTable).where(eq(emTable.expertId, expert.id));
      const earnings = await drizzleDb.select().from(ceTable).where(eq(ceTable.creatorUserId, ctx.user.id)).orderBy(desc(ceTable.createdAt)).limit(20);
      const totalPaid = earnings.filter(e => e.status === "active").reduce((s, e) => s + (e.commissionAmount ?? 0), 0);
      const totalPending = earnings.filter(e => e.status === "pending").reduce((s, e) => s + (e.commissionAmount ?? 0), 0);
      return {
        expert,
        followersCount: followerRow?.total ?? 0,
        plansCount: planRow?.total ?? 0,
        menusCount: menuRow?.total ?? 0,
        recentEarnings: earnings.slice(0, 10),
        totalPaid,
        totalPending,
      };
    }),
    getMyFollowers: protectedProcedure
      .input(z.object({ limit: z.number().int().max(50).default(20), offset: z.number().int().default(0) }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { followers: [], total: 0 };
        const { buddyExperts: beTable, expertFollowers: efTable, users: usersTable } = await import("../drizzle/schema");
        const { eq, count, desc } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (!expert) return { followers: [], total: 0 };
        const [{ total }] = await drizzleDb.select({ total: count() }).from(efTable).where(eq(efTable.expertId, expert.id));
        const rows = await drizzleDb
          .select({ followedAt: efTable.followedAt, user: { id: usersTable.id, name: usersTable.name, email: usersTable.email, avatarUrl: usersTable.imageUrl } })
          .from(efTable)
          .leftJoin(usersTable, eq(efTable.userId, usersTable.id))
          .where(eq(efTable.expertId, expert.id))
          .orderBy(desc(efTable.followedAt))
          .limit(input.limit)
          .offset(input.offset);
        return { followers: rows, total };
      }),

    // ── Planes de servicio del nutricionista ─────────────────────────────────
    getServicePlans: publicProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        const { expertServicePlans } = await import("../drizzle/schema.js");
        return drizzleDb.select().from(expertServicePlans)
          .where(and(eq(expertServicePlans.expertId, input.expertId), eq(expertServicePlans.isActive, true)))
          .orderBy(asc(expertServicePlans.sortOrder), asc(expertServicePlans.price));
      }),

    getMyServicePlans: protectedProcedure
      .query(async ({ ctx }) => {
        const drizzleDb = await db.getDb();
        const { expertServicePlans, buddyExperts } = await import("../drizzle/schema.js");
        const expert = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert[0]) return [];
        return drizzleDb.select().from(expertServicePlans)
          .where(eq(expertServicePlans.expertId, expert[0].id))
          .orderBy(asc(expertServicePlans.sortOrder), asc(expertServicePlans.price));
      }),

    upsertServicePlan: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().min(0),
        billingPeriod: z.enum(["monthly", "quarterly", "annual", "one_time"]).default("monthly"),
        durationMonths: z.number().optional(),
        includes: z.array(z.string()).optional(),
        maxConsultations: z.number().optional(),
        isActive: z.boolean().default(true),
        isPopular: z.boolean().default(false),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        const { expertServicePlans, buddyExperts } = await import("../drizzle/schema.js");
        const expert = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert[0]) throw new TRPCError({ code: "FORBIDDEN", message: "No eres un BuddyExpert" });
        const data = {
          expertId: expert[0].id,
          name: input.name,
          description: input.description ?? null,
          price: input.price,
          billingPeriod: input.billingPeriod,
          durationMonths: input.durationMonths ?? null,
          includes: input.includes ? JSON.stringify(input.includes) : null,
          maxConsultations: input.maxConsultations ?? null,
          isActive: input.isActive,
          isPopular: input.isPopular,
          sortOrder: input.sortOrder,
          updatedAt: new Date(),
        };
        if (input.id) {
          await drizzleDb.update(expertServicePlans).set(data).where(and(eq(expertServicePlans.id, input.id), eq(expertServicePlans.expertId, expert[0].id)));
          return { id: input.id };
        } else {
          const [row] = await drizzleDb.insert(expertServicePlans).values({ ...data, createdAt: new Date() }).returning({ id: expertServicePlans.id });
          return row;
        }
      }),

    deleteServicePlan: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        const { expertServicePlans, buddyExperts } = await import("../drizzle/schema.js");
        const expert = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert[0]) throw new TRPCError({ code: "FORBIDDEN" });
        await drizzleDb.delete(expertServicePlans).where(and(eq(expertServicePlans.id, input.id), eq(expertServicePlans.expertId, expert[0].id)));
        return { ok: true };
      }),
  }),
  // ===========================================================================
  // BUDDY MAKERSS
  // ===========================================================================
  buddyMakers: router({
    list: publicProcedure
      .input(z.object({ featured: z.boolean().optional() }).nullish())
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { buddyMakers: bmTable, users: usersTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(bmTable.verified, true)];
        if (input?.featured) conditions.push(eq(bmTable.featured, true));
        return drizzleDb
          .select({ maker: bmTable, user: { name: usersTable.name, imageUrl: usersTable.imageUrl } })
          .from(bmTable)
          .leftJoin(usersTable, eq(bmTable.userId, usersTable.id))
          .where(and(...conditions))
          .orderBy(desc(bmTable.followersCount))
          .limit(50);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return null;
        const { buddyMakers: bmTable, users: usersTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await drizzleDb
          .select({ maker: bmTable, user: { name: usersTable.name, imageUrl: usersTable.imageUrl } })
          .from(bmTable)
          .leftJoin(usersTable, eq(bmTable.userId, usersTable.id))
          .where(eq(bmTable.id, input.id))
          .limit(1);
        return rows[0] ?? null;
      }),

    isFollowing: protectedProcedure
      .input(z.object({ makerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { following: false };
        const { makerFollowers: mfTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const row = await drizzleDb.select().from(mfTable).where(and(eq(mfTable.userId, ctx.user.id), eq(mfTable.makerId, input.makerId))).limit(1);
        return { following: !!row[0] };
      }),

    getFollowing: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { makerFollowers: mfTable, buddyMakers: bmTable } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      return drizzleDb
        .select({ maker: bmTable, followedAt: mfTable.followedAt })
        .from(mfTable)
        .leftJoin(bmTable, eq(mfTable.makerId, bmTable.id))
        .where(eq(mfTable.userId, ctx.user.id))
        .orderBy(desc(mfTable.followedAt))
        .limit(50);
    }),

    follow: protectedProcedure
      .input(z.object({ makerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { makerFollowers: mfTable, buddyMakers: bmTable } = await import("../drizzle/schema");
        const { eq, sql, and } = await import("drizzle-orm");
        const existing = await drizzleDb.select().from(mfTable).where(and(eq(mfTable.userId, ctx.user.id), eq(mfTable.makerId, input.makerId))).limit(1);
        if (existing[0]) {
          await drizzleDb.delete(mfTable).where(and(eq(mfTable.userId, ctx.user.id), eq(mfTable.makerId, input.makerId)));
          await drizzleDb.update(bmTable).set({ followersCount: sql`${bmTable.followersCount} - 1` }).where(eq(bmTable.id, input.makerId));
          return { following: false };
        }
        await drizzleDb.insert(mfTable).values({ userId: ctx.user.id, makerId: input.makerId });
        await drizzleDb.update(bmTable).set({ followersCount: sql`${bmTable.followersCount} + 1` }).where(eq(bmTable.id, input.makerId));
        return { following: true };
      }),

    // -- Maker self-management (panel propio) --
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { buddyMakers: bmSelf } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [row] = await drizzleDb.select().from(bmSelf).where(eq(bmSelf.userId, ctx.user.id)).limit(1);
      return row ?? null;
    }),

    createProfile: protectedProcedure
      .input(z.object({
        displayName: z.string().min(2).max(128),
        bio: z.string().optional(),
        specialty: z.string().max(128).optional(),
        avatarUrl: z.string().url().optional(),
        coverUrl: z.string().url().optional(),
        instagramHandle: z.string().max(64).optional(),
        youtubeHandle: z.string().max(64).optional(),
        tiktokHandle: z.string().max(64).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyMakers: bmSelf } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await drizzleDb.select().from(bmSelf).where(eq(bmSelf.userId, ctx.user.id)).limit(1);
        if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "Ya tienes un perfil de creador" });
        const [res] = await drizzleDb.insert(bmSelf).values({
          userId: ctx.user.id,
          displayName: input.displayName,
          bio: input.bio,
          specialty: input.specialty,
          avatarUrl: input.avatarUrl,
          coverUrl: input.coverUrl,
          instagramHandle: input.instagramHandle,
          youtubeHandle: input.youtubeHandle,
          tiktokHandle: input.tiktokHandle,
          verified: false,
          featured: false,
        }).returning({ id: bmSelf.id });
        return { id: res?.id ?? 0 };
      }),
    updateProfile: protectedProcedure
      .input(z.object({
        displayName: z.string().min(2).max(128).optional(),
        bio: z.string().optional(),
        specialty: z.string().max(128).optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
        coverUrl: z.string().url().optional().or(z.literal("")),
        instagramHandle: z.string().max(64).optional(),
        youtubeHandle: z.string().max(64).optional(),
        tiktokHandle: z.string().max(64).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyMakers: bmSelf } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const updates: Record<string, any> = {};
        if (input.displayName !== undefined) updates.displayName = input.displayName;
        if (input.bio !== undefined) updates.bio = input.bio;
        if (input.specialty !== undefined) updates.specialty = input.specialty;
        if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;
        if (input.coverUrl !== undefined) updates.coverUrl = input.coverUrl;
        if (input.instagramHandle !== undefined) updates.instagramHandle = input.instagramHandle;
        if (input.youtubeHandle !== undefined) updates.youtubeHandle = input.youtubeHandle;
        if (input.tiktokHandle !== undefined) updates.tiktokHandle = input.tiktokHandle;
        await drizzleDb.update(bmSelf).set(updates).where(eq(bmSelf.userId, ctx.user.id));
        return { success: true };
      }),

    getMyRecipes: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { recipes: rSelf, buddyMakers: bmSelf } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [maker] = await drizzleDb.select().from(bmSelf).where(eq(bmSelf.userId, ctx.user.id)).limit(1);
      if (!maker) return [];
      return drizzleDb.select().from(rSelf).where(eq(rSelf.buddyMakerId, maker.id));
    }),
    // ── Creator Dashboard Stats ─────────────────────────────────────────────
    getMyStats: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { buddyMakers: bmTable, makerFollowers: mfTable, recipes: rTable, creatorEarnings: ceTable } = await import("../drizzle/schema");
      const { eq, count, desc } = await import("drizzle-orm");
      const [maker] = await drizzleDb.select().from(bmTable).where(eq(bmTable.userId, ctx.user.id)).limit(1);
      if (!maker) return null;
      const [followerRow] = await drizzleDb.select({ total: count() }).from(mfTable).where(eq(mfTable.makerId, maker.id));
      const [recipeRow] = await drizzleDb.select({ total: count() }).from(rTable).where(eq(rTable.buddyMakerId, maker.id));
      const earnings = await drizzleDb.select().from(ceTable).where(eq(ceTable.creatorUserId, ctx.user.id)).orderBy(desc(ceTable.createdAt)).limit(20);
      const totalPaid = earnings.filter(e => e.status === "active").reduce((s, e) => s + (e.commissionAmount ?? 0), 0);
      const totalPending = earnings.filter(e => e.status === "pending").reduce((s, e) => s + (e.commissionAmount ?? 0), 0);
      return {
        maker,
        followersCount: followerRow?.total ?? 0,
        recipesCount: recipeRow?.total ?? 0,
        recentEarnings: earnings.slice(0, 10),
        totalPaid,
        totalPending,
      };
    }),
    getMyFollowers: protectedProcedure
      .input(z.object({ limit: z.number().int().max(50).default(20), offset: z.number().int().default(0) }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { followers: [], total: 0 };
        const { buddyMakers: bmTable, makerFollowers: mfTable, users: usersTable } = await import("../drizzle/schema");
        const { eq, count, desc } = await import("drizzle-orm");
        const [maker] = await drizzleDb.select().from(bmTable).where(eq(bmTable.userId, ctx.user.id)).limit(1);
        if (!maker) return { followers: [], total: 0 };
        const [{ total }] = await drizzleDb.select({ total: count() }).from(mfTable).where(eq(mfTable.makerId, maker.id));
        const rows = await drizzleDb
          .select({ followedAt: mfTable.followedAt, user: { id: usersTable.id, name: usersTable.name, email: usersTable.email, avatarUrl: usersTable.imageUrl } })
          .from(mfTable)
          .leftJoin(usersTable, eq(mfTable.userId, usersTable.id))
          .where(eq(mfTable.makerId, maker.id))
          .orderBy(desc(mfTable.followedAt))
          .limit(input.limit)
          .offset(input.offset);
        return { followers: rows, total };
      }),
  }),
  // ===========================================================================
  // STRIPE CONNECT — Onboarding y comisiones para creadores
  // ===========================================================================
  stripeConnect: router({
    getOnboardingLink: protectedProcedure
      .input(z.object({ creatorType: z.enum(["buddyexpert", "buddymaker"]) }))
      .mutation(async ({ ctx, input }) => {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyExperts: beTable, buddyMakers: bmTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        // Reutilizar cuenta Stripe existente si ya existe — no crear una nueva cada vez
        let existingAccountId: string | null = null;
        if (input.creatorType === "buddyexpert") {
          const [expert] = await drizzleDb.select({ stripeAccountId: beTable.stripeAccountId }).from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
          existingAccountId = expert?.stripeAccountId ?? null;
        } else {
          const [maker] = await drizzleDb.select({ stripeAccountId: bmTable.stripeAccountId }).from(bmTable).where(eq(bmTable.userId, ctx.user.id)).limit(1);
          existingAccountId = maker?.stripeAccountId ?? null;
        }
        let accountId = existingAccountId;
        if (!accountId) {
          // Solo crear cuenta Stripe si no existe ya una
          const account = await stripe.accounts.create({
            type: "express",
            email: ctx.user.email ?? undefined,
            capabilities: { transfers: { requested: true } },
            metadata: { userId: ctx.user.id.toString(), creatorType: input.creatorType },
          });
          accountId = account.id;
          if (input.creatorType === "buddyexpert") {
            await drizzleDb.update(beTable).set({ stripeAccountId: accountId }).where(eq(beTable.userId, ctx.user.id));
          } else {
            await drizzleDb.update(bmTable).set({ stripeAccountId: accountId }).where(eq(bmTable.userId, ctx.user.id));
          }
        }
        const origin = (ctx.req.headers.origin as string) || "https://buddymarket-ndjzmo7p.manus.space";
        const accountLink = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: `${origin}/app/buddy-expert-stats?refresh=true`,
          return_url: `${origin}/app/buddy-expert-stats?stripe=success`,
          type: "account_onboarding",
        });
        return { url: accountLink.url, accountId };
      }),

    getEarnings: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return { earnings: [], totalPaid: 0, totalPending: 0 };
      const { creatorEarnings: ceTable } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const earnings = await drizzleDb.select().from(ceTable).where(eq(ceTable.creatorUserId, ctx.user.id)).orderBy(desc(ceTable.createdAt)).limit(50);
      const totalPaid = earnings.filter((e) => e.status === "active").reduce((acc: number, e) => acc + (e.commissionAmount ?? 0), 0);
      const totalPending = earnings.filter((e) => e.status === "pending").reduce((acc: number, e) => acc + (e.commissionAmount ?? 0), 0);
      return { earnings, totalPaid, totalPending };
    }),
    getConnectStatus: protectedProcedure
      .input(z.object({ creatorType: z.enum(["buddyexpert", "buddymaker"]) }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { connected: false, onboardingCompleted: false, chargesEnabled: false, payoutsEnabled: false, stripeAccountId: null };
        const { buddyExperts: beTable, buddyMakers: bmTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const syncAccountStatus = async (accountId: string) => {
          try {
            const Stripe = (await import("stripe")).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
            const account = await stripe.accounts.retrieve(accountId);
            return {
              onboardingCompleted: account.details_submitted ?? false,
              chargesEnabled: account.charges_enabled ?? false,
              payoutsEnabled: account.payouts_enabled ?? false,
            };
          } catch (_e) { return null; }
        };

        if (input.creatorType === "buddyexpert") {
          const [expert] = await drizzleDb.select({
            stripeAccountId: beTable.stripeAccountId,
            stripeOnboardingCompleted: beTable.stripeOnboardingCompleted,
            chargesEnabled: beTable.chargesEnabled,
            payoutsEnabled: beTable.payoutsEnabled,
          }).from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
          if (!expert) return { connected: false, onboardingCompleted: false, chargesEnabled: false, payoutsEnabled: false, stripeAccountId: null };
          if (expert.stripeAccountId) {
            const live = await syncAccountStatus(expert.stripeAccountId);
            if (live) {
              await drizzleDb.update(beTable).set({
                stripeOnboardingCompleted: live.onboardingCompleted,
                chargesEnabled: live.chargesEnabled,
                payoutsEnabled: live.payoutsEnabled,
              }).where(eq(beTable.userId, ctx.user.id));
              return { connected: true, ...live, stripeAccountId: expert.stripeAccountId };
            }
          }
          return { connected: !!expert.stripeAccountId, onboardingCompleted: expert.stripeOnboardingCompleted, chargesEnabled: expert.chargesEnabled, payoutsEnabled: expert.payoutsEnabled, stripeAccountId: expert.stripeAccountId };
        } else {
          const [maker] = await drizzleDb.select({
            stripeAccountId: bmTable.stripeAccountId,
            stripeOnboardingCompleted: bmTable.stripeOnboardingCompleted,
            chargesEnabled: bmTable.chargesEnabled,
            payoutsEnabled: bmTable.payoutsEnabled,
          }).from(bmTable).where(eq(bmTable.userId, ctx.user.id)).limit(1);
          if (!maker) return { connected: false, onboardingCompleted: false, chargesEnabled: false, payoutsEnabled: false, stripeAccountId: null };
          if (maker.stripeAccountId) {
            const live = await syncAccountStatus(maker.stripeAccountId);
            if (live) {
              await drizzleDb.update(bmTable).set({
                stripeOnboardingCompleted: live.onboardingCompleted,
                chargesEnabled: live.chargesEnabled,
                payoutsEnabled: live.payoutsEnabled,
              }).where(eq(bmTable.userId, ctx.user.id));
              return { connected: true, ...live, stripeAccountId: maker.stripeAccountId };
            }
          }
          return { connected: !!maker.stripeAccountId, onboardingCompleted: maker.stripeOnboardingCompleted, chargesEnabled: maker.chargesEnabled, payoutsEnabled: maker.payoutsEnabled, stripeAccountId: maker.stripeAccountId };
        }
      }),
    getPaymentHistory: protectedProcedure
      .input(z.object({
        creatorType: z.enum(["buddyexpert", "buddymaker"]),
        limit: z.number().int().max(50).default(20),
      }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { balance: null, charges: [], payouts: [], totalReceived: 0, totalPending: 0 };
        const { buddyExperts: beTable, buddyMakers: bmTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        let stripeAccountId: string | null = null;
        if (input.creatorType === "buddyexpert") {
          const [expert] = await drizzleDb.select({ stripeAccountId: beTable.stripeAccountId, stripeOnboardingCompleted: beTable.stripeOnboardingCompleted }).from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
          if (!expert?.stripeAccountId || !expert.stripeOnboardingCompleted) return { balance: null, charges: [], payouts: [], totalReceived: 0, totalPending: 0, notConnected: true };
          stripeAccountId = expert.stripeAccountId;
        } else {
          const [maker] = await drizzleDb.select({ stripeAccountId: bmTable.stripeAccountId, stripeOnboardingCompleted: bmTable.stripeOnboardingCompleted }).from(bmTable).where(eq(bmTable.userId, ctx.user.id)).limit(1);
          if (!maker?.stripeAccountId || !maker.stripeOnboardingCompleted) return { balance: null, charges: [], payouts: [], totalReceived: 0, totalPending: 0, notConnected: true };
          stripeAccountId = maker.stripeAccountId;
        }
        try {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
          // Fetch balance, charges and payouts in parallel from the connected account
          const [balance, chargesList, payoutsList] = await Promise.all([
            stripe.balance.retrieve({ stripeAccount: stripeAccountId }),
            stripe.charges.list({ limit: input.limit, expand: ["data.payment_intent"] }, { stripeAccount: stripeAccountId }),
            stripe.payouts.list({ limit: 10 }, { stripeAccount: stripeAccountId }),
          ]);
          const totalReceived = balance.available.reduce((acc, b) => acc + b.amount, 0);
          const totalPending = balance.pending.reduce((acc, b) => acc + b.amount, 0);
          const charges = chargesList.data.map((c) => ({
            id: c.id,
            amount: c.amount,
            currency: c.currency,
            status: c.status,
            description: c.description,
            created: c.created,
            receiptUrl: c.receipt_url,
            refunded: c.refunded,
            customerEmail: c.billing_details?.email ?? null,
          }));
          const payouts = payoutsList.data.map((p) => ({
            id: p.id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            arrivalDate: p.arrival_date,
            created: p.created,
            description: p.description,
          }));
          return {
            balance: {
              available: balance.available.map((b) => ({ amount: b.amount, currency: b.currency })),
              pending: balance.pending.map((b) => ({ amount: b.amount, currency: b.currency })),
            },
            charges,
            payouts,
            totalReceived,
            totalPending,
            notConnected: false,
          };
        } catch (err: any) {
          // If Stripe account not fully set up, return empty
          console.error("[Stripe] getPaymentHistory error:", err?.message);
          return { balance: null, charges: [], payouts: [], totalReceived: 0, totalPending: 0, notConnected: false, error: err?.message };
        }
      }),

    getStripeDashboardLink: protectedProcedure
      .input(z.object({ creatorType: z.enum(["buddyexpert", "buddymaker"]) }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyExperts: beTable, buddyMakers: bmTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        let stripeAccountId: string | null = null;
        if (input.creatorType === "buddyexpert") {
          const [expert] = await drizzleDb.select({ stripeAccountId: beTable.stripeAccountId }).from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
          stripeAccountId = expert?.stripeAccountId ?? null;
        } else {
          const [maker] = await drizzleDb.select({ stripeAccountId: bmTable.stripeAccountId }).from(bmTable).where(eq(bmTable.userId, ctx.user.id)).limit(1);
          stripeAccountId = maker?.stripeAccountId ?? null;
        }
        if (!stripeAccountId) throw new TRPCError({ code: "BAD_REQUEST", message: "No tienes una cuenta de Stripe Connect configurada" });
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
        return { url: loginLink.url };
      }),
   }),

  // ===========================================================================
  // REFERRAL CODES — Códigos de referido para BuddyExperts y BuddyMakers
  // ===========================================================================
  referrals: router({
    // Get or create the referral code for the current creator
    getMyCode: protectedProcedure
      .input(z.object({ creatorType: z.enum(["buddyexpert", "buddymaker"]) }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { referralCodes } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const existing = await drizzleDb.select().from(referralCodes)
          .where(and(eq(referralCodes.userId, ctx.user.id), eq(referralCodes.ownerType, input.creatorType)))
          .limit(1);
        return existing[0] ?? null;
      }),

    // Generate a new referral code (creates Stripe coupon automatically)
    generate: protectedProcedure
      .input(z.object({
        creatorType: z.enum(["buddyexpert", "buddymaker"]),
        discountPercent: z.number().int().min(5).max(50).default(15),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { referralCodes, users: usersTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");

        // Check if code already exists
        const existing = await drizzleDb.select().from(referralCodes)
          .where(and(eq(referralCodes.userId, ctx.user.id), eq(referralCodes.ownerType, input.creatorType)))
          .limit(1);
        if (existing[0]) return existing[0];

        // Build a clean code from the user name
        const [userRow] = await drizzleDb.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, ctx.user.id)).limit(1);
        const baseName = (userRow?.name ?? "BUDDY").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
        const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `${baseName}${suffix}`;

        // Create Stripe coupon + promotion code
        let stripeCouponId: string | null = null;
        let stripePromoCodeId: string | null = null;
        try {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
          const coupon = await stripe.coupons.create({
            percent_off: input.discountPercent,
            duration: "once",
            name: `Referido ${code} - ${input.discountPercent}% descuento`,
            metadata: { referral_code: code, creator_user_id: ctx.user.id.toString(), creator_type: input.creatorType },
          });
          stripeCouponId = coupon.id;
          const promoCode = await stripe.promotionCodes.create({
            coupon: coupon.id,
            code,
            metadata: { referral_code: code, creator_user_id: ctx.user.id.toString() },
          } as any);
          stripePromoCodeId = promoCode.id;
        } catch (e: any) {
          console.error("[Referral] Stripe coupon creation failed:", e?.message);
          // Continue even if Stripe fails — code still works for tracking
        }

        const insertedRows = await drizzleDb.insert(referralCodes).values({
          userId: ctx.user.id,
          ownerType: input.creatorType as any,
          code,
          stripeCouponId,
          stripePromoCodeId,
          discountPercent: input.discountPercent,
          commissionPercent: 20,
        });
        const [newCode] = await drizzleDb.select().from(referralCodes)
          .where(and(eq(referralCodes.userId, ctx.user.id), eq(referralCodes.ownerType, input.creatorType)))
          .limit(1);
        return newCode;
      }),

    // Validate a referral code (public — called at checkout)
    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return null;
        const { referralCodes, users: usersTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const rows = await drizzleDb
          .select({ rc: referralCodes, userName: usersTable.name, userImage: usersTable.imageUrl })
          .from(referralCodes)
          .leftJoin(usersTable, eq(referralCodes.userId, usersTable.id))
          .where(and(eq(referralCodes.code, input.code.toUpperCase()), eq(referralCodes.isActive, true)))
          .limit(1);
        if (!rows[0]) return null;
        return {
          id: rows[0].rc.id,
          code: rows[0].rc.code,
          discountPercent: rows[0].rc.discountPercent,
          stripeCouponId: rows[0].rc.stripeCouponId,
          stripePromoCodeId: rows[0].rc.stripePromoCodeId,
          ownerName: rows[0].userName,
          ownerImage: rows[0].userImage,
          ownerType: rows[0].rc.ownerType,
        };
      }),

    // Get earnings history for the current creator
    getMyEarnings: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).nullish())
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { earnings: [], totalEarned: 0, activeReferrals: 0 };
        const { referralCodes, referralEarnings, referralSubscriptions, users: usersTable } = await import("../drizzle/schema");
        const { eq, desc, sum, count } = await import("drizzle-orm");
        const limit = input?.limit ?? 50;

        // Get the creator's referral code
        const [myCode] = await drizzleDb.select().from(referralCodes).where(eq(referralCodes.userId, ctx.user.id)).limit(1);
        if (!myCode) return { earnings: [], totalEarned: 0, activeReferrals: 0 };

        const [earnings, activeCount] = await Promise.all([
          drizzleDb.select({
            earning: referralEarnings,
            referredName: usersTable.name,
            referredImage: usersTable.imageUrl,
          })
            .from(referralEarnings)
            .leftJoin(usersTable, eq(referralEarnings.referredUserId, usersTable.id))
            .where(eq(referralEarnings.referralCodeId, myCode.id))
            .orderBy(desc(referralEarnings.createdAt))
            .limit(limit),
          drizzleDb.select({ cnt: count() }).from(referralSubscriptions)
            .where(eq(referralSubscriptions.referralCodeId, myCode.id)),
        ]);

        return {
          code: myCode,
          earnings: earnings.map((r) => ({ ...r.earning, referredName: r.referredName, referredImage: r.referredImage })),
          totalEarned: myCode.totalEarned,
          activeReferrals: activeCount[0]?.cnt ?? 0,
          usageCount: myCode.usageCount,
        };
      }),

    // Dashboard stats for creators — aggregated metrics for the creator panel
    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { referralCodes, referralEarnings, referralSubscriptions, users: usersTable, buddyExperts, buddyMakers } = await import("../drizzle/schema");
      const { eq, and, desc, sum, count, gte, sql } = await import("drizzle-orm");

      // Find the creator's referral code
      const codes = await drizzleDb.select().from(referralCodes)
        .where(eq(referralCodes.userId, ctx.user.id)).limit(2);
      if (!codes.length) return { hasCode: false as const };
      const myCode = codes[0];

      // Determine creator profile type
      const [expertRow, makerRow] = await Promise.all([
        drizzleDb.select({ id: buddyExperts.id, displayName: buddyExperts.displayName, avatarUrl: buddyExperts.avatarUrl, verified: buddyExperts.verified, followersCount: buddyExperts.followersCount })
          .from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1),
        drizzleDb.select({ id: buddyMakers.id, displayName: buddyMakers.displayName, avatarUrl: buddyMakers.avatarUrl, verified: buddyMakers.verified, followersCount: buddyMakers.followersCount, recipesCount: buddyMakers.recipesCount })
          .from(buddyMakers).where(eq(buddyMakers.userId, ctx.user.id)).limit(1),
      ]);
      const creatorProfile = expertRow[0]
        ? { type: "expert" as const, ...expertRow[0] }
        : makerRow[0] ? { type: "maker" as const, ...makerRow[0] } : null;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const [allEarnings, monthEarnings, lastMonthEarnings, activeRefs, allRefs, recentEarnings, recentRefs] = await Promise.all([
        drizzleDb.select({ total: sum(referralEarnings.commissionAmount) }).from(referralEarnings)
          .where(eq(referralEarnings.referralCodeId, myCode.id)),
        drizzleDb.select({ total: sum(referralEarnings.commissionAmount) }).from(referralEarnings)
          .where(and(eq(referralEarnings.referralCodeId, myCode.id), gte(referralEarnings.createdAt, startOfMonth))),
        drizzleDb.select({ total: sum(referralEarnings.commissionAmount) }).from(referralEarnings)
          .where(and(eq(referralEarnings.referralCodeId, myCode.id), gte(referralEarnings.createdAt, startOfLastMonth), sql`${referralEarnings.createdAt} <= ${endOfLastMonth}`)),
        drizzleDb.select({ cnt: count() }).from(referralSubscriptions)
          .where(and(eq(referralSubscriptions.referralCodeId, myCode.id), eq(referralSubscriptions.isActive, true))),
        drizzleDb.select({ cnt: count() }).from(referralSubscriptions)
          .where(eq(referralSubscriptions.referralCodeId, myCode.id)),
        drizzleDb.select({ earning: referralEarnings, referredName: usersTable.name, referredImage: usersTable.imageUrl })
          .from(referralEarnings)
          .leftJoin(usersTable, eq(referralEarnings.referredUserId, usersTable.id))
          .where(eq(referralEarnings.referralCodeId, myCode.id))
          .orderBy(desc(referralEarnings.createdAt)).limit(20),
        drizzleDb.select({ sub: referralSubscriptions, referredName: usersTable.name, referredImage: usersTable.imageUrl })
          .from(referralSubscriptions)
          .leftJoin(usersTable, eq(referralSubscriptions.referredUserId, usersTable.id))
          .where(eq(referralSubscriptions.referralCodeId, myCode.id))
          .orderBy(desc(referralSubscriptions.createdAt)).limit(20),
      ]);

      const totalEarnedCents = Number(allEarnings[0]?.total ?? 0);
      const monthEarnedCents = Number(monthEarnings[0]?.total ?? 0);
      const lastMonthEarnedCents = Number(lastMonthEarnings[0]?.total ?? 0);
      const activeCount = activeRefs[0]?.cnt ?? 0;
      const totalCount = allRefs[0]?.cnt ?? 0;

      // Monthly trend — last 12 months
      const monthlyTrend: { month: string; earned: number; referrals: number; cumEarned: number; cumReferrals: number }[] = [];
      let cumEarned = 0; let cumReferrals = 0;
      for (let i = 11; i >= 0; i--) {
        const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const [mEarn, mRefs] = await Promise.all([
          drizzleDb.select({ total: sum(referralEarnings.commissionAmount) }).from(referralEarnings)
            .where(and(eq(referralEarnings.referralCodeId, myCode.id), gte(referralEarnings.createdAt, mStart), sql`${referralEarnings.createdAt} <= ${mEnd}`)),
          drizzleDb.select({ cnt: count() }).from(referralSubscriptions)
            .where(and(eq(referralSubscriptions.referralCodeId, myCode.id), gte(referralSubscriptions.createdAt, mStart), sql`${referralSubscriptions.createdAt} <= ${mEnd}`)),
        ]);
        const mEarnVal = Math.round(Number(mEarn[0]?.total ?? 0)) / 100;
        const mRefsVal = mRefs[0]?.cnt ?? 0;
        cumEarned = Math.round((cumEarned + mEarnVal) * 100) / 100;
        cumReferrals += mRefsVal;
        monthlyTrend.push({
          month: mStart.toLocaleString("es-ES", { month: "short", year: "2-digit" }),
          earned: mEarnVal,
          referrals: mRefsVal,
          cumEarned,
          cumReferrals,
        });
      }

      // Weekly trend — last 12 weeks
      const weeklyTrend: { week: string; earned: number; referrals: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const wStart = new Date(now); wStart.setDate(now.getDate() - (i + 1) * 7);
        const wEnd = new Date(now); wEnd.setDate(now.getDate() - i * 7); wEnd.setHours(23, 59, 59);
        const [wEarn, wRefs] = await Promise.all([
          drizzleDb.select({ total: sum(referralEarnings.commissionAmount) }).from(referralEarnings)
            .where(and(eq(referralEarnings.referralCodeId, myCode.id), gte(referralEarnings.createdAt, wStart), sql`${referralEarnings.createdAt} <= ${wEnd}`)),
          drizzleDb.select({ cnt: count() }).from(referralSubscriptions)
            .where(and(eq(referralSubscriptions.referralCodeId, myCode.id), gte(referralSubscriptions.createdAt, wStart), sql`${referralSubscriptions.createdAt} <= ${wEnd}`)),
        ]);
        weeklyTrend.push({
          week: `S${12 - i}`,
          earned: Math.round(Number(wEarn[0]?.total ?? 0)) / 100,
          referrals: wRefs[0]?.cnt ?? 0,
        });
      }

      // Projection: average of last 3 months * 12
      const last3 = monthlyTrend.slice(-3);
      const avgMonthlyEarned = last3.reduce((s, m) => s + m.earned, 0) / 3;
      const avgMonthlyReferrals = last3.reduce((s, m) => s + m.referrals, 0) / 3;
      const projection = {
        annualEarned: Math.round(avgMonthlyEarned * 12 * 100) / 100,
        annualReferrals: Math.round(avgMonthlyReferrals * 12),
        nextMonthEarned: Math.round(avgMonthlyEarned * 100) / 100,
        nextMonthReferrals: Math.round(avgMonthlyReferrals),
      };

      return {
        hasCode: true as const,
        code: myCode,
        creatorProfile,
        stats: {
          totalEarned: Math.round(totalEarnedCents) / 100,
          monthEarned: Math.round(monthEarnedCents) / 100,
          lastMonthEarned: Math.round(lastMonthEarnedCents) / 100,
          activeReferrals: activeCount,
          totalReferrals: totalCount,
          conversionRate: totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0,
          usageCount: myCode.usageCount,
        },
        monthlyTrend,
        weeklyTrend,
        projection,
        recentEarnings: recentEarnings.map(r => ({ ...r.earning, referredName: r.referredName, referredImage: r.referredImage })),
        recentReferrals: recentRefs.map(r => ({ ...r.sub, referredName: r.referredName, referredImage: r.referredImage })),
      };
    }),

    // Creator: paginated referrals list with filters and search
    getReferralsList: protectedProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        status: z.enum(["all", "active", "cancelled"]).default("all"),
        search: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
        const { referralCodes, referralSubscriptions, referralEarnings, users: usersTable } = await import("../drizzle/schema");
        const { eq, and, desc, sum, count, like, or, sql } = await import("drizzle-orm");

        // Find creator's code
        const codes = await drizzleDb.select().from(referralCodes)
          .where(eq(referralCodes.userId, ctx.user.id)).limit(1);
        if (!codes.length) return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
        const myCode = codes[0];

        // Build conditions
        const conditions = [eq(referralSubscriptions.referralCodeId, myCode.id)];
        if (input.status === "active") conditions.push(eq(referralSubscriptions.isActive, true));
        if (input.status === "cancelled") conditions.push(eq(referralSubscriptions.isActive, false));

        // Get total count
        const [totalRow] = await drizzleDb.select({ cnt: count() }).from(referralSubscriptions)
          .leftJoin(usersTable, eq(referralSubscriptions.referredUserId, usersTable.id))
          .where(and(...conditions));
        const total = totalRow?.cnt ?? 0;
        const totalPages = Math.ceil(total / input.pageSize);
        const offset = (input.page - 1) * input.pageSize;

        // Get referrals with earnings per referred user
        const rows = await drizzleDb.select({
          sub: referralSubscriptions,
          referredName: usersTable.name,
          referredEmail: usersTable.email,
          referredImage: usersTable.imageUrl,
          referredCreatedAt: usersTable.createdAt,
        })
          .from(referralSubscriptions)
          .leftJoin(usersTable, eq(referralSubscriptions.referredUserId, usersTable.id))
          .where(and(...conditions))
          .orderBy(desc(referralSubscriptions.createdAt))
          .limit(input.pageSize)
          .offset(offset);

        // For each referral, get total earnings generated
        const items = await Promise.all(rows.map(async (row) => {
          const [earningsRow] = await drizzleDb.select({ total: sum(referralEarnings.commissionAmount) })
            .from(referralEarnings)
            .where(and(
              eq(referralEarnings.referralCodeId, myCode.id),
              eq(referralEarnings.referredUserId, row.sub.referredUserId),
            ));
          const totalEarned = Math.round(Number(earningsRow?.total ?? 0)) / 100;
          const daysActive = row.sub.createdAt
            ? Math.floor((Date.now() - new Date(row.sub.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          return {
            id: row.sub.id,
            referredUserId: row.sub.referredUserId,
            referredName: row.referredName ?? "Usuario",
            referredEmail: row.referredEmail,
            referredImage: row.referredImage,
            plan: row.sub.plan,
            isActive: row.sub.isActive,
            createdAt: row.sub.createdAt,
            cancelledAt: row.sub.cancelledAt,
            totalEarned,
            daysActive,
          };
        }));

        // Filter by search after fetching (name/email)
        const filtered = input.search
          ? items.filter(i =>
              i.referredName.toLowerCase().includes(input.search!.toLowerCase()) ||
              (i.referredEmail ?? "").toLowerCase().includes(input.search!.toLowerCase())
            )
          : items;

        return { items: filtered, total, page: input.page, pageSize: input.pageSize, totalPages };
      }),

    // Admin: list all referral codes
    adminList: protectedProcedure.query(async ({ ctx }) => {
      if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { referralCodes, users: usersTable } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      return drizzleDb.select({ rc: referralCodes, userName: usersTable.name })
        .from(referralCodes)
        .leftJoin(usersTable, eq(referralCodes.userId, usersTable.id))
        .orderBy(desc(referralCodes.totalEarned))
        .limit(200);
    }),
  }),

  // ===========================================================================
  // BUDDY IA — Asistente nutricional con IA
  // ===========================================================================
  buddyIA: router({
    chat: protectedProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            })
          ),
          userProfile: z
            .object({
              goal: z.string().optional(),
              calories: z.number().optional(),
              restrictions: z.array(z.string()).optional(),
            })
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tier = await getUserPlanTier(ctx.user.id, ctx.user.role);
        requirePlanFeature(tier, "canUseBuddyIA");

        // ── Load full user profile from DB for personalized responses ────────────────
        const [userProfile, medicalProfile, userAllergiesData, userRestrictionsData, userPrefs] = await Promise.all([
          db.getUserProfile(ctx.user.id),
          db.getUserMedicalProfile(ctx.user.id),
          db.getUserAllergies(ctx.user.id),
          db.getUserDietRestrictions(ctx.user.id),
          db.getUserPreferences(ctx.user.id),
        ]);

        const allergyList = userAllergiesData.map((a: any) => a.allergy?.nameEs).filter(Boolean) as string[];
        const restrictionList = userRestrictionsData.map((r: any) => r.restriction?.nameEs).filter(Boolean) as string[];

        const goalLabels: Record<string, string> = {
          perdida_peso: "pérdida de peso",
          ganancia_muscular: "ganancia muscular",
          tonificacion: "tonificación",
          perdida_grasa: "pérdida de grasa",
          mantenimiento: "mantenimiento",
          bienestar: "bienestar general",
          vegano: "alimentación vegana",
          definicion: "definición corporal",
          salud: "salud y bienestar",
        };

        const activityLabels: Record<string, string> = {
          sedentary: "sedentario",
          lightly_active: "ligeramente activo",
          moderately_active: "moderadamente activo",
          very_active: "muy activo",
          extra_active: "extremadamente activo",
        };

        // Build personalized profile block
        const profileLines: string[] = [];
        if (ctx.user.name) profileLines.push(`- Nombre: ${ctx.user.name}`);
        if (userProfile) {
          if (userProfile.age) profileLines.push(`- Edad: ${userProfile.age} años`);
          if (userProfile.gender) profileLines.push(`- Sexo: ${userProfile.gender === "male" ? "Hombre" : userProfile.gender === "female" ? "Mujer" : "Otro"}`);
          if (userProfile.weight) profileLines.push(`- Peso actual: ${userProfile.weight} kg`);
          if (userProfile.height) profileLines.push(`- Altura: ${userProfile.height} cm`);
          if (userProfile.targetWeight) profileLines.push(`- Peso objetivo: ${userProfile.targetWeight} kg`);
          if (userProfile.mainGoal) profileLines.push(`- Objetivo principal: ${goalLabels[userProfile.mainGoal] || userProfile.mainGoal}`);
          if (userProfile.fitnessGoalDetail) profileLines.push(`- Detalle del objetivo: ${userProfile.fitnessGoalDetail}`);
          if (userProfile.sportsFrequency) profileLines.push(`- Frecuencia de entrenamiento: ${userProfile.sportsFrequency}`);
          if (userProfile.sportsTypes) profileLines.push(`- Deportes que practica: ${userProfile.sportsTypes}`);
          if (userProfile.weightChangeRate) profileLines.push(`- Ritmo de cambio de peso objetivo: ${userProfile.weightChangeRate} kg/semana`);
          if (userProfile.mealPrepTime) profileLines.push(`- Tiempo disponible para cocinar: ${userProfile.mealPrepTime}`);
          if (userProfile.cookingLevel) profileLines.push(`- Nivel de cocina: ${userProfile.cookingLevel}`);
          if (userProfile.dailyMeals) profileLines.push(`- Comidas al día: ${userProfile.dailyMeals}`);
          if (userProfile.menuDietType) profileLines.push(`- Tipo de dieta preferida: ${userProfile.menuDietType}`);
          if (userProfile.menuProteinSource) profileLines.push(`- Fuente de proteína preferida: ${userProfile.menuProteinSource}`);
          if (userProfile.sleepHours) profileLines.push(`- Horas de sueño: ${userProfile.sleepHours}h`);
          if (userProfile.stressLevel) profileLines.push(`- Nivel de estrés: ${userProfile.stressLevel}`);
          if (userProfile.waterIntake) profileLines.push(`- Ingesta de agua: ${userProfile.waterIntake}L/día`);
          if (userProfile.workType) profileLines.push(`- Tipo de trabajo: ${userProfile.workType}`);
          if (userProfile.dailyProteinGoal) profileLines.push(`- Objetivo de proteína: ${Math.round(userProfile.dailyProteinGoal)}g/día`);
          if (userProfile.dailyCarbsGoal) profileLines.push(`- Objetivo de carbohidratos: ${Math.round(userProfile.dailyCarbsGoal)}g/día`);
          if (userProfile.dailyFatGoal) profileLines.push(`- Objetivo de grasas: ${Math.round(userProfile.dailyFatGoal)}g/día`);
          if (userProfile.activityLevel) profileLines.push(`- Nivel de actividad: ${activityLabels[userProfile.activityLevel] || userProfile.activityLevel}`);
          if (userProfile.dailyCalorieGoal) profileLines.push(`- Calorías diarias objetivo (TDEE): ${Math.round(userProfile.dailyCalorieGoal)} kcal`);
          if (userProfile.basalMetabolicRate) profileLines.push(`- Tasa metabólica basal (TMB): ${Math.round(userProfile.basalMetabolicRate)} kcal`);
          if (userProfile.practicesSports) profileLines.push(`- Practica deporte: sí`);
          if (userProfile.dislikedIngredients) profileLines.push(`- Ingredientes que NO le gustan: ${userProfile.dislikedIngredients}`);
          if (userProfile.favoriteCuisines) profileLines.push(`- Cocinas favoritas: ${userProfile.favoriteCuisines}`);
          if (userProfile.budgetPerWeek) profileLines.push(`- Presupuesto semanal de alimentación: ${userProfile.budgetPerWeek}€`);
        }
        if (medicalProfile) {
          if (medicalProfile.medicalConditions) profileLines.push(`- Condiciones médicas: ${medicalProfile.medicalConditions}`);
          if (medicalProfile.metabolismMedication) profileLines.push(`- Medicación que afecta al metabolismo: ${medicalProfile.metabolismMedication}`);
          if (medicalProfile.surgery) profileLines.push(`- Cirugías relevantes: ${medicalProfile.surgery}`);
          if (medicalProfile.medicalDiet) profileLines.push(`- Dieta médica prescrita: ${medicalProfile.medicalDiet}`);
          if (medicalProfile.nutritionalSupplements) profileLines.push(`- Suplementos nutricionales: ${medicalProfile.nutritionalSupplements}`);
          if (medicalProfile.dietaryPattern) profileLines.push(`- Patrón dietético: ${medicalProfile.dietaryPattern}`);
          if (medicalProfile.medicalFamilyBackground) profileLines.push(`- Antecedentes familiares: ${medicalProfile.medicalFamilyBackground}`);
        }
        if (allergyList.length > 0) profileLines.push(`- ALERGIAS E INTOLERANCIAS (NUNCA sugerir): ${allergyList.join(", ")}`);
        if (restrictionList.length > 0) profileLines.push(`- Restricciones dietéticas: ${restrictionList.join(", ")}`);
        if (userPrefs) {
          if (userPrefs.preferredMealComplexity) profileLines.push(`- Complejidad de recetas preferida: ${userPrefs.preferredMealComplexity}`);
          if (userPrefs.portionSize) profileLines.push(`- Tamaño de porciones: ${userPrefs.portionSize}`);
          if (userPrefs.avoidProcessedFood) profileLines.push(`- Evita alimentos procesados: sí`);
          if (userPrefs.preferSeasonalIngredients) profileLines.push(`- Prefiere ingredientes de temporada: sí`);
          if (userPrefs.wantsCalorieTracking) profileLines.push(`- Quiere seguimiento de calorías: sí`);
          if (userPrefs.wantsMacroTracking) profileLines.push(`- Quiere seguimiento de macros: sí`);
        }
        // Also merge input.userProfile if provided by frontend (legacy support)
        if (input.userProfile?.goal && !userProfile?.mainGoal) profileLines.push(`- Objetivo (del formulario): ${input.userProfile.goal}`);
        if (input.userProfile?.calories && !userProfile?.dailyCalorieGoal) profileLines.push(`- Calorías objetivo (del formulario): ${input.userProfile.calories}`);
        if (input.userProfile?.restrictions?.length && allergyList.length === 0) profileLines.push(`- Restricciones (del formulario): ${input.userProfile.restrictions.join(", ")}`);

        const profileBlock = profileLines.length > 0
          ? `\n\n══ PERFIL DEL USUARIO (usa SIEMPRE estos datos para personalizar tus respuestas) ══\n${profileLines.join("\n")}\n\nCUANDO el usuario pregunte por cantidades, calorías, macros o recomendaciones, SIEMPRE usa sus datos reales (peso, TDEE, objetivo) en lugar de ejemplos genéricos. Si el usuario pregunta "cuánta proteína necesito", calcula con su peso real. Si pregunta por un menú, adáptalo a sus calorías objetivo y restricciones.`
          : "";

        const systemPrompt = `Eres BuddyIA, el asistente nutricional inteligente de BuddyOne. Eres un experto en nutrición, dietética y alimentación saludable. Tu objetivo es ayudar a los usuarios a:
- Crear menús semanales personalizados
- Calcular calorías y macronutrientes
- Sugerir recetas saludables y deliciosas
- Resolver dudas sobre nutrición y dieta
- Adaptar la alimentación a sus objetivos (pérdida de peso, ganancia muscular, etc.)

Siempre responde en español, de forma amigable, clara y motivadora. Usa emojis ocasionalmente. Cuando sugieras menús o recetas, incluye información nutricional aproximada (calorías, proteínas, carbohidratos, grasas).

IMPORTANTE: No eres un médico. Siempre recomienda consultar con un profesional de la salud para condiciones médicas específicas.${profileBlock}`;

        const messagesWithSystem = [
          { role: "system" as const, content: systemPrompt },
          ...input.messages,
        ];

        try {
          const response = await invokeLLM({ messages: messagesWithSystem });
          const content = response.choices?.[0]?.message?.content ?? "Lo siento, no pude procesar tu consulta en este momento. Por favor, inténtalo de nuevo.";
          return { content };
        } catch (err: any) {
          console.error("[BuddyIA] Error calling LLM:", err?.message || err);
          // Return a friendly fallback instead of throwing
          return {
            content: "Lo siento, estoy teniendo dificultades para conectarme en este momento. Por favor, inténtalo de nuevo en unos segundos. Si el problema persiste, revisa tu conexión a internet. 🤖",
          };
        }
      }),

    generateWeeklyMenu: publicProcedure
      .input(
        z.object({
          calories: z.number().min(1000).max(5000),
          goal: z.enum(["perdida_peso", "ganancia_muscular", "mantenimiento", "definicion"]),
          restrictions: z.array(z.string()).optional(),
          preferences: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const goalLabels: Record<string, string> = {
          perdida_peso: "pérdida de peso",
          ganancia_muscular: "ganancia muscular",
          mantenimiento: "mantenimiento",
          definicion: "definición corporal",
        };
        const prompt = `Crea un menú semanal completo (7 días) para un objetivo de ${goalLabels[input.goal]} con EXACTAMENTE ${input.calories} kcal/día. LÍMITE CALÓRICO ESTRICTO: el total de calorías de cada día NO PUEDE superar ${input.calories} kcal. Si la suma de las comidas supera este límite, REDUCE las porciones hasta cumplirlo.${input.restrictions?.length ? ` Restricciones: ${input.restrictions.join(", ")}.` : ""}${input.preferences ? ` Preferencias: ${input.preferences}.` : ""}
REGLAS ESTRICTAS POR FRANJA HORARIA:
- DESAYUNO: solo alimentos ligeros (tostadas, avena, yogur, fruta, huevos, batido). NUNCA ensaladas, guisos, arroces, pastas, carnes, pescados, legumbres.
- MEDIA MAÑANA: solo snack pequeño (fruta, yogur, frutos secos, barrita). NUNCA platos completos, ensaladas, carnes, pescados.
- COMIDA: plato principal completo (proteína + carbohidrato + verdura). Aquí sí pueden ir ensaladas grandes, arroces, pastas, carnes, pescados.
- MERIENDA: solo snack pequeño (fruta, yogur, frutos secos, tostada). NUNCA platos completos.
- CENA: comida ligera (ensalada, crema de verduras, pescado a la plancha, tortilla, revueltos). NUNCA platos muy pesados.
Para cada comida incluye: ingredientes con cantidades y receta con 3-4 pasos de preparación.

Formato JSON estricto:
{
  "days": [
    {
      "day": "Lunes",
      "totalCalories": 2000,
      "meals": [
        { "name": "Desayuno", "food": "descripción del desayuno", "calories": 400, "protein": 20, "carbs": 50, "fat": 10 },
        { "name": "Media mañana", "food": "descripción", "calories": 200, "protein": 10, "carbs": 25, "fat": 5 },
        { "name": "Comida", "food": "descripción", "calories": 700, "protein": 40, "carbs": 80, "fat": 20 },
        { "name": "Merienda", "food": "descripción", "calories": 200, "protein": 10, "carbs": 25, "fat": 5 },
        { "name": "Cena", "food": "descripción", "calories": 500, "protein": 35, "carbs": 50, "fat": 15 }
      ]
    }
  ]
}`;

        try {
          const response = await invokeLLM({
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          const rawContent = response.choices?.[0]?.message?.content ?? "{}";
          const content = typeof rawContent === "string" ? rawContent : "{}";
          return { menu: JSON.parse(content) };
        } catch (err: any) {
          console.error("[BuddyIA] generateWeeklyMenu error:", err?.message || err);
          return { menu: null, error: "Error al generar el menú. El servicio de IA no está disponible en este momento. Inténtalo de nuevo." };
        }
      }),

    // New: generate menu from full questionnaire answers
    generateMenuWithQuestionnaire: protectedProcedure
      .input(
        z.object({
          startDate: z.string(), // ISO date string YYYY-MM-DD
          cookingStyle: z.enum(["batch_cooking", "tuppers", "rapido", "trabajo", "restaurante", "mixto"]),
          persons: z.number().min(1).max(20),
          mealsPerDay: z.number().min(2).max(6),
          goal: z.enum(["perdida_peso", "ganancia_muscular", "tonificacion", "perdida_grasa", "mantenimiento", "definicion", "salud"]),
          calories: z.number().min(1000).max(5000).optional(),
          restrictions: z.array(z.string()).optional(),
          preferences: z.string().optional(),
          daysCount: z.number().min(1).max(14).default(7),
          // Existing optional fields
          eatOutDays: z.array(z.string()).optional(),
          dislikedFoods: z.string().optional(),
          budgetPerWeek: z.number().min(0).max(500).optional(),
          specialNotes: z.string().optional(),
          // New extended optional fields
          activityLevel: z.enum(["sedentario", "ligero", "moderado", "activo", "muy_activo"]).optional(),
          proteinSource: z.enum(["carne", "pescado", "legumbres", "huevos", "mixto", "vegetal"]).optional(),
          cookingTime: z.enum(["menos_15", "15_30", "30_60", "mas_60"]).optional(),
          cookingSkill: z.enum(["principiante", "intermedio", "avanzado"]).optional(),
          kitchenEquipment: z.array(z.string()).optional(), // ["horno", "freidora_aire", "thermomix", ...]
          mealTimings: z.object({
            breakfast: z.string().optional(), // "08:00"
            morningSnack: z.string().optional(),
            lunch: z.string().optional(),
            afternoonSnack: z.string().optional(),
            dinner: z.string().optional(),
          }).optional(),
          dietType: z.enum(["omnivoro", "flexitariano", "pescetariano", "vegetariano", "vegano", "cetogenico", "paleo", "mediterraneo", "dash"]).optional(),
          allergies: z.array(z.string()).optional(), // specific allergens beyond restrictions
          waterIntake: z.number().min(0).max(5).optional(), // litres per day goal
          supplementsUsed: z.string().optional(), // e.g. "proteína whey, creatina"
        })
      )
      .mutation(async ({ input, ctx }) => {
        console.log("[generateMenuWithQuestionnaire] input received:", JSON.stringify({ goal: input.goal, cookingStyle: input.cookingStyle, persons: input.persons, mealsPerDay: input.mealsPerDay, daysCount: input.daysCount, startDate: input.startDate, calories: input.calories, activityLevel: input.activityLevel, dietType: input.dietType }));
        // Auto-load user profile for personalization
        // CRITICAL: load BOTH allergies AND restrictions for safety filtering
        const [userProfile, medicalProfile, userPrefs, userRestrictions, userAllergiesData, questionnaireCycleData] = await Promise.all([
          db.getUserProfile(ctx.user.id),
          db.getUserMedicalProfile(ctx.user.id),
          db.getUserPreferences(ctx.user.id),
          db.getUserDietRestrictions(ctx.user.id),
          db.getUserAllergies(ctx.user.id), // ❌ CRITICAL: allergies must be loaded
          db.getMenstrualCycleData(ctx.user.id),
        ]);
        // Menstrual cycle phase block (only for women with tracking enabled)
        const questionnaireCycleBlock = db.buildCyclePhaseBlock(questionnaireCycleData?.phaseInfo);
        // Build user metrics string for the AI prompt
        const profileMetrics = userProfile ? [
          userProfile.weight ? `Peso: ${userProfile.weight}kg` : null,
          userProfile.height ? `Altura: ${userProfile.height}cm` : null,
          userProfile.age ? `Edad: ${userProfile.age} años` : null,
          userProfile.gender ? `Sexo: ${userProfile.gender === 'male' ? 'Hombre' : userProfile.gender === 'female' ? 'Mujer' : 'Otro'}` : null,
          userProfile.basalMetabolicRate ? `TMB: ${Math.round(userProfile.basalMetabolicRate)} kcal` : null,
          userProfile.dailyCalorieGoal ? `TDEE/Objetivo calorías: ${Math.round(userProfile.dailyCalorieGoal)} kcal/día` : null,
          userProfile.activityLevel ? `Nivel de actividad: ${userProfile.activityLevel}` : null,
          userProfile.practicesSports ? `Practica deporte: sí` : null,
          userProfile.dislikedIngredients ? `Ingredientes que no le gustan: ${userProfile.dislikedIngredients}` : null,
          userProfile.favoriteCuisines ? `Cocinas favoritas: ${userProfile.favoriteCuisines}` : null,
          userProfile.budgetPerWeek ? `Presupuesto semanal: ${userProfile.budgetPerWeek}€` : null,
        ].filter(Boolean).join('\n') : '';
        // Merge restrictions from profile + questionnaire
        const allRestrictions = [
          ...(input.restrictions || []),
          ...(userRestrictions.map((r: any) => r.restriction) || []),
        ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate
        // CRITICAL SAFETY: Build forbidden ingredients block for the AI prompt
        const forbiddenBlock = buildForbiddenIngredientsBlock({
          allergies: userAllergiesData,
          restrictions: userRestrictions,
          dislikedIngredients: userProfile?.dislikedIngredients,
          extraExclusions: input.allergies, // extra allergens from questionnaire form
        });
        // Merge disliked foods
        const allDislikedFoods = [input.dislikedFoods, userProfile?.dislikedIngredients].filter(Boolean).join(', ');
        // Effective budget
        const effectiveBudget = input.budgetPerWeek || userProfile?.budgetPerWeek || null;
        // Medical context
        const medicalContext = medicalProfile ? [
          medicalProfile.hasMedicalConditions && medicalProfile.medicalConditions ? `Condiciones médicas: ${medicalProfile.medicalConditions}` : null,
          medicalProfile.hasMedicalDiet && medicalProfile.medicalDiet ? `Dieta médica: ${medicalProfile.medicalDiet}` : null,
          medicalProfile.hasSurgery && medicalProfile.surgery ? `Cirugía reciente: ${medicalProfile.surgery}` : null,
        ].filter(Boolean).join('\n') : '';
        // Preferences context
        const prefsContext = userPrefs ? [
          userPrefs.avoidProcessedFood ? 'Evitar alimentos procesados' : null,
          userPrefs.preferSeasonalIngredients ? 'Preferir ingredientes de temporada' : null,
          userPrefs.portionSize ? `Tamaño de porciones: ${userPrefs.portionSize}` : null,
        ].filter(Boolean).join(', ') : '';
        // Replace input.restrictions with merged restrictions for the rest of the procedure
        const mergedInput = { ...input, restrictions: allRestrictions };
        const goalLabels: Record<string, string> = {
          perdida_peso: "pérdida de peso",
          ganancia_muscular: "ganancia muscular",
          tonificacion: "tonificación",
          perdida_grasa: "pérdida de grasa",
          mantenimiento: "mantenimiento",
          definicion: "definición corporal",
          salud: "salud y bienestar",
        };
        const cookingStyleLabels: Record<string, string> = {
          batch_cooking: "batch cooking (cocinar todo el domingo para la semana)",
          tuppers: "preparar tuppers para llevar al trabajo",
          rapido: "recetas rápidas de menos de 20 minutos",
          trabajo: "comidas para llevar al trabajo",
          restaurante: "comidas en restaurante o fuera de casa",
          mixto: "combinación de cocina en casa y fuera",
        };

        const mealNames = [
          "Desayuno",
          input.mealsPerDay >= 3 ? "Media mañana" : null,
          "Comida",
          input.mealsPerDay >= 4 ? "Merienda" : null,
          "Cena",
          input.mealsPerDay >= 6 ? "Recena" : null,
        ].filter(Boolean) as string[];

        // Use TDEE from profile if available, otherwise estimate from goal
        const targetCalories = input.calories || userProfile?.dailyCalorieGoal ||
          (input.goal === "perdida_peso" || input.goal === "perdida_grasa" ? 1600 :
           input.goal === "ganancia_muscular" ? 2800 : 2000);
        // Build strict dietary restriction enforcement rules
        const dietaryRules: string[] = [];
        if (allRestrictions.length) {
          const lowerR = allRestrictions.map((r: string) => r.toLowerCase());
          if (lowerR.some((r: string) => r.includes('vegan') || r.includes('vegano'))) {
            dietaryRules.push('DIETA VEGANA ESTRICTA: ABSOLUTAMENTE PROHIBIDO incluir cualquier producto de origen animal. Esto incluye: carne (pollo, ternera, cerdo, cordero, pavo), pescado, marisco, huevos, leche, queso, yogur, mantequilla, nata, miel, gelatina. SOLO alimentos 100% de origen vegetal. Verifica CADA plato.');
          } else if (lowerR.some((r: string) => r.includes('vegetar'))) {
            dietaryRules.push('DIETA VEGETARIANA ESTRICTA: ABSOLUTAMENTE PROHIBIDO incluir carne, pollo, pescado o marisco. Permitido: huevos, lácteos, miel. Verifica CADA plato.');
          }
          if (lowerR.some((r: string) => r.includes('sin gluten') || r.includes('celiaco') || r.includes('celíaco'))) {
            dietaryRules.push('SIN GLUTEN: PROHIBIDO trigo, cebada, centeno, avena convencional. Usar alternativas certificadas sin gluten.');
          }
          if (lowerR.some((r: string) => r.includes('sin lactosa') || r.includes('intolerante'))) {
            dietaryRules.push('SIN LACTOSA: Usar bebidas vegetales (avena, soja, almendras). Evitar lácteos convencionales.');
          }
        }
        // Build extended personalization context
        const activityLabels: Record<string, string> = {
          sedentario: "sedentario (oficina, sin ejercicio)",
          ligero: "ligeramente activo (1-2 días/semana de ejercicio)",
          moderado: "moderadamente activo (3-4 días/semana)",
          activo: "muy activo (5-6 días/semana)",
          muy_activo: "extremadamente activo (atleta, entrenamiento diario)",
        };
        const proteinLabels: Record<string, string> = {
          carne: "carne (pollo, ternera, cerdo)",
          pescado: "pescado y marisco",
          legumbres: "legumbres y proteína vegetal",
          huevos: "huevos y lácteos",
          mixto: "variado (carne, pescado, huevos)",
          vegetal: "100% proteína vegetal",
        };
        const cookingTimeLabels: Record<string, string> = {
          menos_15: "menos de 15 minutos por comida",
          "15_30": "15-30 minutos por comida",
          "30_60": "30-60 minutos por comida",
          mas_60: "más de 60 minutos (cocina elaborada)",
        };
        const cookingSkillLabels: Record<string, string> = {
          principiante: "principiante (recetas muy sencillas, pocos pasos)",
          intermedio: "intermedio (técnicas básicas, recetas variadas)",
          avanzado: "avanzado (técnicas complejas, presentación cuidada)",
        };
        const dietTypeLabels: Record<string, string> = {
          omnivoro: "omnívoro",
          flexitariano: "flexitariano (mayormente vegetal, algo de carne/pescado)",
          pescetariano: "pescetariano (pescado pero no carne)",
          vegetariano: "vegetariano",
          vegano: "vegano",
          cetogenico: "cetogénico (muy bajo en carbohidratos, alto en grasas)",
          paleo: "paleo (sin cereales, sin lácteos, sin legumbres)",
          mediterraneo: "mediterráneo",
          dash: "DASH (bajo en sodio, para hipertensión)",
        };
        const mealTimingsStr = input.mealTimings ? [
          input.mealTimings.breakfast ? `Desayuno: ${input.mealTimings.breakfast}` : null,
          input.mealTimings.morningSnack ? `Media mañana: ${input.mealTimings.morningSnack}` : null,
          input.mealTimings.lunch ? `Comida: ${input.mealTimings.lunch}` : null,
          input.mealTimings.afternoonSnack ? `Merienda: ${input.mealTimings.afternoonSnack}` : null,
          input.mealTimings.dinner ? `Cena: ${input.mealTimings.dinner}` : null,
        ].filter(Boolean).join(', ') : null;

        const prompt = `Eres un nutricionista experto. Crea un menú personalizado de ${input.daysCount} días COMPLETAMENTE ADAPTADO al perfil real del usuario.

=== PERFIL FÍSICO Y MÉTRICAS DEL USUARIO ===
${profileMetrics || 'No disponible'}

=== CONDICIONES MÉDICAS Y DIETA ESPECIAL ===
${medicalContext || 'Ninguna'}

=== PREFERENCIAS PERSONALES ===
${prefsContext || 'No especificadas'}

=== PARÁMETROS DEL MENÚ SOLICITADO ===
- Objetivo: ${goalLabels[input.goal]}
- Tipo de dieta: ${input.dietType ? dietTypeLabels[input.dietType] : 'No especificado'}
- Estilo de cocina: ${cookingStyleLabels[input.cookingStyle]}
- Número de personas: ${input.persons}
- Comidas al día: ${input.mealsPerDay} (${mealNames.join(", ")})
- Calorías objetivo: ${Math.round(targetCalories)} kcal/día por persona
- Días del menú: ${input.daysCount}
${input.activityLevel ? `- Nivel de actividad: ${activityLabels[input.activityLevel]}` : ''}
${input.proteinSource ? `- Fuente de proteína preferida: ${proteinLabels[input.proteinSource]}` : ''}
${input.cookingTime ? `- Tiempo disponible para cocinar: ${cookingTimeLabels[input.cookingTime]}` : ''}
${input.cookingSkill ? `- Nivel de habilidad en cocina: ${cookingSkillLabels[input.cookingSkill]}` : ''}
${input.kitchenEquipment?.length ? `- Equipo de cocina disponible: ${input.kitchenEquipment.join(", ")}` : ''}
${mealTimingsStr ? `- Horarios habituales de comidas: ${mealTimingsStr}` : ''}
${allRestrictions.length ? `- Restricciones/alergias: ${allRestrictions.join(", ")}` : ""}
${input.allergies?.length ? `- Alergias específicas adicionales: ${input.allergies.join(", ")}` : ''}
${allDislikedFoods ? `- Alimentos que NO le gustan: ${allDislikedFoods}` : ""}
${input.eatOutDays?.length ? `- Días que come FUERA de casa: ${input.eatOutDays.join(", ")} (para esos días propón opciones de restaurante o menú del día saludable, no recetas para cocinar en casa)` : ""}
${effectiveBudget ? `- Presupuesto semanal: ${effectiveBudget}€ (ajusta las recetas a este presupuesto)` : ""}
${input.waterIntake ? `- Objetivo de hidratación: ${input.waterIntake}L de agua al día` : ''}
${input.supplementsUsed ? `- Suplementos que usa: ${input.supplementsUsed} (ten en cuenta para no duplicar nutrientes)` : ''}
${input.preferences ? `- Preferencias adicionales: ${input.preferences}` : ""}
${input.specialNotes ? `- Notas especiales: ${input.specialNotes}` : ""}
${dietaryRules.length > 0 ? `\n⚠️ RESTRICCIONES DIETÉTICAS OBLIGATORIAS (INCUMPLIRLAS ES UN ERROR GRAVE):\n${dietaryRules.join('\n')}` : ""}
${forbiddenBlock}
${questionnaireCycleBlock}
IMPORTANTE para el estilo "${cookingStyleLabels[input.cookingStyle]}":
${input.cookingStyle === "batch_cooking" ? "- Agrupa ingredientes para cocinar en grandes cantidades el domingo\n- Reutiliza preparaciones base durante la semana (arroz, legumbres, proteínas)" : ""}
${input.cookingStyle === "tuppers" ? "- Todas las comidas deben ser aptas para tupper y microondas\n- Evita ensaladas que se pongan malas, prioriza guisos y platos calientes" : ""}
${input.cookingStyle === "rapido" ? "- Tiempo máximo de preparación: 20 minutos\n- Usa ingredientes fáciles de encontrar y preparar" : ""}
${input.cookingStyle === "restaurante" ? "- Los días de restaurante: sugiere qué pedir en un menú del día típico español (primer plato, segundo, postre) que sea saludable y se ajuste al objetivo" : ""}

🔢 LÍMITE CALÓRICO ESTRICTO (OBLIGATORIO): El total de calorías de CADA DÍA debe ser EXACTAMENTE ${Math.round(targetCalories)} kcal (±5% de margen máximo). Suma las calorías de todas las comidas del día antes de devolver el JSON. Si la suma supera ${Math.round(targetCalories * 1.05)} kcal, REDUCE las porciones. Si no llega a ${Math.round(targetCalories * 0.95)} kcal, AUMENTA las porciones. Este límite es INNEGOCIABLE.
⚠️ REGLAS ESTRICTAS POR FRANJA HORARIA (OBLIGATORIO - INCUMPLIRLAS ES UN ERROR GRAVE):

🌅 DESAYUNO (7:00-9:30h) - Comida LIGERA para empezar el día:
- SÍ permitido: tostadas, cereales, avena, porridge, yogur, fruta fresca, zumo natural, huevos revueltos/tortilla francesa, smoothie, batido, leche con cacao, bizcocho casero, magdalenas, pan con aceite, queso fresco con miel, granola
- NO permitido: ensaladas, guisos, carnes asadas, pescados al horno, arroces, pastas, legumbres, sopas, potajes, platos de cuchara
- Las calorías del desayuno deben ser entre el 15-25% del total diario

🍎 MEDIA MAÑANA (10:00-11:30h) - Snack MUY PEQUEÑO (máximo 200 kcal):
- SÍ permitido SOLO: 1 pieza de fruta (manzana, plátano, naranja), 1 yogur natural, 1 puñado de frutos secos (20-30g), 1 barrita de cereales, 1 tostada pequeña con algo, 1 batido de proteínas, infusión con 2-3 galletas
- EJEMPLOS CORRECTOS: "Manzana y yogur natural", "Plátano y puñado de almendras", "Yogur griego con frutos rojos", "Barrita de avena y manzana"
- ❌ ABSOLUTAMENTE PROHIBIDO: ensaladas (ni pequeñas), bocadillos, sándwiches, tortillas, huevos, carnes, pescados, arroces, pastas, guisos, sopas, cualquier plato que requiera cocinar más de 5 minutos
- Las calorías deben ser entre el 5-10% del total diario (máximo 200 kcal)

🍽️ COMIDA (13:30-15:30h) - Comida PRINCIPAL y más abundante:
- SÍ permitido: cualquier plato completo (ensaladas, arroces, pastas, carnes, pescados, legumbres, guisos, sopas, verduras con proteína)
- Debe incluir: proteína + carbohidrato + verdura/ensalada
- Las calorías deben ser entre el 30-40% del total diario

🍊 MERIENDA (17:00-18:30h) - Snack PEQUEÑO de tarde (máximo 200 kcal):
- SÍ permitido SOLO: fruta, yogur, frutos secos, tostada pequeña con algo, batido, infusión con algo dulce, hummus con crudités, queso fresco con fruta
- EJEMPLOS CORRECTOS: "Yogur con miel y nueces", "Naranja y puñado de almendras", "Tostada con aguacate", "Batido de plátano y leche"
- ❌ ABSOLUTAMENTE PROHIBIDO: ensaladas, bocadillos grandes, carnes, pescados, arroces, pastas, guisos
- Las calorías deben ser entre el 5-10% del total diario (máximo 200 kcal)

🌙 CENA (20:00-22:00h) - Comida LIGERA y digestiva:
- SÍ permitido: ensaladas, cremas de verduras, sopas, pescado a la plancha, tortilla, revueltos, verduras salteadas, pechuga de pollo, queso con fruta
- EVITAR: platos muy pesados, fritos, legumbres en grandes cantidades, carnes rojas en exceso
- Las calorías deben ser entre el 20-30% del total diario

ANTES DE DEVOLVER EL JSON, VERIFICA MENTALMENTE CADA COMIDA:
- ¿La media mañana es solo una fruta, yogur o frutos secos? Si no → cámbiala
- ¿La merienda es solo un snack pequeño? Si no → cámbiala  
- ¿El desayuno es ligero (no hay carnes, pescados, arroces, ensaladas)? Si no → cámbialo
- ¿Cada comida tiene su receta con pasos de preparación? Si no → añádela

IMPORTANTE: Debes generar EXACTAMENTE ${input.daysCount} días diferentes, uno por cada día a partir de ${input.startDate}. Cada día debe tener platos DISTINTOS (no repitas el mismo plato en el mismo momento del día en días diferentes). Calcula las fechas sumando 1 día por cada elemento del array.

Devuelve SOLO JSON válido con esta estructura exacta (${input.daysCount} elementos en el array "days"):
{
  "menuName": "nombre descriptivo del menú",
  "targetCalories": ${targetCalories},
  "persons": ${input.persons},
  "cookingTips": "consejo rápido sobre este estilo de cocina",
  "shoppingListSummary": "resumen de los ingredientes principales a comprar",
  "days": [
    ${(() => { const startD = new Date(input.startDate); return Array.from({length: input.daysCount}, (_, i) => { const d = new Date(startD); d.setDate(d.getDate() + i); const dateStr = d.toISOString().split('T')[0]; const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']; const dayName = dayNames[d.getDay()]; return `{ "day": "${dayName}", "date": "${dateStr}", "totalCalories": ${targetCalories}, "meals": [${mealNames.map(m => `{ "name": "${m}", "food": "descripción detallada del plato del ${dayName}", "calories": ${Math.round(targetCalories / mealNames.length)}, "protein": 20, "carbs": 50, "fat": 10, "prepTime": "20 min", "ingredients": ["ingrediente 1 - 100g", "ingrediente 2 - 50g"], "recipe": { "steps": ["Paso 1: descripción", "Paso 2: descripción", "Paso 3: descripción"], "tips": "consejo de preparación opcional" } }`).join(', ')}] }`; }).join(',\n    '); })()} 
  ]
}`;

        const llmCallStart = Date.now();
        try {
          // Add timeout to prevent hanging requests in production
          const llmPromise = invokeLLM({
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('LLM request timeout after 120s')), 120_000)
          );
          const response = await Promise.race([llmPromise, timeoutPromise]);
          const rawContent = response.choices?.[0]?.message?.content ?? "{}";
          const content = typeof rawContent === "string" ? rawContent : "{}";
          // Log finish reason to detect truncated responses
          const finishReason = response.choices?.[0]?.finish_reason;
          if (finishReason && finishReason !== 'stop') {
            console.warn(`[BuddyIA] generateMenuWithQuestionnaire: finish_reason=${finishReason} for user ${ctx.user.id}`);
          }
          if (!content || content === '{}') {
            console.error(`[BuddyIA] Empty response from LLM for user ${ctx.user.id}, finish_reason=${finishReason}`);
            return { menu: null, error: "El servicio de IA no devolvió ningún menú. Inténtalo de nuevo." };
          }
          const menu = JSON.parse(content);
          // CRITICAL SAFETY: post-generation allergy violation check (rec. #1, #3, #4)
          // Capture restrictions snapshot at generation time (rec. #2)
          const restrictionsSnapshot = {
            allergies: userAllergiesData.map((a) => a.allergy.nameEs),
            restrictions: userRestrictions.map((r: any) => r.restriction?.nameEs ?? ""),
            capturedAt: new Date().toISOString(),
          };
          const allergyViolations = await detectAndLogAllergyViolations(
            content,
            userAllergiesData,
            ctx.user.id,
            "generateMenuWithQuestionnaire",
            restrictionsSnapshot
          );
          if (allergyViolations.length > 0) {
            console.error(`[SAFETY] Allergy violation detected in generated menu for user ${ctx.user.id}. Violations: ${allergyViolations.join(', ')}. Regenerating...`);
            await createInAppNotif(ctx.user.id, {
              title: "⚠️ Aviso de seguridad",
              body: `Se detectó un posible ingrediente no permitido en tu menú generado. El sistema lo ha corregido automáticamente. Revisa tu perfil de alergias.`,
              type: "warning",
              link: "/app/menus",
            });
            return { menu: null, error: "El menú generado contenía ingredientes que no puedes consumir. Por favor, inténtalo de nuevo. Si el problema persiste, revisa tu perfil de alergias.", allergyViolations };
          }
          // Persist latency to DB for historical chart
          const llmLatencyMs = Date.now() - llmCallStart;
          try {
            const drizzleDb2 = await db.getDb();
            if (drizzleDb2) {
              const { llmLatencyLogs } = await import("../drizzle/schema.js");
              await drizzleDb2.insert(llmLatencyLogs).values({
                procedure: "generateMenuWithQuestionnaire",
                latencyMs: llmLatencyMs,
                success: true,
                finishReason: finishReason ?? null,
                totalTokens: (response as any).usage?.total_tokens ?? null,
              });
            }
          } catch (_) { /* non-critical, ignore */ }
          return { menu, userId: ctx.user.id };
        } catch (err: any) {
          // Log full error details for production debugging
          const errMsg = err?.message || String(err);
          const errStatus = err?.status || err?.statusCode || 'unknown';
          const errStack = err?.stack?.split('\n').slice(0, 3).join(' | ') || '';
          console.error(`[BuddyIA] generateMenuWithQuestionnaire error: status=${errStatus} msg=${errMsg} stack=${errStack}`);
          // Push to in-memory ring buffer for admin panel visibility
          if (!(global as any).__llmErrorLog) (global as any).__llmErrorLog = [];
          (global as any).__llmErrorLog.push({
            ts: new Date().toISOString(),
            procedure: 'generateMenuWithQuestionnaire',
            userId: ctx.user.id,
            status: errStatus,
            message: errMsg,
            stack: errStack,
          });
          if ((global as any).__llmErrorLog.length > 200) (global as any).__llmErrorLog.shift();
          // Persist error latency to DB
          try {
            const drizzleDb2 = await db.getDb();
            if (drizzleDb2) {
              const { llmLatencyLogs } = await import("../drizzle/schema.js");
              await drizzleDb2.insert(llmLatencyLogs).values({
                procedure: "generateMenuWithQuestionnaire",
                latencyMs: Date.now() - llmCallStart,
                success: false,
                errorMessage: errMsg.slice(0, 500),
              });
            }
          } catch (_) { /* non-critical, ignore */ }
          // Distinguish between different error types for better UX
          if (errMsg.includes('JSON') || errMsg.includes('parse') || errMsg.includes('Unexpected token')) {
            return { menu: null, error: "El menú generado no pudo procesarse correctamente. Inténtalo de nuevo." };
          }
          if (errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('quota')) {
            return { menu: null, error: "El servicio de IA está temporalmente saturado. Espera unos segundos e inténtalo de nuevo." };
          }
          if (errMsg.includes('timeout') || errMsg.includes('ETIMEDOUT') || errMsg.includes('ECONNRESET')) {
            return { menu: null, error: "La generación tardó demasiado. Inténtalo de nuevo con un menú de menos días." };
          }
          if (errMsg.includes('UNAUTHORIZED') || errMsg.includes('401') || errMsg.includes('403')) {
            return { menu: null, error: "Error de autenticación con el servicio de IA. Contacta con soporte." };
          }
          return { menu: null, error: "Error al generar el menú. El servicio de IA no está disponible en este momento. Inténtalo de nuevo en unos segundos." };
        }
      }),

    // Save a generated menu to the planner
    saveGeneratedMenu: protectedProcedure
      .input(
        z.object({
          menuName: z.string().min(2).max(80).trim(),
          startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
          goal: z.string().min(1).max(100).trim(),
          persons: z.number().int().min(1).max(20),
          targetCalories: z.number().min(0).max(10000),
          days: z.array(
            z.object({
              day: z.string().min(1).max(20),
              date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
              totalCalories: z.number().min(0).max(10000).optional(),
              meals: z.array(
                z.object({
                  name: z.string().min(1).max(50).trim(),
                  food: z.string().min(1).max(200).trim(),
                  calories: z.number().min(0).max(5000).optional(),
                  protein: z.number().min(0).max(500).optional(),
                  carbs: z.number().min(0).max(500).optional(),
                  fat: z.number().min(0).max(500).optional(),
                  prepTime: z.string().max(20).optional(),
                  ingredients: z.array(z.string().max(100)).max(30).optional(),
                })
              ).max(10, "Máximo 10 comidas por día"),
            })
          ).min(1).max(14, "Máximo 14 días por menú"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const drizzleDb = await db.getDb();
        const { menuOrganizers, menuOrganizerDayParts, menuOrganizerDayPartRecipes, dayParts, recipes } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");

        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

        // Get day parts
        const allDayParts = await drizzleDb.select().from(dayParts);
        const dayPartMap: Record<string, number> = {};
        for (const dp of allDayParts) {
          dayPartMap[dp.nameEs.toLowerCase()] = dp.id;
          dayPartMap[dp.apiParam.toLowerCase()] = dp.id;
        }

        const startDateObj = new Date(input.startDate);
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(endDateObj.getDate() + input.days.length - 1);

        // Normalize goal to valid enum value
        const validGoals = ["perdida_peso","ganancia_muscular","tonificacion","perdida_grasa","mantenimiento","bienestar","vegano"];
        const goalValue = validGoals.includes(input.goal) ? input.goal : "mantenimiento";

        // Create menu organizer
        const [menu] = await drizzleDb.insert(menuOrganizers).values({
          userId: ctx.user.id,
          name: input.menuName,
          startDate: (startDateObj instanceof Date ? startDateObj.toISOString().split("T")[0] : startDateObj) as any,
          endDate: (endDateObj instanceof Date ? endDateObj.toISOString().split("T")[0] : endDateObj) as any,
          goal: goalValue as any,
          dailyCalories: input.targetCalories,
          persons: input.persons,
          isSeeded: false,
          generatedByAI: true,
        }).returning({ id: menuOrganizers.id });
        const menuId = menu?.id ?? 0;

        // Cache: meal food name -> recipeId (avoid duplicate recipes for same dish across days)
        const mealRecipeCache: Record<string, number> = {};

        // Meal time mapping
        const mealTimeMap: Record<string, string> = {
          "desayuno": "desayuno",
          "media mañana": "media_manana",
          "almuerzo": "comida",
          "comida": "comida",
          "merienda": "merienda",
          "cena": "cena",
        };

        // Insert day parts and meals, creating recipes for each unique meal
        for (const dayData of input.days) {
          // Calculate correct date for each day: startDate + dayIndex
          const startDateObj2 = new Date(input.startDate + 'T12:00:00Z');
          const dayIndex = input.days.indexOf(dayData);
          const calculatedDate = new Date(startDateObj2);
          calculatedDate.setUTCDate(calculatedDate.getUTCDate() + dayIndex);
          const dayDate = dayData.date || calculatedDate.toISOString().split('T')[0];
          for (const meal of dayData.meals) {
            const dpId = dayPartMap[meal.name.toLowerCase()] || dayPartMap["comida"] || allDayParts[0]?.id;
            if (!dpId) continue;

            // Create or reuse recipe for this meal
            const cacheKey = meal.food.substring(0, 80).toLowerCase().trim();
            let recipeId = mealRecipeCache[cacheKey];

            if (!recipeId) {
              // Check if recipe already exists in DB for this user
              const existing = await drizzleDb
                .select({ id: recipes.id })
                .from(recipes)
                .where(eq(recipes.name, meal.food))
                .limit(1);

              if (existing.length > 0) {
                recipeId = existing[0].id;
              } else {
                // Create new recipe
                const mealTimeLower = meal.name.toLowerCase();
                const mealTime = mealTimeMap[mealTimeLower] || "cualquiera";
                let prepTimeMin = 20;
                if (meal.prepTime) {
                  const match = meal.prepTime.match(/(\d+)/);
                  if (match) prepTimeMin = parseInt(match[1], 10);
                }
                const ingredientsJson = meal.ingredients && meal.ingredients.length > 0
                  ? JSON.stringify(meal.ingredients.map((ing, i) => ({ name: ing, amount: "", unit: "", order: i })))
                  : null;

                const [newRecipe] = await drizzleDb.insert(recipes).values({
                  userId: ctx.user.id,
                  name: meal.food,
                  description: `Receta generada por IA. Ingredientes: ${meal.ingredients?.join(", ") || "Ver detalles"}.`,
                  preparationTime: prepTimeMin,
                  cookTime: 0,
                  servings: input.persons,
                  difficulty: "easy" as any,
                  isPublic: false,
                  active: true,
                  mealTime: mealTime as any,
                  caloriesPerServing: meal.calories || null,
                  proteinsPerServing: meal.protein || null,
                  carbsPerServing: meal.carbs || null,
                  fatsPerServing: meal.fat || null,
                  ingredientsJson,
                  isSeeded: false,
                }).returning({ id: recipes.id });
                recipeId = newRecipe?.id ?? 0;
              }
              mealRecipeCache[cacheKey] = recipeId;
            }

            // Create day part entry
            const [dp] = await drizzleDb.insert(menuOrganizerDayParts).values({
              menuOrganizerId: menuId,
              dayPartId: dpId,
              date: new Date(dayDate).toISOString().split("T")[0] as any,
              name: meal.food,
              notes: meal.food,
            }).returning({ id: menuOrganizerDayParts.id });

            // Link recipe to day part
            try {
              await drizzleDb.insert(menuOrganizerDayPartRecipes).values({
                menuOrganizerDayPartId: dp.id,
                recipeId,
                servings: input.persons,
              });
            } catch (_e) {
              // Ignore duplicate key errors
            }
          }
        }

         // Notify user that their AI menu was saved
        createInAppNotif(ctx.user.id, {
          title: "Menu guardado con exito",
          body: `Tu menu "${input.menuName}" ha sido guardado en Mis Menus. Puedes aplicarlo al diario desde la seccion de Menus.`,
          type: "success",
          link: "/app/menus",
        });
        // Send first AI menu email (async, non-blocking)
        if (ctx.user.email) {
          import("./email.js").then(({ sendFirstAIMenuEmail }) => {
            sendFirstAIMenuEmail({
              userEmail: ctx.user.email!,
              userName: ctx.user.name ?? ctx.user.email!,
              menuName: input.menuName ?? "Tu men\u00fa semanal",
            }).catch(() => {});
          }).catch(() => {});
        }
        return { menuId, success: true };
      }),

    // ── Replace a meal with an AI-generated alternative ──────────────────────
    generateMenuPDF: protectedProcedure
      .input(
        z.object({
          menuName: z.string().max(100).optional(),
          days: z.array(z.object({
            dayName: z.string(),
            date: z.string().optional(),
            meals: z.array(z.object({
              mealType: z.string(),
              name: z.string(),
              calories: z.number().optional(),
              protein: z.number().optional(),
              carbs: z.number().optional(),
              fat: z.number().optional(),
              ingredients: z.array(z.string()).optional(),
            })),
          })),
          goal: z.string().optional(),
          daysCount: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const { invokeLLM } = await import("./_core/llm.js");
          const { storagePut } = await import("./storage.js");

          // Load user profile for personalization
          const profile = await db.getUserProfile(ctx.user.id);
          const allergies = await db.getUserAllergies(ctx.user.id);
          const dietRestrictions = await db.getUserDietRestrictions(ctx.user.id);

          const allergyNames = allergies.map((a: any) => a.allergyName || a.name).filter(Boolean);
          const restrictionNames = dietRestrictions.map((r: any) => r.restrictionName || r.name).filter(Boolean);

          // Build menu summary for AI
          const menuSummary = input.days.map(day => {
            const meals = day.meals.map(m => `  - ${m.mealType}: ${m.name} (${m.calories || '?'} kcal, P:${m.protein || '?'}g C:${m.carbs || '?'}g G:${m.fat || '?'}g)`).join('\n');
            const dayTotal = day.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
            return `${day.dayName}${day.date ? ` (${day.date})` : ''} — Total: ${dayTotal} kcal\n${meals}`;
          }).join('\n\n');

          const aiPrompt = `Eres un nutricionista experto. Analiza este menú semanal y genera un informe nutricional completo en español.

MENÚ:\n${menuSummary}\n
PERFIL DEL USUARIO:\n- Objetivo: ${input.goal || 'equilibrado'}\n- Alergias: ${allergyNames.length ? allergyNames.join(', ') : 'ninguna'}\n- Restricciones: ${restrictionNames.length ? restrictionNames.join(', ') : 'ninguna'}

Genera un JSON con esta estructura exacta:
{
  "nutritionSummary": "Párrafo de 3-4 frases sobre el balance nutricional general del menú, distribución de macros y calidad de los alimentos",
  "keyNutrients": [
    { "name": "Proteína", "assessment": "adecuada/alta/baja", "tip": "consejo breve" },
    { "name": "Carbohidratos", "assessment": "adecuados/altos/bajos", "tip": "consejo breve" },
    { "name": "Grasas saludables", "assessment": "adecuadas/altas/bajas", "tip": "consejo breve" },
    { "name": "Fibra", "assessment": "adecuada/alta/baja", "tip": "consejo breve" },
    { "name": "Vitaminas y minerales", "assessment": "adecuados/insuficientes", "tip": "consejo breve" }
  ],
  "foodsToAvoid": [
    { "food": "nombre del alimento o grupo", "reason": "por qué evitarlo dado el objetivo y perfil" }
  ],
  "tips": [
    "Consejo personalizado 1 basado en el objetivo y el menú",
    "Consejo personalizado 2",
    "Consejo personalizado 3",
    "Consejo personalizado 4",
    "Consejo personalizado 5"
  ],
  "weeklyCaloriesAvg": 0,
  "weeklyProteinAvg": 0,
  "weeklyCarbsAvg": 0,
  "weeklyFatAvg": 0
}`;

          const aiRes = await invokeLLM({
            messages: [
              { role: 'system', content: 'Eres un nutricionista experto. Responde SOLO con JSON válido, sin markdown ni texto adicional.' },
              { role: 'user', content: aiPrompt },
            ],
            response_format: { type: 'json_object' },
          });

          let analysis: any = {};
          try {
            const rawContent = aiRes.choices?.[0]?.message?.content;
            const content = typeof rawContent === 'string' ? rawContent : '{}';
            analysis = JSON.parse(content);
          } catch {
            analysis = { nutritionSummary: 'Análisis no disponible.', keyNutrients: [], foodsToAvoid: [], tips: [] };
          }

          // Calculate actual averages from menu data
          const totalDays = input.days.length || 1;
          const totalCals = input.days.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + (m.calories || 0), 0), 0);
          const totalProt = input.days.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + (m.protein || 0), 0), 0);
          const totalCarbs = input.days.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + (m.carbs || 0), 0), 0);
          const totalFat = input.days.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + (m.fat || 0), 0), 0);
          analysis.weeklyCaloriesAvg = Math.round(totalCals / totalDays);
          analysis.weeklyProteinAvg = Math.round(totalProt / totalDays);
          analysis.weeklyCarbsAvg = Math.round(totalCarbs / totalDays);
          analysis.weeklyFatAvg = Math.round(totalFat / totalDays);

          // Generate PDF using PDFKit
          const PDFDocument = (await import('pdfkit')).default;
          const { Readable } = await import('stream');

          const doc = new PDFDocument({ margin: 50, size: 'A4' });
          const chunks: Buffer[] = [];
          doc.on('data', (chunk: Buffer) => chunks.push(chunk));

          const pdfReady = new Promise<Buffer>((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
          });

          const menuName = input.menuName || 'Menú Personalizado';
          const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

          // ── COVER PAGE ──
          doc.rect(0, 0, doc.page.width, 180).fill('#FF6B00');
          doc.fillColor('white').fontSize(28).font('Helvetica-Bold')
            .text('BuddyOne', 50, 40, { align: 'center' });
          doc.fontSize(14).font('Helvetica')
            .text('Informe Nutricional Personalizado', 50, 80, { align: 'center' });
          doc.fontSize(20).font('Helvetica-Bold')
            .text(menuName, 50, 110, { align: 'center' });
          doc.fontSize(11).font('Helvetica')
            .text(`Generado el ${today}`, 50, 148, { align: 'center' });

          doc.fillColor('#333333').moveDown(4);

          // ── NUTRITION SUMMARY ──
          doc.fontSize(16).font('Helvetica-Bold').fillColor('#FF6B00')
            .text('Resumen Nutricional', { underline: false });
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica').fillColor('#444444')
            .text(analysis.nutritionSummary || '', { lineGap: 4 });
          doc.moveDown(1);

          // ── DAILY AVERAGES ──
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#FF6B00')
            .text('Medias Diarias');
          doc.moveDown(0.5);
          const macroData = [
            { label: 'Calorías', value: `${analysis.weeklyCaloriesAvg} kcal` },
            { label: 'Proteínas', value: `${analysis.weeklyProteinAvg} g` },
            { label: 'Carbohidratos', value: `${analysis.weeklyCarbsAvg} g` },
            { label: 'Grasas', value: `${analysis.weeklyFatAvg} g` },
          ];
          const colW = (doc.page.width - 100) / 4;
          macroData.forEach((m, i) => {
            const x = 50 + i * colW;
            const y = doc.y;
            doc.rect(x, y, colW - 8, 50).fill('#FFF3E8').stroke('#FF6B00');
            doc.fillColor('#FF6B00').fontSize(16).font('Helvetica-Bold')
              .text(m.value, x, y + 8, { width: colW - 8, align: 'center' });
            doc.fillColor('#666666').fontSize(9).font('Helvetica')
              .text(m.label, x, y + 30, { width: colW - 8, align: 'center' });
          });
          doc.moveDown(4.5);

          // ── KEY NUTRIENTS ──
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#FF6B00')
            .text('Nutrientes Clave');
          doc.moveDown(0.5);
          (analysis.keyNutrients || []).forEach((n: any) => {
            const color = n.assessment?.includes('alta') || n.assessment?.includes('altos') ? '#E53E3E'
              : n.assessment?.includes('baja') || n.assessment?.includes('bajos') || n.assessment?.includes('insuficientes') ? '#DD6B20'
              : '#38A169';
            doc.fontSize(10).font('Helvetica-Bold').fillColor(color)
              .text(`● ${n.name}: `, { continued: true });
            doc.font('Helvetica').fillColor('#444444')
              .text(`${n.assessment} — ${n.tip}`, { lineGap: 3 });
          });
          doc.moveDown(1);

          // ── FOODS TO AVOID ──
          if ((analysis.foodsToAvoid || []).length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#FF6B00')
              .text('Alimentos a Evitar o Limitar');
            doc.moveDown(0.5);
            (analysis.foodsToAvoid || []).forEach((f: any) => {
              doc.fontSize(10).font('Helvetica-Bold').fillColor('#E53E3E')
                .text(`✗ ${f.food}: `, { continued: true });
              doc.font('Helvetica').fillColor('#444444')
                .text(f.reason, { lineGap: 3 });
            });
            doc.moveDown(1);
          }

          // ── TIPS ──
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#FF6B00')
            .text('Consejos Personalizados');
          doc.moveDown(0.5);
          (analysis.tips || []).forEach((tip: string, i: number) => {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#FF6B00')
              .text(`${i + 1}. `, { continued: true });
            doc.font('Helvetica').fillColor('#444444')
              .text(tip, { lineGap: 4 });
          });
          doc.moveDown(1.5);

          // ── MENU BY DAY ──
          doc.addPage();
          doc.fontSize(18).font('Helvetica-Bold').fillColor('#FF6B00')
            .text('Menú Detallado por Día', { align: 'center' });
          doc.moveDown(1);

          input.days.forEach((day) => {
            if (doc.y > doc.page.height - 150) doc.addPage();
            const dayTotal = day.meals.reduce((s, m) => s + (m.calories || 0), 0);
            doc.fontSize(13).font('Helvetica-Bold').fillColor('#FF6B00')
              .text(`${day.dayName}${day.date ? ` — ${day.date}` : ''} (${dayTotal} kcal total)`);
            doc.moveDown(0.3);
            day.meals.forEach((meal) => {
              if (doc.y > doc.page.height - 80) doc.addPage();
              doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
                .text(`  ${meal.mealType}: `, { continued: true });
              doc.font('Helvetica').fillColor('#555555')
                .text(`${meal.name} — ${meal.calories || '?'} kcal | P: ${meal.protein || '?'}g | C: ${meal.carbs || '?'}g | G: ${meal.fat || '?'}g`);
              if (meal.ingredients?.length) {
                doc.fontSize(9).fillColor('#888888')
                  .text(`    Ingredientes: ${meal.ingredients.slice(0, 6).join(', ')}${meal.ingredients.length > 6 ? '...' : ''}`, { lineGap: 2 });
              }
            });
            doc.moveDown(0.8);
          });

          // ── FOOTER ──
          doc.fontSize(8).fillColor('#AAAAAA')
            .text('Generado por BuddyOne — Tu asistente nutricional inteligente', 50, doc.page.height - 40, { align: 'center' });

          doc.end();
          const pdfBuffer = await pdfReady;

          // Upload to S3
          const fileKey = `menu-pdfs/${ctx.user.id}-${Date.now()}.pdf`;
          const { url } = await storagePut(fileKey, pdfBuffer, 'application/pdf');

          return { url, success: true };
        } catch (err: any) {
          console.error('[buddyIA.generateMenuPDF] error:', err?.message || err);
          return { url: null, success: false, error: 'No se pudo generar el PDF. Inténtalo de nuevo.' };
        }
      }),

    replaceMeal: protectedProcedure
      .input(
        z.object({
          mealName: z.string().min(1).max(50).trim(),
          currentFood: z.string().min(1).max(200).trim(),
          targetCalories: z.number().min(50).max(2000),
          dayName: z.string().min(1).max(20).trim(),
          menuGoal: z.string().min(1).max(100).trim(),
          persons: z.number().int().min(1).max(20).default(1),
          previousMealsToday: z.array(z.string().max(100)).max(6).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const [userAllergiesData, userRestrictionsData] = await Promise.all([
          db.getUserAllergies(ctx.user.id),
          db.getUserDietRestrictions(ctx.user.id),
        ]);

        const allergyList = userAllergiesData.map((a: any) => a.allergy?.nameEs).filter(Boolean) as string[];
        const restrictionList = userRestrictionsData.map((r: any) => r.restriction?.nameEs).filter(Boolean) as string[];

        const allergyContext = allergyList.length > 0
          ? `ALERGIAS E INTOLERANCIAS (OBLIGATORIO EXCLUIR): ${allergyList.join(", ")}.`
          : "Sin alergias registradas.";
        const restrictionContext = restrictionList.length > 0
          ? `RESTRICCIONES DIETÉTICAS: ${restrictionList.join(", ")}.`
          : "";
        const prevMealsContext = input.previousMealsToday && input.previousMealsToday.length > 0
          ? `Otras comidas del mismo día ya planificadas: ${input.previousMealsToday.join(", ")}. Evita repetir ingredientes principales.`
          : "";

        const prompt = `Eres un nutricionista experto. El usuario quiere reemplazar una comida de su menú semanal por una alternativa diferente.

COMIDA A REEMPLAZAR:
- Tipo: ${input.mealName} (${input.dayName})
- Plato actual: "${input.currentFood}"
- Calorías objetivo: ${input.targetCalories} kcal (±15% de margen)
- Objetivo nutricional del menú: ${input.menuGoal}
- Personas: ${input.persons}

${allergyContext}
${restrictionContext}
${prevMealsContext}

GENERA UNA ALTERNATIVA completamente diferente al plato actual. Debe ser:
1. Un plato DISTINTO (no variación del mismo)
2. Apropiado para el momento del día (${input.mealName})
3. Con calorías similares (${input.targetCalories} kcal ±15%)
4. Que respete ESTRICTAMENTE todas las alergias y restricciones
5. Práctico y fácil de preparar

Devuelve SOLO JSON válido con esta estructura exacta:
{
  "food": "nombre y descripción breve del plato alternativo",
  "calories": 450,
  "protein": 30,
  "carbs": 45,
  "fat": 12,
  "prepTime": "20 min",
  "ingredients": ["ingrediente 1 - cantidad", "ingrediente 2 - cantidad"],
  "reason": "breve explicación de por qué es una buena alternativa (1 frase)"
}`;

        try {
          const response = await invokeLLM({
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          const rawContent = response.choices?.[0]?.message?.content ?? "{}";
          const content = typeof rawContent === "string" ? rawContent : "{}";
          const alternative = JSON.parse(content);
          return { alternative, error: null };
        } catch (err: any) {
          console.error("[buddyIA.replaceMeal] error:", err?.message || err);
          return { alternative: null, error: "No se pudo generar la alternativa. Inténtalo de nuevo." };
        }
      }),
  }),
  // ---------------------------------------------------------------------------
  // EVENTS - Asistente de menús para eventos especiales
  // ---------------------------------------------------------------------------
  events: router({
    generateMenu: protectedProcedure
      .input(z.object({
        eventType: z.string().min(1).max(50).trim(),
        eventName: z.string().max(100).trim().optional(),
        persons: z.number().int().min(1).max(500),
        hasChildren: z.boolean().optional(),
        intolerances: z.array(z.string().max(50)).max(20).optional(),
        servesAlcohol: z.boolean().optional(),
        alcoholTypes: z.array(z.string().max(50)).max(10).optional(),
        courses: z.object({
          aperitivo: z.boolean().optional(),
          primero: z.boolean().optional(),
          segundo: z.boolean().optional(),
          postre: z.boolean().optional(),
          cafe: z.boolean().optional(),
        }).optional(),
        cuisineStyle: z.string().max(50).trim().optional(),
        budget: z.string().max(50).trim().optional(),
        season: z.string().max(30).trim().optional(),
        extraNotes: z.string().max(500).trim().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Plan gate: check event menu limit
        const tier = await getUserPlanTier(ctx.user.id, ctx.user.role);
        const { PLAN_LIMITS } = await import("../shared/plans.js");
        const limits = PLAN_LIMITS[tier];
        if (limits.maxEventMenusPerMonth !== -1) {
          // Count events generated this month
          const { savedEvents: seTable } = await import("../drizzle/schema.js");
          const { count: countFn, gte, eq, and } = await import("drizzle-orm");
          const drizzleDb = await db.getDb();
          if (drizzleDb) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const [row] = await drizzleDb.select({ cnt: countFn() }).from(seTable)
              .where(and(eq(seTable.userId, ctx.user.id), gte(seTable.createdAt, startOfMonth)));
            const used = Number(row?.cnt ?? 0);
            if (used >= limits.maxEventMenusPerMonth) {
              throw new TRPCError({ code: "FORBIDDEN", message: `PLAN_LIMIT_REACHED:maxEventMenusPerMonth:basic:Has usado tu menú de evento gratuito este mes. Actualiza a Pro para menús ilimitados.` });
            }
          }
        }
        const eventLabels: Record<string, string> = {
          cena_amigos: "Cena con amigos en casa",
          barbacoa: "Barbacoa",
          navidad: "Cena/Comida de Navidad",
          cumpleanos: "Cumpleaños",
          brunch: "Brunch dominical",
          aperitivo: "Aperitivo/Vermut",
          cena_romantica: "Cena romántica",
          fin_de_ano: "Cena de Fin de Año",
          reyes: "Comida de Reyes",
          semana_santa: "Semana Santa",
          otro: input.eventName || "Evento especial",
        };

        const eventLabel = eventLabels[input.eventType] || input.eventName || input.eventType;
        const courses = input.courses || { aperitivo: true, primero: true, segundo: true, postre: true };
        const courseList = Object.entries(courses)
          .filter(([, v]) => v)
          .map(([k]) => ({
            aperitivo: "Aperitivo",
            primero: "Primer plato",
            segundo: "Segundo plato",
            postre: "Postre",
            cafe: "Café y petit fours",
          }[k] || k))
          .join(", ");

        const systemPrompt = `Eres un chef experto y anfitrión profesional español. Creas menús completos, deliciosos y prácticos para eventos especiales. Siempre respondes con JSON válido y bien estructurado. Tus menús son creativos, adaptados a la temporada y al número de comensales, con consejos útiles para el anfitrión.`;

        const userPrompt = `Crea un menú completo para:

**Evento:** ${eventLabel}
**Personas:** ${input.persons}${input.hasChildren ? " (incluyendo niños)" : ""}
**Intolerancias/alergias:** ${input.intolerances?.length ? input.intolerances.join(", ") : "Ninguna"}
**Alcohol:** ${input.servesAlcohol ? `Sí (${input.alcoholTypes?.join(", ") || "a elección"})` : "No"}
**Platos:** ${courseList}
${input.cuisineStyle ? `**Estilo:** ${input.cuisineStyle}` : ""}
${input.budget ? `**Presupuesto:** ${input.budget}` : ""}
${input.season ? `**Temporada:** ${input.season}` : ""}
${input.extraNotes ? `**Notas:** ${input.extraNotes}` : ""}

Devuelve EXACTAMENTE este JSON:
{
  "eventTitle": "Título del menú",
  "intro": "Descripción del menú y estilo (2-3 frases)",
  "timeline": "Horario sugerido del evento",
  "courses": [
    {
      "name": "Aperitivo",
      "emoji": "🥂",
      "description": "Descripción breve del momento",
      "dishes": [
        {
          "name": "Nombre del plato",
          "description": "Descripción apetitosa",
          "servingTip": "Consejo de presentación",
          "prepTime": "20 min",
          "canPrepAhead": true,
          "difficulty": "Fácil",
          "ingredients": ["Ingrediente 1 (cantidad para ${input.persons} personas)"],
          "steps": ["Paso 1", "Paso 2"]
        }
      ]
    }
  ],
  "drinks": {
    "nonAlcoholic": ["Agua con gas", "Limonada"],
    "alcoholic": ${input.servesAlcohol ? '["Vino blanco fresco", "Cava brut"]' : "null"}
  },
  "shoppingList": [
    { "category": "Carnes y pescados", "items": ["Producto (cantidad total)"] },
    { "category": "Verduras y frutas", "items": [] },
    { "category": "Lácteos y huevos", "items": [] },
    { "category": "Despensa y conservas", "items": [] },
    { "category": "Pan y repostería", "items": [] }
  ],
  "hostingTips": ["Consejo 1 para ser un anfitrión 10", "Consejo 2", "Consejo 3", "Consejo 4"],
  "estimatedBudget": "Estimación del coste total",
  "prepSchedule": [
    { "when": "2 días antes", "tasks": ["Tarea 1", "Tarea 2"] },
    { "when": "El día anterior", "tasks": ["Tarea 1"] },
    { "when": "El mismo día", "tasks": ["Tarea 1", "Tarea 2"] }
  ]
}`;

         try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
          });
          const content = String(response.choices[0]?.message?.content || "{}");
          try {
            return JSON.parse(content) as Record<string, unknown>;
          } catch {
            return { error: "No se pudo generar el menú. Inténtalo de nuevo.", raw: content };
          }
        } catch (err: any) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al generar el menú del evento. Inténtalo de nuevo." });
        }
      }),
  }),

  // ─── Saved Events ────────────────────────────────────────────────────────────
  savedEvents: router({
    save: protectedProcedure
      .input(z.object({
        eventType: z.string().min(1).max(50).trim(),
        eventName: z.string().min(1).max(100).trim(),
        persons: z.number().int().min(1).max(500).default(4),
        categories: z.string().max(200).optional(),
        menuData: z.string().min(2).max(100000, "Los datos del menú son demasiado grandes"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { savedEvents } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        await drizzleDb!.insert(savedEvents).values({
          userId: ctx.user.id,
          eventType: input.eventType,
          eventName: input.eventName,
          persons: input.persons,
          categories: input.categories,
          menuData: input.menuData,
        });
        return { success: true };
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        const { savedEvents } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, desc } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        const rows = await drizzleDb!
          .select()
          .from(savedEvents)
          .where(eq(savedEvents.userId, ctx.user.id))
          .orderBy(desc(savedEvents.createdAt));
        return rows;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const { savedEvents } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        await drizzleDb!
          .delete(savedEvents)
          .where(and(eq(savedEvents.id, input.id), eq(savedEvents.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS & MEAL REMINDERS
  // ---------------------------------------------------------------------------
  notifications: router({
    getReminders: protectedProcedure.query(async ({ ctx }) => {
      const { getMealReminders } = await import("./db");
      return getMealReminders(ctx.user.id);
    }),

    upsertReminder: protectedProcedure
      .input(z.object({
        mealType: z.enum(["desayuno", "almuerzo", "merienda", "cena", "snack", "actividad"]),
        time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:MM requerido"),
        enabled: z.boolean().default(true),
        daysMask: z.number().int().min(0).max(127).default(127),
      }))
      .mutation(async ({ ctx, input }) => {
        const { upsertMealReminder } = await import("./db");
        const result = await upsertMealReminder(
          ctx.user.id,
          input.mealType,
          input.time,
          input.enabled,
          input.daysMask,
        );
        return { success: true, action: result.action };
      }),

    deleteReminder: protectedProcedure
      .input(z.object({ mealType: z.enum(["desayuno", "almuerzo", "merienda", "cena", "snack", "actividad"]) }))
      .mutation(async ({ ctx, input }) => {
        const { deleteMealReminder } = await import("./db");
        await deleteMealReminder(ctx.user.id, input.mealType);
        return { success: true };
      }),

    savePushSubscription: protectedProcedure
      .input(z.object({
        endpoint: z.string().url(),
        p256dh: z.string().min(1),
        auth: z.string().min(1),
        userAgent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { pushSubscriptions } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Upsert by endpoint (same device)
        const existing = await drizzleDb.select({ id: pushSubscriptions.id })
          .from(pushSubscriptions)
          .where(and(eq(pushSubscriptions.userId, ctx.user.id), eq(pushSubscriptions.endpoint, input.endpoint)))
          .limit(1);
        if (existing.length > 0) {
          await drizzleDb.update(pushSubscriptions)
            .set({ p256dh: input.p256dh, auth: input.auth, userAgent: input.userAgent ?? null })
            .where(eq(pushSubscriptions.id, existing[0]!.id));
        } else {
          await drizzleDb.insert(pushSubscriptions).values({
            userId: ctx.user.id,
            endpoint: input.endpoint,
            p256dh: input.p256dh,
            auth: input.auth,
            userAgent: input.userAgent ?? null,
          });
        }
        return { success: true };
      }),

    removePushSubscription: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { pushSubscriptions } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return { success: true };
        await drizzleDb.delete(pushSubscriptions)
          .where(and(eq(pushSubscriptions.userId, ctx.user.id), eq(pushSubscriptions.endpoint, input.endpoint)));
        return { success: true };
      }),

    getDailySummary: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date().toISOString().split("T")[0];
      const [nutrition, profile] = await Promise.all([
        db.getDailyNutritionSummary(ctx.user.id, today),
        db.getUserProfile(ctx.user.id),
      ]);
      const consumed = nutrition?.calories ?? 0;
      const goal = profile?.dailyCalorieGoal ?? 2000;
      const percentage = goal > 0 ? Math.round((consumed / goal) * 100) : 0;
      const remaining = Math.max(0, goal - consumed);
      return {
        consumed: Math.round(consumed),
        goal,
        percentage: Math.min(percentage, 100),
        remaining: Math.round(remaining),
        proteins: Math.round(nutrition?.proteins ?? 0),
        carbohydrates: Math.round(nutrition?.carbohydrates ?? 0),
        fats: Math.round(nutrition?.fats ?? 0),
        date: today,
      };
    }),

    // ── In-App Notifications ──────────────────────────────────────────────────
    inApp: router({
      list: protectedProcedure
        .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).nullish())
        .query(async ({ ctx, input }) => {
          const { inAppNotifications } = await import("../drizzle/schema");
          const { getDb } = await import("./db");
          const { eq, or, desc, and } = await import("drizzle-orm");
          const drizzleDb = await getDb();
          if (!drizzleDb) return [];
          const limit = input?.limit ?? 50;
          const rows = await drizzleDb.select()
            .from(inAppNotifications)
            .where(or(
              eq(inAppNotifications.userId, ctx.user.id),
              eq(inAppNotifications.userId, 0),
            ))
            .orderBy(desc(inAppNotifications.createdAt))
            .limit(limit);
          return rows;
        }),

      unreadCount: protectedProcedure.query(async ({ ctx }) => {
        const { inAppNotifications } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, or, and } = await import("drizzle-orm");
        const { count } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return 0;
        const result = await drizzleDb.select({ cnt: count() })
          .from(inAppNotifications)
          .where(and(
            or(
              eq(inAppNotifications.userId, ctx.user.id),
              eq(inAppNotifications.userId, 0),
            ),
            eq(inAppNotifications.isRead, false),
          ));
        return result[0]?.cnt ?? 0;
      }),

      markRead: protectedProcedure
        .input(z.object({ id: z.number().int() }))
        .mutation(async ({ ctx, input }) => {
          const { inAppNotifications } = await import("../drizzle/schema");
          const { getDb } = await import("./db");
          const { eq, and, or } = await import("drizzle-orm");
          const drizzleDb = await getDb();
          if (!drizzleDb) return { success: false };
          await drizzleDb.update(inAppNotifications)
            .set({ isRead: true, readAt: new Date() })
            .where(and(
              eq(inAppNotifications.id, input.id),
              or(
                eq(inAppNotifications.userId, ctx.user.id),
                eq(inAppNotifications.userId, 0),
              ),
            ));
          return { success: true };
        }),

      markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
        const { inAppNotifications } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, or, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return { success: false };
        await drizzleDb.update(inAppNotifications)
          .set({ isRead: true, readAt: new Date() })
          .where(and(
            or(
              eq(inAppNotifications.userId, ctx.user.id),
              eq(inAppNotifications.userId, 0),
            ),
            eq(inAppNotifications.isRead, false),
          ));
        return { success: true };
      }),

      create: protectedProcedure
        .input(z.object({
          userId: z.number().int().default(0),
          title: z.string().min(1).max(255),
          body: z.string().min(1),
          type: z.enum(["info", "success", "warning", "update", "promo"]).default("info"),
          link: z.string().optional(),
          imageUrl: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
          const { inAppNotifications } = await import("../drizzle/schema");
          const { getDb } = await import("./db");
          const drizzleDb = await getDb();
          if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          const result = await drizzleDb.insert(inAppNotifications).values({
            userId: input.userId,
            title: input.title,
            body: input.body,
            type: (input.type as any),
            link: input.link ?? null,
            imageUrl: input.imageUrl ?? null,
          });
          return { success: true, id: Number((result as any)[0]?.id ?? 0) };
        }),

      // Send a test push notification to the current user
      sendTestPush: protectedProcedure.mutation(async ({ ctx }) => {
        const { sendPushToUser } = await import("./pushNotifications.js");
        const sent = await sendPushToUser(ctx.user.id, {
          title: "🔔 Notificaciones activadas",
          body: "Las notificaciones push de BuddyOne están funcionando correctamente.",
          icon: "/icons/icon-192x192.png",
          url: "/app/dashboard",
          tag: "test-push",
        });
        return { success: sent > 0, sent };
      }),

      createWelcome: protectedProcedure.mutation(async ({ ctx }) => {
        const { inAppNotifications } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, count } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return { success: false };
        const existing = await drizzleDb.select({ cnt: count() })
          .from(inAppNotifications)
          .where(eq(inAppNotifications.userId, ctx.user.id));
        if ((existing[0]?.cnt ?? 0) > 0) return { success: false, reason: "already_has_notifications" };
        await drizzleDb.insert(inAppNotifications).values([
          {
            userId: ctx.user.id,
            title: "¡Bienvenid@ a BuddyOne! 🎉",
            body: "Estamos muy contentos de tenerte aquí. Completa tu perfil para obtener recomendaciones personalizadas y empieza a disfrutar de tu gestor nutricional inteligente.",
            type: "success",
            link: "/app/profile",
          },
          {
            userId: ctx.user.id,
            title: "Genera tu primer menú con IA 🤖",
            body: "BuddyIA puede crear un menú semanal personalizado según tus objetivos, preferencias y restricciones alimentarias. ¡Pruébalo ahora!",
            type: "info",
            link: "/app/buddy-ia",
          },
        ]);
        return { success: true };
      }),
    }),
  }),
  // ---------------------------------------------------------------------------
  // ACHIEVEMENTSS
  // ---------------------------------------------------------------------------
  achievements: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const { ACHIEVEMENTS_CATALOG, getLevelForPoints, getNextLevel } = await import("./achievements-catalog");
      const [unlocked, pointsRow] = await Promise.all([
        db.getUserAchievements(ctx.user.id),
        db.getUserPoints(ctx.user.id),
      ]);
      const unlockedIds = new Set(unlocked.map((a) => a.achievementId));
      const totalPoints = pointsRow?.totalPoints ?? 0;
      const currentLevel = getLevelForPoints(totalPoints);
      const nextLevel = getNextLevel(totalPoints);
      const achievements = ACHIEVEMENTS_CATALOG.map((a) => ({
        ...a,
        unlocked: unlockedIds.has(a.id),
        unlockedAt: unlocked.find((u) => u.achievementId === a.id)?.unlockedAt ?? null,
      }));
      return {
        achievements,
        totalPoints,
        level: currentLevel,
        nextLevel,
        unlockedCount: unlockedIds.size,
        totalCount: ACHIEVEMENTS_CATALOG.length,
      };
    }),

    getUserStats: protectedProcedure.query(async ({ ctx }) => {
      const { getLevelForPoints, getNextLevel, ACHIEVEMENTS_CATALOG } = await import("./achievements-catalog");
      const [unlocked, pointsRow] = await Promise.all([
        db.getUserAchievements(ctx.user.id),
        db.getUserPoints(ctx.user.id),
      ]);
      const totalPoints = pointsRow?.totalPoints ?? 0;
      const currentLevel = getLevelForPoints(totalPoints);
      const nextLevel = getNextLevel(totalPoints);
      const pointsToNext = nextLevel ? nextLevel.minPoints - totalPoints : 0;
      const progressToNext = nextLevel
        ? Math.round(((totalPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100)
        : 100;
      return {
        totalPoints,
        level: currentLevel,
        nextLevel,
        pointsToNext,
        progressToNext,
        unlockedCount: unlocked.length,
        totalCount: ACHIEVEMENTS_CATALOG.length,
        recentUnlocked: unlocked.slice(0, 3),
      };
    }),

    evaluate: protectedProcedure
      .input(z.object({
        trigger: z.enum(["meal_logged", "recipe_created", "profile_completed", "barcode_used", "photo_added"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const { ACHIEVEMENTS_CATALOG } = await import("./achievements-catalog");
        const userId = ctx.user.id;
        const newlyUnlocked: string[] = [];

        // Gather stats needed for evaluation
        const [totalLogs, distinctRecipes, streak, mealTypesToday] = await Promise.all([
          db.getTotalMealLogs(userId),
          db.getDistinctRecipesLogged(userId),
          db.getMealStreak(userId),
          db.getMealTypesLoggedToday(userId),
        ]);

        for (const achievement of ACHIEVEMENTS_CATALOG) {
          const alreadyUnlocked = await db.hasAchievement(userId, achievement.id);
          if (alreadyUnlocked) continue;

          let shouldUnlock = false;
          const cond = achievement.condition;

          if (cond.type === "first_log" && totalLogs >= 1) shouldUnlock = true;
          else if (cond.type === "total_logs" && totalLogs >= cond.count) shouldUnlock = true;
          else if (cond.type === "streak_days" && streak >= cond.days) shouldUnlock = true;
          else if (cond.type === "distinct_recipes" && distinctRecipes >= cond.count) shouldUnlock = true;
          else if (cond.type === "distinct_meal_types" && mealTypesToday.length >= cond.count) shouldUnlock = true;
          else if (cond.type === "used_barcode_scanner" && input.trigger === "barcode_used") shouldUnlock = true;
          else if (cond.type === "added_meal_photo" && input.trigger === "photo_added") shouldUnlock = true;
          else if (cond.type === "created_recipe" && input.trigger === "recipe_created") shouldUnlock = true;
          else if (cond.type === "completed_profile" && input.trigger === "profile_completed") shouldUnlock = true;

          if (shouldUnlock) {
            const result = await db.unlockAchievement(userId, achievement.id, achievement.points);
            if (result?.unlocked) newlyUnlocked.push(achievement.id);
          }
        }

        return {
          newlyUnlocked,
          count: newlyUnlocked.length,
        };
      }),
  }),

  // ===========================================================================
  // SPECIALIZED MENUS — Menús para condiciones médicas y estilos de vida
  // ===========================================================================
  // ---------------------------------------------------------------------------
  // ROLE REQUESTS (BuddyMaker / BuddyExpert)
  // ---------------------------------------------------------------------------
  roleRequests: router({
    // Any logged-in user can submit a request
    submit: protectedProcedure
      .input(z.object({
        roleType: z.enum(["buddymaker", "buddyexpert"]),
        motivation: z.string().min(20).max(1000),
        socialLinks: z.object({
          instagram: z.string().optional(),
          website: z.string().optional(),
          youtube: z.string().optional(),
        }).optional(),
        specialties: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getRoleRequestByUserAndType(ctx.user.id, input.roleType);
        if (existing) {
          if (existing.status === "approved") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Ya tienes este rol aprobado" });
          }
          if (existing.status === "pending") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Ya tienes una solicitud pendiente de revisión" });
          }
          // Rejected → allow resubmission
          await db.updateRoleRequest(existing.id, {
            status: "pending",
            motivation: input.motivation,
            socialLinks: input.socialLinks ? JSON.stringify(input.socialLinks) : null,
            specialties: input.specialties ? JSON.stringify(input.specialties) : null,
            reviewNote: null,
            reviewedAt: null,
            reviewedBy: null,
          });
          return { success: true, requestId: existing.id };
        }
        const requestId = await db.createRoleRequest({
          userId: ctx.user.id,
          roleType: input.roleType,
          motivation: input.motivation,
          socialLinks: input.socialLinks ? JSON.stringify(input.socialLinks) : null,
          specialties: input.specialties ? JSON.stringify(input.specialties) : null,
        });
        return { success: true, requestId };
      }),

    getMine: protectedProcedure.query(async ({ ctx }) => {
      const requests = await db.getRoleRequestsByUser(ctx.user.id);
      return requests.map(r => ({
        ...r,
        socialLinks: r.socialLinks ? (() => { try { return JSON.parse(r.socialLinks!); } catch { return null; } })() : null,
        specialties: r.specialties ? (() => { try { return JSON.parse(r.specialties!); } catch { return []; } })() : [],
      }));
    }),

    adminList: protectedProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected", "all"]).default("pending") }))
      .query(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const requests = await db.getAllRoleRequests(input.status === "all" ? undefined : input.status);
        // Join with user data
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { users: usersTable } = await import("../drizzle/schema");
        const { inArray } = await import("drizzle-orm");
        const userIds = Array.from(new Set(requests.map(r => r.userId)));
        const usersData = userIds.length > 0 ? await drizzleDb.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, imageUrl: usersTable.imageUrl }).from(usersTable).where(inArray(usersTable.id, userIds)) : [];
        const usersMap = Object.fromEntries(usersData.map(u => [u.id, u]));
        return requests.map(r => ({ ...r, user: usersMap[r.userId] ?? null }));
      }),

    approve: protectedProcedure
      .input(z.object({ requestId: z.number(), note: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const allRequests = await db.getAllRoleRequests();
        const req = allRequests.find(r => r.id === input.requestId);
        if (!req) throw new TRPCError({ code: "NOT_FOUND" });
        await db.updateRoleRequest(input.requestId, {
          status: "approved",
          reviewNote: input.note ?? null,
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
        });
        const newRole = req.roleType as "buddymaker" | "buddyexpert";
        await db.updateUser(req.userId, { role: newRole, accountType: newRole });
        return { success: true };
      }),

    reject: protectedProcedure
      .input(z.object({ requestId: z.number(), note: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        await db.updateRoleRequest(input.requestId, {
          status: "rejected",
          reviewNote: input.note ?? null,
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  specializedMenus: router({
    generate: protectedProcedure
      .input(z.object({
        category: z.enum([
          "embarazada", "lactancia", "vegano", "vegetariano", "celiaco",
          "diabetico", "hipertension", "colesterol", "renal", "cancer",
          "acatarrado", "gastritis", "reflujo", "intestino_irritable",
          "anemia", "hipotiroidismo", "osteoporosis", "gota",
          "nino_6_12", "adolescente", "mayor_65", "deportista",
          "perdida_peso_medica", "preoperatorio", "postoperatorio",
        ]),
        days: z.number().min(1).max(7).default(7),
        persons: z.number().min(1).max(10).default(1),
        extraNotes: z.string().max(500).optional(),
        allergies: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tier = await getUserPlanTier(ctx.user.id, ctx.user.role);
        requirePlanFeature(tier, "canAccessSpecializedMenus");
        const CATEGORY_LABELS: Record<string, string> = {
          embarazada: "Embarazada",
          lactancia: "Madre en periodo de lactancia",
          vegano: "Vegano (sin productos animales)",
          vegetariano: "Vegetariano",
          celiaco: "Celíaco (sin gluten)",
          diabetico: "Diabético (control de glucemia)",
          hipertension: "Hipertensión (bajo en sodio)",
          colesterol: "Colesterol alto (bajo en grasas saturadas)",
          renal: "Enfermedad renal (bajo en potasio y fósforo)",
          cancer: "Paciente oncológico (apoyo nutricional)",
          acatarrado: "Resfriado/gripe (recuperación)",
          gastritis: "Gastritis (dieta blanda)",
          reflujo: "Reflujo gastroesofágico",
          intestino_irritable: "Síndrome de intestino irritable",
          anemia: "Anemia (rico en hierro)",
          hipotiroidismo: "Hipotiroidismo",
          osteoporosis: "Osteoporosis (rico en calcio)",
          gota: "Gota (bajo en purinas)",
          nino_6_12: "Niño de 6 a 12 años",
          adolescente: "Adolescente (12-18 años)",
          mayor_65: "Persona mayor de 65 años",
          deportista: "Deportista de alto rendimiento",
          perdida_peso_medica: "Pérdida de peso bajo supervisión médica",
          preoperatorio: "Pre-operatorio",
          postoperatorio: "Post-operatorio",
        };

        const CATEGORY_GUIDELINES: Record<string, string> = {
          embarazada: "Aumenta el ácido fólico, hierro, calcio y omega-3. Evita pescados con mercurio, embutidos crudos, quesos no pasteurizados y alcohol. Incluye 5 comidas al día.",
          lactancia: "Aumenta las calorías en 500 kcal/día, hidratación abundante, calcio, omega-3. Evita cafeína en exceso y alcohol.",
          vegano: "Sin ningún producto de origen animal. Asegura proteína completa combinando legumbres y cereales. Suplementa B12, hierro, zinc y omega-3 de origen vegetal.",
          vegetariano: "Sin carne ni pescado. Puede incluir huevos y lácteos. Asegura hierro no hemo con vitamina C.",
          celiaco: "ESTRICTAMENTE sin gluten. Evita trigo, cebada, centeno, espelta. Usa arroz, maíz, quinoa, patata. Vigila contaminación cruzada.",
          diabetico: "Bajo índice glucémico. Controla las raciones de hidratos. Evita azúcares simples. 5-6 comidas pequeñas. Prioriza fibra y proteína.",
          hipertension: "Dieta DASH: bajo en sodio (<2g/día), rico en potasio, magnesio y calcio. Evita sal añadida, embutidos, conservas y alimentos procesados.",
          colesterol: "Bajo en grasas saturadas y trans. Rico en fibra soluble, omega-3 y esteroles vegetales. Evita carnes rojas, mantequilla, fritos.",
          renal: "Bajo en potasio, fósforo y sodio. Controla proteínas. Evita plátano, naranja, tomate, legumbres, lácteos en exceso.",
          cancer: "Alimentos antiinflamatorios, antioxidantes. Fácil digestión. Alta densidad nutricional. Evita azúcar refinado y ultraprocesados.",
          acatarrado: "Alimentos ricos en vitamina C, zinc, jengibre, ajo. Caldos, sopas y purés calientes. Hidratación máxima. Fácil digestión.",
          gastritis: "Dieta blanda: evita picantes, ácidos, fritos, alcohol, cafeína. Comidas pequeñas y frecuentes. Cocción suave.",
          reflujo: "Evita tomate, cítricos, chocolate, menta, fritos, alcohol. Cenas ligeras 3h antes de dormir. Porciones pequeñas.",
          intestino_irritable: "Dieta baja en FODMAPs. Evita lactosa, fructosa, sorbitol, trigo, legumbres en exceso. Cocción suave.",
          anemia: "Rico en hierro hemo (carnes rojas, hígado) y no hemo (espinacas, lentejas). Combina con vitamina C. Evita té y café con las comidas.",
          hipotiroidismo: "Evita el exceso de soja y crucíferas crudas. Asegura yodo y selenio. Dieta equilibrada con fibra.",
          osteoporosis: "Rico en calcio (lácteos, sardinas, brócoli) y vitamina D. Evita exceso de sal, cafeína y alcohol.",
          gota: "Bajo en purinas: evita vísceras, mariscos, embutidos, alcohol (especialmente cerveza). Rico en agua y vitamina C.",
          nino_6_12: "Equilibrado y variado. Aporta calcio, hierro y omega-3 para el crecimiento. Presentación atractiva y raciones adaptadas.",
          adolescente: "Alto requerimiento calórico y proteico. Calcio y hierro prioritarios. Evita ultraprocesados. Hidratación.",
          mayor_65: "Fácil masticación, alta densidad nutricional, rico en proteína para evitar sarcopenia, calcio y vitamina D. Hidratación.",
          deportista: "Alta en carbohidratos complejos y proteína. Timing nutricional pre/post entreno. Hidratación y electrolitos.",
          perdida_peso_medica: "Déficit calórico moderado (500 kcal), alto en proteína y fibra, bajo en grasas saturadas y azúcares. 5 comidas.",
          preoperatorio: "Fácil digestión, alto en proteína, vitaminas y minerales. Ayuno según protocolo médico.",
          postoperatorio: "Progresión: líquidos → semisólidos → sólidos. Alto en proteína para cicatrización. Evita flatulentos.",
        };

        const label = CATEGORY_LABELS[input.category] || input.category;
        const guidelines = CATEGORY_GUIDELINES[input.category] || "";
        const allergiesStr = input.allergies?.length ? `\nAlergias/intolerancias adicionales: ${input.allergies.join(", ")}` : "";
        const extraStr = input.extraNotes ? `\nNotas adicionales: ${input.extraNotes}` : "";

        const prompt = `Eres un dietista-nutricionista clínico especializado. Crea un menú de ${input.days} días para ${input.persons} persona(s) con la siguiente condición/perfil:

**Perfil:** ${label}
**Pautas nutricionales obligatorias:** ${guidelines}${allergiesStr}${extraStr}

Devuelve SOLO JSON válido con esta estructura exacta:
{
  "menuTitle": "Título descriptivo del menú",
  "targetProfile": "${label}",
  "keyNutrients": ["nutriente clave 1", "nutriente clave 2", "nutriente clave 3"],
  "avoidList": ["alimento a evitar 1", "alimento a evitar 2"],
  "generalTips": ["consejo nutricional 1", "consejo nutricional 2", "consejo nutricional 3"],
  "days": [
    {
      "day": "Lunes",
      "totalCalories": 1800,
      "meals": [
        { "name": "Desayuno", "food": "descripción detallada", "calories": 350, "protein": 15, "carbs": 45, "fat": 10, "nutritionNote": "por qué es adecuado para este perfil" },
        { "name": "Media mañana", "food": "descripción", "calories": 150, "protein": 5, "carbs": 20, "fat": 5, "nutritionNote": "" },
        { "name": "Comida", "food": "descripción detallada", "calories": 600, "protein": 35, "carbs": 70, "fat": 15, "nutritionNote": "" },
        { "name": "Merienda", "food": "descripción", "calories": 200, "protein": 8, "carbs": 25, "fat": 7, "nutritionNote": "" },
        { "name": "Cena", "food": "descripción detallada", "calories": 500, "protein": 30, "carbs": 50, "fat": 12, "nutritionNote": "" }
      ]
    }
  ]
}
REGLAS OBLIGATORIAS POR FRANJA HORARIA:
- Desayuno: tostadas, cereales, avena, yogur, fruta, huevos revueltos, smoothie, batido, pan con aceite. NUNCA: ensaladas, guisos, gazpacho, sopas, arroces, pastas, carnes asadas, pescados al horno, legumbres.
- Media mañana: snack pequeño (fruta, yogur, frutos secos, barrita). NUNCA platos completos.
- Comida: plato principal completo con proteína + carbohidrato + verdura.
- Merienda: snack pequeño. NUNCA platos completos.
- Cena: comida ligera (ensalada, crema de verduras, pescado a la plancha, tortilla, revueltos). NUNCA platos muy pesados.`;

        try {
          const response = await invokeLLM({
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          const rawContent = response.choices?.[0]?.message?.content ?? "{}";
          const content = typeof rawContent === "string" ? rawContent : "{}";
          return { menu: JSON.parse(content), category: input.category };
        } catch (err: any) {
          console.error("[SpecializedMenus] error:", err?.message || err);
          return { menu: null, error: "Error al generar el menú. El servicio de IA no está disponible en este momento." };
        }
      }),
  }),

  // ---------------------------------------------------------------------------
  // RECIPE LIKES
  // ---------------------------------------------------------------------------
  recipeLikes: router({
    toggle: protectedProcedure
      .input(z.object({ recipeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.toggleRecipeLike(ctx.user.id, input.recipeId);
      }),
    getStatus: protectedProcedure
      .input(z.object({ recipeId: z.number() }))
      .query(async ({ ctx, input }) => {
        const [liked, count] = await Promise.all([
          db.getUserRecipeLike(ctx.user.id, input.recipeId),
          db.getRecipeLikesCount(input.recipeId),
        ]);
        return { liked, likesCount: count };
      }),
    getBatch: protectedProcedure
      .input(z.object({ recipeIds: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        const [counts, likedSet] = await Promise.all([
          db.getRecipeLikesCounts(input.recipeIds),
          db.getUserRecipeLikes(ctx.user.id, input.recipeIds),
        ]);
        return { counts, liked: Array.from(likedSet) };
      }),
  }),

  // ---------------------------------------------------------------------------
  // COMPLEMENTS
  // ---------------------------------------------------------------------------
  complements: router({
    list: publicProcedure
      .input(z.object({ search: z.string().max(100).trim().optional(), category: z.string().max(50).trim().optional(), limit: z.number().int().min(1).max(200).default(100), offset: z.number().int().min(0).default(0) }).nullish())
      .query(async ({ ctx, input }) => {
        return db.listComplements({ ...(input ?? {}), userId: ctx.user?.id });
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getComplementById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        nameEs: z.string().optional(),
        category: z.enum(["bebida_caliente","bebida_fria","lacteo","proteina","fruta","snack_saludable","suplemento","otro"]).default("otro"),
        emoji: z.string().optional(),
        servingSize: z.number().default(100),
        servingUnit: z.string().default("g"),
        servingLabel: z.string().optional(),
        calories: z.number().optional(),
        proteins: z.number().optional(),
        carbs: z.number().optional(),
        fats: z.number().optional(),
        fiber: z.number().optional(),
        sugar: z.number().optional(),
        caffeine: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createComplement({ ...input, userId: ctx.user.id, isPublic: false });
      }),
    log: protectedProcedure
      .input(z.object({
        complementId: z.number(),
        quantity: z.number().default(1),
        mealType: z.enum(["desayuno","media_manana","comida","merienda","cena","otro"]).default("otro"),
        loggedAt: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const loggedAt = input.loggedAt ? new Date(input.loggedAt) : new Date();
        return db.logComplement({ userId: ctx.user.id, complementId: input.complementId, quantity: input.quantity, mealType: input.mealType, loggedAt, notes: input.notes });
      }),
    getLogs: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getComplementLogsByDate(ctx.user.id, input.date);
      }),
    deleteLog: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteComplementLog(input.id, ctx.user.id);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteUserComplement(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ── Progress & Statistics ────────────────────────────────────────────────
  progress: router({
    weightHistory: protectedProcedure
      .input(z.object({ days: z.number().int().min(7).max(365).default(30) }).nullish())
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { userMetrics } = await import("../drizzle/schema");
        const { eq, gte, and } = await import("drizzle-orm");
        const since = new Date();
        since.setDate(since.getDate() - (input?.days ?? 30));
        const sinceStr = since.toISOString().split("T")[0];
        const rows = await drizzleDb.select({
          date: userMetrics.date,
          weight: userMetrics.weight,
          bodyFat: userMetrics.bodyFat,
          muscleMass: userMetrics.muscleMass,
          bmi: userMetrics.bmi,
        })
          .from(userMetrics)
          .where(and(eq(userMetrics.userId, ctx.user.id), gte(userMetrics.date as any, sinceStr as any)))
          .orderBy(userMetrics.date);
        return rows.map(r => ({
          date: (r.date as any) instanceof Date ? (r.date as any).toISOString().split("T")[0] : String(r.date),
          weight: r.weight ? Number(r.weight) : null,
          bodyFat: r.bodyFat ? Number(r.bodyFat) : null,
          muscleMass: r.muscleMass ? Number(r.muscleMass) : null,
          bmi: r.bmi ? Number(r.bmi) : null,
        }));
      }),

    dailyNutrition: protectedProcedure
      .input(z.object({ days: z.number().int().min(7).max(90).default(30) }).nullish())
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { mealLogs } = await import("../drizzle/schema");
        const { eq, gte, and, sql } = await import("drizzle-orm");
        const since = new Date();
        since.setDate(since.getDate() - (input?.days ?? 30));
        const sinceStr = since.toISOString().split("T")[0];
        const rows = await drizzleDb
          .select({
            date: mealLogs.logDate,
            calories: sql<number>`COALESCE(SUM(${mealLogs.calories}), 0)`,
            proteins: sql<number>`COALESCE(SUM(${mealLogs.proteins}), 0)`,
            carbohydrates: sql<number>`COALESCE(SUM(${mealLogs.carbohydrates}), 0)`,
            fats: sql<number>`COALESCE(SUM(${mealLogs.fats}), 0)`,
            mealCount: sql<number>`COUNT(*)`,
          })
          .from(mealLogs)
          .where(and(eq(mealLogs.userId, ctx.user.id), gte(mealLogs.logDate as any, sinceStr as any)))
          .groupBy(mealLogs.logDate)
          .orderBy(mealLogs.logDate);
        return rows.map(r => ({
          date: (r.date as any) instanceof Date ? (r.date as any).toISOString().split("T")[0] : String(r.date),
          calories: Number(r.calories),
          proteins: Number(r.proteins),
          carbohydrates: Number(r.carbohydrates),
          fats: Number(r.fats),
          mealCount: Number(r.mealCount),
        }));
      }),

    menuAdherence: protectedProcedure
      .input(z.object({ weeks: z.number().int().min(1).max(8).default(4) }).nullish())
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { menuOrganizers, menuOrganizerDayParts } = await import("../drizzle/schema");
        const { eq, gte, and, sql } = await import("drizzle-orm");
        const since = new Date();
        since.setDate(since.getDate() - (input?.weeks ?? 4) * 7);
        const sinceStr = since.toISOString().split("T")[0];
        const menus = await drizzleDb.select({ id: menuOrganizers.id, name: menuOrganizers.name, startDate: menuOrganizers.startDate })
          .from(menuOrganizers)
          .where(and(eq(menuOrganizers.userId, ctx.user.id), gte(menuOrganizers.startDate as any, sinceStr as any)))
          .orderBy(menuOrganizers.startDate);
        const result = [];
        for (const menu of menus) {
          const [stats] = await drizzleDb.select({
            total: sql<number>`COUNT(*)`,
            completed: sql<number>`SUM(CASE WHEN ${menuOrganizerDayParts.completed} = true THEN 1 ELSE 0 END)`,
          }).from(menuOrganizerDayParts).where(eq(menuOrganizerDayParts.menuOrganizerId, menu.id));
          const total = Number(stats?.total ?? 0);
          const completed = Number(stats?.completed ?? 0);
          const label = menu.name.replace(/Semana \d+ — /, "");
          result.push({ menuId: menu.id, name: label, total, completed, adherencePct: total > 0 ? Math.round((completed / total) * 100) : 0 });
        }
        return result;
      }),

    summary: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { mealLogs, userMetrics, recipeFavorites, menuOrganizers, userPoints } = await import("../drizzle/schema");
      const { eq, desc, sql } = await import("drizzle-orm");
      const userId = ctx.user.id;
      const [logsStats] = await drizzleDb.select({
        totalLogs: sql<number>`COUNT(*)`,
        avgCalories: sql<number>`ROUND(AVG(${mealLogs.calories})::numeric, 0)`,
        avgProteins: sql<number>`ROUND(AVG(${mealLogs.proteins})::numeric, 1)`,
        avgCarbs: sql<number>`ROUND(AVG(${mealLogs.carbohydrates})::numeric, 1)`,
        avgFats: sql<number>`ROUND(AVG(${mealLogs.fats})::numeric, 1)`,
        daysWithLogs: sql<number>`COUNT(DISTINCT ${mealLogs.logDate})`,
      }).from(mealLogs).where(eq(mealLogs.userId, userId));
      const [firstMetric] = await drizzleDb.select({ weight: userMetrics.weight, date: userMetrics.date })
        .from(userMetrics).where(eq(userMetrics.userId, userId)).orderBy(userMetrics.date).limit(1);
      const [lastMetric] = await drizzleDb.select({ weight: userMetrics.weight, date: userMetrics.date })
        .from(userMetrics).where(eq(userMetrics.userId, userId)).orderBy(desc(userMetrics.date)).limit(1);
      const [favCount] = await drizzleDb.select({ n: sql<number>`COUNT(*)` })
        .from(recipeFavorites).where(eq(recipeFavorites.userId, userId));
      const [menuCount] = await drizzleDb.select({ n: sql<number>`COUNT(*)` })
        .from(menuOrganizers).where(eq(menuOrganizers.userId, userId));
      const [pts] = await drizzleDb.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
      const weightLost = firstMetric?.weight && lastMetric?.weight
        ? parseFloat((Number(firstMetric.weight) - Number(lastMetric.weight)).toFixed(1)) : 0;
      return {
        totalLogs: Number(logsStats?.totalLogs ?? 0),
        daysWithLogs: Number(logsStats?.daysWithLogs ?? 0),
        avgCalories: Number(logsStats?.avgCalories ?? 0),
        avgProteins: Number(logsStats?.avgProteins ?? 0),
        avgCarbs: Number(logsStats?.avgCarbs ?? 0),
        avgFats: Number(logsStats?.avgFats ?? 0),
        weightLost,
        startWeight: firstMetric?.weight ? Number(firstMetric.weight) : null,
        currentWeight: lastMetric?.weight ? Number(lastMetric.weight) : null,
        favoritesCount: Number(favCount?.n ?? 0),
        menusCount: Number(menuCount?.n ?? 0),
        totalPoints: pts?.totalPoints ?? 0,
        level: pts?.level ?? 1,
      };
    }),
  }),

  // ---------------------------------------------------------------------------
  // BLOG — Artículos escritos por BuddyExperts
  // ---------------------------------------------------------------------------
  blog: router({
    // Listar posts publicados (público)
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const { blogPosts, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { posts: [], total: 0 };
        const { eq, desc, and, sql } = await import("drizzle-orm");
        const conditions: any[] = [eq(blogPosts.status, "published")];
        if (input.category && input.category !== "Todos") {
          conditions.push(eq(blogPosts.category, input.category));
        }
        const posts = await drizzleDb
          .select({
            id: blogPosts.id,
            title: blogPosts.title,
            slug: blogPosts.slug,
            excerpt: blogPosts.excerpt,
            coverImageUrl: blogPosts.coverImageUrl,
            category: blogPosts.category,
            tags: blogPosts.tags,
            readTimeMinutes: blogPosts.readTimeMinutes,
            viewsCount: blogPosts.viewsCount,
            likesCount: blogPosts.likesCount,
            publishedAt: blogPosts.publishedAt,
            expertId: blogPosts.expertId,
            expertName: buddyExperts.displayName,
            expertAvatar: buddyExperts.avatarUrl,
            expertSpecialty: buddyExperts.specialty,
            expertVerified: buddyExperts.verified,
          })
          .from(blogPosts)
          .leftJoin(buddyExperts, eq(blogPosts.expertId, buddyExperts.id))
          .where(and(...conditions))
          .orderBy(desc(blogPosts.publishedAt))
          .limit(input.limit)
          .offset(input.offset);
        const [{ total }] = await drizzleDb
          .select({ total: sql<number>`COUNT(*)` })
          .from(blogPosts)
          .where(and(...conditions));
        return { posts, total: Number(total) };
      }),

    // Ver un post por slug (público, incrementa vistas)
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const { blogPosts, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return null;
        const { eq, sql } = await import("drizzle-orm");
        const [post] = await drizzleDb
          .select({
            id: blogPosts.id,
            title: blogPosts.title,
            slug: blogPosts.slug,
            excerpt: blogPosts.excerpt,
            content: blogPosts.content,
            coverImageUrl: blogPosts.coverImageUrl,
            category: blogPosts.category,
            tags: blogPosts.tags,
            readTimeMinutes: blogPosts.readTimeMinutes,
            viewsCount: blogPosts.viewsCount,
            likesCount: blogPosts.likesCount,
            publishedAt: blogPosts.publishedAt,
            updatedAt: blogPosts.updatedAt,
            expertId: blogPosts.expertId,
            expertName: buddyExperts.displayName,
            expertAvatar: buddyExperts.avatarUrl,
            expertSpecialty: buddyExperts.specialty,
            expertVerified: buddyExperts.verified,
            expertBio: buddyExperts.bio,
          })
          .from(blogPosts)
          .leftJoin(buddyExperts, eq(blogPosts.expertId, buddyExperts.id))
          .where(eq(blogPosts.slug, input.slug))
          .limit(1);
        if (!post) return null;
        // Increment view count async
        drizzleDb.update(blogPosts)
          .set({ viewsCount: sql`${blogPosts.viewsCount} + 1` })
          .where(eq(blogPosts.id, post.id)).catch(() => {});
        return post;
      }),

    // Mis posts (BuddyExpert autenticado)
    myPosts: protectedProcedure
      .input(z.object({
        status: z.enum(["draft", "published", "archived", "all"]).default("all"),
      }))
      .query(async ({ ctx, input }) => {
        const { blogPosts, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { eq, desc, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts)
          .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN", message: "Solo los BuddyExperts pueden acceder a esta sección" });
        const conditions: any[] = [eq(blogPosts.expertId, expert.id)];
        if (input.status !== "all") {
          conditions.push(eq(blogPosts.status, input.status as "draft" | "published" | "archived"));
        }
        return drizzleDb.select().from(blogPosts)
          .where(and(...conditions))
          .orderBy(desc(blogPosts.updatedAt));
      }),

    // Crear borrador (BuddyExpert)
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(5).max(256),
        excerpt: z.string().max(500).optional(),
        content: z.string().min(10),
        coverImageUrl: z.string().url().optional(),
        category: z.string().default("Nutrición"),
        tags: z.string().optional(),
        readTimeMinutes: z.number().min(1).max(60).default(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const { blogPosts, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts)
          .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN", message: "Solo los BuddyExperts pueden escribir artículos" });
        const baseSlug = input.title.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 200);
        const slug = `${baseSlug}-${Date.now().toString(36)}`;
        const [post] = await drizzleDb.insert(blogPosts).values({
          expertId: expert.id,
          title: input.title,
          slug,
          excerpt: input.excerpt,
          content: input.content,
          coverImageUrl: input.coverImageUrl,
          category: input.category,
          tags: input.tags,
          readTimeMinutes: input.readTimeMinutes,
          status: "draft",
        }).returning();
        return post;
      }),

    // Actualizar post (BuddyExpert, solo sus posts)
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(5).max(256).optional(),
        excerpt: z.string().max(500).optional(),
        content: z.string().min(10).optional(),
        coverImageUrl: z.string().url().optional().nullable(),
        category: z.string().optional(),
        tags: z.string().optional(),
        readTimeMinutes: z.number().min(1).max(60).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { blogPosts, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts)
          .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        const [post] = await drizzleDb.select().from(blogPosts)
          .where(and(eq(blogPosts.id, input.id), eq(blogPosts.expertId, expert.id))).limit(1);
        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Artículo no encontrado" });
        const { id, ...updates } = input;
        const [updated] = await drizzleDb.update(blogPosts)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(blogPosts.id, id))
          .returning();
        return updated;
      }),

    // Publicar / despublicar post
    publish: protectedProcedure
      .input(z.object({ id: z.number(), publish: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const { blogPosts, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts)
          .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        const [post] = await drizzleDb.select().from(blogPosts)
          .where(and(eq(blogPosts.id, input.id), eq(blogPosts.expertId, expert.id))).limit(1);
        if (!post) throw new TRPCError({ code: "NOT_FOUND" });
        const [updated] = await drizzleDb.update(blogPosts)
          .set({
            status: input.publish ? "published" : "draft",
            publishedAt: input.publish ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(blogPosts.id, input.id))
          .returning();
        return updated;
      }),

    // Eliminar post
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { blogPosts, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts)
          .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        await drizzleDb.delete(blogPosts)
          .where(and(eq(blogPosts.id, input.id), eq(blogPosts.expertId, expert.id)));
        return { success: true };
      }),

    // Subir imagen de portada
    uploadCover: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts)
          .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const key = `blog-covers/${expert.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
    // Artículos relacionados (misma categoría, excluye el actual)
    getRelated: publicProcedure
      .input(z.object({
        slug: z.string(),
        category: z.string(),
        limit: z.number().min(1).max(6).default(3),
      }))
      .query(async ({ input }) => {
        const { blogPosts, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { eq, ne, and, desc } = await import("drizzle-orm");
        return drizzleDb
          .select({
            id: blogPosts.id,
            title: blogPosts.title,
            slug: blogPosts.slug,
            excerpt: blogPosts.excerpt,
            coverImageUrl: blogPosts.coverImageUrl,
            category: blogPosts.category,
            readTimeMinutes: blogPosts.readTimeMinutes,
            publishedAt: blogPosts.publishedAt,
            expertName: buddyExperts.displayName,
            expertAvatar: buddyExperts.avatarUrl,
          })
          .from(blogPosts)
          .leftJoin(buddyExperts, eq(blogPosts.expertId, buddyExperts.id))
          .where(and(
            eq(blogPosts.status, "published"),
            eq(blogPosts.category, input.category),
            ne(blogPosts.slug, input.slug),
          ))
          .orderBy(desc(blogPosts.publishedAt))
          .limit(input.limit);
      }),
  }),

  // ---------------------------------------------------------------------------
  // EXPERT CLIENT PLANS — PDFs personalizados + generación IA de menú
  // ---------------------------------------------------------------------------
  expertPlans: router({
    myPlans: protectedProcedure
      .input(z.object({ status: z.enum(["draft", "active", "archived", "all"]).default("all") }))
      .query(async ({ ctx, input }) => {
        const { expertClientPlans, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { eq, desc, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN", message: "Solo los BuddyExperts pueden acceder" });
        const conditions: any[] = [eq(expertClientPlans.expertId, expert.id)];
        if (input.status !== "all") conditions.push(eq(expertClientPlans.status, input.status as "draft" | "active" | "archived"));
        return drizzleDb.select().from(expertClientPlans).where(and(...conditions)).orderBy(desc(expertClientPlans.updatedAt));
      }),

    myClientPlans: protectedProcedure
      .query(async ({ ctx }) => {
        const { expertClientPlans, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { eq } = await import("drizzle-orm");
        return drizzleDb.select({
          id: expertClientPlans.id,
          title: expertClientPlans.title,
          description: expertClientPlans.description,
          pdfUrl: expertClientPlans.pdfUrl,
          pdfFileName: expertClientPlans.pdfFileName,
          status: expertClientPlans.status,
          aiGeneratedMenu: expertClientPlans.aiGeneratedMenu,
          aiGeneratedShoppingList: expertClientPlans.aiGeneratedShoppingList,
          aiGeneratedAt: expertClientPlans.aiGeneratedAt,
          notes: expertClientPlans.notes,
          weekNumber: expertClientPlans.weekNumber,
          year: expertClientPlans.year,
          createdAt: expertClientPlans.createdAt,
          expertName: buddyExperts.displayName,
          expertAvatar: buddyExperts.avatarUrl,
          expertSpecialty: buddyExperts.specialty,
        }).from(expertClientPlans)
          .leftJoin(buddyExperts, eq(expertClientPlans.expertId, buddyExperts.id))
          .where(eq(expertClientPlans.clientUserId, ctx.user.id));
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(3).max(256),
        description: z.string().optional(),
        clientUserId: z.number().optional(),
        isTemplate: z.boolean().default(false),
        weekNumber: z.number().optional(),
        year: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { expertClientPlans, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        const [plan] = await drizzleDb.insert(expertClientPlans).values({
          expertId: expert.id,
          title: input.title,
          description: input.description,
          clientUserId: input.clientUserId,
          isTemplate: input.isTemplate,
          weekNumber: input.weekNumber,
          year: input.year,
          notes: input.notes,
          status: "draft",
        }).returning();
        return plan;
      }),

    uploadPdf: protectedProcedure
      .input(z.object({ planId: z.number(), base64: z.string(), fileName: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { expertClientPlans, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        const [plan] = await drizzleDb.select().from(expertClientPlans)
          .where(and(eq(expertClientPlans.id, input.planId), eq(expertClientPlans.expertId, expert.id))).limit(1);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND" });
        const buffer = Buffer.from(input.base64, "base64");
        const key = `expert-plans/${expert.id}/${input.planId}-${Date.now()}.pdf`;
        const { url } = await storagePut(key, buffer, "application/pdf");
        const [updated] = await drizzleDb.update(expertClientPlans)
          .set({ pdfUrl: url, pdfKey: key, pdfFileName: input.fileName, updatedAt: new Date() })
          .where(eq(expertClientPlans.id, input.planId)).returning();
        return updated;
      }),

    assignToClient: protectedProcedure
      .input(z.object({ planId: z.number(), clientUserId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { expertClientPlans, buddyExperts, users } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        const [plan] = await drizzleDb.select().from(expertClientPlans)
          .where(and(eq(expertClientPlans.id, input.planId), eq(expertClientPlans.expertId, expert.id))).limit(1);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND" });
        const [updated] = await drizzleDb.update(expertClientPlans)
          .set({ clientUserId: input.clientUserId, status: "active", updatedAt: new Date() })
          .where(eq(expertClientPlans.id, input.planId)).returning();
        // ── Send notification email to the assigned client ──────────────────
        try {
          const [clientUser] = await drizzleDb.select({ id: users.id, name: users.name, email: users.email })
            .from(users).where(eq(users.id, input.clientUserId)).limit(1);
          if (clientUser?.email) {
            const { sendPlanAssignedEmail } = await import("./email.js");
            await sendPlanAssignedEmail({
              clientEmail: clientUser.email,
              clientName: clientUser.name ?? clientUser.email,
              expertName: expert.displayName ?? ctx.user.name ?? "Tu BuddyExpert",
              expertSpecialty: expert.specialty ?? null,
              planTitle: plan.title,
              planDescription: plan.description ?? null,
              planWeekNumber: plan.weekNumber ?? null,
              planYear: plan.year ?? null,
              planNotes: plan.notes ?? null,
              pdfUrl: plan.pdfUrl ?? null,
            });
          }
        } catch (emailErr) {
          // Email failure must not block the assignment
          console.error("[Email] Failed to send plan assignment notification:", emailErr);
        }
        return updated;
      }),

    generateAiMenu: protectedProcedure
      .input(z.object({
        planId: z.number(),
        userPreferences: z.object({
          allergies: z.string().optional(),
          restrictions: z.string().optional(),
          dislikedFoods: z.string().optional(),
          cookingTime: z.string().optional(),
          persons: z.number().default(1),
          notes: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { expertClientPlans, buddyExperts, userProfiles } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq } = await import("drizzle-orm");
        const plan = await drizzleDb.select().from(expertClientPlans)
          .where(eq(expertClientPlans.id, input.planId)).limit(1).then(r => r[0]);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND" });
        const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        const isExpertOwner = expert && expert.id === plan.expertId;
        const isAssignedClient = plan.clientUserId === ctx.user.id;
        if (!isExpertOwner && !isAssignedClient) throw new TRPCError({ code: "FORBIDDEN" });
        if (!plan.pdfUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "Sube el PDF del plan primero." });
        // P1 fix: si quien llama es el experto, usar el perfil del paciente (clientUserId), no del profesional
        const profileUserId = isExpertOwner && plan.clientUserId ? plan.clientUserId : ctx.user.id;
        const [profile] = await drizzleDb.select().from(userProfiles).where(eq(userProfiles.userId, profileUserId)).limit(1);
        const prefs = input.userPreferences;
        const profileCtx = profile ? `Objetivo: ${profile.mainGoal ?? "no especificado"}, Calorías/día: ${profile.dailyCalorieGoal ?? "no especificado"} kcal, Alergias: ${profile.menuAllergies ?? "ninguna"}, Dieta: ${profile.menuDietType ?? "omnívora"}, Personas: ${profile.menuPersons ?? 1}` : "";
        const extraCtx = prefs ? `Alergias extra: ${prefs.allergies ?? "ninguna"}, Restricciones: ${prefs.restrictions ?? "ninguna"}, No le gusta: ${prefs.dislikedFoods ?? "ninguno"}, Tiempo cocina: ${prefs.cookingTime ?? "no especificado"}, Personas: ${prefs.persons ?? 1}, Notas: ${prefs.notes ?? "ninguna"}` : "";
        const systemPrompt = `Eres un nutricionista experto. Lee el plan nutricional en PDF adjunto y genera basándote en sus directrices y las preferencias del usuario:
1. Un menú semanal completo (7 días: desayuno, media_manana, comida, merienda, cena) con nombres de platos REALES y DETALLADOS en español (ej: "Tortilla de espinacas con queso fresco y tomate cherry" en lugar de solo "tortilla").
2. Una lista de la compra organizada por categorías.

Devuelve ÚNICAMENTE JSON válido con esta estructura:
{"menu":{"lunes":{"desayuno":"...","media_manana":"...","comida":"...","merienda":"...","cena":"..."},"martes":{...},"miercoles":{...},"jueves":{...},"viernes":{...},"sabado":{...},"domingo":{...}},"shopping_list":{"frutas_verduras":["..."],"proteinas":["..."],"lacteos":["..."],"cereales_pasta":["..."],"legumbres":["..."],"otros":["..."]},"notes":"..."}`;
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: [
                { type: "text", text: `Perfil del usuario: ${profileCtx}\n${extraCtx}\nPDF del plan: ${plan.pdfUrl}` },
                { type: "file_url", file_url: { url: plan.pdfUrl, mime_type: "application/pdf" } }
              ] as any}
            ],
          });
          const content = response?.choices?.[0]?.message?.content;
          if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La IA no generó respuesta" });
          let parsed: any;
          try { parsed = typeof content === "string" ? JSON.parse(content) : content; }
          catch { throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al procesar la respuesta de la IA" }); }
          const [updated] = await drizzleDb.update(expertClientPlans)
            .set({ aiGeneratedMenu: JSON.stringify(parsed.menu), aiGeneratedShoppingList: JSON.stringify(parsed.shopping_list), aiGeneratedAt: new Date(), updatedAt: new Date() })
            .where(eq(expertClientPlans.id, input.planId)).returning();
          return { menu: parsed.menu, shoppingList: parsed.shopping_list, notes: parsed.notes, plan: updated };
        } catch (err: any) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al generar el menú desde el PDF. Inténtalo de nuevo." });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { expertClientPlans, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        await drizzleDb.delete(expertClientPlans)
          .where(and(eq(expertClientPlans.id, input.id), eq(expertClientPlans.expertId, expert.id)));
        return { success: true };
      }),
    searchClientByEmail: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ ctx, input }) => {
        const { buddyExperts, users } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN", message: "Solo los BuddyExperts pueden buscar clientes" });
        const [user] = await drizzleDb.select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.imageUrl })
          .from(users).where(eq(users.email, input.email)).limit(1);
        return user ?? null;
      }),
    updateStatus: protectedProcedure
      .input(z.object({ planId: z.number(), status: z.enum(["draft", "active", "archived"]) }))
      .mutation(async ({ ctx, input }) => {
        const { expertClientPlans, buddyExperts } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        const [updated] = await drizzleDb.update(expertClientPlans)
          .set({ status: input.status, updatedAt: new Date() })
          .where(and(eq(expertClientPlans.id, input.planId), eq(expertClientPlans.expertId, expert.id)))
          .returning();
        if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
        return updated;
      }),
  }),

  // ===========================================================================
  // HEALTH DATA — Apple Health & Google Health Connect Integration
  // ===========================================================================
  health: router({
    // Get user's health integration settings
    getIntegration: protectedProcedure.query(async ({ ctx }) => {
      const { healthIntegrations } = await import("../drizzle/schema.js");
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { eq } = await import("drizzle-orm");
      const [integration] = await drizzleDb.select().from(healthIntegrations).where(eq(healthIntegrations.userId, ctx.user.id)).limit(1);
      return integration ?? null;
    }),

    // Update health integration settings
    updateIntegration: protectedProcedure
      .input(z.object({
        appleHealthEnabled: z.boolean().optional(),
        googleHealthConnectEnabled: z.boolean().optional(),
        garminEnabled: z.boolean().optional(),
        fitbitEnabled: z.boolean().optional(),
        samsungHealthEnabled: z.boolean().optional(),
        syncSteps: z.boolean().optional(),
        syncCalories: z.boolean().optional(),
        syncWeight: z.boolean().optional(),
        syncHeartRate: z.boolean().optional(),
        syncSleep: z.boolean().optional(),
        syncBloodGlucose: z.boolean().optional(),
        syncOxygen: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { healthIntegrations } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq } = await import("drizzle-orm");
        const [existing] = await drizzleDb.select().from(healthIntegrations).where(eq(healthIntegrations.userId, ctx.user.id)).limit(1);
        if (existing) {
          const [updated] = await drizzleDb.update(healthIntegrations)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(healthIntegrations.userId, ctx.user.id))
            .returning();
          return updated;
        } else {
          const [created] = await drizzleDb.insert(healthIntegrations)
            .values({ userId: ctx.user.id, ...input })
            .returning();
          return created;
        }
      }),

    // Sync daily health data from mobile app
    syncDailyData: protectedProcedure
      .input(z.object({
        date: z.string(),
        source: z.enum(["apple_health", "google_health_connect", "manual", "garmin", "fitbit", "samsung_health", "other"]).default("manual"),
        steps: z.number().int().optional(),
        caloriesBurned: z.number().int().optional(),
        activeMinutes: z.number().int().optional(),
        distanceKm: z.number().optional(),
        floorsClimbed: z.number().int().optional(),
        weightKg: z.number().optional(),
        heartRateAvg: z.number().int().optional(),
        heartRateResting: z.number().int().optional(),
        heartRateMax: z.number().int().optional(),
        heartRateMin: z.number().int().optional(),
        hrv: z.number().optional(),
        sleepDurationMin: z.number().int().optional(),
        sleepDeepMin: z.number().int().optional(),
        sleepRemMin: z.number().int().optional(),
        sleepLightMin: z.number().int().optional(),
        sleepScore: z.number().int().optional(),
        caloriesConsumed: z.number().int().optional(),
        waterMl: z.number().int().optional(),
        bloodGlucose: z.number().optional(),
        oxygenSaturation: z.number().optional(),
        stressLevel: z.number().int().optional(),
        vo2Max: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { healthDailyData, healthIntegrations } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq, and } = await import("drizzle-orm");
        const { date, ...data } = input;
        const [existing] = await drizzleDb.select({ id: healthDailyData.id })
          .from(healthDailyData)
          .where(and(eq(healthDailyData.userId, ctx.user.id), eq(healthDailyData.date, date)))
          .limit(1);
        let result;
        if (existing) {
          const [updated] = await drizzleDb.update(healthDailyData)
            .set({ ...data, syncedAt: new Date(), updatedAt: new Date() })
            .where(eq(healthDailyData.id, existing.id))
            .returning();
          result = updated;
        } else {
          const [created] = await drizzleDb.insert(healthDailyData)
            .values({ userId: ctx.user.id, date, ...data, syncedAt: new Date() })
            .returning();
          result = created;
        }
        // Update lastSyncAt
        await drizzleDb.update(healthIntegrations).set({ lastSyncAt: new Date() }).where(eq(healthIntegrations.userId, ctx.user.id)).catch(() => {});
        return result;
      }),

    // Batch sync multiple days
    syncBatch: protectedProcedure
      .input(z.object({
        records: z.array(z.object({
          date: z.string(),
          source: z.enum(["apple_health", "google_health_connect", "manual", "garmin", "fitbit", "samsung_health", "other"]).default("manual"),
          steps: z.number().int().optional(),
          caloriesBurned: z.number().int().optional(),
          activeMinutes: z.number().int().optional(),
          distanceKm: z.number().optional(),
          floorsClimbed: z.number().int().optional(),
          weightKg: z.number().optional(),
          heartRateAvg: z.number().int().optional(),
          heartRateResting: z.number().int().optional(),
          heartRateMax: z.number().int().optional(),
          heartRateMin: z.number().int().optional(),
          hrv: z.number().optional(),
          sleepDurationMin: z.number().int().optional(),
          sleepDeepMin: z.number().int().optional(),
          sleepRemMin: z.number().int().optional(),
          sleepLightMin: z.number().int().optional(),
          sleepScore: z.number().int().optional(),
          caloriesConsumed: z.number().int().optional(),
          waterMl: z.number().int().optional(),
          bloodGlucose: z.number().optional(),
          oxygenSaturation: z.number().optional(),
          stressLevel: z.number().int().optional(),
          vo2Max: z.number().optional(),
        })).max(90),
      }))
      .mutation(async ({ ctx, input }) => {
        const { healthDailyData, healthIntegrations } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq, and, inArray } = await import("drizzle-orm");
        const dates = input.records.map(r => r.date);
        const existing = await drizzleDb.select({ id: healthDailyData.id, date: healthDailyData.date })
          .from(healthDailyData)
          .where(and(eq(healthDailyData.userId, ctx.user.id), inArray(healthDailyData.date, dates)));
        const existingDates = new Set(existing.map(e => e.date));
        const toInsert = input.records.filter(r => !existingDates.has(r.date)).map(r => ({ userId: ctx.user.id, ...r, syncedAt: new Date() }));
        const toUpdate = input.records.filter(r => existingDates.has(r.date));
        let inserted = 0, updated = 0;
        if (toInsert.length > 0) {
          await drizzleDb.insert(healthDailyData).values(toInsert);
          inserted = toInsert.length;
        }
        for (const record of toUpdate) {
          const { date, ...data } = record;
          await drizzleDb.update(healthDailyData)
            .set({ ...data, syncedAt: new Date(), updatedAt: new Date() })
            .where(and(eq(healthDailyData.userId, ctx.user.id), eq(healthDailyData.date, date)));
          updated++;
        }
        await drizzleDb.update(healthIntegrations).set({ lastSyncAt: new Date() }).where(eq(healthIntegrations.userId, ctx.user.id)).catch(() => {});
        return { inserted, updated, total: inserted + updated };
      }),

    // Get daily health data for a date range
    getDailyData: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const { healthDailyData } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { eq, and, gte, lte, desc } = await import("drizzle-orm");
        return drizzleDb.select().from(healthDailyData)
          .where(and(
            eq(healthDailyData.userId, ctx.user.id),
            gte(healthDailyData.date, input.startDate),
            lte(healthDailyData.date, input.endDate)
          ))
          .orderBy(desc(healthDailyData.date));
      }),

    // Get today's health summary
    getTodaySummary: protectedProcedure.query(async ({ ctx }) => {
      const { healthDailyData } = await import("../drizzle/schema.js");
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { eq, and } = await import("drizzle-orm");
      const today = new Date().toISOString().split("T")[0];
      const [record] = await drizzleDb.select().from(healthDailyData)
        .where(and(eq(healthDailyData.userId, ctx.user.id), eq(healthDailyData.date, today)))
        .limit(1);
      return record ?? null;
    }),

    // Get weekly health summary (last 7 days averages)
    getWeeklySummary: protectedProcedure.query(async ({ ctx }) => {
      const { healthDailyData } = await import("../drizzle/schema.js");
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { eq, and, gte, desc } = await import("drizzle-orm");
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString().split("T")[0];
      const records = await drizzleDb.select().from(healthDailyData)
        .where(and(eq(healthDailyData.userId, ctx.user.id), gte(healthDailyData.date, startDate)))
        .orderBy(desc(healthDailyData.date));
      if (records.length === 0) return null;
      const avg = (arr: (number | null | undefined)[]) => {
        const valid = arr.filter(v => v != null) as number[];
        return valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
      };
      return {
        days: records.length,
        avgSteps: avg(records.map(r => r.steps)),
        avgCaloriesBurned: avg(records.map(r => r.caloriesBurned)),
        avgActiveMinutes: avg(records.map(r => r.activeMinutes)),
        avgHeartRate: avg(records.map(r => r.heartRateAvg)),
        avgSleepMin: avg(records.map(r => r.sleepDurationMin)),
        avgSleepScore: avg(records.map(r => r.sleepScore)),
        avgWaterMl: avg(records.map(r => r.waterMl)),
        totalDistanceKm: records.reduce((sum, r) => sum + (r.distanceKm ?? 0), 0),
        records,
      };
    }),

    // Add individual metric reading
    addMetricReading: protectedProcedure
      .input(z.object({
        metricType: z.enum(["steps", "calories_burned", "calories_consumed", "weight", "heart_rate", "heart_rate_resting", "sleep_duration", "sleep_deep", "sleep_rem", "sleep_light", "blood_pressure_systolic", "blood_pressure_diastolic", "blood_glucose", "oxygen_saturation", "body_temperature", "respiratory_rate", "active_minutes", "distance_km", "floors_climbed", "water_ml", "stress_level", "vo2_max", "hrv"]),
        value: z.number(),
        unit: z.string().max(32),
        source: z.enum(["apple_health", "google_health_connect", "manual", "garmin", "fitbit", "samsung_health", "other"]).default("manual"),
        recordedAt: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { healthMetricReadings } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [created] = await drizzleDb.insert(healthMetricReadings)
          .values({ userId: ctx.user.id, ...input, recordedAt: new Date(input.recordedAt) })
          .returning();
        return created;
      }),

    // Get metric readings for a specific type and date range
    getMetricReadings: protectedProcedure
      .input(z.object({
        metricType: z.enum(["steps", "calories_burned", "calories_consumed", "weight", "heart_rate", "heart_rate_resting", "sleep_duration", "sleep_deep", "sleep_rem", "sleep_light", "blood_pressure_systolic", "blood_pressure_diastolic", "blood_glucose", "oxygen_saturation", "body_temperature", "respiratory_rate", "active_minutes", "distance_km", "floors_climbed", "water_ml", "stress_level", "vo2_max", "hrv"]),
        startDate: z.string(),
        endDate: z.string(),
        limit: z.number().int().max(500).default(100),
      }))
      .query(async ({ ctx, input }) => {
        const { healthMetricReadings } = await import("../drizzle/schema.js");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { eq, and, gte, lte, desc } = await import("drizzle-orm");
        return drizzleDb.select().from(healthMetricReadings)
          .where(and(
            eq(healthMetricReadings.userId, ctx.user.id),
            eq(healthMetricReadings.metricType, input.metricType),
            gte(healthMetricReadings.recordedAt, new Date(input.startDate)),
            lte(healthMetricReadings.recordedAt, new Date(input.endDate))
          ))
          .orderBy(desc(healthMetricReadings.recordedAt))
          .limit(input.limit);
      }),
  }),

  // ===========================================================================
  // USAGE ANALYTICS — Admin panel usage statistics and heatmap
  // ===========================================================================
  usageAnalytics: router({
    // Overview: key metrics counts
    getOverview: protectedProcedure.query(async ({ ctx }) => {
      if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sql: sqlTag, count, gte, and } = await import("drizzle-orm");
      const { users, menuOrganizers, mealLogs, shoppingLists, aiFeedback,
        userFavoriteRecipes, complementLogs, userMetrics, recipeLikes,
        userExpertPlanCopies, buddyApplications } = await import("../drizzle/schema.js");

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [totalUsers] = await drizzleDb.select({ count: count() }).from(users);
      const [newUsers30d] = await drizzleDb.select({ count: count() }).from(users)
        .where(gte(users.createdAt, thirtyDaysAgo));
      const [totalMenus] = await drizzleDb.select({ count: count() }).from(menuOrganizers);
      const [aiMenus] = await drizzleDb.select({ count: count() }).from(menuOrganizers)
        .where(sqlTag`${menuOrganizers.generatedByAI} = true`);
      const [totalMealLogs] = await drizzleDb.select({ count: count() }).from(mealLogs);
      const [aiPhotoLogs] = await drizzleDb.select({ count: count() }).from(mealLogs)
        .where(sqlTag`${mealLogs.photoUrl} IS NOT NULL`);
      const [totalShoppingLists] = await drizzleDb.select({ count: count() }).from(shoppingLists);
      const [aiShoppingLists] = await drizzleDb.select({ count: count() }).from(shoppingLists)
        .where(sqlTag`${shoppingLists.generatedByAI} = true`);
      const [totalAiFeedback] = await drizzleDb.select({ count: count() }).from(aiFeedback);
      const [totalFavorites] = await drizzleDb.select({ count: count() }).from(userFavoriteRecipes);
      const [totalComplements] = await drizzleDb.select({ count: count() }).from(complementLogs);
      const [totalBodyMetrics] = await drizzleDb.select({ count: count() }).from(userMetrics);
      const [totalRecipeLikes] = await drizzleDb.select({ count: count() }).from(recipeLikes);
      const [totalExpertCopies] = await drizzleDb.select({ count: count() }).from(userExpertPlanCopies);
      const [pendingApplications] = await drizzleDb.select({ count: count() }).from(buddyApplications)
        .where(sqlTag`${buddyApplications.status} = 'pending'`);

      return {
        users: { total: Number(totalUsers.count), new30d: Number(newUsers30d.count) },
        menus: { total: Number(totalMenus.count), aiGenerated: Number(aiMenus.count) },
        mealLogs: { total: Number(totalMealLogs.count), aiPhoto: Number(aiPhotoLogs.count) },
        shoppingLists: { total: Number(totalShoppingLists.count), aiGenerated: Number(aiShoppingLists.count) },
        aiFeedback: { total: Number(totalAiFeedback.count) },
        favorites: Number(totalFavorites.count),
        complements: Number(totalComplements.count),
        bodyMetrics: Number(totalBodyMetrics.count),
        recipeLikes: Number(totalRecipeLikes.count),
        expertCopies: Number(totalExpertCopies.count),
        pendingApplications: Number(pendingApplications.count),
      };
    }),

    // Feature heatmap: usage counts per feature
    getFeatureHeatmap: protectedProcedure.query(async ({ ctx }) => {
      if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sql: sqlTag, count, eq } = await import("drizzle-orm");
      const { menuOrganizers, mealLogs, shoppingLists, aiFeedback,
        userFavoriteRecipes, complementLogs, userMetrics, recipeLikes,
        userExpertPlanCopies, menuComplements, pantryStock, featureEvents } = await import("../drizzle/schema.js");

      const [manualMenus] = await drizzleDb.select({ count: count() }).from(menuOrganizers)
        .where(sqlTag`${menuOrganizers.generatedByAI} = false OR ${menuOrganizers.generatedByAI} IS NULL`);
      const [aiMenus] = await drizzleDb.select({ count: count() }).from(menuOrganizers)
        .where(sqlTag`${menuOrganizers.generatedByAI} = true`);
      const [manualFoodLog] = await drizzleDb.select({ count: count() }).from(mealLogs)
        .where(sqlTag`${mealLogs.photoUrl} IS NULL`);
      const [aiPhotoLog] = await drizzleDb.select({ count: count() }).from(mealLogs)
        .where(sqlTag`${mealLogs.photoUrl} IS NOT NULL`);
      const [shoppingListCount] = await drizzleDb.select({ count: count() }).from(shoppingLists);
      const [aiShoppingCount] = await drizzleDb.select({ count: count() }).from(shoppingLists)
        .where(sqlTag`${shoppingLists.generatedByAI} = true`);
      const [favRecipes] = await drizzleDb.select({ count: count() }).from(userFavoriteRecipes);
      const [complementCount] = await drizzleDb.select({ count: count() }).from(complementLogs);
      const [bodyMetricsCount] = await drizzleDb.select({ count: count() }).from(userMetrics);
      const [recipeLikesCount] = await drizzleDb.select({ count: count() }).from(recipeLikes);
      const [expertCopiesCount] = await drizzleDb.select({ count: count() }).from(userExpertPlanCopies);
      const [pantryCount] = await drizzleDb.select({ count: count() }).from(pantryStock);
      const [menuComplementCount] = await drizzleDb.select({ count: count() }).from(menuComplements);
      const [aiFeedbackCount] = await drizzleDb.select({ count: count() }).from(aiFeedback);
      const [barcodeCount] = await drizzleDb.select({ count: count() }).from(featureEvents)
        .where(eq(featureEvents.feature, "barcode_scan"));

      return [
        { feature: "Diario alimentario (manual)", category: "Diario", count: Number(manualFoodLog.count), icon: "📝" },
        { feature: "Análisis IA de foto", category: "IA", count: Number(aiPhotoLog.count), icon: "📷" },
        { feature: "Escáner código de barras", category: "Escáner", count: Number(barcodeCount.count), icon: "📷" },
        { feature: "Menú manual", category: "Menús", count: Number(manualMenus.count), icon: "📅" },
        { feature: "Menú generado por IA", category: "IA", count: Number(aiMenus.count), icon: "🤖" },
        { feature: "Lista de compra", category: "Compras", count: Number(shoppingListCount.count), icon: "🛒" },
        { feature: "Lista de compra con IA", category: "IA", count: Number(aiShoppingCount.count), icon: "🛒" },
        { feature: "Recetas favoritas", category: "Recetas", count: Number(favRecipes.count), icon: "❤️" },
        { feature: "Me gusta en recetas", category: "Recetas", count: Number(recipeLikesCount.count), icon: "👍" },
        { feature: "Complementos diarios", category: "Diario", count: Number(complementCount.count), icon: "☕" },
        { feature: "Métricas corporales", category: "Salud", count: Number(bodyMetricsCount.count), icon: "⚖️" },
        { feature: "Planes de expertos copiados", category: "Expertos", count: Number(expertCopiesCount.count), icon: "👨‍⚕️" },
        { feature: "Inventario/Despensa", category: "Inventario", count: Number(pantryCount.count), icon: "🏪" },
        { feature: "Complementos en menús", category: "Menús", count: Number(menuComplementCount.count), icon: "🍵" },
        { feature: "Feedback IA (valoraciones)", category: "IA", count: Number(aiFeedbackCount.count), icon: "⭐" },
      ];
    }),

    // Daily activity: registrations and meal logs per day (last 30 days)
    getDailyActivity: protectedProcedure.query(async ({ ctx }) => {
      if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sql: sqlTag, gte, count } = await import("drizzle-orm");
      const { users, mealLogs, menuOrganizers } = await import("../drizzle/schema.js");

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const usersByDay = await drizzleDb
        .select({
          date: sqlTag<string>`DATE(${users.createdAt})`,
          count: count(),
        })
        .from(users)
        .where(gte(users.createdAt, thirtyDaysAgo))
        .groupBy(sqlTag`DATE(${users.createdAt})`)
        .orderBy(sqlTag`DATE(${users.createdAt})`);

      const mealLogsByDay = await drizzleDb
        .select({
          date: sqlTag<string>`${mealLogs.logDate}`,
          count: count(),
        })
        .from(mealLogs)
        .where(gte(mealLogs.createdAt, thirtyDaysAgo))
        .groupBy(mealLogs.logDate)
        .orderBy(mealLogs.logDate);

      const menusByDay = await drizzleDb
        .select({
          date: sqlTag<string>`DATE(${menuOrganizers.createdAt})`,
          count: count(),
        })
        .from(menuOrganizers)
        .where(gte(menuOrganizers.createdAt, thirtyDaysAgo))
        .groupBy(sqlTag`DATE(${menuOrganizers.createdAt})`)
        .orderBy(sqlTag`DATE(${menuOrganizers.createdAt})`);

      return { usersByDay, mealLogsByDay, menusByDay };
    }),

    // AI usage breakdown
    getAIUsage: protectedProcedure.query(async ({ ctx }) => {
      if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sql: sqlTag, count, avg } = await import("drizzle-orm");
      const { aiFeedback, menuOrganizers, mealLogs, shoppingLists } = await import("../drizzle/schema.js");

      const [feedbackStats] = await drizzleDb.select({
        total: count(),
        avgRating: avg(aiFeedback.rating),
        accurate: count(sqlTag`CASE WHEN ${aiFeedback.accurate} = true THEN 1 END`),
      }).from(aiFeedback);

      const [aiMenuTotal] = await drizzleDb.select({ count: count() }).from(menuOrganizers)
        .where(sqlTag`${menuOrganizers.generatedByAI} = true`);
      const [aiPhotoTotal] = await drizzleDb.select({ count: count() }).from(mealLogs)
        .where(sqlTag`${mealLogs.photoUrl} IS NOT NULL`);
      const [aiShoppingTotal] = await drizzleDb.select({ count: count() }).from(shoppingLists)
        .where(sqlTag`${shoppingLists.generatedByAI} = true`);

      return {
        feedback: {
          total: Number(feedbackStats.total),
          avgRating: feedbackStats.avgRating ? Number(Number(feedbackStats.avgRating).toFixed(1)) : 0,
          accurateCount: Number(feedbackStats.accurate),
          accuracyPct: feedbackStats.total > 0
            ? Math.round((Number(feedbackStats.accurate) / Number(feedbackStats.total)) * 100)
            : 0,
        },
        aiMenus: Number(aiMenuTotal.count),
        aiPhotoAnalysis: Number(aiPhotoTotal.count),
        aiShoppingLists: Number(aiShoppingTotal.count),
        totalAIActions: Number(aiMenuTotal.count) + Number(aiPhotoTotal.count) + Number(aiShoppingTotal.count),
      };
    }),

    // Top users by activity
    getTopUsers: protectedProcedure.query(async ({ ctx }) => {
      if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sql: sqlTag, count, desc, eq } = await import("drizzle-orm");
      const { mealLogs, users } = await import("../drizzle/schema.js");

      const topUsers = await drizzleDb
        .select({
          userId: mealLogs.userId,
          name: users.name,
          email: users.email,
          logCount: count(),
        })
        .from(mealLogs)
        .leftJoin(users, eq(mealLogs.userId, users.id))
        .groupBy(mealLogs.userId, users.name, users.email)
        .orderBy(desc(count()))
        .limit(10);

      return topUsers.map(u => ({
        userId: u.userId,
        name: u.name ?? "Sin nombre",
        email: u.email ?? "",
        logCount: Number(u.logCount),
      }));
    }),
  }),

  // ===========================================================================
  // CONSUM INTEGRATION
  // ===========================================================================
  consum: router({
    searchProducts: publicProcedure
      .input(z.object({
        q: z.string().max(100).trim().optional(),
        category: z.string().max(50).trim().optional(),
        limit: z.number().int().min(1).max(100).optional(),
        priceMin: z.number().min(0).optional(),
        priceMax: z.number().min(0).optional(),
        sortBy: z.enum(["relevance", "price_asc", "price_desc"]).optional(),
      }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { consumProducts } = await import("../drizzle/schema");
        const { like, eq, and, or, desc, asc, gte, lte, isNotNull, sql: sqlExpr } = await import("drizzle-orm");
        const q = input.q?.trim();
        const conditions: any[] = [];
        if (q && q.length > 0) {
          conditions.push(or(
            like(consumProducts.name, `%${q}%`),
            like(consumProducts.category, `%${q}%`),
            like(consumProducts.brand, `%${q}%`),
          ));
        }
        if (input.category) conditions.push(eq(consumProducts.category, input.category));
        if (input.priceMin !== undefined) conditions.push(and(isNotNull(consumProducts.price), gte(consumProducts.price, input.priceMin)));
        if (input.priceMax !== undefined) conditions.push(and(isNotNull(consumProducts.price), lte(consumProducts.price, input.priceMax)));
        const sortBy = input.sortBy ?? "relevance";
        const orderClause = sortBy === "price_asc"
          ? asc(consumProducts.price)
          : sortBy === "price_desc"
          ? desc(consumProducts.price)
          : desc(consumProducts.name); // relevance: alphabetical as proxy
        const rows = await drizzleDb
          .select()
          .from(consumProducts)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(orderClause)
          .limit(input.limit ?? 48);
        return rows;
      }),
    categories: publicProcedure.query(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { sql } = await import("drizzle-orm");
      const result = await drizzleDb.execute(
        sql`SELECT category, COUNT(*) as count FROM consum_products WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC LIMIT 30`
      );
      const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
      return rows as Array<{ category: string; count: number }>;
    }),
    priceRange: publicProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { min: 0, max: 50 };
        const { sql } = await import("drizzle-orm");
        const catClause = input.category ? `AND category = '${input.category.replace(/'/g, "''")}'` : "";
        const result = await drizzleDb.execute(
          sql`SELECT MIN(price) as min_price, MAX(price) as max_price FROM consum_products WHERE price IS NOT NULL ${sql.raw(catClause)}`
        );
        const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
        const row = rows[0] ?? {};
        return {
          min: Math.floor(Number(row.min_price ?? 0)),
          max: Math.ceil(Number(row.max_price ?? 50)),
        };
      }),
    byCategory: publicProcedure
      .input(z.object({
        category: z.string(),
        limit: z.number().optional(),
        priceMin: z.number().min(0).optional(),
        priceMax: z.number().min(0).optional(),
        sortBy: z.enum(["relevance", "price_asc", "price_desc"]).optional(),
      }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { consumProducts } = await import("../drizzle/schema");
        const { eq, and, desc, asc, gte, lte, isNotNull } = await import("drizzle-orm");
        const conditions: any[] = [eq(consumProducts.category, input.category)];
        if (input.priceMin !== undefined) conditions.push(and(isNotNull(consumProducts.price), gte(consumProducts.price, input.priceMin)));
        if (input.priceMax !== undefined) conditions.push(and(isNotNull(consumProducts.price), lte(consumProducts.price, input.priceMax)));
        const sortBy = input.sortBy ?? "relevance";
        const orderClause = sortBy === "price_asc"
          ? asc(consumProducts.price)
          : sortBy === "price_desc"
          ? desc(consumProducts.price)
          : asc(consumProducts.name);
        return drizzleDb
          .select()
          .from(consumProducts)
          .where(and(...conditions))
          .orderBy(orderClause)
          .limit(input.limit ?? 48);
      }),

    /**
     * exportCart — Genera la URL de tienda.consum.es/es/pc/{ids} con los
     * productos del carrito. Máximo 50 productos por limitación de URL.
     * Devuelve también los productos sin product_url (no exportables).
     */
    exportCart: publicProcedure
      .input(
        z.object({
          /** IDs de los productos en nuestra BD (coinciden con IDs de tienda.consum.es) */
          productIds: z.array(z.string()).min(1).max(100),
        })
      )
      .mutation(async ({ input }) => {
        const { consumProducts } = await import("../drizzle/schema");
        const { inArray: inArrayFn } = await import("drizzle-orm");
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB no disponible" });
        const products = await drizzleDb
          .select({
            id: consumProducts.id,
            name: consumProducts.name,
            productUrl: consumProducts.productUrl,
          })
          .from(consumProducts)
          .where(inArrayFn(consumProducts.id, input.productIds));

        type ProductRow = { id: string; name: string; productUrl: string | null };
        const rows = products as ProductRow[];
        const exportable = rows.filter((p: ProductRow) => p.productUrl);
        const notExportable = rows.filter((p: ProductRow) => !p.productUrl);

        // Consum URL pattern: tienda.consum.es/es/pc/{id1},{id2},...
        // Limit to 50 products to keep URL manageable
        const ids = exportable.slice(0, 50).map((p: ProductRow) => p.id).join(",");
        const exportUrl = ids
          ? `https://tienda.consum.es/es/pc/${ids}`
          : null;

        return {
          exportUrl,
          exportedCount: exportable.slice(0, 50).length,
          totalCount: input.productIds.length,
          notExportable: notExportable.map((p: ProductRow) => ({ id: p.id, name: p.name })),
          truncated: exportable.length > 50,
        };
      }),
  }),

  // ---------------------------------------------------------------------------
  // BADGES — Sistema de insignias y logros
  // ---------------------------------------------------------------------------
  badges: router({
    /** Catálogo completo con estado ganado/bloqueado para el usuario autenticado */
    getCatalog: protectedProcedure.query(async ({ ctx }) => {
      const [allBadges, myBadges] = await Promise.all([
        db.getAllBadges(),
        db.getUserBadges(ctx.user.id),
      ]);
      const earnedIds = new Set(myBadges.map((ub: any) => ub.badge.id));
      const earnedMap = new Map(myBadges.map((ub: any) => [ub.badge.id, ub.userBadge.earnedAt]));
      return allBadges.map((badge: any) => ({
        ...badge,
        earned: earnedIds.has(badge.id),
        earnedAt: earnedMap.get(badge.id) ?? null,
      }));
    }),

    /** Insignias ganadas por el usuario autenticado */
    getMyBadges: protectedProcedure.query(async ({ ctx }) => {
      const myBadges = await db.getUserBadges(ctx.user.id);
      const points = await db.getUserBadgePoints(ctx.user.id);
      return {
        badges: myBadges.map((ub: any) => ({
          ...ub.badge,
          earnedAt: ub.userBadge.earnedAt,
          metadata: ub.userBadge.metadata ? JSON.parse(ub.userBadge.metadata) : null,
        })),
        totalPoints: points,
        totalBadges: myBadges.length,
      };
    }),

    /** Leaderboard: top 20 usuarios por puntos */
    getLeaderboard: protectedProcedure.query(async () => {
      return db.getBadgeLeaderboard(20);
    }),

    /** Conceder manualmente una insignia (solo admin) */
    awardManual: protectedProcedure
      .input(z.object({ userId: z.number(), badgeSlug: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const result = await db.awardBadge(input.userId, input.badgeSlug);
        return result;
      }),

    /** Estadísticas de insignias para el panel admin */
    getAdminStats: protectedProcedure.query(async ({ ctx }) => {
      if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const allBadges = await db.getAllBadges();
      const leaderboard = await db.getBadgeLeaderboard(10);
      return { badges: allBadges, leaderboard };
    }),
  }),

  // ---------------------------------------------------------------------------
  // USER REFERRALS — Sistema de referidos para todos los usuarios
  // ---------------------------------------------------------------------------
  userReferrals: router({
    /** Obtiene (o genera) el código de referido del usuario autenticado */
    getMyCode: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { userReferralCodes } = await import("../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      // Check if user already has a code
      const [existing] = await drizzleDb.select().from(userReferralCodes)
        .where(eq(userReferralCodes.userId, ctx.user.id)).limit(1);
      if (existing) return existing;
      // Generate a new unique code: 8 chars uppercase alphanumeric
      const generateCode = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusable chars
        let code = "";
        for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
      };
      let code = generateCode();
      // Ensure uniqueness (retry up to 5 times)
      for (let i = 0; i < 5; i++) {
        const [conflict] = await drizzleDb.select({ id: userReferralCodes.id })
          .from(userReferralCodes).where(eq(userReferralCodes.code, code)).limit(1);
        if (!conflict) break;
        code = generateCode();
      }
      const [created] = await drizzleDb.insert(userReferralCodes)
        .values({ userId: ctx.user.id, code })
        .returning();
      return created;
    }),

    /** Estadísticas del programa de referidos del usuario */
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { userReferralCodes, userReferrals, users: usersTable } = await import("../drizzle/schema.js");
      const { eq, desc } = await import("drizzle-orm");
      const [myCode] = await drizzleDb.select().from(userReferralCodes)
        .where(eq(userReferralCodes.userId, ctx.user.id)).limit(1);
      if (!myCode) return { code: null, referrals: [], totalRewarded: 0, totalRewardDays: 0 };
      const referrals = await drizzleDb
        .select({ referral: userReferrals, referredUser: { name: usersTable.name, imageUrl: usersTable.imageUrl, createdAt: usersTable.createdAt } })
        .from(userReferrals)
        .leftJoin(usersTable, eq(userReferrals.referredId, usersTable.id))
        .where(eq(userReferrals.referrerId, ctx.user.id))
        .orderBy(desc(userReferrals.createdAt));
      return {
        code: myCode,
        referrals: referrals.map(r => ({
          id: r.referral.id,
          status: r.referral.status,
          rewardDays: r.referral.rewardDays,
          subscribedAt: r.referral.subscribedAt,
          rewardedAt: r.referral.rewardedAt,
          referredName: r.referredUser?.name ?? "Usuario",
          referredImage: r.referredUser?.imageUrl ?? null,
          createdAt: r.referral.createdAt,
        })),
        totalRewarded: myCode.totalRewarded,
        totalRewardDays: myCode.totalRewardDays,
      };
    }),

    /** Aplica un código de referido al registrarse (llamado desde onboarding) */
    applyCode: protectedProcedure
      .input(z.object({ code: z.string().min(4).max(32).toUpperCase() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userReferralCodes, userReferrals } = await import("../drizzle/schema.js");
        const { eq, and } = await import("drizzle-orm");
        // Check if user already used a referral code
        const [alreadyReferred] = await drizzleDb.select({ id: userReferrals.id })
          .from(userReferrals).where(eq(userReferrals.referredId, ctx.user.id)).limit(1);
        if (alreadyReferred) throw new TRPCError({ code: "BAD_REQUEST", message: "Ya usaste un código de referido" });
        // Find the referral code
        const [referralCode] = await drizzleDb.select().from(userReferralCodes)
          .where(eq(userReferralCodes.code, input.code.toUpperCase())).limit(1);
        if (!referralCode) throw new TRPCError({ code: "NOT_FOUND", message: "Código de referido no válido" });
        if (referralCode.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes usar tu propio código" });
        // Create the referral record
        await drizzleDb.insert(userReferrals).values({
          referrerId: referralCode.userId,
          referredId: ctx.user.id,
          referralCode: input.code.toUpperCase(),
          status: "pending",
        });
        return { success: true, referrerName: null };
      }),

    /** Activa la recompensa del referidor (llamado desde webhook de Stripe) */
    activateReward: protectedProcedure
      .input(z.object({
        referredUserId: z.number(),
        stripeSubscriptionId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userReferrals, userReferralCodes, userSubscriptions } = await import("../drizzle/schema.js");
        const { eq, and } = await import("drizzle-orm");
        const [referral] = await drizzleDb.select().from(userReferrals)
          .where(and(eq(userReferrals.referredId, input.referredUserId), eq(userReferrals.status, "pending")))
          .limit(1);
        if (!referral) return { success: false, message: "No hay referido pendiente" };
        // Mark referral as subscribed
        await drizzleDb.update(userReferrals)
          .set({ status: "subscribed", subscribedAt: new Date(), stripeSubscriptionId: input.stripeSubscriptionId ?? null })
          .where(eq(userReferrals.id, referral.id));
        // Extend referrer's subscription by 30 days
        const [referrerSub] = await drizzleDb.select().from(userSubscriptions)
          .where(eq(userSubscriptions.userId, referral.referrerId)).limit(1);
        const now = new Date();
        const currentEnd = referrerSub?.currentPeriodEnd ?? now;
        const newEnd = new Date(Math.max(currentEnd.getTime(), now.getTime()) + 30 * 24 * 60 * 60 * 1000);
        if (referrerSub) {
          await drizzleDb.update(userSubscriptions)
            .set({ currentPeriodEnd: newEnd, updatedAt: now })
            .where(eq(userSubscriptions.userId, referral.referrerId));
        }
        // Mark as rewarded
        await drizzleDb.update(userReferrals)
          .set({ status: "rewarded", rewardedAt: now })
          .where(eq(userReferrals.id, referral.id));
        // Update referrer's stats
        await drizzleDb.update(userReferralCodes)
          .set({ totalRewarded: (referral.rewardDays ?? 30) > 0 ? undefined : undefined, updatedAt: now })
          .where(eq(userReferralCodes.userId, referral.referrerId));
        const { sql: sqlTag } = await import("drizzle-orm");
        await drizzleDb.execute(
          sqlTag`UPDATE user_referral_codes SET total_rewarded = total_rewarded + 1, total_reward_days = total_reward_days + 30, updated_at = NOW() WHERE user_id = ${referral.referrerId}`
        );
         return { success: true, rewardDays: 30, referrerId: referral.referrerId };
      }),
    /** Leaderboard público de los mejores referidores */
    getLeaderboard: protectedProcedure.query(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { userReferralCodes, users: usersTable } = await import("../drizzle/schema.js");
      const { eq, desc, gt } = await import("drizzle-orm");
      const rows = await drizzleDb
        .select({
          userId: userReferralCodes.userId,
          totalRewarded: userReferralCodes.totalRewarded,
          totalRewardDays: userReferralCodes.totalRewardDays,
          name: usersTable.name,
          imageUrl: usersTable.imageUrl,
        })
        .from(userReferralCodes)
        .leftJoin(usersTable, eq(userReferralCodes.userId, usersTable.id))
        .where(gt(userReferralCodes.totalRewarded, 0))
        .orderBy(desc(userReferralCodes.totalRewarded))
        .limit(10);
      return rows.map((r, i) => ({
        rank: i + 1,
        name: r.name ?? "Usuario",
        imageUrl: r.imageUrl ?? null,
        totalRewarded: r.totalRewarded,
        totalRewardDays: r.totalRewardDays,
      }));
    }),
  }),
  // ===========================================================================
  // LOGS — Panel de administración de errores del servidor
  // ===========================================================================
  logs: router({
    list: protectedProcedure
      .input(z.object({
        level: z.enum(["debug", "info", "warn", "error", "fatal", "all"]).optional().default("all"),
        from: z.string().optional(),
        to: z.string().optional(),
        search: z.string().optional(),
        resolved: z.boolean().optional(),
        limit: z.number().int().min(1).max(200).optional().default(50),
        offset: z.number().int().min(0).optional().default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { serverLogs } = await import("../drizzle/schema.js");
        const { and, eq, gte, lte, like, desc, count } = await import("drizzle-orm");
        const conditions = [];
        if (input.level && input.level !== "all") conditions.push(eq(serverLogs.level, input.level as "debug" | "info" | "warn" | "error" | "fatal"));
        if (input.from) conditions.push(gte(serverLogs.createdAt, new Date(input.from)));
        if (input.to) conditions.push(lte(serverLogs.createdAt, new Date(input.to)));
        if (input.search) conditions.push(like(serverLogs.message, `%${input.search}%`));
        if (input.resolved !== undefined) conditions.push(eq(serverLogs.resolved, input.resolved));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const [rows, totalResult] = await Promise.all([
          drizzleDb.select().from(serverLogs).where(where).orderBy(desc(serverLogs.createdAt)).limit(input.limit).offset(input.offset),
          drizzleDb.select({ count: count() }).from(serverLogs).where(where),
        ]);
        return { logs: rows, total: Number(totalResult[0]?.count ?? 0) };
      }),

    stats: protectedProcedure
      .query(async ({ ctx }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { serverLogs } = await import("../drizzle/schema.js");
        const { eq, gte, count, and } = await import("drizzle-orm");
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [total, last24h, last7d, byLevel, unresolved] = await Promise.all([
          drizzleDb.select({ count: count() }).from(serverLogs),
          drizzleDb.select({ count: count() }).from(serverLogs).where(gte(serverLogs.createdAt, since24h)),
          drizzleDb.select({ count: count() }).from(serverLogs).where(gte(serverLogs.createdAt, since7d)),
          drizzleDb.select({ level: serverLogs.level, count: count() }).from(serverLogs).groupBy(serverLogs.level),
          drizzleDb.select({ count: count() }).from(serverLogs).where(and(eq(serverLogs.resolved, false), eq(serverLogs.level, "error"))),
        ]);
        return {
          total: Number(total[0]?.count ?? 0),
          last24h: Number(last24h[0]?.count ?? 0),
          last7d: Number(last7d[0]?.count ?? 0),
          byLevel: byLevel.reduce((acc, r) => ({ ...acc, [r.level]: Number(r.count) }), {} as Record<string, number>),
          unresolvedErrors: Number(unresolved[0]?.count ?? 0),
        };
      }),

    resolve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { serverLogs } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        await drizzleDb.update(serverLogs).set({ resolved: true }).where(eq(serverLogs.id, input.id));
        return { success: true };
      }),

    clearOld: protectedProcedure
      .input(z.object({ olderThanDays: z.number().int().min(1).max(365).default(30) }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { serverLogs } = await import("../drizzle/schema.js");
        const { lt } = await import("drizzle-orm");
        const cutoff = new Date(Date.now() - input.olderThanDays * 24 * 60 * 60 * 1000);
        await drizzleDb.delete(serverLogs).where(lt(serverLogs.createdAt, cutoff));
        return { success: true };
      }),
    resolveAll: protectedProcedure
      .input(z.object({ level: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { serverLogs } = await import("../drizzle/schema.js");
        const { eq, and } = await import("drizzle-orm");
        const where = input.level
          ? and(eq(serverLogs.resolved, false), eq(serverLogs.level, input.level as "error" | "warn" | "info" | "debug" | "fatal"))
          : eq(serverLogs.resolved, false);
        await drizzleDb.update(serverLogs).set({ resolved: true }).where(where);
        return { success: true };
      }),
    analyzeAndFix: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!hasRole(ctx.user, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { serverLogs } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const [log] = await drizzleDb.select().from(serverLogs).where(eq(serverLogs.id, input.id)).limit(1);
        if (!log) throw new TRPCError({ code: "NOT_FOUND" });
        const prompt = [
          `Eres un experto en debugging de aplicaciones Node.js/TypeScript/React.`,
          `Analiza el siguiente error de servidor y proporciona:`,
          `1. **Diagnóstico** (1-2 frases)`,
          `2. **Causa probable**`,
          `3. **Pasos para corregirlo** (concretos y accionables)`,
          ``,
          `Nivel: ${log.level.toUpperCase()}`,
          `Mensaje: ${log.message}`,
          log.path ? `Ruta: ${log.method ?? ''} ${log.path}` : '',
          log.statusCode ? `Código HTTP: ${log.statusCode}` : '',
          log.stack ? `\nStack trace:\n${log.stack.slice(0, 1500)}` : '',
          log.metadata ? `\nMetadata: ${log.metadata.slice(0, 500)}` : '',
        ].filter(Boolean).join('\n');
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Responde siempre en español. Sé conciso y práctico. Usa formato markdown con negritas." },
            { role: "user", content: prompt },
          ],
        });
        const analysis = response.choices?.[0]?.message?.content ?? "No se pudo analizar el error.";
        return { analysis };
      }),
  }),

  // -- Ingredient Nutrition --
  ingredientNutrition: router({
    search: publicProcedure
      .input(z.object({ query: z.string().min(1).max(100), limit: z.number().int().min(1).max(50).default(20) }))
      .query(async ({ input }) => {
        return db.searchIngredientNutrition(input.query, input.limit);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        return db.getIngredientNutritionById(input.id);
      }),
    byCategory: publicProcedure
      .input(z.object({ category: z.string(), limit: z.number().int().min(1).max(100).default(50) }))
      .query(async ({ input }) => {
        return db.getIngredientsByCategory(input.category, input.limit);
      }),
    categories: publicProcedure.query(async () => {
      return db.getAllIngredientNutritionCategories();
    }),
    calculateNutrition: publicProcedure
      .input(z.object({
        items: z.array(z.object({
          ingredientId: z.number().int(),
          grams: z.number().positive(),
        }))
      }))
      .mutation(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { ingredientNutrition } = await import("../drizzle/schema.js");
        const { inArray } = await import("drizzle-orm");
        const ids = input.items.map((i: { ingredientId: number }) => i.ingredientId);
        const found = await drizzleDb.select().from(ingredientNutrition).where(inArray(ingredientNutrition.id, ids));
        const ingMap = new Map(found.map((i: { id: number }) => [i.id, i]));
        const resolved = input.items
          .map((item: { ingredientId: number; grams: number }) => ({ ingredient: ingMap.get(item.ingredientId), grams: item.grams }))
          .filter((x: { ingredient: unknown; grams: number }) => !!x.ingredient);
        return db.calculateNutritionFromItems(resolved as any);
      }),
  }),

  learning: router({
    trackInteraction: protectedProcedure
      .input(z.object({
        recipeId: z.number().int(),
        type: z.enum(["view", "long_view", "save", "cooked", "like", "dislike", "skip", "share", "add_to_menu", "log_meal"]),
        context: z.record(z.unknown()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { trackRecipeInteraction } = await import("./learning-engine.js");
        await trackRecipeInteraction(ctx.user.id, input.recipeId, input.type, input.context);
        return { ok: true };
      }),

    getProfile: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserTasteProfile, calculateBuddyScore, syncExistingInteractions } = await import("./learning-engine.js");
        let profile = await getUserTasteProfile(ctx.user.id);
        if (!profile) {
          await syncExistingInteractions(ctx.user.id);
          profile = await getUserTasteProfile(ctx.user.id);
        }
        const totalInteractions = profile?.totalInteractions ?? 0;
        const confidenceScore = profile?.confidenceScore ?? 0;
        const buddyScore = calculateBuddyScore(totalInteractions, confidenceScore);
        return {
          buddyScore,
          totalInteractions,
          confidenceScore,
          topCuisines: profile ? Object.entries(JSON.parse(profile.cuisineScores as string || "{}" ))
            .sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k]) => k) : [],
          topCookingMethods: profile ? Object.entries(JSON.parse(profile.cookingMethodScores as string || "{}" ))
            .sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k]) => k) : [],
          lastCalculatedAt: profile?.lastCalculatedAt ?? null,
        };
      }),

    submitFeedback: protectedProcedure
      .input(z.object({
        feedbackType: z.string(),
        entityId: z.number().int().optional(),
        entityType: z.string().optional(),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        const { userAIFeedback } = await import("../drizzle/schema.js");
        await drizzleDb.insert(userAIFeedback).values({
          userId: ctx.user.id,
          feedbackType: input.feedbackType,
          entityId: input.entityId,
          entityType: input.entityType,
          comment: input.comment,
        });
        return { ok: true };
      }),
  }),

  // ─── Feedback ──────────────────────────────────────────────────────────────
  feedback: router({
    submit: protectedProcedure
      .input(z.object({
        category: z.enum(["bug", "improvement", "idea", "other"]),
        message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres").max(500, "El mensaje no puede superar los 500 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createFeedback({
          userId: ctx.user.id,
          category: input.category,
          message: input.message,
        });
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo guardar el feedback" });
        // Notify owner
        try {
          const { notifyOwner } = await import("./_core/notification.js");
          const categoryLabels: Record<string, string> = {
            bug: "🐛 Error / Bug",
            improvement: "✨ Mejora",
            idea: "💡 Idea",
            other: "📝 Otro",
          };
          await notifyOwner({
            title: `Nuevo feedback: ${categoryLabels[input.category] ?? input.category}`,
            content: `**Usuario:** ${ctx.user.name ?? ctx.user.email ?? `#${ctx.user.id}`}\n**Categoría:** ${categoryLabels[input.category] ?? input.category}\n\n${input.message}`,
          });
        } catch { /* notificación no crítica */ }
        return { ok: true, id: result.id };
      }),

    list: protectedProcedure
      .input(z.object({
        status: z.enum(["pending", "reviewed", "resolved"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores" });
        return db.getFeedbacks({ status: input.status, limit: input.limit, offset: input.offset });
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        status: z.enum(["pending", "reviewed", "resolved"]),
        adminNote: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores" });
        const result = await db.updateFeedbackStatus(input.id, input.status, input.adminNote);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Feedback no encontrado" });
        return { ok: true };
      }),

    analytics: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores" });
        const result = await db.getFeedbackAnalytics();
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudieron obtener las métricas" });
        return result;
      }),

    pendingCount: protectedProcedure
      .query(async ({ ctx }) => {
        // Only admins get the real count; regular users always get 0
        if (ctx.user.role !== "admin") return { count: 0 };
        const count = await db.getPendingFeedbackCount();
        return { count };
      }),
  }),

  // ─── BuddyPet ──────────────────────────────────────────────────────────────
  pets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getPetsByUser(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.id, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        return pet;
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        species: z.enum(["dog", "cat", "rabbit", "bird", "hamster", "guinea_pig", "fish", "turtle", "ferret", "other"]),
        breed: z.string().max(150).optional(),
        weightValue: z.number().positive(),
        weightUnit: z.enum(["kg", "lb"]).default("kg"),
        ageYears: z.number().int().min(0).max(50).optional(),
        ageMonths: z.number().int().min(0).max(11).optional(),
        gender: z.string().max(10).optional(),
        neutered: z.boolean().default(false),
        healthNotes: z.string().max(1000).optional(),
        avatarEmoji: z.string().max(10).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createPet({ ...input, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        name: z.string().min(1).max(100).optional(),
        species: z.enum(["dog", "cat", "rabbit", "bird", "hamster", "guinea_pig", "fish", "turtle", "ferret", "other"]).optional(),
        breed: z.string().max(150).optional(),
        weightValue: z.number().positive().optional(),
        weightUnit: z.enum(["kg", "lb"]).optional(),
        ageYears: z.number().int().min(0).max(50).optional(),
        ageMonths: z.number().int().min(0).max(11).optional(),
        gender: z.string().max(10).optional(),
        neutered: z.boolean().optional(),
        healthNotes: z.string().max(1000).optional(),
        avatarEmoji: z.string().max(10).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const pet = await db.updatePet(id, ctx.user.id, data);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        return pet;
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePet(input.id, ctx.user.id);
        return { ok: true };
      }),
    generateMenu: protectedProcedure
      .input(z.object({ petId: z.number().int(), weekLabel: z.string().max(50).optional() }))
      .mutation(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND", message: "Mascota no encontrada" });
        const weightKg = pet.weightUnit === "lb" ? pet.weightValue * 0.453592 : pet.weightValue;
        const speciesLabels: Record<string, string> = {
          dog: "perro", cat: "gato", rabbit: "conejo", bird: "pájaro",
          hamster: "hámster", guinea_pig: "cobaya", fish: "pez",
          turtle: "tortuga", ferret: "hurón", other: "mascota",
        };
        const speciesLabel = speciesLabels[pet.species] ?? pet.species;
        const prompt = `Eres un nutricionista veterinario experto. Genera un menú semanal completo y equilibrado para un ${speciesLabel} con estas características:
- Nombre: ${pet.name}
- Raza: ${pet.breed ?? "desconocida"}
- Peso: ${weightKg.toFixed(1)} kg
- Edad: ${pet.ageYears ?? 0} años ${pet.ageMonths ?? 0} meses
- Sexo: ${pet.gender ?? "desconocido"}
- Castrado/esterilizado: ${pet.neutered ? "sí" : "no"}
- Notas de salud: ${pet.healthNotes ?? "ninguna"}

Devuelve SOLO JSON válido con esta estructura:
{
  "dailyCalories": number,
  "dailyGrams": number,
  "notes": "recomendaciones generales",
  "days": [{ "day": "Lunes", "meals": [{ "time": "Mañana", "food": "descripción", "grams": number }] }],
  "shoppingList": [{ "item": "producto", "quantity": "cantidad", "category": "categoría" }]
}`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un nutricionista veterinario experto. Responde siempre con JSON válido." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });
        const content = response.choices?.[0]?.message?.content ?? "{}";
        const menuData = JSON.parse(content);
        const saved = await db.createPetMenu({
          petId: input.petId,
          userId: ctx.user.id,
          weekLabel: input.weekLabel ?? `Semana ${new Date().toLocaleDateString("es-ES")}`,
          menuJson: content,
          shoppingListJson: JSON.stringify(menuData.shoppingList ?? []),
        });
        return { menu: menuData, savedId: saved.id };
      }),
    menus: protectedProcedure
      .input(z.object({ petId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        return db.getPetMenusByPet(input.petId, ctx.user.id);
      }),
    linkToClinic: protectedProcedure
      .input(z.object({ petId: z.number().int(), clinicCode: z.string().min(6).max(12) }))
      .mutation(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND", message: "Mascota no encontrada" });
        const clinic = await db.getVetClinicByCode(input.clinicCode);
        if (!clinic) throw new TRPCError({ code: "NOT_FOUND", message: "Código de clínica no válido" });
        const link = await db.linkPetToClinic(input.petId, clinic.id, ctx.user.id);
        return { ok: true, clinicName: clinic.name, link };
      }),
    linkedClinics: protectedProcedure
      .input(z.object({ petId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        return db.getLinkedClinicsForPet(input.petId);
      }),
    unlinkFromClinic: protectedProcedure
      .input(z.object({ petId: z.number().int(), clinicId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND", message: "Mascota no encontrada" });
        const result = await db.unlinkPetFromClinic(input.petId, input.clinicId, ctx.user.id);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Vinculación no encontrada" });
        return { ok: true };
      }),
    alerts: protectedProcedure.query(async ({ ctx }) => {
      return db.getPetAlertsByOwner(ctx.user.id);
    }),

    // ── Nutrition Profile ────────────────────────────────────────────────────
    getNutritionProfile: protectedProcedure
      .input(z.object({ petId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        return db.getPetNutritionProfile(input.petId, ctx.user.id);
      }),

    updateNutritionProfile: protectedProcedure
      .input(z.object({
        petId: z.number().int(),
        dietType: z.enum(["standard","barf","homecooked","mixed","prescription","vegetarian","senior","puppy_kitten","weight_loss","weight_gain","hypoallergenic","renal","diabetic"]).optional(),
        activityLevel: z.enum(["sedentary","low","moderate","high","very_high"]).optional(),
        bodyCondition: z.enum(["very_thin","thin","ideal","overweight","obese"]).optional(),
        targetWeightKg: z.number().positive().optional(),
        allergies: z.array(z.string()).optional(),
        foodsToAvoid: z.array(z.string()).optional(),
        favoriteFoods: z.array(z.string()).optional(),
        medicalConditions: z.array(z.string()).optional(),
        dailyCaloriesTarget: z.number().int().positive().optional(),
        dailyGramsTarget: z.number().int().positive().optional(),
        mealsPerDay: z.number().int().min(1).max(6).optional(),
        // Alimentación actual
        currentFoodBrand: z.string().max(100).optional(),
        currentFoodType: z.enum(["pienso_seco","pienso_humedo","barf","casero","mixto","otro"]).optional(),
        currentFoodFrequency: z.number().int().min(1).max(6).optional(),
        currentFoodAmountGrams: z.number().int().positive().optional(),
        currentFoodNotes: z.string().max(500).optional(),
        supplements: z.array(z.string()).optional(),
        treatsFrequency: z.enum(["nunca","ocasional","diario"]).optional(),
        waterIntakeType: z.enum(["grifo","filtrada","fuente","otro"]).optional(),
        feedingSchedule: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { petId, allergies, foodsToAvoid, favoriteFoods, medicalConditions, supplements, feedingSchedule, ...rest } = input;
        const pet = await db.getPetById(petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        return db.upsertPetNutritionProfile(petId, ctx.user.id, {
          ...rest,
          allergiesJson: allergies ? JSON.stringify(allergies) : undefined,
          foodsToAvoidJson: foodsToAvoid ? JSON.stringify(foodsToAvoid) : undefined,
          favoriteFoodsJson: favoriteFoods ? JSON.stringify(favoriteFoods) : undefined,
          medicalConditionsJson: medicalConditions ? JSON.stringify(medicalConditions) : undefined,
          supplementsJson: supplements ? JSON.stringify(supplements) : undefined,
          feedingScheduleJson: feedingSchedule ? JSON.stringify(feedingSchedule) : undefined,
        });
      }),

    // ── Analyze Current Diet (IA) ────────────────────────────────────────────────
    analyzeCurrentDiet: protectedProcedure
      .input(z.object({ petId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        const profile = await db.getPetNutritionProfile(input.petId, ctx.user.id);
        if (!profile) throw new TRPCError({ code: "BAD_REQUEST", message: "Primero completa el perfil de alimentación actual" });
        const speciesLabels: Record<string, string> = { dog: "perro", cat: "gato", rabbit: "conejo", bird: "pájaro", hamster: "hámster", guinea_pig: "cobaya", fish: "pez", turtle: "tortuga", ferret: "hurón", other: "mascota" };
        const speciesLabel = speciesLabels[pet.species] ?? pet.species;
        const weightKg = pet.weightUnit === "lb" ? (pet.weightValue ?? 0) * 0.453592 : (pet.weightValue ?? 0);
        const foodTypeLabels: Record<string, string> = { pienso_seco: "pienso seco", pienso_humedo: "pienso húmedo", barf: "dieta BARF cruda", casero: "comida casera", mixto: "alimentación mixta", otro: "otro tipo de alimentación" };
        const foodTypeLabel = foodTypeLabels[profile.currentFoodType ?? ""] ?? profile.currentFoodType ?? "no especificado";
        const supplements = profile.supplementsJson ? JSON.parse(profile.supplementsJson) : [];
        const feedingSchedule = profile.feedingScheduleJson ? JSON.parse(profile.feedingScheduleJson) : [];
        const prompt = `Eres un nutricionista veterinario experto. Analiza la dieta actual de este ${speciesLabel} y evalúa si es nutricionalmente adecuada.\n\nDATOS DE LA MASCOTA:\n- Nombre: ${pet.name}\n- Especie: ${speciesLabel}\n- Raza: ${pet.breed ?? "no especificada"}\n- Edad: ${pet.ageYears ?? "?"}a ${pet.ageMonths ?? 0}m\n- Peso: ${weightKg.toFixed(1)} kg\n- Condición corporal: ${profile.bodyCondition ?? "no evaluada"}\n- Condiciones médicas: ${profile.medicalConditionsJson ? JSON.parse(profile.medicalConditionsJson).join(", ") : "ninguna"}\n- Alergias: ${profile.allergiesJson ? JSON.parse(profile.allergiesJson).join(", ") : "ninguna"}\n\nALIMENTACIÓN ACTUAL:\n- Tipo: ${foodTypeLabel}\n- Marca: ${profile.currentFoodBrand ?? "no especificada"}\n- Frecuencia: ${profile.currentFoodFrequency ?? "?"}x/día\n- Cantidad: ${profile.currentFoodAmountGrams ?? "?"}g/toma\n- Suplementos: ${supplements.length > 0 ? supplements.join(", ") : "ninguno"}\n- Premios: ${profile.treatsFrequency ?? "no especificado"}\n- Agua: ${profile.waterIntakeType ?? "no especificada"}\n- Horarios: ${feedingSchedule.length > 0 ? feedingSchedule.join(", ") : "no especificados"}\n- Notas: ${profile.currentFoodNotes ?? "ninguna"}\n\nEvalúa: cantidad correcta para el peso, tipo de dieta apropiado, deficiencias nutricionales probables, riesgos, y recomendaciones de mejora AUNQUE el animal parezca sano visualmente.\n\nDevuelve SOLO JSON:\n{\n  "overallRating": 7,\n  "ratingLabel": "Aceptable",\n  "summary": "resumen ejecutivo",\n  "positives": ["punto positivo"],\n  "concerns": ["preocupación"],\n  "deficiencies": ["deficiencia nutricional"],\n  "recommendations": ["recomendación"],\n  "urgentActions": [],\n  "idealDietType": "pienso_seco",\n  "idealCaloriesPerDay": 400,\n  "idealGramsPerDay": 200,\n  "shouldConsultVet": false,\n  "vetConsultReason": ""\n}`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un nutricionista veterinario experto. Devuelve SOLO JSON válido." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });
        const content = response.choices?.[0]?.message?.content ?? "{}";
        const analysis = JSON.parse(content);
        await db.upsertPetNutritionProfile(input.petId, ctx.user.id, {
          currentDietAnalysisJson: content,
          currentDietAnalyzedAt: new Date(),
        });
        return { analysis };
      }),

    // ── Custom Menu Generation ───────────────────────────────────────────────
    generateCustomMenu: protectedProcedure
      .input(z.object({
        petId: z.number().int(),
        weekLabel: z.string().max(50).optional(),
        dietType: z.string().optional(),
        bodyCondition: z.string().optional(),
        activityLevel: z.string().optional(),
        foodsToAvoid: z.array(z.string()).optional(),
        favoriteFoods: z.array(z.string()).optional(),
        medicalConditions: z.array(z.string()).optional(),
        mealsPerDay: z.number().int().min(1).max(6).optional(),
        targetWeightKg: z.number().positive().optional(),
        extraInstructions: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND", message: "Mascota no encontrada" });
        const weightKg = pet.weightUnit === "lb" ? pet.weightValue * 0.453592 : pet.weightValue;
        const speciesLabels: Record<string, string> = {
          dog: "perro", cat: "gato", rabbit: "conejo", bird: "pájaro",
          hamster: "hámster", guinea_pig: "cobaya", fish: "pez",
          turtle: "tortuga", ferret: "hurón", other: "mascota",
        };
        const dietLabels: Record<string, string> = {
          standard: "estándar (pienso comercial)", barf: "BARF (huesos y carne cruda)",
          homecooked: "comida casera cocinada", mixed: "mixta (pienso + natural)",
          prescription: "dieta veterinaria prescrita", vegetarian: "vegetariana",
          senior: "senior (mascota mayor)", puppy_kitten: "cachorro/gatito",
          weight_loss: "pérdida de peso", weight_gain: "ganancia de peso",
          hypoallergenic: "hipoalergénica", renal: "renal", diabetic: "diabética",
        };
        const bodyLabels: Record<string, string> = {
          very_thin: "muy delgado (necesita ganar peso urgente)",
          thin: "delgado (por debajo del peso ideal)",
          ideal: "peso ideal",
          overweight: "sobrepeso (necesita perder peso)",
          obese: "obeso (pérdida de peso prioritaria)",
        };
        const activityLabels: Record<string, string> = {
          sedentary: "sedentario", low: "baja actividad", moderate: "actividad moderada",
          high: "alta actividad", very_high: "muy activo (deporte/trabajo)",
        };
        const speciesLabel = speciesLabels[pet.species] ?? pet.species;
        const dietLabel = dietLabels[input.dietType ?? "standard"] ?? input.dietType ?? "estándar";
        const bodyLabel = bodyLabels[input.bodyCondition ?? "ideal"] ?? "peso ideal";
        const activityLabel = activityLabels[input.activityLevel ?? "moderate"] ?? "moderada";
        const prompt = `Eres un nutricionista veterinario experto. Genera un menú semanal PERSONALIZADO para un ${speciesLabel} con estas características:\n- Nombre: ${pet.name}\n- Raza: ${pet.breed ?? "desconocida"}\n- Peso actual: ${weightKg.toFixed(1)} kg\n- Edad: ${pet.ageYears ?? 0} años ${pet.ageMonths ?? 0} meses\n- Sexo: ${pet.gender ?? "desconocido"}, Castrado: ${pet.neutered ? "sí" : "no"}\n- Condición corporal: ${bodyLabel}\n- Tipo de dieta: ${dietLabel}\n- Nivel de actividad: ${activityLabel}\n- Comidas por día: ${input.mealsPerDay ?? 2}\n${input.targetWeightKg ? `- Peso objetivo: ${input.targetWeightKg} kg` : ""}\n${input.foodsToAvoid?.length ? `- Alimentos a EVITAR: ${input.foodsToAvoid.join(", ")}` : ""}\n${input.favoriteFoods?.length ? `- Alimentos favoritos: ${input.favoriteFoods.join(", ")}` : ""}\n${input.medicalConditions?.length ? `- Condiciones médicas: ${input.medicalConditions.join(", ")}` : ""}\n${pet.healthNotes ? `- Notas de salud: ${pet.healthNotes}` : ""}\n${input.extraInstructions ? `- Instrucciones adicionales: ${input.extraInstructions}` : ""}\n\nIMPORTANTE: Adapta el menú EXACTAMENTE al tipo de dieta. Si es BARF usa carne cruda. Si hay sobrepeso reduce calorías. Si hay bajo peso aumenta calorías.\n\nDevuelve SOLO JSON válido:\n{\n  "dailyCalories": number,\n  "dailyGrams": number,\n  "dietType": "${input.dietType ?? "standard"}",\n  "bodyConditionNote": "nota sobre condición corporal y objetivo",\n  "notes": "recomendaciones generales",\n  "days": [{ "day": "Lunes", "meals": [{ "time": "Mañana", "food": "descripción", "grams": number, "calories": number }] }],\n  "shoppingList": [{ "item": "producto", "quantity": "cantidad", "category": "categoría" }],\n  "supplements": [{ "name": "suplemento", "reason": "motivo", "dose": "dosis" }]\n}`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un nutricionista veterinario experto. Responde siempre con JSON válido." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });
        const content = response.choices?.[0]?.message?.content ?? "{}";
        const menuData = JSON.parse(content);
        const saved = await db.createPetMenu({
          petId: input.petId,
          userId: ctx.user.id,
          weekLabel: input.weekLabel ?? `Menú ${dietLabel} - ${new Date().toLocaleDateString("es-ES")}`,
          menuJson: content,
          shoppingListJson: JSON.stringify(menuData.shoppingList ?? []),
          notes: menuData.notes,
        });
        if (menuData.dailyCalories || menuData.dailyGrams) {
          await db.upsertPetNutritionProfile(input.petId, ctx.user.id, {
            dailyCaloriesTarget: menuData.dailyCalories,
            dailyGramsTarget: menuData.dailyGrams,
          });
        }
        return { menu: menuData, savedId: saved.id };
      }),

    // ── Photo Analysis ───────────────────────────────────────────────────────
    analyzePhoto: protectedProcedure
      .input(z.object({
        petId: z.number().int(),
        photoUrl: z.string().url(),
      }))
      .mutation(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        const speciesLabels: Record<string, string> = {
          dog: "perro", cat: "gato", rabbit: "conejo", bird: "pájaro",
          hamster: "hámster", guinea_pig: "cobaya", fish: "pez",
          turtle: "tortuga", ferret: "hurón", other: "mascota",
        };
        const speciesLabel = speciesLabels[pet.species] ?? pet.species;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un veterinario experto en evaluación visual de mascotas. Analiza la imagen y proporciona evaluación en JSON." },
            { role: "user", content: [
              { type: "text", text: `Analiza esta foto de un ${speciesLabel} llamado ${pet.name}. Evalúa:\n1. Condición corporal (very_thin/thin/ideal/overweight/obese) con puntuación 1-9\n2. Estado del pelaje/plumaje\n3. Postura y movilidad aparente\n4. Estimación de raza si no se conoce\n5. Signos visuales de salud\n6. Recomendaciones nutricionales\n\nDevuelve SOLO JSON:\n{\n  "bodyCondition": "ideal",\n  "bodyConditionScore": 5,\n  "bodyConditionNote": "descripción",\n  "coatCondition": "descripción del pelaje",\n  "estimatedBreed": "raza estimada",\n  "healthObservations": ["obs1"],\n  "nutritionalRecommendations": ["rec1"],\n  "urgentConcerns": [],\n  "overallScore": 8,\n  "summary": "resumen"\n}` },
              { type: "image_url", image_url: { url: input.photoUrl, detail: "high" } },
            ]},
          ],
          response_format: { type: "json_object" },
        });
        const content = response.choices?.[0]?.message?.content ?? "{}";
        const analysis = JSON.parse(content);
        await db.upsertPetNutritionProfile(input.petId, ctx.user.id, {
          photoUrl: input.photoUrl,
          photoAnalysisJson: content,
          bodyCondition: analysis.bodyCondition as any,
        });
        return { analysis, photoUrl: input.photoUrl };
      }),

    // ── Weight History ───────────────────────────────────────────────────────
    weightHistory: protectedProcedure
      .input(z.object({ petId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        return db.getPetWeightHistory(input.petId, ctx.user.id);
      }),

    addWeightRecord: protectedProcedure
      .input(z.object({
        petId: z.number().int(),
        weightValue: z.number().positive(),
        weightUnit: z.enum(["kg", "lb"]).default("kg"),
        bodyCondition: z.enum(["very_thin","thin","ideal","overweight","obese"]).optional(),
        notes: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        await db.updatePet(input.petId, ctx.user.id, { weightValue: input.weightValue, weightUnit: input.weightUnit });
        return db.addPetWeightRecord({ ...input, userId: ctx.user.id });
      }),

    // ── Vaccines ─────────────────────────────────────────────────────────────
    vaccines: protectedProcedure
      .input(z.object({ petId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        return db.getPetVaccines(input.petId, ctx.user.id);
      }),

    addVaccine: protectedProcedure
      .input(z.object({
        petId: z.number().int(),
        name: z.string().min(1).max(200),
        administeredAt: z.string().optional(),
        nextDueAt: z.string().optional(),
        vetName: z.string().max(150).optional(),
        batchNumber: z.string().max(100).optional(),
        notes: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        return db.addPetVaccine({
          ...input,
          userId: ctx.user.id,
          administeredAt: input.administeredAt ? new Date(input.administeredAt) : undefined,
          nextDueAt: input.nextDueAt ? new Date(input.nextDueAt) : undefined,
        });
      }),

    deleteVaccine: protectedProcedure
      .input(z.object({ vaccineId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePetVaccine(input.vaccineId, ctx.user.id);
        return { ok: true };
      }),

    // ── Medications ──────────────────────────────────────────────────────────
    medications: protectedProcedure
      .input(z.object({ petId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        return db.getPetMedications(input.petId, ctx.user.id);
      }),

    addMedication: protectedProcedure
      .input(z.object({
        petId: z.number().int(),
        name: z.string().min(1).max(200),
        dosage: z.string().max(100).optional(),
        frequency: z.string().max(100).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        prescribedBy: z.string().max(150).optional(),
        notes: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        return db.addPetMedication({
          ...input,
          userId: ctx.user.id,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        });
      }),

    updateMedication: protectedProcedure
      .input(z.object({
        medicationId: z.number().int(),
        active: z.boolean().optional(),
        notes: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { medicationId, ...data } = input;
        return db.updatePetMedication(medicationId, ctx.user.id, data);
      }),

    // ── Edit Menu Meal ──────────────────────────────────────────────────────
    editMenuMeal: protectedProcedure
      .input(z.object({
        menuId: z.number().int(),
        dayIndex: z.number().int().min(0),
        mealIndex: z.number().int().min(0),
        newFood: z.string().min(1).max(500),
        newGrams: z.number().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.editPetMenuMeal(input.menuId, ctx.user.id, input.dayIndex, input.mealIndex, input.newFood, input.newGrams);
        if (!result) throw new TRPCError({ code: "NOT_FOUND" });
        return result;
      }),

    // ── Upload Pet Photo ─────────────────────────────────────────────────────
    uploadPhoto: protectedProcedure
      .input(z.object({
        petId: z.number().int(),
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        const pet = await db.getPetById(input.petId, ctx.user.id);
        if (!pet) throw new TRPCError({ code: "NOT_FOUND" });
        const imageBuffer = Buffer.from(input.imageBase64, "base64");
        const ext = input.mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
        const fileKey = `pet-photos/${ctx.user.id}-${input.petId}-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, imageBuffer, input.mimeType);
        await db.upsertPetNutritionProfile(input.petId, ctx.user.id, { photoUrl: url });
        return { url };
      }),
  }),

  // ─── Veterinary Clinic ─────────────────────────────────────────────────────
  vetClinic: router({
    myClinic: protectedProcedure.query(async ({ ctx }) => {
      return db.getVetClinicForUser(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(2).max(200),
        address: z.string().max(500).optional(),
        phone: z.string().max(32).optional(),
        email: z.string().email().optional(),
        website: z.string().max(300).optional().or(z.literal("")),
        description: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getVetClinicForUser(ctx.user.id);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Ya tienes una clínica registrada" });
        return db.createVetClinic({ ...input, ownerId: ctx.user.id });
      }),
    update: protectedProcedure
      .input(z.object({
        clinicId: z.number().int(),
        name: z.string().min(2).max(200).optional(),
        address: z.string().max(500).optional(),
        phone: z.string().max(32).optional(),
        email: z.string().email().optional(),
        website: z.string().max(300).optional(),
        description: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { clinicId, ...data } = input;
        const result = await db.updateVetClinic(clinicId, ctx.user.id, data);
        if (!result) throw new TRPCError({ code: "FORBIDDEN" });
        return result;
      }),
    linkedPets: protectedProcedure
      .input(z.object({ clinicId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        return db.getLinkedPetsForClinic(input.clinicId);
      }),
    sendAlert: protectedProcedure
      .input(z.object({
        clinicId: z.number().int(),
        petId: z.number().int(),
        ownerId: z.number().int(),
        type: z.enum(["vaccine", "checkup", "medication", "weight", "diet", "deworming", "dental", "surgery", "other"]),
        title: z.string().min(3).max(200),
        description: z.string().max(1000).optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const alert = await db.createPetAlert({
          petId: input.petId,
          clinicId: input.clinicId,
          ownerId: input.ownerId,
          type: input.type,
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
        });
        try {
          const { notifyOwner } = await import("./_core/notification.js");
          await notifyOwner({ title: `🐾 Alerta veterinaria: ${input.title}`, content: input.description ?? "" });
        } catch { /* non-critical */ }
        return { ok: true, alert };
      }),
    clinicAlerts: protectedProcedure
      .input(z.object({ clinicId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        return db.getPetAlertsByClinic(input.clinicId);
      }),
    resolveAlert: protectedProcedure
      .input(z.object({ alertId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.resolvePetAlert(input.alertId);
        if (!result) throw new TRPCError({ code: "NOT_FOUND" });
        return { ok: true };
      }),
    addVisit: protectedProcedure
      .input(z.object({
        petId: z.number().int(),
        clinicId: z.number().int(),
        ownerId: z.number().int(),
        visitDate: z.date(),
        reason: z.string().max(300).optional(),
        diagnosis: z.string().max(2000).optional(),
        treatment: z.string().max(2000).optional(),
        weight: z.number().positive().optional(),
        nextVisitDate: z.date().optional(),
        vetName: z.string().max(150).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createPetVetVisit(input);
      }),
    petVisits: protectedProcedure
      .input(z.object({ petId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        return db.getPetVetVisits(input.petId);
      }),
    list: publicProcedure
      .input(z.object({ city: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.listVetClinics({ city: input?.city, active: true });
      }),
    getById: publicProcedure
      .input(z.object({ clinicId: z.number().int() }))
      .query(async ({ input }) => {
        return db.getVetClinicById(input.clinicId);
      }),
    updateFull: protectedProcedure
      .input(z.object({
        clinicId: z.number().int(),
        name: z.string().min(2).max(200).optional(),
        address: z.string().max(500).optional(),
        phone: z.string().max(32).optional(),
        email: z.string().email().optional().or(z.literal("")),
        website: z.string().max(300).optional().or(z.literal("")),
        description: z.string().max(1000).optional(),
        city: z.string().max(64).optional(),
        province: z.string().max(64).optional(),
        licenseNumber: z.string().max(64).optional(),
        specialtiesJson: z.string().optional(),
        logoUrl: z.string().optional(),
        coverUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { clinicId, ...data } = input;
        const result = await db.updateVetClinicFull(clinicId, ctx.user.id, data);
        if (!result) throw new TRPCError({ code: "FORBIDDEN" });
        return result;
      }),
    createFull: protectedProcedure
      .input(z.object({
        name: z.string().min(2).max(200),
        address: z.string().max(500).optional(),
        phone: z.string().max(32).optional(),
        email: z.string().email().optional().or(z.literal("")),
        website: z.string().max(300).optional().or(z.literal("")),
        description: z.string().max(1000).optional(),
        city: z.string().max(64).optional(),
        province: z.string().max(64).optional(),
        licenseNumber: z.string().max(64).optional(),
        specialtiesJson: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getVetClinicForUser(ctx.user.id);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Ya tienes una clínica registrada" });
        return db.createVetClinic({ ...input, ownerId: ctx.user.id });
      }),
  }),

  // ── Fridge Scanner ──────────────────────────────────────────────────────────
  fridge: router({
    scan: protectedProcedure
      .input(z.object({
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.imageBase64, "base64");
        const key = `fridge-scans/${ctx.user.id}-${Date.now()}.jpg`;
        const { url: imageUrl } = await storagePut(key, buffer, input.mimeType);

        const scan = await db.createFridgeScan(ctx.user.id, imageUrl);
        if (!scan) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const aiResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Eres un experto en nutrición y análisis de alimentos. Analiza la imagen de una nevera o despensa y devuelve un JSON con los ingredientes detectados.`,
            },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: imageUrl, detail: "high" } } as unknown as string,
                {
                  type: "text",
                  text: `Analiza esta imagen de nevera/despensa. Devuelve SOLO un JSON:
{
  "ingredients": [
    { "name": "nombre en español", "estimatedAmount": "cantidad estimada", "unit": "g/ml/unidades", "category": "verdura/fruta/proteína/lácteo/cereal/otro" }
  ],
  "notes": "observaciones adicionales"
}`,
                } as unknown as string,
              ],
            },
          ],
        });

        let detectedIngredients: unknown[] = [];
        try {
          const content = aiResponse.choices[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(content.replace(/```json\n?|```/g, "").trim());
          detectedIngredients = parsed.ingredients ?? [];
        } catch { detectedIngredients = []; }

        await db.updateFridgeScan(scan.id, ctx.user.id, { detectedIngredientsJson: JSON.stringify(detectedIngredients) });
        return { scanId: scan.id, imageUrl, ingredients: detectedIngredients };
      }),

    generateMenuFromScan: protectedProcedure
      .input(z.object({
        scanId: z.number(),
        ingredientsJson: z.string(),
        mealsPerDay: z.number().min(3).max(6).default(5),
        dietType: z.string().optional(),
        allergies: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let ingredients: { name: string; estimatedAmount?: string }[] = [];
        try { ingredients = JSON.parse(input.ingredientsJson); } catch { ingredients = []; }
        const ingredientsList = ingredients.map(i => `- ${i.name}${i.estimatedAmount ? ` (${i.estimatedAmount})` : ""}`).join("\n");

        const aiResponse = await invokeLLM({
          messages: [
            { role: "system", content: `Eres un nutricionista experto. Genera menús usando EXCLUSIVAMENTE los ingredientes disponibles. Si faltan ingredientes esenciales, indícalo.` },
            {
              role: "user",
              content: `Ingredientes disponibles:\n${ingredientsList}\n\nTipo de dieta: ${input.dietType ?? "equilibrada"}\nAlergias: ${input.allergies ?? "ninguna"}\nComidas por día: ${input.mealsPerDay}\n\nGenera un menú para HOY usando SOLO estos ingredientes. Devuelve JSON:\n{\n  "meals": [\n    { "mealTime": "desayuno|media_manana|comida|merienda|cena", "name": "nombre del plato", "ingredients": ["ingrediente 1"], "calories": 350, "protein": 20, "recipe": { "steps": ["paso 1"], "prepTime": 10 } }\n  ],\n  "missingIngredients": ["ingrediente que falta"],\n  "nutritionSummary": { "totalCalories": 1800, "totalProtein": 90, "totalCarbs": 200, "totalFat": 60 }\n}`,
            },
          ],
        });

        let menu: unknown = { meals: [], missingIngredients: [], nutritionSummary: {} };
        try {
          const content = aiResponse.choices[0]?.message?.content ?? "{}";
          menu = JSON.parse(content.replace(/```json\n?|```/g, "").trim());
        } catch { /* keep default */ }

        await db.updateFridgeScan(input.scanId, ctx.user.id, {
          editedIngredientsJson: input.ingredientsJson,
          suggestedMenuJson: JSON.stringify(menu),
        });
        return menu;
      }),

    history: protectedProcedure.query(async ({ ctx }) => db.getFridgeScanHistory(ctx.user.id)),
  }),

  // ── Health / Blood Tests ─────────────────────────────────────────────────────
  health: router({
    uploadBloodTest: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        mimeType: z.string().default("application/pdf"),
        testDate: z.string().optional(),
        labName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.mimeType.includes("pdf") ? "pdf" : "jpg";
        const key = `blood-tests/${ctx.user.id}-${Date.now()}.${ext}`;
        const { url: fileUrl } = await storagePut(key, buffer, input.mimeType);
        const testDate = input.testDate ? new Date(input.testDate) : undefined;
        const record = await db.createBloodTest(ctx.user.id, { fileUrl, testDate, labName: input.labName });
        if (!record) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { id: record.id, fileUrl };
      }),

    analyze: protectedProcedure
      .input(z.object({
        bloodTestId: z.number(),
        manualValuesJson: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const record = await db.getBloodTestById(input.bloodTestId, ctx.user.id);
        if (!record) throw new TRPCError({ code: "NOT_FOUND" });

        const userProfile = await db.getUserProfile(ctx.user.id);
        const manualValues = input.manualValuesJson ? JSON.parse(input.manualValuesJson) : null;
        const contextText = `Perfil: ${userProfile?.gender ?? "no especificado"}, ${userProfile?.age ?? "?"}años, ${userProfile?.weight ?? "?"}kg, objetivo: ${userProfile?.mainGoal ?? "salud general"}.${manualValues ? `\nValores manuales: ${JSON.stringify(manualValues)}` : ""}`;

        const userContent: unknown[] = [];
        if (record.fileUrl) {
          const isImage = /\.(jpg|jpeg|png|webp)$/i.test(record.fileUrl);
          if (isImage) {
            userContent.push({ type: "image_url", image_url: { url: record.fileUrl, detail: "high" } });
          } else {
            userContent.push({ type: "file_url", file_url: { url: record.fileUrl, mime_type: "application/pdf" } });
          }
        }
        userContent.push({
          type: "text",
          text: `${contextText}\n\nAnaliza esta analítica de sangre y devuelve JSON:\n{\n  "extractedValues": [{ "name": "Glucosa", "value": 95, "unit": "mg/dL", "referenceMin": 70, "referenceMax": 100, "status": "normal|bajo|alto|critico", "interpretation": "dentro del rango normal" }],\n  "overallScore": 82,\n  "overallStatus": "bueno|regular|atención|urgente",\n  "keyFindings": ["hallazgo 1"],\n  "nutritionalDeficiencies": ["vitamina D baja"],\n  "recommendations": [{ "priority": "alta|media|baja", "category": "alimentación|suplementos|hábitos|médico", "recommendation": "texto", "foods": ["alimento 1"] }],\n  "menuAdjustments": [{ "mealTime": "desayuno", "suggestion": "Añadir fuentes de vitamina D" }]\n}`,
        });

        const aiResponse = await invokeLLM({
          messages: [
            { role: "system", content: `Eres un médico nutricionista experto en interpretación de analíticas de sangre. Analiza los valores y proporciona recomendaciones nutricionales personalizadas basadas en evidencia científica.` },
            { role: "user", content: userContent as string },
          ],
        });

        let analysis: Record<string, unknown> = {};
        try {
          const content = aiResponse.choices[0]?.message?.content ?? "{}";
          analysis = JSON.parse(content.replace(/```json\n?|```/g, "").trim());
        } catch { analysis = { error: "No se pudo analizar la analítica" }; }

        await db.updateBloodTest(input.bloodTestId, ctx.user.id, {
          extractedValuesJson: JSON.stringify(analysis.extractedValues ?? []),
          analysisJson: JSON.stringify(analysis),
          recommendationsJson: JSON.stringify(analysis.recommendations ?? []),
          menuAdjustmentsJson: JSON.stringify(analysis.menuAdjustments ?? []),
        });
        return analysis;
      }),

    history: protectedProcedure.query(async ({ ctx }) => db.getBloodTestHistory(ctx.user.id)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const record = await db.getBloodTestById(input.id, ctx.user.id);
        if (!record) throw new TRPCError({ code: "NOT_FOUND" });
        return record;
      }),
  }),

  // ===========================================================================
  // MENSTRUAL CYCLE - Nutrición adaptada por fase del ciclo
  // ===========================================================================
  menstrualCycle: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getMenstrualCycleData(ctx.user.id);
    }),
    save: protectedProcedure
      .input(
        z.object({
          trackMenstrualCycle: z.boolean(),
          cycleLength: z.number().min(21).max(45).optional(),
          periodLength: z.number().min(1).max(10).optional(),
          lastPeriodDate: z.string().optional(), // ISO date string YYYY-MM-DD
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserProfile(ctx.user.id, {
          trackMenstrualCycle: input.trackMenstrualCycle,
          menstrualCycleLength: input.cycleLength ?? 28,
          menstrualPeriodLength: input.periodLength ?? 5,
          lastPeriodDate: input.lastPeriodDate ? new Date(input.lastPeriodDate) : undefined,
          updatedAt: new Date(),
        });
        return { success: true };
      }),
  }),
  // ---------------------------------------------------------------------------
  // NEWSLETTER — Suscripción al boletín
  // ---------------------------------------------------------------------------
  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        source: z.string().default("blog"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { newsletterSubscribers } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        // Check if already subscribed
        const existing = await db.select().from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.email, input.email.toLowerCase()))
          .limit(1);
        if (existing.length > 0) {
          // Reactivate if previously unsubscribed
          if (!existing[0].active) {
            await db.update(newsletterSubscribers)
              .set({ active: true, unsubscribedAt: null, name: input.name || existing[0].name })
              .where(eq(newsletterSubscribers.id, existing[0].id));
          }
          return { success: true, message: "already_subscribed" };
        }
        await db.insert(newsletterSubscribers).values({
          email: input.email.toLowerCase(),
          name: input.name || null,
          source: input.source,
        });
        return { success: true, message: "subscribed" };
      }),
  }),
});
export type AppRouter = typeof appRouter;