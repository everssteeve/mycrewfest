import { describe, expect, it } from "vitest";
import {
  deduplicateArtistsByFestival,
  filterPast,
  filterUpcoming,
  groupByFestival,
  type MesArtistesItem,
  sortByFestivalDate,
} from "@/lib/mes-artistes";

const NOW = new Date("2026-06-10T12:00:00.000Z");

function makeItem(overrides: Partial<MesArtistesItem> = {}): MesArtistesItem {
  return {
    artistId: "a1",
    artistName: "Orelsan",
    disciplines: ["rap"],
    festivalId: "f1",
    festivalName: "Hellfest",
    festivalSlug: "hellfest-2026",
    festivalStartDate: "2026-06-18T00:00:00.000Z",
    festivalEndDate: "2026-06-21T00:00:00.000Z",
    city: "Clisson",
    eventTitle: "Concert Orelsan",
    startTime: "2026-06-19T20:00:00.000Z",
    ...overrides,
  };
}

const ITEM_FUTURE1 = makeItem({
  artistId: "a1",
  festivalId: "f1",
  festivalStartDate: "2026-06-18T00:00:00.000Z",
  festivalEndDate: "2026-06-21T00:00:00.000Z",
});
const ITEM_FUTURE2 = makeItem({
  artistId: "a2",
  artistName: "Amelie Lens",
  disciplines: ["techno"],
  festivalId: "f2",
  festivalName: "Solidays",
  festivalSlug: "solidays-2026",
  festivalStartDate: "2026-06-26T00:00:00.000Z",
  festivalEndDate: "2026-06-28T00:00:00.000Z",
  city: "Paris",
});
const ITEM_PAST = makeItem({
  artistId: "a3",
  artistName: "Past Artist",
  festivalId: "f3",
  festivalName: "Ancien Festival",
  festivalSlug: "ancien-2025",
  festivalStartDate: "2025-08-01T00:00:00.000Z",
  festivalEndDate: "2025-08-03T00:00:00.000Z",
});

describe("deduplicateArtistsByFestival", () => {
  it("keeps unique artist+festival combos", () => {
    const items = [ITEM_FUTURE1, ITEM_FUTURE2];
    expect(deduplicateArtistsByFestival(items)).toHaveLength(2);
  });

  it("removes duplicate artist+festival pair", () => {
    const dup = makeItem({ artistId: "a1", festivalId: "f1" });
    const items = [ITEM_FUTURE1, dup];
    const result = deduplicateArtistsByFestival(items);
    expect(result).toHaveLength(1);
  });

  it("same artist at different festivals is not a duplicate", () => {
    const other = makeItem({ artistId: "a1", festivalId: "f2" });
    const items = [ITEM_FUTURE1, other];
    expect(deduplicateArtistsByFestival(items)).toHaveLength(2);
  });

  it("different artists at same festival is not a duplicate", () => {
    const other = makeItem({ artistId: "a2", festivalId: "f1" });
    const items = [ITEM_FUTURE1, other];
    expect(deduplicateArtistsByFestival(items)).toHaveLength(2);
  });

  it("does not mutate input", () => {
    const items = [ITEM_FUTURE1, makeItem()];
    const original = items.length;
    deduplicateArtistsByFestival(items);
    expect(items).toHaveLength(original);
  });

  it("handles empty array", () => {
    expect(deduplicateArtistsByFestival([])).toHaveLength(0);
  });
});

describe("sortByFestivalDate", () => {
  it("sorts by festivalStartDate ascending", () => {
    const items = [ITEM_FUTURE2, ITEM_FUTURE1];
    const sorted = sortByFestivalDate(items);
    expect(sorted[0]?.festivalId).toBe("f1"); // June 18 before June 26
    expect(sorted[1]?.festivalId).toBe("f2");
  });

  it("secondary sort by artistName for same festival date", () => {
    const a = makeItem({ artistId: "a2", artistName: "Zak", festivalId: "f1" });
    const b = makeItem({ artistId: "a3", artistName: "Alice", festivalId: "f1" });
    const sorted = sortByFestivalDate([a, b]);
    expect(sorted[0]?.artistName).toBe("Alice");
  });

  it("does not mutate input", () => {
    const items = [ITEM_FUTURE2, ITEM_FUTURE1];
    sortByFestivalDate(items);
    expect(items[0]?.festivalId).toBe("f2");
  });

  it("handles empty array", () => {
    expect(sortByFestivalDate([])).toHaveLength(0);
  });
});

describe("filterUpcoming", () => {
  it("includes festivals ending after now", () => {
    const result = filterUpcoming([ITEM_FUTURE1, ITEM_PAST], NOW);
    expect(result.map((i) => i.festivalId)).toContain("f1");
    expect(result.map((i) => i.festivalId)).not.toContain("f3");
  });

  it("includes ongoing festivals (endDate >= now)", () => {
    const ongoing = makeItem({ festivalEndDate: NOW.toISOString() });
    const result = filterUpcoming([ongoing], NOW);
    expect(result).toHaveLength(1);
  });

  it("excludes festivals that ended before now", () => {
    expect(filterUpcoming([ITEM_PAST], NOW)).toHaveLength(0);
  });
});

describe("filterPast", () => {
  it("returns only past festivals", () => {
    const result = filterPast([ITEM_FUTURE1, ITEM_PAST], NOW);
    expect(result).toHaveLength(1);
    expect(result[0]?.festivalId).toBe("f3");
  });

  it("excludes ongoing festivals", () => {
    const ongoing = makeItem({ festivalEndDate: NOW.toISOString() });
    expect(filterPast([ongoing], NOW)).toHaveLength(0);
  });

  it("handles empty array", () => {
    expect(filterPast([], NOW)).toHaveLength(0);
  });
});

describe("groupByFestival", () => {
  it("groups items by festivalId", () => {
    const a2 = makeItem({ artistId: "a2", artistName: "Amelie", festivalId: "f1" });
    const map = groupByFestival([ITEM_FUTURE1, a2]);
    expect(map.size).toBe(1);
    expect(map.get("f1")?.artists).toHaveLength(2);
  });

  it("separate festivals create separate groups", () => {
    const map = groupByFestival([ITEM_FUTURE1, ITEM_FUTURE2]);
    expect(map.size).toBe(2);
  });

  it("group contains festivalName and festivalSlug", () => {
    const map = groupByFestival([ITEM_FUTURE1]);
    const group = map.get("f1")!;
    expect(group.festivalName).toBe("Hellfest");
    expect(group.festivalSlug).toBe("hellfest-2026");
  });

  it("handles empty array", () => {
    expect(groupByFestival([])).toBeInstanceOf(Map);
    expect(groupByFestival([]).size).toBe(0);
  });
});
