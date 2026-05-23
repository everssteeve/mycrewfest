import { describe, it, expect } from "vitest";
import { filterFeedByFestival, getFollowedFestivalsFromFeed, type FeedItem } from "@/lib/news-feed";

const makeItem = (id: string, festivalId: string, festivalName: string): FeedItem => ({
  id,
  festivalId,
  festivalName,
  festivalSlug: festivalId,
  summary: "test",
  category: "autre",
  urgencyLevel: "normal",
  isPinned: false,
  publishedAt: "2026-05-20T10:00:00Z",
  sourceUrl: null,
});

const items: FeedItem[] = [
  makeItem("1", "hellfest", "Hellfest"),
  makeItem("2", "hellfest", "Hellfest"),
  makeItem("3", "solidays", "Solidays"),
  makeItem("4", "garorock", "Garorock"),
];

describe("filterFeedByFestival", () => {
  it("returns all items when festivalId is null", () => {
    expect(filterFeedByFestival(items, null)).toHaveLength(4);
  });

  it("filters to matching festival only", () => {
    const result = filterFeedByFestival(items, "hellfest");
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.festivalId === "hellfest")).toBe(true);
  });

  it("returns empty array when no items match", () => {
    expect(filterFeedByFestival(items, "unknown-id")).toHaveLength(0);
  });
});

describe("getFollowedFestivalsFromFeed", () => {
  it("returns unique festivals sorted alphabetically by name", () => {
    const festivals = getFollowedFestivalsFromFeed(items);
    expect(festivals).toHaveLength(3);
    expect(festivals[0].name).toBe("Garorock");
    expect(festivals[1].name).toBe("Hellfest");
    expect(festivals[2].name).toBe("Solidays");
  });

  it("returns empty array for empty items", () => {
    expect(getFollowedFestivalsFromFeed([])).toHaveLength(0);
  });

  it("deduplicates festivals correctly", () => {
    const dup = [makeItem("a", "f1", "F1"), makeItem("b", "f1", "F1")];
    expect(getFollowedFestivalsFromFeed(dup)).toHaveLength(1);
  });
});
