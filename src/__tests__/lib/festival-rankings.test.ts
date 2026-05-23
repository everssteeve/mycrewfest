import { describe, expect, it } from "vitest";
import {
  getRankColor,
  getRankMedal,
  type RankableFestival,
  rankByFollowers,
  rankByProgramme,
  rankByUpcoming,
} from "@/lib/festival-rankings";

const makeFestival = (
  overrides: Partial<RankableFestival> & { id: string; name: string },
): RankableFestival => ({
  slug: overrides.id,
  city: "Paris",
  country: "FR",
  festivalType: "musique",
  startDate: "2026-07-01",
  endDate: "2026-07-03",
  followerCount: 0,
  programStatus: "bientôt_disponible",
  eventCount: 0,
  ...overrides,
});

const festivals: RankableFestival[] = [
  makeFestival({ id: "f1", name: "Hellfest", followerCount: 500, eventCount: 80 }),
  makeFestival({ id: "f2", name: "Solidays", followerCount: 300, eventCount: 50 }),
  makeFestival({ id: "f3", name: "Garorock", followerCount: 100, eventCount: 30 }),
  makeFestival({ id: "f4", name: "Petit Fest", followerCount: 0, eventCount: 0 }),
];

describe("rankByFollowers", () => {
  it("sorts by follower count descending", () => {
    const ranked = rankByFollowers(festivals);
    expect(ranked[0].name).toBe("Hellfest");
    expect(ranked[1].name).toBe("Solidays");
    expect(ranked[2].name).toBe("Garorock");
  });

  it("excludes festivals with 0 followers", () => {
    const ranked = rankByFollowers(festivals);
    expect(ranked.find((f) => f.name === "Petit Fest")).toBeUndefined();
  });

  it("assigns correct rank numbers starting from 1", () => {
    const ranked = rankByFollowers(festivals);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].rank).toBe(3);
  });

  it("respects the limit", () => {
    expect(rankByFollowers(festivals, 2)).toHaveLength(2);
  });

  it("returns empty array when no festivals have followers", () => {
    const noFollowers = [makeFestival({ id: "x1", name: "None", followerCount: 0 })];
    expect(rankByFollowers(noFollowers)).toHaveLength(0);
  });

  it("does not mutate input", () => {
    const original = [...festivals];
    rankByFollowers(festivals);
    expect(festivals[0].name).toBe(original[0].name);
  });
});

describe("rankByUpcoming", () => {
  const now = new Date("2026-06-25T12:00:00.000Z");

  it("returns festivals starting within the window", () => {
    const fests = [
      makeFestival({ id: "a", name: "A", startDate: "2026-07-01" }),
      makeFestival({ id: "b", name: "B", startDate: "2026-08-15" }),
    ];
    const ranked = rankByUpcoming(fests, 30, 10, now);
    expect(ranked.map((f) => f.name)).toContain("A");
    expect(ranked.map((f) => f.name)).not.toContain("B");
  });

  it("sorts by start date ascending", () => {
    const fests = [
      makeFestival({ id: "a", name: "Late", startDate: "2026-07-20" }),
      makeFestival({ id: "b", name: "Early", startDate: "2026-07-01" }),
    ];
    const ranked = rankByUpcoming(fests, 30, 10, now);
    expect(ranked[0].name).toBe("Early");
  });

  it("excludes festivals that have already started (before today)", () => {
    const fests = [
      makeFestival({ id: "past", name: "Past", startDate: "2026-06-20" }),
      makeFestival({ id: "future", name: "Future", startDate: "2026-07-01" }),
    ];
    const ranked = rankByUpcoming(fests, 30, 10, now);
    expect(ranked.map((f) => f.name)).not.toContain("Past");
    expect(ranked.map((f) => f.name)).toContain("Future");
  });

  it("respects the limit", () => {
    const fests = Array.from({ length: 10 }, (_, i) =>
      makeFestival({ id: `f${i}`, name: `Fest ${i}`, startDate: `2026-07-0${(i % 9) + 1}` }),
    );
    expect(rankByUpcoming(fests, 30, 3, now)).toHaveLength(3);
  });
});

describe("rankByProgramme", () => {
  it("sorts by eventCount descending", () => {
    const ranked = rankByProgramme(festivals);
    expect(ranked[0].name).toBe("Hellfest");
    expect(ranked[1].name).toBe("Solidays");
  });

  it("excludes festivals with 0 events", () => {
    const ranked = rankByProgramme(festivals);
    expect(ranked.find((f) => f.name === "Petit Fest")).toBeUndefined();
  });

  it("assigns rank starting from 1", () => {
    const ranked = rankByProgramme(festivals);
    expect(ranked[0].rank).toBe(1);
  });

  it("respects the limit", () => {
    expect(rankByProgramme(festivals, 1)).toHaveLength(1);
  });
});

describe("getRankMedal", () => {
  it("returns medal emojis for top 3", () => {
    expect(getRankMedal(1)).toBe("🥇");
    expect(getRankMedal(2)).toBe("🥈");
    expect(getRankMedal(3)).toBe("🥉");
  });

  it("returns empty string for rank > 3", () => {
    expect(getRankMedal(4)).toBe("");
    expect(getRankMedal(10)).toBe("");
  });
});

describe("getRankColor", () => {
  it("returns a color string for each rank", () => {
    expect(getRankColor(1)).toContain("var(");
    expect(getRankColor(2)).toContain("var(");
    expect(getRankColor(10)).toContain("var(");
  });
});
