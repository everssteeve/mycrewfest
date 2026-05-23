import { describe, it, expect } from "vitest";
import {
  escapeCsvCell,
  buildCsvRow,
  buildCsvContent,
  festivalsToCsv,
  usersToCsv,
  type FestivalExportRow,
  type UserExportRow,
} from "@/lib/admin-export";

describe("escapeCsvCell", () => {
  it("returns empty string for null/undefined", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });
  it("returns plain string as-is when no special chars", () => {
    expect(escapeCsvCell("Hellfest")).toBe("Hellfest");
  });
  it("wraps in quotes when value contains comma", () => {
    expect(escapeCsvCell("Paris, France")).toBe('"Paris, France"');
  });
  it("escapes double quotes inside quoted fields", () => {
    expect(escapeCsvCell('He said "hello"')).toBe('"He said ""hello"""');
  });
  it("wraps in quotes when value contains newline", () => {
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
  });
  it("converts numbers to string", () => {
    expect(escapeCsvCell(42)).toBe("42");
  });
});

describe("buildCsvRow", () => {
  it("joins cells with commas", () => {
    expect(buildCsvRow(["A", "B", "C"])).toBe("A,B,C");
  });
  it("handles cells with commas", () => {
    const row = buildCsvRow(["Rock en Seine", "Paris, France", "2025"]);
    expect(row).toBe('Rock en Seine,"Paris, France",2025');
  });
});

describe("buildCsvContent", () => {
  it("puts header first, then rows", () => {
    const csv = buildCsvContent(["Col1", "Col2"], [["A", "B"], ["C", "D"]]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Col1,Col2");
    expect(lines[1]).toBe("A,B");
    expect(lines[2]).toBe("C,D");
  });
  it("returns only header for empty rows", () => {
    const csv = buildCsvContent(["H1", "H2"], []);
    expect(csv).toBe("H1,H2");
  });
});

describe("festivalsToCsv", () => {
  const festival: FestivalExportRow = {
    id: "abc",
    name: "Hellfest Open Air",
    slug: "hellfest-open-air",
    festivalType: "metal",
    startDate: new Date("2025-06-18"),
    endDate: new Date("2025-06-22"),
    city: "Clisson",
    country: "FR",
    ingestionStatus: "vérifié",
    confidenceLevel: "auto",
  };

  it("produces CSV with correct header", () => {
    const csv = festivalsToCsv([festival]);
    const firstLine = csv.split("\n")[0];
    expect(firstLine).toContain("Nom");
    expect(firstLine).toContain("Slug");
  });

  it("includes festival data in second line", () => {
    const csv = festivalsToCsv([festival]);
    const secondLine = csv.split("\n")[1];
    expect(secondLine).toContain("Hellfest Open Air");
    expect(secondLine).toContain("Clisson");
  });

  it("returns header-only CSV for empty array", () => {
    const csv = festivalsToCsv([]);
    expect(csv.split("\n")).toHaveLength(1);
  });
});

describe("usersToCsv", () => {
  const user: UserExportRow = {
    id: "u1",
    email: "test@example.com",
    pseudo: "NomadeSonic",
    name: "John Doe",
    role: "user",
    createdAt: new Date("2025-01-15"),
  };

  it("produces CSV with correct header", () => {
    const csv = usersToCsv([user]);
    expect(csv.split("\n")[0]).toContain("Email");
    expect(csv.split("\n")[0]).toContain("Pseudo");
  });

  it("includes user data", () => {
    const csv = usersToCsv([user]);
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toContain("test@example.com");
    expect(dataLine).toContain("NomadeSonic");
  });

  it("handles null pseudo/name gracefully", () => {
    const u: UserExportRow = { ...user, pseudo: null, name: null };
    const csv = usersToCsv([u]);
    expect(csv.split("\n")[1]).toBeTruthy();
  });
});
