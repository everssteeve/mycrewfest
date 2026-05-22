import { describe, it, expect } from "vitest";
import { nextSelectionStatus, SELECTION_CYCLE } from "@/lib/selection";

describe("SELECTION_CYCLE", () => {
  it("contains null, intéressé, must-see and vu in order", () => {
    expect(SELECTION_CYCLE[0]).toBeNull();
    expect(SELECTION_CYCLE[1]).toBe("intéressé");
    expect(SELECTION_CYCLE[2]).toBe("must-see");
    expect(SELECTION_CYCLE[3]).toBe("vu");
  });

  it("has exactly 4 entries", () => {
    expect(SELECTION_CYCLE.length).toBe(4);
  });
});

describe("nextSelectionStatus", () => {
  it("null → intéressé", () => {
    expect(nextSelectionStatus(null)).toBe("intéressé");
  });

  it("intéressé → must-see", () => {
    expect(nextSelectionStatus("intéressé")).toBe("must-see");
  });

  it("must-see → vu", () => {
    expect(nextSelectionStatus("must-see")).toBe("vu");
  });

  it("vu → null (cycle back to start)", () => {
    expect(nextSelectionStatus("vu")).toBeNull();
  });

  it("unknown status (not in cycle) → intéressé", () => {
    // biome-ignore lint/suspicious/noExplicitAny: intentional unknown value
    expect(nextSelectionStatus("unknown" as any)).toBe("intéressé");
  });

  it("full cycle returns to null", () => {
    let status = nextSelectionStatus(null);
    status = nextSelectionStatus(status);
    status = nextSelectionStatus(status);
    status = nextSelectionStatus(status);
    expect(status).toBeNull();
  });
});
