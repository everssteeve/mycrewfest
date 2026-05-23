import { describe, expect, it } from "vitest";
import {
  computeDayScores,
  type DayScorableEvent,
  formatDayDuration,
  getDayLoadColor,
  getDayLoadLevel,
  getMostLoadedDay,
} from "@/lib/programme-day-score";

type E = DayScorableEvent;

function ev(
  startTime: string,
  status: "must-see" | "intéressé" | "vu" | null = "must-see",
  durationMins = 60,
): E {
  return {
    startTime,
    durationMins,
    selection: status ? { status } : null,
  };
}

const DAYS = ["2026-07-15", "2026-07-16"];

describe("computeDayScores", () => {
  it("counts must-see and interested correctly", () => {
    const events = [
      ev("2026-07-15T10:00:00Z", "must-see"),
      ev("2026-07-15T14:00:00Z", "must-see"),
      ev("2026-07-15T18:00:00Z", "intéressé"),
      ev("2026-07-16T10:00:00Z", "must-see"),
    ];
    const scores = computeDayScores(events, DAYS);
    const day1 = scores.find((s) => s.day === "2026-07-15")!;
    expect(day1.mustSee).toBe(2);
    expect(day1.interested).toBe(1);
    expect(day1.total).toBe(3);
    const day2 = scores.find((s) => s.day === "2026-07-16")!;
    expect(day2.mustSee).toBe(1);
    expect(day2.total).toBe(1);
  });

  it("ignores 'vu' and null-status events for counts", () => {
    const events = [ev("2026-07-15T10:00:00Z", "vu"), ev("2026-07-15T12:00:00Z", null)];
    const scores = computeDayScores(events, DAYS);
    const day1 = scores.find((s) => s.day === "2026-07-15")!;
    expect(day1.total).toBe(0);
  });

  it("ignores events without startTime", () => {
    const events: E[] = [{ startTime: null, selection: { status: "must-see" } }];
    const scores = computeDayScores(events, DAYS);
    expect(scores.every((s) => s.total === 0)).toBe(true);
  });

  it("computes durationMins for selected events", () => {
    const events = [
      { startTime: "2026-07-15T10:00:00Z", durationMins: 90, selection: { status: "must-see" } },
      { startTime: "2026-07-15T14:00:00Z", durationMins: 60, selection: { status: "intéressé" } },
    ];
    const scores = computeDayScores(events, DAYS);
    const day1 = scores.find((s) => s.day === "2026-07-15")!;
    expect(day1.durationMins).toBe(150);
  });

  it("returns a score for each provided day", () => {
    const scores = computeDayScores([], DAYS);
    expect(scores).toHaveLength(2);
    expect(scores[0].day).toBe("2026-07-15");
  });

  it("uses endTime when available", () => {
    const events: E[] = [
      {
        startTime: "2026-07-15T10:00:00Z",
        endTime: "2026-07-15T12:30:00Z",
        selection: { status: "must-see" },
      },
    ];
    const scores = computeDayScores(events, ["2026-07-15"]);
    expect(scores[0].durationMins).toBe(150);
  });
});

describe("getMostLoadedDay", () => {
  it("returns the day with the most total selections", () => {
    const scores = computeDayScores(
      [
        ev("2026-07-15T10:00:00Z", "must-see"),
        ev("2026-07-16T10:00:00Z", "must-see"),
        ev("2026-07-16T12:00:00Z", "must-see"),
      ],
      DAYS,
    );
    const most = getMostLoadedDay(scores);
    expect(most?.day).toBe("2026-07-16");
  });

  it("returns null for empty scores", () => {
    expect(getMostLoadedDay([])).toBeNull();
  });

  it("returns first day when all tied", () => {
    const scores = [
      { day: "2026-07-15", mustSee: 2, interested: 0, total: 2, durationMins: 120 },
      { day: "2026-07-16", mustSee: 2, interested: 0, total: 2, durationMins: 120 },
    ];
    expect(getMostLoadedDay(scores)?.day).toBe("2026-07-15");
  });
});

describe("getDayLoadLevel", () => {
  it("returns light for 0 events", () => {
    expect(
      getDayLoadLevel({ day: "d", mustSee: 0, interested: 0, total: 0, durationMins: 0 }),
    ).toBe("light");
  });
  it("returns light for 1–3 events", () => {
    expect(
      getDayLoadLevel({ day: "d", mustSee: 3, interested: 0, total: 3, durationMins: 0 }),
    ).toBe("light");
  });
  it("returns moderate for 4–7 events", () => {
    expect(
      getDayLoadLevel({ day: "d", mustSee: 5, interested: 0, total: 5, durationMins: 0 }),
    ).toBe("moderate");
  });
  it("returns heavy for 8+ events", () => {
    expect(
      getDayLoadLevel({ day: "d", mustSee: 8, interested: 0, total: 8, durationMins: 0 }),
    ).toBe("heavy");
  });
});

describe("getDayLoadColor", () => {
  it("returns pink for heavy", () => {
    expect(getDayLoadColor("heavy")).toContain("accent-pink");
  });
  it("returns orange for moderate", () => {
    expect(getDayLoadColor("moderate")).toContain("warning-orange");
  });
  it("returns dim for light", () => {
    expect(getDayLoadColor("light")).toContain("text-dim");
  });
});

describe("formatDayDuration", () => {
  it("formats 0 minutes", () => {
    expect(formatDayDuration(0)).toBe("0h");
  });
  it("formats whole hours", () => {
    expect(formatDayDuration(120)).toBe("2h");
  });
  it("formats hours and minutes", () => {
    expect(formatDayDuration(90)).toBe("1h30");
  });
  it("formats minutes under an hour", () => {
    expect(formatDayDuration(45)).toBe("0h45");
  });
});
