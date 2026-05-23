import { describe, expect, it } from "vitest";
import {
  extractEventTags,
  filterEventsByTags,
  formatTagLabel,
  parseEventTags,
} from "@/lib/programme-tag-filter";

// ---------------------------------------------------------------------------
// extractEventTags
// ---------------------------------------------------------------------------

describe("extractEventTags", () => {
  it("returns unique tags sorted from a mixed event list", () => {
    const events = [
      { tags: ["rap", "têtes_d_affiche"] },
      { tags: ["hip-hop", "rap"] },
      { tags: ["électronique"] },
    ];
    expect(extractEventTags(events)).toEqual(["électronique", "hip-hop", "rap", "têtes_d_affiche"]);
  });

  it("returns [] when events have no tags", () => {
    const events = [{ tags: null }, { tags: undefined }, {}];
    expect(extractEventTags(events)).toEqual([]);
  });

  it("handles events with JSON string tags", () => {
    const events = [{ tags: '["rap","jazz"]' }, { tags: '["jazz","soul"]' }];
    expect(extractEventTags(events)).toEqual(["jazz", "rap", "soul"]);
  });

  it("handles a mix of array tags and null", () => {
    const events = [{ tags: ["concert"] }, { tags: null }, { tags: ["concert", "live"] }];
    expect(extractEventTags(events)).toEqual(["concert", "live"]);
  });
});

// ---------------------------------------------------------------------------
// filterEventsByTags
// ---------------------------------------------------------------------------

describe("filterEventsByTags", () => {
  it("returns all events when selectedTags is empty", () => {
    const events = [
      { id: "1", tags: ["rap"] },
      { id: "2", tags: ["jazz"] },
    ];
    expect(filterEventsByTags(events, [])).toEqual(events);
  });

  it("filters events by a single tag", () => {
    const events = [
      { id: "1", tags: ["rap", "live"] },
      { id: "2", tags: ["jazz"] },
      { id: "3", tags: ["rap"] },
    ];
    const result = filterEventsByTags(events, ["rap"]);
    expect(result.map((e) => e.id)).toEqual(["1", "3"]);
  });

  it("matches if at least one tag corresponds", () => {
    const events = [
      { id: "1", tags: ["rap", "électronique"] },
      { id: "2", tags: ["jazz", "soul"] },
      { id: "3", tags: ["électronique"] },
    ];
    const result = filterEventsByTags(events, ["électronique", "jazz"]);
    expect(result.map((e) => e.id)).toEqual(["1", "2", "3"]);
  });

  it("excludes events with no matching tags", () => {
    const events = [
      { id: "1", tags: ["rap"] },
      { id: "2", tags: ["jazz"] },
    ];
    expect(filterEventsByTags(events, ["électronique"])).toEqual([]);
  });

  it("excludes events with null tags when filtering is active", () => {
    const events = [
      { id: "1", tags: ["rap"] },
      { id: "2", tags: null as unknown as string[] },
    ];
    const result = filterEventsByTags(events, ["rap"]);
    expect(result.map((e) => e.id)).toEqual(["1"]);
  });
});

// ---------------------------------------------------------------------------
// formatTagLabel
// ---------------------------------------------------------------------------

describe("formatTagLabel", () => {
  it('converts "têtes_d_affiche" → "Têtes d\'affiche"', () => {
    expect(formatTagLabel("têtes_d_affiche")).toBe("Têtes d'affiche");
  });

  it('converts "hip-hop" → "Hip-hop"', () => {
    expect(formatTagLabel("hip-hop")).toBe("Hip-hop");
  });

  it('converts "électronique" → "Électronique"', () => {
    expect(formatTagLabel("électronique")).toBe("Électronique");
  });

  it("capitalises a simple lowercase tag", () => {
    expect(formatTagLabel("rap")).toBe("Rap");
  });

  it('converts "soul_r_b" → "Soul r b"', () => {
    // underscores that are not d_ or l_ become spaces
    expect(formatTagLabel("soul_r_b")).toBe("Soul r b");
  });
});

// ---------------------------------------------------------------------------
// parseEventTags
// ---------------------------------------------------------------------------

describe("parseEventTags", () => {
  it("parses a valid JSON array string", () => {
    expect(parseEventTags('["rap","jazz","soul"]')).toEqual(["rap", "jazz", "soul"]);
  });

  it("returns [] for null", () => {
    expect(parseEventTags(null)).toEqual([]);
  });

  it("returns [] for undefined", () => {
    expect(parseEventTags(undefined)).toEqual([]);
  });

  it("returns [] for an empty string", () => {
    expect(parseEventTags("")).toEqual([]);
  });

  it("returns [] for invalid JSON", () => {
    expect(parseEventTags("not-json")).toEqual([]);
  });

  it("returns [] when JSON is not an array", () => {
    expect(parseEventTags('{"tag":"rap"}')).toEqual([]);
  });
});
