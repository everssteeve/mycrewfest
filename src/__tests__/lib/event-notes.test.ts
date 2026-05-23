import { describe, it, expect } from "vitest";
import {
  validateEventNote,
  formatNotePreview,
  parseNotesFromStorage,
  serializeNotesToStorage,
  countNonEmptyNotes,
  buildStorageKey,
  MAX_NOTE_LENGTH,
} from "@/lib/event-notes";

describe("validateEventNote", () => {
  it("accepts empty string", () => expect(validateEventNote("").valid).toBe(true));
  it("accepts normal note", () => expect(validateEventNote("Rejoindre Julie devant la scène").valid).toBe(true));
  it("rejects notes over MAX_NOTE_LENGTH", () => {
    const long = "a".repeat(MAX_NOTE_LENGTH + 1);
    const result = validateEventNote(long);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });
  it("accepts exactly MAX_NOTE_LENGTH chars", () => {
    expect(validateEventNote("a".repeat(MAX_NOTE_LENGTH)).valid).toBe(true);
  });
});

describe("formatNotePreview", () => {
  it("returns text as-is when short enough", () => {
    expect(formatNotePreview("Short note")).toBe("Short note");
  });
  it("truncates long text with ellipsis", () => {
    const long = "a".repeat(100);
    const result = formatNotePreview(long, 60);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(61);
  });
  it("trims leading and trailing whitespace", () => {
    expect(formatNotePreview("  hello  ")).toBe("hello");
  });
  it("uses default maxLen of 60", () => {
    const result = formatNotePreview("a".repeat(100));
    expect(result.length).toBeLessThanOrEqual(61);
  });
});

describe("parseNotesFromStorage", () => {
  it("returns empty object for null", () => {
    expect(parseNotesFromStorage(null)).toEqual({});
  });
  it("returns empty object for invalid JSON", () => {
    expect(parseNotesFromStorage("not json")).toEqual({});
  });
  it("parses valid JSON object", () => {
    const raw = JSON.stringify({ "event-1": "ma note", "event-2": "autre" });
    expect(parseNotesFromStorage(raw)).toEqual({ "event-1": "ma note", "event-2": "autre" });
  });
  it("ignores non-string values", () => {
    const raw = JSON.stringify({ "event-1": "ok", "event-2": 42 });
    const result = parseNotesFromStorage(raw);
    expect(result["event-1"]).toBe("ok");
    expect(result["event-2"]).toBeUndefined();
  });
  it("returns empty for array input", () => {
    expect(parseNotesFromStorage("[]")).toEqual({});
  });
});

describe("serializeNotesToStorage", () => {
  it("produces parseable JSON", () => {
    const notes = { "event-1": "note A" };
    const raw = serializeNotesToStorage(notes);
    expect(JSON.parse(raw)).toEqual(notes);
  });
});

describe("countNonEmptyNotes", () => {
  it("counts non-empty and non-whitespace-only notes", () => {
    const notes = { a: "note", b: "  ", c: "", d: "autre" };
    expect(countNonEmptyNotes(notes)).toBe(2);
  });
  it("returns 0 for empty object", () => {
    expect(countNonEmptyNotes({})).toBe(0);
  });
});

describe("buildStorageKey", () => {
  it("includes fest event id", () => {
    const key = buildStorageKey("fest-123");
    expect(key).toContain("fest-123");
    expect(key).toContain("mycrewfest");
  });
  it("returns different keys for different fest events", () => {
    expect(buildStorageKey("a")).not.toBe(buildStorageKey("b"));
  });
});
