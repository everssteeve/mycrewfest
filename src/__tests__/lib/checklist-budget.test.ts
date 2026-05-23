import { describe, expect, it } from "vitest";
import {
  computeAvgDaysToComplete,
  computeChecklistBudget,
  computeCompletionRate,
  getOldestPendingItemAgeDays,
} from "@/lib/checklist-budget";

describe("computeChecklistBudget", () => {
  it("returns zeros for empty list", () => {
    expect(computeChecklistBudget([])).toEqual({ total: 0, spent: 0, remaining: 0 });
  });

  it("counts done items as spent", () => {
    const items = [
      { cost: 20, done: true },
      { cost: 30, done: false },
    ];
    expect(computeChecklistBudget(items)).toEqual({ total: 50, spent: 20, remaining: 30 });
  });

  it("counts all as spent when all done", () => {
    const items = [
      { cost: 10, done: true },
      { cost: 15, done: true },
    ];
    expect(computeChecklistBudget(items)).toEqual({ total: 25, spent: 25, remaining: 0 });
  });

  it("remaining equals total when nothing done", () => {
    const items = [
      { cost: 10, done: false },
      { cost: 5, done: false },
    ];
    expect(computeChecklistBudget(items)).toEqual({ total: 15, spent: 0, remaining: 15 });
  });

  it("treats null cost as 0", () => {
    const items = [
      { cost: null, done: true },
      { cost: 10, done: false },
    ];
    expect(computeChecklistBudget(items)).toEqual({ total: 10, spent: 0, remaining: 10 });
  });

  it("treats undefined cost as 0", () => {
    const items = [{ done: true }, { cost: 8, done: true }];
    expect(computeChecklistBudget(items)).toEqual({ total: 8, spent: 8, remaining: 0 });
  });

  it("works with a single item not done", () => {
    expect(computeChecklistBudget([{ cost: 42, done: false }])).toEqual({
      total: 42,
      spent: 0,
      remaining: 42,
    });
  });

  it("works with a single item done", () => {
    expect(computeChecklistBudget([{ cost: 42, done: true }])).toEqual({
      total: 42,
      spent: 42,
      remaining: 0,
    });
  });
});

describe("computeCompletionRate", () => {
  it("returns 0 for empty list", () => {
    expect(computeCompletionRate([])).toBe(0);
  });

  it("returns 0 when nothing is done", () => {
    expect(computeCompletionRate([{ done: false }, { done: false }])).toBe(0);
  });

  it("returns 100 when all items are done", () => {
    expect(computeCompletionRate([{ done: true }, { done: true }])).toBe(100);
  });

  it("computes 50% when half are done", () => {
    const items = [{ done: true }, { done: false }];
    expect(computeCompletionRate(items)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    const items = [{ done: true }, { done: false }, { done: false }];
    // 1/3 ≈ 0.333 → rounds to 33
    expect(computeCompletionRate(items)).toBe(33);
  });

  it("works with a single done item", () => {
    expect(computeCompletionRate([{ done: true }])).toBe(100);
  });

  it("works with a single undone item", () => {
    expect(computeCompletionRate([{ done: false }])).toBe(0);
  });
});

describe("getOldestPendingItemAgeDays", () => {
  const now = new Date("2026-07-15T12:00:00Z");
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60_000).toISOString();

  it("returns null for empty list", () => {
    expect(getOldestPendingItemAgeDays([], now)).toBeNull();
  });

  it("returns null when all items are done", () => {
    const items = [
      { done: true, createdAt: daysAgo(5) },
      { done: true, createdAt: daysAgo(10) },
    ];
    expect(getOldestPendingItemAgeDays(items, now)).toBeNull();
  });

  it("returns the age of the oldest pending item", () => {
    const items = [
      { done: false, createdAt: daysAgo(3) },
      { done: false, createdAt: daysAgo(7) },
      { done: true, createdAt: daysAgo(15) },
    ];
    expect(getOldestPendingItemAgeDays(items, now)).toBe(7);
  });

  it("ignores done items when computing oldest", () => {
    const items = [
      { done: true, createdAt: daysAgo(20) },
      { done: false, createdAt: daysAgo(2) },
    ];
    expect(getOldestPendingItemAgeDays(items, now)).toBe(2);
  });

  it("ignores items with unparseable createdAt", () => {
    const items = [
      { done: false, createdAt: "not-a-date" },
      { done: false, createdAt: daysAgo(4) },
    ];
    expect(getOldestPendingItemAgeDays(items, now)).toBe(4);
  });

  it("returns 0 for a pending item created today", () => {
    const items = [{ done: false, createdAt: daysAgo(0) }];
    expect(getOldestPendingItemAgeDays(items, now)).toBe(0);
  });
});

describe("computeAvgDaysToComplete", () => {
  const _makeItem = (done: boolean, createdDaysAgo: number, updatedDaysAgo: number) => ({
    done,
    createdAt: new Date("2026-07-15T12:00:00Z")
      .toISOString()
      .replace(
        "2026-07-15",
        new Date(new Date("2026-07-15").getTime() - createdDaysAgo * 86_400_000)
          .toISOString()
          .slice(0, 10),
      ),
    updatedAt: new Date("2026-07-15T12:00:00Z")
      .toISOString()
      .replace(
        "2026-07-15",
        new Date(new Date("2026-07-15").getTime() - updatedDaysAgo * 86_400_000)
          .toISOString()
          .slice(0, 10),
      ),
  });

  it("returns null for empty list", () => {
    expect(computeAvgDaysToComplete([])).toBeNull();
  });

  it("returns null when all items are pending", () => {
    const items = [
      { done: false, createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-10T00:00:00Z" },
    ];
    expect(computeAvgDaysToComplete(items)).toBeNull();
  });

  it("returns 0 when item was completed the same day it was created", () => {
    const items = [
      { done: true, createdAt: "2026-07-10T08:00:00Z", updatedAt: "2026-07-10T22:00:00Z" },
    ];
    expect(computeAvgDaysToComplete(items)).toBe(0);
  });

  it("computes correct average for multiple done items", () => {
    const items = [
      { done: true, createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-03T00:00:00Z" },
      { done: true, createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-05T00:00:00Z" },
      { done: false, createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-10T00:00:00Z" },
    ];
    expect(computeAvgDaysToComplete(items)).toBe(3);
  });

  it("ignores items with unparseable timestamps", () => {
    const items = [
      { done: true, createdAt: "bad", updatedAt: "also-bad" },
      { done: true, createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-07T00:00:00Z" },
    ];
    expect(computeAvgDaysToComplete(items)).toBe(6);
  });
});
