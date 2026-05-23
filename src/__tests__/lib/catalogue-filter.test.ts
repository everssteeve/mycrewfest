import { describe, it, expect } from "vitest";
import {
  matchesFollowFilter,
  matchesMonthFilter,
  getAvailableMonths,
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
