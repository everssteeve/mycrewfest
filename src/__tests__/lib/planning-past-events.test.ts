import { describe, it, expect } from "vitest";
import { getEventTimeStatus } from "@/lib/event-status";

const BASE = "2026-07-20T";
function t(h: number, m = 0): string {
  return `${BASE}${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
}

const NOW = new Date(`${BASE}15:00:00`);

describe("planning timeline — past event detection", () => {
  it("event with explicit endTime in the past is 'past'", () => {
    expect(getEventTimeStatus({ startTime: t(12), endTime: t(13) }, NOW)).toBe("past");
  });

  it("event with durationMins that ended is 'past'", () => {
    expect(getEventTimeStatus({ startTime: t(13), durationMins: 60 }, NOW)).toBe("past");
  });

  it("event with no endTime or duration that started over 1h ago is 'past'", () => {
    // default end = start + 1h; started at 13h, default end 14h < now(15h)
    expect(getEventTimeStatus({ startTime: t(13) }, NOW)).toBe("past");
  });

  it("event starting in future is 'upcoming'", () => {
    expect(getEventTimeStatus({ startTime: t(17) }, NOW)).toBe("upcoming");
  });

  it("event currently ongoing is 'ongoing'", () => {
    expect(getEventTimeStatus({ startTime: t(14), endTime: t(16) }, NOW)).toBe("ongoing");
  });

  it("event with no startTime is 'unknown'", () => {
    expect(getEventTimeStatus({ startTime: null }, NOW)).toBe("unknown");
  });
});

describe("planning timeline — past event opacity mapping", () => {
  it("'past' events should be considered for dimming", () => {
    const status = getEventTimeStatus({ startTime: t(10), endTime: t(11) }, NOW);
    expect(status === "past").toBe(true);
  });

  it("'ongoing' events should NOT be dimmed", () => {
    const status = getEventTimeStatus({ startTime: t(14), endTime: t(16) }, NOW);
    expect(status === "past").toBe(false);
  });

  it("'upcoming' events should NOT be dimmed", () => {
    const status = getEventTimeStatus({ startTime: t(18) }, NOW);
    expect(status === "past").toBe(false);
  });
});
