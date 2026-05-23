import { describe, expect, it } from "vitest";
import {
  getDefaultSortMode,
  getSortModeAriaLabel,
  SORT_MODE_LABELS,
  SORT_MODES,
  sortFestivals,
} from "@/lib/catalogue-sort";

type F = {
  name: string;
  startDate: string;
  endDate: string;
  _count?: { followers: number } | null;
};

function makeFestival(name: string, startDate: string, endDate: string, followers = 0): F {
  return { name, startDate, endDate, _count: { followers } };
}

describe("SORT_MODES", () => {
  it("contains the three expected modes", () => {
    expect(SORT_MODES).toContain("temporal");
    expect(SORT_MODES).toContain("alpha");
    expect(SORT_MODES).toContain("popularity");
  });
});

describe("SORT_MODE_LABELS", () => {
  it("has a label for each mode", () => {
    for (const mode of SORT_MODES) {
      expect(SORT_MODE_LABELS[mode]).toBeTruthy();
    }
  });
});

describe("getSortModeAriaLabel", () => {
  it("returns non-empty aria labels for all modes", () => {
    for (const mode of SORT_MODES) {
      const label = getSortModeAriaLabel(mode);
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe("getDefaultSortMode", () => {
  it("returns 'temporal'", () => {
    expect(getDefaultSortMode()).toBe("temporal");
  });
});

describe("sortFestivals — alpha mode", () => {
  it("sorts alphabetically ascending", () => {
    const festivals = [
      makeFestival("Zebra Fest", "2026-08-01", "2026-08-03"),
      makeFestival("Alpha Rock", "2026-07-01", "2026-07-03"),
      makeFestival("Metal Circus", "2026-09-01", "2026-09-03"),
    ];
    const sorted = sortFestivals(festivals, "alpha");
    expect(sorted.map((f) => f.name)).toEqual(["Alpha Rock", "Metal Circus", "Zebra Fest"]);
  });

  it("is case-insensitive and locale-aware", () => {
    const festivals = [
      makeFestival("Été Fest", "2026-08-01", "2026-08-03"),
      makeFestival("Automne Festival", "2026-10-01", "2026-10-03"),
    ];
    const sorted = sortFestivals(festivals, "alpha");
    expect(sorted[0].name).toBe("Automne Festival");
  });

  it("does not mutate the original array", () => {
    const festivals = [
      makeFestival("Z", "2026-08-01", "2026-08-03"),
      makeFestival("A", "2026-07-01", "2026-07-03"),
    ];
    const original = [...festivals];
    sortFestivals(festivals, "alpha");
    expect(festivals).toEqual(original);
  });
});

describe("sortFestivals — popularity mode", () => {
  it("sorts by followers descending", () => {
    const festivals = [
      makeFestival("Small Fest", "2026-07-01", "2026-07-03", 10),
      makeFestival("Mega Fest", "2026-08-01", "2026-08-03", 5000),
      makeFestival("Mid Fest", "2026-09-01", "2026-09-03", 300),
    ];
    const sorted = sortFestivals(festivals, "popularity");
    expect(sorted[0].name).toBe("Mega Fest");
    expect(sorted[1].name).toBe("Mid Fest");
    expect(sorted[2].name).toBe("Small Fest");
  });

  it("breaks ties alphabetically", () => {
    const festivals = [
      makeFestival("Zebra Fest", "2026-08-01", "2026-08-03", 100),
      makeFestival("Alpha Fest", "2026-07-01", "2026-07-03", 100),
    ];
    const sorted = sortFestivals(festivals, "popularity");
    expect(sorted[0].name).toBe("Alpha Fest");
  });

  it("handles missing _count gracefully", () => {
    const festivals = [
      { name: "No Count", startDate: "2026-07-01", endDate: "2026-07-03" },
      makeFestival("With Count", "2026-08-01", "2026-08-03", 50),
    ];
    const sorted = sortFestivals(festivals, "popularity");
    expect(sorted[0].name).toBe("With Count");
  });
});

describe("sortFestivals — temporal mode", () => {
  it("sorts by temporal relevance (active before upcoming before past)", () => {
    const _now = new Date("2026-07-15T12:00:00Z");
    const past = makeFestival("Past Fest", "2026-01-01", "2026-01-05");
    const active = makeFestival("Active Fest", "2026-07-10", "2026-07-20");
    const upcoming = makeFestival("Upcoming Fest", "2026-10-01", "2026-10-05");

    // temporal mode uses compareByTemporalRelevance internally
    // Just verify it doesn't throw and returns a valid sorted array
    const sorted = sortFestivals([past, upcoming, active], "temporal");
    expect(sorted).toHaveLength(3);
    // active should come first
    expect(sorted[0].name).toBe("Active Fest");
  });
});
