import { describe, it, expect } from "vitest";
import { matchesProgrammeQuery, type SearchableEvent } from "@/lib/programme-search";

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
});
