import { describe, it, expect } from "vitest";
import { isUpcomingOrOngoing, countUpcomingEvents } from "@/lib/programme-upcoming";

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

describe("countUpcomingEvents", () => {
  function isoFrom(d: Date): string {
    return d.toISOString();
  }

  it("returns 0 for empty list", () => {
    expect(countUpcomingEvents([], NOW, WINDOW)).toBe(0);
  });

  it("returns 0 when all events have no startTime", () => {
    const events = [{ startTime: null }, { startTime: undefined }];
    expect(countUpcomingEvents(events, NOW, WINDOW)).toBe(0);
  });

  it("returns 0 when all events are already ongoing", () => {
    const events = [{ startTime: isoFrom(mins(-60)) }]; // started 1h ago
    expect(countUpcomingEvents(events, NOW, WINDOW)).toBe(0);
  });

  it("counts events starting within the window", () => {
    const events = [
      { startTime: isoFrom(mins(30)) },  // 30min from now — within 2h
      { startTime: isoFrom(mins(90)) },  // 90min from now — within 2h
    ];
    expect(countUpcomingEvents(events, NOW, WINDOW)).toBe(2);
  });

  it("excludes events starting beyond the window", () => {
    const events = [
      { startTime: isoFrom(mins(30)) },   // within 2h
      { startTime: isoFrom(mins(150)) },  // 2h30 away — beyond window
    ];
    expect(countUpcomingEvents(events, NOW, WINDOW)).toBe(1);
  });

  it("excludes events that already started (ongoing)", () => {
    const events = [
      { startTime: isoFrom(NOW) },         // started exactly now → ongoing, not upcoming
      { startTime: isoFrom(mins(-10)) },   // started 10min ago
      { startTime: isoFrom(mins(10)) },    // starts in 10min → upcoming
    ];
    expect(countUpcomingEvents(events, NOW, WINDOW)).toBe(1);
  });

  it("respects custom windowMins", () => {
    const events = [
      { startTime: isoFrom(mins(30)) },  // 30min away
      { startTime: isoFrom(mins(90)) },  // 90min away
    ];
    expect(countUpcomingEvents(events, NOW, 60)).toBe(1); // only 30min event fits in 1h window
  });
});
