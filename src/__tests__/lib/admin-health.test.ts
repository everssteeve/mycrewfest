import { describe, it, expect } from "vitest";
import {
  computeFestivalEnrichmentRate,
  computeProfileCompletionRate,
  computeSignalDensity,
  computeHealthScore,
  getHealthScoreLabel,
  getHealthScoreColor,
  buildHealthMetrics,
} from "@/lib/admin-health";

describe("computeFestivalEnrichmentRate", () => {
  it("returns 0 when total is 0", () => {
    expect(computeFestivalEnrichmentRate(0, 0)).toBe(0);
  });
  it("returns 100 when all enriched", () => {
    expect(computeFestivalEnrichmentRate(10, 10)).toBe(100);
  });
  it("returns 50 for half enriched", () => {
    expect(computeFestivalEnrichmentRate(10, 5)).toBe(50);
  });
  it("rounds to integer", () => {
    const result = computeFestivalEnrichmentRate(3, 1);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("computeProfileCompletionRate", () => {
  it("returns 0 when no users", () => {
    expect(computeProfileCompletionRate(0, 0)).toBe(0);
  });
  it("returns correct percentage", () => {
    expect(computeProfileCompletionRate(100, 75)).toBe(75);
  });
});

describe("computeSignalDensity", () => {
  it("returns 0 when no fest events", () => {
    expect(computeSignalDensity(100, 0)).toBe(0);
  });
  it("returns correct ratio", () => {
    expect(computeSignalDensity(30, 10)).toBe(3);
  });
  it("rounds to 1 decimal", () => {
    expect(computeSignalDensity(1, 3)).toBe(0.3);
  });
});

describe("computeHealthScore", () => {
  it("returns 0 for empty platform", () => {
    const score = computeHealthScore({
      totalFestivals: 0,
      enrichedFestivals: 0,
      totalUsers: 0,
      usersWithPseudo: 0,
      totalSignals: 0,
      totalFestEvents: 0,
    });
    expect(score).toBe(0);
  });

  it("returns 100 for a perfect platform", () => {
    const score = computeHealthScore({
      totalFestivals: 10,
      enrichedFestivals: 10,
      totalUsers: 100,
      usersWithPseudo: 100,
      totalSignals: 1000,
      totalFestEvents: 10, // density = 100 → capped at 100
    });
    expect(score).toBe(100);
  });

  it("returns a value between 0 and 100", () => {
    const score = computeHealthScore({
      totalFestivals: 20,
      enrichedFestivals: 5,
      totalUsers: 50,
      usersWithPseudo: 20,
      totalSignals: 10,
      totalFestEvents: 20,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("getHealthScoreLabel", () => {
  it("Excellent for ≥80", () => expect(getHealthScoreLabel(80)).toBe("Excellent"));
  it("Bon for 60-79", () => expect(getHealthScoreLabel(70)).toBe("Bon"));
  it("Passable for 40-59", () => expect(getHealthScoreLabel(50)).toBe("Passable"));
  it("Critique for <40", () => expect(getHealthScoreLabel(30)).toBe("Critique"));
});

describe("getHealthScoreColor", () => {
  it("returns 4 distinct colors", () => {
    const colors = [80, 70, 50, 30].map(getHealthScoreColor);
    const unique = new Set(colors);
    expect(unique.size).toBe(4);
  });
});

describe("buildHealthMetrics", () => {
  it("returns 3 metrics", () => {
    const metrics = buildHealthMetrics({
      totalFestivals: 10,
      enrichedFestivals: 5,
      totalUsers: 100,
      usersWithPseudo: 80,
      totalSignals: 50,
      totalFestEvents: 10,
    });
    expect(metrics).toHaveLength(3);
  });

  it("each metric has label, value, unit, score, description", () => {
    const metrics = buildHealthMetrics({
      totalFestivals: 10,
      enrichedFestivals: 5,
      totalUsers: 100,
      usersWithPseudo: 80,
      totalSignals: 50,
      totalFestEvents: 10,
    });
    for (const m of metrics) {
      expect(m.label).toBeTruthy();
      expect(typeof m.value).toBe("number");
      expect(m.unit).toBeTruthy();
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.description).toBeTruthy();
    }
  });
});
