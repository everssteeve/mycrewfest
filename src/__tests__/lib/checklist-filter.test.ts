import { describe, it, expect } from "vitest";
import { filterByAssignee, getUniqueAssignees } from "@/lib/checklist-filter";

describe("filterByAssignee", () => {
  const items = [
    { id: "1", assigneeName: "Alice", done: false },
    { id: "2", assigneeName: "Bob", done: false },
    { id: "3", assigneeName: "Alice", done: true },
    { id: "4", assigneeName: null, done: false },
  ];

  it("returns all items when assignee is null", () => {
    expect(filterByAssignee(items, null)).toHaveLength(4);
  });

  it("returns only items assigned to Alice", () => {
    const result = filterByAssignee(items, "Alice");
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.assigneeName === "Alice")).toBe(true);
  });

  it("returns only items assigned to Bob", () => {
    const result = filterByAssignee(items, "Bob");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("returns empty array when no items match", () => {
    expect(filterByAssignee(items, "Charlie")).toHaveLength(0);
  });

  it("excludes items with null assigneeName when filtering", () => {
    const result = filterByAssignee(items, "Alice");
    expect(result.some((i) => i.assigneeName === null)).toBe(false);
  });

  it("returns empty array for empty item list", () => {
    expect(filterByAssignee([], "Alice")).toHaveLength(0);
  });
});

describe("getUniqueAssignees", () => {
  it("returns sorted unique assignee names", () => {
    const items = [
      { assigneeName: "Bob" },
      { assigneeName: "Alice" },
      { assigneeName: "Bob" },
      { assigneeName: null },
    ];
    expect(getUniqueAssignees(items)).toEqual(["Alice", "Bob"]);
  });

  it("returns empty array when no assignees", () => {
    expect(getUniqueAssignees([{ assigneeName: null }, {}])).toEqual([]);
  });

  it("returns empty array for empty list", () => {
    expect(getUniqueAssignees([])).toEqual([]);
  });
});
