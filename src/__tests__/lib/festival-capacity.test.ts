import { describe, it, expect } from "vitest";
import {
  getCapacityTier,
  getCapacityTierColor,
  getCapacityTierBg,
  formatCapacityLabel,
  buildCapacityAriaLabel,
} from "@/lib/festival-capacity";

describe("getCapacityTier", () => {
  it("Intime for < 1000", () => expect(getCapacityTier(500)).toBe("Intime"));
  it("Petit for 1000-4999", () => expect(getCapacityTier(2000)).toBe("Petit"));
  it("Moyen for 5000-19999", () => expect(getCapacityTier(10_000)).toBe("Moyen"));
  it("Grand for 20000-49999", () => expect(getCapacityTier(30_000)).toBe("Grand"));
  it("Méga for ≥50000", () => expect(getCapacityTier(60_000)).toBe("Méga"));
  it("exact boundary 1000 is Petit", () => expect(getCapacityTier(1_000)).toBe("Petit"));
  it("exact boundary 5000 is Moyen", () => expect(getCapacityTier(5_000)).toBe("Moyen"));
  it("exact boundary 20000 is Grand", () => expect(getCapacityTier(20_000)).toBe("Grand"));
  it("exact boundary 50000 is Méga", () => expect(getCapacityTier(50_000)).toBe("Méga"));
});

describe("getCapacityTierColor", () => {
  it("returns distinct colors for each tier", () => {
    const tiers = ["Intime", "Petit", "Moyen", "Grand", "Méga"] as const;
    const colors = tiers.map(getCapacityTierColor);
    expect(new Set(colors).size).toBe(5);
  });
  it("Méga is pink", () => expect(getCapacityTierColor("Méga")).toContain("accent-pink"));
});

describe("getCapacityTierBg", () => {
  it("returns distinct backgrounds for each tier", () => {
    const tiers = ["Intime", "Petit", "Moyen", "Grand", "Méga"] as const;
    const bgs = tiers.map(getCapacityTierBg);
    expect(new Set(bgs).size).toBe(5);
  });
});

describe("formatCapacityLabel", () => {
  it("formats exact thousands as Nk", () => expect(formatCapacityLabel(60_000)).toBe("60k"));
  it("formats non-exact with one decimal", () => expect(formatCapacityLabel(1_500)).toBe("1.5k"));
  it("formats sub-1000 as plain number", () => expect(formatCapacityLabel(500)).toBe("500"));
  it("formats 20000 as 20k", () => expect(formatCapacityLabel(20_000)).toBe("20k"));
});

describe("buildCapacityAriaLabel", () => {
  it("includes capacity and tier name", () => {
    const label = buildCapacityAriaLabel(60_000, "Méga");
    expect(label).toContain("60k");
    expect(label).toContain("Méga");
  });
});
