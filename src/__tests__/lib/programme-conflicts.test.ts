import { describe, it, expect } from "vitest";
import { findConflictingEventIds } from "@/lib/programme-conflicts";

type E = {
  id: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMins?: number | null;
  selection?: { status: string } | null;
};

function ev(
  id: string,
  startHour: number,
  endHour: number,
  status: "must-see" | "intéressé" | "vu" | null = "must-see",
): E {
  const base = "2026-07-15T";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    id,
    startTime: `${base}${pad(startHour)}:00:00`,
    endTime: `${base}${pad(endHour)}:00:00`,
    durationMins: null,
    selection: status ? { status } : null,
  };
}

describe("findConflictingEventIds — no events / no selection", () => {
  it("returns empty set for empty input", () => {
    expect(findConflictingEventIds([])).toEqual(new Set());
  });

  it("returns empty set when no events are selected", () => {
    const events = [ev("e1", 14, 16, null), ev("e2", 15, 17, null)];
    expect(findConflictingEventIds(events)).toEqual(new Set());
  });

  it("returns empty set for single selected event", () => {
    expect(findConflictingEventIds([ev("e1", 14, 16, "must-see")])).toEqual(new Set());
  });
});

describe("findConflictingEventIds — non-overlapping events", () => {
  it("returns empty set for sequential events", () => {
    const events = [ev("e1", 14, 16, "must-see"), ev("e2", 16, 18, "must-see")];
    expect(findConflictingEventIds(events)).toEqual(new Set());
  });

  it("returns empty set for events with 1-hour gap", () => {
    const events = [ev("e1", 14, 15, "must-see"), ev("e2", 16, 18, "must-see")];
    expect(findConflictingEventIds(events)).toEqual(new Set());
  });
});

describe("findConflictingEventIds — overlapping events", () => {
  it("returns both IDs when two must-see events overlap", () => {
    const events = [ev("e1", 14, 16, "must-see"), ev("e2", 15, 17, "must-see")];
    const result = findConflictingEventIds(events);
    expect(result.has("e1")).toBe(true);
    expect(result.has("e2")).toBe(true);
  });

  it("returns both IDs for intéressé events that overlap", () => {
    const events = [ev("e1", 20, 22, "intéressé"), ev("e2", 21, 23, "intéressé")];
    const result = findConflictingEventIds(events);
    expect(result.size).toBe(2);
  });

  it("detects overlap between must-see and intéressé", () => {
    const events = [ev("e1", 14, 16, "must-see"), ev("e2", 15, 17, "intéressé")];
    const result = findConflictingEventIds(events);
    expect(result.size).toBe(2);
  });

  it("does not flag vu events as conflicting", () => {
    const events = [ev("e1", 14, 16, "must-see"), ev("e2", 15, 17, "vu")];
    const result = findConflictingEventIds(events);
    expect(result.size).toBe(0);
  });

  it("handles 3-way overlap correctly", () => {
    const events = [
      ev("e1", 14, 17, "must-see"),
      ev("e2", 15, 18, "must-see"),
      ev("e3", 16, 19, "must-see"),
    ];
    const result = findConflictingEventIds(events);
    expect(result.size).toBe(3);
  });

  it("only flags overlapping events, not non-overlapping ones", () => {
    const events = [
      ev("e1", 14, 16, "must-see"), // overlaps e2
      ev("e2", 15, 17, "must-see"), // overlaps e1
      ev("e3", 20, 22, "must-see"), // no overlap
    ];
    const result = findConflictingEventIds(events);
    expect(result.has("e1")).toBe(true);
    expect(result.has("e2")).toBe(true);
    expect(result.has("e3")).toBe(false);
  });
});

describe("findConflictingEventIds — events without startTime", () => {
  it("ignores events without startTime", () => {
    const events = [
      { id: "e1", startTime: null, selection: { status: "must-see" } },
      ev("e2", 14, 16, "must-see"),
    ];
    const result = findConflictingEventIds(events);
    expect(result.size).toBe(0);
  });
});

describe("findConflictingEventIds — durationMins fallback", () => {
  it("uses durationMins when endTime is absent", () => {
    const events = [
      {
        id: "e1",
        startTime: "2026-07-15T14:00:00",
        endTime: null,
        durationMins: 120,
        selection: { status: "must-see" },
      },
      {
        id: "e2",
        startTime: "2026-07-15T15:00:00",
        endTime: null,
        durationMins: 60,
        selection: { status: "must-see" },
      },
    ];
    const result = findConflictingEventIds(events);
    // e1 ends at 16h, e2 starts at 15h → overlap
    expect(result.size).toBe(2);
  });
});
