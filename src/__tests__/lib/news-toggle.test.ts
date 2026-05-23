import { describe, it, expect } from "vitest";
import { nextPinState, nextUrgencyLevel } from "@/lib/news-toggle";

describe("nextPinState", () => {
  it("flips false to true", () => {
    expect(nextPinState(false)).toBe(true);
  });

  it("flips true to false", () => {
    expect(nextPinState(true)).toBe(false);
  });

  it("is its own inverse", () => {
    expect(nextPinState(nextPinState(true))).toBe(true);
    expect(nextPinState(nextPinState(false))).toBe(false);
  });
});

describe("nextUrgencyLevel", () => {
  it("flips normal to critique", () => {
    expect(nextUrgencyLevel("normal")).toBe("critique");
  });

  it("flips critique to normal", () => {
    expect(nextUrgencyLevel("critique")).toBe("normal");
  });

  it("is its own inverse", () => {
    expect(nextUrgencyLevel(nextUrgencyLevel("normal"))).toBe("normal");
    expect(nextUrgencyLevel(nextUrgencyLevel("critique"))).toBe("critique");
  });

  it("treats unknown value as non-critique (returns critique)", () => {
    expect(nextUrgencyLevel("unknown")).toBe("critique");
  });
});
