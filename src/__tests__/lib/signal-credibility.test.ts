import { describe, it, expect } from "vitest";
import { computeSignalCredibility } from "@/lib/signal-credibility";

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
