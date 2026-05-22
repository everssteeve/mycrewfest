export interface SummaryFilterable {
  startTime?: string | null;
}

function toLocalYMD(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE");
}

/**
 * Returns a map of YYYY-MM-DD → event count for events that have a startTime.
 */
export function countEventsByDay<T extends SummaryFilterable>(
  events: T[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (!e.startTime) continue;
    const day = toLocalYMD(e.startTime);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return counts;
}

/**
 * Returns the count of events without a startTime ("itinérant" events).
 */
export function countItinerantEvents<T extends SummaryFilterable>(
  events: T[],
): number {
  return events.filter((e) => !e.startTime).length;
}
