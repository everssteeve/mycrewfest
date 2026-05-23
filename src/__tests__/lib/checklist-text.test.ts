import { describe, expect, it } from "vitest";
import { generateChecklistText } from "@/lib/checklist-text";

type Item = { label: string; done: boolean; cost: number | null; assigneeName: string | null };

function item(label: string, done: boolean, cost?: number, assignee?: string): Item {
  return { label, done, cost: cost ?? null, assigneeName: assignee ?? null };
}

describe("generateChecklistText — header", () => {
  it("includes festival name and emoji", () => {
    const result = generateChecklistText([item("Tente", false)], "Hellfest");
    expect(result).toContain("📋");
    expect(result).toContain("Hellfest");
  });
});

describe("generateChecklistText — empty state", () => {
  it("shows empty message when no items", () => {
    const result = generateChecklistText([], "Fest");
    expect(result).toContain("Aucun item dans la checklist");
  });

  it("shows 0/0 stats when no items", () => {
    const result = generateChecklistText([], "Fest");
    expect(result).toContain("0 / 0 complétés");
  });
});

describe("generateChecklistText — pending items", () => {
  it("lists pending items in À faire section", () => {
    const result = generateChecklistText([item("Tente", false), item("Duvet", false)], "Fest");
    expect(result).toContain("⬜ À faire");
    expect(result).toContain("• Tente");
    expect(result).toContain("• Duvet");
  });

  it("shows correct count in stats", () => {
    const result = generateChecklistText(
      [item("A", false), item("B", false), item("C", true)],
      "Fest",
    );
    expect(result).toContain("1 / 3 complétés");
  });
});

describe("generateChecklistText — done items", () => {
  it("lists done items in Fait section", () => {
    const result = generateChecklistText([item("Tente", true)], "Fest");
    expect(result).toContain("✅ Fait");
    expect(result).toContain("• Tente");
  });

  it("does not show pending section when all done", () => {
    const result = generateChecklistText([item("A", true)], "Fest");
    expect(result).not.toContain("⬜ À faire");
  });

  it("does not show done section when none done", () => {
    const result = generateChecklistText([item("A", false)], "Fest");
    expect(result).not.toContain("✅ Fait");
  });
});

describe("generateChecklistText — cost and assignee", () => {
  it("shows budget when items have cost", () => {
    const result = generateChecklistText([item("Tente", false, 150)], "Fest");
    expect(result).toContain("💰 Budget estimé : 150 €");
  });

  it("does not show budget line when no costs", () => {
    const result = generateChecklistText([item("Tente", false)], "Fest");
    expect(result).not.toContain("💰");
  });

  it("shows assignee in item suffix", () => {
    const result = generateChecklistText([item("Tente", false, null, "Alice")], "Fest");
    expect(result).toContain("(→ Alice)");
  });

  it("shows cost in item suffix when no assignee", () => {
    const result = generateChecklistText([item("Tente", false, 50)], "Fest");
    expect(result).toContain("(50 €)");
  });

  it("combines assignee and cost in suffix", () => {
    const result = generateChecklistText([item("Tente", false, 50, "Bob")], "Fest");
    expect(result).toContain("(→ Bob, 50 €)");
  });
});

describe("generateChecklistText — output format", () => {
  it("does not have trailing whitespace", () => {
    const result = generateChecklistText([item("A", false)], "Fest");
    expect(result).toBe(result.trimEnd());
  });

  it("pending items appear before done items", () => {
    const result = generateChecklistText([item("Done", true), item("Todo", false)], "Fest");
    const pendingIdx = result.indexOf("⬜ À faire");
    const doneIdx = result.indexOf("✅ Fait");
    expect(pendingIdx).toBeLessThan(doneIdx);
  });
});
