import { describe, it, expect } from "vitest";
import {
  formatHourSeparator,
  extractEventHour,
  buildTimelineSlots,
  countHourSeparators,
  type TimelineEvent,
} from "@/lib/programme-timeline";

const makeEvent = (id: string, startTime: string | null): TimelineEvent => ({ id, startTime });

describe("formatHourSeparator", () => {
  it("pads single digit hours", () => expect(formatHourSeparator(9)).toBe("09:00"));
  it("formats double digit hours", () => expect(formatHourSeparator(20)).toBe("20:00"));
  it("formats midnight", () => expect(formatHourSeparator(0)).toBe("00:00"));
  it("formats 23h", () => expect(formatHourSeparator(23)).toBe("23:00"));
});

describe("extractEventHour", () => {
  it("extracts hour from ISO string", () => {
    expect(extractEventHour("2026-06-20T20:30:00Z")).toBe(20);
  });
  it("returns null for null input", () => {
    expect(extractEventHour(null)).toBeNull();
  });
  it("returns null for invalid date string", () => {
    expect(extractEventHour("not-a-date")).toBeNull();
  });
  it("handles midnight", () => {
    expect(extractEventHour("2026-06-20T00:00:00Z")).toBe(0);
  });
});

describe("buildTimelineSlots", () => {
  it("inserts separator before first hour group", () => {
    const events = [makeEvent("e1", "2026-06-20T20:00:00Z"), makeEvent("e2", "2026-06-20T20:30:00Z")];
    const slots = buildTimelineSlots(events);
    expect(slots[0].type).toBe("separator");
    expect(slots[1].type).toBe("event");
    expect(slots[2].type).toBe("event");
  });

  it("inserts separator between different hours", () => {
    const events = [
      makeEvent("e1", "2026-06-20T20:00:00Z"),
      makeEvent("e2", "2026-06-20T21:00:00Z"),
    ];
    const slots = buildTimelineSlots(events);
    const separators = slots.filter((s) => s.type === "separator");
    expect(separators).toHaveLength(2);
  });

  it("no separator for same hour consecutive events", () => {
    const events = [
      makeEvent("e1", "2026-06-20T20:00:00Z"),
      makeEvent("e2", "2026-06-20T20:45:00Z"),
    ];
    const slots = buildTimelineSlots(events);
    const separators = slots.filter((s) => s.type === "separator");
    expect(separators).toHaveLength(1);
  });

  it("handles events without startTime", () => {
    const events = [makeEvent("e1", null), makeEvent("e2", null)];
    const slots = buildTimelineSlots(events);
    expect(slots.every((s) => s.type === "event")).toBe(true);
  });

  it("returns empty for empty input", () => {
    expect(buildTimelineSlots([])).toEqual([]);
  });

  it("preserves all events", () => {
    const events = [
      makeEvent("e1", "2026-06-20T20:00:00Z"),
      makeEvent("e2", "2026-06-20T21:00:00Z"),
      makeEvent("e3", null),
    ];
    const slots = buildTimelineSlots(events);
    const eventSlots = slots.filter((s) => s.type === "event");
    expect(eventSlots).toHaveLength(3);
  });
});

describe("countHourSeparators", () => {
  it("counts distinct hours", () => {
    const events = [
      makeEvent("e1", "2026-06-20T20:00:00Z"),
      makeEvent("e2", "2026-06-20T20:30:00Z"),
      makeEvent("e3", "2026-06-20T21:00:00Z"),
    ];
    expect(countHourSeparators(events)).toBe(2);
  });

  it("returns 0 for events without time", () => {
    expect(countHourSeparators([makeEvent("e1", null)])).toBe(0);
  });

  it("returns 0 for empty array", () => {
    expect(countHourSeparators([])).toBe(0);
  });
});
