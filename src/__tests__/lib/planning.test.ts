/**
 * Tests for lib/planning.ts
 *
 * Covers detectConflicts, filterEventsByDay, sortEventsByTime.
 */

import { describe, it, expect } from "vitest";
import {
  detectConflicts,
  filterEventsByDay,
  sortEventsByTime,
  computeDayFreeTime,
  type FreeTimeEvent,
} from "@/lib/planning";
import type { EventSummary } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(
  id: string,
  startTime: string | undefined,
  durationMins: number,
  opts: Partial<EventSummary> = {},
): EventSummary {
  const endTime =
    startTime && durationMins
      ? new Date(
          new Date(startTime).getTime() + durationMins * 60_000,
        ).toISOString()
      : undefined;
  return {
    id,
    title: `Event ${id}`,
    eventType: "concert",
    access: "inclus",
    status: "confirmé",
    confidence: "auto",
    startTime,
    endTime,
    durationMins,
    ...opts,
  };
}

// ---------------------------------------------------------------------------
// detectConflicts
// ---------------------------------------------------------------------------

describe("detectConflicts", () => {
  it("detects direct temporal overlap between two events", () => {
    const a = makeEvent("a", "2026-07-01T14:00:00Z", 60);
    const b = makeEvent("b", "2026-07-01T14:30:00Z", 60);

    const conflicts = detectConflicts([a, b], 15);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].level).toBe("overlap");
    expect(conflicts[0].overlapMins).toBe(30);
  });

  it("detects tight conflict when gap < travelTime + comfortMargin", () => {
    // a ends at 15:00, b starts at 15:10 — gap = 10 min
    // travel = 8 min, margin = 5 min → 8+5=13 > 10 → tight
    const a = makeEvent("a", "2026-07-01T14:00:00Z", 60); // ends 15:00
    const b = makeEvent("b", "2026-07-01T15:10:00Z", 60); // starts 15:10

    // venueKey sorts venue ids alphabetically: "v1--v2"
    const travelTimes = new Map([["v1--v2", 8]]);
    // Need different venue ids so travel is looked up
    const aWithVenue = { ...a, venue: { id: "v1", name: "Scène A", type: "scène" } };
    const bWithVenue = { ...b, venue: { id: "v2", name: "Scène B", type: "scène" } };

    const conflicts = detectConflicts([aWithVenue, bWithVenue], 5, travelTimes);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].level).toBe("tight");
  });

  it("detects borderline conflict when gap < 2x comfort margin", () => {
    // a ends at 15:00, b starts at 15:18 — gap = 18 min
    // no travel (same venue), margin = 10 min → 2×10=20 > 18 → borderline
    const a = makeEvent("a", "2026-07-01T14:00:00Z", 60); // ends 15:00
    const b = makeEvent("b", "2026-07-01T15:18:00Z", 60); // starts 15:18
    // gap = 18 min, 2×margin = 20 min → borderline (no travel)

    const conflicts = detectConflicts([a, b], 10);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].level).toBe("borderline");
  });

  it("returns no conflict when gap is comfortable", () => {
    // a ends 15:00, b starts 16:00 — gap = 60 min, margin = 15 → no conflict
    const a = makeEvent("a", "2026-07-01T14:00:00Z", 60);
    const b = makeEvent("b", "2026-07-01T16:00:00Z", 60);

    const conflicts = detectConflicts([a, b], 15);

    expect(conflicts).toHaveLength(0);
  });

  it("ignores events without a startTime", () => {
    const a = makeEvent("a", "2026-07-01T14:00:00Z", 60);
    const noTime = makeEvent("no-time", undefined, 60);

    const conflicts = detectConflicts([a, noTime], 15);

    expect(conflicts).toHaveLength(0);
  });

  it("ignores cancelled events", () => {
    const a = makeEvent("a", "2026-07-01T14:00:00Z", 60);
    const cancelled = makeEvent("b", "2026-07-01T14:30:00Z", 60, {
      status: "annulé",
    });

    const conflicts = detectConflicts([a, cancelled], 15);

    expect(conflicts).toHaveLength(0);
  });

  it("returns no conflict for a single event", () => {
    const a = makeEvent("a", "2026-07-01T14:00:00Z", 60);
    expect(detectConflicts([a], 15)).toHaveLength(0);
  });

  it("returns no conflict for an empty list", () => {
    expect(detectConflicts([], 15)).toHaveLength(0);
  });

  it("detects multiple conflicts among multiple events", () => {
    const a = makeEvent("a", "2026-07-01T14:00:00Z", 90); // ends 15:30
    const b = makeEvent("b", "2026-07-01T14:45:00Z", 60); // starts 14:45 (overlap with a)
    const c = makeEvent("c", "2026-07-01T15:20:00Z", 60); // starts 15:20 (overlap with a)

    const conflicts = detectConflicts([a, b, c], 15);

    expect(conflicts.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// filterEventsByDay
// ---------------------------------------------------------------------------

describe("filterEventsByDay", () => {
  it("returns events on the requested day", () => {
    const events = [
      makeEvent("a", "2026-07-01T10:00:00", 60),
      makeEvent("b", "2026-07-02T10:00:00", 60),
      makeEvent("c", "2026-07-01T20:00:00", 60),
    ];

    const result = filterEventsByDay(events, "2026-07-01");

    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(expect.arrayContaining(["a", "c"]));
  });

  it("excludes events without a startTime", () => {
    const events = [
      makeEvent("a", "2026-07-01T10:00:00", 60),
      makeEvent("no-time", undefined, 60),
    ];

    const result = filterEventsByDay(events, "2026-07-01");

    expect(result.map((e) => e.id)).not.toContain("no-time");
  });

  it("returns empty array when no events match the day", () => {
    const events = [makeEvent("a", "2026-07-01T10:00:00", 60)];

    const result = filterEventsByDay(events, "2026-07-03");

    expect(result).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    expect(filterEventsByDay([], "2026-07-01")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// sortEventsByTime
// ---------------------------------------------------------------------------

describe("sortEventsByTime", () => {
  it("sorts events by startTime ascending", () => {
    const a = makeEvent("a", "2026-07-01T16:00:00Z", 60);
    const b = makeEvent("b", "2026-07-01T10:00:00Z", 60);
    const c = makeEvent("c", "2026-07-01T13:00:00Z", 60);

    const sorted = sortEventsByTime([a, b, c]);

    expect(sorted.map((e) => e.id)).toEqual(["b", "c", "a"]);
  });

  it("places events without startTime at the end, sorted by title", () => {
    const a = makeEvent("a", "2026-07-01T10:00:00Z", 60);
    const z = makeEvent("z", undefined, 60, { title: "Zebra" });
    const m = makeEvent("m", undefined, 60, { title: "Mango" });

    const sorted = sortEventsByTime([z, a, m]);

    expect(sorted[0].id).toBe("a");
    expect(sorted[1].title).toBe("Mango");
    expect(sorted[2].title).toBe("Zebra");
  });

  it("does not mutate the original array", () => {
    const events = [
      makeEvent("a", "2026-07-01T16:00:00Z", 60),
      makeEvent("b", "2026-07-01T10:00:00Z", 60),
    ];
    const original = [...events];
    sortEventsByTime(events);
    expect(events).toEqual(original);
  });

  it("handles empty input", () => {
    expect(sortEventsByTime([])).toEqual([]);
  });
});

describe("computeDayFreeTime", () => {
  const ev = (startTime: string | null, endTime?: string | null, durationMins?: number | null): FreeTimeEvent =>
    ({ startTime, endTime: endTime ?? null, durationMins: durationMins ?? null });

  it("returns 0 for empty array", () => {
    expect(computeDayFreeTime([])).toBe(0);
  });

  it("returns 0 for a single event", () => {
    expect(computeDayFreeTime([ev("2025-07-19T14:00:00Z", "2025-07-19T15:00:00Z")])).toBe(0);
  });

  it("computes gap between two events (using endTime)", () => {
    const events = [
      ev("2025-07-19T14:00:00Z", "2025-07-19T15:00:00Z"),
      ev("2025-07-19T16:00:00Z", "2025-07-19T17:00:00Z"),
    ];
    expect(computeDayFreeTime(events)).toBe(60);
  });

  it("computes gap using durationMins when endTime is absent", () => {
    const events = [
      ev("2025-07-19T14:00:00Z", null, 60), // ends at 15:00
      ev("2025-07-19T16:00:00Z"),             // starts at 16:00
    ];
    expect(computeDayFreeTime(events)).toBe(60);
  });

  it("counts 0 for overlapping events (no negative gaps)", () => {
    const events = [
      ev("2025-07-19T14:00:00Z", "2025-07-19T16:00:00Z"),
      ev("2025-07-19T15:00:00Z", "2025-07-19T17:00:00Z"),
    ];
    expect(computeDayFreeTime(events)).toBe(0);
  });

  it("sums gaps across multiple events", () => {
    const events = [
      ev("2025-07-19T12:00:00Z", "2025-07-19T13:00:00Z"),
      ev("2025-07-19T14:00:00Z", "2025-07-19T15:00:00Z"),
      ev("2025-07-19T17:00:00Z", "2025-07-19T18:00:00Z"),
    ];
    // Gap 1: 13h→14h = 60min, Gap 2: 15h→17h = 120min
    expect(computeDayFreeTime(events)).toBe(180);
  });

  it("ignores events without startTime", () => {
    const events = [
      ev(null, null, 60),
      ev("2025-07-19T14:00:00Z", "2025-07-19T15:00:00Z"),
      ev("2025-07-19T16:00:00Z", "2025-07-19T17:00:00Z"),
    ];
    expect(computeDayFreeTime(events)).toBe(60);
  });

  it("sorts events by startTime before computing gaps", () => {
    const events = [
      ev("2025-07-19T16:00:00Z", "2025-07-19T17:00:00Z"),
      ev("2025-07-19T14:00:00Z", "2025-07-19T15:00:00Z"),
    ];
    expect(computeDayFreeTime(events)).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// computeDayCoverage
// ---------------------------------------------------------------------------

import { computeDayCoverage } from "@/lib/planning";

const cov = (startTime: string | null, endTime?: string | null, durationMins?: number | null) =>
  ({ startTime, endTime: endTime ?? null, durationMins: durationMins ?? null });

describe("computeDayCoverage", () => {
  it("returns zeros for an empty array", () => {
    const r = computeDayCoverage([]);
    expect(r.coveredMins).toBe(0);
    expect(r.spanMins).toBe(0);
    expect(r.percent).toBe(0);
  });

  it("returns zeros when no events have startTime", () => {
    const r = computeDayCoverage([cov(null, null, 60)]);
    expect(r.percent).toBe(0);
  });

  it("single event covers 100% of its own span", () => {
    const r = computeDayCoverage([cov("2025-07-19T14:00:00Z", "2025-07-19T15:00:00Z")]);
    expect(r.coveredMins).toBe(60);
    expect(r.spanMins).toBe(60);
    expect(r.percent).toBe(100);
  });

  it("two back-to-back events cover 100%", () => {
    const r = computeDayCoverage([
      cov("2025-07-19T14:00:00Z", "2025-07-19T15:00:00Z"),
      cov("2025-07-19T15:00:00Z", "2025-07-19T16:00:00Z"),
    ]);
    expect(r.coveredMins).toBe(120);
    expect(r.spanMins).toBe(120);
    expect(r.percent).toBe(100);
  });

  it("two events with a gap give less than 100%", () => {
    const r = computeDayCoverage([
      cov("2025-07-19T14:00:00Z", "2025-07-19T15:00:00Z"),
      cov("2025-07-19T16:00:00Z", "2025-07-19T17:00:00Z"),
    ]);
    // span = 3h = 180min, covered = 2h = 120min
    expect(r.spanMins).toBe(180);
    expect(r.coveredMins).toBe(120);
    expect(r.percent).toBe(67);
  });

  it("overlapping events are merged, not double-counted", () => {
    const r = computeDayCoverage([
      cov("2025-07-19T14:00:00Z", "2025-07-19T16:00:00Z"),
      cov("2025-07-19T15:00:00Z", "2025-07-19T17:00:00Z"),
    ]);
    // span = 3h, covered after merge = 3h → 100%
    expect(r.coveredMins).toBe(180);
    expect(r.spanMins).toBe(180);
    expect(r.percent).toBe(100);
  });

  it("uses durationMins when endTime is absent", () => {
    const r = computeDayCoverage([
      cov("2025-07-19T14:00:00Z", null, 60),
      cov("2025-07-19T16:00:00Z", null, 60),
    ]);
    // 14h–15h, 16h–17h → span 3h, covered 2h
    expect(r.coveredMins).toBe(120);
    expect(r.spanMins).toBe(180);
  });
});
