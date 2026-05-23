import { describe, expect, it } from "vitest";
import {
  computeSelectedDurationMins,
  computeTimeCoveragePercent,
  computeTotalProgrammeDurationMins,
  type DensityEvent,
  formatDensityBadge,
  getDensityColor,
  getDensityLabel,
} from "@/lib/programme-density";

const makeEvent = (overrides: Partial<DensityEvent> = {}): DensityEvent => ({
  startTime: "2026-06-19T20:00:00Z",
  endTime: "2026-06-19T21:00:00Z",
  durationMins: 60,
  selection: null,
  ...overrides,
});

describe("computeTotalProgrammeDurationMins", () => {
  it("sums durationMins", () => {
    const events = [makeEvent({ durationMins: 60 }), makeEvent({ durationMins: 90 })];
    expect(computeTotalProgrammeDurationMins(events)).toBe(150);
  });
  it("falls back to start/end diff when durationMins is null", () => {
    const e = makeEvent({
      durationMins: null,
      startTime: "2026-06-19T20:00:00Z",
      endTime: "2026-06-19T21:30:00Z",
    });
    expect(computeTotalProgrammeDurationMins([e])).toBe(90);
  });
  it("defaults to 60 min when no duration info", () => {
    const e = makeEvent({ durationMins: null, endTime: null });
    expect(computeTotalProgrammeDurationMins([e])).toBe(60);
  });
  it("returns 0 for empty array", () => {
    expect(computeTotalProgrammeDurationMins([])).toBe(0);
  });
});

describe("computeSelectedDurationMins", () => {
  it("sums only must-see and intéressant events", () => {
    const events = [
      makeEvent({ durationMins: 90, selection: { status: "must-see" } }),
      makeEvent({ durationMins: 60, selection: { status: "intéressant" } }),
      makeEvent({ durationMins: 45, selection: { status: "vu" } }),
      makeEvent({ durationMins: 30, selection: null }),
    ];
    expect(computeSelectedDurationMins(events)).toBe(150);
  });
  it("returns 0 when no selection", () => {
    expect(computeSelectedDurationMins([makeEvent()])).toBe(0);
  });
});

describe("computeTimeCoveragePercent", () => {
  it("returns 0 when totalMins is 0", () => {
    expect(computeTimeCoveragePercent(60, 0)).toBe(0);
  });
  it("returns 50 for half coverage", () => {
    expect(computeTimeCoveragePercent(60, 120)).toBe(50);
  });
  it("caps at 100", () => {
    expect(computeTimeCoveragePercent(200, 100)).toBe(100);
  });
  it("rounds to integer", () => {
    const result = computeTimeCoveragePercent(1, 3);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("getDensityLabel", () => {
  it("Surchargé for ≥80", () => expect(getDensityLabel(80)).toBe("Surchargé"));
  it("Dense for 55-79", () => expect(getDensityLabel(60)).toBe("Dense"));
  it("Équilibré for 30-54", () => expect(getDensityLabel(40)).toBe("Équilibré"));
  it("Léger for 10-29", () => expect(getDensityLabel(20)).toBe("Léger"));
  it("Vide for <10", () => expect(getDensityLabel(5)).toBe("Vide"));
});

describe("getDensityColor", () => {
  it("returns distinct colors for each tier", () => {
    const colors = [85, 65, 40, 20, 5].map(getDensityColor);
    const unique = new Set(colors);
    expect(unique.size).toBe(5);
  });
});

describe("formatDensityBadge", () => {
  it("includes percentage and time", () => {
    const text = formatDensityBadge(45, 120);
    expect(text).toContain("45%");
    expect(text).toContain("2h");
  });
  it("shows minutes for sub-hour durations", () => {
    const text = formatDensityBadge(20, 45);
    expect(text).toContain("45min");
  });
  it("includes the ◉ indicator", () => {
    expect(formatDensityBadge(50, 60)).toContain("◉");
  });
});
