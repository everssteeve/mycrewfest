import { describe, it, expect } from "vitest";
import {
  aggregateDisciplines,
  buildDisciplineRanking,
  getDisciplineColor,
  hasGenreData,
} from "@/lib/profil-genres";

const artists = [
  { disciplines: ["metal", "rock"], timesVu: 2 },
  { disciplines: ["metal", "hardcore"], timesVu: 1 },
  { disciplines: ["électro"], timesVu: 1 },
];

describe("aggregateDisciplines", () => {
  it("counts each discipline weighted by timesVu", () => {
    const counts = aggregateDisciplines(artists);
    expect(counts.get("metal")).toBe(3); // 2 (artist 1) + 1 (artist 2)
    expect(counts.get("rock")).toBe(2);
    expect(counts.get("hardcore")).toBe(1);
    expect(counts.get("électro")).toBe(1);
  });

  it("defaults timesVu to 1 when not provided", () => {
    const counts = aggregateDisciplines([{ disciplines: ["jazz"] }]);
    expect(counts.get("jazz")).toBe(1);
  });

  it("skips empty discipline strings", () => {
    const counts = aggregateDisciplines([{ disciplines: ["", "  ", "rock"] }]);
    expect(counts.has("")).toBe(false);
    expect(counts.get("rock")).toBe(1);
  });

  it("returns empty map for empty array", () => {
    expect(aggregateDisciplines([])).toHaveProperty("size", 0);
  });

  it("returns empty map for artists with no disciplines", () => {
    expect(aggregateDisciplines([{ disciplines: [] }])).toHaveProperty("size", 0);
  });

  it("trims whitespace from discipline names", () => {
    const counts = aggregateDisciplines([{ disciplines: ["  jazz  "] }]);
    expect(counts.has("jazz")).toBe(true);
  });
});

describe("buildDisciplineRanking", () => {
  it("sorts by count descending", () => {
    const counts = aggregateDisciplines(artists);
    const ranking = buildDisciplineRanking(counts);
    expect(ranking[0].discipline).toBe("metal");
    expect(ranking[1].discipline).toBe("rock");
  });

  it("computes percentages correctly", () => {
    const counts = new Map([["a", 1], ["b", 1]]);
    const ranking = buildDisciplineRanking(counts);
    expect(ranking[0].percentage).toBe(50);
    expect(ranking[1].percentage).toBe(50);
  });

  it("respects the limit", () => {
    const counts = aggregateDisciplines(artists);
    expect(buildDisciplineRanking(counts, 2)).toHaveLength(2);
  });

  it("returns empty array for empty map", () => {
    expect(buildDisciplineRanking(new Map())).toHaveLength(0);
  });

  it("includes count and percentage on each entry", () => {
    const counts = new Map([["metal", 3], ["rock", 1]]);
    const ranking = buildDisciplineRanking(counts);
    expect(ranking[0]).toMatchObject({ discipline: "metal", count: 3 });
    expect(ranking[0].percentage).toBeGreaterThan(0);
  });
});

describe("getDisciplineColor", () => {
  it("returns a CSS variable string for indices 0-4", () => {
    for (let i = 0; i < 5; i++) {
      expect(getDisciplineColor(i)).toContain("var(");
    }
  });

  it("returns a fallback for out-of-range index", () => {
    expect(getDisciplineColor(99)).toContain("var(");
  });
});

describe("hasGenreData", () => {
  it("returns true when map has entries", () => {
    expect(hasGenreData(new Map([["jazz", 1]]))).toBe(true);
  });

  it("returns false for empty map", () => {
    expect(hasGenreData(new Map())).toBe(false);
  });
});
