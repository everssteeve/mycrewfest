import { describe, expect, it } from "vitest";
import { filterLineup, normalizeQuery } from "@/lib/festival-lineup-search";
import type { ArtistSummary } from "@/types/index";

const artists: ArtistSummary[] = [
  { id: "1", name: "Gojira", disciplines: ["Metal", "Live"], countryCode: "FR" },
  { id: "2", name: "Rammstein", disciplines: ["Industrial Metal"], countryCode: "DE" },
  { id: "3", name: "Amon Amarth", disciplines: ["Viking Metal"], countryCode: "SE" },
  { id: "4", name: "Élodie Martin", disciplines: ["Folk"], countryCode: "FR" },
];

describe("normalizeQuery", () => {
  it("lowercases and trims", () => {
    expect(normalizeQuery("  GOJIRA  ")).toBe("gojira");
  });

  it("strips diacritics", () => {
    expect(normalizeQuery("Élodie")).toBe("elodie");
  });

  it("returns empty string for blank input", () => {
    expect(normalizeQuery("   ")).toBe("");
  });
});

describe("filterLineup", () => {
  it("returns all artists for empty query", () => {
    expect(filterLineup(artists, "")).toHaveLength(4);
    expect(filterLineup(artists, "   ")).toHaveLength(4);
  });

  it("filters by artist name (case-insensitive)", () => {
    const result = filterLineup(artists, "gojira");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by partial name", () => {
    const result = filterLineup(artists, "ram");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("filters by discipline", () => {
    const result = filterLineup(artists, "folk");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("4");
  });

  it("filters by discipline partial match", () => {
    const result = filterLineup(artists, "metal");
    expect(result).toHaveLength(3);
  });

  it("filters by country code", () => {
    const result = filterLineup(artists, "FR");
    expect(result).toHaveLength(2);
  });

  it("matches diacritic-insensitive artist names", () => {
    const result = filterLineup(artists, "elodie");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("4");
  });

  it("returns empty array when no match", () => {
    expect(filterLineup(artists, "xyz-no-match-999")).toHaveLength(0);
  });
});
