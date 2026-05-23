import { describe, it, expect } from "vitest";
import { matchesNewsQuery, type SearchableNewsItem } from "@/lib/news-search";

const BASE: SearchableNewsItem = {
  summary: "La Grande Scène ouvre ses portes demain à 18h avec Massive Attack.",
  source: "festival_officiel",
  category: "programme",
};

describe("matchesNewsQuery", () => {
  it("returns true for empty query", () => {
    expect(matchesNewsQuery(BASE, "")).toBe(true);
    expect(matchesNewsQuery(BASE, "   ")).toBe(true);
  });

  it("matches summary content (case-insensitive)", () => {
    expect(matchesNewsQuery(BASE, "grande scène")).toBe(true);
    expect(matchesNewsQuery(BASE, "MASSIVE ATTACK")).toBe(true);
    expect(matchesNewsQuery(BASE, "18h")).toBe(true);
  });

  it("matches source (case-insensitive)", () => {
    expect(matchesNewsQuery(BASE, "festival")).toBe(true);
    expect(matchesNewsQuery(BASE, "OFFICIEL")).toBe(true);
  });

  it("matches category (case-insensitive)", () => {
    expect(matchesNewsQuery(BASE, "programme")).toBe(true);
    expect(matchesNewsQuery(BASE, "PROGRAMME")).toBe(true);
  });

  it("returns false when query does not match any field", () => {
    expect(matchesNewsQuery(BASE, "radiohead")).toBe(false);
    expect(matchesNewsQuery(BASE, "xyz_unknown")).toBe(false);
  });

  it("handles item without source", () => {
    const noSource: SearchableNewsItem = { summary: "Annulation de l'artiste B." };
    expect(matchesNewsQuery(noSource, "annulation")).toBe(true);
    expect(matchesNewsQuery(noSource, "festival")).toBe(false);
  });

  it("handles item without category", () => {
    const noCat: SearchableNewsItem = { summary: "Test info", source: "org" };
    expect(matchesNewsQuery(noCat, "test")).toBe(true);
    expect(matchesNewsQuery(noCat, "programme")).toBe(false);
  });

  it("matches partial strings", () => {
    expect(matchesNewsQuery(BASE, "demain")).toBe(true);
    expect(matchesNewsQuery(BASE, "dema")).toBe(true);
  });

  it("trims whitespace from query", () => {
    expect(matchesNewsQuery(BASE, "  massive  ")).toBe(true);
  });
});
