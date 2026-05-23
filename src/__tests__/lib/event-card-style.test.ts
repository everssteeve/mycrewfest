import { describe, expect, it } from "vitest";
import { getEventCardVisualState } from "@/lib/event-card-style";

describe("getEventCardVisualState — opacity", () => {
  it("is 1 for a normal upcoming event", () => {
    const { opacity } = getEventCardVisualState(null, false, false);
    expect(opacity).toBe(1);
  });

  it("is 0.5 for cancelled events", () => {
    const { opacity } = getEventCardVisualState(null, true, false);
    expect(opacity).toBe(0.5);
  });

  it("is 0.8 for vu events", () => {
    const { opacity } = getEventCardVisualState("vu", false, false);
    expect(opacity).toBe(0.8);
  });

  it("cancelled takes precedence over vu", () => {
    const { opacity } = getEventCardVisualState("vu", true, false);
    expect(opacity).toBe(0.5);
  });
});

describe("getEventCardVisualState — isVu", () => {
  it("is true only for vu status", () => {
    expect(getEventCardVisualState("vu", false, false).isVu).toBe(true);
    expect(getEventCardVisualState("must-see", false, false).isVu).toBe(false);
    expect(getEventCardVisualState("intéressé", false, false).isVu).toBe(false);
    expect(getEventCardVisualState(null, false, false).isVu).toBe(false);
  });
});

describe("getEventCardVisualState — accent border", () => {
  it("has accent border for vu events", () => {
    expect(getEventCardVisualState("vu", false, false).hasAccentBorder).toBe(true);
  });

  it("has accent border for conflict events", () => {
    expect(getEventCardVisualState(null, false, true).hasAccentBorder).toBe(true);
  });

  it("has accent border for vu + conflict", () => {
    expect(getEventCardVisualState("vu", false, true).hasAccentBorder).toBe(true);
  });

  it("no accent border for normal events", () => {
    expect(getEventCardVisualState(null, false, false).hasAccentBorder).toBe(false);
    expect(getEventCardVisualState("must-see", false, false).hasAccentBorder).toBe(false);
  });
});

describe("getEventCardVisualState — background tint", () => {
  it("has neon tint for vu events", () => {
    const { backgroundTint } = getEventCardVisualState("vu", false, false);
    expect(backgroundTint).toContain("rgba(0,255,102");
  });

  it("has default surface for non-vu events", () => {
    const { backgroundTint } = getEventCardVisualState(null, false, false);
    expect(backgroundTint).toContain("--bg-surface");
  });
});
