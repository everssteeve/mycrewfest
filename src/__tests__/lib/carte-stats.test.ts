import { describe, it, expect } from "vitest";
import {
  countMappedVenues,
  countEventsOnMap,
  countVisibleCrewMembers,
} from "@/lib/carte-stats";

// ---------------------------------------------------------------------------
// countMappedVenues
// ---------------------------------------------------------------------------

describe("countMappedVenues", () => {
  it("returns 0 for empty list", () => {
    expect(countMappedVenues([])).toBe(0);
  });

  it("returns 0 when no venue has coordinates", () => {
    const venues = [
      { latitude: null, longitude: null },
      { latitude: null, longitude: 2.3 },
      { latitude: 48.8, longitude: null },
    ];
    expect(countMappedVenues(venues)).toBe(0);
  });

  it("counts venues with both coordinates set", () => {
    const venues = [
      { latitude: 48.8, longitude: 2.3 },
      { latitude: null, longitude: null },
      { latitude: 43.3, longitude: 5.4 },
    ];
    expect(countMappedVenues(venues)).toBe(2);
  });

  it("returns total when all venues have coordinates", () => {
    const venues = [{ latitude: 1, longitude: 1 }, { latitude: 2, longitude: 2 }];
    expect(countMappedVenues(venues)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// countEventsOnMap
// ---------------------------------------------------------------------------

describe("countEventsOnMap", () => {
  it("returns 0 for empty list", () => {
    expect(countEventsOnMap([])).toBe(0);
  });

  it("returns 0 when no venue has coordinates", () => {
    const venues = [
      { latitude: null, longitude: null, events: [{}, {}] },
    ];
    expect(countEventsOnMap(venues)).toBe(0);
  });

  it("sums events only from venues with coordinates", () => {
    const venues = [
      { latitude: 48.8, longitude: 2.3, events: [{}, {}, {}] },
      { latitude: null, longitude: null, events: [{}, {}] },
      { latitude: 43.3, longitude: 5.4, events: [{}] },
    ];
    expect(countEventsOnMap(venues)).toBe(4);
  });

  it("returns 0 when mapped venues have no events", () => {
    const venues = [{ latitude: 48.8, longitude: 2.3, events: [] }];
    expect(countEventsOnMap(venues)).toBe(0);
  });

  it("handles multiple venues with events", () => {
    const venues = [
      { latitude: 1, longitude: 1, events: [{}] },
      { latitude: 2, longitude: 2, events: [{}, {}] },
    ];
    expect(countEventsOnMap(venues)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// countVisibleCrewMembers
// ---------------------------------------------------------------------------

describe("countVisibleCrewMembers", () => {
  it("returns 0 for empty list", () => {
    expect(countVisibleCrewMembers([])).toBe(0);
  });

  it("returns the number of positions in the list", () => {
    const positions = [{ userId: "u1" }, { userId: "u2" }, { userId: "u3" }];
    expect(countVisibleCrewMembers(positions)).toBe(3);
  });

  it("returns 1 for a single crew member", () => {
    expect(countVisibleCrewMembers([{ userId: "u1" }])).toBe(1);
  });
});
