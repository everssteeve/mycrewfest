export interface PlanningFilterable {
  selectionStatus?: string | null;
}

/**
 * When mustSeeOnly is true, returns only events with selectionStatus === "must-see".
 * Otherwise returns all events unchanged.
 */
export function applyPlanningMustSeeFilter<T extends PlanningFilterable>(
  events: T[],
  mustSeeOnly: boolean,
): T[] {
  if (!mustSeeOnly) return events;
  return events.filter((e) => e.selectionStatus === "must-see");
}
