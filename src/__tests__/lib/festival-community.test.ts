import { describe, expect, it } from "vitest";
import {
  formatFollowerCount,
  getFollowerTier,
  getFollowerTierBg,
  getFollowerTierColor,
} from "@/lib/festival-community";

describe("formatFollowerCount", () => {
  it("singular fan for 1", () => expect(formatFollowerCount(1)).toBe("1 fan"));
  it("plural fans for 0", () => expect(formatFollowerCount(0)).toBe("0 fans"));
  it("plural fans for 42", () => expect(formatFollowerCount(42)).toBe("42 fans"));
  it("rounds to 1 decimal for 1500", () => expect(formatFollowerCount(1500)).toBe("1.5k fans"));
  it("no decimal for exact thousands", () => expect(formatFollowerCount(2000)).toBe("2k fans"));
  it("floor for 10k+", () => expect(formatFollowerCount(15_700)).toBe("15k fans"));
  it("floor for 100k", () => expect(formatFollowerCount(100_000)).toBe("100k fans"));
});

describe("getFollowerTier", () => {
  it("Confidentiel for 0", () => expect(getFollowerTier(0)).toBe("Confidentiel"));
  it("Émergent for 1", () => expect(getFollowerTier(1)).toBe("Émergent"));
  it("Émergent for 9", () => expect(getFollowerTier(9)).toBe("Émergent"));
  it("Établi for 10", () => expect(getFollowerTier(10)).toBe("Établi"));
  it("Populaire for 100", () => expect(getFollowerTier(100)).toBe("Populaire"));
  it("Culte for 1000", () => expect(getFollowerTier(1000)).toBe("Culte"));
  it("Culte for 50000", () => expect(getFollowerTier(50000)).toBe("Culte"));
});

describe("getFollowerTierColor", () => {
  it("returns distinct colors for all tiers", () => {
    const tiers = ["Confidentiel", "Émergent", "Établi", "Populaire", "Culte"] as const;
    const colors = tiers.map(getFollowerTierColor);
    expect(new Set(colors).size).toBe(5);
  });
  it("Culte is pink", () => expect(getFollowerTierColor("Culte")).toContain("accent-pink"));
  it("Établi is neon", () => expect(getFollowerTierColor("Établi")).toContain("primary-neon"));
});

describe("getFollowerTierBg", () => {
  it("returns distinct backgrounds for all tiers", () => {
    const tiers = ["Confidentiel", "Émergent", "Établi", "Populaire", "Culte"] as const;
    const bgs = tiers.map(getFollowerTierBg);
    expect(new Set(bgs).size).toBe(5);
  });
});
