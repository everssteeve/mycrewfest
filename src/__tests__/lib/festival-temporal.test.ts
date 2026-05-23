import { describe, it, expect } from "vitest";
import {
  getFestivalTemporalStatus,
  getDaysUntilStart,
  compareByTemporalRelevance,
  formatTemporalBadge,
} from "@/lib/festival-temporal";

const d = (offsetDays: number, base = new Date("2026-06-15T12:00:00Z")): string => {
  const dt = new Date(base);
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString().slice(0, 10);
};

const NOW = new Date("2026-06-15T12:00:00Z");

describe("getFestivalTemporalStatus", () => {
  it("returns 'en_cours' when today is between start and end (inclusive)", () => {
    expect(getFestivalTemporalStatus(d(-2), d(2), NOW)).toBe("en_cours");
  });

  it("returns 'en_cours' when today is the first day", () => {
    expect(getFestivalTemporalStatus(d(0), d(3), NOW)).toBe("en_cours");
  });

  it("returns 'en_cours' when today is the last day", () => {
    expect(getFestivalTemporalStatus(d(-3), d(0), NOW)).toBe("en_cours");
  });

  it("returns 'past' when endDate is yesterday", () => {
    expect(getFestivalTemporalStatus(d(-5), d(-1), NOW)).toBe("past");
  });

  it("returns 'imminent' when festival starts tomorrow", () => {
    expect(getFestivalTemporalStatus(d(1), d(4), NOW)).toBe("imminent");
  });

  it("returns 'imminent' when festival starts in 7 days", () => {
    expect(getFestivalTemporalStatus(d(7), d(10), NOW)).toBe("imminent");
  });

  it("returns 'upcoming' when festival starts in 8 days", () => {
    expect(getFestivalTemporalStatus(d(8), d(12), NOW)).toBe("upcoming");
  });

  it("returns 'upcoming' for a festival far in the future", () => {
    expect(getFestivalTemporalStatus(d(100), d(105), NOW)).toBe("upcoming");
  });

  it("accepts Date objects as well as strings", () => {
    const start = new Date(d(-1));
    const end = new Date(d(1));
    expect(getFestivalTemporalStatus(start, end, NOW)).toBe("en_cours");
  });
});

describe("getDaysUntilStart", () => {
  it("returns 0 when festival starts today", () => {
    expect(getDaysUntilStart(d(0), NOW)).toBe(0);
  });

  it("returns 1 when festival starts tomorrow", () => {
    expect(getDaysUntilStart(d(1), NOW)).toBe(1);
  });

  it("returns 7 when festival starts in 7 days", () => {
    expect(getDaysUntilStart(d(7), NOW)).toBe(7);
  });

  it("returns negative value when festival already started", () => {
    expect(getDaysUntilStart(d(-3), NOW)).toBe(-3);
  });
});

describe("compareByTemporalRelevance", () => {
  const make = (startOffset: number, endOffset: number) => ({
    startDate: d(startOffset),
    endDate: d(endOffset),
  });

  it("sorts en_cours before upcoming", () => {
    const ongoing = make(-1, 2);
    const future = make(10, 14);
    expect(compareByTemporalRelevance(ongoing, future, NOW)).toBeLessThan(0);
    expect(compareByTemporalRelevance(future, ongoing, NOW)).toBeGreaterThan(0);
  });

  it("sorts imminent before upcoming", () => {
    const imminent = make(3, 5);
    const future = make(20, 24);
    expect(compareByTemporalRelevance(imminent, future, NOW)).toBeLessThan(0);
  });

  it("sorts past after upcoming", () => {
    const past = make(-10, -5);
    const future = make(10, 14);
    expect(compareByTemporalRelevance(past, future, NOW)).toBeGreaterThan(0);
  });

  it("sorts within 'upcoming' by startDate ascending", () => {
    const sooner = make(10, 12);
    const later = make(20, 22);
    expect(compareByTemporalRelevance(sooner, later, NOW)).toBeLessThan(0);
  });

  it("sorts within 'past' by endDate descending (most recent first)", () => {
    const recentPast = make(-5, -2);
    const oldPast = make(-20, -15);
    expect(compareByTemporalRelevance(recentPast, oldPast, NOW)).toBeLessThan(0);
  });

  it("returns 0 for identical festivals", () => {
    const f = make(5, 8);
    expect(compareByTemporalRelevance(f, f, NOW)).toBe(0);
  });

  it("correctly orders: en_cours, imminent, upcoming, past", () => {
    const ongoing = make(-1, 2);
    const imminent = make(3, 5);
    const upcoming = make(15, 18);
    const past = make(-10, -5);
    const list = [past, upcoming, imminent, ongoing].sort((a, b) =>
      compareByTemporalRelevance(a, b, NOW)
    );
    expect(list).toEqual([ongoing, imminent, upcoming, past]);
  });
});

describe("formatTemporalBadge", () => {
  it("returns 'En cours' for en_cours status", () => {
    expect(formatTemporalBadge("en_cours", 0)).toBe("En cours");
  });

  it("returns 'Demain' when imminent and daysUntil is 0", () => {
    expect(formatTemporalBadge("imminent", 0)).toBe("Demain");
  });

  it("returns 'Dans N j' when imminent and daysUntil > 0", () => {
    expect(formatTemporalBadge("imminent", 3)).toBe("Dans 3 j");
    expect(formatTemporalBadge("imminent", 7)).toBe("Dans 7 j");
  });

  it("returns 'Passé' for past status", () => {
    expect(formatTemporalBadge("past", -5)).toBe("Passé");
  });

  it("returns null for upcoming status", () => {
    expect(formatTemporalBadge("upcoming", 30)).toBeNull();
  });
});
