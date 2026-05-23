import { describe, expect, it } from "vitest";
import {
  filterUrgentNews,
  getUrgentBannerLabel,
  getUrgentCategoryLabel,
  hasUrgentNews,
} from "@/lib/news-urgency";

const now = new Date("2026-07-01T12:00:00Z").toISOString();

const items = [
  {
    id: "a",
    urgencyLevel: "critique",
    summary: "Sold out !",
    category: "billetterie",
    publishedAt: now,
  },
  {
    id: "b",
    urgencyLevel: "normal",
    summary: "Camping ouvert",
    category: "logistique",
    publishedAt: now,
  },
  {
    id: "c",
    urgencyLevel: "critique",
    summary: "Annulation artiste",
    category: "programmation",
    publishedAt: now,
  },
];

describe("filterUrgentNews", () => {
  it("keeps only critique items", () => {
    const result = filterUrgentNews(items);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("returns empty array when no urgent items", () => {
    const result = filterUrgentNews([items[1]!]);
    expect(result).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    expect(filterUrgentNews([])).toHaveLength(0);
  });

  it("converts Date objects to ISO string", () => {
    const d = new Date("2026-07-01T12:00:00Z");
    const result = filterUrgentNews([
      { id: "x", urgencyLevel: "critique", summary: "s", category: "autre", publishedAt: d },
    ]);
    expect(result[0]?.publishedAt).toBe("2026-07-01T12:00:00.000Z");
  });

  it("preserves string publishedAt unchanged", () => {
    const result = filterUrgentNews([items[0]!]);
    expect(result[0]?.publishedAt).toBe(now);
  });
});

describe("hasUrgentNews", () => {
  it("returns true when items exist", () => {
    expect(hasUrgentNews([{ id: "a", summary: "s", category: "c", publishedAt: now }])).toBe(true);
  });

  it("returns false for empty array", () => {
    expect(hasUrgentNews([])).toBe(false);
  });
});

describe("getUrgentBannerLabel", () => {
  it("uses singular for 1", () => {
    expect(getUrgentBannerLabel(1)).toBe("1 alerte urgente");
  });

  it("uses plural for 2+", () => {
    expect(getUrgentBannerLabel(2)).toBe("2 alertes urgentes");
    expect(getUrgentBannerLabel(5)).toBe("5 alertes urgentes");
  });
});

describe("getUrgentCategoryLabel", () => {
  it("maps known categories", () => {
    expect(getUrgentCategoryLabel("billetterie")).toBe("Billetterie");
    expect(getUrgentCategoryLabel("programmation")).toBe("Programme");
    expect(getUrgentCategoryLabel("logistique")).toBe("Logistique");
    expect(getUrgentCategoryLabel("securite")).toBe("Sécurité");
    expect(getUrgentCategoryLabel("annulation")).toBe("Annulation");
  });

  it("returns Info for unknown category", () => {
    expect(getUrgentCategoryLabel("inconnu")).toBe("Info");
    expect(getUrgentCategoryLabel("autre")).toBe("Info");
  });
});
