import { describe, it, expect } from "vitest";
import { getFestivalCountdown, getCountdownBadgeState, getCountdownBadgeLabel, getCountdownBadgeColor } from "@/lib/festival-countdown";

// Fixed reference point: 2026-05-23T12:00:00Z (current date in project)
const NOW = new Date("2026-05-23T12:00:00Z");

function daysFromNow(days: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  return d;
}

describe("getFestivalCountdown", () => {
  describe("upcoming state", () => {
    it("returns state 'upcoming', label 'J-37', and daysRemaining 37 when 37 days away", () => {
      const start = daysFromNow(37);
      const end = daysFromNow(40);
      const result = getFestivalCountdown(start, end, NOW);
      expect(result.state).toBe("upcoming");
      expect(result.label).toBe("J-37");
      expect(result.daysRemaining).toBe(37);
    });

    it("returns label 'J-1' and daysRemaining 1 when festival starts tomorrow", () => {
      const start = daysFromNow(1);
      const end = daysFromNow(4);
      const result = getFestivalCountdown(start, end, NOW);
      expect(result.state).toBe("upcoming");
      expect(result.label).toBe("J-1");
      expect(result.daysRemaining).toBe(1);
    });

    it("uses ceil for fractional days (starts in 0.5 day → J-1)", () => {
      // now = 00:00, festival starts 12h later = 0.5 day → ceil = 1
      const base = new Date("2026-05-23T00:00:00Z");
      const start = new Date("2026-05-23T12:00:00Z");
      const end = new Date("2026-05-25T12:00:00Z");
      const result = getFestivalCountdown(start, end, base);
      expect(result.state).toBe("upcoming");
      expect(result.daysRemaining).toBe(1);
    });

    it("returns correct ariaLabel for upcoming state", () => {
      const start = daysFromNow(37);
      const end = daysFromNow(40);
      const result = getFestivalCountdown(start, end, NOW);
      expect(result.ariaLabel).toBe("Festival dans 37 jours");
    });

    it("returns singular ariaLabel when daysRemaining is 1", () => {
      const start = daysFromNow(1);
      const end = daysFromNow(3);
      const result = getFestivalCountdown(start, end, NOW);
      expect(result.ariaLabel).toBe("Festival dans 1 jour");
    });
  });

  describe("ongoing state", () => {
    it("returns state 'ongoing', label 'En cours', and daysRemaining null when now is between start and end", () => {
      const start = daysFromNow(-2);
      const end = daysFromNow(3);
      const result = getFestivalCountdown(start, end, NOW);
      expect(result.state).toBe("ongoing");
      expect(result.label).toBe("En cours");
      expect(result.daysRemaining).toBeNull();
    });

    it("returns 'ongoing' when now is exactly at startDate", () => {
      const start = new Date(NOW);
      const end = daysFromNow(3);
      const result = getFestivalCountdown(start, end, NOW);
      expect(result.state).toBe("ongoing");
      expect(result.label).toBe("En cours");
      expect(result.daysRemaining).toBeNull();
    });

    it("returns 'ongoing' when now is exactly at endDate", () => {
      const start = daysFromNow(-3);
      const end = new Date(NOW);
      const result = getFestivalCountdown(start, end, NOW);
      expect(result.state).toBe("ongoing");
      expect(result.label).toBe("En cours");
      expect(result.daysRemaining).toBeNull();
    });

    it("returns correct ariaLabel for ongoing state", () => {
      const start = daysFromNow(-1);
      const end = daysFromNow(2);
      const result = getFestivalCountdown(start, end, NOW);
      expect(result.ariaLabel).toBe("Festival en cours");
    });
  });

  describe("past state", () => {
    it("returns state 'past', label 'Terminé', and daysRemaining null when festival has ended", () => {
      const start = daysFromNow(-10);
      const end = daysFromNow(-1);
      const result = getFestivalCountdown(start, end, NOW);
      expect(result.state).toBe("past");
      expect(result.label).toBe("Terminé");
      expect(result.daysRemaining).toBeNull();
    });

    it("returns correct ariaLabel for past state", () => {
      const start = daysFromNow(-10);
      const end = daysFromNow(-5);
      const result = getFestivalCountdown(start, end, NOW);
      expect(result.ariaLabel).toBe("Festival terminé");
    });
  });
});

// ---------------------------------------------------------------------------
// Badge countdown (granular states for detail page)
// ---------------------------------------------------------------------------

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

const REF = new Date("2026-06-10T12:00:00.000Z");

describe("getCountdownBadgeState", () => {
  it("returns 'past' when festival ended", () => {
    expect(getCountdownBadgeState(addDays(REF, -10).toISOString(), addDays(REF, -5).toISOString(), REF)).toBe("past");
  });

  it("returns 'ongoing' between start and end", () => {
    expect(getCountdownBadgeState(addDays(REF, -1).toISOString(), addDays(REF, 2).toISOString(), REF)).toBe("ongoing");
  });

  it("returns 'ongoing' when today is exactly startDate", () => {
    expect(getCountdownBadgeState(REF.toISOString(), addDays(REF, 3).toISOString(), REF)).toBe("ongoing");
  });

  it("returns 'upcoming_urgent' for 1 day away", () => {
    expect(getCountdownBadgeState(addDays(REF, 1).toISOString(), addDays(REF, 4).toISOString(), REF)).toBe("upcoming_urgent");
  });

  it("returns 'upcoming_urgent' for 3 days away", () => {
    expect(getCountdownBadgeState(addDays(REF, 3).toISOString(), addDays(REF, 6).toISOString(), REF)).toBe("upcoming_urgent");
  });

  it("returns 'upcoming_soon' for 4 days away", () => {
    expect(getCountdownBadgeState(addDays(REF, 4).toISOString(), addDays(REF, 7).toISOString(), REF)).toBe("upcoming_soon");
  });

  it("returns 'upcoming_soon' for 14 days away", () => {
    expect(getCountdownBadgeState(addDays(REF, 14).toISOString(), addDays(REF, 17).toISOString(), REF)).toBe("upcoming_soon");
  });

  it("returns 'upcoming' for 15 days away", () => {
    expect(getCountdownBadgeState(addDays(REF, 15).toISOString(), addDays(REF, 18).toISOString(), REF)).toBe("upcoming");
  });
});

describe("getCountdownBadgeLabel", () => {
  it("returns 'EN COURS' for ongoing", () => {
    expect(getCountdownBadgeLabel(addDays(REF, -1).toISOString(), addDays(REF, 2).toISOString(), REF)).toBe("EN COURS");
  });

  it("returns 'J-2' for 2 days away", () => {
    expect(getCountdownBadgeLabel(addDays(REF, 2).toISOString(), addDays(REF, 5).toISOString(), REF)).toBe("J-2");
  });

  it("returns 'DANS 7 JOURS' for 7 days away", () => {
    expect(getCountdownBadgeLabel(addDays(REF, 7).toISOString(), addDays(REF, 10).toISOString(), REF)).toBe("DANS 7 JOURS");
  });

  it("returns '' for past", () => {
    expect(getCountdownBadgeLabel(addDays(REF, -10).toISOString(), addDays(REF, -5).toISOString(), REF)).toBe("");
  });

  it("returns '' for far upcoming (> 14 days)", () => {
    expect(getCountdownBadgeLabel(addDays(REF, 30).toISOString(), addDays(REF, 33).toISOString(), REF)).toBe("");
  });
});

describe("getCountdownBadgeColor", () => {
  it("returns red for urgent", () => { expect(getCountdownBadgeColor("upcoming_urgent")).toBe("#FF3355"); });
  it("returns orange for soon", () => { expect(getCountdownBadgeColor("upcoming_soon")).toBe("#FF9900"); });
  it("returns neon green for ongoing", () => { expect(getCountdownBadgeColor("ongoing")).toBe("#00FF66"); });
  it("returns '' for past", () => { expect(getCountdownBadgeColor("past")).toBe(""); });
  it("returns '' for upcoming", () => { expect(getCountdownBadgeColor("upcoming")).toBe(""); });
});
