import { describe, expect, it } from "vitest";
import {
  type AgendaIcsEvent,
  buildAgendaIcsEvent,
  buildAgendaIcsEvents,
  deriveAgendaEndIso,
} from "@/lib/agenda-ics";

const BASE_EVENT: AgendaIcsEvent = {
  id: "evt-1",
  title: "Set de DJ",
  startTime: "2026-07-15T20:00:00.000Z",
  endTime: null,
  durationMins: null,
  venue: "Scène principale",
  artist: "Gorillaz",
  festivalName: "Rock en Seine",
  status: "must-see",
};

describe("deriveAgendaEndIso", () => {
  it("returns endTime when provided", () => {
    const ev = { ...BASE_EVENT, endTime: "2026-07-15T21:30:00.000Z" };
    expect(deriveAgendaEndIso(ev)).toBe("2026-07-15T21:30:00.000Z");
  });

  it("computes end from durationMins when no endTime", () => {
    const ev = { ...BASE_EVENT, durationMins: 90 };
    const result = deriveAgendaEndIso(ev);
    const expected = new Date(
      new Date("2026-07-15T20:00:00.000Z").getTime() + 90 * 60_000,
    ).toISOString();
    expect(result).toBe(expected);
  });

  it("defaults to 1 hour when neither endTime nor durationMins", () => {
    const result = deriveAgendaEndIso(BASE_EVENT);
    const expected = new Date(
      new Date("2026-07-15T20:00:00.000Z").getTime() + 60 * 60_000,
    ).toISOString();
    expect(result).toBe(expected);
  });
});

describe("buildAgendaIcsEvent", () => {
  it("includes artist name in summary", () => {
    const result = buildAgendaIcsEvent(BASE_EVENT);
    expect(result.summary).toContain("Gorillaz");
  });

  it("includes title in summary", () => {
    const result = buildAgendaIcsEvent(BASE_EVENT);
    expect(result.summary).toContain("Set de DJ");
  });

  it("sets venue as location", () => {
    const result = buildAgendaIcsEvent(BASE_EVENT);
    expect(result.location).toBe("Scène principale");
  });

  it("omits location when venue is null", () => {
    const result = buildAgendaIcsEvent({ ...BASE_EVENT, venue: null });
    expect(result.location).toBeUndefined();
  });

  it("includes festival name in description", () => {
    const result = buildAgendaIcsEvent(BASE_EVENT);
    expect(result.description).toContain("Rock en Seine");
  });

  it("includes must-see marker in description", () => {
    const result = buildAgendaIcsEvent(BASE_EVENT);
    expect(result.description).toContain("Must-see");
  });

  it("includes intéressé marker in description", () => {
    const result = buildAgendaIcsEvent({ ...BASE_EVENT, status: "intéressé" });
    expect(result.description).toContain("Intéressé");
  });

  it("uses event id as uid", () => {
    expect(buildAgendaIcsEvent(BASE_EVENT).uid).toBe("evt-1");
  });

  it("uses startTime as startIso", () => {
    expect(buildAgendaIcsEvent(BASE_EVENT).startIso).toBe(BASE_EVENT.startTime);
  });
});

describe("buildAgendaIcsEvents", () => {
  it("filters out events without startTime", () => {
    const events: AgendaIcsEvent[] = [
      { ...BASE_EVENT, id: "a", startTime: "2026-07-15T20:00:00.000Z" },
      { ...BASE_EVENT, id: "b", startTime: "" },
    ];
    const result = buildAgendaIcsEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0].uid).toBe("a");
  });

  it("returns empty array for empty input", () => {
    expect(buildAgendaIcsEvents([])).toEqual([]);
  });

  it("converts all valid events", () => {
    const events: AgendaIcsEvent[] = [
      { ...BASE_EVENT, id: "e1" },
      { ...BASE_EVENT, id: "e2", artist: "Interpol" },
    ];
    const result = buildAgendaIcsEvents(events);
    expect(result).toHaveLength(2);
  });
});
