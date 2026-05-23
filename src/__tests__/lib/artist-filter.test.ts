import { describe, it, expect } from "vitest";
import {
  filterArtists,
  getAvailableDisciplines,
  sortArtistsByName,
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
