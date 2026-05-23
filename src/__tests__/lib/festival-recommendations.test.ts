import { describe, it, expect } from "vitest";
import {
  buildRecommendationScores,
  topRecommendations,
  hasEnoughData,
} from "@/lib/festival-recommendations";
import type { SimilarityCandidate } from "@/lib/festival-similarity";

const makeCandidate = (overrides: Partial<SimilarityCandidate> & { id: string }): SimilarityCandidate => ({
  slug: overrides.id,
  festivalType: "musique",
  country: "FR",
  startDate: "2026-07-01",
  endDate: "2026-07-03",
  ...overrides,
});

describe("buildRecommendationScores", () => {
  it("returns one score per candidate festival", () => {
    const followed = [makeCandidate({ id: "a" })];
    const all = [makeCandidate({ id: "b" }), makeCandidate({ id: "c" })];
    const scores = buildRecommendationScores(followed, all);
    expect(scores).toHaveLength(2);
  });

  it("gives a higher total score when a candidate matches multiple followed festivals", () => {
    const followed = [
      makeCandidate({ id: "f1", festivalType: "musique", country: "FR", startDate: "2026-07-01", endDate: "2026-07-03" }),
      makeCandidate({ id: "f2", festivalType: "musique", country: "FR", startDate: "2026-07-10", endDate: "2026-07-12" }),
    ];
    const candidate = makeCandidate({ id: "c1", festivalType: "musique", country: "FR", startDate: "2026-07-05", endDate: "2026-07-06" });
    const scores = buildRecommendationScores(followed, [candidate]);
    expect(scores[0].matchCount).toBe(2);
    expect(scores[0].totalScore).toBeGreaterThan(0);
  });

  it("matchCount is 0 when no followed festival matches", () => {
    const followed = [makeCandidate({ id: "f1", festivalType: "cirque", country: "DE", startDate: "2025-01-01", endDate: "2025-01-03" })];
    const candidate = makeCandidate({ id: "c1", festivalType: "world", country: "JP", startDate: "2026-11-01", endDate: "2026-11-05" });
    const scores = buildRecommendationScores(followed, [candidate]);
    expect(scores[0].matchCount).toBe(0);
    expect(scores[0].totalScore).toBe(0);
  });

  it("includes the candidate even if it scores 0", () => {
    const followed = [makeCandidate({ id: "f1", festivalType: "cirque", country: "DE", startDate: "2025-01-01", endDate: "2025-01-03" })];
    const candidate = makeCandidate({ id: "c1", festivalType: "world", country: "JP", startDate: "2026-11-01", endDate: "2026-11-05" });
    const scores = buildRecommendationScores(followed, [candidate]);
    expect(scores).toHaveLength(1);
    expect(scores[0].id).toBe("c1");
  });

  it("returns empty array when allFestivals is empty", () => {
    const followed = [makeCandidate({ id: "f1" })];
    expect(buildRecommendationScores(followed, [])).toHaveLength(0);
  });

  it("returns empty array when followedFestivals is empty", () => {
    const all = [makeCandidate({ id: "c1" })];
    expect(buildRecommendationScores([], all)).toHaveLength(1);
    expect(buildRecommendationScores([], all)[0].totalScore).toBe(0);
  });
});

describe("topRecommendations", () => {
  it("excludes already-followed festivals", () => {
    const scores = [
      { id: "followed", totalScore: 10, matchCount: 1 },
      { id: "new", totalScore: 5, matchCount: 1 },
    ];
    const result = topRecommendations(scores, new Set(["followed"]));
    expect(result.map((r) => r.id)).toEqual(["new"]);
  });

  it("excludes festivals with totalScore <= 0", () => {
    const scores = [
      { id: "a", totalScore: 0, matchCount: 0 },
      { id: "b", totalScore: 8, matchCount: 1 },
    ];
    const result = topRecommendations(scores, new Set());
    expect(result.map((r) => r.id)).toEqual(["b"]);
  });

  it("sorts by totalScore desc then matchCount desc", () => {
    const scores = [
      { id: "low", totalScore: 3, matchCount: 3 },
      { id: "high", totalScore: 10, matchCount: 1 },
      { id: "mid", totalScore: 5, matchCount: 2 },
    ];
    const result = topRecommendations(scores, new Set());
    expect(result.map((r) => r.id)).toEqual(["high", "mid", "low"]);
  });

  it("respects the limit parameter", () => {
    const scores = Array.from({ length: 10 }, (_, i) => ({
      id: `f${i}`,
      totalScore: 10 - i,
      matchCount: 1,
    }));
    expect(topRecommendations(scores, new Set(), 3)).toHaveLength(3);
  });

  it("returns empty array when all are excluded", () => {
    const scores = [{ id: "a", totalScore: 5, matchCount: 1 }];
    expect(topRecommendations(scores, new Set(["a"]))).toHaveLength(0);
  });
});

describe("hasEnoughData", () => {
  it("returns true when at least 1 festival is followed", () => {
    expect(hasEnoughData(1)).toBe(true);
    expect(hasEnoughData(5)).toBe(true);
  });

  it("returns false when no festivals are followed", () => {
    expect(hasEnoughData(0)).toBe(false);
  });
});
