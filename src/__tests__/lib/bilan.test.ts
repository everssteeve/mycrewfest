import { describe, it, expect } from "vitest";
import { computeBilan, formatBilanDuration, formatAvgHour, formatBestDay, computeMissedMustSeeDurationMins, type BilantableEvent } from "@/lib/bilan";

function ev(
  status: string | null,
  opts: { durationMins?: number; venueName?: string; title?: string; tags?: string[]; startTime?: string } = {},
): BilantableEvent {
  return {
    title: opts.title ?? "Event",
    durationMins: opts.durationMins ?? null,
    selection: status ? { status } : null,
    venue: opts.venueName ? { name: opts.venueName } : null,
    tags: opts.tags ?? null,
    startTime: opts.startTime ?? null,
  };
}

describe("computeBilan", () => {
  it("returns zeros for an empty event list", () => {
    const stats = computeBilan([]);
    expect(stats.totalSeen).toBe(0);
    expect(stats.totalDurationMins).toBe(0);
    expect(stats.mustSeePending).toBe(0);
    expect(stats.intéresséPending).toBe(0);
    expect(stats.topVenue).toBeNull();
    expect(stats.uniqueVenues).toBe(0);
  });

  it("counts only 'vu' events as seen", () => {
    const events = [
      ev("vu"),
      ev("vu"),
      ev("must-see"),
      ev("intéressé"),
      ev(null),
    ];
    expect(computeBilan(events).totalSeen).toBe(2);
  });

  it("counts must-see pending correctly", () => {
    const events = [ev("must-see"), ev("must-see"), ev("vu")];
    expect(computeBilan(events).mustSeePending).toBe(2);
  });

  it("counts intéressé pending correctly", () => {
    const events = [ev("intéressé"), ev("intéressé"), ev("intéressé"), ev("vu")];
    expect(computeBilan(events).intéresséPending).toBe(3);
  });

  it("sums durationMins only for vu events", () => {
    const events = [
      ev("vu", { durationMins: 60 }),
      ev("vu", { durationMins: 45 }),
      ev("must-see", { durationMins: 90 }),
    ];
    expect(computeBilan(events).totalDurationMins).toBe(105);
  });

  it("handles missing durationMins (counts as 0)", () => {
    const events = [ev("vu"), ev("vu", { durationMins: 30 })];
    expect(computeBilan(events).totalDurationMins).toBe(30);
  });

  it("returns the venue with the most vu events as topVenue", () => {
    const events = [
      ev("vu", { venueName: "Grande Scène" }),
      ev("vu", { venueName: "Grande Scène" }),
      ev("vu", { venueName: "Petite Scène" }),
      ev("must-see", { venueName: "Chapelle" }),
    ];
    const stats = computeBilan(events);
    expect(stats.topVenue).toBe("Grande Scène");
    expect(stats.uniqueVenues).toBe(2);
  });

  it("returns null topVenue when no seen events have a venue", () => {
    const events = [ev("vu"), ev("vu")];
    expect(computeBilan(events).topVenue).toBeNull();
    expect(computeBilan(events).uniqueVenues).toBe(0);
  });

  it("does not count venue from non-vu events", () => {
    const events = [
      ev("must-see", { venueName: "Scène A" }),
      ev("intéressé", { venueName: "Scène B" }),
      ev("vu", { venueName: "Scène C" }),
    ];
    const stats = computeBilan(events);
    expect(stats.topVenue).toBe("Scène C");
    expect(stats.uniqueVenues).toBe(1);
  });

  it("returns null topTag when no seen events have tags", () => {
    const events = [ev("vu"), ev("vu")];
    expect(computeBilan(events).topTag).toBeNull();
  });

  it("returns the most common tag among vu events as topTag", () => {
    const events = [
      ev("vu", { tags: ["Électro", "Techno"] }),
      ev("vu", { tags: ["Électro"] }),
      ev("vu", { tags: ["Jazz"] }),
      ev("must-see", { tags: ["Jazz", "Électro"] }),
    ];
    expect(computeBilan(events).topTag).toBe("Électro");
  });

  it("does not count tags from non-vu events", () => {
    const events = [
      ev("must-see", { tags: ["Jazz", "Jazz", "Jazz"] }),
      ev("vu", { tags: ["Électro"] }),
    ];
    expect(computeBilan(events).topTag).toBe("Électro");
  });

  it("handles events with null or empty tags gracefully", () => {
    const events = [
      ev("vu", { tags: [] }),
      ev("vu", { tags: null as unknown as string[] }),
      ev("vu", { tags: ["Rock"] }),
    ];
    expect(computeBilan(events).topTag).toBe("Rock");
  });
});

describe("formatBilanDuration", () => {
  it("returns 0min for zero or negative", () => {
    expect(formatBilanDuration(0)).toBe("0min");
    expect(formatBilanDuration(-10)).toBe("0min");
  });

  it("formats minutes only", () => {
    expect(formatBilanDuration(30)).toBe("30min");
    expect(formatBilanDuration(45)).toBe("45min");
  });

  it("formats whole hours", () => {
    expect(formatBilanDuration(60)).toBe("1h");
    expect(formatBilanDuration(120)).toBe("2h");
  });

  it("formats hours and minutes", () => {
    expect(formatBilanDuration(90)).toBe("1h30");
    expect(formatBilanDuration(75)).toBe("1h15");
    expect(formatBilanDuration(150)).toBe("2h30");
  });
});

describe("computeBilan — avgStartHour", () => {
  it("returns null when no seen events have startTime", () => {
    const events = [ev("vu"), ev("vu")];
    expect(computeBilan(events).avgStartHour).toBeNull();
  });

  it("returns average hour in minutes for events at a fixed time", () => {
    const events = [
      ev("vu", { startTime: "2025-07-15T21:00:00Z" }),
      ev("vu", { startTime: "2025-07-15T21:00:00Z" }),
    ];
    const stats = computeBilan(events);
    expect(stats.avgStartHour).not.toBeNull();
  });

  it("ignores non-vu events when computing average", () => {
    const events = [
      ev("vu", { startTime: "2025-07-15T21:00:00Z" }),
      ev("must-see", { startTime: "2025-07-15T10:00:00Z" }),
    ];
    const statsAll = computeBilan(events);
    const statsVuOnly = computeBilan([ev("vu", { startTime: "2025-07-15T21:00:00Z" })]);
    expect(statsAll.avgStartHour).toBe(statsVuOnly.avgStartHour);
  });

  it("ignores vu events without startTime in average", () => {
    const events = [
      ev("vu", { startTime: "2025-07-15T20:00:00Z" }),
      ev("vu"),
    ];
    const stats = computeBilan(events);
    const singleStats = computeBilan([ev("vu", { startTime: "2025-07-15T20:00:00Z" })]);
    expect(stats.avgStartHour).toBe(singleStats.avgStartHour);
  });
});

describe("computeBilan — bestDay", () => {
  it("returns null when no seen events have startTime", () => {
    const events = [ev("vu"), ev("vu")];
    expect(computeBilan(events).bestDay).toBeNull();
  });

  it("returns null for empty event list", () => {
    expect(computeBilan([]).bestDay).toBeNull();
  });

  it("returns the single day when all events are on the same day", () => {
    const events = [
      ev("vu", { startTime: "2025-07-19T10:00:00Z" }),
      ev("vu", { startTime: "2025-07-19T14:00:00Z" }),
      ev("vu", { startTime: "2025-07-19T20:00:00Z" }),
    ];
    const stats = computeBilan(events);
    expect(stats.bestDay).not.toBeNull();
    expect(stats.bestDay!.count).toBe(3);
  });

  it("returns the day with the most vu events", () => {
    const events = [
      ev("vu", { startTime: "2025-07-18T10:00:00Z" }),
      ev("vu", { startTime: "2025-07-19T10:00:00Z" }),
      ev("vu", { startTime: "2025-07-19T14:00:00Z" }),
      ev("vu", { startTime: "2025-07-19T20:00:00Z" }),
      ev("vu", { startTime: "2025-07-20T10:00:00Z" }),
    ];
    const stats = computeBilan(events);
    expect(stats.bestDay).not.toBeNull();
    expect(stats.bestDay!.count).toBe(3);
  });

  it("ignores non-vu events when computing best day", () => {
    const events = [
      ev("must-see", { startTime: "2025-07-18T10:00:00Z" }),
      ev("must-see", { startTime: "2025-07-18T14:00:00Z" }),
      ev("vu", { startTime: "2025-07-19T10:00:00Z" }),
    ];
    const stats = computeBilan(events);
    expect(stats.bestDay).not.toBeNull();
    expect(stats.bestDay!.count).toBe(1);
  });

  it("ignores vu events without startTime", () => {
    const events = [
      ev("vu"),
      ev("vu"),
      ev("vu", { startTime: "2025-07-19T10:00:00Z" }),
    ];
    const stats = computeBilan(events);
    expect(stats.bestDay).not.toBeNull();
    expect(stats.bestDay!.count).toBe(1);
  });
});

describe("formatBestDay", () => {
  it("returns a non-empty French date string", () => {
    const result = formatBestDay("2025-07-19");
    expect(result.length).toBeGreaterThan(5);
    expect(typeof result).toBe("string");
  });

  it("includes the day number in the output", () => {
    const result = formatBestDay("2025-07-19");
    expect(result).toContain("19");
  });
});

describe("formatAvgHour", () => {
  it("formats whole hours (0 minutes)", () => {
    expect(formatAvgHour(21 * 60)).toBe("21h");
    expect(formatAvgHour(20 * 60)).toBe("20h");
  });

  it("formats hours with minutes", () => {
    expect(formatAvgHour(21 * 60 + 30)).toBe("21h30");
    expect(formatAvgHour(14 * 60 + 5)).toBe("14h05");
  });
});

// ---------------------------------------------------------------------------
// topEventType / uniqueEventTypes
// ---------------------------------------------------------------------------

function evWithType(
  status: string | null,
  eventType: string | null,
): BilantableEvent {
  return {
    title: "Event",
    durationMins: null,
    selection: status ? { status } : null,
    venue: null,
    tags: null,
    startTime: null,
    eventType,
  };
}

describe("computeBilan — topEventType / uniqueEventTypes", () => {
  it("returns null topEventType and 0 uniqueEventTypes for no seen events", () => {
    const stats = computeBilan([evWithType("must-see", "concert")]);
    expect(stats.topEventType).toBeNull();
    expect(stats.uniqueEventTypes).toBe(0);
  });

  it("returns null topEventType when seen events have no eventType", () => {
    const stats = computeBilan([evWithType("vu", null)]);
    expect(stats.topEventType).toBeNull();
    expect(stats.uniqueEventTypes).toBe(0);
  });

  it("returns the only event type when all seen events share one type", () => {
    const events = [
      evWithType("vu", "concert"),
      evWithType("vu", "concert"),
    ];
    const stats = computeBilan(events);
    expect(stats.topEventType).toBe("concert");
    expect(stats.uniqueEventTypes).toBe(1);
  });

  it("returns the most frequent event type", () => {
    const events = [
      evWithType("vu", "concert"),
      evWithType("vu", "concert"),
      evWithType("vu", "théâtre"),
    ];
    const stats = computeBilan(events);
    expect(stats.topEventType).toBe("concert");
    expect(stats.uniqueEventTypes).toBe(2);
  });

  it("ignores non-seen events when computing topEventType", () => {
    const events = [
      evWithType("vu", "cirque"),
      evWithType("must-see", "concert"),
      evWithType("must-see", "concert"),
    ];
    const stats = computeBilan(events);
    expect(stats.topEventType).toBe("cirque");
    expect(stats.uniqueEventTypes).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// attendanceStreak
// ---------------------------------------------------------------------------

function evOnDay(dateStr: string): BilantableEvent {
  return {
    title: "Event",
    durationMins: 60,
    selection: { status: "vu" },
    venue: null,
    tags: null,
    startTime: `${dateStr}T20:00:00`,
    eventType: null,
  };
}

describe("computeBilan — attendanceStreak", () => {
  it("returns 0 when no seen events", () => {
    expect(computeBilan([]).attendanceStreak).toBe(0);
  });

  it("returns 1 for a single day", () => {
    expect(computeBilan([evOnDay("2025-07-19")]).attendanceStreak).toBe(1);
  });

  it("returns 2 for two consecutive days", () => {
    const events = [evOnDay("2025-07-19"), evOnDay("2025-07-20")];
    expect(computeBilan(events).attendanceStreak).toBe(2);
  });

  it("returns 1 when days are not consecutive (gap)", () => {
    const events = [evOnDay("2025-07-19"), evOnDay("2025-07-21")];
    expect(computeBilan(events).attendanceStreak).toBe(1);
  });

  it("returns the longest streak when broken in the middle", () => {
    const events = [
      evOnDay("2025-07-17"),
      evOnDay("2025-07-18"),
      evOnDay("2025-07-19"),
      evOnDay("2025-07-21"), // gap
      evOnDay("2025-07-22"),
    ];
    expect(computeBilan(events).attendanceStreak).toBe(3);
  });

  it("handles multiple events on the same day as a single day", () => {
    const events = [
      evOnDay("2025-07-19"),
      evOnDay("2025-07-19"),
      evOnDay("2025-07-20"),
    ];
    expect(computeBilan(events).attendanceStreak).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// computeAvgDurationMins (standalone)
// ---------------------------------------------------------------------------

import { computeAvgDurationMins } from "@/lib/bilan";

describe("computeAvgDurationMins", () => {
  it("returns null for empty array", () => {
    expect(computeAvgDurationMins([])).toBeNull();
  });

  it("returns null when no seen events have duration", () => {
    expect(computeAvgDurationMins([{ selection: { status: "vu" }, durationMins: null }])).toBeNull();
  });

  it("returns null for non-seen events even if they have duration", () => {
    expect(computeAvgDurationMins([{ selection: { status: "must-see" }, durationMins: 60 }])).toBeNull();
  });

  it("returns the duration when a single seen event has it", () => {
    expect(computeAvgDurationMins([{ selection: { status: "vu" }, durationMins: 60 }])).toBe(60);
  });

  it("returns the average of seen events with duration", () => {
    const events = [
      { selection: { status: "vu" }, durationMins: 60 },
      { selection: { status: "vu" }, durationMins: 90 },
    ];
    expect(computeAvgDurationMins(events)).toBe(75);
  });

  it("ignores seen events without duration in the average", () => {
    const events = [
      { selection: { status: "vu" }, durationMins: 60 },
      { selection: { status: "vu" }, durationMins: null },
    ];
    expect(computeAvgDurationMins(events)).toBe(60);
  });

  it("rounds to nearest integer", () => {
    const events = [
      { selection: { status: "vu" }, durationMins: 60 },
      { selection: { status: "vu" }, durationMins: 61 },
    ];
    expect(computeAvgDurationMins(events)).toBe(61);
  });
});

describe("computeBilan — uniqueTagCount", () => {
  it("returns 0 when no seen events have tags", () => {
    const events = [ev("vu", {}), ev("vu", {})];
    expect(computeBilan(events).uniqueTagCount).toBe(0);
  });

  it("counts a single unique tag", () => {
    const events = [ev("vu", { tags: ["Rock"] }), ev("vu", { tags: ["Rock"] })];
    expect(computeBilan(events).uniqueTagCount).toBe(1);
  });

  it("counts multiple distinct tags across events", () => {
    const events = [
      ev("vu", { tags: ["Rock", "Live"] }),
      ev("vu", { tags: ["Électro"] }),
    ];
    expect(computeBilan(events).uniqueTagCount).toBe(3);
  });

  it("does not count tags from non-vu events", () => {
    const events = [
      ev("vu", { tags: ["Rock"] }),
      ev("must-see", { tags: ["Jazz", "Funk"] }),
    ];
    expect(computeBilan(events).uniqueTagCount).toBe(1);
  });

  it("returns 0 when all seen events have null tags", () => {
    expect(computeBilan([ev("vu", { tags: undefined })]).uniqueTagCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeMissedMustSeeDurationMins
// ---------------------------------------------------------------------------

describe("computeMissedMustSeeDurationMins", () => {
  it("returns 0 for empty list", () => {
    expect(computeMissedMustSeeDurationMins([])).toBe(0);
  });

  it("returns 0 when no events are must-see", () => {
    const events = [ev("vu", { durationMins: 60 }), ev("intéressé", { durationMins: 30 })];
    expect(computeMissedMustSeeDurationMins(events)).toBe(0);
  });

  it("sums duration of must-see events", () => {
    const events = [
      ev("must-see", { durationMins: 45 }),
      ev("must-see", { durationMins: 90 }),
      ev("vu", { durationMins: 60 }),
    ];
    expect(computeMissedMustSeeDurationMins(events)).toBe(135);
  });

  it("treats null durationMins as 0", () => {
    const events = [
      ev("must-see", { durationMins: undefined }),
      ev("must-see", { durationMins: 30 }),
    ];
    expect(computeMissedMustSeeDurationMins(events)).toBe(30);
  });

  it("returns 0 when all must-see events have no duration", () => {
    expect(computeMissedMustSeeDurationMins([ev("must-see")])).toBe(0);
  });

  it("ignores intéressé and vu events", () => {
    const events = [
      ev("must-see", { durationMins: 60 }),
      ev("intéressé", { durationMins: 120 }),
      ev("vu", { durationMins: 30 }),
    ];
    expect(computeMissedMustSeeDurationMins(events)).toBe(60);
  });
});
