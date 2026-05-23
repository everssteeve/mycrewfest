import { describe, it, expect } from "vitest";
import {
  getAppearanceCountdownStatus,
  formatAppearanceCountdownLabel,
  getAppearanceCountdownColor,
} from "@/lib/appearance-countdown";

const NOW = new Date("2026-05-23T12:00:00Z");

describe("getAppearanceCountdownStatus", () => {
  it("returns null for past dates", () => {
    expect(getAppearanceCountdownStatus("2026-05-20T00:00:00Z", NOW)).toBeNull();
  });

  it("returns 'today' for same day", () => {
    expect(getAppearanceCountdownStatus("2026-05-23T00:00:00Z", NOW)).toBe("today");
  });

  it("returns 'imminent' for 1-7 days away", () => {
    expect(getAppearanceCountdownStatus("2026-05-25T00:00:00Z", NOW)).toBe("imminent");
    expect(getAppearanceCountdownStatus("2026-05-30T00:00:00Z", NOW)).toBe("imminent");
  });

  it("returns 'upcoming' for 8-30 days away", () => {
    expect(getAppearanceCountdownStatus("2026-06-05T00:00:00Z", NOW)).toBe("upcoming");
    expect(getAppearanceCountdownStatus("2026-06-22T00:00:00Z", NOW)).toBe("upcoming");
  });

  it("returns 'far' for more than 30 days away", () => {
    expect(getAppearanceCountdownStatus("2026-07-01T00:00:00Z", NOW)).toBe("far");
  });
});

describe("formatAppearanceCountdownLabel", () => {
  it("returns null for past dates", () => {
    expect(formatAppearanceCountdownLabel("2026-05-20T00:00:00Z", NOW)).toBeNull();
  });

  it("returns \"Aujourd'hui\" for same day", () => {
    expect(formatAppearanceCountdownLabel("2026-05-23T00:00:00Z", NOW)).toBe("Aujourd'hui");
  });

  it("returns 'Demain' for tomorrow", () => {
    expect(formatAppearanceCountdownLabel("2026-05-24T00:00:00Z", NOW)).toBe("Demain");
  });

  it("returns 'Dans X j' for 2-30 days", () => {
    const label = formatAppearanceCountdownLabel("2026-05-28T00:00:00Z", NOW);
    expect(label).toMatch(/^Dans \d+ j$/);
  });

  it("returns null for more than 30 days away", () => {
    expect(formatAppearanceCountdownLabel("2026-07-01T00:00:00Z", NOW)).toBeNull();
  });
});

describe("getAppearanceCountdownColor", () => {
  it("returns danger-red for today", () => {
    expect(getAppearanceCountdownColor("today")).toContain("#FF3355");
  });

  it("returns warning-orange for imminent", () => {
    expect(getAppearanceCountdownColor("imminent")).toContain("#FF9900");
  });

  it("returns secondary-cyan for upcoming", () => {
    expect(getAppearanceCountdownColor("upcoming")).toContain("#00E5FF");
  });

  it("returns text-dim for far/null", () => {
    expect(getAppearanceCountdownColor("far")).toContain("#666");
    expect(getAppearanceCountdownColor(null)).toContain("#666");
  });
});
