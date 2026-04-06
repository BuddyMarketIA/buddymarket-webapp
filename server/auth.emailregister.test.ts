import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ─────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  upsertUser: vi.fn(),
  updateUser: vi.fn(),
  getDb: vi.fn().mockResolvedValue(null), // no drizzle in unit tests
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

function createPublicContext(): TrpcContext {
  const cookies: Record<string, unknown> = {};
  return {
    user: null,
    req: {
      headers: { origin: "http://localhost:3000" },
      cookies: {},
    } as any,
    res: {
      cookie: vi.fn((name: string, value: string, opts: unknown) => {
        cookies[name] = value;
      }),
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("auth.register — email/password registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects registration if email already exists", async () => {
    const db = await import("./db");
    (db.getUserByEmail as any).mockResolvedValue({
      id: 1,
      email: "existing@example.com",
      passwordHash: "$2b$12$existing",
    });

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.register({
        name: "Test User",
        email: "existing@example.com",
        password: "Password123!",
      })
    ).rejects.toThrow("Ya existe una cuenta");
  });

  it("rejects registration with password shorter than 8 characters", async () => {
    const db = await import("./db");
    (db.getUserByEmail as any).mockResolvedValue(null);

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.register({
        name: "Test User",
        email: "new@example.com",
        password: "short",
      })
    ).rejects.toThrow();
  });

  it("rejects registration with name shorter than 2 characters", async () => {
    const db = await import("./db");
    (db.getUserByEmail as any).mockResolvedValue(null);

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.register({
        name: "A",
        email: "new@example.com",
        password: "Password123!",
      })
    ).rejects.toThrow();
  });

  it("rejects registration with invalid email format", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.register({
        name: "Test User",
        email: "not-an-email",
        password: "Password123!",
      })
    ).rejects.toThrow();
  });
});

describe("auth.login — email/password login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects login if user does not exist", async () => {
    const db = await import("./db");
    (db.getUserByEmail as any).mockResolvedValue(null);

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.login({
        email: "nonexistent@example.com",
        password: "Password123!",
      })
    ).rejects.toThrow("Email o contraseña incorrectos");
  });

  it("rejects login if user has no passwordHash (OTP-only account)", async () => {
    const db = await import("./db");
    (db.getUserByEmail as any).mockResolvedValue({
      id: 2,
      email: "otp@example.com",
      passwordHash: null,
      openId: "email:otp@example.com",
      name: "OTP User",
    });

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.login({
        email: "otp@example.com",
        password: "Password123!",
      })
    ).rejects.toThrow("código OTP");
  });

  it("rejects login with wrong password", async () => {
    const db = await import("./db");
    const bcrypt = await import("bcryptjs");
    (db.getUserByEmail as any).mockResolvedValue({
      id: 3,
      email: "user@example.com",
      passwordHash: "$2b$12$hashedpassword",
      openId: "email:user@example.com",
      name: "Test User",
    });
    (bcrypt.default.compare as any).mockResolvedValue(false);

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.login({
        email: "user@example.com",
        password: "WrongPassword!",
      })
    ).rejects.toThrow("Email o contraseña incorrectos");
  });

  it("rejects login with invalid email format", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.login({
        email: "not-valid",
        password: "Password123!",
      })
    ).rejects.toThrow();
  });
});
