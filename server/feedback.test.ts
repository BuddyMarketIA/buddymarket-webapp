import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock de db helpers ───────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    createFeedback: vi.fn(),
    getFeedbacks: vi.fn(),
    updateFeedbackStatus: vi.fn(),
  };
});

// ─── Mock de notifyOwner ──────────────────────────────────────────────────────
vi.mock("./_core/notification.js", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import * as db from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeCtx(user: AuthenticatedUser | null = makeUser()): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("feedback.submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("guarda el feedback y devuelve ok:true con el id", async () => {
    const mockFeedback = { id: 42, userId: 1, category: "bug", message: "El botón no funciona correctamente en iOS.", status: "pending", adminNote: null, createdAt: new Date(), updatedAt: new Date() };
    vi.mocked(db.createFeedback).mockResolvedValue(mockFeedback as ReturnType<typeof db.createFeedback> extends Promise<infer T> ? T : never);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.feedback.submit({
      category: "bug",
      message: "El botón no funciona correctamente en iOS.",
    });

    expect(result).toEqual({ ok: true, id: 42 });
    expect(db.createFeedback).toHaveBeenCalledWith({
      userId: 1,
      category: "bug",
      message: "El botón no funciona correctamente en iOS.",
    });
  });

  it("lanza UNAUTHORIZED si el usuario no está autenticado", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.feedback.submit({ category: "idea", message: "Una idea muy interesante para mejorar." })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("lanza INTERNAL_SERVER_ERROR si createFeedback devuelve null", async () => {
    vi.mocked(db.createFeedback).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.feedback.submit({ category: "improvement", message: "Mejorar la velocidad de carga de la app." })
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  it("valida que el mensaje tenga al menos 10 caracteres", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.feedback.submit({ category: "other", message: "Corto" })
    ).rejects.toThrow();
  });

  it("valida que el mensaje no supere los 500 caracteres", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.feedback.submit({ category: "other", message: "A".repeat(501) })
    ).rejects.toThrow();
  });
});

describe("feedback.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve la lista de feedbacks para un admin", async () => {
    const mockData = { items: [{ id: 1, userId: 2, category: "bug", message: "Error en el login.", status: "pending", adminNote: null, createdAt: new Date(), updatedAt: new Date() }], total: 1 };
    vi.mocked(db.getFeedbacks).mockResolvedValue(mockData as ReturnType<typeof db.getFeedbacks> extends Promise<infer T> ? T : never);

    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "admin" })));
    const result = await caller.feedback.list({ limit: 50, offset: 0 });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(db.getFeedbacks).toHaveBeenCalledWith({ status: undefined, limit: 50, offset: 0 });
  });

  it("lanza FORBIDDEN si el usuario no es admin", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "user" })));
    await expect(
      caller.feedback.list({ limit: 50, offset: 0 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("filtra por status cuando se especifica", async () => {
    vi.mocked(db.getFeedbacks).mockResolvedValue({ items: [], total: 0 });
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "admin" })));
    await caller.feedback.list({ status: "pending", limit: 50, offset: 0 });
    expect(db.getFeedbacks).toHaveBeenCalledWith({ status: "pending", limit: 50, offset: 0 });
  });
});

describe("feedback.updateStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("actualiza el estado del feedback para un admin", async () => {
    const mockUpdated = { id: 1, userId: 2, category: "bug", message: "Error en el login.", status: "reviewed", adminNote: "Revisado y confirmado.", createdAt: new Date(), updatedAt: new Date() };
    vi.mocked(db.updateFeedbackStatus).mockResolvedValue(mockUpdated as ReturnType<typeof db.updateFeedbackStatus> extends Promise<infer T> ? T : never);

    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "admin" })));
    const result = await caller.feedback.updateStatus({ id: 1, status: "reviewed", adminNote: "Revisado y confirmado." });

    expect(result).toEqual({ ok: true });
    expect(db.updateFeedbackStatus).toHaveBeenCalledWith(1, "reviewed", "Revisado y confirmado.");
  });

  it("lanza FORBIDDEN si el usuario no es admin", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "user" })));
    await expect(
      caller.feedback.updateStatus({ id: 1, status: "resolved" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lanza NOT_FOUND si el feedback no existe", async () => {
    vi.mocked(db.updateFeedbackStatus).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "admin" })));
    await expect(
      caller.feedback.updateStatus({ id: 9999, status: "resolved" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
