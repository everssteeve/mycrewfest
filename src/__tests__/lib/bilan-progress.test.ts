import { describe, it, expect } from "vitest";
import { computeSelectionCompletionPercent, computeTotalSelected } from "@/lib/bilan-progress";

describe("computeSelectionCompletionPercent", () => {
  it("returns 0 when no events selected", () => {
    expect(computeSelectionCompletionPercent(0, 0, 0)).toBe(0);
  });

  it("returns 100 when all events seen", () => {
    expect(computeSelectionCompletionPercent(10, 0, 0)).toBe(100);
  });

  it("returns 0 when seen is 0 but pending exist", () => {
    expect(computeSelectionCompletionPercent(0, 5, 3)).toBe(0);
  });

  it("rounds to nearest percent", () => {
    // 1/3 = 33.33... → 33
    expect(computeSelectionCompletionPercent(1, 2, 0)).toBe(33);
    // 2/3 = 66.66... → 67
    expect(computeSelectionCompletionPercent(2, 1, 0)).toBe(67);
  });

  it("accounts for both must-see and intéressé pending", () => {
    // 5 seen / (5+3+2) = 5/10 = 50%
    expect(computeSelectionCompletionPercent(5, 3, 2)).toBe(50);
  });

  it("returns 50 for equal seen and pending", () => {
    expect(computeSelectionCompletionPercent(4, 2, 2)).toBe(50);
  });
});

describe("computeTotalSelected", () => {
  it("sums all three values", () => {
    expect(computeTotalSelected(5, 3, 2)).toBe(10);
  });

  it("returns 0 when all zero", () => {
    expect(computeTotalSelected(0, 0, 0)).toBe(0);
  });

  it("works when only seen", () => {
    expect(computeTotalSelected(7, 0, 0)).toBe(7);
  });
});
