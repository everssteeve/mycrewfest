import { describe, it, expect } from "vitest";
import { filterByAssignee, getUniqueAssignees, computeAssigneeStats, countUnassignedPendingItems, getMostLoadedAssignee } from "@/lib/checklist-filter";

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

describe("computeAssigneeStats", () => {
  const items = [
    { assigneeName: "Alice", done: true },
    { assigneeName: "Alice", done: false },
    { assigneeName: "Alice", done: true },
    { assigneeName: "Bob", done: false },
    { assigneeName: null, done: true },
  ];

  it("returns stats sorted alphabetically by name", () => {
    const result = computeAssigneeStats(items);
    expect(result.map((r) => r.assigneeName)).toEqual(["Alice", "Bob"]);
  });

  it("counts total and done correctly for each assignee", () => {
    const result = computeAssigneeStats(items);
    const alice = result.find((r) => r.assigneeName === "Alice")!;
    expect(alice.total).toBe(3);
    expect(alice.done).toBe(2);

    const bob = result.find((r) => r.assigneeName === "Bob")!;
    expect(bob.total).toBe(1);
    expect(bob.done).toBe(0);
  });

  it("computes percent correctly", () => {
    const result = computeAssigneeStats(items);
    const alice = result.find((r) => r.assigneeName === "Alice")!;
    expect(alice.percent).toBe(67);

    const bob = result.find((r) => r.assigneeName === "Bob")!;
    expect(bob.percent).toBe(0);
  });

  it("excludes items with null assigneeName", () => {
    const result = computeAssigneeStats(items);
    expect(result.find((r) => r.assigneeName === null)).toBeUndefined();
    expect(result).toHaveLength(2);
  });

  it("returns 100% when all tasks done", () => {
    const all = [
      { assigneeName: "Carol", done: true },
      { assigneeName: "Carol", done: true },
    ];
    const result = computeAssigneeStats(all);
    expect(result[0].percent).toBe(100);
  });

  it("returns empty array for empty list", () => {
    expect(computeAssigneeStats([])).toEqual([]);
  });

  it("returns empty array when all items have no assignee", () => {
    const noAssignee = [{ assigneeName: null, done: false }];
    expect(computeAssigneeStats(noAssignee)).toEqual([]);
  });
});

describe("countUnassignedPendingItems", () => {
  it("returns 0 for empty list", () => {
    expect(countUnassignedPendingItems([])).toBe(0);
  });

  it("returns 0 when all items are assigned", () => {
    const items = [
      { assigneeName: "Alice", done: false },
      { assigneeName: "Bob", done: false },
    ];
    expect(countUnassignedPendingItems(items)).toBe(0);
  });

  it("counts unassigned pending items correctly", () => {
    const items = [
      { assigneeName: null, done: false },
      { assigneeName: null, done: false },
      { assigneeName: "Alice", done: false },
    ];
    expect(countUnassignedPendingItems(items)).toBe(2);
  });

  it("excludes done items even without assignee", () => {
    const items = [
      { assigneeName: null, done: true },
      { assigneeName: null, done: false },
    ];
    expect(countUnassignedPendingItems(items)).toBe(1);
  });

  it("returns 0 when all unassigned items are done", () => {
    const items = [
      { assigneeName: null, done: true },
      { assigneeName: "Bob", done: false },
    ];
    expect(countUnassignedPendingItems(items)).toBe(0);
  });
});

describe("getMostLoadedAssignee", () => {
  it("returns null for empty array", () => {
    expect(getMostLoadedAssignee([])).toBeNull();
  });

  it("returns null when all assigned items are done", () => {
    const items = [
      { assigneeName: "Alice", done: true },
      { assigneeName: "Bob", done: true },
    ];
    expect(getMostLoadedAssignee(items)).toBeNull();
  });

  it("returns the assignee with the most pending items", () => {
    const items = [
      { assigneeName: "Alice", done: false },
      { assigneeName: "Alice", done: false },
      { assigneeName: "Bob", done: false },
    ];
    expect(getMostLoadedAssignee(items)).toEqual({ assigneeName: "Alice", pendingCount: 2 });
  });

  it("breaks ties alphabetically", () => {
    const items = [
      { assigneeName: "Bob", done: false },
      { assigneeName: "Alice", done: false },
    ];
    expect(getMostLoadedAssignee(items)).toEqual({ assigneeName: "Alice", pendingCount: 1 });
  });

  it("ignores unassigned items and done items", () => {
    const items = [
      { assigneeName: null, done: false },
      { assigneeName: "Alice", done: true },
      { assigneeName: "Bob", done: false },
    ];
    expect(getMostLoadedAssignee(items)).toEqual({ assigneeName: "Bob", pendingCount: 1 });
  });
});
