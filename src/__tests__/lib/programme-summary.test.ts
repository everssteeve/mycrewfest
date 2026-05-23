import { describe, it, expect } from "vitest";
import { countEventsByDay, countItinerantEvents, countVuEventsByDay } from "@/lib/programme-summary";

describe("countEventsByDay", () => {
  it("returns empty map for no events", () => {
    expect(countEventsByDay([])).toEqual(new Map());
  });

  it("returns empty map when no events have startTime", () => {
    const events = [{ startTime: null }, { startTime: undefined }];
    expect(countEventsByDay(events)).toEqual(new Map());
  });

  it("counts single event correctly", () => {
    const events = [{ startTime: "2026-07-15T14:00:00" }];
    const result = countEventsByDay(events);
    expect(result.get("2026-07-15")).toBe(1);
  });

  it("groups multiple events on the same day", () => {
    const events = [
      { startTime: "2026-07-15T10:00:00" },
      { startTime: "2026-07-15T14:00:00" },
      { startTime: "2026-07-15T20:00:00" },
    ];
    const result = countEventsByDay(events);
    expect(result.get("2026-07-15")).toBe(3);
  });

  it("counts events across multiple days separately", () => {
    const events = [
      { startTime: "2026-07-15T14:00:00" },
      { startTime: "2026-07-16T10:00:00" },
      { startTime: "2026-07-16T20:00:00" },
      { startTime: "2026-07-17T12:00:00" },
    ];
    const result = countEventsByDay(events);
    expect(result.get("2026-07-15")).toBe(1);
    expect(result.get("2026-07-16")).toBe(2);
    expect(result.get("2026-07-17")).toBe(1);
    expect(result.size).toBe(3);
  });

  it("ignores events without startTime", () => {
    const events = [
      { startTime: "2026-07-15T14:00:00" },
      { startTime: null },
      { startTime: undefined },
    ];
    const result = countEventsByDay(events);
    expect(result.size).toBe(1);
    expect(result.get("2026-07-15")).toBe(1);
  });
});

describe("countItinerantEvents", () => {
  it("returns 0 for empty array", () => {
    expect(countItinerantEvents([])).toBe(0);
  });

  it("returns 0 when all events have startTime", () => {
    const events = [{ startTime: "2026-07-15T14:00:00" }];
    expect(countItinerantEvents(events)).toBe(0);
  });

  it("counts events without startTime", () => {
    const events = [
      { startTime: null },
      { startTime: undefined },
      { startTime: "2026-07-15T14:00:00" },
    ];
    expect(countItinerantEvents(events)).toBe(2);
  });
});

describe("countVuEventsByDay", () => {
  const ev = (startTime: string | null, status: string | null = null) => ({
    startTime,
    selection: status ? { status } : null,
  });

  it("returns empty map for no events", () => {
    expect(countVuEventsByDay([])).toEqual(new Map());
  });

  it("ignores events without selection", () => {
    const events = [ev("2026-07-15T14:00:00", null)];
    expect(countVuEventsByDay(events)).toEqual(new Map());
  });

  it("ignores non-vu selections", () => {
    const events = [
      ev("2026-07-15T14:00:00", "must-see"),
      ev("2026-07-15T16:00:00", "intéressé"),
    ];
    expect(countVuEventsByDay(events)).toEqual(new Map());
  });

  it("counts vu events per day", () => {
    const events = [
      ev("2026-07-15T10:00:00", "vu"),
      ev("2026-07-15T14:00:00", "vu"),
      ev("2026-07-15T20:00:00", "must-see"),
      ev("2026-07-16T10:00:00", "vu"),
    ];
    const result = countVuEventsByDay(events);
    expect(result.get("2026-07-15")).toBe(2);
    expect(result.get("2026-07-16")).toBe(1);
    expect(result.size).toBe(2);
  });

  it("ignores events without startTime even if vu", () => {
    const events = [ev(null, "vu")];
    expect(countVuEventsByDay(events)).toEqual(new Map());
  });
});
