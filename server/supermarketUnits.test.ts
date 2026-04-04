import { describe, it, expect } from "vitest";
import {
  normalizeToCommercialUnit,
  findCommercialUnit,
} from "../shared/supermarketUnits";

describe("normalizeToCommercialUnit – exact keyword match", () => {
  it("jamón serrano → sobre 100 g (never a whole leg)", () => {
    const r = normalizeToCommercialUnit("jamón serrano", 30, "g");
    expect(r.hasCommercialUnit).toBe(true);
    expect(r.label).toContain("sobre");
    expect(r.quantity).toBe(1);
  });

  it("aceite de oliva 15 ml → 1 botella 750 ml", () => {
    const r = normalizeToCommercialUnit("aceite de oliva", 15, "ml");
    expect(r.hasCommercialUnit).toBe(true);
    expect(r.label).toContain("botella");
    expect(r.quantity).toBe(1);
  });

  it("2 huevos → 1 docena (minimum commercial unit)", () => {
    const r = normalizeToCommercialUnit("huevos", 2, "ud");
    expect(r.hasCommercialUnit).toBe(true);
    expect(r.label).toContain("docena");
    expect(r.quantity).toBe(1);
  });

  it("pechuga de pollo 600 g → 2 bandejas 500 g", () => {
    const r = normalizeToCommercialUnit("pechuga de pollo", 600, "g");
    expect(r.hasCommercialUnit).toBe(true);
    expect(r.quantity).toBe(2);
  });

  it("pimentón 5 g → 1 lata 75 g", () => {
    const r = normalizeToCommercialUnit("pimentón dulce", 5, "g");
    expect(r.hasCommercialUnit).toBe(true);
    expect(r.label).toContain("lata");
  });

  it("leche entera 250 ml → 1 brick 1 L", () => {
    const r = normalizeToCommercialUnit("leche entera", 250, "ml");
    expect(r.hasCommercialUnit).toBe(true);
    expect(r.label).toContain("brick");
    expect(r.quantity).toBe(1);
  });

  it("atún en lata 80 g → 1 pack 3 latas", () => {
    const r = normalizeToCommercialUnit("atún en lata", 80, "g");
    expect(r.hasCommercialUnit).toBe(true);
    expect(r.quantity).toBe(1);
  });

  it("label with multiple units when quantity exceeds 1 pack", () => {
    // 500 g jamón serrano: ceil(500/100) = 5 sobres
    const r = normalizeToCommercialUnit("jamón serrano", 500, "g");
    expect(r.quantity).toBe(5);
    expect(r.label).toContain("5×");
  });
});

describe("normalizeToCommercialUnit – accent/case insensitive", () => {
  it("JAMON SERRANO (uppercase, no accent) still matches", () => {
    const r = normalizeToCommercialUnit("JAMON SERRANO", 50, "g");
    expect(r.hasCommercialUnit).toBe(true);
  });

  it("Aceite De Oliva (mixed case) still matches", () => {
    const r = normalizeToCommercialUnit("Aceite De Oliva", 20, "ml");
    expect(r.hasCommercialUnit).toBe(true);
  });

  it("findCommercialUnit is case-insensitive", () => {
    const rule = findCommercialUnit("JAMÓN SERRANO");
    expect(rule).not.toBeNull();
  });
});

describe("normalizeToCommercialUnit – alias resolution", () => {
  it("'jamon' alias resolves → never a whole leg", () => {
    const r = normalizeToCommercialUnit("jamon", 40, "g");
    expect(r.label).not.toContain("pata");
    expect(r.quantity).toBeGreaterThanOrEqual(1);
  });

  it("'pollo' alias → bandeja", () => {
    const r = normalizeToCommercialUnit("pollo", 300, "g");
    expect(r.label).toContain("bandeja");
  });

  it("'leche' alias → brick", () => {
    const r = normalizeToCommercialUnit("leche", 250, "ml");
    expect(r.label).toContain("brick");
  });

  it("'pasta' alias → paquete", () => {
    const r = normalizeToCommercialUnit("pasta", 80, "g");
    expect(r.label).toContain("paquete");
  });

  it("'ajo' alias → cabeza", () => {
    const r = normalizeToCommercialUnit("ajo", 10, "g");
    expect(r.label).toContain("cabeza");
  });

  it("'arroz' alias → paquete 1 kg", () => {
    const r = normalizeToCommercialUnit("arroz", 200, "g");
    expect(r.label).toContain("paquete");
  });
});

describe("normalizeToCommercialUnit – category fallback", () => {
  it("completely unknown ingredient still returns a sensible unit (never crashes)", () => {
    const r = normalizeToCommercialUnit("polvo de unicornio mágico", 5, "g");
    expect(r.label).toBeTruthy();
    expect(r.quantity).toBeGreaterThanOrEqual(1);
  });

  it("unknown ingredient with 'carne' keyword gets carne fallback", () => {
    const r = normalizeToCommercialUnit("carne de avestruz exótico", 200, "g");
    // 'carne' keyword → category carne → bandeja 400 g
    expect(r.label).toContain("bandeja");
  });

  it("unknown ingredient with 'fruta' keyword gets fruta fallback", () => {
    const r = normalizeToCommercialUnit("fruta exótica desconocida", 100, "g");
    expect(r.isFallback).toBe(true);
    expect(r.label).toContain("unidad");
  });

  it("isFallback is true for category fallback items", () => {
    // Use a name with no keyword overlap at all
    const r = normalizeToCommercialUnit("polvo_magico_desconocido_zzz", 10, "g");
    expect(r.isFallback).toBe(true);
  });

  it("hasCommercialUnit is false for fallback items", () => {
    const r = normalizeToCommercialUnit("polvo_magico_desconocido_zzz", 10, "g");
    expect(r.hasCommercialUnit).toBe(false);
  });
});

describe("normalizeToCommercialUnit – quantity safety", () => {
  it("quantity is always at least 1", () => {
    const r = normalizeToCommercialUnit("sal", 0.5, "g");
    expect(r.quantity).toBeGreaterThanOrEqual(1);
  });

  it("large quantity correctly calculates multiple units", () => {
    const r = normalizeToCommercialUnit("arroz", 2500, "g");
    // 1 kg paquete → needs 3 paquetes for 2500 g
    expect(r.quantity).toBe(3);
  });

  it("tiny spice quantity → still 1 minimum unit", () => {
    const r = normalizeToCommercialUnit("pimienta negra molida", 0.5, "g");
    expect(r.quantity).toBe(1);
  });
});

describe("findCommercialUnit", () => {
  it("returns null for completely unknown ingredient", () => {
    // Must not contain any keyword substring (no 'te', 'sal', etc.)
    const r = findCommercialUnit("polvo_magico_desconocido_zzz");
    expect(r).toBeNull();
  });

  it("returns rule for known ingredient", () => {
    const r = findCommercialUnit("jamón cocido");
    expect(r).not.toBeNull();
    expect(r!.commercial.label).toContain("sobre");
  });
});
