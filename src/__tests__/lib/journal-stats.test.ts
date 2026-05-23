import { describe, it, expect } from "vitest";
import { computeJournalStats, type JournalStatsEntry } from "@/lib/journal-stats";

const entry = (overrides: Partial<JournalStatsEntry> = {}): JournalStatsEntry => ({
  timestamp: "2025-07-15T14:30:00Z",
  photos: [],
  ...overrides,
});

describe("computeJournalStats", () => {
  it("returns zeros for empty array", () => {
    expect(computeJournalStats([])).toEqual({ totalEntries: 0, totalDays: 0, entriesWithPhotos: 0, totalWords: 0 });
  });

  it("counts total entries", () => {
    const entries = [entry(), entry(), entry()];
    expect(computeJournalStats(entries).totalEntries).toBe(3);
  });

  it("counts unique days", () => {
    const entries = [
      entry({ timestamp: "2025-07-15T10:00:00Z" }),
      entry({ timestamp: "2025-07-15T14:00:00Z" }),
      entry({ timestamp: "2025-07-16T09:00:00Z" }),
    ];
    expect(computeJournalStats(entries).totalDays).toBe(2);
  });

  it("counts single day correctly", () => {
    const entries = [
      entry({ timestamp: "2025-07-15T10:00:00Z" }),
      entry({ timestamp: "2025-07-15T18:00:00Z" }),
    ];
    expect(computeJournalStats(entries).totalDays).toBe(1);
  });

  it("counts entries with at least one photo", () => {
    const entries = [
      entry({ photos: [] }),
      entry({ photos: ["photo1.jpg"] }),
      entry({ photos: ["photo2.jpg", "photo3.jpg"] }),
    ];
    expect(computeJournalStats(entries).entriesWithPhotos).toBe(2);
  });

  it("handles entries with no photos field", () => {
    const entries = [
      { timestamp: "2025-07-15T10:00:00Z" },
      { timestamp: "2025-07-15T18:00:00Z", photos: ["img.jpg"] },
    ];
    expect(computeJournalStats(entries).entriesWithPhotos).toBe(1);
  });

  it("skips malformed timestamps for day count", () => {
    const entries = [
      entry({ timestamp: "invalid-date" }),
      entry({ timestamp: "2025-07-15T10:00:00Z" }),
    ];
    const stats = computeJournalStats(entries);
    expect(stats.totalEntries).toBe(2);
    expect(stats.totalDays).toBe(1);
  });

  it("handles three distinct days", () => {
    const entries = [
      entry({ timestamp: "2025-07-14T10:00:00Z" }),
      entry({ timestamp: "2025-07-15T10:00:00Z" }),
      entry({ timestamp: "2025-07-16T10:00:00Z" }),
      entry({ timestamp: "2025-07-16T14:00:00Z" }),
    ];
    expect(computeJournalStats(entries).totalDays).toBe(3);
    expect(computeJournalStats(entries).totalEntries).toBe(4);
  });

  it("all entries with photos", () => {
    const entries = [
      entry({ photos: ["a.jpg"] }),
      entry({ photos: ["b.jpg"] }),
    ];
    expect(computeJournalStats(entries).entriesWithPhotos).toBe(2);
  });
});

describe("computeJournalStats — totalWords", () => {
  it("returns 0 words for entries without text", () => {
    const entries = [entry(), entry()];
    expect(computeJournalStats(entries).totalWords).toBe(0);
  });

  it("counts words from freeText", () => {
    const entries = [entry({ freeText: "super ambiance ici" })];
    expect(computeJournalStats(entries).totalWords).toBe(3);
  });

  it("counts words from note", () => {
    const entries = [entry({ note: "concert incroyable" })];
    expect(computeJournalStats(entries).totalWords).toBe(2);
  });

  it("sums words from freeText and note combined", () => {
    const entries = [entry({ freeText: "bonne ambiance", note: "foule dense" })];
    expect(computeJournalStats(entries).totalWords).toBe(4);
  });

  it("sums words across multiple entries", () => {
    const entries = [
      entry({ freeText: "un deux trois" }),
      entry({ freeText: "quatre cinq" }),
    ];
    expect(computeJournalStats(entries).totalWords).toBe(5);
  });

  it("handles null/undefined text fields gracefully", () => {
    const entries = [entry({ freeText: null, note: undefined })];
    expect(computeJournalStats(entries).totalWords).toBe(0);
  });

  it("ignores extra whitespace when counting words", () => {
    const entries = [entry({ freeText: "  hello   world  " })];
    expect(computeJournalStats(entries).totalWords).toBe(2);
  });
});
