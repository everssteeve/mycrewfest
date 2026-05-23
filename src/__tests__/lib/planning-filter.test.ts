import { describe, expect, it } from "vitest";
import { applyPlanningMustSeeFilter } from "@/lib/planning-filter";

const ev = (id: string, status: string | null) => ({ id, selectionStatus: status });

describe("applyPlanningMustSeeFilter", () => {
  it("returns all events when mustSeeOnly is false", () => {
    const events = [ev("1", "must-see"), ev("2", "intéressé"), ev("3", "vu")];
    expect(applyPlanningMustSeeFilter(events, false)).toHaveLength(3);
  });

  it("returns only must-see events when mustSeeOnly is true", () => {
    const events = [ev("1", "must-see"), ev("2", "intéressé"), ev("3", "vu")];
    const result = applyPlanningMustSeeFilter(events, true);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("returns empty array when mustSeeOnly and no must-see events", () => {
    const events = [ev("1", "intéressé"), ev("2", "vu")];
    expect(applyPlanningMustSeeFilter(events, true)).toHaveLength(0);
  });

  it("returns all must-see when multiple must-see events", () => {
    const events = [ev("1", "must-see"), ev("2", "must-see"), ev("3", "intéressé")];
    const result = applyPlanningMustSeeFilter(events, true);
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(applyPlanningMustSeeFilter([], false)).toHaveLength(0);
    expect(applyPlanningMustSeeFilter([], true)).toHaveLength(0);
  });

  it("handles null selectionStatus", () => {
    const events = [ev("1", null), ev("2", "must-see")];
    const result = applyPlanningMustSeeFilter(events, true);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });
});
