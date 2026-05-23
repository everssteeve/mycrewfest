import { describe, expect, it } from "vitest";
import type { GlobalSearchResponse } from "@/lib/global-search";
import {
  applySearchTypeFilter,
  buildTabLabel,
  countSearchResults,
  isTabDisabled,
} from "@/lib/search-filter";

const mockFestival = {
  type: "festival" as const,
  id: "f1",
  name: "Hellfest",
  slug: "hellfest",
  city: "Clisson",
  country: "FR",
  startDate: "2026-06-20",
  endDate: "2026-06-23",
  festivalType: "musique",
  score: 10,
};

const mockArtist = {
  type: "artist" as const,
  id: "a1",
  name: "Metallica",
  disciplines: ["metal"],
  countryCode: "US",
  festivalCount: 3,
  score: 8,
};

const mockResponse: GlobalSearchResponse = {
  festivals: [mockFestival],
  artists: [mockArtist],
  total: 2,
};

describe("countSearchResults", () => {
  it("returns correct counts", () => {
    const counts = countSearchResults(mockResponse);
    expect(counts.festivals).toBe(1);
    expect(counts.artists).toBe(1);
    expect(counts.total).toBe(2);
  });

  it("handles empty response", () => {
    const empty: GlobalSearchResponse = { festivals: [], artists: [], total: 0 };
    const counts = countSearchResults(empty);
    expect(counts.festivals).toBe(0);
    expect(counts.artists).toBe(0);
    expect(counts.total).toBe(0);
  });
});

describe("applySearchTypeFilter", () => {
  it("returns full response for 'all'", () => {
    const result = applySearchTypeFilter(mockResponse, "all");
    expect(result.festivals).toHaveLength(1);
    expect(result.artists).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it("returns only festivals for 'festivals' filter", () => {
    const result = applySearchTypeFilter(mockResponse, "festivals");
    expect(result.festivals).toHaveLength(1);
    expect(result.artists).toHaveLength(0);
    expect(result.total).toBe(1);
  });

  it("returns only artists for 'artists' filter", () => {
    const result = applySearchTypeFilter(mockResponse, "artists");
    expect(result.festivals).toHaveLength(0);
    expect(result.artists).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("does not mutate the original response", () => {
    applySearchTypeFilter(mockResponse, "festivals");
    expect(mockResponse.artists).toHaveLength(1);
    expect(mockResponse.total).toBe(2);
  });

  it("handles multiple festivals with filter", () => {
    const multiResponse: GlobalSearchResponse = {
      festivals: [mockFestival, { ...mockFestival, id: "f2", name: "Solidays" }],
      artists: [mockArtist],
      total: 3,
    };
    const result = applySearchTypeFilter(multiResponse, "festivals");
    expect(result.festivals).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});

describe("buildTabLabel", () => {
  const counts = { festivals: 3, artists: 5, total: 8 };

  it("returns correct label for 'all'", () => {
    expect(buildTabLabel("all", counts)).toBe("Tout (8)");
  });

  it("returns correct label for 'festivals'", () => {
    expect(buildTabLabel("festivals", counts)).toBe("Festivals (3)");
  });

  it("returns correct label for 'artists'", () => {
    expect(buildTabLabel("artists", counts)).toBe("Artistes (5)");
  });
});

describe("isTabDisabled", () => {
  it("disables festivals tab when no festivals", () => {
    const counts = { festivals: 0, artists: 2, total: 2 };
    expect(isTabDisabled("festivals", counts)).toBe(true);
    expect(isTabDisabled("artists", counts)).toBe(false);
  });

  it("disables artists tab when no artists", () => {
    const counts = { festivals: 3, artists: 0, total: 3 };
    expect(isTabDisabled("artists", counts)).toBe(true);
    expect(isTabDisabled("festivals", counts)).toBe(false);
  });

  it("disables all tab when total is 0", () => {
    const counts = { festivals: 0, artists: 0, total: 0 };
    expect(isTabDisabled("all", counts)).toBe(true);
  });

  it("does not disable all tab when results exist", () => {
    const counts = { festivals: 1, artists: 1, total: 2 };
    expect(isTabDisabled("all", counts)).toBe(false);
  });
});
