import type { SelectionStatus } from "@/types";

export const SELECTION_CYCLE: ReadonlyArray<SelectionStatus | null> = [
  null,
  "intéressé",
  "must-see",
  "vu",
];

export function nextSelectionStatus(current: SelectionStatus | null): SelectionStatus | null {
  const idx = SELECTION_CYCLE.indexOf(current);
  if (idx === -1) return "intéressé";
  const next = SELECTION_CYCLE[(idx + 1) % SELECTION_CYCLE.length];
  return next ?? null;
}

export const SELECTION_LABELS: Record<NonNullable<SelectionStatus> | "_add", string> = {
  _add: "+ Ajouter",
  intéressé: "♥ Intéressé",
  "must-see": "★ Must-see",
  vu: "✓ Vu",
};

/** One-tap "mark as seen" toggle: vu ↔ null (preserves other statuses). */
export function toggleVuStatus(current: SelectionStatus | null): SelectionStatus | null {
  return current === "vu" ? null : "vu";
}
