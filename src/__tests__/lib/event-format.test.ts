import { describe, expect, it } from "vitest";
import { formatAgeRestriction, formatEventDuration, getAccessLabel } from "@/lib/event-format";

describe("formatEventDuration", () => {
  it("formats minutes only", () => {
    expect(formatEventDuration(45)).toBe("45min");
    expect(formatEventDuration(30)).toBe("30min");
  });

  it("formats whole hours", () => {
    expect(formatEventDuration(60)).toBe("1h");
    expect(formatEventDuration(120)).toBe("2h");
  });

  it("formats hours and minutes", () => {
    expect(formatEventDuration(90)).toBe("1h30");
    expect(formatEventDuration(75)).toBe("1h15");
    expect(formatEventDuration(150)).toBe("2h30");
  });

  it("returns empty string for zero or negative", () => {
    expect(formatEventDuration(0)).toBe("");
    expect(formatEventDuration(-5)).toBe("");
  });
});

describe("formatAgeRestriction", () => {
  it("returns null when no restriction", () => {
    expect(formatAgeRestriction()).toBeNull();
    expect(formatAgeRestriction(null, null)).toBeNull();
    expect(formatAgeRestriction(0, 0)).toBeNull();
  });

  it("formats min-only restriction", () => {
    expect(formatAgeRestriction(18)).toBe("+18");
    expect(formatAgeRestriction(7)).toBe("+7");
  });

  it("formats max-only restriction", () => {
    expect(formatAgeRestriction(null, 12)).toBe("−12 ans");
  });

  it("formats min+max range", () => {
    expect(formatAgeRestriction(6, 12)).toBe("6–12 ans");
    expect(formatAgeRestriction(3, 10)).toBe("3–10 ans");
  });
});

describe("getAccessLabel", () => {
  it("returns null for included access", () => {
    expect(getAccessLabel("inclus")).toBeNull();
  });

  it("returns a label for separate reservation", () => {
    expect(getAccessLabel("réservation_séparée")).toBe("Réservation");
  });
});
