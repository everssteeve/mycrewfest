import { describe, it, expect } from "vitest";
import { matchesFollowFilter, type FollowFilterable } from "@/lib/catalogue-filter";

const f = (isFollowed?: boolean): FollowFilterable => ({ isFollowed });

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
