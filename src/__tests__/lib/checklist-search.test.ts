import { describe, expect, it } from "vitest";
import { filterChecklistByQuery } from "@/lib/checklist-search";

const items = [
  { label: "Tente de camping", assigneeName: "Alice" },
  { label: "Chargeur téléphone", assigneeName: "Bob" },
  { label: "Crème solaire", assigneeName: null },
  { label: "Bouteille d'eau", assigneeName: "Alice" },
];

describe("filterChecklistByQuery", () => {
  it("returns all items for empty query", () => {
    expect(filterChecklistByQuery(items, "")).toHaveLength(4);
    expect(filterChecklistByQuery(items, "   ")).toHaveLength(4);
  });

  it("filters by label (case-insensitive)", () => {
    const result = filterChecklistByQuery(items, "tent");
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Tente de camping");
  });

  it("filters by assigneeName", () => {
    const result = filterChecklistByQuery(items, "alice");
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.assigneeName === "Alice")).toBe(true);
  });

  it("matches partial label substring", () => {
    const result = filterChecklistByQuery(items, "eau");
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((i) => i.label.includes("eau") || i.label.includes("Eau"))).toBe(true);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterChecklistByQuery(items, "xyz999")).toHaveLength(0);
  });

  it("handles items with null assigneeName", () => {
    const result = filterChecklistByQuery(items, "crème");
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Crème solaire");
  });

  it("returns all items for empty list", () => {
    expect(filterChecklistByQuery([], "tent")).toHaveLength(0);
  });
});
