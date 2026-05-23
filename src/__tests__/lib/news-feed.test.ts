import { describe, expect, it } from "vitest";
import {
  countCriticalItems,
  type FeedItem,
  getFeedCategoryLabel,
  getRecentItemCount,
  groupFeedByDay,
  sortFeedItems,
} from "@/lib/news-feed";

function makeItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: "item-1",
    festivalId: "fest-1",
    festivalName: "Rock en Seine",
    festivalSlug: "rock-en-seine-2026",
    summary: "Nouvelle tête d'affiche annoncée.",
    category: "line-up",
    urgencyLevel: "normal",
    isPinned: false,
    publishedAt: "2026-07-10T14:00:00.000Z",
    sourceUrl: null,
    ...overrides,
  };
}

describe("sortFeedItems", () => {
  it("puts pinned items first", () => {
    const items = [makeItem({ id: "a", isPinned: false }), makeItem({ id: "b", isPinned: true })];
    const result = sortFeedItems(items);
    expect(result[0].id).toBe("b");
  });

  it("puts critique items before normal among unpinned", () => {
    const items = [
      makeItem({ id: "a", urgencyLevel: "normal" }),
      makeItem({ id: "b", urgencyLevel: "critique" }),
    ];
    const result = sortFeedItems(items);
    expect(result[0].id).toBe("b");
  });

  it("sorts by publishedAt descending for same priority", () => {
    const items = [
      makeItem({ id: "old", publishedAt: "2026-07-01T00:00:00.000Z" }),
      makeItem({ id: "new", publishedAt: "2026-07-15T00:00:00.000Z" }),
    ];
    const result = sortFeedItems(items);
    expect(result[0].id).toBe("new");
  });

  it("pinned takes precedence over critique", () => {
    const items = [
      makeItem({ id: "critique", urgencyLevel: "critique", isPinned: false }),
      makeItem({ id: "pinned", urgencyLevel: "normal", isPinned: true }),
    ];
    const result = sortFeedItems(items);
    expect(result[0].id).toBe("pinned");
  });

  it("returns empty array for empty input", () => {
    expect(sortFeedItems([])).toEqual([]);
  });
});

describe("groupFeedByDay", () => {
  it("groups items by date", () => {
    const items = [
      makeItem({ id: "a", publishedAt: "2026-07-10T14:00:00.000Z" }),
      makeItem({ id: "b", publishedAt: "2026-07-10T20:00:00.000Z" }),
      makeItem({ id: "c", publishedAt: "2026-07-11T10:00:00.000Z" }),
    ];
    const result = groupFeedByDay(items);
    expect(result).toHaveLength(2);
    const july10 = result.find((d) => d.dateKey === "2026-07-10");
    expect(july10?.items).toHaveLength(2);
  });

  it("sorts days newest first", () => {
    const items = [
      makeItem({ id: "a", publishedAt: "2026-07-08T00:00:00.000Z" }),
      makeItem({ id: "b", publishedAt: "2026-07-12T00:00:00.000Z" }),
    ];
    const result = groupFeedByDay(items);
    expect(result[0].dateKey).toBe("2026-07-12");
  });

  it("returns empty array for empty input", () => {
    expect(groupFeedByDay([])).toEqual([]);
  });
});

describe("countCriticalItems", () => {
  it("counts only critique items", () => {
    const items = [
      makeItem({ urgencyLevel: "critique" }),
      makeItem({ urgencyLevel: "normal" }),
      makeItem({ urgencyLevel: "critique" }),
    ];
    expect(countCriticalItems(items)).toBe(2);
  });

  it("returns 0 when no critiques", () => {
    expect(countCriticalItems([makeItem()])).toBe(0);
  });
});

describe("getRecentItemCount", () => {
  it("counts items within the window", () => {
    const now = new Date("2026-07-15T12:00:00.000Z");
    const items = [
      makeItem({ publishedAt: "2026-07-14T00:00:00.000Z" }), // 1 day ago
      makeItem({ publishedAt: "2026-07-10T00:00:00.000Z" }), // 5 days ago
      makeItem({ publishedAt: "2026-07-01T00:00:00.000Z" }), // 14 days ago
    ];
    expect(getRecentItemCount(items, 7, now)).toBe(2);
  });

  it("returns 0 when all items are outside window", () => {
    const now = new Date("2026-07-15T12:00:00.000Z");
    const items = [makeItem({ publishedAt: "2026-06-01T00:00:00.000Z" })];
    expect(getRecentItemCount(items, 7, now)).toBe(0);
  });
});

describe("getFeedCategoryLabel", () => {
  it("returns known labels", () => {
    expect(getFeedCategoryLabel("line-up")).toBe("Line-up");
    expect(getFeedCategoryLabel("logistique")).toBe("Logistique");
  });

  it("falls back to raw category for unknown", () => {
    expect(getFeedCategoryLabel("unknown-cat")).toBe("unknown-cat");
  });
});
