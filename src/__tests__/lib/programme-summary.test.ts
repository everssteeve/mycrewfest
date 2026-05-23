import { describe, it, expect } from "vitest";
import { countEventsByDay, countItinerantEvents, countVuEventsByDay, computeProgrammeDurationMins, countUniqueVenues, countUniqueArtists, countVerifiedEvents, getPeakEventHour, countReservationRequiredEvents, countCancelledEvents, countModifiedEvents, getTopProgrammeTag } from "@/lib/programme-summary";

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

describe("countUniqueArtists", () => {
  it("returns 0 for empty array", () => {
    expect(countUniqueArtists([])).toBe(0);
  });

  it("returns 0 when no events have an artist", () => {
    const events = [{ artist: null }, { artist: undefined }];
    expect(countUniqueArtists(events)).toBe(0);
  });

  it("counts a single artist appearing multiple times", () => {
    const events = [{ artist: { id: "a1" } }, { artist: { id: "a1" } }];
    expect(countUniqueArtists(events)).toBe(1);
  });

  it("counts multiple distinct artists", () => {
    const events = [
      { artist: { id: "a1" } },
      { artist: { id: "a2" } },
      { artist: { id: "a1" } },
      { artist: { id: "a3" } },
    ];
    expect(countUniqueArtists(events)).toBe(3);
  });

  it("ignores events without an artist", () => {
    const events = [
      { artist: { id: "a1" } },
      { artist: null },
      { artist: { id: "a2" } },
    ];
    expect(countUniqueArtists(events)).toBe(2);
  });
});

describe("countVerifiedEvents", () => {
  it("returns 0 for empty array", () => {
    expect(countVerifiedEvents([])).toBe(0);
  });

  it("counts only vérifié_humain events", () => {
    const events = [
      { confidence: "vérifié_humain" },
      { confidence: "auto" },
      { confidence: "vérifié_humain" },
    ];
    expect(countVerifiedEvents(events)).toBe(2);
  });

  it("returns 0 when all events are auto", () => {
    const events = [{ confidence: "auto" }, { confidence: "auto" }];
    expect(countVerifiedEvents(events)).toBe(0);
  });

  it("returns total when all events are verified", () => {
    const events = [{ confidence: "vérifié_humain" }, { confidence: "vérifié_humain" }];
    expect(countVerifiedEvents(events)).toBe(2);
  });

  it("is case-sensitive — does not match partial strings", () => {
    const events = [{ confidence: "vérifié" }, { confidence: "humain" }];
    expect(countVerifiedEvents(events)).toBe(0);
  });
});

describe("getPeakEventHour", () => {
  it("returns null for empty array", () => {
    expect(getPeakEventHour([])).toBeNull();
  });

  it("returns null when no events have startTime", () => {
    expect(getPeakEventHour([{ startTime: null }, { startTime: undefined }])).toBeNull();
  });

  it("returns the hour of the only event", () => {
    const events = [{ startTime: "2026-07-15T21:00:00" }];
    expect(getPeakEventHour(events)).toBe(21);
  });

  it("returns the hour with the most events", () => {
    const events = [
      { startTime: "2026-07-15T21:00:00" },
      { startTime: "2026-07-15T21:30:00" },
      { startTime: "2026-07-15T22:00:00" },
    ];
    expect(getPeakEventHour(events)).toBe(21);
  });

  it("breaks ties by returning the lowest hour", () => {
    const events = [
      { startTime: "2026-07-15T20:00:00" },
      { startTime: "2026-07-15T22:00:00" },
    ];
    expect(getPeakEventHour(events)).toBe(20);
  });
});

describe("countReservationRequiredEvents", () => {
  it("returns 0 for empty array", () => {
    expect(countReservationRequiredEvents([])).toBe(0);
  });

  it("returns 0 when all events are inclus", () => {
    const events = [{ access: "inclus" }, { access: "inclus" }];
    expect(countReservationRequiredEvents(events)).toBe(0);
  });

  it("counts réservation_séparée events", () => {
    const events = [{ access: "réservation_séparée" }, { access: "inclus" }, { access: "réservation_séparée" }];
    expect(countReservationRequiredEvents(events)).toBe(2);
  });

  it("ignores events with null or undefined access", () => {
    const events = [{ access: null }, { access: undefined }, { access: "réservation_séparée" }];
    expect(countReservationRequiredEvents(events)).toBe(1);
  });

  it("returns total when all events require reservation", () => {
    const events = [{ access: "réservation_séparée" }, { access: "réservation_séparée" }];
    expect(countReservationRequiredEvents(events)).toBe(2);
  });
});

describe("countCancelledEvents and countModifiedEvents", () => {
  it("returns 0 for empty array (cancelled)", () => {
    expect(countCancelledEvents([])).toBe(0);
  });

  it("counts annulé events", () => {
    const events = [{ status: "annulé" }, { status: "confirmé" }, { status: "annulé" }];
    expect(countCancelledEvents(events)).toBe(2);
  });

  it("returns 0 for empty array (modified)", () => {
    expect(countModifiedEvents([])).toBe(0);
  });

  it("counts modifié events", () => {
    const events = [{ status: "modifié" }, { status: "confirmé" }, { status: "modifié" }];
    expect(countModifiedEvents(events)).toBe(2);
  });

  it("does not mix up cancelled and modified", () => {
    const events = [{ status: "annulé" }, { status: "modifié" }, { status: "confirmé" }];
    expect(countCancelledEvents(events)).toBe(1);
    expect(countModifiedEvents(events)).toBe(1);
  });
});

describe("getTopProgrammeTag", () => {
  it("returns null for empty array", () => {
    expect(getTopProgrammeTag([])).toBeNull();
  });

  it("returns null when no events have tags", () => {
    const events = [{ tags: null }, { tags: [] }, { tags: undefined }];
    expect(getTopProgrammeTag(events)).toBeNull();
  });

  it("returns the only tag present", () => {
    const events = [{ tags: ["Techno"] }];
    expect(getTopProgrammeTag(events)).toEqual({ tag: "Techno", count: 1 });
  });

  it("returns the most frequent tag", () => {
    const events = [
      { tags: ["Techno", "Electronic"] },
      { tags: ["Techno"] },
      { tags: ["Jazz"] },
    ];
    expect(getTopProgrammeTag(events)).toEqual({ tag: "Techno", count: 2 });
  });

  it("breaks ties alphabetically", () => {
    const events = [
      { tags: ["Techno"] },
      { tags: ["Jazz"] },
    ];
    expect(getTopProgrammeTag(events)).toEqual({ tag: "Jazz", count: 1 });
  });

  it("ignores empty string tags", () => {
    const events = [{ tags: ["", "Rock"] }, { tags: ["Rock"] }];
    expect(getTopProgrammeTag(events)).toEqual({ tag: "Rock", count: 2 });
  });

  it("counts tags across all events correctly", () => {
    const events = [
      { tags: ["A", "B"] },
      { tags: ["B", "C"] },
      { tags: ["B"] },
    ];
    expect(getTopProgrammeTag(events)).toEqual({ tag: "B", count: 3 });
  });
});
