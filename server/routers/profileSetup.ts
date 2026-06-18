import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  profileApplications,
  organizationProfiles,
  onboardingProgress,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const APPROVAL_REQUIRED = ["buddyexpert", "buddymaker", "colaborador"] as const;
const ORG_TYPES = ["empresa", "clinica_vet"] as const;

function requiresApproval(pt: string): boolean {
  return (APPROVAL_REQUIRED as readonly string[]).includes(pt);
}
function isOrgType(pt: string): boolean {
  return (ORG_TYPES as readonly string[]).includes(pt);
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const profileSetupRouter = router({

  /** Get the current user's profile setup status */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [user] = await db.select({
      id: users.id,
      role: users.role,
      accountType: users.accountType,
      registrationStep: users.registrationStep,
      onboardingCompleted: users.onboardingCompleted,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    const [application] = await db.select().from(profileApplications)
      .where(eq(profileApplications.userId, ctx.user.id))
      .orderBy(desc(profileApplications.createdAt))
      .limit(1);

    const [orgProfile] = await db.select().from(organizationProfiles)
      .where(eq(organizationProfiles.userId, ctx.user.id))
      .limit(1);

    const [onboarding] = await db.select().from(onboardingProgress)
      .where(eq(onboardingProgress.userId, ctx.user.id))
      .limit(1);

    return { user: user ?? null, application: application ?? null, orgProfile: orgProfile ?? null, onboarding: onboarding ?? null };
  }),

  /** Step 1: User selects their profile type */
  selectProfileType: protectedProcedure
    .input(z.object({
      profileType: z.enum(["user", "buddyexpert", "buddymaker", "empresa", "clinica_vet", "colaborador"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { profileType } = input;

      if (profileType === "user") {
        await db.update(users)
          .set({ registrationStep: "profile_setup", accountType: "user", updatedAt: new Date() })
          .where(eq(users.id, ctx.user.id));
        return { status: "profile_setup", requiresApproval: false };
      }

      if (isOrgType(profileType)) {
        await db.update(users)
          .set({ registrationStep: "profile_setup", updatedAt: new Date() })
          .where(eq(users.id, ctx.user.id));
        return { status: "org_form", requiresApproval: false, profileType };
      }

      if (requiresApproval(profileType)) {
        const [existing] = await db.select().from(profileApplications)
          .where(and(
            eq(profileApplications.userId, ctx.user.id),
            eq(profileApplications.profileType, profileType as any),
          )).limit(1);

        if (!existing) {
          await db.insert(profileApplications).values({
            userId: ctx.user.id,
            profileType: profileType as any,
            status: "pending",
          });
        }

        await db.update(users)
          .set({ registrationStep: "application", updatedAt: new Date() })
          .where(eq(users.id, ctx.user.id));

        return { status: "application", requiresApproval: true, profileType };
      }

      return { status: "unknown" };
    }),

  /** Step 2a: Submit application details for buddyexpert/buddymaker/colaborador */
  submitApplication: protectedProcedure
    .input(z.object({
      profileType: z.enum(["buddyexpert", "buddymaker", "colaborador"]),
      motivation: z.string().min(10).max(2000),
      experience: z.string().max(2000).optional(),
      socialLinks: z.object({
        instagram: z.string().optional(),
        website: z.string().optional(),
        youtube: z.string().optional(),
        linkedin: z.string().optional(),
      }).optional(),
      specialties: z.array(z.string()).optional(),
      certifications: z.array(z.string()).optional(),
      portfolioUrl: z.string().url().optional().or(z.literal("")),
      referralNetwork: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { profileType, socialLinks, specialties, certifications, ...rest } = input;

      await db.update(profileApplications)
        .set({
          motivation: rest.motivation,
          experience: rest.experience ?? null,
          socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
          specialties: specialties ? JSON.stringify(specialties) : null,
          certifications: certifications ? JSON.stringify(certifications) : null,
          portfolioUrl: rest.portfolioUrl || null,
          referralNetwork: rest.referralNetwork ?? null,
          status: "pending",
          updatedAt: new Date(),
        })
        .where(and(
          eq(profileApplications.userId, ctx.user.id),
          eq(profileApplications.profileType, profileType as any),
        ));

      await db.update(users)
        .set({ registrationStep: "pending_approval", updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));

      const [user] = await db.select({ name: users.name, email: users.email })
        .from(users).where(eq(users.id, ctx.user.id)).limit(1);

      await notifyOwner({
        title: `Nueva solicitud de ${profileType}`,
        content: `${user?.name ?? "Usuario"} (${user?.email ?? ""}) ha solicitado el perfil ${profileType}. Revisa el panel de administración.`,
      });

      return { success: true };
    }),

  /** Step 2b: Submit organization profile for empresa/clinica_vet */
  submitOrgProfile: protectedProcedure
    .input(z.object({
      profileType: z.enum(["empresa", "clinica_vet"]),
      organizationName: z.string().min(2).max(256),
      cif: z.string().max(20).optional(),
      address: z.string().max(500).optional(),
      city: z.string().max(128).optional(),
      postalCode: z.string().max(10).optional(),
      country: z.string().max(64).optional(),
      phone: z.string().max(32).optional(),
      website: z.string().url().optional().or(z.literal("")),
      employeeCount: z.number().int().min(1).optional(),
      sector: z.string().max(128).optional(),
      licenseCount: z.number().int().min(1).optional(),
      contactPersonName: z.string().max(128).optional(),
      contactPersonEmail: z.string().email().optional().or(z.literal("")),
      contactPersonPhone: z.string().max(32).optional(),
      vetLicenseNumber: z.string().max(64).optional(),
      specializations: z.array(z.string()).optional(),
      vetCount: z.number().int().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { profileType, specializations, ...rest } = input;

      const [existing] = await db.select({ id: organizationProfiles.id })
        .from(organizationProfiles)
        .where(eq(organizationProfiles.userId, ctx.user.id))
        .limit(1);

      const orgData = {
        userId: ctx.user.id,
        profileType: profileType as any,
        organizationName: rest.organizationName,
        cif: rest.cif ?? null,
        address: rest.address ?? null,
        city: rest.city ?? null,
        postalCode: rest.postalCode ?? null,
        country: rest.country ?? "España",
        phone: rest.phone ?? null,
        website: rest.website || null,
        employeeCount: rest.employeeCount ?? null,
        sector: rest.sector ?? null,
        licenseCount: rest.licenseCount ?? 0,
        contactPersonName: rest.contactPersonName ?? null,
        contactPersonEmail: rest.contactPersonEmail || null,
        contactPersonPhone: rest.contactPersonPhone ?? null,
        vetLicenseNumber: rest.vetLicenseNumber ?? null,
        specializations: specializations ? JSON.stringify(specializations) : null,
        vetCount: rest.vetCount ?? null,
        updatedAt: new Date(),
      };

      if (existing) {
        await db.update(organizationProfiles).set(orgData).where(eq(organizationProfiles.userId, ctx.user.id));
      } else {
        await db.insert(organizationProfiles).values({ ...orgData, createdAt: new Date() });
      }

      const accountType = profileType === "empresa" ? "business" : "user";
      const role = profileType === "empresa" ? "business" : "user";

      await db.update(users)
        .set({
          accountType: accountType as any,
          role: role as any,
          registrationStep: "completed",
          onboardingCompleted: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true, profileType };
    }),

  /** Mark onboarding tour step as seen */
  updateOnboardingProgress: protectedProcedure
    .input(z.object({
      profileType: z.enum(["user", "buddyexpert", "buddymaker", "empresa", "clinica_vet", "colaborador"]),
      stepId: z.string(),
      completed: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [existing] = await db.select().from(onboardingProgress)
        .where(eq(onboardingProgress.userId, ctx.user.id)).limit(1);

      if (existing) {
        const steps = existing.completedSteps ?? [];
        const newSteps = steps.includes(input.stepId) ? steps : [...steps, input.stepId];
        await db.update(onboardingProgress)
          .set({
            completedSteps: newSteps,
            tourCompleted: input.completed ?? existing.tourCompleted,
            tourCompletedAt: input.completed ? new Date() : existing.tourCompletedAt,
            updatedAt: new Date(),
          })
          .where(eq(onboardingProgress.userId, ctx.user.id));
      } else {
        await db.insert(onboardingProgress).values({
          userId: ctx.user.id,
          profileType: input.profileType as any,
          completedSteps: [input.stepId],
          tourCompleted: input.completed ?? false,
          tourCompletedAt: input.completed ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return { success: true };
    }),

  /** Complete the onboarding tour */
  completeTour: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    await db.update(onboardingProgress)
      .set({ tourCompleted: true, tourCompletedAt: new Date(), updatedAt: new Date() })
      .where(eq(onboardingProgress.userId, ctx.user.id));

    await db.update(users)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id));

    return { success: true };
  }),

  /** Restart the onboarding tour */
  restartTour: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    await db.update(onboardingProgress)
      .set({ tourCompleted: false, completedSteps: [], tourRestartedAt: new Date(), updatedAt: new Date() })
      .where(eq(onboardingProgress.userId, ctx.user.id));

    await db.update(users)
      .set({ onboardingCompleted: false, updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id));

    return { success: true };
  }),

  // ─── Admin procedures ───────────────────────────────────────────────────────

  /** List all pending profile applications (admin only) */
  listApplications: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      profileType: z.enum(["buddyexpert", "buddymaker", "colaborador"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      let allApps = await db.select().from(profileApplications)
        .orderBy(desc(profileApplications.createdAt));

      if (input?.status) {
        allApps = allApps.filter((a: typeof allApps[0]) => a.status === input.status);
      }
      if (input?.profileType) {
        allApps = allApps.filter((a: typeof allApps[0]) => a.profileType === input.profileType);
      }

      const enriched = await Promise.all(
        allApps.map(async (app: typeof allApps[0]) => {
          const [user] = await db.select({
            id: users.id, name: users.name, email: users.email,
            imageUrl: users.imageUrl, createdAt: users.createdAt,
          }).from(users).where(eq(users.id, app.userId)).limit(1);
          return { ...app, user: user ?? null };
        }),
      );

      return enriched;
    }),

  /** Approve or reject a profile application (admin only) */
  reviewApplication: adminProcedure
    .input(z.object({
      applicationId: z.number().int(),
      action: z.enum(["approve", "reject"]),
      reviewNote: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [app] = await db.select().from(profileApplications)
        .where(eq(profileApplications.id, input.applicationId)).limit(1);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });

      const newStatus = input.action === "approve" ? "approved" : "rejected";

      await db.update(profileApplications)
        .set({
          status: newStatus as any,
          reviewNote: input.reviewNote ?? null,
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
          updatedAt: new Date(),
        })
        .where(eq(profileApplications.id, input.applicationId));

      if (input.action === "approve") {
        const roleMap: Record<string, { role: string; accountType: string }> = {
          buddyexpert: { role: "buddyexpert", accountType: "buddyexpert" },
          buddymaker: { role: "buddymaker", accountType: "buddymaker" },
          colaborador: { role: "user", accountType: "user" },
        };
        const mapping = roleMap[app.profileType] ?? { role: "user", accountType: "user" };

        await db.update(users)
          .set({
            role: mapping.role as any,
            accountType: mapping.accountType as any,
            registrationStep: "completed",
            onboardingCompleted: false,
            updatedAt: new Date(),
          })
          .where(eq(users.id, app.userId));
      } else {
        await db.update(users)
          .set({ registrationStep: "account_type", updatedAt: new Date() })
          .where(eq(users.id, app.userId));
      }

      return { success: true, action: input.action };
    }),
});
