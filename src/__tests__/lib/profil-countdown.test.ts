import { describe, expect, it } from "vitest";
import {
  type CountdownFestEvent,
  computeDaysUntilFestival,
  findNextFestEvent,
  formatCountdownLabel,
  getCountdownColor,
  getCountdownUrgency,
  isFestivalActive,
} from "@/lib/profil-countdown";

const makeFE = (id: string, start: string, end: string): CountdownFestEvent => ({
  id,
  festival: { name: `Festival ${id}`, slug: id, startDate: start, endDate: end, city: "Paris" },
});

const NOW = new Date("2026-06-01T12:00:00Z");

describe("findNextFestEvent", () => {
  it("returns the soonest upcoming festival", () => {
    const events = [
      makeFE("a", "2026-08-01", "2026-08-03"),
      makeFE("b", "2026-07-01", "2026-07-03"),
    ];
    expect(findNextFestEvent(events, NOW)?.id).toBe("b");
  });

  it("returns null when all festivals are past", () => {
    const events = [makeFE("a", "2025-01-01", "2025-01-03")];
    expect(findNextFestEvent(events, NOW)).toBeNull();
  });

  it("returns null for empty array", () => {
    expect(findNextFestEvent([], NOW)).toBeNull();
  });

  it("includes festivals where end > now even if start < now", () => {
    const events = [makeFE("a", "2026-05-30", "2026-06-03")];
    expect(findNextFestEvent(events, NOW)).not.toBeNull();
  });
});

describe("computeDaysUntilFestival", () => {
  it("returns 0 when festival has started", () => {
    expect(computeDaysUntilFestival("2026-06-01T10:00:00Z", NOW)).toBe(0);
  });
  it("returns correct days for future date", () => {
    expect(computeDaysUntilFestival("2026-06-11T12:00:00Z", NOW)).toBe(10);
  });
  it("never returns negative", () => {
    expect(computeDaysUntilFestival("2025-01-01", NOW)).toBe(0);
  });
});

describe("isFestivalActive", () => {
  it("returns true when now is within start/end", () => {
    expect(isFestivalActive("2026-05-30", "2026-06-05", NOW)).toBe(true);
  });
  it("returns false when now is before start", () => {
    expect(isFestivalActive("2026-07-01", "2026-07-05", NOW)).toBe(false);
  });
  it("returns false when now is after end", () => {
    expect(isFestivalActive("2026-05-01", "2026-05-05", NOW)).toBe(false);
  });
});

describe("formatCountdownLabel", () => {
  it("En cours for active", () => expect(formatCountdownLabel(5, true)).toBe("En cours"));
  it("Demain for 0 days", () => expect(formatCountdownLabel(0, false)).toBe("Demain"));
  it("Dans 1 jour for 1 day", () => expect(formatCountdownLabel(1, false)).toBe("Dans 1 jour"));
  it("plural for multiple days", () =>
    expect(formatCountdownLabel(10, false)).toBe("Dans 10 jours"));
});

describe("getCountdownUrgency", () => {
  it("active when festival is live", () => expect(getCountdownUrgency(0, true)).toBe("active"));
  it("imminent for ≤3 days", () => expect(getCountdownUrgency(2, false)).toBe("imminent"));
  it("soon for 4-14 days", () => expect(getCountdownUrgency(10, false)).toBe("soon"));
  it("later for >14 days", () => expect(getCountdownUrgency(20, false)).toBe("later"));
});

describe("getCountdownColor", () => {
  it("returns distinct colors for each urgency", () => {
    const urgencies = ["active", "imminent", "soon", "later"] as const;
    const colors = urgencies.map(getCountdownColor);
    expect(new Set(colors).size).toBe(4);
  });
});
