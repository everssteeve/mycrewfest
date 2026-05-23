import { describe, it, expect } from "vitest";
import {
  matchesProgrammeQuery,
  matchesSelectionFilter,
  matchesTagFilter,
  matchesVenueFilter,
  matchesDurationFilter,
  type SearchableEvent,
  type SelectionFilterable,
  type TagFilterable,
  type VenueFilterable,
  type DurationFilterable,
} from "@/lib/programme-search";

const BASE: SearchableEvent = {
  title: "Main Stage Concert",
  artist: { name: "Massive Attack" },
  venue: { name: "Grande Scène" },
};

describe("matchesProgrammeQuery", () => {
  it("returns true for empty query", () => {
    expect(matchesProgrammeQuery(BASE, "")).toBe(true);
    expect(matchesProgrammeQuery(BASE, "   ")).toBe(true);
  });

  it("matches on artist name (case-insensitive)", () => {
    expect(matchesProgrammeQuery(BASE, "massive")).toBe(true);
    expect(matchesProgrammeQuery(BASE, "MASSIVE ATTACK")).toBe(true);
    expect(matchesProgrammeQuery(BASE, "attack")).toBe(true);
  });

  it("matches on event title (case-insensitive)", () => {
    expect(matchesProgrammeQuery(BASE, "main stage")).toBe(true);
    expect(matchesProgrammeQuery(BASE, "concert")).toBe(true);
    expect(matchesProgrammeQuery(BASE, "CONCERT")).toBe(true);
  });

  it("matches on venue name (case-insensitive)", () => {
    expect(matchesProgrammeQuery(BASE, "grande")).toBe(true);
    expect(matchesProgrammeQuery(BASE, "scène")).toBe(true);
    expect(matchesProgrammeQuery(BASE, "GRANDE SCÈNE")).toBe(true);
  });

  it("returns false when query does not match any field", () => {
    expect(matchesProgrammeQuery(BASE, "radiohead")).toBe(false);
    expect(matchesProgrammeQuery(BASE, "petite scène")).toBe(false);
  });

  it("handles event with no artist", () => {
    const noArtist: SearchableEvent = { title: "Atelier poterie", artist: null };
    expect(matchesProgrammeQuery(noArtist, "poterie")).toBe(true);
    expect(matchesProgrammeQuery(noArtist, "radiohead")).toBe(false);
  });

  it("handles event with no venue", () => {
    const noVenue: SearchableEvent = {
      title: "Défilé",
      artist: { name: "Compagnie XYZ" },
      venue: null,
    };
    expect(matchesProgrammeQuery(noVenue, "compagnie")).toBe(true);
    expect(matchesProgrammeQuery(noVenue, "grande scène")).toBe(false);
  });

  it("handles event with neither artist nor venue", () => {
    const bare: SearchableEvent = { title: "Mystery Event" };
    expect(matchesProgrammeQuery(bare, "mystery")).toBe(true);
    expect(matchesProgrammeQuery(bare, "artist")).toBe(false);
  });

  it("matches partial strings", () => {
    expect(matchesProgrammeQuery(BASE, "Mass")).toBe(true);
    expect(matchesProgrammeQuery(BASE, "Grnd")).toBe(false);
  });

  it("trims leading/trailing whitespace from query", () => {
    expect(matchesProgrammeQuery(BASE, "  massive  ")).toBe(true);
  });

  it("matches tags (partial, case-insensitive)", () => {
    const tagged = { ...BASE, tags: ["rap", "live", "outdoor"] };
    expect(matchesProgrammeQuery(tagged, "rap")).toBe(true);
    expect(matchesProgrammeQuery(tagged, "RAP")).toBe(true);
    expect(matchesProgrammeQuery(tagged, "out")).toBe(true);
  });

  it("does not match when query only matches a tag that does not exist", () => {
    expect(matchesProgrammeQuery(BASE, "jazz")).toBe(false);
  });

  it("returns true for event with no tags when query matches title", () => {
    const noTags = { ...BASE, tags: undefined };
    expect(matchesProgrammeQuery(noTags, "main stage")).toBe(true);
    expect(matchesProgrammeQuery(noTags, "jazz")).toBe(false);
  });
});

describe("matchesSelectionFilter", () => {
  const e = (status: string | null | undefined): SelectionFilterable => ({
    selectionStatus: status,
  });

  it("'tous' always returns true", () => {
    expect(matchesSelectionFilter(e(null), "tous")).toBe(true);
    expect(matchesSelectionFilter(e("must-see"), "tous")).toBe(true);
    expect(matchesSelectionFilter(e("intéressé"), "tous")).toBe(true);
    expect(matchesSelectionFilter(e(undefined), "tous")).toBe(true);
  });

  it("'sélectionné' matches must-see, intéressé and vu", () => {
    expect(matchesSelectionFilter(e("must-see"), "sélectionné")).toBe(true);
    expect(matchesSelectionFilter(e("intéressé"), "sélectionné")).toBe(true);
    expect(matchesSelectionFilter(e("vu"), "sélectionné")).toBe(true);
  });

  it("'sélectionné' rejects null/undefined", () => {
    expect(matchesSelectionFilter(e(null), "sélectionné")).toBe(false);
    expect(matchesSelectionFilter(e(undefined), "sélectionné")).toBe(false);
  });

  it("'must-see' matches only must-see", () => {
    expect(matchesSelectionFilter(e("must-see"), "must-see")).toBe(true);
    expect(matchesSelectionFilter(e("intéressé"), "must-see")).toBe(false);
    expect(matchesSelectionFilter(e("vu"), "must-see")).toBe(false);
    expect(matchesSelectionFilter(e(null), "must-see")).toBe(false);
  });

  it("'intéressé' matches only intéressé", () => {
    expect(matchesSelectionFilter(e("intéressé"), "intéressé")).toBe(true);
    expect(matchesSelectionFilter(e("must-see"), "intéressé")).toBe(false);
    expect(matchesSelectionFilter(e(null), "intéressé")).toBe(false);
  });

  it("'vu' matches only vu events", () => {
    expect(matchesSelectionFilter(e("vu"), "vu")).toBe(true);
    expect(matchesSelectionFilter(e("must-see"), "vu")).toBe(false);
    expect(matchesSelectionFilter(e("intéressé"), "vu")).toBe(false);
    expect(matchesSelectionFilter(e(null), "vu")).toBe(false);
  });
});

describe("matchesTagFilter", () => {
  const ev = (tags?: string[]): TagFilterable => ({ tags });
  const active = (...tags: string[]) => new Set(tags);

  it("empty active set allows all events", () => {
    expect(matchesTagFilter(ev(["rap", "live"]), active())).toBe(true);
    expect(matchesTagFilter(ev([]), active())).toBe(true);
    expect(matchesTagFilter(ev(), active())).toBe(true);
  });

  it("matches when event has at least one active tag (OR logic)", () => {
    expect(matchesTagFilter(ev(["rap", "live"]), active("rap"))).toBe(true);
    expect(matchesTagFilter(ev(["rap", "live"]), active("live"))).toBe(true);
    expect(matchesTagFilter(ev(["rap", "live"]), active("rap", "danse"))).toBe(true);
  });

  it("rejects when event has none of the active tags", () => {
    expect(matchesTagFilter(ev(["rap", "live"]), active("danse"))).toBe(false);
    expect(matchesTagFilter(ev(["rap"]), active("jazz", "soul"))).toBe(false);
  });

  it("rejects event with no tags when a tag is active", () => {
    expect(matchesTagFilter(ev([]), active("rap"))).toBe(false);
    expect(matchesTagFilter(ev(), active("rap"))).toBe(false);
  });

  it("is case-sensitive (tags are stored lowercase by convention)", () => {
    expect(matchesTagFilter(ev(["rap"]), active("Rap"))).toBe(false);
    expect(matchesTagFilter(ev(["rap"]), active("rap"))).toBe(true);
  });
});

describe("matchesVenueFilter", () => {
  const ev = (venueId?: string | null): VenueFilterable => ({
    venue: venueId != null ? { id: venueId } : venueId === null ? null : undefined,
  });

  it("null venueId matches all events", () => {
    expect(matchesVenueFilter(ev("v1"), null)).toBe(true);
    expect(matchesVenueFilter(ev(null), null)).toBe(true);
    expect(matchesVenueFilter(ev(), null)).toBe(true);
  });

  it("matches event with the same venue id", () => {
    expect(matchesVenueFilter(ev("v1"), "v1")).toBe(true);
  });

  it("rejects event with different venue id", () => {
    expect(matchesVenueFilter(ev("v2"), "v1")).toBe(false);
  });

  it("rejects event with no venue when a venue is selected", () => {
    expect(matchesVenueFilter(ev(null), "v1")).toBe(false);
    expect(matchesVenueFilter(ev(), "v1")).toBe(false);
  });
});

describe("matchesDurationFilter", () => {
  const dur = (durationMins: number | null | undefined): DurationFilterable => ({ durationMins });

  it("always returns true for 'tous'", () => {
    expect(matchesDurationFilter(dur(null), "tous")).toBe(true);
    expect(matchesDurationFilter(dur(20), "tous")).toBe(true);
    expect(matchesDurationFilter(dur(60), "tous")).toBe(true);
    expect(matchesDurationFilter(dur(120), "tous")).toBe(true);
  });

  it("court matches events with durationMins < 30", () => {
    expect(matchesDurationFilter(dur(15), "court")).toBe(true);
    expect(matchesDurationFilter(dur(29), "court")).toBe(true);
    expect(matchesDurationFilter(dur(0), "court")).toBe(true);
  });

  it("court rejects events with durationMins >= 30", () => {
    expect(matchesDurationFilter(dur(30), "court")).toBe(false);
    expect(matchesDurationFilter(dur(60), "court")).toBe(false);
  });

  it("normal matches events with 30 <= durationMins <= 90", () => {
    expect(matchesDurationFilter(dur(30), "normal")).toBe(true);
    expect(matchesDurationFilter(dur(60), "normal")).toBe(true);
    expect(matchesDurationFilter(dur(90), "normal")).toBe(true);
  });

  it("normal rejects events outside 30–90 range", () => {
    expect(matchesDurationFilter(dur(29), "normal")).toBe(false);
    expect(matchesDurationFilter(dur(91), "normal")).toBe(false);
  });

  it("long matches events with durationMins > 90", () => {
    expect(matchesDurationFilter(dur(91), "long")).toBe(true);
    expect(matchesDurationFilter(dur(120), "long")).toBe(true);
    expect(matchesDurationFilter(dur(180), "long")).toBe(true);
  });

  it("long rejects events with durationMins <= 90", () => {
    expect(matchesDurationFilter(dur(90), "long")).toBe(false);
    expect(matchesDurationFilter(dur(60), "long")).toBe(false);
  });

  it("returns false for null/undefined durationMins on any specific filter", () => {
    expect(matchesDurationFilter(dur(null), "court")).toBe(false);
    expect(matchesDurationFilter(dur(undefined), "normal")).toBe(false);
    expect(matchesDurationFilter(dur(null), "long")).toBe(false);
  });
});
