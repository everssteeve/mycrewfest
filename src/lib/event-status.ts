export type EventTimeStatus = "ongoing" | "upcoming" | "past" | "unknown";

export interface TimedEvent {
  startTime?: string | null;
  endTime?: string | null;
  durationMins?: number | null;
}

const DEFAULT_DURATION_MS = 60 * 60_000; // 1 hour

function resolveEndMs(event: TimedEvent): number | null {
  if (!event.startTime) return null;
  const startMs = new Date(event.startTime).getTime();
  if (event.endTime) return new Date(event.endTime).getTime();
  if (event.durationMins) return startMs + event.durationMins * 60_000;
  return startMs + DEFAULT_DURATION_MS;
}

/**
 * Returns the current time status of an event relative to `now`.
 * - "ongoing"  : event has started and not ended
 * - "upcoming" : event hasn't started yet
 * - "past"     : event has ended
 * - "unknown"  : no startTime provided
 */
export function getEventTimeStatus(event: TimedEvent, now: Date): EventTimeStatus {
  if (!event.startTime) return "unknown";

  const startMs = new Date(event.startTime).getTime();
  const endMs = resolveEndMs(event);
  const nowMs = now.getTime();

  if (endMs !== null && nowMs > endMs) return "past";
  if (nowMs >= startMs) return "ongoing";
  return "upcoming";
}

/**
 * Returns the IDs of events that are currently ongoing.
 */
export function findOngoingEventIds<T extends TimedEvent & { id: string }>(
  events: T[],
  now: Date,
): Set<string> {
  const ids = new Set<string>();
  for (const e of events) {
    if (getEventTimeStatus(e, now) === "ongoing") {
      ids.add(e.id);
    }
  }
  return ids;
}
