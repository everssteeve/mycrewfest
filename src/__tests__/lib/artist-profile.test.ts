import { describe, it, expect } from "vitest";
import {
  sortAppearancesByDate,
  splitByTemporality,
  formatDisciplines,
  buildInstagramUrl,
  buildSpotifyUrl,
  type ArtistFestivalAppearance,
} from "@/lib/artist-profile";

function makeAppearance(overrides: Partial<ArtistFestivalAppearance> = {}): ArtistFestivalAppearance {
  return {
    festivalId: "fest-1",
    festivalName: "Rock en Seine",
    festivalSlug: "rock-en-seine-2026",
    startDate: "2026-08-27T00:00:00.000Z",
    endDate: "2026-08-30T00:00:00.000Z",
    city: "Paris",
    country: "FR",
    eventTitle: "Set principal",
    startTime: null,
    ...overrides,
  };
}

describe("sortAppearancesByDate", () => {
  it("sorts by startDate ascending", () => {
    const items = [
      makeAppearance({ festivalId: "b", startDate: "2026-09-01T00:00:00.000Z" }),
      makeAppearance({ festivalId: "a", startDate: "2026-08-01T00:00:00.000Z" }),
    ];
    const result = sortAppearancesByDate(items);
    expect(result[0].festivalId).toBe("a");
  });

  it("breaks ties by startTime", () => {
    const items = [
      makeAppearance({ festivalId: "b", startTime: "2026-08-01T22:00:00.000Z" }),
      makeAppearance({ festivalId: "a", startTime: "2026-08-01T18:00:00.000Z" }),
    ];
    const result = sortAppearancesByDate(items);
    expect(result[0].festivalId).toBe("a");
  });

  it("puts null startTime before non-null when same date", () => {
    const items = [
      makeAppearance({ festivalId: "b", startTime: "2026-08-01T10:00:00.000Z" }),
      makeAppearance({ festivalId: "a", startTime: null }),
    ];
    const result = sortAppearancesByDate(items);
    expect(result[0].festivalId).toBe("a");
  });

  it("returns empty array for empty input", () => {
    expect(sortAppearancesByDate([])).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const items = [
      makeAppearance({ festivalId: "b", startDate: "2026-09-01T00:00:00.000Z" }),
      makeAppearance({ festivalId: "a", startDate: "2026-08-01T00:00:00.000Z" }),
    ];
    sortAppearancesByDate(items);
    expect(items[0].festivalId).toBe("b");
  });
});

describe("splitByTemporality", () => {
  it("places future festivals in upcoming", () => {
    const now = new Date("2026-07-01T00:00:00.000Z");
    const item = makeAppearance({ endDate: "2026-08-30T00:00:00.000Z" });
    const { upcoming, past } = splitByTemporality([item], now);
    expect(upcoming).toHaveLength(1);
    expect(past).toHaveLength(0);
  });

  it("places past festivals in past", () => {
    const now = new Date("2026-09-01T00:00:00.000Z");
    const item = makeAppearance({ endDate: "2026-08-30T00:00:00.000Z" });
    const { upcoming, past } = splitByTemporality([item], now);
    expect(upcoming).toHaveLength(0);
    expect(past).toHaveLength(1);
  });

  it("treats same-day endDate as upcoming", () => {
    const now = new Date("2026-08-30T12:00:00.000Z");
    const item = makeAppearance({ endDate: "2026-08-30T00:00:00.000Z" });
    const { upcoming } = splitByTemporality([item], now);
    expect(upcoming).toHaveLength(1);
  });

  it("splits mixed appearances correctly", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");
    const items = [
      makeAppearance({ festivalId: "past", endDate: "2026-07-31T00:00:00.000Z" }),
      makeAppearance({ festivalId: "future", endDate: "2026-09-01T00:00:00.000Z" }),
    ];
    const { upcoming, past } = splitByTemporality(items, now);
    expect(upcoming[0].festivalId).toBe("future");
    expect(past[0].festivalId).toBe("past");
  });
});

describe("formatDisciplines", () => {
  it("joins disciplines with comma and space", () => {
    expect(formatDisciplines(["DJ", "Producteur"])).toBe("DJ, Producteur");
  });

  it("returns single discipline as-is", () => {
    expect(formatDisciplines(["Live"])).toBe("Live");
  });

  it("returns empty string for empty array", () => {
    expect(formatDisciplines([])).toBe("");
  });
});

describe("buildInstagramUrl", () => {
  it("builds URL from handle without @", () => {
    expect(buildInstagramUrl("ironmaiden")).toBe("https://www.instagram.com/ironmaiden/");
  });

  it("strips leading @ from handle", () => {
    expect(buildInstagramUrl("@ironmaiden")).toBe("https://www.instagram.com/ironmaiden/");
  });
});

describe("buildSpotifyUrl", () => {
  it("builds Spotify artist URL from ID", () => {
    expect(buildSpotifyUrl("6mdiAmATAx73kdxrNbo6y2")).toBe(
      "https://open.spotify.com/artist/6mdiAmATAx73kdxrNbo6y2",
    );
  });
});
