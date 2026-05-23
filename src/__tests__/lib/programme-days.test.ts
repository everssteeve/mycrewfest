import { afterEach, describe, expect, it, vi } from "vitest";
import { extractEventDays, formatDayLabel, getDefaultProgrammeDay } from "@/lib/programme-days";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("extractEventDays", () => {
  it("returns empty array for no events", () => {
    expect(extractEventDays([])).toEqual([]);
  });

  it("returns empty array when no events have startTime", () => {
    expect(extractEventDays([{ startTime: null }, { startTime: undefined }])).toEqual([]);
  });

  it("extracts unique days in YYYY-MM-DD format, sorted", () => {
    const events = [
      { startTime: "2026-07-17T20:00:00" },
      { startTime: "2026-07-15T14:00:00" },
      { startTime: "2026-07-16T10:00:00" },
      { startTime: "2026-07-15T22:00:00" }, // same day as second — deduped
    ];
    expect(extractEventDays(events)).toEqual(["2026-07-15", "2026-07-16", "2026-07-17"]);
  });

  it("ignores events without startTime", () => {
    const events = [
      { startTime: "2026-07-15T14:00:00" },
      { startTime: null },
      { startTime: "2026-07-16T10:00:00" },
    ];
    expect(extractEventDays(events)).toEqual(["2026-07-15", "2026-07-16"]);
  });

  it("returns single day for single-day festival", () => {
    const events = [{ startTime: "2026-07-15T12:00:00" }, { startTime: "2026-07-15T18:00:00" }];
    expect(extractEventDays(events)).toEqual(["2026-07-15"]);
  });
});

describe("getDefaultProgrammeDay", () => {
  it("returns null for empty days array", () => {
    expect(getDefaultProgrammeDay([])).toBeNull();
  });

  it("returns today if today is in the available days", () => {
    const today = new Date().toLocaleDateString("sv-SE");
    const days = [today, "2026-07-16"];
    // Sort to ensure today is valid input
    expect(getDefaultProgrammeDay(days)).toBe(today);
  });

  it("returns first day if today is not in available days", () => {
    const days = ["2026-07-15", "2026-07-16", "2026-07-17"];
    const result = getDefaultProgrammeDay(days);
    // Today is 2026-05-23, not in these future dates
    expect(result).toBe("2026-07-15");
  });

  it("returns first day for single-day array when today is not that day", () => {
    expect(getDefaultProgrammeDay(["2026-07-15"])).toBe("2026-07-15");
  });
});

describe("formatDayLabel", () => {
  it("returns a non-empty string for a valid date", () => {
    const label = formatDayLabel("2026-07-15");
    expect(label.length).toBeGreaterThan(0);
  });

  it("returns the raw string on invalid input", () => {
    expect(formatDayLabel("not-a-date")).toBe("not-a-date");
  });

  it("includes the day number in the label", () => {
    const label = formatDayLabel("2026-07-15");
    expect(label).toContain("15");
  });
});
