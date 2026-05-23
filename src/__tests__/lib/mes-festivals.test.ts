import { describe, expect, it } from "vitest";
import {
  formatDaysUntilLabel,
  getDaysUntil,
  getDaysUntilColor,
  sortFollowedByDate,
} from "@/lib/mes-festivals";
import type { FestivalSummary } from "@/types";

function makeFestival(overrides: Partial<FestivalSummary> = {}): FestivalSummary {
  return {
    id: "f1",
    name: "Festival Test",
    slug: "festival-test",
    startDate: "2026-07-01T00:00:00Z",
    endDate: "2026-07-05T00:00:00Z",
    city: "Paris",
    country: "FR",
    festivalType: "musique",
    programType: "structuré",
    programStatus: "complet",
    confidenceLevel: "vérifié_humain",
    ...overrides,
  };
}

const NOW = new Date("2026-05-23T12:00:00Z");

describe("sortFollowedByDate", () => {
  it("sorts by startDate ascending", () => {
    const festivals = [
      makeFestival({ id: "b", startDate: "2026-08-01T00:00:00Z" }),
      makeFestival({ id: "a", startDate: "2026-06-01T00:00:00Z" }),
      makeFestival({ id: "c", startDate: "2026-07-01T00:00:00Z" }),
    ];
    const result = sortFollowedByDate(festivals);
    expect(result.map((f) => f.id)).toEqual(["a", "c", "b"]);
  });

  it("does not mutate original array", () => {
    const festivals = [
      makeFestival({ id: "b", startDate: "2026-08-01T00:00:00Z" }),
      makeFestival({ id: "a", startDate: "2026-06-01T00:00:00Z" }),
    ];
    sortFollowedByDate(festivals);
    expect(festivals[0].id).toBe("b");
  });

  it("returns empty for empty input", () => {
    expect(sortFollowedByDate([])).toEqual([]);
  });
});

describe("getDaysUntil", () => {
  it("returns 0 for same day", () => {
    expect(getDaysUntil("2026-05-23T00:00:00Z", NOW)).toBe(0);
  });

  it("returns positive for future dates", () => {
    expect(getDaysUntil("2026-05-24T00:00:00Z", NOW)).toBe(1);
    expect(getDaysUntil("2026-06-22T00:00:00Z", NOW)).toBe(30);
  });

  it("returns negative for past dates", () => {
    expect(getDaysUntil("2026-05-22T00:00:00Z", NOW)).toBe(-1);
    expect(getDaysUntil("2026-05-13T00:00:00Z", NOW)).toBe(-10);
  });
});

describe("formatDaysUntilLabel", () => {
  it("returns J+N for past dates", () => {
    expect(formatDaysUntilLabel("2026-05-22T00:00:00Z", NOW)).toBe("J+1");
    expect(formatDaysUntilLabel("2026-05-13T00:00:00Z", NOW)).toBe("J+10");
  });

  it("returns Aujourd'hui for today", () => {
    expect(formatDaysUntilLabel("2026-05-23T00:00:00Z", NOW)).toBe("Aujourd'hui");
  });

  it("returns Demain for tomorrow", () => {
    expect(formatDaysUntilLabel("2026-05-24T00:00:00Z", NOW)).toBe("Demain");
  });

  it("returns Dans X j for 2+ days", () => {
    expect(formatDaysUntilLabel("2026-05-25T00:00:00Z", NOW)).toBe("Dans 2 j");
    expect(formatDaysUntilLabel("2026-06-22T00:00:00Z", NOW)).toBe("Dans 30 j");
  });
});

describe("getDaysUntilColor", () => {
  it("returns dim for past", () => {
    expect(getDaysUntilColor(-1)).toBe("#666");
  });

  it("returns danger-red for ≤3 days", () => {
    expect(getDaysUntilColor(0)).toBe("#FF3355");
    expect(getDaysUntilColor(3)).toBe("#FF3355");
  });

  it("returns warning-orange for 4-7 days", () => {
    expect(getDaysUntilColor(4)).toBe("#FF9900");
    expect(getDaysUntilColor(7)).toBe("#FF9900");
  });

  it("returns neon for 8-30 days", () => {
    expect(getDaysUntilColor(8)).toBe("#00FF66");
    expect(getDaysUntilColor(30)).toBe("#00FF66");
  });

  it("returns dim for >30 days", () => {
    expect(getDaysUntilColor(31)).toBe("#666");
  });
});
