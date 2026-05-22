import type { ChecklistItemData } from "@/app/(app)/festevent/[id]/checklist/_components/checklist-view";

function formatCost(cost: number): string {
  return `${cost.toFixed(0)} €`;
}

/**
 * Generates a shareable plain-text summary of the checklist.
 */
export function generateChecklistText(
  items: Pick<ChecklistItemData, "label" | "done" | "cost" | "assigneeName">[],
  festivalName: string,
): string {
  const lines: string[] = [`📋 Checklist — ${festivalName}`, ""];

  const pending = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  const totalCost = items.reduce((sum, i) => sum + (i.cost ?? 0), 0);

  // Stats
  lines.push(
    `✅ ${done.length} / ${items.length} complétés`,
  );
  if (totalCost > 0) {
    lines.push(`💰 Budget estimé : ${formatCost(totalCost)}`);
  }

  // Pending items
  if (pending.length > 0) {
    lines.push("");
    lines.push("⬜ À faire");
    for (const item of pending) {
      const suffix = buildSuffix(item);
      lines.push(`• ${item.label}${suffix}`);
    }
  }

  // Done items
  if (done.length > 0) {
    lines.push("");
    lines.push("✅ Fait");
    for (const item of done) {
      const suffix = buildSuffix(item);
      lines.push(`• ${item.label}${suffix}`);
    }
  }

  if (items.length === 0) {
    lines.push("Aucun item dans la checklist.");
  }

  return lines.join("\n").trimEnd();
}

function buildSuffix(
  item: Pick<ChecklistItemData, "cost" | "assigneeName">,
): string {
  const parts: string[] = [];
  if (item.assigneeName) parts.push(`→ ${item.assigneeName}`);
  if (item.cost !== null && item.cost > 0) parts.push(formatCost(item.cost));
  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}
