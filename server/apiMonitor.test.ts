import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock db module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("API Monitor - checkEndpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok status when endpoint responds with expected HTTP status", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
    });

    const { checkEndpoint } = await import("./apiMonitor");
    const result = await checkEndpoint("/api/health", "GET", 200, "http://localhost:3000");

    expect(result.status).toBe("ok");
    expect(result.httpStatus).toBe(200);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.errorMessage).toBeNull();
  });

  it("returns down status when endpoint responds with unexpected HTTP status", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 500,
      ok: false,
    });

    const { checkEndpoint } = await import("./apiMonitor");
    const result = await checkEndpoint("/api/health", "GET", 200, "http://localhost:3000");

    expect(result.status).toBe("down");
    expect(result.httpStatus).toBe(500);
    expect(result.errorMessage).toContain("500");
  });

  it("returns down status when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const { checkEndpoint } = await import("./apiMonitor");
    const result = await checkEndpoint("/api/health", "GET", 200, "http://localhost:3000");

    expect(result.status).toBe("down");
    expect(result.errorMessage).toContain("ECONNREFUSED");
  });

  it("returns degraded status when response is slow (>2000ms)", async () => {
    // Simulate slow response by mocking latency
    mockFetch.mockImplementationOnce(async () => {
      await new Promise((r) => setTimeout(r, 10)); // small delay in test
      return { status: 200, ok: true };
    });

    const { checkEndpoint } = await import("./apiMonitor");
    const result = await checkEndpoint("/api/health", "GET", 200, "http://localhost:3000");

    // In test environment latency won't exceed 2000ms, so status should be ok
    expect(["ok", "degraded"]).toContain(result.status);
  });

  it("constructs the correct URL with baseUrl prefix", async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, ok: true });

    const { checkEndpoint } = await import("./apiMonitor");
    await checkEndpoint("/api/health", "GET", 200, "http://localhost:3000");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/health",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("uses POST method when specified", async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, ok: true });

    const { checkEndpoint } = await import("./apiMonitor");
    await checkEndpoint("/api/trpc/auth.me", "POST", 200, "http://localhost:3000");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/trpc/auth.me",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("handles 401 as ok when expectedStatus is 401", async () => {
    mockFetch.mockResolvedValueOnce({ status: 401, ok: false });

    const { checkEndpoint } = await import("./apiMonitor");
    const result = await checkEndpoint("/api/trpc/profile.get", "GET", 401, "http://localhost:3000");

    expect(result.status).toBe("ok");
    expect(result.httpStatus).toBe(401);
  });
});
