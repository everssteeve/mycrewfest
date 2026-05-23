import { describe, it, expect } from "vitest";
import { sortNewsItems, countByUrgency, countPinned } from "@/lib/festival-news";
import type { NewsItemSummary } from "@/lib/types";

function makeNews(id: string, opts: Partial<NewsItemSummary> = {}): NewsItemSummary {
  return {
    id,
    source: "instagram",
    publishedAt: "2026-05-20T10:00:00Z",
    category: "autre",
    summary: "Test",
    urgencyLevel: "normal",
    isPinned: false,
    ...opts,
  };
}

const items: NewsItemSummary[] = [
  makeNews("1", { urgencyLevel: "normal", isPinned: false, publishedAt: "2026-05-20T10:00:00Z" }),
  makeNews("2", { urgencyLevel: "critique", isPinned: false, publishedAt: "2026-05-19T10:00:00Z" }),
  makeNews("3", { urgencyLevel: "normal", isPinned: true, publishedAt: "2026-05-18T10:00:00Z" }),
  makeNews("4", { urgencyLevel: "normal", isPinned: false, publishedAt: "2026-05-21T10:00:00Z" }),
];

describe("sortNewsItems", () => {
  it("pinned items come first", () => {
    const result = sortNewsItems(items);
    expect(result[0].isPinned).toBe(true);
  });

  it("critique items come before normal (among unpinned)", () => {
    const unpinned = sortNewsItems(items).filter((i) => !i.isPinned);
    const critIdx = unpinned.findIndex((i) => i.urgencyLevel === "critique");
    const normalIdx = unpinned.findIndex((i) => i.urgencyLevel === "normal");
    expect(critIdx).toBeLessThan(normalIdx);
  });

  it("sorts by publishedAt desc within same urgency", () => {
    const normals = sortNewsItems(items).filter((i) => !i.isPinned && i.urgencyLevel === "normal");
    expect(new Date(normals[0].publishedAt).getTime())
      .toBeGreaterThan(new Date(normals[1].publishedAt).getTime());
  });

  it("does not mutate original array", () => {
    const original = [...items];
    sortNewsItems(items);
    expect(items).toEqual(original);
  });
});

describe("countByUrgency", () => {
  it("counts normal and critique correctly", () => {
    const { normal, critique } = countByUrgency(items);
    expect(normal).toBe(3);
    expect(critique).toBe(1);
  });

  it("returns zeros for empty array", () => {
    expect(countByUrgency([])).toEqual({ normal: 0, critique: 0 });
  });
});

describe("countPinned", () => {
  it("counts pinned items correctly", () => {
    expect(countPinned(items)).toBe(1);
  });

  it("returns 0 when none pinned", () => {
    const noPinned = items.filter((i) => !i.isPinned);
    expect(countPinned(noPinned)).toBe(0);
  });
});
