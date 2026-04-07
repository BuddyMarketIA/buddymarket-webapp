/**
 * Tests for the founder email auto-PRO activation flow.
 * When a user registers with an email in the founder_emails table,
 * they should automatically receive 1 year of PRO access.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/// ─── Mock DB helpers ────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  upsertUser: vi.fn(),
  updateUser: vi.fn(),
  upsertUserSubscription: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn(),
}));

// ─── Mock bcrypt ──────────────────────────────────────────────────────────────
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$hashedpassword"),
    compare: vi.fn(),
  },
}));

// ─── Mock SDK ─────────────────────────────────────────────────────────────────
vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-session-token"),
  },
}));

// ─── Mock email module ────────────────────────────────────────────────────────
vi.mock("./email.js", () => ({
  sendFounderWelcomeEmail: vi.fn().mockResolvedValue(true),
}));

// ─── Drizzle mock helpers ─────────────────────────────────────────────────────
function createDrizzleMock(founderRows: any[], isFounderEmail: boolean) {
  const updateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  const insertChain = {
    values: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  };
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(founderRows),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue(updateChain),
    insert: vi.fn().mockReturnValue(insertChain),
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      headers: { origin: "http://localhost:3000" },
      cookies: {},
    } as any,
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("Founder email — auto PRO activation on register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("activates PRO for 1 year when registering with a founder email", async () => {
    const db = await import("./db");

    // User doesn't exist yet
    (db.getUserByEmail as any).mockResolvedValue(null);
    // After upsertUser, getUserByEmail returns the new user
    (db.getUserByEmail as any)
      .mockResolvedValueOnce(null) // first call: check existing
      .mockResolvedValueOnce({ id: 42, email: "founder@example.com", name: "Founder User" }); // second call: get new user

    // Drizzle mock: founder record exists and is unclaimed
    const founderRecord = [{ id: 1, email: "founder@example.com", claimedAt: null, claimedByUserId: null }];
    const drizzleMock = createDrizzleMock(founderRecord, true);
    (db.getDb as any).mockResolvedValue(drizzleMock);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.register({
      name: "Founder User",
      email: "founder@example.com",
      password: "Password123!",
    });

    expect(result.success).toBe(true);
    expect(result.isFounder).toBe(true);
    const dbMod = await import("./db");
    expect(dbMod.upsertUserSubscription).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        status: "active",
        plan: "premium",
      })
    );
  });

  it("does NOT activate PRO for a non-founder email", async () => {
    const db = await import("./db");

    (db.getUserByEmail as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 99, email: "regular@example.com", name: "Regular User" });

    // Drizzle mock: no founder record found
    const drizzleMock = createDrizzleMock([], false);
    (db.getDb as any).mockResolvedValue(drizzleMock);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.register({
      name: "Regular User",
      email: "regular@example.com",
      password: "Password123!",
    });

    expect(result.success).toBe(true);
    expect(result.isFounder).toBe(false);
    const dbMod2 = await import("./db");
    expect(dbMod2.upsertUserSubscription).not.toHaveBeenCalled();
  });

  it("does NOT activate PRO if founder email was already claimed", async () => {
    const db = await import("./db");

    (db.getUserByEmail as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 55, email: "claimed@example.com", name: "Claimed User" });

    // Drizzle mock: founder record exists but already claimed
    const founderRecord = [{ id: 2, email: "claimed@example.com", claimedAt: new Date("2026-01-01"), claimedByUserId: 10 }];
    const drizzleMock = createDrizzleMock(founderRecord, true);
    (db.getDb as any).mockResolvedValue(drizzleMock);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.register({
      name: "Claimed User",
      email: "claimed@example.com",
      password: "Password123!",
    });

    expect(result.success).toBe(true);
    expect(result.isFounder).toBe(false);
    const dbMod3 = await import("./db");
    expect(dbMod3.upsertUserSubscription).not.toHaveBeenCalled();
  });

  it("still registers successfully even if founder check throws an error", async () => {
    const db = await import("./db");

    (db.getUserByEmail as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 77, email: "error@example.com", name: "Error User" });

    // First getDb call (for passwordHash update) returns null (skipped safely)
    // Second getDb call (for founder check) throws an error
    (db.getDb as any)
      .mockResolvedValueOnce(null) // passwordHash update — null means skipped
      .mockRejectedValueOnce(new Error("DB connection error")); // founder check — throws

    const caller = appRouter.createCaller(createPublicContext());
    // Should not throw — founder check errors are non-critical
    const result = await caller.auth.register({
      name: "Error User",
      email: "error@example.com",
      password: "Password123!",
    });

    expect(result.success).toBe(true);
    const dbMod4 = await import("./db");
    expect(dbMod4.upsertUserSubscription).not.toHaveBeenCalled();
  });
});
