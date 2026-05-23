import { describe, expect, it } from "vitest";
import {
  type AdminProgramRow,
  countFestivalsByProgramStatus,
  filterByStatus,
  filterIncompleteProgram,
  getProgramStatusColor,
  getProgramStatusLabel,
  sortByStartDate,
} from "@/lib/admin-programme";

function makeRow(overrides: Partial<AdminProgramRow> = {}): AdminProgramRow {
  return {
    id: "1",
    name: "Hellfest",
    slug: "hellfest-2026",
    city: "Clisson",
    startDate: "2026-06-19T00:00:00.000Z",
    programStatus: "complet",
    eventCount: 32,
    ...overrides,
  };
}

const rows: AdminProgramRow[] = [
  makeRow({ id: "1", programStatus: "complet", startDate: "2026-06-19T00:00:00.000Z" }),
  makeRow({ id: "2", programStatus: "partiel", startDate: "2026-07-03T00:00:00.000Z" }),
  makeRow({ id: "3", programStatus: "bientôt_disponible", startDate: "2026-05-01T00:00:00.000Z" }),
  makeRow({ id: "4", programStatus: "complet", startDate: "2026-08-15T00:00:00.000Z" }),
];

describe("countFestivalsByProgramStatus", () => {
  it("counts each status correctly", () => {
    const counts = countFestivalsByProgramStatus(rows);
    expect(counts.complet).toBe(2);
    expect(counts.partiel).toBe(1);
    expect(counts.bientôt_disponible).toBe(1);
  });

  it("returns zeros for empty array", () => {
    const counts = countFestivalsByProgramStatus([]);
    expect(counts.complet).toBe(0);
    expect(counts.partiel).toBe(0);
    expect(counts.bientôt_disponible).toBe(0);
  });
});

describe("filterIncompleteProgram", () => {
  it("excludes complet festivals", () => {
    const result = filterIncompleteProgram(rows);
    expect(result.every((f) => f.programStatus !== "complet")).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when all are complet", () => {
    const allComplet = rows.filter((f) => f.programStatus === "complet");
    expect(filterIncompleteProgram(allComplet)).toHaveLength(0);
  });
});

describe("sortByStartDate", () => {
  it("sorts ascending by startDate", () => {
    const sorted = sortByStartDate(rows);
    expect(sorted[0].startDate < sorted[1].startDate).toBe(true);
    expect(sorted[1].startDate < sorted[2].startDate).toBe(true);
  });

  it("does not mutate the input array", () => {
    const input = [...rows];
    sortByStartDate(input);
    expect(input).toEqual(rows);
  });
});

describe("filterByStatus", () => {
  it("returns all when status is 'all'", () => {
    expect(filterByStatus(rows, "all")).toHaveLength(rows.length);
  });

  it("filters by specific status", () => {
    const result = filterByStatus(rows, "partiel");
    expect(result.every((f) => f.programStatus === "partiel")).toBe(true);
  });

  it("returns empty for status with no matches", () => {
    const onlyComplet = rows.filter((f) => f.programStatus === "complet");
    expect(filterByStatus(onlyComplet, "partiel")).toHaveLength(0);
  });
});

describe("getProgramStatusLabel", () => {
  it("returns human-readable labels", () => {
    expect(getProgramStatusLabel("complet")).toBe("Complet");
    expect(getProgramStatusLabel("partiel")).toBe("Partiel");
    expect(getProgramStatusLabel("bientôt_disponible")).toBe("Bientôt dispo");
  });

  it("returns the raw value for unknown status", () => {
    expect(getProgramStatusLabel("unknown")).toBe("unknown");
  });
});

describe("getProgramStatusColor", () => {
  it("returns a CSS variable for known statuses", () => {
    expect(getProgramStatusColor("complet")).toContain("var(");
    expect(getProgramStatusColor("partiel")).toContain("var(");
    expect(getProgramStatusColor("bientôt_disponible")).toContain("var(");
  });

  it("returns a fallback for unknown status", () => {
    expect(getProgramStatusColor("unknown")).toContain("var(");
  });
});
