import { describe, it, expect } from "vitest";
import { matchesJournalQuery, filterAndGroupByDay, filterByCrew } from "@/lib/journal-filter";
import type { SouvenirEntry } from "@/app/(app)/festevent/[id]/journal/_components/journal-view";

function entry(
  id: string,
  opts: {
    freeText?: string;
    note?: string;
    eventTitle?: string;
    artistName?: string;
    venueName?: string;
    timestamp?: string;
  } = {},
): SouvenirEntry {
  return {
    id,
    festEventId: "fe1",
    eventId: opts.eventTitle ? "e1" : null,
    freeText: opts.freeText ?? null,
    note: opts.note ?? null,
    photos: [],
    timestamp: opts.timestamp ?? "2026-07-15T14:00:00",
    shareWithCrew: false,
    createdAt: "2026-07-15T14:00:00",
    updatedAt: "2026-07-15T14:00:00",
    event: opts.eventTitle
      ? {
          id: "e1",
          title: opts.eventTitle,
          eventType: "concert",
          startTime: null,
          artist: opts.artistName ? { id: "a1", name: opts.artistName } : null,
          venue: opts.venueName ? { id: "v1", name: opts.venueName, type: "scène" } : null,
        }
      : null,
  };
}

describe("matchesJournalQuery — empty query", () => {
  it("matches everything when query is empty", () => {
    const e = entry("1", { note: "some note" });
    expect(matchesJournalQuery(e, "")).toBe(true);
  });

  it("matches when query is only whitespace", () => {
    const e = entry("1", { note: "some note" });
    expect(matchesJournalQuery(e, "   ")).toBe(true);
  });
});

describe("matchesJournalQuery — freeText", () => {
  it("matches freeText case-insensitively", () => {
    const e = entry("1", { freeText: "Super concert Hellfest" });
    expect(matchesJournalQuery(e, "hellfest")).toBe(true);
    expect(matchesJournalQuery(e, "SUPER")).toBe(true);
  });

  it("does not match unrelated query", () => {
    const e = entry("1", { freeText: "Super concert Hellfest" });
    expect(matchesJournalQuery(e, "Download")).toBe(false);
  });
});

describe("matchesJournalQuery — note", () => {
  it("matches note content", () => {
    const e = entry("1", { note: "Amazing performance" });
    expect(matchesJournalQuery(e, "amazing")).toBe(true);
  });
});

describe("matchesJournalQuery — event fields", () => {
  it("matches event title", () => {
    const e = entry("1", { eventTitle: "Metallica" });
    expect(matchesJournalQuery(e, "metallica")).toBe(true);
  });

  it("matches artist name", () => {
    const e = entry("1", { eventTitle: "Concert", artistName: "Iron Maiden" });
    expect(matchesJournalQuery(e, "iron maiden")).toBe(true);
  });

  it("matches venue name", () => {
    const e = entry("1", { eventTitle: "Concert", venueName: "Grande Scène" });
    expect(matchesJournalQuery(e, "grande")).toBe(true);
  });

  it("returns false for entry with no fields matching", () => {
    const e = entry("1", { note: "nice vibes" });
    expect(matchesJournalQuery(e, "metallica")).toBe(false);
  });
});

describe("filterAndGroupByDay", () => {
  it("returns all entries when query is empty", () => {
    const entries = [
      entry("1", { note: "A", timestamp: "2026-07-15T10:00:00" }),
      entry("2", { note: "B", timestamp: "2026-07-16T10:00:00" }),
    ];
    const result = filterAndGroupByDay(entries, "");
    expect(result.size).toBe(2);
  });

  it("filters entries by day correctly", () => {
    const entries = [
      entry("1", { note: "Concert rock", timestamp: "2026-07-15T10:00:00" }),
      entry("2", { note: "Jazz session", timestamp: "2026-07-16T10:00:00" }),
    ];
    const result = filterAndGroupByDay(entries, "rock");
    expect(result.size).toBe(1);
    expect(result.has("2026-07-15")).toBe(true);
    expect(result.has("2026-07-16")).toBe(false);
  });

  it("groups matching entries by day", () => {
    const entries = [
      entry("1", { note: "rock A", timestamp: "2026-07-15T10:00:00" }),
      entry("2", { note: "rock B", timestamp: "2026-07-15T14:00:00" }),
      entry("3", { note: "jazz C", timestamp: "2026-07-16T10:00:00" }),
    ];
    const result = filterAndGroupByDay(entries, "rock");
    expect(result.get("2026-07-15")).toHaveLength(2);
    expect(result.has("2026-07-16")).toBe(false);
  });

  it("returns empty map when no entries match", () => {
    const entries = [entry("1", { note: "jazz" })];
    const result = filterAndGroupByDay(entries, "metal");
    expect(result.size).toBe(0);
  });

  it("applies crewOnly filter before query filter", () => {
    const e1 = { ...entry("1", { note: "crew note", timestamp: "2026-07-15T10:00:00" }), shareWithCrew: true };
    const e2 = { ...entry("2", { note: "crew note", timestamp: "2026-07-15T12:00:00" }), shareWithCrew: false };
    const result = filterAndGroupByDay([e1, e2], "crew", true);
    const day = result.get("2026-07-15") ?? [];
    expect(day).toHaveLength(1);
    expect(day[0].id).toBe("1");
  });
});

describe("filterByCrew", () => {
  const crewEntry = { shareWithCrew: true, id: "a" };
  const nonCrewEntry = { shareWithCrew: false, id: "b" };

  it("returns all entries when crewOnly is false", () => {
    expect(filterByCrew([crewEntry, nonCrewEntry], false)).toHaveLength(2);
  });

  it("returns only crew entries when crewOnly is true", () => {
    const result = filterByCrew([crewEntry, nonCrewEntry], true);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("returns empty array when no entries are shared with crew", () => {
    expect(filterByCrew([nonCrewEntry], true)).toHaveLength(0);
  });

  it("returns all crew entries from array", () => {
    const entries = [
      { shareWithCrew: true, id: "1" },
      { shareWithCrew: false, id: "2" },
      { shareWithCrew: true, id: "3" },
    ];
    const result = filterByCrew(entries, true);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["1", "3"]);
  });
});
