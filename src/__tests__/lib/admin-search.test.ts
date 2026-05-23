import { describe, it, expect } from "vitest";
import {
  scoreSearchResult,
  rankSearchResults,
  formatFestivalSearchResult,
  formatUserSearchResult,
  type AdminSearchResult,
} from "@/lib/admin-search";

const makeResult = (label: string, sublabel = ""): AdminSearchResult => ({
  type: "festival",
  id: "1",
  label,
  sublabel,
  href: "/admin/festivals",
});

describe("scoreSearchResult", () => {
  it("returns 100 for exact match", () => {
    expect(scoreSearchResult(makeResult("hellfest"), "hellfest")).toBe(100);
  });
  it("returns 80 for prefix match", () => {
    expect(scoreSearchResult(makeResult("hellfest open air"), "hellfest")).toBe(80);
  });
  it("returns 60 for substring match in label", () => {
    expect(scoreSearchResult(makeResult("les eurockéennes"), "euro")).toBe(60);
  });
  it("returns 40 for sublabel match", () => {
    expect(scoreSearchResult(makeResult("Festival X", "rock-en-seine"), "rock")).toBe(40);
  });
  it("returns 0 for no match", () => {
    expect(scoreSearchResult(makeResult("Hellfest"), "glastonbury")).toBe(0);
  });
  it("returns 0 for empty query", () => {
    expect(scoreSearchResult(makeResult("Hellfest"), "")).toBe(0);
  });
  it("is case-insensitive", () => {
    expect(scoreSearchResult(makeResult("Hellfest"), "HELLFEST")).toBe(100);
  });
});

describe("rankSearchResults", () => {
  const results: AdminSearchResult[] = [
    { ...makeResult("hellfest open air", "hellfest-open"), id: "1" },
    { ...makeResult("hellfest", "hellfest"), id: "2" },
    { ...makeResult("les eurockéennes", "eurock"), id: "3" },
    { ...makeResult("glastonbury", "glastonbury"), id: "4" },
  ];

  it("returns only matching results", () => {
    const ranked = rankSearchResults(results, "hellfest");
    expect(ranked.map((r) => r.id)).not.toContain("3");
    expect(ranked.map((r) => r.id)).not.toContain("4");
  });

  it("puts exact match first", () => {
    const ranked = rankSearchResults(results, "hellfest");
    expect(ranked[0].id).toBe("2");
  });

  it("returns empty for empty query", () => {
    expect(rankSearchResults(results, "")).toHaveLength(0);
  });

  it("returns empty when no match", () => {
    expect(rankSearchResults(results, "zzzzz_no_match")).toHaveLength(0);
  });
});

describe("formatFestivalSearchResult", () => {
  it("maps id, label, sublabel, href correctly", () => {
    const result = formatFestivalSearchResult({
      id: "abc",
      name: "Hellfest",
      slug: "hellfest",
      ingestionStatus: "vérifié",
    });
    expect(result.type).toBe("festival");
    expect(result.label).toBe("Hellfest");
    expect(result.sublabel).toContain("hellfest");
    expect(result.sublabel).toContain("vérifié");
    expect(result.href).toContain("/admin/festivals/hellfest");
  });
});

describe("formatUserSearchResult", () => {
  it("uses pseudo when available", () => {
    const result = formatUserSearchResult({
      id: "u1",
      pseudo: "NomadeSonic",
      name: "John Doe",
      email: "john@example.com",
      role: "user",
    });
    expect(result.label).toBe("NomadeSonic");
  });
  it("falls back to name then email", () => {
    const resultName = formatUserSearchResult({ id: "u2", pseudo: null, name: "Jane", email: "jane@test.com", role: "user" });
    expect(resultName.label).toBe("Jane");
    const resultEmail = formatUserSearchResult({ id: "u3", pseudo: null, name: null, email: "anon@test.com", role: "user" });
    expect(resultEmail.label).toBe("anon@test.com");
  });
});
