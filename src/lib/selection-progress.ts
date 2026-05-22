import type { SelectionStatus } from "@/types";

export interface SelectionCounts {
  vu: number;
  mustSeePending: number;
  intéresséPending: number;
  total: number;
  progressPct: number;
}

export function computeSelectionProgress(
  selections: Record<string, SelectionStatus>,
): SelectionCounts {
  let vu = 0;
  let mustSeePending = 0;
  let intéresséPending = 0;

  for (const status of Object.values(selections)) {
    if (status === "vu") vu++;
    else if (status === "must-see") mustSeePending++;
    else if (status === "intéressé") intéresséPending++;
  }

  const total = vu + mustSeePending + intéresséPending;
  const progressPct = total === 0 ? 0 : Math.round((vu / total) * 100);

  return { vu, mustSeePending, intéresséPending, total, progressPct };
}
