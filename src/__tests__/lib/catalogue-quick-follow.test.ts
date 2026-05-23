import { describe, it, expect } from "vitest";
import {
  buildFollowApiUrl,
  getFollowToggleAriaLabel,
  getFollowButtonLabel,
  getFollowToggleMethod,
  deriveOptimisticFollowState,
} from "@/lib/catalogue-quick-follow";

describe("buildFollowApiUrl", () => {
  it("builds correct URL", () => {
    expect(buildFollowApiUrl("hellfest-2026")).toBe("/api/festivals/hellfest-2026/follow");
  });
  it("includes the slug verbatim", () => {
    expect(buildFollowApiUrl("rock-en-seine")).toContain("rock-en-seine");
  });
});

describe("getFollowToggleAriaLabel", () => {
  it("says Ne plus suivre when already followed", () => {
    const label = getFollowToggleAriaLabel(true, "Hellfest");
    expect(label).toContain("Ne plus suivre");
    expect(label).toContain("Hellfest");
  });
  it("says Suivre when not followed", () => {
    const label = getFollowToggleAriaLabel(false, "Hellfest");
    expect(label).toContain("Suivre");
    expect(label).toContain("Hellfest");
    expect(label).not.toContain("Ne plus");
  });
});

describe("getFollowButtonLabel", () => {
  it("returns Suivi when followed", () => expect(getFollowButtonLabel(true)).toBe("Suivi"));
  it("returns Suivre when not followed", () => expect(getFollowButtonLabel(false)).toBe("Suivre"));
});

describe("getFollowToggleMethod", () => {
  it("DELETE when currently followed", () => expect(getFollowToggleMethod(true)).toBe("DELETE"));
  it("POST when not followed", () => expect(getFollowToggleMethod(false)).toBe("POST"));
});

describe("deriveOptimisticFollowState", () => {
  it("returns new follow state on success", () => {
    expect(deriveOptimisticFollowState(false, true, true)).toBe(true);
  });
  it("returns new unfollow state on success", () => {
    expect(deriveOptimisticFollowState(true, true, false)).toBe(false);
  });
  it("reverts to current state on server failure", () => {
    expect(deriveOptimisticFollowState(false, false, true)).toBe(false);
    expect(deriveOptimisticFollowState(true, false, false)).toBe(true);
  });
});
