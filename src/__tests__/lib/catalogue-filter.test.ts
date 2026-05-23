import { describe, it, expect } from "vitest";
import {
  matchesFollowFilter,
  matchesMonthFilter,
  getAvailableMonths,
  countFollowedFestivals,
  computeFestivalDurationDays,
  computeAvgFestivalDurationDays,
  type FollowFilterable,
  type MonthFilterable,
} from "@/lib/catalogue-filter";

const f = (isFollowed?: boolean): FollowFilterable => ({ isFollowed });
const fest = (startDate: string, endDate: string): MonthFilterable => ({ startDate, endDate });

describe("matchesFollowFilter", () => {
  it("always returns true when followedOnly is false", () => {
    expect(matchesFollowFilter(f(true), false)).toBe(true);
    expect(matchesFollowFilter(f(false), false)).toBe(true);
    expect(matchesFollowFilter(f(undefined), false)).toBe(true);
  });

  it("returns true only for followed festivals when followedOnly is true", () => {
    expect(matchesFollowFilter(f(true), true)).toBe(true);
  });

  it("returns false for non-followed when followedOnly is true", () => {
    expect(matchesFollowFilter(f(false), true)).toBe(false);
    expect(matchesFollowFilter(f(undefined), true)).toBe(false);
  });
});

describe("matchesMonthFilter", () => {
  it("returns true for null month (no filter)", () => {
    expect(matchesMonthFilter(fest("2025-07-10", "2025-07-14"), null)).toBe(true);
  });

  it("matches festival that starts in the given month", () => {
    expect(matchesMonthFilter(fest("2025-07-10", "2025-07-14"), 7)).toBe(true);
  });

  it("matches festival that ends in the given month", () => {
    expect(matchesMonthFilter(fest("2025-06-28", "2025-07-02"), 7)).toBe(true);
  });

  it("matches festival that spans across the given month", () => {
    expect(matchesMonthFilter(fest("2025-06-28", "2025-08-01"), 7)).toBe(true);
  });

  it("does not match a festival entirely outside the month", () => {
    expect(matchesMonthFilter(fest("2025-08-10", "2025-08-14"), 7)).toBe(false);
  });

  it("matches a festival that starts and ends in the same month", () => {
    expect(matchesMonthFilter(fest("2025-07-01", "2025-07-31"), 7)).toBe(true);
  });

  it("does not match a festival ending just before the month", () => {
    expect(matchesMonthFilter(fest("2025-05-01", "2025-06-30"), 7)).toBe(false);
  });
});

describe("getAvailableMonths", () => {
  it("returns empty array for empty festival list", () => {
    expect(getAvailableMonths([])).toEqual([]);
  });

  it("returns sorted unique months from festival dates", () => {
    const festivals = [
      fest("2025-06-20", "2025-06-25"),
      fest("2025-07-10", "2025-07-14"),
      fest("2025-08-01", "2025-08-05"),
    ];
    expect(getAvailableMonths(festivals)).toEqual([6, 7, 8]);
  });

  it("deduplicates months when multiple festivals share a month", () => {
    const festivals = [
      fest("2025-07-01", "2025-07-05"),
      fest("2025-07-10", "2025-07-15"),
    ];
    expect(getAvailableMonths(festivals)).toEqual([7]);
  });

  it("includes both start and end month when they differ", () => {
    const festivals = [fest("2025-06-28", "2025-07-02")];
    expect(getAvailableMonths(festivals)).toEqual([6, 7]);
  });
});

// ---------------------------------------------------------------------------
// matchesTemporalFilter
// ---------------------------------------------------------------------------

import { matchesTemporalFilter, type TemporalFilterable } from "@/lib/catalogue-filter";

const tf = (endDate: string): TemporalFilterable => ({ endDate });

// Use fixed past/future dates relative to 2026-05-23 (session date)
const PAST_DATE = "2025-01-10";
const FUTURE_DATE = "2027-12-31";
const TODAY = new Date().toLocaleDateString("sv-SE");

describe("matchesTemporalFilter", () => {
  it("always returns true when hidePast is false", () => {
    expect(matchesTemporalFilter(tf(PAST_DATE), false)).toBe(true);
    expect(matchesTemporalFilter(tf(FUTURE_DATE), false)).toBe(true);
  });

  it("returns false for a clearly past festival when hidePast is true", () => {
    expect(matchesTemporalFilter(tf(PAST_DATE), true)).toBe(false);
  });

  it("returns true for a clearly future festival when hidePast is true", () => {
    expect(matchesTemporalFilter(tf(FUTURE_DATE), true)).toBe(true);
  });

  it("returns true for a festival ending today when hidePast is true", () => {
    expect(matchesTemporalFilter(tf(TODAY), true)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// countFollowedFestivals
// ---------------------------------------------------------------------------

describe("countFollowedFestivals", () => {
  it("returns 0 for empty list", () => {
    expect(countFollowedFestivals([])).toBe(0);
  });

  it("returns 0 when no festival is followed", () => {
    expect(countFollowedFestivals([f(false), f(false)])).toBe(0);
  });

  it("counts followed festivals correctly", () => {
    expect(countFollowedFestivals([f(true), f(false), f(true)])).toBe(2);
  });

  it("treats undefined isFollowed as not followed", () => {
    expect(countFollowedFestivals([f(undefined), f(true)])).toBe(1);
  });

  it("returns total when all are followed", () => {
    expect(countFollowedFestivals([f(true), f(true), f(true)])).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// countActiveFestivals
// ---------------------------------------------------------------------------

import { countActiveFestivals, countUpcomingFestivals, type ActiveFestFilterable } from "@/lib/catalogue-filter";

const af = (startDate: string, endDate: string): ActiveFestFilterable => ({ startDate, endDate });
const TODAY_YMD = "2026-05-23";
const NOW = new Date("2026-05-23T12:00:00");

describe("countActiveFestivals", () => {
  it("returns 0 for empty list", () => {
    expect(countActiveFestivals([], NOW)).toBe(0);
  });

  it("counts a festival that started before and ends after today", () => {
    expect(countActiveFestivals([af("2026-05-20", "2026-05-25")], NOW)).toBe(1);
  });

  it("counts a festival that starts and ends today", () => {
    expect(countActiveFestivals([af(TODAY_YMD, TODAY_YMD)], NOW)).toBe(1);
  });

  it("does not count a festival that ended yesterday", () => {
    expect(countActiveFestivals([af("2026-05-20", "2026-05-22")], NOW)).toBe(0);
  });

  it("does not count a festival that starts tomorrow", () => {
    expect(countActiveFestivals([af("2026-05-24", "2026-05-30")], NOW)).toBe(0);
  });

  it("counts multiple active festivals", () => {
    const festivals = [
      af("2026-05-21", "2026-05-24"),
      af("2026-05-23", "2026-05-23"),
      af("2026-05-10", "2026-05-22"),
    ];
    expect(countActiveFestivals(festivals, NOW)).toBe(2);
  });

  it("handles ISO datetime strings with slicing correctly", () => {
    expect(countActiveFestivals([af("2026-05-23T00:00:00.000Z", "2026-05-30T00:00:00.000Z")], NOW)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// countUpcomingFestivals
// ---------------------------------------------------------------------------

describe("countUpcomingFestivals", () => {
  it("returns 0 for empty list", () => {
    expect(countUpcomingFestivals([], NOW, 30)).toBe(0);
  });

  it("does not count a festival currently active (already started)", () => {
    expect(countUpcomingFestivals([af("2026-05-20", "2026-05-25")], NOW, 30)).toBe(0);
  });

  it("does not count a festival starting today (active, not upcoming)", () => {
    expect(countUpcomingFestivals([af(TODAY_YMD, "2026-05-30")], NOW, 30)).toBe(0);
  });

  it("counts a festival starting tomorrow", () => {
    expect(countUpcomingFestivals([af("2026-05-24", "2026-05-28")], NOW, 30)).toBe(1);
  });

  it("counts a festival starting exactly at the cutoff (30 days out)", () => {
    expect(countUpcomingFestivals([af("2026-06-22", "2026-06-26")], NOW, 30)).toBe(1);
  });

  it("does not count a festival starting beyond the cutoff", () => {
    expect(countUpcomingFestivals([af("2026-06-23", "2026-06-28")], NOW, 30)).toBe(0);
  });

  it("counts multiple upcoming festivals within the window", () => {
    const festivals = [
      af("2026-05-24", "2026-05-28"),
      af("2026-06-01", "2026-06-05"),
      af("2026-07-01", "2026-07-05"), // beyond 30 days
    ];
    expect(countUpcomingFestivals(festivals, NOW, 30)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// countFestivalsWithCompleteProgram
// ---------------------------------------------------------------------------

import { countFestivalsWithCompleteProgram, type ProgramStatusFilterable, countVerifiedFestivals, type ConfidenceLevelFilterable } from "@/lib/catalogue-filter";

const ps = (programStatus: string | null | undefined): ProgramStatusFilterable => ({ programStatus });

describe("countFestivalsWithCompleteProgram", () => {
  it("returns 0 for empty list", () => {
    expect(countFestivalsWithCompleteProgram([])).toBe(0);
  });

  it("returns 0 when no festival has complete program", () => {
    expect(countFestivalsWithCompleteProgram([ps("partiel"), ps("bientôt_disponible"), ps(null)])).toBe(0);
  });

  it("counts festivals with programStatus complet", () => {
    expect(countFestivalsWithCompleteProgram([ps("complet"), ps("partiel"), ps("complet")])).toBe(2);
  });

  it("ignores festivals with no programStatus", () => {
    expect(countFestivalsWithCompleteProgram([ps(undefined), ps("complet")])).toBe(1);
  });

  it("returns total when all have complete program", () => {
    expect(countFestivalsWithCompleteProgram([ps("complet"), ps("complet")])).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// countVerifiedFestivals
// ---------------------------------------------------------------------------

const cv = (confidenceLevel: string | null | undefined): ConfidenceLevelFilterable => ({ confidenceLevel });

describe("countVerifiedFestivals", () => {
  it("returns 0 for empty list", () => {
    expect(countVerifiedFestivals([])).toBe(0);
  });

  it("returns 0 when no festival is verified", () => {
    expect(countVerifiedFestivals([cv("auto"), cv(null), cv(undefined)])).toBe(0);
  });

  it("counts festivals with confidenceLevel vérifié_humain", () => {
    expect(countVerifiedFestivals([cv("vérifié_humain"), cv("auto"), cv("vérifié_humain")])).toBe(2);
  });

  it("ignores festivals with no confidenceLevel", () => {
    expect(countVerifiedFestivals([cv(undefined), cv("vérifié_humain")])).toBe(1);
  });

  it("returns total when all are verified", () => {
    expect(countVerifiedFestivals([cv("vérifié_humain"), cv("vérifié_humain")])).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// computeFestivalDurationDays
// ---------------------------------------------------------------------------

describe("computeFestivalDurationDays", () => {
  it("returns 1 for a same-day festival", () => {
    expect(computeFestivalDurationDays("2024-07-20", "2024-07-20")).toBe(1);
  });

  it("returns 3 for a 3-day festival", () => {
    expect(computeFestivalDurationDays("2024-07-20", "2024-07-22")).toBe(3);
  });

  it("returns null for unparseable dates", () => {
    expect(computeFestivalDurationDays("invalid", "2024-07-22")).toBeNull();
  });

  it("handles multi-month range correctly", () => {
    expect(computeFestivalDurationDays("2024-07-30", "2024-08-01")).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// computeAvgFestivalDurationDays
// ---------------------------------------------------------------------------

describe("computeAvgFestivalDurationDays", () => {
  it("returns null for empty list", () => {
    expect(computeAvgFestivalDurationDays([])).toBeNull();
  });

  it("returns the single festival duration", () => {
    expect(computeAvgFestivalDurationDays([{ startDate: "2024-07-20", endDate: "2024-07-22" }])).toBe(3);
  });

  it("averages durations across multiple festivals", () => {
    const festivals = [
      { startDate: "2024-07-20", endDate: "2024-07-20" }, // 1 day
      { startDate: "2024-07-20", endDate: "2024-07-22" }, // 3 days
    ];
    expect(computeAvgFestivalDurationDays(festivals)).toBe(2);
  });

  it("ignores festivals with invalid dates", () => {
    const festivals = [
      { startDate: "invalid", endDate: "2024-07-22" },
      { startDate: "2024-07-20", endDate: "2024-07-22" },
    ];
    expect(computeAvgFestivalDurationDays(festivals)).toBe(3);
  });

  it("returns null when all dates are invalid", () => {
    expect(computeAvgFestivalDurationDays([{ startDate: "bad", endDate: "bad" }])).toBeNull();
  });
});
