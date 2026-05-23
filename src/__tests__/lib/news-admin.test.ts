import { describe, it, expect } from "vitest";
import { validateNewsInput, isValidUrl, type NewsInput } from "@/lib/news-admin";

function validInput(overrides: Partial<NewsInput> = {}): Partial<NewsInput> {
  return {
    festivalId: "fest-1",
    source: "instagram",
    sourceUrl: "",
    category: "line-up",
    summary: "Nouvelle tête d'affiche annoncée pour le festival.",
    urgencyLevel: "normal",
    isPinned: false,
    publishedAt: "2026-07-10T14:00",
    ...overrides,
  };
}

describe("validateNewsInput", () => {
  it("returns no errors for valid input", () => {
    expect(validateNewsInput(validInput())).toHaveLength(0);
  });

  it("requires festivalId", () => {
    const errors = validateNewsInput(validInput({ festivalId: "" }));
    expect(errors.some((e) => e.field === "festivalId")).toBe(true);
  });

  it("rejects invalid source", () => {
    const errors = validateNewsInput(validInput({ source: "tiktok" }));
    expect(errors.some((e) => e.field === "source")).toBe(true);
  });

  it("accepts all valid sources", () => {
    for (const source of ["instagram", "facebook", "x", "site_officiel"]) {
      expect(validateNewsInput(validInput({ source }))).toHaveLength(0);
    }
  });

  it("rejects invalid category", () => {
    const errors = validateNewsInput(validInput({ category: "unknown" }));
    expect(errors.some((e) => e.field === "category")).toBe(true);
  });

  it("accepts all valid categories", () => {
    for (const category of ["line-up", "logistique", "programme-change", "annulation", "urgence", "autre"]) {
      expect(validateNewsInput(validInput({ category }))).toHaveLength(0);
    }
  });

  it("requires summary", () => {
    const errors = validateNewsInput(validInput({ summary: "" }));
    expect(errors.some((e) => e.field === "summary")).toBe(true);
  });

  it("rejects summary shorter than 10 chars", () => {
    const errors = validateNewsInput(validInput({ summary: "Court" }));
    expect(errors.some((e) => e.field === "summary")).toBe(true);
  });

  it("rejects summary longer than 500 chars", () => {
    const errors = validateNewsInput(validInput({ summary: "a".repeat(501) }));
    expect(errors.some((e) => e.field === "summary")).toBe(true);
  });

  it("accepts summary exactly at boundary lengths", () => {
    expect(validateNewsInput(validInput({ summary: "a".repeat(10) }))).toHaveLength(0);
    expect(validateNewsInput(validInput({ summary: "a".repeat(500) }))).toHaveLength(0);
  });

  it("rejects invalid urgencyLevel", () => {
    const errors = validateNewsInput(validInput({ urgencyLevel: "high" }));
    expect(errors.some((e) => e.field === "urgencyLevel")).toBe(true);
  });

  it("accepts normal and critique urgency", () => {
    expect(validateNewsInput(validInput({ urgencyLevel: "normal" }))).toHaveLength(0);
    expect(validateNewsInput(validInput({ urgencyLevel: "critique" }))).toHaveLength(0);
  });

  it("requires publishedAt", () => {
    const errors = validateNewsInput(validInput({ publishedAt: "" }));
    expect(errors.some((e) => e.field === "publishedAt")).toBe(true);
  });

  it("accumulates multiple errors", () => {
    const errors = validateNewsInput({ festivalId: "", source: "", summary: "" });
    expect(errors.length).toBeGreaterThan(1);
  });
});

describe("isValidUrl", () => {
  it("returns true for empty string (optional field)", () => {
    expect(isValidUrl("")).toBe(true);
  });

  it("returns true for valid https URL", () => {
    expect(isValidUrl("https://www.instagram.com/hellfest/")).toBe(true);
  });

  it("returns true for valid http URL", () => {
    expect(isValidUrl("http://hellfest.fr")).toBe(true);
  });

  it("returns false for non-URL string", () => {
    expect(isValidUrl("not a url")).toBe(false);
  });

  it("returns false for partial URL without protocol", () => {
    expect(isValidUrl("www.hellfest.fr")).toBe(false);
  });
});
