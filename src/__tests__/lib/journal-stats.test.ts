import { describe, expect, it } from "vitest";
import {
  computeAvgEntriesPerDay,
  computeJournalStats,
  countDaysWithPhotos,
  countTotalJournalPhotos,
  getDaysSinceLastEntry,
  getMostActiveJournalDay,
  type JournalStatsEntry,
} from "@/lib/journal-stats";

const entry = (overrides: Partial<JournalStatsEntry> = {}): JournalStatsEntry => ({
  timestamp: "2025-07-15T14:30:00Z",
  photos: [],
  ...overrides,
});

describe("computeJournalStats", () => {
  it("returns zeros for empty array", () => {
    expect(computeJournalStats([])).toEqual({
      totalEntries: 0,
      totalDays: 0,
      entriesWithPhotos: 0,
      totalWords: 0,
      maxStreakDays: 0,
      avgWordsPerEntry: 0,
    });
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
    const entries = [entry({ photos: ["a.jpg"] }), entry({ photos: ["b.jpg"] })];
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
    const entries = [entry({ freeText: "un deux trois" }), entry({ freeText: "quatre cinq" })];
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

describe("computeJournalStats — maxStreakDays", () => {
  it("returns 0 for empty entries", () => {
    expect(computeJournalStats([]).maxStreakDays).toBe(0);
  });

  it("returns 1 for a single entry", () => {
    const entries = [entry({ timestamp: "2025-07-15T10:00:00Z" })];
    expect(computeJournalStats(entries).maxStreakDays).toBe(1);
  });

  it("returns 1 when days are not consecutive", () => {
    const entries = [
      entry({ timestamp: "2025-07-14T10:00:00Z" }),
      entry({ timestamp: "2025-07-16T10:00:00Z" }),
    ];
    expect(computeJournalStats(entries).maxStreakDays).toBe(1);
  });

  it("counts consecutive days correctly", () => {
    const entries = [
      entry({ timestamp: "2025-07-14T10:00:00Z" }),
      entry({ timestamp: "2025-07-15T10:00:00Z" }),
      entry({ timestamp: "2025-07-16T10:00:00Z" }),
    ];
    expect(computeJournalStats(entries).maxStreakDays).toBe(3);
  });

  it("returns the max streak when there are multiple streaks", () => {
    const entries = [
      entry({ timestamp: "2025-07-14T10:00:00Z" }),
      entry({ timestamp: "2025-07-15T10:00:00Z" }),
      entry({ timestamp: "2025-07-17T10:00:00Z" }),
      entry({ timestamp: "2025-07-18T10:00:00Z" }),
      entry({ timestamp: "2025-07-19T10:00:00Z" }),
    ];
    expect(computeJournalStats(entries).maxStreakDays).toBe(3);
  });

  it("counts multiple entries on the same day as one day", () => {
    const entries = [
      entry({ timestamp: "2025-07-14T10:00:00Z" }),
      entry({ timestamp: "2025-07-14T18:00:00Z" }),
      entry({ timestamp: "2025-07-15T10:00:00Z" }),
    ];
    expect(computeJournalStats(entries).maxStreakDays).toBe(2);
  });
});

describe("computeJournalStats — avgWordsPerEntry", () => {
  it("returns 0 for empty array", () => {
    expect(computeJournalStats([]).avgWordsPerEntry).toBe(0);
  });

  it("returns 0 when entries have no text", () => {
    const entries = [entry(), entry()];
    expect(computeJournalStats(entries).avgWordsPerEntry).toBe(0);
  });

  it("computes average from freeText", () => {
    const entries = [
      entry({ freeText: "hello world" }), // 2 words
      entry({ freeText: "one two three four" }), // 4 words
    ];
    // avg = (2+4)/2 = 3
    expect(computeJournalStats(entries).avgWordsPerEntry).toBe(3);
  });

  it("combines freeText and note for each entry", () => {
    const entries = [
      entry({ freeText: "a b", note: "c d e" }), // 5 words
    ];
    expect(computeJournalStats(entries).avgWordsPerEntry).toBe(5);
  });

  it("rounds to nearest integer", () => {
    const entries = [
      entry({ freeText: "one" }), // 1 word
      entry({ freeText: "a b" }), // 2 words
    ];
    // avg = 1.5 → rounds to 2
    expect(computeJournalStats(entries).avgWordsPerEntry).toBe(2);
  });
});

describe("getMostActiveJournalDay", () => {
  it("returns null for empty array", () => {
    expect(getMostActiveJournalDay([])).toBeNull();
  });

  it("returns null when all timestamps are invalid", () => {
    const entries = [{ timestamp: "invalid" }, { timestamp: "bad" }];
    expect(getMostActiveJournalDay(entries)).toBeNull();
  });

  it("returns the only day with its count", () => {
    const entries = [{ timestamp: "2025-07-15T10:00:00Z" }];
    const result = getMostActiveJournalDay(entries);
    expect(result?.count).toBe(1);
  });

  it("groups multiple entries on the same day", () => {
    const entries = [
      { timestamp: "2025-07-15T10:00:00Z" },
      { timestamp: "2025-07-15T14:00:00Z" },
      { timestamp: "2025-07-15T20:00:00Z" },
    ];
    const result = getMostActiveJournalDay(entries);
    expect(result?.count).toBe(3);
  });

  it("returns the day with the most entries", () => {
    const entries = [
      { timestamp: "2025-07-14T10:00:00Z" },
      { timestamp: "2025-07-15T10:00:00Z" },
      { timestamp: "2025-07-15T14:00:00Z" },
      { timestamp: "2025-07-16T10:00:00Z" },
    ];
    const result = getMostActiveJournalDay(entries);
    expect(result?.count).toBe(2);
  });

  it("breaks ties by earliest date", () => {
    const entries = [{ timestamp: "2025-07-14T10:00:00Z" }, { timestamp: "2025-07-16T10:00:00Z" }];
    const result = getMostActiveJournalDay(entries);
    expect(result?.count).toBe(1);
  });

  it("ignores invalid timestamps in the count", () => {
    const entries = [
      { timestamp: "invalid" },
      { timestamp: "2025-07-15T10:00:00Z" },
      { timestamp: "2025-07-15T12:00:00Z" },
    ];
    const result = getMostActiveJournalDay(entries);
    expect(result?.count).toBe(2);
  });
});

describe("countDaysWithPhotos", () => {
  it("returns 0 for empty array", () => {
    expect(countDaysWithPhotos([])).toBe(0);
  });

  it("returns 0 when no entries have photos", () => {
    const entries = [
      { timestamp: "2025-07-15T10:00:00Z", photos: [] },
      { timestamp: "2025-07-16T10:00:00Z" },
    ];
    expect(countDaysWithPhotos(entries)).toBe(0);
  });

  it("counts a single day with photos", () => {
    const entries = [
      { timestamp: "2025-07-15T10:00:00Z", photos: ["a.jpg"] },
      { timestamp: "2025-07-15T14:00:00Z", photos: ["b.jpg"] },
    ];
    expect(countDaysWithPhotos(entries)).toBe(1);
  });

  it("counts multiple distinct days with photos", () => {
    const entries = [
      { timestamp: "2025-07-15T10:00:00Z", photos: ["a.jpg"] },
      { timestamp: "2025-07-16T10:00:00Z", photos: ["b.jpg"] },
      { timestamp: "2025-07-17T10:00:00Z", photos: [] },
    ];
    expect(countDaysWithPhotos(entries)).toBe(2);
  });

  it("ignores entries without photos from the count", () => {
    const entries = [
      { timestamp: "2025-07-15T10:00:00Z" },
      { timestamp: "2025-07-15T14:00:00Z", photos: ["c.jpg"] },
    ];
    expect(countDaysWithPhotos(entries)).toBe(1);
  });

  it("ignores invalid timestamps", () => {
    const entries = [
      { timestamp: "bad-date", photos: ["a.jpg"] },
      { timestamp: "2025-07-15T10:00:00Z", photos: ["b.jpg"] },
    ];
    expect(countDaysWithPhotos(entries)).toBe(1);
  });
});

describe("countTotalJournalPhotos", () => {
  it("returns 0 for empty list", () => {
    expect(countTotalJournalPhotos([])).toBe(0);
  });

  it("returns 0 when no entries have photos", () => {
    const entries = [
      { timestamp: "2025-07-15T10:00:00Z" },
      { timestamp: "2025-07-15T12:00:00Z", photos: [] },
    ];
    expect(countTotalJournalPhotos(entries)).toBe(0);
  });

  it("counts photos from a single entry", () => {
    const entries = [{ timestamp: "2025-07-15T10:00:00Z", photos: ["a.jpg", "b.jpg", "c.jpg"] }];
    expect(countTotalJournalPhotos(entries)).toBe(3);
  });

  it("sums photos across multiple entries", () => {
    const entries = [
      { timestamp: "2025-07-15T10:00:00Z", photos: ["a.jpg", "b.jpg"] },
      { timestamp: "2025-07-15T12:00:00Z", photos: ["c.jpg"] },
      { timestamp: "2025-07-15T14:00:00Z", photos: ["d.jpg", "e.jpg", "f.jpg"] },
    ];
    expect(countTotalJournalPhotos(entries)).toBe(6);
  });

  it("ignores entries with undefined photos", () => {
    const entries = [
      { timestamp: "2025-07-15T10:00:00Z" },
      { timestamp: "2025-07-15T12:00:00Z", photos: ["a.jpg"] },
    ];
    expect(countTotalJournalPhotos(entries)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getDaysSinceLastEntry
// ---------------------------------------------------------------------------

const NOW = new Date("2026-05-23T12:00:00");

describe("getDaysSinceLastEntry", () => {
  it("returns null for empty list", () => {
    expect(getDaysSinceLastEntry([], NOW)).toBeNull();
  });

  it("returns 0 when the last entry was today", () => {
    expect(getDaysSinceLastEntry([{ timestamp: "2026-05-23T08:00:00Z" }], NOW)).toBe(0);
  });

  it("returns 1 when the last entry was yesterday", () => {
    expect(getDaysSinceLastEntry([{ timestamp: "2026-05-22T20:00:00Z" }], NOW)).toBe(1);
  });

  it("returns 3 when the last entry was 3 days ago", () => {
    expect(getDaysSinceLastEntry([{ timestamp: "2026-05-20T10:00:00Z" }], NOW)).toBe(3);
  });

  it("picks the most recent entry among multiple", () => {
    const entries = [
      { timestamp: "2026-05-19T10:00:00Z" },
      { timestamp: "2026-05-22T20:00:00Z" },
      { timestamp: "2026-05-21T09:00:00Z" },
    ];
    expect(getDaysSinceLastEntry(entries, NOW)).toBe(1);
  });

  it("ignores entries with invalid timestamps", () => {
    const entries = [{ timestamp: "invalid" }, { timestamp: "2026-05-22T10:00:00Z" }];
    expect(getDaysSinceLastEntry(entries, NOW)).toBe(1);
  });

  it("returns null when all timestamps are invalid", () => {
    expect(getDaysSinceLastEntry([{ timestamp: "bad" }], NOW)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// computeAvgEntriesPerDay
// ---------------------------------------------------------------------------

describe("computeAvgEntriesPerDay", () => {
  it("returns null when totalDays is 0", () => {
    expect(computeAvgEntriesPerDay(5, 0)).toBeNull();
  });

  it("returns 1 for one entry on one day", () => {
    expect(computeAvgEntriesPerDay(1, 1)).toBe(1);
  });

  it("returns 2 for 6 entries over 3 days", () => {
    expect(computeAvgEntriesPerDay(6, 3)).toBe(2);
  });

  it("rounds to one decimal", () => {
    expect(computeAvgEntriesPerDay(5, 3)).toBe(1.7);
  });

  it("returns 0 for 0 entries over 1 day", () => {
    expect(computeAvgEntriesPerDay(0, 1)).toBe(0);
  });
});
