import { describe, it, expect } from "vitest";
import { computeSignalCredibility, countForteSignals, countRecentSignals, countContestedSignals, getTopSignalType, computeSignalCredibilityRate, countUniqueSignalAuthors, countExpiredSignals, computeAvgSignalAgeHours } from "@/lib/signal-credibility";

describe("computeSignalCredibility", () => {
  it("returns 0.5 neutre when no votes", () => {
    const result = computeSignalCredibility({ confirmations: 0, infirmations: 0 });
    expect(result.score).toBe(0.5);
    expect(result.total).toBe(0);
    expect(result.label).toBe("neutre");
  });

  it("returns forte when all votes are confirmations", () => {
    const result = computeSignalCredibility({ confirmations: 10, infirmations: 0 });
    expect(result.score).toBe(1);
    expect(result.label).toBe("forte");
    expect(result.total).toBe(10);
  });

  it("returns faible when all votes are infirmations", () => {
    const result = computeSignalCredibility({ confirmations: 0, infirmations: 10 });
    expect(result.score).toBe(0);
    expect(result.label).toBe("faible");
  });

  it("returns forte at exactly 0.67 threshold (2/3)", () => {
    const result = computeSignalCredibility({ confirmations: 2, infirmations: 1 });
    expect(result.score).toBeCloseTo(0.667, 2);
    expect(result.label).toBe("forte");
  });

  it("returns neutre in the middle range", () => {
    const result = computeSignalCredibility({ confirmations: 3, infirmations: 3 });
    expect(result.score).toBe(0.5);
    expect(result.label).toBe("neutre");
  });

  it("returns faible when below 0.33 threshold", () => {
    const result = computeSignalCredibility({ confirmations: 1, infirmations: 3 });
    expect(result.score).toBe(0.25);
    expect(result.label).toBe("faible");
  });

  it("computes total correctly", () => {
    const result = computeSignalCredibility({ confirmations: 5, infirmations: 3 });
    expect(result.total).toBe(8);
  });

  it("returns forte with high confirmation ratio", () => {
    const result = computeSignalCredibility({ confirmations: 9, infirmations: 1 });
    expect(result.score).toBe(0.9);
    expect(result.label).toBe("forte");
  });
});

describe("countForteSignals", () => {
  it("returns 0 for empty array", () => {
    expect(countForteSignals([])).toBe(0);
  });

  it("returns 0 when no signals are forte", () => {
    const signals = [
      { confirmations: 0, infirmations: 0 },
      { confirmations: 1, infirmations: 3 },
    ];
    expect(countForteSignals(signals)).toBe(0);
  });

  it("counts forte signals correctly", () => {
    const signals = [
      { confirmations: 10, infirmations: 0 },
      { confirmations: 1, infirmations: 3 },
      { confirmations: 2, infirmations: 1 },
    ];
    expect(countForteSignals(signals)).toBe(2);
  });

  it("counts all when all are forte", () => {
    const signals = [
      { confirmations: 5, infirmations: 1 },
      { confirmations: 9, infirmations: 0 },
    ];
    expect(countForteSignals(signals)).toBe(2);
  });
});

describe("countRecentSignals", () => {
  const now = new Date("2026-05-23T12:00:00Z");
  const daysAgo = (n: number) =>
    new Date(now.getTime() - n * 24 * 60 * 60 * 1_000).toISOString();

  it("returns 0 for empty array", () => {
    expect(countRecentSignals([], 7, now)).toBe(0);
  });

  it("counts signals within the window", () => {
    const signals = [
      { createdAt: daysAgo(1) },
      { createdAt: daysAgo(3) },
      { createdAt: daysAgo(10) },
    ];
    expect(countRecentSignals(signals, 7, now)).toBe(2);
  });

  it("returns 0 when all signals are older than the window", () => {
    const signals = [{ createdAt: daysAgo(8) }, { createdAt: daysAgo(30) }];
    expect(countRecentSignals(signals, 7, now)).toBe(0);
  });

  it("includes signal exactly at the cutoff boundary", () => {
    const signals = [{ createdAt: daysAgo(7) }];
    expect(countRecentSignals(signals, 7, now)).toBe(1);
  });

  it("excludes signals with invalid createdAt", () => {
    const signals = [{ createdAt: "not-a-date" }, { createdAt: daysAgo(2) }];
    expect(countRecentSignals(signals, 7, now)).toBe(1);
  });
});

describe("countContestedSignals", () => {
  const sig = (confirmations: number, infirmations: number) => ({ confirmations, infirmations });

  it("returns 0 for empty array", () => {
    expect(countContestedSignals([])).toBe(0);
  });

  it("returns 0 when no signals have infirmations", () => {
    expect(countContestedSignals([sig(5, 0), sig(3, 0)])).toBe(0);
  });

  it("counts a single contested signal", () => {
    expect(countContestedSignals([sig(5, 1), sig(3, 0)])).toBe(1);
  });

  it("counts multiple contested signals", () => {
    expect(countContestedSignals([sig(5, 2), sig(1, 1), sig(3, 0)])).toBe(2);
  });

  it("counts signals with zero confirmations as contested if they have infirmations", () => {
    expect(countContestedSignals([sig(0, 1)])).toBe(1);
  });
});

describe("getTopSignalType", () => {
  it("returns null for empty array", () => {
    expect(getTopSignalType([])).toBeNull();
  });

  it("returns null when no signals have a predefinedPhrase", () => {
    const signals = [{ predefinedPhrase: null }, { predefinedPhrase: undefined }];
    expect(getTopSignalType(signals)).toBeNull();
  });

  it("returns the only phrase present", () => {
    const signals = [{ predefinedPhrase: "Foule dense" }];
    expect(getTopSignalType(signals)).toEqual({ phrase: "Foule dense", count: 1 });
  });

  it("returns the most frequent phrase", () => {
    const signals = [
      { predefinedPhrase: "Foule dense" },
      { predefinedPhrase: "Foule dense" },
      { predefinedPhrase: "File d'attente longue" },
    ];
    expect(getTopSignalType(signals)).toEqual({ phrase: "Foule dense", count: 2 });
  });

  it("breaks ties alphabetically", () => {
    const signals = [
      { predefinedPhrase: "Foule dense" },
      { predefinedPhrase: "Animation spontanée" },
    ];
    expect(getTopSignalType(signals)).toEqual({ phrase: "Animation spontanée", count: 1 });
  });

  it("ignores signals with null or undefined phrase", () => {
    const signals = [
      { predefinedPhrase: null },
      { predefinedPhrase: "Foule dense" },
      { predefinedPhrase: "Foule dense" },
    ];
    expect(getTopSignalType(signals)).toEqual({ phrase: "Foule dense", count: 2 });
  });
});

describe("computeSignalCredibilityRate", () => {
  it("returns 0 for empty list", () => {
    expect(computeSignalCredibilityRate([])).toBe(0);
  });

  it("returns 100 when all signals are forte", () => {
    const signals = [
      { confirmations: 3, infirmations: 0 },
      { confirmations: 5, infirmations: 1 },
    ];
    expect(computeSignalCredibilityRate(signals)).toBe(100);
  });

  it("returns 0 when no signals are forte", () => {
    const signals = [
      { confirmations: 0, infirmations: 0 },
      { confirmations: 1, infirmations: 3 },
    ];
    expect(computeSignalCredibilityRate(signals)).toBe(0);
  });

  it("returns rounded percentage for mixed credibility", () => {
    // 2 forte out of 3 → 67%
    const signals = [
      { confirmations: 4, infirmations: 0 },
      { confirmations: 3, infirmations: 0 },
      { confirmations: 0, infirmations: 2 },
    ];
    expect(computeSignalCredibilityRate(signals)).toBe(67);
  });

  it("rounds correctly for single forte signal", () => {
    const signals = [
      { confirmations: 4, infirmations: 0 },
      { confirmations: 0, infirmations: 1 },
    ];
    expect(computeSignalCredibilityRate(signals)).toBe(50);
  });
});

describe("countUniqueSignalAuthors", () => {
  const signal = (authorId: string) => ({ authorId });

  it("returns 0 for empty list", () => {
    expect(countUniqueSignalAuthors([])).toBe(0);
  });

  it("counts each unique authorId once", () => {
    const signals = [signal("a"), signal("b"), signal("a"), signal("c")];
    expect(countUniqueSignalAuthors(signals)).toBe(3);
  });

  it("returns 1 when all signals share the same author", () => {
    const signals = [signal("user-1"), signal("user-1"), signal("user-1")];
    expect(countUniqueSignalAuthors(signals)).toBe(1);
  });

  it("treats each distinct authorId as unique", () => {
    const signals = [signal("alice"), signal("bob")];
    expect(countUniqueSignalAuthors(signals)).toBe(2);
  });
});

describe("countExpiredSignals", () => {
  const now = new Date("2026-07-15T12:00:00Z");
  const inPast = (minsAgo: number) => new Date(now.getTime() - minsAgo * 60_000).toISOString();
  const inFuture = (mins: number) => new Date(now.getTime() + mins * 60_000).toISOString();

  it("returns 0 for empty list", () => {
    expect(countExpiredSignals([], now)).toBe(0);
  });

  it("counts signals whose expiresAt is in the past", () => {
    const signals = [
      { expiresAt: inPast(30) },
      { expiresAt: inPast(120) },
      { expiresAt: inFuture(60) },
    ];
    expect(countExpiredSignals(signals, now)).toBe(2);
  });

  it("returns 0 when all signals are still active", () => {
    const signals = [{ expiresAt: inFuture(10) }, { expiresAt: inFuture(100) }];
    expect(countExpiredSignals(signals, now)).toBe(0);
  });

  it("ignores signals with unparseable expiresAt", () => {
    const signals = [{ expiresAt: "bad-date" }, { expiresAt: inPast(5) }];
    expect(countExpiredSignals(signals, now)).toBe(1);
  });

  it("does not count a signal expiring exactly at now", () => {
    const signals = [{ expiresAt: now.toISOString() }];
    expect(countExpiredSignals(signals, now)).toBe(0);
  });
});

describe("computeAvgSignalAgeHours", () => {
  const now = new Date("2026-07-15T18:00:00Z");

  it("returns null for empty list", () => {
    expect(computeAvgSignalAgeHours([], now)).toBeNull();
  });

  it("returns null when all createdAt are unparseable", () => {
    const signals = [{ createdAt: "not-a-date" }, { createdAt: "" }];
    expect(computeAvgSignalAgeHours(signals, now)).toBeNull();
  });

  it("returns 0 for a signal created at now", () => {
    const signals = [{ createdAt: now.toISOString() }];
    expect(computeAvgSignalAgeHours(signals, now)).toBe(0);
  });

  it("returns correct age in hours for a single signal", () => {
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60_000);
    const signals = [{ createdAt: twoHoursAgo.toISOString() }];
    expect(computeAvgSignalAgeHours(signals, now)).toBe(2);
  });

  it("averages ages across multiple signals", () => {
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60_000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60_000);
    const signals = [
      { createdAt: twoHoursAgo.toISOString() },
      { createdAt: fourHoursAgo.toISOString() },
    ];
    expect(computeAvgSignalAgeHours(signals, now)).toBe(3);
  });

  it("ignores future-dated signals", () => {
    const inOneHour = new Date(now.getTime() + 60 * 60_000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60_000);
    const signals = [
      { createdAt: inOneHour.toISOString() },
      { createdAt: twoHoursAgo.toISOString() },
    ];
    expect(computeAvgSignalAgeHours(signals, now)).toBe(2);
  });

  it("floors partial hours", () => {
    const ninetyMinsAgo = new Date(now.getTime() - 90 * 60_000);
    const signals = [{ createdAt: ninetyMinsAgo.toISOString() }];
    expect(computeAvgSignalAgeHours(signals, now)).toBe(1);
  });
});
