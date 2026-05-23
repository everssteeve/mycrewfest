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

export interface DurationSummable {
  durationMins?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}

/**
 * Sums total programme duration in minutes across all events.
 * Uses durationMins when available, otherwise derives from startTime/endTime.
 */
export function computeProgrammeDurationMins<T extends DurationSummable>(
  events: T[],
): number {
  let total = 0;
  for (const e of events) {
    if (e.durationMins) {
      total += e.durationMins;
    } else if (e.startTime && e.endTime) {
      total += (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60_000;
    }
  }
  return Math.round(total);
}

export interface VuCountFilterable {
  startTime?: string | null;
  selection?: { status: string } | null;
}

/**
 * Returns a map of YYYY-MM-DD → vu event count for events with selection.status === "vu".
 */
export function countVuEventsByDay<T extends VuCountFilterable>(
  events: T[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (!e.startTime || e.selection?.status !== "vu") continue;
    const day = toLocalYMD(e.startTime);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return counts;
}

export interface VenueCountable {
  venue?: { id: string } | null;
}

/**
 * Returns the number of distinct venue IDs across the given events.
 * Events without a venue are ignored.
 */
export function countUniqueVenues<T extends VenueCountable>(events: T[]): number {
  const ids = new Set<string>();
  for (const e of events) {
    if (e.venue?.id) ids.add(e.venue.id);
  }
  return ids.size;
}

export interface ArtistCountable {
  artist?: { id: string } | null;
}

/**
 * Returns the number of distinct artist IDs across the given events.
 * Events without an artist are ignored.
 */
export function countUniqueArtists<T extends ArtistCountable>(events: T[]): number {
  const ids = new Set<string>();
  for (const e of events) {
    if (e.artist?.id) ids.add(e.artist.id);
  }
  return ids.size;
}
