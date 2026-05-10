import { describe, it, expect } from "vitest";

// ─── Helpers (mirrors logic from MealNotifications.tsx) ───────────────────────

function maskToArray(mask: number): boolean[] {
  return Array.from({ length: 7 }, (_, i) => Boolean(mask & (1 << i)));
}

function arrayToMask(days: boolean[]): number {
  return days.reduce((acc, val, i) => acc | (val ? 1 << i : 0), 0);
}

const VALID_MEAL_TYPES = ["desayuno", "almuerzo", "merienda", "cena", "snack", "actividad"] as const;
type MealType = typeof VALID_MEAL_TYPES[number];

function isValidMealType(value: string): value is MealType {
  return (VALID_MEAL_TYPES as readonly string[]).includes(value);
}

function isValidTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Notification system — bitmask helpers", () => {
  it("maskToArray: 127 (all days) returns all true", () => {
    const result = maskToArray(127);
    expect(result).toHaveLength(7);
    expect(result.every(Boolean)).toBe(true);
  });

  it("maskToArray: 0 (no days) returns all false", () => {
    const result = maskToArray(0);
    expect(result.every((v) => !v)).toBe(true);
  });

  it("maskToArray: 31 (weekdays Mon–Fri) returns correct pattern", () => {
    const result = maskToArray(31); // bits 0–4 = Mon–Fri
    expect(result.slice(0, 5).every(Boolean)).toBe(true);
    expect(result[5]).toBe(false); // Saturday
    expect(result[6]).toBe(false); // Sunday
  });

  it("arrayToMask: all true returns 127", () => {
    expect(arrayToMask(Array(7).fill(true))).toBe(127);
  });

  it("arrayToMask: all false returns 0", () => {
    expect(arrayToMask(Array(7).fill(false))).toBe(0);
  });

  it("round-trip: mask → array → mask is idempotent", () => {
    for (const mask of [0, 31, 96, 127, 65, 42]) {
      expect(arrayToMask(maskToArray(mask))).toBe(mask);
    }
  });
});

describe("Notification system — meal type validation", () => {
  it("accepts all valid meal types including actividad", () => {
    for (const type of VALID_MEAL_TYPES) {
      expect(isValidMealType(type)).toBe(true);
    }
  });

  it("rejects invalid meal types", () => {
    expect(isValidMealType("almuerzo2")).toBe(false);
    expect(isValidMealType("")).toBe(false);
    expect(isValidMealType("workout")).toBe(false);
  });

  it("actividad is a valid meal type", () => {
    expect(isValidMealType("actividad")).toBe(true);
  });
});

describe("Notification system — time format validation", () => {
  it("accepts valid HH:MM times", () => {
    expect(isValidTimeFormat("08:00")).toBe(true);
    expect(isValidTimeFormat("18:30")).toBe(true);
    expect(isValidTimeFormat("23:59")).toBe(true);
    expect(isValidTimeFormat("00:00")).toBe(true);
  });

  it("rejects invalid time formats", () => {
    expect(isValidTimeFormat("8:00")).toBe(false);   // missing leading zero
    expect(isValidTimeFormat("24:00")).toBe(false);  // hour out of range
    expect(isValidTimeFormat("18:60")).toBe(false);  // minute out of range
    expect(isValidTimeFormat("18:3")).toBe(false);   // single digit minute
    expect(isValidTimeFormat("")).toBe(false);
  });
});
