import { describe, expect, it } from "vitest";
import type { BilantableEvent } from "@/lib/bilan";
import { generateBilanText } from "@/lib/bilan-text";

function ev(
  title: string,
  status: "vu" | "must-see" | "intéressé" | null,
  venueName?: string,
  durationMins?: number,
): BilantableEvent {
  return {
    title,
    durationMins: durationMins ?? null,
    selection: status ? { status } : null,
    venue: venueName ? { name: venueName } : null,
  };
}

describe("generateBilanText — header", () => {
  it("includes festival name and emoji", () => {
    const result = generateBilanText([ev("A", "vu")], "Hellfest");
    expect(result).toContain("🎪");
    expect(result).toContain("Hellfest");
  });
});

describe("generateBilanText — empty state", () => {
  it("includes 'Aucun événement' message when nothing selected", () => {
    const result = generateBilanText([], "Fest");
    expect(result).toContain("Aucun événement sélectionné");
  });
});

describe("generateBilanText — seen events", () => {
  it("lists seen events with bullet points", () => {
    const result = generateBilanText([ev("Band A", "vu"), ev("Band B", "vu")], "Fest");
    expect(result).toContain("• Band A");
    expect(result).toContain("• Band B");
    expect(result).toContain("🎤 Events vus");
  });

  it("shows venue name in parentheses when available", () => {
    const result = generateBilanText([ev("Band A", "vu", "Grande Scène")], "Fest");
    expect(result).toContain("(Grande Scène)");
  });

  it("shows correct count in header stats", () => {
    const result = generateBilanText([ev("A", "vu"), ev("B", "vu")], "Fest");
    expect(result).toContain("2 events vus");
  });

  it("shows duration when events have durationMins", () => {
    const result = generateBilanText([ev("A", "vu", undefined, 90)], "Fest");
    expect(result).toContain("1h30");
  });
});

describe("generateBilanText — missed must-sees", () => {
  it("lists missed must-see events", () => {
    const result = generateBilanText([ev("Headliner", "must-see")], "Fest");
    expect(result).toContain("💔 Must-see manqués");
    expect(result).toContain("• Headliner");
  });

  it("shows warning count for missed must-sees", () => {
    const result = generateBilanText([ev("A", "must-see"), ev("B", "must-see")], "Fest");
    expect(result).toContain("2 must-see manqués");
  });

  it("does not show missed section when no must-sees", () => {
    const result = generateBilanText([ev("A", "vu")], "Fest");
    expect(result).not.toContain("💔");
  });
});

describe("generateBilanText — output format", () => {
  it("does not have trailing whitespace", () => {
    const result = generateBilanText([ev("A", "vu")], "Fest");
    expect(result).toBe(result.trimEnd());
  });

  it("does not include intéressé events in either section", () => {
    const result = generateBilanText([ev("Intéressé Act", "intéressé")], "Fest");
    expect(result).not.toContain("Intéressé Act");
    expect(result).toContain("Aucun événement sélectionné");
  });
});
