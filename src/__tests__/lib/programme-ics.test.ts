import { describe, it, expect } from "vitest";
import {
  isExportable,
  deriveEndIso,
  toIcsEvent,
  buildProgrammeIcs,
  countExportableEvents,
  type IcsConvertible,
} from "@/lib/programme-ics";

const makeEvent = (
  overrides: Partial<IcsConvertible> = {},
): IcsConvertible => ({
  id: "evt-1",
  title: "Concert",
  startTime: "2026-06-19T20:00:00.000Z",
  endTime: "2026-06-19T21:30:00.000Z",
  durationMins: 90,
  venue: { name: "Main Stage 1" },
  artist: { name: "Iron Maiden" },
  selection: { status: "must-see" },
  ...overrides,
});

describe("isExportable", () => {
  it("returns false when startTime is null", () => {
    const e = makeEvent({ startTime: null });
    expect(isExportable(e, "selected")).toBe(false);
    expect(isExportable(e, "all-with-time")).toBe(false);
  });

  describe("filter=must-see", () => {
    it("true for must-see", () => expect(isExportable(makeEvent(), "must-see")).toBe(true));
    it("false for intéressant", () => expect(isExportable(makeEvent({ selection: { status: "intéressant" } }), "must-see")).toBe(false));
    it("false for null selection", () => expect(isExportable(makeEvent({ selection: null }), "must-see")).toBe(false));
  });

  describe("filter=selected", () => {
    it("true for must-see", () => expect(isExportable(makeEvent({ selection: { status: "must-see" } }), "selected")).toBe(true));
    it("true for intéressant", () => expect(isExportable(makeEvent({ selection: { status: "intéressant" } }), "selected")).toBe(true));
    it("false for vu", () => expect(isExportable(makeEvent({ selection: { status: "vu" } }), "selected")).toBe(false));
    it("false for null", () => expect(isExportable(makeEvent({ selection: null }), "selected")).toBe(false));
  });

  describe("filter=all-with-time", () => {
    it("true for any event with startTime", () => expect(isExportable(makeEvent({ selection: null }), "all-with-time")).toBe(true));
    it("false without startTime", () => expect(isExportable(makeEvent({ startTime: null }), "all-with-time")).toBe(false));
  });
});

describe("deriveEndIso", () => {
  it("returns endTime when present", () => {
    const e = makeEvent();
    expect(deriveEndIso(e)).toBe(e.endTime);
  });

  it("computes from durationMins when endTime is null", () => {
    const e = makeEvent({ endTime: null, durationMins: 60 });
    const start = new Date(e.startTime!).getTime();
    const expected = new Date(start + 60 * 60_000).toISOString();
    expect(deriveEndIso(e)).toBe(expected);
  });

  it("defaults to +1h when neither endTime nor durationMins", () => {
    const e = makeEvent({ endTime: null, durationMins: null });
    const start = new Date(e.startTime!).getTime();
    const expected = new Date(start + 60 * 60_000).toISOString();
    expect(deriveEndIso(e)).toBe(expected);
  });
});

describe("toIcsEvent", () => {
  it("prefixes summary with artist name when present", () => {
    const e = makeEvent();
    const ics = toIcsEvent(e);
    expect(ics.summary).toContain("Iron Maiden");
    expect(ics.summary).toContain("Concert");
  });

  it("uses title only when no artist", () => {
    const e = makeEvent({ artist: null });
    expect(toIcsEvent(e).summary).toBe("Concert");
  });

  it("sets location from venue name", () => {
    expect(toIcsEvent(makeEvent()).location).toBe("Main Stage 1");
  });

  it("location is undefined when venue is null", () => {
    expect(toIcsEvent(makeEvent({ venue: null })).location).toBeUndefined();
  });

  it("uid matches event id", () => {
    expect(toIcsEvent(makeEvent()).uid).toBe("evt-1");
  });
});

describe("buildProgrammeIcs", () => {
  it("returns a valid ICS string starting with BEGIN:VCALENDAR", () => {
    const events = [makeEvent()];
    const ics = buildProgrammeIcs(events, "Hellfest");
    expect(ics).toMatch(/^BEGIN:VCALENDAR/);
    expect(ics).toContain("END:VCALENDAR");
  });

  it("includes the festival name in the calendar name", () => {
    const ics = buildProgrammeIcs([makeEvent()], "Hellfest", "all-with-time");
    expect(ics).toContain("Hellfest");
  });

  it("returns empty calendar when no exportable events", () => {
    const events = [makeEvent({ startTime: null })];
    const ics = buildProgrammeIcs(events, "Hellfest");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});

describe("countExportableEvents", () => {
  it("counts only matching events", () => {
    const events = [
      makeEvent({ id: "1", selection: { status: "must-see" } }),
      makeEvent({ id: "2", selection: { status: "intéressant" } }),
      makeEvent({ id: "3", selection: null }),
      makeEvent({ id: "4", startTime: null }),
    ];
    expect(countExportableEvents(events, "must-see")).toBe(1);
    expect(countExportableEvents(events, "selected")).toBe(2);
    expect(countExportableEvents(events, "all-with-time")).toBe(3);
  });
});
