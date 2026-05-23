import { describe, it, expect } from "vitest";
import { computeChecklistBudget, computeCompletionRate } from "@/lib/checklist-budget";

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
    const items = [
      { done: true },
      { cost: 8, done: true },
    ];
    expect(computeChecklistBudget(items)).toEqual({ total: 8, spent: 8, remaining: 0 });
  });

  it("works with a single item not done", () => {
    expect(computeChecklistBudget([{ cost: 42, done: false }])).toEqual({ total: 42, spent: 0, remaining: 42 });
  });

  it("works with a single item done", () => {
    expect(computeChecklistBudget([{ cost: 42, done: true }])).toEqual({ total: 42, spent: 42, remaining: 0 });
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
