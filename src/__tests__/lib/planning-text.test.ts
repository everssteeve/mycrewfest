import { describe, expect, it } from "vitest";
import { generatePlanningText, type PlanningTextEvent } from "@/lib/planning-text";

const ev = (title: string, startTime?: string | null, venueName?: string): PlanningTextEvent => ({
  title,
  startTime: startTime ?? null,
  venue: venueName ? { name: venueName } : null,
});

describe("generatePlanningText — empty state", () => {
  it("returns empty-state message when no events", () => {
    const result = generatePlanningText([], "Rock en Seine");
    expect(result).toContain("Rock en Seine");
    expect(result).toContain("Aucun événement");
  });
});

describe("generatePlanningText — header", () => {
  it("includes festival name and emoji in header", () => {
    const result = generatePlanningText([ev("Artist A", "2026-07-15T14:00:00")], "Hellfest");
    expect(result).toContain("🎪");
    expect(result).toContain("Hellfest");
  });
});

describe("generatePlanningText — timed events", () => {
  it("formats event time as HHhMM", () => {
    const result = generatePlanningText([ev("Artist A", "2026-07-15T14:30:00")], "Fest");
    expect(result).toContain("14h30");
  });

  it("includes venue name in parentheses", () => {
    const result = generatePlanningText(
      [ev("Artist B", "2026-07-15T20:00:00", "Grande Scène")],
      "Fest",
    );
    expect(result).toContain("(Grande Scène)");
  });

  it("omits venue parentheses when no venue", () => {
    const result = generatePlanningText([ev("Artist C", "2026-07-15T20:00:00")], "Fest");
    expect(result).not.toContain("()");
  });

  it("includes day header with 📅 emoji", () => {
    const result = generatePlanningText([ev("Artist D", "2026-07-15T14:00:00")], "Fest");
    expect(result).toContain("📅");
  });

  it("groups events by day with separate headers", () => {
    const events = [
      ev("Day1 Artist", "2026-07-15T14:00:00"),
      ev("Day2 Artist", "2026-07-16T20:00:00"),
    ];
    const result = generatePlanningText(events, "Fest");
    const lines = result.split("\n");
    const dayHeaders = lines.filter((l) => l.startsWith("📅"));
    expect(dayHeaders).toHaveLength(2);
  });

  it("sorts events within a day chronologically", () => {
    const events = [
      ev("Late Show", "2026-07-15T22:00:00"),
      ev("Early Show", "2026-07-15T10:00:00"),
      ev("Midday Show", "2026-07-15T14:00:00"),
    ];
    const result = generatePlanningText(events, "Fest");
    const earlyIdx = result.indexOf("Early Show");
    const midIdx = result.indexOf("Midday Show");
    const lateIdx = result.indexOf("Late Show");
    expect(earlyIdx).toBeLessThan(midIdx);
    expect(midIdx).toBeLessThan(lateIdx);
  });

  it("sorts days chronologically", () => {
    const events = [ev("Day 2", "2026-07-16T14:00:00"), ev("Day 1", "2026-07-15T14:00:00")];
    const result = generatePlanningText(events, "Fest");
    const day1Idx = result.indexOf("Day 1");
    const day2Idx = result.indexOf("Day 2");
    expect(day1Idx).toBeLessThan(day2Idx);
  });
});

describe("generatePlanningText — itinerant events (no startTime)", () => {
  it("places events without startTime in Itinérant section", () => {
    const result = generatePlanningText([ev("Floating Artist")], "Fest");
    expect(result).toContain("📍 Itinérant");
    expect(result).toContain("Floating Artist");
  });

  it("Itinérant section comes after all timed days", () => {
    const events = [ev("Floating", null), ev("Timed", "2026-07-15T14:00:00")];
    const result = generatePlanningText(events, "Fest");
    const timedIdx = result.indexOf("Timed");
    const itinerantIdx = result.indexOf("📍 Itinérant");
    expect(timedIdx).toBeLessThan(itinerantIdx);
  });

  it("shows venue in itinerant section when present", () => {
    const result = generatePlanningText([ev("Street Act", null, "Place centrale")], "Fest");
    expect(result).toContain("(Place centrale)");
  });
});

describe("generatePlanningText — output format", () => {
  it("uses bullet • for each event", () => {
    const result = generatePlanningText([ev("Some Act", "2026-07-15T14:00:00")], "Fest");
    expect(result).toContain("•");
  });

  it("does not have trailing whitespace or newlines", () => {
    const result = generatePlanningText([ev("Some Act", "2026-07-15T14:00:00")], "Fest");
    expect(result).toBe(result.trimEnd());
  });
});
