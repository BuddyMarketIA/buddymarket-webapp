import { describe, it, expect } from "vitest";
import { normalizeToCommercialUnit, findCommercialUnit } from "../shared/supermarketUnits";

describe("normalizeToCommercialUnit", () => {
  it("jamón serrano → 1 sobre (100 g)", () => {
    const result = normalizeToCommercialUnit("Jamón serrano", 30, "g");
    expect(result.hasCommercialUnit).toBe(true);
    expect(result.label).toBe("1 sobre (100 g)");
    expect(result.quantity).toBe(1);
  });

  it("aceite de oliva (5 ml) → 1 botella", () => {
    const result = normalizeToCommercialUnit("aceite de oliva", 5, "ml");
    expect(result.hasCommercialUnit).toBe(true);
    expect(result.quantity).toBe(1);
    expect(result.label).toContain("botella");
  });

  it("pechuga de pollo (600 g) → 2 bandejas de 500 g", () => {
    const result = normalizeToCommercialUnit("pechuga de pollo", 600, "g");
    expect(result.hasCommercialUnit).toBe(true);
    expect(result.quantity).toBe(2);
  });

  it("ingrediente desconocido → sin unidad comercial", () => {
    const result = normalizeToCommercialUnit("polvo de unicornio", 50, "g");
    expect(result.hasCommercialUnit).toBe(false);
    expect(result.quantity).toBe(50);
  });

  it("leche entera (250 ml) → 1 brick 1 L", () => {
    const result = normalizeToCommercialUnit("leche entera", 250, "ml");
    expect(result.hasCommercialUnit).toBe(true);
    expect(result.quantity).toBe(1);
    expect(result.label).toContain("brick");
  });

  it("huevos (2 ud) → 1 docena", () => {
    const result = normalizeToCommercialUnit("huevos", 2, "ud");
    expect(result.hasCommercialUnit).toBe(true);
    expect(result.quantity).toBe(1);
    expect(result.label).toContain("docena");
  });

  it("findCommercialUnit es case-insensitive", () => {
    const rule = findCommercialUnit("JAMÓN SERRANO");
    expect(rule).not.toBeNull();
  });

  it("atún en lata (80 g) → 1 pack 3 latas", () => {
    const result = normalizeToCommercialUnit("atún en lata", 80, "g");
    expect(result.hasCommercialUnit).toBe(true);
    expect(result.quantity).toBe(1);
  });

  it("label con múltiples unidades cuando la cantidad supera 1 pack", () => {
    // 500 g de jamón serrano: ceil(500/100) = 5 sobres
    const result = normalizeToCommercialUnit("jamón serrano", 500, "g");
    expect(result.quantity).toBe(5);
    expect(result.label).toContain("5×");
  });
});
