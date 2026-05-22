import type { SelectionStatus } from "@/types";

/**
 * Returns true if the event's selection status can be retroactively marked as vu.
 * Only "must-see" events that were missed (not yet vu) qualify.
 */
export function canMarkAsVu(status: SelectionStatus | null | undefined): boolean {
  return status === "must-see";
}

/**
 * Returns the next status after marking an event as vu from the bilan.
 * Always returns "vu" (this is a retroactive mark).
 */
export function markVuStatus(): SelectionStatus {
  return "vu";
}
