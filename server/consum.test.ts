import { describe, it, expect } from "vitest";

describe("Consum router", () => {
  it("should have consum router defined in appRouter with all endpoints", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("consum.searchProducts");
    expect(appRouter._def.procedures).toHaveProperty("consum.categories");
    expect(appRouter._def.procedures).toHaveProperty("consum.byCategory");
    expect(appRouter._def.procedures).toHaveProperty("consum.priceRange");
  });

  it("should have consum_products table in schema with expected columns", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.consumProducts).toBeDefined();
    const cols = Object.keys(schema.consumProducts);
    expect(cols).toContain("id");
    expect(cols).toContain("name");
    expect(cols).toContain("image");
    expect(cols).toContain("price");
    expect(cols).toContain("category");
  });

  it("searchProducts procedure is callable", async () => {
    const { appRouter } = await import("./routers");
    const procedure = (appRouter._def.procedures as any)["consum.searchProducts"];
    expect(procedure).toBeDefined();
    // tRPC procedures are functions
    expect(typeof procedure).toBe("function");
  });

  it("byCategory procedure is callable", async () => {
    const { appRouter } = await import("./routers");
    const procedure = (appRouter._def.procedures as any)["consum.byCategory"];
    expect(procedure).toBeDefined();
    expect(typeof procedure).toBe("function");
  });

  it("priceRange procedure is callable", async () => {
    const { appRouter } = await import("./routers");
    const procedure = (appRouter._def.procedures as any)["consum.priceRange"];
    expect(procedure).toBeDefined();
    expect(typeof procedure).toBe("function");
  });
});
