import { describe, expect, it } from "vitest";
import {
  buildGapAriaLabel,
  findSelectedEventGaps,
  findTightTransitionIds,
  formatGapDuration,
  type GapCheckableEvent,
  getGapSeverity,
} from "@/lib/programme-gaps";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<GapCheckableEvent> & { id: string }): GapCheckableEvent {
  return {
    startTime: null,
    endTime: null,
    durationMins: null,
    selection: null,
    ...overrides,
  };
}

const mustSee = (
  id: string,
  startTime: string,
  endTime?: string,
  durationMins?: number,
): GapCheckableEvent =>
  makeEvent({
    id,
    startTime,
    endTime: endTime ?? null,
    durationMins: durationMins ?? null,
    selection: { status: "must-see" },
  });

const interested = (
  id: string,
  startTime: string,
  endTime?: string,
  durationMins?: number,
): GapCheckableEvent =>
  makeEvent({
    id,
    startTime,
    endTime: endTime ?? null,
    durationMins: durationMins ?? null,
    selection: { status: "intéressé" },
  });

const noSelection = (id: string, startTime: string): GapCheckableEvent =>
  makeEvent({ id, startTime, selection: null });

const vu = (id: string, startTime: string): GapCheckableEvent =>
  makeEvent({ id, startTime, selection: { status: "vu" } });

// ---------------------------------------------------------------------------
// findSelectedEventGaps
// ---------------------------------------------------------------------------

describe("findSelectedEventGaps", () => {
  it("returns gap between two consecutive selected events using endTime", () => {
    const events = [
      mustSee("a", "2024-06-01T14:00:00Z", "2024-06-01T15:00:00Z"),
      mustSee("b", "2024-06-01T15:10:00Z"),
    ];
    const gaps = findSelectedEventGaps(events);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].prevId).toBe("a");
    expect(gaps[0].nextId).toBe("b");
    expect(gaps[0].gapMins).toBeCloseTo(10, 1);
  });

  it("falls back to startTime + durationMins when endTime is missing", () => {
    const events = [
      mustSee("a", "2024-06-01T14:00:00Z", undefined, 45),
      mustSee("b", "2024-06-01T15:00:00Z"),
    ];
    const gaps = findSelectedEventGaps(events);
    expect(gaps).toHaveLength(1);
    // 14:00 + 45 min = 14:45 → gap to 15:00 = 15 min
    expect(gaps[0].gapMins).toBeCloseTo(15, 1);
  });

  it("falls back to startTime + 60 min when endTime and durationMins are missing", () => {
    const events = [mustSee("a", "2024-06-01T14:00:00Z"), mustSee("b", "2024-06-01T15:30:00Z")];
    const gaps = findSelectedEventGaps(events);
    expect(gaps).toHaveLength(1);
    // 14:00 + 60 min = 15:00 → gap to 15:30 = 30 min
    expect(gaps[0].gapMins).toBeCloseTo(30, 1);
  });

  it("ignores non-selected events (vu, null)", () => {
    const events = [
      mustSee("a", "2024-06-01T14:00:00Z", "2024-06-01T14:30:00Z"),
      noSelection("x", "2024-06-01T14:30:00Z"),
      vu("y", "2024-06-01T14:35:00Z"),
      mustSee("b", "2024-06-01T15:00:00Z"),
    ];
    const gaps = findSelectedEventGaps(events);
    // Only a→b gap should be computed; x and y are ignored
    expect(gaps).toHaveLength(1);
    expect(gaps[0].prevId).toBe("a");
    expect(gaps[0].nextId).toBe("b");
  });

  it("includes 'intéressé' events as selected", () => {
    const events = [
      interested("a", "2024-06-01T10:00:00Z", "2024-06-01T10:30:00Z"),
      interested("b", "2024-06-01T10:35:00Z"),
    ];
    const gaps = findSelectedEventGaps(events);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].gapMins).toBeCloseTo(5, 1);
  });

  it("ignores events without a startTime", () => {
    const events = [
      mustSee("a", "2024-06-01T14:00:00Z", "2024-06-01T14:30:00Z"),
      makeEvent({ id: "no-time", startTime: null, selection: { status: "must-see" } }),
      mustSee("b", "2024-06-01T15:00:00Z"),
    ];
    const gaps = findSelectedEventGaps(events);
    // The event without startTime is skipped entirely
    expect(gaps).toHaveLength(1);
    expect(gaps[0].prevId).toBe("a");
    expect(gaps[0].nextId).toBe("b");
  });

  it("returns empty array when fewer than 2 selected events with startTime", () => {
    const events = [mustSee("a", "2024-06-01T14:00:00Z"), noSelection("b", "2024-06-01T15:00:00Z")];
    expect(findSelectedEventGaps(events)).toHaveLength(0);
  });

  it("sorts events chronologically regardless of input order", () => {
    const events = [
      mustSee("b", "2024-06-01T15:00:00Z"),
      mustSee("a", "2024-06-01T14:00:00Z", "2024-06-01T14:45:00Z"),
    ];
    const gaps = findSelectedEventGaps(events);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].prevId).toBe("a");
    expect(gaps[0].nextId).toBe("b");
    expect(gaps[0].gapMins).toBeCloseTo(15, 1);
  });
});

// ---------------------------------------------------------------------------
// findTightTransitionIds
// ---------------------------------------------------------------------------

describe("findTightTransitionIds", () => {
  it("returns ID of next event when gap < 15 min (default threshold)", () => {
    const events = [
      mustSee("a", "2024-06-01T14:00:00Z", "2024-06-01T14:50:00Z"),
      mustSee("b", "2024-06-01T14:58:00Z"),
    ];
    const ids = findTightTransitionIds(events);
    expect(ids.has("b")).toBe(true);
    expect(ids.has("a")).toBe(false);
  });

  it("does not return next event ID when gap >= 15 min", () => {
    const events = [
      mustSee("a", "2024-06-01T14:00:00Z", "2024-06-01T14:30:00Z"),
      mustSee("b", "2024-06-01T14:45:00Z"),
    ];
    const ids = findTightTransitionIds(events);
    expect(ids.has("b")).toBe(false);
  });

  it("respects a custom threshold", () => {
    const events = [
      mustSee("a", "2024-06-01T14:00:00Z", "2024-06-01T14:30:00Z"),
      mustSee("b", "2024-06-01T14:40:00Z"),
    ];
    // Gap = 10 min
    expect(findTightTransitionIds(events, 5).has("b")).toBe(false); // 10 >= 5
    expect(findTightTransitionIds(events, 15).has("b")).toBe(true); // 10 < 15
    expect(findTightTransitionIds(events, 10).has("b")).toBe(false); // 10 is not < 10
    expect(findTightTransitionIds(events, 11).has("b")).toBe(true); // 10 < 11
  });

  it("returns empty set when no tight transitions", () => {
    const events = [
      mustSee("a", "2024-06-01T14:00:00Z", "2024-06-01T14:30:00Z"),
      mustSee("b", "2024-06-01T15:00:00Z"),
    ];
    expect(findTightTransitionIds(events).size).toBe(0);
  });

  it("returns empty set with fewer than 2 selected events", () => {
    const events = [mustSee("a", "2024-06-01T14:00:00Z")];
    expect(findTightTransitionIds(events).size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// formatGapDuration
// ---------------------------------------------------------------------------

describe("formatGapDuration", () => {
  it("formats 5 as '5 min'", () => {
    expect(formatGapDuration(5)).toBe("5 min");
  });

  it("formats 30 as '30 min'", () => {
    expect(formatGapDuration(30)).toBe("30 min");
  });

  it("rounds fractional minutes", () => {
    expect(formatGapDuration(7.6)).toBe("8 min");
    expect(formatGapDuration(7.4)).toBe("7 min");
  });
});

// ---------------------------------------------------------------------------
// getGapSeverity
// ---------------------------------------------------------------------------

describe("getGapSeverity", () => {
  it("returns 'tight' for gap < 15 min", () => {
    expect(getGapSeverity(0)).toBe("tight");
    expect(getGapSeverity(5)).toBe("tight");
    expect(getGapSeverity(14)).toBe("tight");
    expect(getGapSeverity(14.9)).toBe("tight");
  });

  it("returns 'comfortable' for gap >= 15 min", () => {
    expect(getGapSeverity(15)).toBe("comfortable");
    expect(getGapSeverity(30)).toBe("comfortable");
    expect(getGapSeverity(60)).toBe("comfortable");
  });
});

// ---------------------------------------------------------------------------
// buildGapAriaLabel
// ---------------------------------------------------------------------------

describe("buildGapAriaLabel", () => {
  it("contains the number of minutes", () => {
    expect(buildGapAriaLabel(8)).toContain("8");
    expect(buildGapAriaLabel(12)).toContain("12");
  });

  it("contains 'attention'", () => {
    expect(buildGapAriaLabel(5)).toContain("attention");
    expect(buildGapAriaLabel(14)).toContain("attention");
  });

  it("formats correctly", () => {
    expect(buildGapAriaLabel(8)).toBe("Transition de 8 minutes — attention !");
  });
});
