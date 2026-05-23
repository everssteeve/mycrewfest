import { describe, expect, it } from "vitest";
import {
  countActiveFestEvents,
  countPastFestEvents,
  countUpcomingFestEvents,
} from "@/lib/profil-stats";

const NOW = new Date("2026-05-23T12:00:00");
const TODAY = "2026-05-23";

const fe = (startDate: string, endDate: string) => ({ festival: { startDate, endDate } });

// ---------------------------------------------------------------------------
// countUpcomingFestEvents
// ---------------------------------------------------------------------------

describe("countUpcomingFestEvents", () => {
  it("returns 0 for empty list", () => {
    expect(countUpcomingFestEvents([], NOW)).toBe(0);
  });

  it("counts fest events whose festival starts after today", () => {
    const festEvents = [
      fe("2026-06-01", "2026-06-05"),
      fe("2026-05-20", "2026-05-25"),
      fe("2026-07-01", "2026-07-05"),
    ];
    expect(countUpcomingFestEvents(festEvents, NOW)).toBe(2);
  });

  it("does not count a festival starting today", () => {
    expect(countUpcomingFestEvents([fe(TODAY, "2026-05-30")], NOW)).toBe(0);
  });

  it("does not count a past festival", () => {
    expect(countUpcomingFestEvents([fe("2026-01-01", "2026-01-05")], NOW)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// countActiveFestEvents
// ---------------------------------------------------------------------------

describe("countActiveFestEvents", () => {
  it("returns 0 for empty list", () => {
    expect(countActiveFestEvents([], NOW)).toBe(0);
  });

  it("counts a festival that started before today and ends after today", () => {
    expect(countActiveFestEvents([fe("2026-05-20", "2026-05-28")], NOW)).toBe(1);
  });

  it("counts a festival starting and ending today", () => {
    expect(countActiveFestEvents([fe(TODAY, TODAY)], NOW)).toBe(1);
  });

  it("does not count a festival ending yesterday", () => {
    expect(countActiveFestEvents([fe("2026-05-20", "2026-05-22")], NOW)).toBe(0);
  });

  it("does not count a festival starting tomorrow", () => {
    expect(countActiveFestEvents([fe("2026-05-24", "2026-05-30")], NOW)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// countPastFestEvents
// ---------------------------------------------------------------------------

describe("countPastFestEvents", () => {
  it("returns 0 for empty list", () => {
    expect(countPastFestEvents([], NOW)).toBe(0);
  });

  it("counts a festival that ended before today", () => {
    expect(countPastFestEvents([fe("2026-01-01", "2026-01-05")], NOW)).toBe(1);
  });

  it("does not count a festival ending today", () => {
    expect(countPastFestEvents([fe("2026-05-20", TODAY)], NOW)).toBe(0);
  });

  it("does not count an upcoming festival", () => {
    expect(countPastFestEvents([fe("2026-06-01", "2026-06-05")], NOW)).toBe(0);
  });

  it("counts multiple past festivals", () => {
    const festEvents = [
      fe("2026-01-01", "2026-01-05"),
      fe("2026-03-01", "2026-03-10"),
      fe("2026-06-01", "2026-06-05"),
    ];
    expect(countPastFestEvents(festEvents, NOW)).toBe(2);
  });
});
