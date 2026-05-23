import { describe, it, expect } from "vitest";
import { getEventTimeStatus, findOngoingEventIds, countOngoingEvents } from "@/lib/event-status";

const BASE = "2026-07-15T";
function t(h: number, m = 0): string {
  return `${BASE}${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
}

const NOW = new Date(`${BASE}18:00:00`);

describe("getEventTimeStatus — unknown", () => {
  it("returns 'unknown' when startTime is null", () => {
    expect(getEventTimeStatus({ startTime: null }, NOW)).toBe("unknown");
  });
  it("returns 'unknown' when startTime is undefined", () => {
    expect(getEventTimeStatus({ startTime: undefined }, NOW)).toBe("unknown");
  });
});

describe("getEventTimeStatus — upcoming", () => {
  it("returns 'upcoming' for event starting in the future", () => {
    expect(getEventTimeStatus({ startTime: t(20) }, NOW)).toBe("upcoming");
  });
  it("returns 'upcoming' 1 minute before start", () => {
    expect(getEventTimeStatus({ startTime: t(18, 1) }, NOW)).toBe("upcoming");
  });
});

describe("getEventTimeStatus — ongoing", () => {
  it("returns 'ongoing' when event started and has explicit endTime in future", () => {
    const event = { startTime: t(17), endTime: t(19) };
    expect(getEventTimeStatus(event, NOW)).toBe("ongoing");
  });

  it("returns 'ongoing' when event started and uses durationMins", () => {
    const event = { startTime: t(17), endTime: null, durationMins: 120 };
    expect(getEventTimeStatus(event, NOW)).toBe("ongoing");
  });

  it("returns 'ongoing' when event started and no duration info (default 1h)", () => {
    const event = { startTime: t(17, 30), endTime: null, durationMins: null };
    expect(getEventTimeStatus(event, NOW)).toBe("ongoing");
  });

  it("returns 'ongoing' exactly at start time", () => {
    const event = { startTime: t(18), endTime: t(20) };
    expect(getEventTimeStatus(event, NOW)).toBe("ongoing");
  });
});

describe("getEventTimeStatus — past", () => {
  it("returns 'past' when event ended in the past", () => {
    const event = { startTime: t(14), endTime: t(16) };
    expect(getEventTimeStatus(event, NOW)).toBe("past");
  });

  it("returns 'past' when event ended using durationMins", () => {
    const event = { startTime: t(14), endTime: null, durationMins: 60 };
    // started at 14h, ended at 15h (now = 18h)
    expect(getEventTimeStatus(event, NOW)).toBe("past");
  });
});

describe("findOngoingEventIds", () => {
  it("returns empty set for no events", () => {
    expect(findOngoingEventIds([], NOW)).toEqual(new Set());
  });

  it("returns IDs of ongoing events only", () => {
    const events = [
      { id: "e1", startTime: t(14), endTime: t(16) },    // past
      { id: "e2", startTime: t(17), endTime: t(19) },    // ongoing
      { id: "e3", startTime: t(20), endTime: t(22) },    // upcoming
      { id: "e4", startTime: null },                      // unknown
    ];
    const result = findOngoingEventIds(events, NOW);
    expect(result.has("e2")).toBe(true);
    expect(result.has("e1")).toBe(false);
    expect(result.has("e3")).toBe(false);
    expect(result.has("e4")).toBe(false);
  });
});

describe("countOngoingEvents", () => {
  const now = new Date(`${BASE}14:00:00`);

  it("returns 0 for empty list", () => {
    expect(countOngoingEvents([], now)).toBe(0);
  });

  it("counts only currently ongoing events", () => {
    const events = [
      { startTime: t(12), endTime: t(13) },
      { startTime: t(13), endTime: t(15) },
      { startTime: t(15), endTime: t(16) },
      { startTime: undefined },
    ];
    expect(countOngoingEvents(events, now)).toBe(1);
  });

  it("returns 0 when all events are past or future", () => {
    const events = [
      { startTime: t(10), endTime: t(11) },
      { startTime: t(15), endTime: t(16) },
    ];
    expect(countOngoingEvents(events, now)).toBe(0);
  });

  it("handles multiple concurrent ongoing events", () => {
    const events = [
      { startTime: t(13), endTime: t(16) },
      { startTime: t(13, 30), endTime: t(15) },
      { startTime: t(10), endTime: t(11) },
    ];
    expect(countOngoingEvents(events, now)).toBe(2);
  });
});
