import { describe, expect, it } from "vitest";
import { buildFollowedSet, isFollowedFestival } from "@/lib/artist-follow";

describe("buildFollowedSet", () => {
  it("builds a set of festival IDs", () => {
    const result = buildFollowedSet([
      { festivalId: "f1" },
      { festivalId: "f2" },
      { festivalId: "f3" },
    ]);
    expect(result.size).toBe(3);
    expect(result.has("f1")).toBe(true);
    expect(result.has("f2")).toBe(true);
  });

  it("returns empty set for empty input", () => {
    expect(buildFollowedSet([])).toEqual(new Set());
  });

  it("handles duplicate IDs (deduplicates)", () => {
    const result = buildFollowedSet([{ festivalId: "f1" }, { festivalId: "f1" }]);
    expect(result.size).toBe(1);
  });
});

describe("isFollowedFestival", () => {
  const followedIds = new Set(["f1", "f2"]);

  it("returns true for followed festival", () => {
    expect(isFollowedFestival(followedIds, "f1")).toBe(true);
  });

  it("returns false for non-followed festival", () => {
    expect(isFollowedFestival(followedIds, "f99")).toBe(false);
  });

  it("returns false for empty set", () => {
    expect(isFollowedFestival(new Set(), "f1")).toBe(false);
  });
});
