import { describe, it, expect } from "vitest";
import {
  getSubmissionStatusColor,
  getSubmissionStatusLabel,
  countSubmissionsByStatus,
  isSubmissionActionable,
  buildSubmissionSlug,
  type AdminSubmissionRow,
} from "@/lib/admin-submissions";

const makeSub = (id: string, status: string): AdminSubmissionRow => ({
  id,
  nameProposed: `Festival ${id}`,
  status,
  submittedAt: new Date("2025-01-01"),
});

describe("getSubmissionStatusColor", () => {
  it("returns distinct colors for known statuses", () => {
    const colors = ["en_attente", "en_traitement", "ajouté", "rejeté"].map(getSubmissionStatusColor);
    const unique = new Set(colors);
    expect(unique.size).toBe(4);
  });
  it("returns fallback for unknown status", () => {
    expect(getSubmissionStatusColor("inconnu")).toBe("var(--border-color)");
  });
});

describe("getSubmissionStatusLabel", () => {
  it("returns French label for en_attente", () => {
    expect(getSubmissionStatusLabel("en_attente")).toBe("En attente");
  });
  it("returns raw value for unknown", () => {
    expect(getSubmissionStatusLabel("inconnu")).toBe("inconnu");
  });
});

describe("countSubmissionsByStatus", () => {
  it("counts correctly", () => {
    const subs = [
      makeSub("1", "en_attente"),
      makeSub("2", "en_attente"),
      makeSub("3", "ajouté"),
      makeSub("4", "rejeté"),
      makeSub("5", "en_traitement"),
    ];
    const counts = countSubmissionsByStatus(subs);
    expect(counts.en_attente).toBe(2);
    expect(counts.en_traitement).toBe(1);
    expect(counts.ajouté).toBe(1);
    expect(counts.rejeté).toBe(1);
  });
  it("ignores unknown statuses", () => {
    const subs = [makeSub("1", "inconnu")];
    const counts = countSubmissionsByStatus(subs);
    expect(counts.en_attente).toBe(0);
  });
  it("returns zeros for empty array", () => {
    const counts = countSubmissionsByStatus([]);
    expect(Object.values(counts).every((v) => v === 0)).toBe(true);
  });
});

describe("isSubmissionActionable", () => {
  it("returns true for en_attente", () => expect(isSubmissionActionable("en_attente")).toBe(true));
  it("returns true for en_traitement", () => expect(isSubmissionActionable("en_traitement")).toBe(true));
  it("returns false for ajouté", () => expect(isSubmissionActionable("ajouté")).toBe(false));
  it("returns false for rejeté", () => expect(isSubmissionActionable("rejeté")).toBe(false));
});

describe("buildSubmissionSlug", () => {
  it("lowercases and replaces spaces", () => {
    expect(buildSubmissionSlug("Rock En Seine")).toBe("rock-en-seine");
  });
  it("strips accents", () => {
    expect(buildSubmissionSlug("Eurockéennes")).toBe("eurockéennes".normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  });
  it("removes leading and trailing hyphens", () => {
    const result = buildSubmissionSlug("  Festival  ");
    expect(result).not.toMatch(/^-|-$/);
  });
  it("collapses multiple special chars to one hyphen", () => {
    expect(buildSubmissionSlug("A & B")).toBe("a-b");
  });
});
