import { describe, expect, it } from "vitest";
import {
  computeTrendingScore,
  getTrendingColor,
  getTrendingTier,
  rankByTrendingScore,
} from "@/lib/festival-trending-score";

const NOW = new Date("2026-05-23T12:00:00.000Z");

function inDays(n: number): string {
  return new Date(NOW.getTime() + n * 86_400_000).toISOString();
}

describe("computeTrendingScore", () => {
  it("returns 0 for festivals in the past", () => {
    expect(
      computeTrendingScore({ followerCount: 100, recentNewsCount: 5, startDate: inDays(-1) }, NOW),
    ).toBe(0);
  });

  it("returns 0 for today (daysUntil = 0)", () => {
    expect(
      computeTrendingScore({ followerCount: 100, recentNewsCount: 5, startDate: inDays(0) }, NOW),
    ).toBe(0);
  });

  it("applies 3× multiplier within 14 days", () => {
    const score = computeTrendingScore(
      { followerCount: 10, recentNewsCount: 0, startDate: inDays(7) },
      NOW,
    );
    expect(score).toBe(Math.min(Math.round(10 * 8 * 3.0), 1000));
  });

  it("applies 2× multiplier at 30 days", () => {
    const score = computeTrendingScore(
      { followerCount: 10, recentNewsCount: 0, startDate: inDays(25) },
      NOW,
    );
    expect(score).toBe(Math.min(Math.round(10 * 8 * 2.0), 1000));
  });

  it("applies 1.5× multiplier at 60 days", () => {
    const score = computeTrendingScore(
      { followerCount: 10, recentNewsCount: 0, startDate: inDays(50) },
      NOW,
    );
    expect(score).toBe(Math.min(Math.round(10 * 8 * 1.5), 1000));
  });

  it("applies 1× multiplier beyond 60 days", () => {
    const score = computeTrendingScore(
      { followerCount: 10, recentNewsCount: 0, startDate: inDays(90) },
      NOW,
    );
    expect(score).toBe(Math.min(Math.round(10 * 8 * 1.0), 1000));
  });

  it("news count adds bonus points", () => {
    const withNews = computeTrendingScore(
      { followerCount: 0, recentNewsCount: 5, startDate: inDays(7) },
      NOW,
    );
    const withoutNews = computeTrendingScore(
      { followerCount: 0, recentNewsCount: 0, startDate: inDays(7) },
      NOW,
    );
    expect(withNews).toBeGreaterThan(withoutNews);
  });

  it("score is capped at 1000", () => {
    const score = computeTrendingScore(
      { followerCount: 10000, recentNewsCount: 100, startDate: inDays(7) },
      NOW,
    );
    expect(score).toBe(1000);
  });

  it("returns a non-negative integer", () => {
    const score = computeTrendingScore(
      { followerCount: 1, recentNewsCount: 1, startDate: inDays(30) },
      NOW,
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(score)).toBe(true);
  });
});

describe("getTrendingTier", () => {
  it("returns 'chaud' for score >= 600", () => {
    expect(getTrendingTier(600)).toBe("chaud");
    expect(getTrendingTier(1000)).toBe("chaud");
  });

  it("returns 'montant' for score 200-599", () => {
    expect(getTrendingTier(200)).toBe("montant");
    expect(getTrendingTier(599)).toBe("montant");
  });

  it("returns 'stable' for score 50-199", () => {
    expect(getTrendingTier(50)).toBe("stable");
    expect(getTrendingTier(199)).toBe("stable");
  });

  it("returns null for score < 50", () => {
    expect(getTrendingTier(0)).toBeNull();
    expect(getTrendingTier(49)).toBeNull();
  });
});

describe("getTrendingColor", () => {
  it("returns a CSS variable for each tier", () => {
    expect(getTrendingColor("chaud")).toContain("var(");
    expect(getTrendingColor("montant")).toContain("var(");
    expect(getTrendingColor("stable")).toContain("var(");
    expect(getTrendingColor(null)).toContain("var(");
  });
});

describe("rankByTrendingScore", () => {
  const festivals = [
    { id: "a", followerCount: 5, recentNewsCount: 0, startDate: inDays(90) },
    { id: "b", followerCount: 50, recentNewsCount: 3, startDate: inDays(10) },
    { id: "c", followerCount: 20, recentNewsCount: 1, startDate: inDays(25) },
    { id: "d", followerCount: 100, recentNewsCount: 0, startDate: inDays(-5) }, // past
  ];

  it("excludes festivals with 0 score (past/today)", () => {
    const ranked = rankByTrendingScore(festivals, NOW);
    expect(ranked.map((f) => f.id)).not.toContain("d");
  });

  it("sorts by score descending", () => {
    const ranked = rankByTrendingScore(festivals, NOW);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].trendingScore).toBeGreaterThanOrEqual(ranked[i].trendingScore);
    }
  });

  it("attaches trendingScore to each entry", () => {
    const ranked = rankByTrendingScore(festivals, NOW);
    expect(ranked.every((f) => typeof f.trendingScore === "number")).toBe(true);
  });

  it("does not mutate the input", () => {
    const input = [...festivals];
    rankByTrendingScore(input, NOW);
    expect(input).toHaveLength(festivals.length);
  });
});
