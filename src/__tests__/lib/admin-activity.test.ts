import { describe, it, expect } from "vitest";
import {
  filterActivityEntries,
  sortActivityEntriesDesc,
  formatActivityTimestamp,
  countActivityByType,
  type ActivityEntry,
} from "@/lib/admin-activity";

const makeEntry = (
  id: string,
  type: ActivityEntry["type"],
  occurredAt: Date,
): ActivityEntry => ({
  id,
  type,
  label: `Label ${id}`,
  detail: `Detail ${id}`,
  occurredAt,
});

const entries: ActivityEntry[] = [
  makeEntry("1", "user_signup", new Date("2025-06-01T10:00:00Z")),
  makeEntry("2", "signal_posted", new Date("2025-06-02T12:00:00Z")),
  makeEntry("3", "submission_received", new Date("2025-06-01T09:00:00Z")),
  makeEntry("4", "festival_detected", new Date("2025-06-03T08:00:00Z")),
  makeEntry("5", "user_signup", new Date("2025-06-02T07:00:00Z")),
];

describe("filterActivityEntries", () => {
  it("returns all entries when type is 'all'", () => {
    expect(filterActivityEntries(entries, "all")).toHaveLength(5);
  });

  it("filters by user_signup", () => {
    const result = filterActivityEntries(entries, "user_signup");
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.type === "user_signup")).toBe(true);
  });

  it("filters by signal_posted", () => {
    const result = filterActivityEntries(entries, "signal_posted");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("filters by submission_received", () => {
    const result = filterActivityEntries(entries, "submission_received");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("filters by festival_detected", () => {
    const result = filterActivityEntries(entries, "festival_detected");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("4");
  });

  it("returns empty array when no matches", () => {
    expect(filterActivityEntries([], "user_signup")).toHaveLength(0);
  });
});

describe("sortActivityEntriesDesc", () => {
  it("sorts most recent first", () => {
    const sorted = sortActivityEntriesDesc(entries);
    expect(sorted[0].id).toBe("4"); // 2025-06-03
    expect(sorted[4].id).toBe("3"); // 2025-06-01T09:00
  });

  it("does not mutate the input array", () => {
    const copy = [...entries];
    sortActivityEntriesDesc(entries);
    expect(entries).toEqual(copy);
  });

  it("handles empty array", () => {
    expect(sortActivityEntriesDesc([])).toEqual([]);
  });
});

describe("formatActivityTimestamp", () => {
  it("returns a non-empty string for any date", () => {
    const result = formatActivityTimestamp(new Date("2025-06-01T10:30:00Z"));
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("countActivityByType", () => {
  it("counts each type correctly", () => {
    const counts = countActivityByType(entries);
    expect(counts.user_signup).toBe(2);
    expect(counts.signal_posted).toBe(1);
    expect(counts.submission_received).toBe(1);
    expect(counts.festival_detected).toBe(1);
  });

  it("returns zeros for empty input", () => {
    const counts = countActivityByType([]);
    expect(counts.user_signup).toBe(0);
    expect(counts.signal_posted).toBe(0);
    expect(counts.submission_received).toBe(0);
    expect(counts.festival_detected).toBe(0);
  });
});
