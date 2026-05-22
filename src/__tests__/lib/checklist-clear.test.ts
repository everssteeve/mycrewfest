import { describe, it, expect } from "vitest";
import { getDoneItemIds, filterPendingItems } from "@/lib/checklist-clear";

type Item = { id: string; done: boolean };

describe("getDoneItemIds", () => {
  it("returns empty array when no items are done", () => {
    const items: Item[] = [
      { id: "a", done: false },
      { id: "b", done: false },
    ];
    expect(getDoneItemIds(items)).toEqual([]);
  });

  it("returns IDs of done items only", () => {
    const items: Item[] = [
      { id: "a", done: true },
      { id: "b", done: false },
      { id: "c", done: true },
    ];
    expect(getDoneItemIds(items)).toEqual(["a", "c"]);
  });

  it("returns all IDs when all items are done", () => {
    const items: Item[] = [
      { id: "x", done: true },
      { id: "y", done: true },
    ];
    expect(getDoneItemIds(items)).toEqual(["x", "y"]);
  });

  it("returns empty array for empty input", () => {
    expect(getDoneItemIds([])).toEqual([]);
  });
});

describe("filterPendingItems", () => {
  it("returns only non-done items", () => {
    const items: Item[] = [
      { id: "a", done: false },
      { id: "b", done: true },
      { id: "c", done: false },
    ];
    const result = filterPendingItems(items);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual(["a", "c"]);
  });

  it("returns all items when none are done", () => {
    const items: Item[] = [
      { id: "a", done: false },
      { id: "b", done: false },
    ];
    expect(filterPendingItems(items)).toHaveLength(2);
  });

  it("returns empty array when all are done", () => {
    const items: Item[] = [
      { id: "a", done: true },
      { id: "b", done: true },
    ];
    expect(filterPendingItems(items)).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    expect(filterPendingItems([])).toEqual([]);
  });

  it("preserves extra fields on items", () => {
    const items = [
      { id: "a", done: false, label: "Tente" },
      { id: "b", done: true, label: "Duvet" },
    ];
    const result = filterPendingItems(items);
    expect(result[0].label).toBe("Tente");
  });
});
