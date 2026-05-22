export interface ConflictCheckable {
  id: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMins?: number | null;
  selection?: { status: string } | null;
}

const DEFAULT_DURATION_MS = 60 * 60_000; // 1 hour fallback

function resolveEnd(event: ConflictCheckable): Date | null {
  if (!event.startTime) return null;
  const start = new Date(event.startTime);
  if (event.endTime) return new Date(event.endTime);
  if (event.durationMins) return new Date(start.getTime() + event.durationMins * 60_000);
  return new Date(start.getTime() + DEFAULT_DURATION_MS);
}

/**
 * Returns a Set of event IDs that overlap with at least one other selected event.
 * Only considers events with status "must-see" or "intéressé".
 */
export function findConflictingEventIds<T extends ConflictCheckable>(
  events: T[],
): Set<string> {
  const selected = events.filter(
    (e) =>
      e.startTime &&
      (e.selection?.status === "must-see" || e.selection?.status === "intéressé"),
  );

  const conflicting = new Set<string>();

  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const a = selected[i];
      const b = selected[j];

      const aStart = new Date(a.startTime as string);
      const aEnd = resolveEnd(a);
      const bStart = new Date(b.startTime as string);
      const bEnd = resolveEnd(b);

      if (!aEnd || !bEnd) continue;

      // Overlap: a starts before b ends AND b starts before a ends
      if (aStart < bEnd && bStart < aEnd) {
        conflicting.add(a.id);
        conflicting.add(b.id);
      }
    }
  }

  return conflicting;
}
