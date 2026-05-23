import { describe, expect, it } from "vitest";
import {
  computeSimilarityScore,
  rankSimilarFestivals,
  type SimilarityCandidate,
} from "@/lib/festival-similarity";

const BASE: SimilarityCandidate = {
  id: "ref",
  slug: "ref-festival",
  festivalType: "musique",
  country: "France",
  startDate: "2026-07-15T00:00:00.000Z",
  endDate: "2026-07-18T00:00:00.000Z",
};

function candidate(overrides: Partial<SimilarityCandidate>): SimilarityCandidate {
  return {
    id: "cand",
    slug: "candidate-festival",
    festivalType: "musique",
    country: "France",
    startDate: "2026-07-20T00:00:00.000Z",
    endDate: "2026-07-23T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeSimilarityScore", () => {
  it("returns -1 for the reference itself", () => {
    expect(computeSimilarityScore(BASE, BASE)).toBe(-1);
  });

  it("scores higher when same type AND same country", () => {
    const sameAll = candidate({ festivalType: "musique", country: "France" });
    const diffType = candidate({ festivalType: "cirque", country: "France" });
    expect(computeSimilarityScore(BASE, sameAll)).toBeGreaterThan(
      computeSimilarityScore(BASE, diffType),
    );
  });

  it("adds 5 pts for same festival type", () => {
    const sameType = candidate({ festivalType: "musique", country: "Germany" });
    const diffType = candidate({ festivalType: "cirque", country: "Germany" });
    const diff = computeSimilarityScore(BASE, sameType) - computeSimilarityScore(BASE, diffType);
    expect(diff).toBe(5);
  });

  it("adds 3 pts for same country", () => {
    const sameCountry = candidate({ festivalType: "world", country: "France" });
    const diffCountry = candidate({ festivalType: "world", country: "Spain" });
    const diff =
      computeSimilarityScore(BASE, sameCountry) - computeSimilarityScore(BASE, diffCountry);
    expect(diff).toBe(3);
  });

  it("adds 4 pts when start dates are within 14 days", () => {
    // Same type/country for both candidates, only date proximity differs
    const close = candidate({
      id: "close",
      festivalType: "world",
      country: "Germany",
      startDate: "2026-07-20T00:00:00.000Z",
    }); // 5 days away
    const far = candidate({
      id: "far",
      festivalType: "world",
      country: "Germany",
      startDate: "2026-12-01T00:00:00.000Z",
    }); // >90 days away
    const ref = { ...BASE, festivalType: "world", country: "Germany" };
    const scoreClose = computeSimilarityScore(ref, close);
    const scoreFar = computeSimilarityScore(ref, far);
    expect(scoreClose).toBeGreaterThan(scoreFar);
  });

  it("adds 1 pt when start dates are within 90 days", () => {
    const within90 = candidate({
      festivalType: "world",
      country: "Germany",
      startDate: "2026-10-01T00:00:00.000Z", // ~78 days
    });
    const score = computeSimilarityScore(
      { ...BASE, festivalType: "world", country: "Germany" },
      within90,
    );
    expect(score).toBeGreaterThan(0);
  });
});

describe("rankSimilarFestivals", () => {
  it("excludes the reference festival", () => {
    const results = rankSimilarFestivals(BASE, [BASE]);
    expect(results).toHaveLength(0);
  });

  it("limits results to the given limit", () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      candidate({ id: `c${i}`, slug: `festival-${i}` }),
    );
    const results = rankSimilarFestivals(BASE, candidates, 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("sorts results by score descending", () => {
    const highMatch = candidate({
      id: "high",
      festivalType: "musique",
      country: "France",
      startDate: "2026-07-18T00:00:00.000Z",
    });
    const lowMatch = candidate({
      id: "low",
      festivalType: "cirque",
      country: "Germany",
      startDate: "2026-12-01T00:00:00.000Z",
    });
    const results = rankSimilarFestivals(BASE, [lowMatch, highMatch], 3);
    expect(results[0].id).toBe("high");
  });

  it("filters out candidates with score 0 or less", () => {
    const zeroScore = candidate({
      festivalType: "world",
      country: "Japan",
      startDate: "2027-06-01T00:00:00.000Z",
    });
    const results = rankSimilarFestivals(BASE, [zeroScore], 3);
    expect(results).toHaveLength(0);
  });

  it("returns empty array when no candidates", () => {
    expect(rankSimilarFestivals(BASE, [], 3)).toEqual([]);
  });
});
