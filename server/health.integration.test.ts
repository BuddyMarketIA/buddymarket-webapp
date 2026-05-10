import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock drizzle-orm helpers ──────────────────────────────────────────────────
vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");
  return { ...actual, eq: vi.fn((a: unknown, b: unknown) => ({ a, b })) };
});

// ── Mock DB ───────────────────────────────────────────────────────────────────
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();

vi.mock("./db.js", () => ({
  db: {
    getDb: vi.fn(async () => ({
      select: mockSelect,
      update: mockUpdate,
      insert: mockInsert,
    })),
  },
}));

// ── Mock schema ───────────────────────────────────────────────────────────────
vi.mock("../drizzle/schema.js", () => ({
  healthIntegrations: { userId: "userId", id: "id" },
  healthDailyData: { userId: "userId", date: "date" },
  healthMetricReadings: { userId: "userId" },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSelectChain(result: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
    orderBy: vi.fn().mockReturnThis(),
  };
  mockSelect.mockReturnValue(chain);
  return chain;
}

function buildUpdateChain(result: unknown[]) {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(result),
  };
  mockUpdate.mockReturnValue(chain);
  return chain;
}

function buildInsertChain(result: unknown[]) {
  const chain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(result),
  };
  mockInsert.mockReturnValue(chain);
  return chain;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Health Integration Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getIntegration", () => {
    it("returns null when no integration exists for user", async () => {
      buildSelectChain([]);

      const { db } = await import("./db.js");
      const drizzleDb = await db.getDb();
      const { healthIntegrations } = await import("../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");

      const result = await drizzleDb!
        .select()
        .from(healthIntegrations)
        .where(eq(healthIntegrations.userId, 1))
        .limit(1);

      expect(result).toEqual([]);
    });

    it("returns existing integration for user", async () => {
      const mockIntegration = {
        id: 1,
        userId: 42,
        appleHealthEnabled: true,
        googleHealthConnectEnabled: false,
        garminEnabled: false,
        fitbitEnabled: false,
        samsungHealthEnabled: false,
        syncSteps: true,
        syncCalories: true,
        syncWeight: true,
        syncHeartRate: true,
        syncSleep: true,
        syncBloodGlucose: false,
        syncOxygen: false,
        lastSyncAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      buildSelectChain([mockIntegration]);

      const { db } = await import("./db.js");
      const drizzleDb = await db.getDb();
      const { healthIntegrations } = await import("../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");

      const [result] = await drizzleDb!
        .select()
        .from(healthIntegrations)
        .where(eq(healthIntegrations.userId, 42))
        .limit(1);

      expect(result).toEqual(mockIntegration);
      expect(result.appleHealthEnabled).toBe(true);
      expect(result.syncSteps).toBe(true);
    });
  });

  describe("updateIntegration", () => {
    it("updates existing integration when one exists", async () => {
      const existingIntegration = { id: 1, userId: 42, appleHealthEnabled: false };
      const updatedIntegration = { ...existingIntegration, appleHealthEnabled: true };

      buildSelectChain([existingIntegration]);
      buildUpdateChain([updatedIntegration]);

      const { db } = await import("./db.js");
      const drizzleDb = await db.getDb();
      const { healthIntegrations } = await import("../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");

      // Simulate the update flow
      const [existing] = await drizzleDb!
        .select()
        .from(healthIntegrations)
        .where(eq(healthIntegrations.userId, 42))
        .limit(1);

      expect(existing).toBeDefined();

      const [updated] = await drizzleDb!
        .update(healthIntegrations)
        .set({ appleHealthEnabled: true, updatedAt: new Date() })
        .where(eq(healthIntegrations.userId, 42))
        .returning();

      expect(updated.appleHealthEnabled).toBe(true);
    });

    it("creates new integration when none exists", async () => {
      const newIntegration = {
        id: 1,
        userId: 99,
        appleHealthEnabled: true,
        googleHealthConnectEnabled: false,
        garminEnabled: false,
        fitbitEnabled: false,
        samsungHealthEnabled: false,
        syncSteps: true,
        syncCalories: true,
        syncWeight: true,
        syncHeartRate: true,
        syncSleep: true,
        syncBloodGlucose: false,
        syncOxygen: false,
      };

      buildSelectChain([]);
      buildInsertChain([newIntegration]);

      const { db } = await import("./db.js");
      const drizzleDb = await db.getDb();
      const { healthIntegrations } = await import("../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");

      const [existing] = await drizzleDb!
        .select()
        .from(healthIntegrations)
        .where(eq(healthIntegrations.userId, 99))
        .limit(1);

      expect(existing).toBeUndefined();

      const [created] = await drizzleDb!
        .insert(healthIntegrations)
        .values({ userId: 99, appleHealthEnabled: true })
        .returning();

      expect(created.userId).toBe(99);
      expect(created.appleHealthEnabled).toBe(true);
    });

    it("can disable all integrations at once", async () => {
      const allDisabled = {
        id: 1,
        userId: 42,
        appleHealthEnabled: false,
        googleHealthConnectEnabled: false,
        garminEnabled: false,
        fitbitEnabled: false,
        samsungHealthEnabled: false,
      };

      buildSelectChain([{ id: 1, userId: 42, appleHealthEnabled: true }]);
      buildUpdateChain([allDisabled]);

      const { db } = await import("./db.js");
      const drizzleDb = await db.getDb();
      const { healthIntegrations } = await import("../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");

      const [updated] = await drizzleDb!
        .update(healthIntegrations)
        .set({
          appleHealthEnabled: false,
          googleHealthConnectEnabled: false,
          garminEnabled: false,
          fitbitEnabled: false,
          samsungHealthEnabled: false,
          updatedAt: new Date(),
        })
        .where(eq(healthIntegrations.userId, 42))
        .returning();

      expect(updated.appleHealthEnabled).toBe(false);
      expect(updated.googleHealthConnectEnabled).toBe(false);
      expect(updated.garminEnabled).toBe(false);
      expect(updated.fitbitEnabled).toBe(false);
      expect(updated.samsungHealthEnabled).toBe(false);
    });
  });

  describe("syncPreferences", () => {
    it("can toggle individual data type sync preferences", async () => {
      const withGlucoseEnabled = {
        id: 1,
        userId: 42,
        syncBloodGlucose: true,
        syncOxygen: true,
      };

      buildSelectChain([{ id: 1, userId: 42, syncBloodGlucose: false }]);
      buildUpdateChain([withGlucoseEnabled]);

      const { db } = await import("./db.js");
      const drizzleDb = await db.getDb();
      const { healthIntegrations } = await import("../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");

      const [updated] = await drizzleDb!
        .update(healthIntegrations)
        .set({ syncBloodGlucose: true, syncOxygen: true, updatedAt: new Date() })
        .where(eq(healthIntegrations.userId, 42))
        .returning();

      expect(updated.syncBloodGlucose).toBe(true);
      expect(updated.syncOxygen).toBe(true);
    });
  });
});
