import { describe, it, expect } from "vitest";
import {
  filterAdminArtists,
  sortAdminArtistsByName,
  sortAdminArtistsByEventCount,
  countArtistsMissingCountry,
  countArtistsMissingDisciplines,
  filterOrphanArtists,
  countOrphanArtists,
  type AdminArtistRow,
} from "@/lib/admin-artists";

function makeArtist(overrides: Partial<AdminArtistRow> = {}): AdminArtistRow {
  return {
    id: "a1",
    name: "Orelsan",
    disciplines: ["rap"],
    countryCode: "FR",
    eventCount: 3,
    instagram: "orelsan",
    siteUrl: null,
    ...overrides,
  };
}

const artists: AdminArtistRow[] = [
  makeArtist({ id: "a1", name: "Orelsan", disciplines: ["rap"], countryCode: "FR", eventCount: 5 }),
  makeArtist({ id: "a2", name: "Amelie Lens", disciplines: ["techno"], countryCode: "BE", eventCount: 2 }),
  makeArtist({ id: "a3", name: "Nina Kraviz", disciplines: ["techno", "electro"], countryCode: "RU", eventCount: 4 }),
  makeArtist({ id: "a4", name: "Unknown Artist", disciplines: [], countryCode: null, eventCount: 0 }),
];

describe("filterAdminArtists", () => {
  it("returns all artists for empty query", () => {
    expect(filterAdminArtists(artists, "")).toHaveLength(4);
  });

  it("filters by name (case-insensitive)", () => {
    const result = filterAdminArtists(artists, "orel");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a1");
  });

  it("filters by discipline", () => {
    const result = filterAdminArtists(artists, "techno");
    expect(result).toHaveLength(2);
  });

  it("filters by country code", () => {
    const result = filterAdminArtists(artists, "be");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a2");
  });

  it("returns empty for no match", () => {
    expect(filterAdminArtists(artists, "xyzabc")).toHaveLength(0);
  });

  it("returns empty for empty input", () => {
    expect(filterAdminArtists([], "orel")).toHaveLength(0);
  });
});

describe("sortAdminArtistsByName", () => {
  it("sorts alphabetically", () => {
    const result = sortAdminArtistsByName(artists);
    expect(result[0].name).toBe("Amelie Lens");
    expect(result[result.length - 1].name).toBe("Unknown Artist");
  });

  it("does not mutate original", () => {
    sortAdminArtistsByName(artists);
    expect(artists[0].name).toBe("Orelsan");
  });
});

describe("sortAdminArtistsByEventCount", () => {
  it("sorts by eventCount descending", () => {
    const result = sortAdminArtistsByEventCount(artists);
    expect(result[0].eventCount).toBeGreaterThanOrEqual(result[1].eventCount);
  });

  it("uses name as tiebreaker", () => {
    const tied = [
      makeArtist({ id: "z", name: "Zaz", eventCount: 3 }),
      makeArtist({ id: "a", name: "Aya", eventCount: 3 }),
    ];
    const result = sortAdminArtistsByEventCount(tied);
    expect(result[0].name).toBe("Aya");
  });

  it("does not mutate original", () => {
    sortAdminArtistsByEventCount(artists);
    expect(artists[0].name).toBe("Orelsan");
  });
});

describe("countArtistsMissingCountry", () => {
  it("counts artists without countryCode", () => {
    expect(countArtistsMissingCountry(artists)).toBe(1);
  });

  it("returns 0 when all have countries", () => {
    const all = artists.filter((a) => a.countryCode);
    expect(countArtistsMissingCountry(all)).toBe(0);
  });
});

describe("countArtistsMissingDisciplines", () => {
  it("counts artists with empty disciplines", () => {
    expect(countArtistsMissingDisciplines(artists)).toBe(1);
  });

  it("returns 0 when all have disciplines", () => {
    const all = artists.filter((a) => a.disciplines.length > 0);
    expect(countArtistsMissingDisciplines(all)).toBe(0);
  });
});

describe("filterOrphanArtists", () => {
  it("returns artists with eventCount === 0", () => {
    const orphans = filterOrphanArtists(artists);
    expect(orphans).toHaveLength(1);
    expect(orphans[0].id).toBe("a4");
  });

  it("returns empty array when all artists have events", () => {
    const active = artists.filter((a) => a.eventCount > 0);
    expect(filterOrphanArtists(active)).toHaveLength(0);
  });

  it("returns all when all are orphans", () => {
    const allOrphans = artists.map((a) => ({ ...a, eventCount: 0 }));
    expect(filterOrphanArtists(allOrphans)).toHaveLength(artists.length);
  });
});

describe("countOrphanArtists", () => {
  it("counts artists with eventCount === 0", () => {
    expect(countOrphanArtists(artists)).toBe(1);
  });

  it("returns 0 when all have events", () => {
    const active = artists.filter((a) => a.eventCount > 0);
    expect(countOrphanArtists(active)).toBe(0);
  });
});
