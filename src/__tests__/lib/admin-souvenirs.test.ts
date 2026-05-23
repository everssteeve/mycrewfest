import { describe, expect, it } from "vitest";
import {
  type AdminSouvenirRow,
  computeSouvenirStats,
  countRecentSouvenirs,
  filterSouvenirs,
  sortSouvenirsByDate,
  topContributors,
} from "@/lib/admin-souvenirs";

const makeRow = (overrides: Partial<AdminSouvenirRow> & { id: string }): AdminSouvenirRow => ({
  userId: "u1",
  userName: "Alice",
  festivalName: "Hellfest",
  festivalSlug: "hellfest",
  freeText: null,
  note: null,
  hasPhotos: false,
  shareWithCrew: false,
  createdAt: "2026-07-01T10:00:00.000Z",
  ...overrides,
});

const rows: AdminSouvenirRow[] = [
  makeRow({
    id: "s1",
    freeText: "Super concert",
    hasPhotos: true,
    shareWithCrew: true,
    createdAt: "2026-07-03T12:00:00.000Z",
  }),
  makeRow({
    id: "s2",
    userId: "u2",
    userName: "Bob",
    note: "Ambiance incroyable",
    createdAt: "2026-07-02T10:00:00.000Z",
  }),
  makeRow({ id: "s3", userId: "u2", userName: "Bob", createdAt: "2026-07-01T08:00:00.000Z" }),
];

describe("computeSouvenirStats", () => {
  it("counts total correctly", () => {
    expect(computeSouvenirStats(rows).total).toBe(3);
  });

  it("counts withText (freeText or note)", () => {
    expect(computeSouvenirStats(rows).withText).toBe(2);
  });

  it("counts withPhotos", () => {
    expect(computeSouvenirStats(rows).withPhotos).toBe(1);
  });

  it("counts sharedWithCrew", () => {
    expect(computeSouvenirStats(rows).sharedWithCrew).toBe(1);
  });

  it("handles empty array", () => {
    const stats = computeSouvenirStats([]);
    expect(stats.total).toBe(0);
    expect(stats.withText).toBe(0);
  });
});

describe("sortSouvenirsByDate", () => {
  it("sorts descending by createdAt", () => {
    const sorted = sortSouvenirsByDate(rows);
    expect(sorted[0].id).toBe("s1");
    expect(sorted[2].id).toBe("s3");
  });

  it("does not mutate input", () => {
    const copy = [...rows];
    sortSouvenirsByDate(rows);
    expect(rows[0].id).toBe(copy[0].id);
  });
});

describe("filterSouvenirs", () => {
  it("returns all when query is empty", () => {
    expect(filterSouvenirs(rows, "")).toHaveLength(3);
    expect(filterSouvenirs(rows, "  ")).toHaveLength(3);
  });

  it("filters by user name", () => {
    expect(filterSouvenirs(rows, "bob")).toHaveLength(2);
  });

  it("filters by festival name", () => {
    expect(filterSouvenirs(rows, "hell")).toHaveLength(3);
  });

  it("filters by freeText", () => {
    expect(filterSouvenirs(rows, "concert")).toHaveLength(1);
  });

  it("filters by note", () => {
    expect(filterSouvenirs(rows, "incroyable")).toHaveLength(1);
  });

  it("returns empty when no match", () => {
    expect(filterSouvenirs(rows, "zzznomatch")).toHaveLength(0);
  });
});

describe("countRecentSouvenirs", () => {
  it("counts souvenirs in the past 7 days", () => {
    const now = new Date("2026-07-05T00:00:00.000Z");
    expect(countRecentSouvenirs(rows, now, 7)).toBe(3);
  });

  it("returns 0 when all are older than cutoff", () => {
    const now = new Date("2026-07-15T00:00:00.000Z");
    expect(countRecentSouvenirs(rows, now, 7)).toBe(0);
  });
});

describe("topContributors", () => {
  it("aggregates by userId and sorts by count desc", () => {
    const top = topContributors(rows);
    expect(top[0].userId).toBe("u2");
    expect(top[0].count).toBe(2);
    expect(top[1].userId).toBe("u1");
    expect(top[1].count).toBe(1);
  });

  it("respects limit", () => {
    expect(topContributors(rows, 1)).toHaveLength(1);
  });

  it("handles empty array", () => {
    expect(topContributors([])).toHaveLength(0);
  });
});
