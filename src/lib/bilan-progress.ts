/**
 * Computes the completion percentage of selected events (seen / total selected).
 * Returns 0 when no events are selected.
 */
export function computeSelectionCompletionPercent(
  totalSeen: number,
  mustSeePending: number,
  intéresséPending: number,
): number {
  const total = totalSeen + mustSeePending + intéresséPending;
  if (total === 0) return 0;
  return Math.round((totalSeen / total) * 100);
}

/**
 * Returns total selected events count (seen + still-pending).
 */
export function computeTotalSelected(
  totalSeen: number,
  mustSeePending: number,
  intéresséPending: number,
): number {
  return totalSeen + mustSeePending + intéresséPending;
}
