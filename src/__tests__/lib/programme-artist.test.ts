import { describe, expect, it } from "vitest";
import {
  type ArtistFilterable,
  buildArtistFilterAriaLabel,
  countArtistAppearances,
  getArtistsWithMultipleSlots,
  getUniqueArtistNames,
  matchesArtistFilter,
} from "@/lib/programme-artist";

const makeEvent = (name: string | null): ArtistFilterable => ({
  artist: name ? { name } : null,
});

describe("matchesArtistFilter", () => {
  it("returns true when filter is null (no filter)", () => {
    expect(matchesArtistFilter(makeEvent("Iron Maiden"), null)).toBe(true);
  });
  it("returns true for matching artist name", () => {
    expect(matchesArtistFilter(makeEvent("Iron Maiden"), "Iron Maiden")).toBe(true);
  });
  it("is case-insensitive", () => {
    expect(matchesArtistFilter(makeEvent("Iron Maiden"), "iron maiden")).toBe(true);
  });
  it("returns false for non-matching artist", () => {
    expect(matchesArtistFilter(makeEvent("Metallica"), "Iron Maiden")).toBe(false);
  });
  it("returns false when event has no artist", () => {
    expect(matchesArtistFilter(makeEvent(null), "Iron Maiden")).toBe(false);
  });
});

describe("getUniqueArtistNames", () => {
  it("returns unique names sorted alphabetically", () => {
    const events = [makeEvent("Metallica"), makeEvent("Iron Maiden"), makeEvent("Metallica")];
    const names = getUniqueArtistNames(events);
    expect(names).toEqual(["Iron Maiden", "Metallica"]);
  });
  it("ignores events without artists", () => {
    const events = [makeEvent(null), makeEvent("Slayer"), makeEvent(null)];
    expect(getUniqueArtistNames(events)).toEqual(["Slayer"]);
  });
  it("returns empty array for all-null artists", () => {
    expect(getUniqueArtistNames([makeEvent(null)])).toEqual([]);
  });
});

describe("countArtistAppearances", () => {
  it("counts appearances correctly", () => {
    const events = [
      makeEvent("Metallica"),
      makeEvent("Iron Maiden"),
      makeEvent("Metallica"),
      makeEvent("Metallica"),
    ];
    const counts = countArtistAppearances(events);
    expect(counts.get("Metallica")).toBe(3);
    expect(counts.get("Iron Maiden")).toBe(1);
  });
  it("ignores null artists", () => {
    const counts = countArtistAppearances([makeEvent(null)]);
    expect(counts.size).toBe(0);
  });
});

describe("getArtistsWithMultipleSlots", () => {
  it("returns only artists with count > 1", () => {
    const events = [makeEvent("Metallica"), makeEvent("Metallica"), makeEvent("Iron Maiden")];
    const multi = getArtistsWithMultipleSlots(events);
    expect(multi).toContain("Metallica");
    expect(multi).not.toContain("Iron Maiden");
  });
  it("returns sorted list", () => {
    const events = [makeEvent("Zebra"), makeEvent("Zebra"), makeEvent("Alpha"), makeEvent("Alpha")];
    const multi = getArtistsWithMultipleSlots(events);
    expect(multi[0]).toBe("Alpha");
  });
});

describe("buildArtistFilterAriaLabel", () => {
  it("singular 'set' for 1 appearance", () => {
    expect(buildArtistFilterAriaLabel("Metallica", 1)).toContain("1 set");
    expect(buildArtistFilterAriaLabel("Metallica", 1)).not.toContain("sets");
  });
  it("plural 'sets' for multiple appearances", () => {
    expect(buildArtistFilterAriaLabel("Metallica", 3)).toContain("3 sets");
  });
  it("includes artist name", () => {
    expect(buildArtistFilterAriaLabel("Iron Maiden", 2)).toContain("Iron Maiden");
  });
});
