import { describe, it, expect } from "vitest";
import { shouldShowScrollTop } from "@/lib/scroll-top";

describe("shouldShowScrollTop", () => {
  it("returns false when at top of page (scrollY = 0)", () => {
    expect(shouldShowScrollTop(0)).toBe(false);
  });

  it("returns false when scroll is below default threshold", () => {
    expect(shouldShowScrollTop(100)).toBe(false);
    expect(shouldShowScrollTop(299)).toBe(false);
  });

  it("returns false at exactly the threshold", () => {
    expect(shouldShowScrollTop(300)).toBe(false);
  });

  it("returns true when scroll exceeds default threshold", () => {
    expect(shouldShowScrollTop(301)).toBe(true);
    expect(shouldShowScrollTop(1000)).toBe(true);
  });

  it("respects custom threshold", () => {
    expect(shouldShowScrollTop(100, 50)).toBe(true);
    expect(shouldShowScrollTop(49, 50)).toBe(false);
    expect(shouldShowScrollTop(500, 600)).toBe(false);
  });

  it("returns false for negative scrollY", () => {
    expect(shouldShowScrollTop(-10)).toBe(false);
  });
});
