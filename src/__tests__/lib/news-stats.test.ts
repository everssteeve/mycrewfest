import { describe, it, expect } from "vitest";
import { computeNewsStats } from "@/lib/news-stats";

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
