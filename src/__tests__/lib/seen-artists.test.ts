import { describe, expect, it } from "vitest";
import { extractSeenArtists, topSeenArtists } from "@/lib/seen-artists";

function makeRef(id: string, name: string, disciplines = "[]", countryCode: string | null = null) {
  return { id, name, disciplines, countryCode };
}

describe("extractSeenArtists", () => {
  it("returns empty array for empty input", () => {
    expect(extractSeenArtists([])).toEqual([]);
  });

  it("filters out null and undefined refs", () => {
    const result = extractSeenArtists([null, undefined, null]);
    expect(result).toHaveLength(0);
  });

  it("deduplicates artists and counts timesVu", () => {
    const maiden = makeRef("a1", "Iron Maiden");
    const result = extractSeenArtists([maiden, maiden, maiden]);
    expect(result).toHaveLength(1);
    expect(result[0].timesVu).toBe(3);
  });

  it("parses disciplines JSON array", () => {
    const ref = makeRef("a1", "Iron Maiden", '["Heavy Metal","Live"]');
    const result = extractSeenArtists([ref]);
    expect(result[0].disciplines).toEqual(["Heavy Metal", "Live"]);
  });

  it("handles null disciplines gracefully", () => {
    const ref = makeRef("a1", "Iron Maiden", null as unknown as string);
    const result = extractSeenArtists([ref]);
    expect(result[0].disciplines).toEqual([]);
  });

  it("sorts by timesVu descending, then name alphabetically", () => {
    const refs = [
      makeRef("a1", "Zaz"),
      makeRef("a2", "Alice Cooper"),
      makeRef("a2", "Alice Cooper"),
    ];
    const result = extractSeenArtists(refs);
    expect(result[0].id).toBe("a2");
    expect(result[1].id).toBe("a1");
  });

  it("includes artist with countryCode", () => {
    const ref = makeRef("a1", "Iron Maiden", "[]", "GB");
    const result = extractSeenArtists([ref]);
    expect(result[0].countryCode).toBe("GB");
  });

  it("handles mix of null and valid refs", () => {
    const refs = [null, makeRef("a1", "Iron Maiden"), null, makeRef("a2", "Deep Purple")];
    const result = extractSeenArtists(refs);
    expect(result).toHaveLength(2);
  });
});

describe("topSeenArtists", () => {
  const artists = Array.from({ length: 15 }, (_, i) => ({
    id: `a${i}`,
    name: `Artist ${i}`,
    disciplines: [] as string[],
    countryCode: null,
    timesVu: 1,
  }));

  it("returns top N artists", () => {
    expect(topSeenArtists(artists, 5)).toHaveLength(5);
  });

  it("defaults to 10", () => {
    expect(topSeenArtists(artists)).toHaveLength(10);
  });

  it("returns all when fewer than limit", () => {
    const few = artists.slice(0, 3);
    expect(topSeenArtists(few, 10)).toHaveLength(3);
  });

  it("returns empty for empty input", () => {
    expect(topSeenArtists([])).toHaveLength(0);
  });
});
