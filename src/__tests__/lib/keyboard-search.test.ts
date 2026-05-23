import { describe, expect, it } from "vitest";
import { isEscapeKey } from "@/lib/keyboard-search";

describe("isEscapeKey", () => {
  it("returns true for Escape key", () => {
    expect(isEscapeKey({ key: "Escape" })).toBe(true);
  });

  it("returns false for other keys", () => {
    expect(isEscapeKey({ key: "Enter" })).toBe(false);
    expect(isEscapeKey({ key: "ArrowDown" })).toBe(false);
    expect(isEscapeKey({ key: " " })).toBe(false);
    expect(isEscapeKey({ key: "a" })).toBe(false);
    expect(isEscapeKey({ key: "Tab" })).toBe(false);
  });

  it("is case-sensitive (browser always sends 'Escape', not 'escape')", () => {
    expect(isEscapeKey({ key: "escape" })).toBe(false);
    expect(isEscapeKey({ key: "ESCAPE" })).toBe(false);
  });
});
