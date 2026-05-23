import { describe, expect, it } from "vitest";
import {
  type CoAfficheArtist,
  deduplicateByFestivalCount,
  rankCoAfficheArtists,
} from "@/lib/artist-coaffiche";

const base: CoAfficheArtist[] = [
  { id: "a", name: "Gojira", disciplines: ["Metal"], countryCode: "FR", sharedFestivalCount: 3 },
  {
    id: "b",
    name: "Rammstein",
    disciplines: ["Industrial Metal"],
    countryCode: "DE",
    sharedFestivalCount: 5,
  },
  {
    id: "c",
    name: "Amon Amarth",
    disciplines: ["Viking Metal"],
    countryCode: "SE",
    sharedFestivalCount: 2,
  },
  { id: "d", name: "Tool", disciplines: ["Metal"], countryCode: "US", sharedFestivalCount: 5 },
  {
    id: "e",
    name: "Slipknot",
    disciplines: ["Nu Metal"],
    countryCode: "US",
    sharedFestivalCount: 1,
  },
];

describe("rankCoAfficheArtists", () => {
  it("sorts by sharedFestivalCount descending", () => {
    const result = rankCoAfficheArtists(base, 5);
    expect(result[0].sharedFestivalCount).toBeGreaterThanOrEqual(result[1].sharedFestivalCount);
  });

  it("limits to N artists", () => {
    expect(rankCoAfficheArtists(base, 3)).toHaveLength(3);
    expect(rankCoAfficheArtists(base, 1)).toHaveLength(1);
  });

  it("uses name as tiebreaker for equal festival count", () => {
    const result = rankCoAfficheArtists(base, 5);
    // Rammstein and Tool both have count 5 — sorted alphabetically: Rammstein < Tool
    const idx = (id: string) => result.findIndex((a) => a.id === id);
    expect(idx("b")).toBeLessThan(idx("d"));
  });

  it("returns all artists if limit exceeds length", () => {
    expect(rankCoAfficheArtists(base, 100)).toHaveLength(base.length);
  });

  it("returns empty array for empty input", () => {
    expect(rankCoAfficheArtists([], 4)).toHaveLength(0);
  });
});

describe("deduplicateByFestivalCount", () => {
  it("removes duplicate artist IDs, keeping first occurrence", () => {
    const dup: CoAfficheArtist[] = [
      { id: "a", name: "A", disciplines: [], countryCode: null, sharedFestivalCount: 2 },
      { id: "a", name: "A", disciplines: [], countryCode: null, sharedFestivalCount: 2 },
      { id: "b", name: "B", disciplines: [], countryCode: null, sharedFestivalCount: 1 },
    ];
    const result = deduplicateByFestivalCount(dup);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("returns the same list when no duplicates", () => {
    const result = deduplicateByFestivalCount(base);
    expect(result).toHaveLength(base.length);
  });
});
