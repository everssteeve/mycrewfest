import { describe, it, expect } from "vitest";
import { computeNewsStats, getTopNewsSource } from "@/lib/news-stats";

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
