import { describe, expect, it } from "vitest";
import { computeSelectionProgress } from "@/lib/selection-progress";
import type { SelectionStatus } from "@/types";

type Selections = Record<string, SelectionStatus>;

describe("computeSelectionProgress", () => {
  it("returns zeros for empty selections", () => {
    const result = computeSelectionProgress({});
    expect(result).toEqual({
      vu: 0,
      mustSeePending: 0,
      intéresséPending: 0,
      total: 0,
      progressPct: 0,
    });
  });

  it("counts vu events correctly", () => {
    const s: Selections = { e1: "vu", e2: "vu", e3: "must-see" };
    const result = computeSelectionProgress(s);
    expect(result.vu).toBe(2);
    expect(result.mustSeePending).toBe(1);
    expect(result.total).toBe(3);
  });

  it("counts must-see pending (not vu) correctly", () => {
    const s: Selections = { e1: "must-see", e2: "must-see" };
    const result = computeSelectionProgress(s);
    expect(result.mustSeePending).toBe(2);
    expect(result.vu).toBe(0);
  });

  it("counts intéressé pending correctly", () => {
    const s: Selections = { e1: "intéressé", e2: "intéressé", e3: "vu" };
    const result = computeSelectionProgress(s);
    expect(result.intéresséPending).toBe(2);
    expect(result.vu).toBe(1);
  });

  it("computes progressPct as vu / total", () => {
    const s: Selections = { e1: "vu", e2: "vu", e3: "must-see", e4: "intéressé" };
    const result = computeSelectionProgress(s);
    expect(result.progressPct).toBe(50); // 2/4 = 50%
  });

  it("progressPct is 100 when all events are vu", () => {
    const s: Selections = { e1: "vu", e2: "vu" };
    const result = computeSelectionProgress(s);
    expect(result.progressPct).toBe(100);
  });

  it("progressPct is 0 when no events are vu", () => {
    const s: Selections = { e1: "must-see", e2: "intéressé" };
    const result = computeSelectionProgress(s);
    expect(result.progressPct).toBe(0);
  });

  it("progressPct rounds to nearest integer", () => {
    // 1/3 = 33.33...% → rounds to 33
    const s: Selections = { e1: "vu", e2: "must-see", e3: "intéressé" };
    const result = computeSelectionProgress(s);
    expect(result.progressPct).toBe(33);
  });

  it("total is sum of vu + mustSeePending + intéresséPending", () => {
    const s: Selections = {
      e1: "vu",
      e2: "must-see",
      e3: "intéressé",
      e4: "vu",
    };
    const result = computeSelectionProgress(s);
    expect(result.total).toBe(4);
  });
});
