import { describe, it, expect } from "vitest";
import { computeNewsStats, getTopNewsSource, countPinnedNewsItems, countUniqueNewsCategories } from "@/lib/news-stats";

const item = (urgencyLevel: "normal" | "critique", isPinned = false) => ({
  urgencyLevel,
  isPinned,
});

describe("computeNewsStats", () => {
  it("returns zeros for empty array", () => {
    expect(computeNewsStats([])).toEqual({ total: 0, critiques: 0, pinned: 0 });
  });

  it("counts total items correctly", () => {
    const items = [item("normal"), item("critique"), item("normal")];
    expect(computeNewsStats(items).total).toBe(3);
  });

  it("counts critique items", () => {
    const items = [item("critique"), item("normal"), item("critique")];
    expect(computeNewsStats(items).critiques).toBe(2);
  });

  it("counts pinned items", () => {
    const items = [item("normal", true), item("critique"), item("normal", true)];
    expect(computeNewsStats(items).pinned).toBe(2);
  });

  it("counts all when all are critique and pinned", () => {
    const items = [item("critique", true), item("critique", true)];
    const stats = computeNewsStats(items);
    expect(stats.critiques).toBe(2);
    expect(stats.pinned).toBe(2);
    expect(stats.total).toBe(2);
  });

  it("returns zero critiques when all are normal", () => {
    const items = [item("normal"), item("normal")];
    expect(computeNewsStats(items).critiques).toBe(0);
  });
});

describe("countPinnedNewsItems", () => {
  const pinned = (isPinned: boolean) => ({ isPinned });

  it("returns 0 for empty array", () => {
    expect(countPinnedNewsItems([])).toBe(0);
  });

  it("returns 0 when no items are pinned", () => {
    expect(countPinnedNewsItems([pinned(false), pinned(false)])).toBe(0);
  });

  it("counts a single pinned item", () => {
    expect(countPinnedNewsItems([pinned(true), pinned(false)])).toBe(1);
  });

  it("counts multiple pinned items", () => {
    expect(countPinnedNewsItems([pinned(true), pinned(true), pinned(false)])).toBe(2);
  });

  it("returns total when all are pinned", () => {
    expect(countPinnedNewsItems([pinned(true), pinned(true), pinned(true)])).toBe(3);
  });
});

describe("getTopNewsSource", () => {
  const src = (source: string) => ({ source });

  it("returns null for empty array", () => {
    expect(getTopNewsSource([])).toBeNull();
  });

  it("returns the only source for a single item", () => {
    expect(getTopNewsSource([src("AFP")])).toBe("AFP");
  });

  it("returns the source with the most items", () => {
    const items = [src("AFP"), src("Reuters"), src("AFP"), src("AFP"), src("Reuters")];
    expect(getTopNewsSource(items)).toBe("AFP");
  });

  it("returns the first encountered source on a tie", () => {
    const items = [src("Reuters"), src("AFP")];
    expect(getTopNewsSource(items)).toBe("Reuters");
  });

  it("handles all items from the same source", () => {
    const items = [src("Le Monde"), src("Le Monde"), src("Le Monde")];
    expect(getTopNewsSource(items)).toBe("Le Monde");
  });
});

describe("countUniqueNewsCategories", () => {
  const cat = (category: string) => ({ category });

  it("returns 0 for empty array", () => {
    expect(countUniqueNewsCategories([])).toBe(0);
  });

  it("returns 1 when all items share the same category", () => {
    expect(countUniqueNewsCategories([cat("logistique"), cat("logistique")])).toBe(1);
  });

  it("counts distinct categories", () => {
    const items = [cat("logistique"), cat("artistes"), cat("logistique"), cat("urgences")];
    expect(countUniqueNewsCategories(items)).toBe(3);
  });

  it("is case-sensitive", () => {
    expect(countUniqueNewsCategories([cat("Logistique"), cat("logistique")])).toBe(2);
  });

  it("returns total count when all items have distinct categories", () => {
    expect(countUniqueNewsCategories([cat("a"), cat("b"), cat("c")])).toBe(3);
  });
});
