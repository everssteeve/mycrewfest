import { describe, expect, it } from "vitest";
import {
  type FeedItem,
  filterFeedByCategory,
  filterFeedByFestival,
  getAvailableCategoriesFromFeed,
  getFollowedFestivalsFromFeed,
} from "@/lib/news-feed";

const makeItem = (
  id: string,
  festivalId: string,
  festivalName: string,
  category = "autre",
): FeedItem => ({
  id,
  festivalId,
  festivalName,
  festivalSlug: festivalId,
  summary: "test",
  category,
  urgencyLevel: "normal",
  isPinned: false,
  publishedAt: "2026-05-20T10:00:00Z",
  sourceUrl: null,
});

const items: FeedItem[] = [
  makeItem("1", "hellfest", "Hellfest", "line-up"),
  makeItem("2", "hellfest", "Hellfest", "urgence"),
  makeItem("3", "solidays", "Solidays", "logistique"),
  makeItem("4", "garorock", "Garorock", "line-up"),
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

describe("filterFeedByCategory", () => {
  it("returns all items when category is null", () => {
    expect(filterFeedByCategory(items, null)).toHaveLength(4);
  });

  it("filters to matching category", () => {
    const result = filterFeedByCategory(items, "line-up");
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.category === "line-up")).toBe(true);
  });

  it("returns empty array when no items match", () => {
    expect(filterFeedByCategory(items, "annulation")).toHaveLength(0);
  });
});

describe("getAvailableCategoriesFromFeed", () => {
  it("returns unique categories sorted by label", () => {
    const cats = getAvailableCategoriesFromFeed(items);
    expect(cats).toContain("line-up");
    expect(cats).toContain("urgence");
    expect(cats).toContain("logistique");
    expect(cats.length).toBe(3);
  });

  it("returns empty array for empty items", () => {
    expect(getAvailableCategoriesFromFeed([])).toHaveLength(0);
  });

  it("deduplicates categories", () => {
    const dup = [makeItem("a", "f1", "F1", "line-up"), makeItem("b", "f2", "F2", "line-up")];
    expect(getAvailableCategoriesFromFeed(dup)).toHaveLength(1);
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
    const dup = [makeItem("a", "f1", "F1", "autre"), makeItem("b", "f1", "F1", "autre")];
    expect(getFollowedFestivalsFromFeed(dup)).toHaveLength(1);
  });
});
