import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createExpertContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 42,
    openId: "expert-user-openid",
    email: "expert@buddyone.io",
    name: "Dr. García",
    loginMethod: "manus",
    role: "buddyexpert" as any,
    accountType: "buddyexpert",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { headers: {} } as any,
    res: {} as any,
    setCookie: vi.fn(),
    clearCookie: vi.fn(),
  };
  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { headers: {} } as any,
    res: {} as any,
    setCookie: vi.fn(),
    clearCookie: vi.fn(),
  };
  return { ctx };
}

describe("offlinePatients privacy & invite procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOfflineInviteInfo (public)", () => {
    it("should throw NOT_FOUND for invalid token", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // No patient found
      };
      (getDb as any).mockResolvedValue(mockDb);

      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.offlinePatients.getOfflineInviteInfo({ token: "invalid-token-xyz" })
      ).rejects.toThrow("Invitación no válida o expirada");
    });

    it("should return patient info for valid token", async () => {
      const { getDb } = await import("./db");
      const mockPatient = {
        id: 1,
        name: "María García",
        expertUserId: 42,
        inviteToken: "valid-token-abc",
        inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        inviteAcceptedAt: null,
      };
      const mockExpert = { name: "Dr. García", imageUrl: null };

      let callCount = 0;
      const mockDb = {
        select: vi.fn().mockImplementation(() => {
          callCount++;
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue(callCount === 1 ? [mockPatient] : [mockExpert]),
          };
        }),
      };
            (getDb as any).mockResolvedValue(mockDb);
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.offlinePatients.getOfflineInviteInfo({ token: "valid-token-abc" });
      expect(result.patientName).toBe("María García");
      expect(result.alreadyAccepted).toBe(false);
    });
  });

  describe("exportPatients (protected expert)", () => {
    it("should throw FORBIDDEN for non-expert users", async () => {
      const user: AuthenticatedUser = {
        id: 1,
        openId: "regular-user",
        email: "user@example.com",
        name: "Regular User",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
      const ctx: TrpcContext = {
        user,
        req: { headers: {} } as any,
        res: {} as any,
        setCookie: vi.fn(),
        clearCookie: vi.fn(),
      };
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.offlinePatients.exportPatients()
      ).rejects.toThrow("Solo nutricionistas pueden acceder");
    });

    it("should return CSV data for expert users", async () => {
      const { getDb } = await import("./db");
      const mockPatients = [
        {
          id: 1,
          name: "Ana López",
          email: "ana@example.com",
          phone: "+34600000001",
          birthDate: new Date("1990-01-15"),
          gender: "female",
          heightCm: 165,
          initialWeightKg: 70,
          targetWeightKg: 60,
          activityLevel: "moderate",
          objective: "Perder peso",
          allergies: "Gluten",
          pathologies: null,
          medications: null,
          notes: "Paciente motivada",
          consultationFrequencyWeeks: 2,
          inviteSentAt: null,
          inviteAcceptedAt: null,
          createdAt: new Date("2024-01-01"),
          isActive: true,
          expertUserId: 42,
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockPatients),
      };
            (getDb as any).mockReturnValue(mockDb);
      const { ctx } = createExpertContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.offlinePatients.exportPatients();
      expect(result.csv).toContain("Ana López");
      expect(result.csv).toContain("ana@example.com");
      expect(result.stats.total).toBe(1);
      expect(result.filename).toMatch(/pacientes_buddyone_.*\.csv/);
    });
  });

    describe("getPrivacySettings (protected expert)", () => {
    it("should return default settings when none exist", async () => {
      const { getDb } = await import("./db");
      const mockPatient = { id: 1, expertUserId: 42 };

      let callCount = 0;
      // getDb() is async but code calls getDb().select() without await in some places
      // We need a mock that works for both: await getDb() and getDb().select()
      const makeQueryChain = (resolveWith: any[]) => ({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(resolveWith),
        then: (resolve: any) => Promise.resolve(resolveWith).then(resolve),
      });
      const mockDb = {
        select: vi.fn().mockImplementation(() => {
          callCount++;
          return makeQueryChain(callCount === 1 ? [mockPatient] : []);
        }),
        then: (resolve: any) => Promise.resolve(mockDb).then(resolve),
      };
      (getDb as any).mockReturnValue(mockDb);
      const { ctx } = createExpertContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.offlinePatients.getPrivacySettings({ patientId: 1 });
      expect(result.showWeight).toBe(true);
      expect(result.showExpertNotes).toBe(false);
      expect(result.showAssignedMenus).toBe(true);
    });
  });
});
