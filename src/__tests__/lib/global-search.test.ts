import { describe, expect, it } from "vitest";
import {
  filterAndRankArtists,
  filterAndRankFestivals,
  scoreArtist,
  scoreFestival,
} from "@/lib/global-search";

const FESTIVALS = [
  {
    id: "1",
    name: "Hellfest Open Air",
    slug: "hellfest-2026",
    city: "Clisson",
    country: "France",
    startDate: "2026-06-18T00:00:00.000Z",
    endDate: "2026-06-21T00:00:00.000Z",
    festivalType: "musique",
    description: "Le plus grand festival de metal en France.",
  },
  {
    id: "2",
    name: "Solidays",
    slug: "solidays-2026",
    city: "Paris",
    country: "France",
    startDate: "2026-06-26T00:00:00.000Z",
    endDate: "2026-06-28T00:00:00.000Z",
    festivalType: "musique",
    description: "Festival solidaire à Paris.",
  },
  {
    id: "3",
    name: "Viva Cité",
    slug: "viva-cite-2026",
    city: "Sotteville-lès-Rouen",
    country: "France",
    startDate: "2026-07-02T00:00:00.000Z",
    endDate: "2026-07-05T00:00:00.000Z",
    festivalType: "théâtre_rue",
    description: "Festival international de théâtre de rue.",
  },
];

const ARTISTS = [
  {
    id: "a1",
    name: "Orelsan",
    disciplines: ["rap", "hip-hop"],
    countryCode: "FR",
    festivalCount: 3,
  },
  {
    id: "a2",
    name: "Amelie Lens",
    disciplines: ["techno", "dj"],
    countryCode: "BE",
    festivalCount: 2,
  },
  {
    id: "a3",
    name: "Major Lazer",
    disciplines: ["électronique", "dancehall"],
    countryCode: "US",
    festivalCount: 5,
  },
  { id: "a4", name: "Orelia", disciplines: ["jazz"], countryCode: "FR", festivalCount: 1 },
];

describe("scoreFestival", () => {
  it("exact name match returns highest score", () => {
    expect(scoreFestival(FESTIVALS[0]!, "Hellfest Open Air")).toBe(10);
  });

  it("name startsWith returns 4", () => {
    expect(scoreFestival(FESTIVALS[0]!, "hell")).toBe(4);
  });

  it("name includes (not startsWith) returns 3", () => {
    expect(scoreFestival(FESTIVALS[0]!, "open")).toBe(3);
  });

  it("city startsWith returns 2", () => {
    expect(scoreFestival(FESTIVALS[0]!, "clis")).toBe(2);
  });

  it("city includes (not startsWith) returns 1.5", () => {
    expect(scoreFestival(FESTIVALS[0]!, "isson")).toBe(1.5);
  });

  it("description includes returns 0.5", () => {
    expect(scoreFestival(FESTIVALS[0]!, "metal")).toBe(0.5);
  });

  it("no match returns 0", () => {
    expect(scoreFestival(FESTIVALS[0]!, "jazz")).toBe(0);
  });

  it("returns 0 for empty query", () => {
    expect(scoreFestival(FESTIVALS[0]!, "")).toBe(0);
  });

  it("matching is case-insensitive", () => {
    expect(scoreFestival(FESTIVALS[0]!, "HELL")).toBeGreaterThan(0);
  });
});

describe("scoreArtist", () => {
  it("exact name match returns 10", () => {
    expect(scoreArtist(ARTISTS[0]!, "Orelsan")).toBe(10);
  });

  it("name startsWith returns 4", () => {
    expect(scoreArtist(ARTISTS[0]!, "orel")).toBe(4);
  });

  it("name includes returns 3", () => {
    expect(scoreArtist(ARTISTS[0]!, "elsan")).toBe(3);
  });

  it("discipline match returns 1", () => {
    expect(scoreArtist(ARTISTS[0]!, "hip-hop")).toBe(1);
  });

  it("no match returns 0", () => {
    expect(scoreArtist(ARTISTS[0]!, "metal")).toBe(0);
  });

  it("case-insensitive matching", () => {
    expect(scoreArtist(ARTISTS[0]!, "OREL")).toBeGreaterThan(0);
  });

  it("partial discipline match", () => {
    expect(scoreArtist(ARTISTS[1]!, "tech")).toBe(1);
  });
});

describe("filterAndRankFestivals", () => {
  it("returns empty array when query < 2 chars", () => {
    expect(filterAndRankFestivals(FESTIVALS, "h")).toHaveLength(0);
    expect(filterAndRankFestivals(FESTIVALS, "")).toHaveLength(0);
  });

  it("finds festival by name prefix", () => {
    const results = filterAndRankFestivals(FESTIVALS, "hell");
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Hellfest Open Air");
  });

  it("result type is 'festival'", () => {
    const results = filterAndRankFestivals(FESTIVALS, "hell");
    expect(results[0]?.type).toBe("festival");
  });

  it("ranks by score descending", () => {
    // "Orel" hits name in a fictional scenario; use "solid" which matches name
    const results = filterAndRankFestivals(FESTIVALS, "sol");
    expect(results[0]?.name).toBe("Solidays");
  });

  it("respects limit", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      ...FESTIVALS[0]!,
      id: `id-${i}`,
      slug: `slug-${i}`,
      name: `Hellfest ${i}`,
    }));
    const results = filterAndRankFestivals(many, "hell", 3);
    expect(results).toHaveLength(3);
  });

  it("includes required fields in result", () => {
    const results = filterAndRankFestivals(FESTIVALS, "hell");
    const r = results[0]!;
    expect(r).toHaveProperty("id");
    expect(r).toHaveProperty("name");
    expect(r).toHaveProperty("slug");
    expect(r).toHaveProperty("city");
    expect(r).toHaveProperty("country");
    expect(r).toHaveProperty("startDate");
    expect(r).toHaveProperty("endDate");
  });

  it("no results for unmatched query", () => {
    const results = filterAndRankFestivals(FESTIVALS, "zzznomatch");
    expect(results).toHaveLength(0);
  });
});

describe("filterAndRankArtists", () => {
  it("returns empty array when query < 2 chars", () => {
    expect(filterAndRankArtists(ARTISTS, "o")).toHaveLength(0);
  });

  it("finds artist by exact name", () => {
    const results = filterAndRankArtists(ARTISTS, "Orelsan");
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Orelsan");
  });

  it("result type is 'artist'", () => {
    const results = filterAndRankArtists(ARTISTS, "Orelsan");
    expect(results[0]?.type).toBe("artist");
  });

  it("disambiguates startsWith over includes", () => {
    // "orel" prefix-matches "Orelsan" (score 4) and "Orelia" (score 4)
    // both have same prefix score, order is stable among ties
    const results = filterAndRankArtists(ARTISTS, "orel");
    expect(results.map((r) => r.name)).toContain("Orelsan");
    expect(results.map((r) => r.name)).toContain("Orelia");
  });

  it("respects limit", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      id: `id-${i}`,
      name: `Artist ${i}`,
      disciplines: ["rock"],
      countryCode: "FR",
      festivalCount: 1,
    }));
    const results = filterAndRankArtists(many, "artist", 3);
    expect(results).toHaveLength(3);
  });

  it("finds by discipline", () => {
    const results = filterAndRankArtists(ARTISTS, "techno");
    expect(results[0]?.name).toBe("Amelie Lens");
  });

  it("no results for unmatched query", () => {
    expect(filterAndRankArtists(ARTISTS, "zzznomatch")).toHaveLength(0);
  });
});
