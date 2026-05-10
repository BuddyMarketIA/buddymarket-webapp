import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createExpertContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 99,
    openId: "expert-user-99",
    email: "expert@example.com",
    name: "Expert User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("expertPlans.searchClientByEmail", () => {
  it("throws UNAUTHORIZED when user is not logged in", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.expertPlans.searchClientByEmail({ email: "client@example.com" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws FORBIDDEN when logged-in user is not a BuddyExpert", async () => {
    const ctx = createExpertContext({ id: 9999 });
    const caller = appRouter.createCaller(ctx);
    // User 9999 has no buddyExpert profile → FORBIDDEN
    await expect(
      caller.expertPlans.searchClientByEmail({ email: "client@example.com" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("expertPlans.updateStatus", () => {
  it("throws UNAUTHORIZED when user is not logged in", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.expertPlans.updateStatus({ planId: 1, status: "active" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws FORBIDDEN when logged-in user is not a BuddyExpert", async () => {
    const ctx = createExpertContext({ id: 9999 });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.expertPlans.updateStatus({ planId: 1, status: "active" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("expertPlans.myPlans", () => {
  it("throws UNAUTHORIZED when user is not logged in", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.expertPlans.myPlans({ status: "all" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("expertPlans.create", () => {
  it("throws UNAUTHORIZED when user is not logged in", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.expertPlans.create({ title: "Test Plan" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws FORBIDDEN when logged-in user is not a BuddyExpert", async () => {
    const ctx = createExpertContext({ id: 9999 });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.expertPlans.create({ title: "Test Plan" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
