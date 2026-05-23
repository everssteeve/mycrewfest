import { describe, it, expect } from "vitest";
import {
  filterArtists,
  getAvailableDisciplines,
  sortArtistsByName,
  sortArtistsByFestivalCount,
  sortArtists,
  type ArtistListItem,
} from "@/lib/artist-filter";

function makeArtist(overrides: Partial<ArtistListItem> = {}): ArtistListItem {
  return {
    id: "a1",
    name: "Iron Maiden",
    disciplines: ["Heavy Metal", "Live"],
    countryCode: "GB",
    festivalCount: 2,
    ...overrides,
  };
}

describe("filterArtists", () => {
  const artists = [
    makeArtist({ id: "a1", name: "Iron Maiden", disciplines: ["Heavy Metal"] }),
    makeArtist({ id: "a2", name: "Deep Purple", disciplines: ["Hard Rock"] }),
    makeArtist({ id: "a3", name: "Alice Cooper", disciplines: ["Heavy Metal", "Rock"] }),
  ];

  it("returns all artists when query and discipline are empty", () => {
    expect(filterArtists(artists, "", "")).toHaveLength(3);
  });

  it("filters by artist name (case-insensitive)", () => {
    const result = filterArtists(artists, "iron", "");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a1");
  });

  it("filters by discipline in query", () => {
    const result = filterArtists(artists, "hard rock", "");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a2");
  });

  it("filters by discipline chip (exact match)", () => {
    const result = filterArtists(artists, "", "Heavy Metal");
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id)).toContain("a1");
    expect(result.map((a) => a.id)).toContain("a3");
  });

  it("combines query and discipline filters with AND logic", () => {
    const result = filterArtists(artists, "alice", "Heavy Metal");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a3");
  });

  it("returns empty when no match", () => {
    expect(filterArtists(artists, "Beatles", "")).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    expect(filterArtists([], "iron", "")).toHaveLength(0);
  });
});

describe("getAvailableDisciplines", () => {
  it("returns unique disciplines sorted alphabetically", () => {
    const artists = [
      makeArtist({ disciplines: ["Rock", "DJ"] }),
      makeArtist({ disciplines: ["DJ", "Live"] }),
    ];
    const result = getAvailableDisciplines(artists);
    expect(result).toEqual(["DJ", "Live", "Rock"]);
  });

  it("returns empty array when artists have no disciplines", () => {
    const artists = [makeArtist({ disciplines: [] })];
    expect(getAvailableDisciplines(artists)).toEqual([]);
  });

  it("returns empty array for no artists", () => {
    expect(getAvailableDisciplines([])).toEqual([]);
  });
});

describe("sortArtistsByName", () => {
  it("sorts artists alphabetically", () => {
    const artists = [
      makeArtist({ id: "c", name: "Zaz" }),
      makeArtist({ id: "a", name: "Aya Nakamura" }),
      makeArtist({ id: "b", name: "Daft Punk" }),
    ];
    const result = sortArtistsByName(artists);
    expect(result[0].name).toBe("Aya Nakamura");
    expect(result[1].name).toBe("Daft Punk");
    expect(result[2].name).toBe("Zaz");
  });

  it("does not mutate the original array", () => {
    const artists = [
      makeArtist({ id: "z", name: "Zaz" }),
      makeArtist({ id: "a", name: "Aya Nakamura" }),
    ];
    sortArtistsByName(artists);
    expect(artists[0].name).toBe("Zaz");
  });

  it("handles empty array", () => {
    expect(sortArtistsByName([])).toEqual([]);
  });
});

describe("sortArtistsByFestivalCount", () => {
  const artists: ArtistListItem[] = [
    { id: "a", name: "B-artist", disciplines: [], countryCode: null, festivalCount: 1 },
    { id: "b", name: "A-artist", disciplines: [], countryCode: null, festivalCount: 5 },
    { id: "c", name: "C-artist", disciplines: [], countryCode: null, festivalCount: 5 },
    { id: "d", name: "D-artist", disciplines: [], countryCode: null, festivalCount: 2 },
  ];

  it("sorts by festivalCount descending", () => {
    const result = sortArtistsByFestivalCount(artists);
    expect(result[0].festivalCount).toBeGreaterThanOrEqual(result[1].festivalCount);
    expect(result[1].festivalCount).toBeGreaterThanOrEqual(result[2].festivalCount);
  });

  it("uses name as tiebreaker for equal festival count", () => {
    const result = sortArtistsByFestivalCount(artists);
    const aIdx = result.findIndex((a) => a.id === "b"); // A-artist, count 5
    const cIdx = result.findIndex((a) => a.id === "c"); // C-artist, count 5
    expect(aIdx).toBeLessThan(cIdx);
  });

  it("does not mutate original array", () => {
    const original = [...artists];
    sortArtistsByFestivalCount(artists);
    expect(artists).toEqual(original);
  });
});

describe("sortArtists", () => {
  const artists: ArtistListItem[] = [
    { id: "1", name: "Zaz", disciplines: [], countryCode: null, festivalCount: 1 },
    { id: "2", name: "Aya", disciplines: [], countryCode: null, festivalCount: 5 },
  ];

  it("delegates to sortArtistsByName for 'name' mode", () => {
    const result = sortArtists(artists, "name");
    expect(result[0].name).toBe("Aya");
  });

  it("delegates to sortArtistsByFestivalCount for 'festivals' mode", () => {
    const result = sortArtists(artists, "festivals");
    expect(result[0].festivalCount).toBeGreaterThanOrEqual(result[1].festivalCount);
  });
});
