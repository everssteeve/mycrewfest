import { describe, it, expect } from "vitest";
import { countEventsByDay, countItinerantEvents, countVuEventsByDay, computeProgrammeDurationMins, countUniqueVenues } from "@/lib/programme-summary";

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

describe("computeProgrammeDurationMins", () => {
  it("returns 0 for empty list", () => {
    expect(computeProgrammeDurationMins([])).toBe(0);
  });

  it("sums durationMins when available", () => {
    const events = [{ durationMins: 60 }, { durationMins: 45 }];
    expect(computeProgrammeDurationMins(events)).toBe(105);
  });

  it("derives duration from startTime/endTime when durationMins is absent", () => {
    const events = [
      { startTime: "2026-07-15T14:00:00Z", endTime: "2026-07-15T15:30:00Z" },
    ];
    expect(computeProgrammeDurationMins(events)).toBe(90);
  });

  it("prefers durationMins over startTime/endTime", () => {
    const events = [
      { durationMins: 60, startTime: "2026-07-15T14:00:00Z", endTime: "2026-07-15T16:00:00Z" },
    ];
    expect(computeProgrammeDurationMins(events)).toBe(60);
  });

  it("skips events with no duration info", () => {
    const events = [{ durationMins: 30 }, {}];
    expect(computeProgrammeDurationMins(events)).toBe(30);
  });

  it("rounds the result to nearest minute", () => {
    const result = computeProgrammeDurationMins([{ durationMins: 45 }, { durationMins: 30 }]);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("countUniqueVenues", () => {
  it("returns 0 for empty array", () => {
    expect(countUniqueVenues([])).toBe(0);
  });

  it("returns 0 when no events have a venue", () => {
    const events = [{ venue: null }, { venue: undefined }];
    expect(countUniqueVenues(events)).toBe(0);
  });

  it("counts a single venue", () => {
    const events = [{ venue: { id: "v1" } }, { venue: { id: "v1" } }];
    expect(countUniqueVenues(events)).toBe(1);
  });

  it("counts multiple distinct venues", () => {
    const events = [
      { venue: { id: "v1" } },
      { venue: { id: "v2" } },
      { venue: { id: "v1" } },
      { venue: { id: "v3" } },
    ];
    expect(countUniqueVenues(events)).toBe(3);
  });

  it("ignores events without a venue", () => {
    const events = [
      { venue: { id: "v1" } },
      { venue: null },
      { venue: { id: "v2" } },
    ];
    expect(countUniqueVenues(events)).toBe(2);
  });
});
