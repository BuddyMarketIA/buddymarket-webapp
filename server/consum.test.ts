import { describe, it, expect } from "vitest";

describe("Consum router", () => {
  it("should have consum router defined in appRouter", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("consum.searchProducts");
    expect(appRouter._def.procedures).toHaveProperty("consum.categories");
    expect(appRouter._def.procedures).toHaveProperty("consum.byCategory");
  });

  it("should have consum_products table in schema with expected columns", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.consumProducts).toBeDefined();
    // Verify it's a Drizzle table with expected columns
    const cols = Object.keys(schema.consumProducts);
    expect(cols).toContain("id");
    expect(cols).toContain("name");
    expect(cols).toContain("image");
    expect(cols).toContain("price");
    expect(cols).toContain("category");
  });
});
