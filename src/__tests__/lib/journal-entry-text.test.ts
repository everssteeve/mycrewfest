import { describe, it, expect } from "vitest";
import { formatJournalEntryText } from "@/lib/journal-entry-text";
import type { SouvenirEntry } from "@/app/(app)/festevent/[id]/journal/_components/journal-view";

type EntryInput = Pick<SouvenirEntry, "freeText" | "note" | "timestamp" | "event">;

function entry(opts: {
  timestamp?: string;
  freeText?: string;
  note?: string;
  eventTitle?: string;
  artistName?: string;
  venueName?: string;
}): EntryInput {
  return {
    timestamp: opts.timestamp ?? "2026-07-15T14:30:00",
    freeText: opts.freeText ?? null,
    note: opts.note ?? null,
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

describe("formatJournalEntryText — header", () => {
  it("always starts with festival name", () => {
    const result = formatJournalEntryText(entry({}), "Hellfest");
    expect(result.startsWith("📔 Hellfest")).toBe(true);
  });

  it("includes formatted time on second line", () => {
    const result = formatJournalEntryText(entry({ timestamp: "2026-07-15T14:30:00" }), "Fest");
    const lines = result.split("\n");
    expect(lines[1]).toContain("14h30");
  });

  it("includes long date on second line", () => {
    const result = formatJournalEntryText(entry({ timestamp: "2026-07-15T14:30:00" }), "Fest");
    const lines = result.split("\n");
    expect(lines[1]).toContain("2026");
  });
});

describe("formatJournalEntryText — event", () => {
  it("includes artist and venue when both present", () => {
    const result = formatJournalEntryText(
      entry({ eventTitle: "Concert", artistName: "Metallica", venueName: "Grande Scène" }),
      "Fest",
    );
    expect(result).toContain("🎤 Metallica · Grande Scène");
    expect(result).toContain("Concert");
  });

  it("uses event title only when no artist/venue", () => {
    const result = formatJournalEntryText(entry({ eventTitle: "Set surprise" }), "Fest");
    expect(result).toContain("🎤 Set surprise");
  });

  it("includes only artist when no venue", () => {
    const result = formatJournalEntryText(
      entry({ eventTitle: "Concert", artistName: "Slayer" }),
      "Fest",
    );
    expect(result).toContain("🎤 Slayer");
  });

  it("omits event section when no event", () => {
    const result = formatJournalEntryText(entry({ freeText: "bonne ambiance" }), "Fest");
    expect(result).not.toContain("🎤");
  });
});

describe("formatJournalEntryText — text fields", () => {
  it("includes freeText", () => {
    const result = formatJournalEntryText(entry({ freeText: "Incroyable set !" }), "Fest");
    expect(result).toContain("Incroyable set !");
  });

  it("includes note prefixed with 'Note :'", () => {
    const result = formatJournalEntryText(entry({ note: "à revoir" }), "Fest");
    expect(result).toContain("Note : à revoir");
  });

  it("includes both freeText and note", () => {
    const result = formatJournalEntryText(
      entry({ freeText: "super concert", note: "mon préféré" }),
      "Fest",
    );
    expect(result).toContain("super concert");
    expect(result).toContain("Note : mon préféré");
  });

  it("omits null freeText", () => {
    const result = formatJournalEntryText(entry({ note: "just a note" }), "Fest");
    const lines = result.split("\n");
    expect(lines.filter((l) => l === "")).not.toHaveLength(0); // has blanks but no empty content lines from freeText
    expect(result).not.toMatch(/^null/m);
  });

  it("omits null note", () => {
    const result = formatJournalEntryText(entry({ freeText: "just text" }), "Fest");
    expect(result).not.toContain("Note :");
  });
});

describe("formatJournalEntryText — full entry", () => {
  it("formats a complete entry correctly", () => {
    const e = entry({
      timestamp: "2026-07-16T21:00:00",
      eventTitle: "Headliner",
      artistName: "Iron Maiden",
      venueName: "Main Stage",
      freeText: "Fantastique !",
      note: "meilleur concert de ma vie",
    });
    const result = formatJournalEntryText(e, "Download Festival");
    expect(result).toContain("📔 Download Festival");
    expect(result).toContain("21h00");
    expect(result).toContain("🎤 Iron Maiden · Main Stage");
    expect(result).toContain("Headliner");
    expect(result).toContain("Fantastique !");
    expect(result).toContain("Note : meilleur concert de ma vie");
  });
});
