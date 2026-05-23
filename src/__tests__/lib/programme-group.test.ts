import { describe, it, expect } from "vitest";
import {
  groupEventsByVenue,
  sortVenueGroups,
  sortEventsWithinGroup,
  countEventsPerVenue,
  type GroupableEvent,
} from "@/lib/programme-group";

const makeEvent = (overrides: Partial<GroupableEvent> = {}): GroupableEvent => ({
  id: Math.random().toString(36).slice(2),
  venue: { id: "v1", name: "Main Stage" },
  startTime: "2026-06-20T20:00:00Z",
  ...overrides,
});

describe("groupEventsByVenue", () => {
  it("groups events by venue id", () => {
    const events = [
      makeEvent({ id: "e1", venue: { id: "v1", name: "Main Stage" } }),
      makeEvent({ id: "e2", venue: { id: "v2", name: "Temple" } }),
      makeEvent({ id: "e3", venue: { id: "v1", name: "Main Stage" } }),
    ];
    const groups = groupEventsByVenue(events);
    expect(groups).toHaveLength(2);
    const main = groups.find((g) => g.venueId === "v1");
    expect(main?.events).toHaveLength(2);
  });

  it("groups null venue under __no_venue__", () => {
    const events = [makeEvent({ venue: null }), makeEvent({ venue: null })];
    const groups = groupEventsByVenue(events);
    expect(groups).toHaveLength(1);
    expect(groups[0].venueId).toBeNull();
    expect(groups[0].venueName).toBe("Scène inconnue");
    expect(groups[0].events).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(groupEventsByVenue([])).toEqual([]);
  });

  it("preserves all events across groups", () => {
    const events = [
      makeEvent({ id: "a", venue: { id: "v1", name: "A" } }),
      makeEvent({ id: "b", venue: { id: "v2", name: "B" } }),
      makeEvent({ id: "c", venue: null }),
    ];
    const groups = groupEventsByVenue(events);
    const totalEvents = groups.reduce((sum, g) => sum + g.events.length, 0);
    expect(totalEvents).toBe(3);
  });
});

describe("sortVenueGroups", () => {
  it("sorts by event count descending", () => {
    const g1 = { venueId: "v1", venueName: "Small", events: [makeEvent()] };
    const g2 = { venueId: "v2", venueName: "Big", events: [makeEvent(), makeEvent(), makeEvent()] };
    const sorted = sortVenueGroups([g1, g2]);
    expect(sorted[0].venueId).toBe("v2");
  });

  it("puts unknown venue last", () => {
    const known = { venueId: "v1", venueName: "Main", events: [makeEvent()] };
    const unknown = { venueId: null, venueName: "Scène inconnue", events: [makeEvent()] };
    const sorted = sortVenueGroups([unknown, known]);
    expect(sorted[0].venueId).toBe("v1");
    expect(sorted[1].venueId).toBeNull();
  });

  it("sorts alphabetically when event counts are equal", () => {
    const g1 = { venueId: "v1", venueName: "Zebra", events: [makeEvent()] };
    const g2 = { venueId: "v2", venueName: "Alpha", events: [makeEvent()] };
    const sorted = sortVenueGroups([g1, g2]);
    expect(sorted[0].venueName).toBe("Alpha");
  });

  it("does not mutate input", () => {
    const groups = [
      { venueId: "v1", venueName: "B", events: [makeEvent(), makeEvent()] },
      { venueId: "v2", venueName: "A", events: [makeEvent(), makeEvent(), makeEvent()] },
    ];
    const original = [...groups];
    sortVenueGroups(groups);
    expect(groups).toEqual(original);
  });
});

describe("sortEventsWithinGroup", () => {
  it("sorts by startTime ascending", () => {
    const e1 = makeEvent({ id: "e1", startTime: "2026-06-20T22:00:00Z" });
    const e2 = makeEvent({ id: "e2", startTime: "2026-06-20T20:00:00Z" });
    const sorted = sortEventsWithinGroup([e1, e2]);
    expect(sorted[0].id).toBe("e2");
  });

  it("puts events without startTime last", () => {
    const withTime = makeEvent({ id: "a", startTime: "2026-06-20T20:00:00Z" });
    const noTime = makeEvent({ id: "b", startTime: null });
    const sorted = sortEventsWithinGroup([noTime, withTime]);
    expect(sorted[0].id).toBe("a");
  });

  it("does not mutate input", () => {
    const events = [makeEvent({ id: "a" }), makeEvent({ id: "b" })];
    const original = [...events];
    sortEventsWithinGroup(events);
    expect(events[0].id).toBe(original[0].id);
  });
});

describe("countEventsPerVenue", () => {
  it("counts correctly", () => {
    const events = [
      makeEvent({ venue: { id: "v1", name: "Main" } }),
      makeEvent({ venue: { id: "v1", name: "Main" } }),
      makeEvent({ venue: { id: "v2", name: "Temple" } }),
    ];
    const counts = countEventsPerVenue(events);
    expect(counts["v1"]).toBe(2);
    expect(counts["v2"]).toBe(1);
  });

  it("groups null venue under __no_venue__", () => {
    const events = [makeEvent({ venue: null }), makeEvent({ venue: null })];
    const counts = countEventsPerVenue(events);
    expect(counts["__no_venue__"]).toBe(2);
  });

  it("returns empty for empty input", () => {
    expect(countEventsPerVenue([])).toEqual({});
  });
});
