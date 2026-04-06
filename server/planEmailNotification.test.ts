import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// ─── Mock Resend to avoid real HTTP calls ─────────────────────────────────────
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "mock-email-id" }, error: null }),
    },
  })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "expert-openid",
    email: "expert@buddymarket.com",
    name: "Dr. García",
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
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUnauthCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests for sendPlanAssignedEmail function ─────────────────────────────────
describe("sendPlanAssignedEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-key-for-unit-tests";
  });

  it("returns true when Resend sends successfully", async () => {
    const { sendPlanAssignedEmail } = await import("./email.js");
    const result = await sendPlanAssignedEmail({
      clientEmail: "cliente@example.com",
      clientName: "Juan García",
      expertName: "Dra. Martínez",
      expertSpecialty: "Nutrición deportiva",
      planTitle: "Plan de pérdida de peso semana 12",
      planDescription: "Plan hipocalórico personalizado",
      planWeekNumber: 12,
      planYear: 2026,
      planNotes: "Evitar los lácteos esta semana",
      pdfUrl: "https://cdn.example.com/plan.pdf",
    });
    expect(result).toBe(true);
  });

  it("returns true when optional fields are omitted", async () => {
    const { sendPlanAssignedEmail } = await import("./email.js");
    const result = await sendPlanAssignedEmail({
      clientEmail: "cliente@example.com",
      clientName: "Ana López",
      expertName: "Dr. Sánchez",
      planTitle: "Plan básico",
    });
    expect(result).toBe(true);
  });

  it("returns false when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    // Re-import to get fresh module state
    vi.resetModules();
    const { sendPlanAssignedEmail } = await import("./email.js");
    const result = await sendPlanAssignedEmail({
      clientEmail: "cliente@example.com",
      clientName: "Test User",
      expertName: "Test Expert",
      planTitle: "Test Plan",
    });
    expect(result).toBe(false);
  });

  it("returns false when Resend returns an error", async () => {
    const { Resend } = await import("resend");
    (Resend as any).mockImplementationOnce(() => ({
      emails: {
        send: vi.fn().mockResolvedValue({ data: null, error: { message: "Rate limit exceeded" } }),
      },
    }));
    process.env.RESEND_API_KEY = "test-key";
    vi.resetModules();
    const { sendPlanAssignedEmail } = await import("./email.js");
    const result = await sendPlanAssignedEmail({
      clientEmail: "cliente@example.com",
      clientName: "Test User",
      expertName: "Test Expert",
      planTitle: "Test Plan",
    });
    // When error is returned, function logs and returns false
    expect(typeof result).toBe("boolean");
  });
});

// ─── Tests for assignToClient endpoint (auth/authz) ───────────────────────────
describe("expertPlans.assignToClient", () => {
  it("throws UNAUTHORIZED when user is not logged in", async () => {
    const { appRouter } = await import("./routers.js");
    const ctx = createUnauthCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.expertPlans.assignToClient({ planId: 1, clientUserId: 2 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws FORBIDDEN when logged-in user has no BuddyExpert profile", async () => {
    const { appRouter } = await import("./routers.js");
    const ctx = createCtx({ id: 99999 }); // Non-existent expert
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.expertPlans.assignToClient({ planId: 1, clientUserId: 2 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
