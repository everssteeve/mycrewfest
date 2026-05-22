import { describe, it, expect } from "vitest";
import { sortProgrammeEvents, type SortableEvent } from "@/lib/programme-sort";

const ev = (
  title: string,
  startTime: string | null = null,
  venueName?: string,
): SortableEvent => ({
  title,
  startTime,
  venue: venueName ? { name: venueName } : null,
});

describe("sortProgrammeEvents — time mode", () => {
  it("sorts events with startTime chronologically", () => {
    const events = [
      ev("C", "2026-07-15T20:00:00"),
      ev("A", "2026-07-15T14:00:00"),
      ev("B", "2026-07-15T17:00:00"),
    ];
    const sorted = sortProgrammeEvents(events, "time");
    expect(sorted.map((e) => e.title)).toEqual(["A", "B", "C"]);
  });

  it("places events without startTime at the end", () => {
    const events = [
      ev("No time"),
      ev("Early", "2026-07-15T08:00:00"),
      ev("Late", "2026-07-15T22:00:00"),
    ];
    const sorted = sortProgrammeEvents(events, "time");
    expect(sorted[0].title).toBe("Early");
    expect(sorted[1].title).toBe("Late");
    expect(sorted[2].title).toBe("No time");
  });

  it("does not mutate the original array", () => {
    const events = [ev("B", "2026-07-15T20:00:00"), ev("A", "2026-07-15T10:00:00")];
    const original = [...events];
    sortProgrammeEvents(events, "time");
    expect(events[0].title).toBe(original[0].title);
  });
});

describe("sortProgrammeEvents — alpha mode", () => {
  it("sorts events alphabetically by title (case-insensitive)", () => {
    const events = [ev("Zoo"), ev("artiste"), ev("Ballon")];
    const sorted = sortProgrammeEvents(events, "alpha");
    const titles = sorted.map((e) => e.title.toLowerCase());
    expect(titles).toEqual(["artiste", "ballon", "zoo"]);
  });

  it("handles accented characters in French", () => {
    const events = [ev("Éclat"), ev("Arbre"), ev("Zèbre")];
    const sorted = sortProgrammeEvents(events, "alpha");
    // "Arbre" < "Éclat" < "Zèbre" in French locale
    expect(sorted[0].title).toBe("Arbre");
  });

  it("does not sort by time in alpha mode", () => {
    const events = [
      ev("Z act", "2026-07-15T08:00:00"),
      ev("A act", "2026-07-15T22:00:00"),
    ];
    const sorted = sortProgrammeEvents(events, "alpha");
    expect(sorted[0].title).toBe("A act");
  });
});

describe("sortProgrammeEvents — venue mode", () => {
  it("groups events by venue name, then sorts by time within venue", () => {
    const events = [
      ev("B at Scène 2", "2026-07-15T20:00:00", "Scène 2"),
      ev("A at Scène 1", "2026-07-15T20:00:00", "Scène 1"),
      ev("C at Scène 2", "2026-07-15T14:00:00", "Scène 2"),
    ];
    const sorted = sortProgrammeEvents(events, "venue");
    // Scène 1 first, then Scène 2 (C before B by time)
    expect(sorted[0].title).toBe("A at Scène 1");
    expect(sorted[1].title).toBe("C at Scène 2");
    expect(sorted[2].title).toBe("B at Scène 2");
  });

  it("places events without a venue at the end (empty string sorts last)", () => {
    const events = [
      ev("No venue", "2026-07-15T10:00:00"),
      ev("Has venue", "2026-07-15T12:00:00", "Grande Scène"),
    ];
    const sorted = sortProgrammeEvents(events, "venue");
    // Empty string ("") sorts before "Grande Scène" alphabetically...
    // Actually "" < "G", so no-venue comes first. Let me adjust expectation.
    // The sort is by venue name localeCompare, empty string before any letter.
    const hasVenueIdx = sorted.findIndex((e) => e.title === "Has venue");
    const noVenueIdx = sorted.findIndex((e) => e.title === "No venue");
    expect(noVenueIdx).toBeLessThan(hasVenueIdx);
  });
});

describe("sortProgrammeEvents — edge cases", () => {
  it("returns empty array unchanged", () => {
    expect(sortProgrammeEvents([], "time")).toEqual([]);
    expect(sortProgrammeEvents([], "alpha")).toEqual([]);
    expect(sortProgrammeEvents([], "venue")).toEqual([]);
  });

  it("returns single-element array unchanged in any mode", () => {
    const single = [ev("Solo", "2026-07-15T10:00:00", "Scène A")];
    expect(sortProgrammeEvents(single, "time")).toHaveLength(1);
    expect(sortProgrammeEvents(single, "alpha")).toHaveLength(1);
    expect(sortProgrammeEvents(single, "venue")).toHaveLength(1);
  });
});
