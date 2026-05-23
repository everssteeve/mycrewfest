import { describe, expect, it } from "vitest";
import {
  countCrewSharedSouvenirs,
  countLinkedEventSouvenirs,
  countSouvenirPhotos,
  filterTodaySouvenirs,
} from "@/lib/deambuloire-stats";

// ---------------------------------------------------------------------------
// countSouvenirPhotos
// ---------------------------------------------------------------------------

describe("countSouvenirPhotos", () => {
  it("returns 0 for empty list", () => {
    expect(countSouvenirPhotos([])).toBe(0);
  });

  it("returns 0 when no souvenir has photos", () => {
    expect(countSouvenirPhotos([{ photos: [] }, { photos: [] }])).toBe(0);
  });

  it("counts souvenirs with at least one photo", () => {
    const souvenirs = [
      { photos: ["url1.jpg"] },
      { photos: [] },
      { photos: ["url2.jpg", "url3.jpg"] },
    ];
    expect(countSouvenirPhotos(souvenirs)).toBe(2);
  });

  it("returns total when all souvenirs have photos", () => {
    expect(countSouvenirPhotos([{ photos: ["a.jpg"] }, { photos: ["b.jpg"] }])).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// countLinkedEventSouvenirs
// ---------------------------------------------------------------------------

describe("countLinkedEventSouvenirs", () => {
  it("returns 0 for empty list", () => {
    expect(countLinkedEventSouvenirs([])).toBe(0);
  });

  it("returns 0 when no souvenir is linked to an event", () => {
    expect(countLinkedEventSouvenirs([{ eventId: null }, { eventId: null }])).toBe(0);
  });

  it("counts souvenirs with a non-null eventId", () => {
    const souvenirs = [{ eventId: "evt-1" }, { eventId: null }, { eventId: "evt-2" }];
    expect(countLinkedEventSouvenirs(souvenirs)).toBe(2);
  });

  it("returns total when all souvenirs are linked", () => {
    expect(countLinkedEventSouvenirs([{ eventId: "e1" }, { eventId: "e2" }])).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// countCrewSharedSouvenirs
// ---------------------------------------------------------------------------

describe("countCrewSharedSouvenirs", () => {
  it("returns 0 for empty list", () => {
    expect(countCrewSharedSouvenirs([])).toBe(0);
  });

  it("returns 0 when none are shared", () => {
    expect(countCrewSharedSouvenirs([{ shareWithCrew: false }, { shareWithCrew: false }])).toBe(0);
  });

  it("counts shared souvenirs correctly", () => {
    const souvenirs = [{ shareWithCrew: true }, { shareWithCrew: false }, { shareWithCrew: true }];
    expect(countCrewSharedSouvenirs(souvenirs)).toBe(2);
  });

  it("returns total when all are shared", () => {
    expect(countCrewSharedSouvenirs([{ shareWithCrew: true }, { shareWithCrew: true }])).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// filterTodaySouvenirs
// ---------------------------------------------------------------------------

const NOW = new Date("2026-05-23T14:00:00");

describe("filterTodaySouvenirs", () => {
  it("returns empty array for empty list", () => {
    expect(filterTodaySouvenirs([], NOW)).toEqual([]);
  });

  it("includes souvenirs from today", () => {
    const souvenirs = [{ timestamp: "2026-05-23T10:00:00" }, { timestamp: "2026-05-23T20:00:00" }];
    expect(filterTodaySouvenirs(souvenirs, NOW)).toHaveLength(2);
  });

  it("excludes souvenirs from other days", () => {
    const souvenirs = [{ timestamp: "2026-05-22T23:59:00" }, { timestamp: "2026-05-24T00:01:00" }];
    expect(filterTodaySouvenirs(souvenirs, NOW)).toHaveLength(0);
  });

  it("includes only today's souvenirs from a mixed list", () => {
    const souvenirs = [
      { timestamp: "2026-05-23T09:00:00" },
      { timestamp: "2026-05-22T20:00:00" },
      { timestamp: "2026-05-23T18:00:00" },
    ];
    const result = filterTodaySouvenirs(souvenirs, NOW);
    expect(result).toHaveLength(2);
  });
});
