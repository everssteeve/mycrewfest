/**
 * Pure functions for detecting tight gap transitions between consecutive
 * selected events in the festival programme.
 *
 * A "tight" transition occurs when the gap between the end of one selected
 * event and the start of the next selected event is less than 15 minutes.
 */

export interface GapCheckableEvent {
  id: string;
  startTime: string | null;
  endTime?: string | null;
  durationMins?: number | null;
  selection?: { status: string } | null;
}

const SELECTED_STATUSES = new Set(["must-see", "intéressé"]);

function isSelected(event: GapCheckableEvent): boolean {
  return event.selection?.status !== undefined &&
    SELECTED_STATUSES.has(event.selection.status);
}

/**
 * Computes the effective end time (as ms timestamp) for an event.
 * Falls back to: endTime → startTime + durationMins → startTime + 60 min.
 */
function getEndTimeMs(event: GapCheckableEvent): number | null {
  if (!event.startTime) return null;

  const startMs = new Date(event.startTime).getTime();
  if (Number.isNaN(startMs)) return null;

  if (event.endTime) {
    const endMs = new Date(event.endTime).getTime();
    if (!Number.isNaN(endMs)) return endMs;
  }

  if (event.durationMins != null && event.durationMins > 0) {
    return startMs + event.durationMins * 60_000;
  }

  // Default fallback: 60 min
  return startMs + 60 * 60_000;
}

/**
 * Returns an array of { prevId, nextId, gapMins } for all consecutive pairs
 * of selected events (sorted by startTime) where both events have a startTime.
 */
export function findSelectedEventGaps<T extends GapCheckableEvent>(
  events: T[],
): Array<{ prevId: string; nextId: string; gapMins: number }> {
  // Keep only selected events with a non-null startTime, sorted chronologically
  const selected = events
    .filter((e) => isSelected(e) && e.startTime !== null)
    .sort((a, b) => {
      const ta = new Date(a.startTime!).getTime();
      const tb = new Date(b.startTime!).getTime();
      return ta - tb;
    });

  const gaps: Array<{ prevId: string; nextId: string; gapMins: number }> = [];

  for (let i = 0; i < selected.length - 1; i++) {
    const prev = selected[i];
    const next = selected[i + 1];

    const prevEndMs = getEndTimeMs(prev);
    const nextStartMs = new Date(next.startTime!).getTime();

    if (prevEndMs === null || Number.isNaN(nextStartMs)) continue;

    const gapMins = (nextStartMs - prevEndMs) / 60_000;
    gaps.push({ prevId: prev.id, nextId: next.id, gapMins });
  }

  return gaps;
}

/**
 * Returns a Set of event IDs where the gap *before* that event (relative to
 * the previous selected event) is less than thresholdMins (default 15).
 */
export function findTightTransitionIds<T extends GapCheckableEvent>(
  events: T[],
  thresholdMins = 15,
): Set<string> {
  const gaps = findSelectedEventGaps(events);
  const tight = new Set<string>();

  for (const { nextId, gapMins } of gaps) {
    if (gapMins < thresholdMins) {
      tight.add(nextId);
    }
  }

  return tight;
}

/**
 * Formats a gap duration as a human-readable string: "5 min", "12 min".
 */
export function formatGapDuration(mins: number): string {
  return `${Math.round(mins)} min`;
}

/**
 * Returns the severity of a gap: "tight" if < 15 min, "comfortable" otherwise.
 */
export function getGapSeverity(mins: number): "tight" | "comfortable" {
  return mins < 15 ? "tight" : "comfortable";
}

/**
 * Builds an accessible aria-label for a tight gap warning.
 * Example: "Transition de 8 minutes — attention !"
 */
export function buildGapAriaLabel(mins: number): string {
  return `Transition de ${Math.round(mins)} minutes — attention !`;
}
