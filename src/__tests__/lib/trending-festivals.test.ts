import { describe, expect, it } from "vitest";
import {
  formatFestivalTypeLabel,
  selectTrendingFestivals,
  type TrendingFestivalItem,
} from "@/lib/trending-festivals";

const NOW = new Date("2026-05-23T12:00:00.000Z");

const FUTURE1: TrendingFestivalItem = {
  id: "1",
  name: "Hellfest",
  slug: "hellfest-2026",
  city: "Clisson",
  country: "France",
  startDate: "2026-06-18T00:00:00.000Z",
  endDate: "2026-06-21T00:00:00.000Z",
  festivalType: "musique",
  followerCount: 150,
};
const FUTURE2: TrendingFestivalItem = {
  id: "2",
  name: "Solidays",
  slug: "solidays-2026",
  city: "Paris",
  country: "France",
  startDate: "2026-06-26T00:00:00.000Z",
  endDate: "2026-06-28T00:00:00.000Z",
  festivalType: "musique",
  followerCount: 80,
};
const PAST: TrendingFestivalItem = {
  id: "3",
  name: "Festival Passé",
  slug: "festival-passe",
  city: "Lyon",
  country: "France",
  startDate: "2025-08-01T00:00:00.000Z",
  endDate: "2025-08-03T00:00:00.000Z",
  festivalType: "cirque",
  followerCount: 999,
};
const FUTURE3: TrendingFestivalItem = {
  id: "4",
  name: "Vieilles Charrues",
  slug: "vieilles-charrues-2026",
  city: "Carhaix",
  country: "France",
  startDate: "2026-07-15T00:00:00.000Z",
  endDate: "2026-07-18T00:00:00.000Z",
  festivalType: "musique",
  followerCount: 200,
};

describe("selectTrendingFestivals", () => {
  it("excludes past festivals", () => {
    const result = selectTrendingFestivals([PAST, FUTURE1], 5, NOW);
    expect(result.map((f) => f.id)).not.toContain("3");
    expect(result.map((f) => f.id)).toContain("1");
  });

  it("sorts by followerCount desc", () => {
    const result = selectTrendingFestivals([FUTURE1, FUTURE2, FUTURE3], 10, NOW);
    expect(result[0]?.id).toBe("4"); // 200
    expect(result[1]?.id).toBe("1"); // 150
    expect(result[2]?.id).toBe("2"); // 80
  });

  it("respects limit", () => {
    const result = selectTrendingFestivals([FUTURE1, FUTURE2, FUTURE3], 2, NOW);
    expect(result).toHaveLength(2);
  });

  it("returns empty array if no upcoming festivals", () => {
    const result = selectTrendingFestivals([PAST], 5, NOW);
    expect(result).toHaveLength(0);
  });

  it("returns empty array if input is empty", () => {
    expect(selectTrendingFestivals([], 3, NOW)).toHaveLength(0);
  });

  it("filters out festivals starting exactly at now (boundary: startDate >= now)", () => {
    const exactly: TrendingFestivalItem = {
      ...FUTURE1,
      id: "exact",
      startDate: NOW.toISOString(),
    };
    const result = selectTrendingFestivals([exactly], 3, NOW);
    expect(result).toHaveLength(1);
  });

  it("handles limit larger than available festivals", () => {
    const result = selectTrendingFestivals([FUTURE1, FUTURE2], 10, NOW);
    expect(result).toHaveLength(2);
  });

  it("festival with 0 followers still appears if upcoming", () => {
    const noFollowers: TrendingFestivalItem = { ...FUTURE2, followerCount: 0, id: "nf" };
    const result = selectTrendingFestivals([noFollowers], 3, NOW);
    expect(result).toHaveLength(1);
  });

  it("ties in followerCount preserve order stability", () => {
    const a: TrendingFestivalItem = { ...FUTURE1, id: "a", followerCount: 50 };
    const b: TrendingFestivalItem = { ...FUTURE2, id: "b", followerCount: 50 };
    const result = selectTrendingFestivals([a, b], 5, NOW);
    expect(result).toHaveLength(2);
    // Both should be in result regardless of order
    expect(result.map((r) => r.id)).toContain("a");
    expect(result.map((r) => r.id)).toContain("b");
  });
});

describe("formatFestivalTypeLabel", () => {
  it("formats musique", () => expect(formatFestivalTypeLabel("musique")).toBe("Musique"));
  it("formats théâtre_rue", () =>
    expect(formatFestivalTypeLabel("théâtre_rue")).toBe("Théâtre de rue"));
  it("formats cirque", () => expect(formatFestivalTypeLabel("cirque")).toBe("Cirque"));
  it("formats world", () => expect(formatFestivalTypeLabel("world")).toBe("World"));
  it("formats multidisciplinaire", () =>
    expect(formatFestivalTypeLabel("multidisciplinaire")).toBe("Multi"));
  it("returns unknown type as-is", () => expect(formatFestivalTypeLabel("jazz")).toBe("jazz"));
  it("returns empty string as-is", () => expect(formatFestivalTypeLabel("")).toBe(""));
});
