import { describe, it, expect } from "vitest";
import { canMarkAsVu, markVuStatus } from "@/lib/bilan-actions";

describe("canMarkAsVu", () => {
  it("returns true for must-see events (missed)", () => {
    expect(canMarkAsVu("must-see")).toBe(true);
  });

  it("returns false for already-vu events", () => {
    expect(canMarkAsVu("vu")).toBe(false);
  });

  it("returns false for intéressé events", () => {
    expect(canMarkAsVu("intéressé")).toBe(false);
  });

  it("returns false for null (no selection)", () => {
    expect(canMarkAsVu(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(canMarkAsVu(undefined)).toBe(false);
  });
});

describe("markVuStatus", () => {
  it("returns 'vu'", () => {
    expect(markVuStatus()).toBe("vu");
  });
});
