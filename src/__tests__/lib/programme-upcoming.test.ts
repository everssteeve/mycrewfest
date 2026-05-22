import { describe, it, expect } from "vitest";
import { isUpcomingOrOngoing } from "@/lib/programme-upcoming";

const NOW = new Date("2026-07-15T18:00:00");
const WINDOW = 120; // 2 hours

function mins(n: number): Date {
  return new Date(NOW.getTime() + n * 60_000);
}

function isoFrom(d: Date): string {
  return d.toISOString();
}

describe("isUpcomingOrOngoing — no startTime", () => {
  it("returns false for event with no startTime", () => {
    expect(isUpcomingOrOngoing({ startTime: null }, NOW, WINDOW)).toBe(false);
    expect(isUpcomingOrOngoing({ startTime: undefined }, NOW, WINDOW)).toBe(false);
  });
});

describe("isUpcomingOrOngoing — ongoing events", () => {
  it("returns true for event that started in the past and has endTime in future", () => {
    const event = {
      startTime: isoFrom(mins(-30)),
      endTime: isoFrom(mins(30)),
    };
    expect(isUpcomingOrOngoing(event, NOW, WINDOW)).toBe(true);
  });

  it("returns true when event started but uses durationMins (no endTime)", () => {
    const event = {
      startTime: isoFrom(mins(-10)),
      endTime: null,
      durationMins: 60,
    };
    expect(isUpcomingOrOngoing(event, NOW, WINDOW)).toBe(true);
  });

  it("returns false for event that fully ended in the past", () => {
    const event = {
      startTime: isoFrom(mins(-120)),
      endTime: isoFrom(mins(-60)),
    };
    expect(isUpcomingOrOngoing(event, NOW, WINDOW)).toBe(false);
  });
});

describe("isUpcomingOrOngoing — upcoming events", () => {
  it("returns true for event starting exactly at window boundary", () => {
    const event = { startTime: isoFrom(mins(WINDOW)) };
    expect(isUpcomingOrOngoing(event, NOW, WINDOW)).toBe(true);
  });

  it("returns true for event starting 30 min from now", () => {
    const event = { startTime: isoFrom(mins(30)) };
    expect(isUpcomingOrOngoing(event, NOW, WINDOW)).toBe(true);
  });

  it("returns true for event starting 1 min from now", () => {
    const event = { startTime: isoFrom(mins(1)) };
    expect(isUpcomingOrOngoing(event, NOW, WINDOW)).toBe(true);
  });

  it("returns false for event starting beyond the window", () => {
    const event = { startTime: isoFrom(mins(WINDOW + 1)) };
    expect(isUpcomingOrOngoing(event, NOW, WINDOW)).toBe(false);
  });
});

describe("isUpcomingOrOngoing — edge cases", () => {
  it("handles event with no endTime or durationMins (defaults to 1h event)", () => {
    // Event that started 30min ago, no end info → assumed 1h, so still ongoing
    const event = {
      startTime: isoFrom(mins(-30)),
      endTime: null,
      durationMins: null,
    };
    expect(isUpcomingOrOngoing(event, NOW, WINDOW)).toBe(true);
  });

  it("returns false for event starting now (startTime === now) — ongoing", () => {
    const event = { startTime: isoFrom(NOW) };
    // now >= start, now <= assumed end (+1h) → ongoing = true
    expect(isUpcomingOrOngoing(event, NOW, WINDOW)).toBe(true);
  });
});
