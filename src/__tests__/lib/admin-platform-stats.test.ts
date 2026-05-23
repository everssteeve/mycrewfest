import { describe, expect, it } from "vitest";
import {
  computeFestivalEngagementScore,
  computeTotalEngagement,
  getEngagementTier,
  getEngagementTierColor,
  sortFestivalsByEngagement,
  type TopFestivalEntry,
} from "@/lib/admin-platform-stats";

function fest(overrides: Partial<TopFestivalEntry> = {}): TopFestivalEntry {
  return {
    id: "f1",
    name: "Festival A",
    followersCount: 0,
    festEventsCount: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computeFestivalEngagementScore
// ---------------------------------------------------------------------------

describe("computeFestivalEngagementScore", () => {
  it("returns 0 for zero followers and fest events", () => {
    expect(computeFestivalEngagementScore(fest())).toBe(0);
  });

  it("weights followers × 2", () => {
    expect(computeFestivalEngagementScore(fest({ followersCount: 5 }))).toBe(10);
  });

  it("weights festEvents × 1", () => {
    expect(computeFestivalEngagementScore(fest({ festEventsCount: 3 }))).toBe(3);
  });

  it("sums both weights correctly", () => {
    expect(computeFestivalEngagementScore(fest({ followersCount: 4, festEventsCount: 2 }))).toBe(
      10,
    );
  });
});

// ---------------------------------------------------------------------------
// sortFestivalsByEngagement
// ---------------------------------------------------------------------------

describe("sortFestivalsByEngagement", () => {
  it("returns empty array for empty input", () => {
    expect(sortFestivalsByEngagement([])).toHaveLength(0);
  });

  it("sorts by engagement score descending", () => {
    const entries = [
      fest({ id: "low", followersCount: 1, festEventsCount: 0 }),
      fest({ id: "high", followersCount: 10, festEventsCount: 5 }),
    ];
    const sorted = sortFestivalsByEngagement(entries);
    expect(sorted[0].id).toBe("high");
  });

  it("breaks ties alphabetically by name", () => {
    const entries = [
      fest({ id: "b", name: "Zephyr Fest", followersCount: 5 }),
      fest({ id: "a", name: "Alpha Fest", followersCount: 5 }),
    ];
    const sorted = sortFestivalsByEngagement(entries);
    expect(sorted[0].id).toBe("a");
  });

  it("does not mutate input array", () => {
    const entries = [fest({ id: "x" }), fest({ id: "y" })];
    const copy = [...entries];
    sortFestivalsByEngagement(entries);
    expect(entries).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------
// getEngagementTier
// ---------------------------------------------------------------------------

describe("getEngagementTier", () => {
  it("returns Émergent for score < 5", () => {
    expect(getEngagementTier(0)).toBe("Émergent");
    expect(getEngagementTier(4)).toBe("Émergent");
  });

  it("returns En vue for score 5–9", () => {
    expect(getEngagementTier(5)).toBe("En vue");
    expect(getEngagementTier(9)).toBe("En vue");
  });

  it("returns Populaire for score 10–19", () => {
    expect(getEngagementTier(10)).toBe("Populaire");
    expect(getEngagementTier(19)).toBe("Populaire");
  });

  it("returns Viral for score ≥ 20", () => {
    expect(getEngagementTier(20)).toBe("Viral");
    expect(getEngagementTier(100)).toBe("Viral");
  });
});

// ---------------------------------------------------------------------------
// getEngagementTierColor
// ---------------------------------------------------------------------------

describe("getEngagementTierColor", () => {
  it("returns pink for Viral", () => {
    expect(getEngagementTierColor("Viral")).toBe("var(--accent-pink)");
  });

  it("returns neon for Populaire", () => {
    expect(getEngagementTierColor("Populaire")).toBe("var(--primary-neon)");
  });

  it("returns cyan for En vue", () => {
    expect(getEngagementTierColor("En vue")).toBe("var(--secondary-cyan)");
  });

  it("returns dim for Émergent", () => {
    expect(getEngagementTierColor("Émergent")).toBe("var(--text-dim)");
  });
});

// ---------------------------------------------------------------------------
// computeTotalEngagement
// ---------------------------------------------------------------------------

describe("computeTotalEngagement", () => {
  it("returns 0 for empty list", () => {
    expect(computeTotalEngagement([])).toBe(0);
  });

  it("sums engagement scores across all festivals", () => {
    const entries = [
      fest({ followersCount: 5, festEventsCount: 2 }),
      fest({ followersCount: 3, festEventsCount: 1 }),
    ];
    expect(computeTotalEngagement(entries)).toBe(19);
  });
});
