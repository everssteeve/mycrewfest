import { describe, expect, it } from "vitest";
import { buildRecommendationReason, countReasonSignals } from "@/lib/recommendation-reason";

const hellfest = {
  id: "hellfest",
  name: "Hellfest",
  slug: "hellfest-2026",
  festivalType: "musique",
  country: "FR",
  startDate: "2026-06-19",
  endDate: "2026-06-22",
};

const garorock = {
  id: "garorock",
  name: "Garorock",
  slug: "garorock-2026",
  festivalType: "musique",
  country: "FR",
  startDate: "2026-07-03",
  endDate: "2026-07-05",
};

const download = {
  id: "download",
  name: "Download Festival",
  slug: "download-2026",
  festivalType: "musique",
  country: "UK",
  startDate: "2026-06-12",
  endDate: "2026-06-14",
};

const cirqueNoel = {
  id: "cirque-noel",
  name: "Cirque de Noël",
  slug: "cirque-noel-2026",
  festivalType: "cirque",
  country: "FR",
  startDate: "2026-12-20",
  endDate: "2026-12-24",
};

const followed = [hellfest];

describe("buildRecommendationReason", () => {
  it("returns 'Dans ton univers' when no followed festivals", () => {
    expect(buildRecommendationReason(garorock, [])).toBe("Dans ton univers");
  });

  it("returns type+country reason when both match", () => {
    const reason = buildRecommendationReason(garorock, followed);
    expect(reason).toContain("Hellfest");
    expect(reason.toLowerCase()).toMatch(/type|pays|univers/);
  });

  it("returns type+country reason for same type & country", () => {
    const reason = buildRecommendationReason(garorock, followed);
    expect(reason).toBe("Même type et même pays que Hellfest");
  });

  it("returns type reason when type matches but not country", () => {
    const reason = buildRecommendationReason(download, followed);
    // download is musique in UK — type matches, country doesn't, but dates are close (7 days)
    // 7 days is ≤ 30 so proximity matches too → "Même univers musique que Hellfest"
    expect(reason).toContain("Hellfest");
  });

  it("returns country reason when only country matches", () => {
    // cirque-noel is cirque (different type), FR (same country), Dec (far from June) — only country matches
    const reason = buildRecommendationReason(cirqueNoel, followed);
    expect(reason).toBe("Même pays que Hellfest");
  });

  it("returns a non-empty string in all cases", () => {
    const candidates = [garorock, download, cirqueNoel];
    for (const c of candidates) {
      expect(buildRecommendationReason(c, followed).length).toBeGreaterThan(0);
    }
  });

  it("handles candidate matching itself gracefully", () => {
    const reason = buildRecommendationReason(hellfest, followed);
    expect(typeof reason).toBe("string");
  });
});

describe("countReasonSignals", () => {
  it("returns 0 for empty followed list", () => {
    expect(countReasonSignals(garorock, [])).toBe(0);
  });

  it("returns higher count when more signals match", () => {
    // garorock: same type (musique) AND same country (FR) as hellfest
    const count = countReasonSignals(garorock, followed);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("returns lower count for weaker match", () => {
    // cirqueNoel: only country matches (not type, not proximity)
    const countWeak = countReasonSignals(cirqueNoel, followed);
    const countStrong = countReasonSignals(garorock, followed);
    expect(countStrong).toBeGreaterThan(countWeak);
  });

  it("returns a non-negative integer", () => {
    const count = countReasonSignals(download, followed);
    expect(count).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(count)).toBe(true);
  });
});
