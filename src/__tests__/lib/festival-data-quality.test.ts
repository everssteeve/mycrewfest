import { describe, it, expect } from "vitest";
import {
  computeDataQualityScore,
  getQualityGrade,
  getQualityGradeColor,
  runQualityChecks,
  countByGrade,
  type FestivalQualityInput,
} from "@/lib/festival-data-quality";

function makeInput(overrides: Partial<FestivalQualityInput> = {}): FestivalQualityInput {
  return {
    name: "Hellfest",
    description: "Le plus grand festival de metal en France.",
    city: "Clisson",
    latitude: 47.0881,
    longitude: -1.2819,
    capacity: 60000,
    siteUrl: "https://hellfest.fr",
    instagramHandle: "@hellfest",
    programStatus: "complet",
    ingestionStatus: "enrichi",
    eventCount: 150,
    ...overrides,
  };
}

describe("runQualityChecks", () => {
  it("returns one check per criterion", () => {
    const checks = runQualityChecks(makeInput());
    expect(checks.length).toBeGreaterThan(0);
    expect(checks.every((c) => typeof c.passed === "boolean")).toBe(true);
  });

  it("fails events check when eventCount is 0", () => {
    const checks = runQualityChecks(makeInput({ eventCount: 0 }));
    const evCheck = checks.find((c) => c.key === "events");
    expect(evCheck?.passed).toBe(false);
  });

  it("fails description check for short description", () => {
    const checks = runQualityChecks(makeInput({ description: "Court." }));
    const dCheck = checks.find((c) => c.key === "description");
    expect(dCheck?.passed).toBe(false);
  });

  it("fails coordinates check when null", () => {
    const checks = runQualityChecks(makeInput({ latitude: null, longitude: null }));
    const coordCheck = checks.find((c) => c.key === "coordinates");
    expect(coordCheck?.passed).toBe(false);
  });
});

describe("computeDataQualityScore", () => {
  it("returns 100 for a fully complete festival", () => {
    expect(computeDataQualityScore(makeInput())).toBe(100);
  });

  it("returns 0 when no fields are filled", () => {
    const score = computeDataQualityScore(
      makeInput({
        description: null,
        latitude: null,
        longitude: null,
        capacity: null,
        siteUrl: null,
        instagramHandle: null,
        programStatus: "bientôt_disponible",
        eventCount: 0,
      }),
    );
    expect(score).toBe(0);
  });

  it("returns a value between 0 and 100", () => {
    const score = computeDataQualityScore(makeInput({ eventCount: 0, programStatus: "partiel" }));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("is higher with more fields filled", () => {
    const sparse = computeDataQualityScore(
      makeInput({ description: null, capacity: null, latitude: null, longitude: null }),
    );
    const full = computeDataQualityScore(makeInput());
    expect(full).toBeGreaterThan(sparse);
  });

  it("returns an integer", () => {
    const score = computeDataQualityScore(makeInput({ eventCount: 5 }));
    expect(Number.isInteger(score)).toBe(true);
  });
});

describe("getQualityGrade", () => {
  it("A for score >= 80", () => {
    expect(getQualityGrade(80)).toBe("A");
    expect(getQualityGrade(100)).toBe("A");
  });

  it("B for score 55-79", () => {
    expect(getQualityGrade(55)).toBe("B");
    expect(getQualityGrade(79)).toBe("B");
  });

  it("C for score 30-54", () => {
    expect(getQualityGrade(30)).toBe("C");
    expect(getQualityGrade(54)).toBe("C");
  });

  it("D for score < 30", () => {
    expect(getQualityGrade(0)).toBe("D");
    expect(getQualityGrade(29)).toBe("D");
  });
});

describe("getQualityGradeColor", () => {
  it("returns a CSS variable for each grade", () => {
    const grades = ["A", "B", "C", "D"] as const;
    for (const g of grades) {
      expect(getQualityGradeColor(g)).toContain("var(");
    }
  });
});

describe("countByGrade", () => {
  it("counts festivals by grade", () => {
    const festivals = [
      { score: 90 }, // A
      { score: 60 }, // B
      { score: 40 }, // C
      { score: 10 }, // D
      { score: 85 }, // A
    ];
    const counts = countByGrade(festivals);
    expect(counts.A).toBe(2);
    expect(counts.B).toBe(1);
    expect(counts.C).toBe(1);
    expect(counts.D).toBe(1);
  });

  it("returns zeros for empty array", () => {
    const counts = countByGrade([]);
    expect(Object.values(counts).every((v) => v === 0)).toBe(true);
  });
});
