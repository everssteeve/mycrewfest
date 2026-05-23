import { describe, expect, it } from "vitest";
import {
  filterAdminFestivals,
  matchesFestivalNameQuery,
  matchesFestivalStatusFilter,
} from "@/lib/admin-festival-filter";

function fest(name: string, status: string) {
  return { name, ingestionStatus: status };
}

// ---------------------------------------------------------------------------
// matchesFestivalStatusFilter
// ---------------------------------------------------------------------------

describe("matchesFestivalStatusFilter", () => {
  it("returns true for 'tous' regardless of status", () => {
    expect(matchesFestivalStatusFilter(fest("A", "détecté"), "tous")).toBe(true);
    expect(matchesFestivalStatusFilter(fest("A", "enrichi"), "tous")).toBe(true);
  });

  it("returns true when status matches exactly", () => {
    expect(matchesFestivalStatusFilter(fest("A", "vérifié"), "vérifié")).toBe(true);
  });

  it("returns false when status does not match", () => {
    expect(matchesFestivalStatusFilter(fest("A", "détecté"), "vérifié")).toBe(false);
  });

  it("handles enrichi status correctly", () => {
    expect(matchesFestivalStatusFilter(fest("A", "enrichi"), "enrichi")).toBe(true);
    expect(matchesFestivalStatusFilter(fest("A", "détecté"), "enrichi")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// matchesFestivalNameQuery
// ---------------------------------------------------------------------------

describe("matchesFestivalNameQuery", () => {
  it("returns true for empty query", () => {
    expect(matchesFestivalNameQuery(fest("Rock en Seine", "vérifié"), "")).toBe(true);
    expect(matchesFestivalNameQuery(fest("Rock en Seine", "vérifié"), "   ")).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(matchesFestivalNameQuery(fest("Rock en Seine", "vérifié"), "rock")).toBe(true);
    expect(matchesFestivalNameQuery(fest("Rock en Seine", "vérifié"), "SEINE")).toBe(true);
  });

  it("matches partial name", () => {
    expect(matchesFestivalNameQuery(fest("Les Vieilles Charrues", "vérifié"), "vieil")).toBe(true);
  });

  it("returns false when name does not contain query", () => {
    expect(matchesFestivalNameQuery(fest("Rock en Seine", "vérifié"), "jazz")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// filterAdminFestivals
// ---------------------------------------------------------------------------

describe("filterAdminFestivals", () => {
  const festivals = [
    fest("Rock en Seine", "détecté"),
    fest("Hellfest", "vérifié"),
    fest("Les Vieilles Charrues", "enrichi"),
    fest("Eurockéennes", "détecté"),
  ];

  it("returns all for empty query and tous filter", () => {
    expect(filterAdminFestivals(festivals, "", "tous")).toHaveLength(4);
  });

  it("filters by status only", () => {
    const result = filterAdminFestivals(festivals, "", "détecté");
    expect(result).toHaveLength(2);
    expect(result.every((f) => f.ingestionStatus === "détecté")).toBe(true);
  });

  it("filters by query only", () => {
    const result = filterAdminFestivals(festivals, "hellfest", "tous");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Hellfest");
  });

  it("applies both query and status filter", () => {
    const result = filterAdminFestivals(festivals, "euro", "détecté");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Eurockéennes");
  });

  it("returns empty when nothing matches", () => {
    expect(filterAdminFestivals(festivals, "glastonbury", "tous")).toHaveLength(0);
  });
});
