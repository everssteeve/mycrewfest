import { describe, it, expect } from "vitest";
import { generateIcs, type IcsEvent } from "@/lib/ics";

const BASE_EVENT: IcsEvent = {
  uid: "event-abc-123",
  summary: "Massive Attack",
  location: "Grande Scène",
  description: "Hellfest 2026",
  startIso: "2026-06-15T20:00:00.000Z",
  endIso: "2026-06-15T21:30:00.000Z",
};

describe("generateIcs", () => {
  it("generates a valid VCALENDAR envelope", () => {
    const ics = generateIcs([BASE_EVENT], "Hellfest — MyCrewFest");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//MyCrewFest//MyCrewFest//FR");
  });

  it("includes Europe/Paris timezone block", () => {
    const ics = generateIcs([BASE_EVENT], "Test");
    expect(ics).toContain("BEGIN:VTIMEZONE");
    expect(ics).toContain("TZID:Europe/Paris");
    expect(ics).toContain("END:VTIMEZONE");
  });

  it("generates a VEVENT for each event", () => {
    const events = [
      BASE_EVENT,
      { ...BASE_EVENT, uid: "event-xyz", summary: "Radiohead" },
    ];
    const ics = generateIcs(events, "Test");
    const beginMatches = ics.match(/BEGIN:VEVENT/g);
    expect(beginMatches?.length).toBe(2);
  });

  it("includes correct SUMMARY, LOCATION, DESCRIPTION fields", () => {
    const ics = generateIcs([BASE_EVENT], "Test");
    expect(ics).toContain("SUMMARY:Massive Attack");
    expect(ics).toContain("LOCATION:Grande Scène");
    expect(ics).toContain("DESCRIPTION:Hellfest 2026");
  });

  it("includes the event UID with @mycrewfest.app suffix", () => {
    const ics = generateIcs([BASE_EVENT], "Test");
    expect(ics).toContain("UID:event-abc-123@mycrewfest.app");
  });

  it("formats DTSTART and DTEND correctly with TZID", () => {
    const ics = generateIcs([BASE_EVENT], "Test");
    expect(ics).toContain("DTSTART;TZID=Europe/Paris:");
    expect(ics).toContain("DTEND;TZID=Europe/Paris:");
  });

  it("generates a calendar even with zero events", () => {
    const ics = generateIcs([], "Empty");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("sets the calendar name in X-WR-CALNAME", () => {
    const ics = generateIcs([BASE_EVENT], "Hellfest — MyCrewFest");
    expect(ics).toContain("X-WR-CALNAME:Hellfest — MyCrewFest");
  });

  it("uses CRLF line endings (RFC 5545 compliant)", () => {
    const ics = generateIcs([BASE_EVENT], "Test");
    expect(ics).toContain("\r\n");
    const lines = ics.split("\r\n");
    expect(lines.length).toBeGreaterThan(5);
  });

  it("escapes special characters in SUMMARY", () => {
    const event: IcsEvent = {
      ...BASE_EVENT,
      summary: "Artist; with, special\\chars",
    };
    const ics = generateIcs([event], "Test");
    expect(ics).toContain("SUMMARY:Artist\\; with\\, special\\\\chars");
  });

  it("folds long lines at 75 characters", () => {
    const event: IcsEvent = {
      ...BASE_EVENT,
      summary: "A".repeat(80),
    };
    const ics = generateIcs([event], "Test");
    const lines = ics.split("\r\n");
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });

  it("omits LOCATION line when not provided", () => {
    const event: IcsEvent = {
      uid: "no-location",
      summary: "No venue",
      startIso: "2026-06-15T20:00:00.000Z",
      endIso: "2026-06-15T21:00:00.000Z",
    };
    const ics = generateIcs([event], "Test");
    const lines = ics.split("\r\n");
    const locationLines = lines.filter((l) => l.startsWith("LOCATION:"));
    expect(locationLines.length).toBe(0);
  });
});
