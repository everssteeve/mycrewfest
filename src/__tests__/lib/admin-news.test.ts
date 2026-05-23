import { describe, it, expect } from "vitest";
import {
  filterAdminNews,
  sortAdminNewsByDate,
  countCritiqueNews,
  countPinnedNews,
  type AdminNewsRow,
} from "@/lib/admin-news";

function makeRow(overrides: Partial<AdminNewsRow> = {}): AdminNewsRow {
  return {
    id: "id1",
    festivalId: "f1",
    festivalName: "Hellfest",
    festivalSlug: "hellfest-2026",
    source: "instagram",
    sourceUrl: null,
    publishedAt: "2026-05-01T10:00:00.000Z",
    category: "line-up",
    summary: "Annonce de la programmation complète.",
    urgencyLevel: "normal",
    isPinned: false,
    ...overrides,
  };
}

const NEWS: AdminNewsRow[] = [
  makeRow({ id: "n1", festivalName: "Hellfest", summary: "Annonce du lineup.", urgencyLevel: "normal", isPinned: true, publishedAt: "2026-05-10T00:00:00.000Z" }),
  makeRow({ id: "n2", festivalName: "Solidays", summary: "Changement de scène.", urgencyLevel: "critique", isPinned: false, publishedAt: "2026-05-15T00:00:00.000Z", category: "logistique" }),
  makeRow({ id: "n3", festivalName: "Vieilles Charrues", summary: "Billetterie ouverte.", urgencyLevel: "normal", isPinned: false, publishedAt: "2026-04-20T00:00:00.000Z", category: "autre" }),
  makeRow({ id: "n4", festivalName: "Hellfest", summary: "Annulation d'un artiste.", urgencyLevel: "critique", isPinned: true, publishedAt: "2026-05-20T00:00:00.000Z", category: "annulation" }),
];

describe("filterAdminNews", () => {
  it("returns all items when no filters", () => {
    expect(filterAdminNews(NEWS, "", "", "")).toHaveLength(4);
  });

  it("filters by festivalName (case-insensitive)", () => {
    const result = filterAdminNews(NEWS, "hell", "", "");
    expect(result.map((n) => n.id)).toEqual(["n1", "n4"]);
  });

  it("filters by summary keyword", () => {
    const result = filterAdminNews(NEWS, "billetterie", "", "");
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("n3");
  });

  it("filters by urgencyLevel = critique", () => {
    const result = filterAdminNews(NEWS, "", "critique", "");
    expect(result.map((n) => n.id)).toContain("n2");
    expect(result.map((n) => n.id)).toContain("n4");
    expect(result).toHaveLength(2);
  });

  it("filters by urgencyLevel = normal", () => {
    const result = filterAdminNews(NEWS, "", "normal", "");
    expect(result).toHaveLength(2);
  });

  it("filters by category", () => {
    const result = filterAdminNews(NEWS, "", "", "logistique");
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("n2");
  });

  it("combines query and urgency filter", () => {
    const result = filterAdminNews(NEWS, "hell", "critique", "");
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("n4");
  });

  it("returns empty when no match", () => {
    expect(filterAdminNews(NEWS, "zzznomatch", "", "")).toHaveLength(0);
  });

  it("query matches summary", () => {
    const result = filterAdminNews(NEWS, "annonce", "", "");
    expect(result.map((n) => n.id)).toContain("n1");
  });
});

describe("sortAdminNewsByDate", () => {
  it("sorts by publishedAt descending", () => {
    const sorted = sortAdminNewsByDate(NEWS);
    expect(sorted[0]!.id).toBe("n4"); // 2026-05-20
    expect(sorted[1]!.id).toBe("n2"); // 2026-05-15
    expect(sorted[2]!.id).toBe("n1"); // 2026-05-10
    expect(sorted[3]!.id).toBe("n3"); // 2026-04-20
  });

  it("does not mutate the original array", () => {
    const original = [...NEWS];
    sortAdminNewsByDate(NEWS);
    expect(NEWS.map((n) => n.id)).toEqual(original.map((n) => n.id));
  });

  it("handles empty array", () => {
    expect(sortAdminNewsByDate([])).toHaveLength(0);
  });
});

describe("countCritiqueNews", () => {
  it("counts critiques correctly", () => {
    expect(countCritiqueNews(NEWS)).toBe(2);
  });

  it("returns 0 when no critiques", () => {
    const noCrit = NEWS.filter((n) => n.urgencyLevel !== "critique");
    expect(countCritiqueNews(noCrit)).toBe(0);
  });

  it("returns 0 for empty array", () => {
    expect(countCritiqueNews([])).toBe(0);
  });
});

describe("countPinnedNews", () => {
  it("counts pinned correctly", () => {
    expect(countPinnedNews(NEWS)).toBe(2);
  });

  it("returns 0 when none pinned", () => {
    const noPinned = NEWS.map((n) => ({ ...n, isPinned: false }));
    expect(countPinnedNews(noPinned)).toBe(0);
  });

  it("returns 0 for empty array", () => {
    expect(countPinnedNews([])).toBe(0);
  });
});
