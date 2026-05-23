import { describe, it, expect } from "vitest";
import { getFestivalCountdown } from "@/lib/festival-countdown";

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
