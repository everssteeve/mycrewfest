import { describe, it, expect } from "vitest";
import { filterSignalsByScope, countCrewSignals, countCommunautéSignals } from "@/lib/signal-filter";

const signals = [
  { id: "1", scope: "crew" as const },
  { id: "2", scope: "communauté" as const },
  { id: "3", scope: "crew" as const },
  { id: "4", scope: "communauté" as const },
];

describe("filterSignalsByScope", () => {
  it("returns all signals when scope is null", () => {
    expect(filterSignalsByScope(signals, null)).toHaveLength(4);
  });

  it("filters to crew signals only", () => {
    const result = filterSignalsByScope(signals, "crew");
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.scope === "crew")).toBe(true);
  });

  it("filters to communauté signals only", () => {
    const result = filterSignalsByScope(signals, "communauté");
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.scope === "communauté")).toBe(true);
  });

  it("returns empty array for empty signal list", () => {
    expect(filterSignalsByScope([], "crew")).toHaveLength(0);
  });

  it("returns empty array when no signals match scope", () => {
    const crewOnly = [{ id: "1", scope: "crew" as const }];
    expect(filterSignalsByScope(crewOnly, "communauté")).toHaveLength(0);
  });
});

describe("countCrewSignals", () => {
  it("returns 0 for empty list", () => {
    expect(countCrewSignals([])).toBe(0);
  });

  it("counts only crew signals", () => {
    expect(countCrewSignals(signals)).toBe(2);
  });

  it("returns 0 when all signals are communauté", () => {
    const comOnly = [
      { scope: "communauté" as const },
      { scope: "communauté" as const },
    ];
    expect(countCrewSignals(comOnly)).toBe(0);
  });

  it("counts all when all are crew", () => {
    const crewOnly = [{ scope: "crew" as const }, { scope: "crew" as const }];
    expect(countCrewSignals(crewOnly)).toBe(2);
  });
});

describe("countCommunautéSignals", () => {
  it("returns 0 for empty list", () => {
    expect(countCommunautéSignals([])).toBe(0);
  });

  it("counts only communauté signals", () => {
    expect(countCommunautéSignals(signals)).toBe(2);
  });

  it("returns 0 when all signals are crew", () => {
    const crewOnly = [{ scope: "crew" as const }, { scope: "crew" as const }];
    expect(countCommunautéSignals(crewOnly)).toBe(0);
  });
});
