import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 999,
    openId: "test-user-expiry",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: {
      headers: {},
      cookies: {},
    } as any,
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any,
  };
  return { ctx };
}

describe("inventory.suggestExpirationDate", () => {
  it("returns a date for a known product (leche) using lookup table", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inventory.suggestExpirationDate({ productName: "leche" });

    expect(result).toHaveProperty("expirationDate");
    expect(result).toHaveProperty("daysFromNow");
    expect(result).toHaveProperty("source");

    // leche should be 7 days from lookup table
    expect(result.daysFromNow).toBe(7);
    expect(result.source).toBe("lookup");

    // Date should be a valid ISO date string (YYYY-MM-DD)
    expect(result.expirationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns a date for pasta (long shelf life)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inventory.suggestExpirationDate({ productName: "pasta" });

    expect(result.daysFromNow).toBe(730);
    expect(result.source).toBe("lookup");
  });

  it("returns a date for pollo (short shelf life)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inventory.suggestExpirationDate({ productName: "pollo" });

    expect(result.daysFromNow).toBe(3);
    expect(result.source).toBe("lookup");
  });

  it("returns a date for partial match (pechuga de pollo)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inventory.suggestExpirationDate({ productName: "pechuga de pollo" });

    expect(result.daysFromNow).toBeGreaterThan(0);
    expect(result.source).toBe("lookup");
  });

  it("returns a future date (not in the past)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inventory.suggestExpirationDate({ productName: "yogur" });

    const today = new Date().toISOString().split("T")[0];
    expect(result.expirationDate >= today).toBe(true);
  });

  it("rejects empty product name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.inventory.suggestExpirationDate({ productName: "" })
    ).rejects.toThrow();
  });
});
