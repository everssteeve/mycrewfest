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

/**
 * Returns the average event duration in minutes, or null when no events have
 * duration data. Uses durationMins when available, otherwise derives from
 * startTime/endTime. Events with no duration data are excluded from the average.
 */
export function computeAvgEventDurationMins<T extends DurationSummable>(
  events: T[],
): number | null {
  let total = 0;
  let count = 0;
  for (const e of events) {
    if (e.durationMins) {
      total += e.durationMins;
      count++;
    } else if (e.startTime && e.endTime) {
      const diff = (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60_000;
      if (diff > 0) {
        total += diff;
        count++;
      }
    }
  }
  return count === 0 ? null : Math.round(total / count);
}

/**
 * Returns the maximum event duration in minutes across all events, or null when
 * no events have duration data. Uses durationMins when available, otherwise derives
 * from startTime/endTime. Only positive durations are considered.
 */
export function getMaxEventDurationMins<T extends DurationSummable>(
  events: T[],
): number | null {
  let max: number | null = null;
  for (const e of events) {
    let mins: number | null = null;
    if (e.durationMins && e.durationMins > 0) {
      mins = e.durationMins;
    } else if (e.startTime && e.endTime) {
      const diff = (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60_000;
      if (diff > 0) mins = diff;
    }
    if (mins !== null && (max === null || mins > max)) max = mins;
  }
  return max === null ? null : Math.round(max);
}

export interface VuCountFilterable {
  startTime?: string | null;
  selection?: { status: string } | null;
}

export interface SelectionFilterable {
  selection?: { status: string } | null;
}

/**
 * Returns the count of events with selection.status === "must-see".
 */
export function countMustSeePendingEvents<T extends SelectionFilterable>(
  events: T[],
): number {
  return events.filter((e) => e.selection?.status === "must-see").length;
}

/**
 * Returns the count of events with selection.status === "intéressé".
 */
export function countIntéresséEvents<T extends SelectionFilterable>(
  events: T[],
): number {
  return events.filter((e) => e.selection?.status === "intéressé").length;
}

export interface SelectionDayFilterable {
  startTime?: string | null;
  selection?: { status: string } | null;
}

/**
 * Returns the number of distinct days that have at least one selected event
 * (status "must-see" or "intéressé"). Events without a startTime are excluded.
 */
export function countSelectionDays<T extends SelectionDayFilterable>(
  events: T[],
): number {
  const days = new Set<string>();
  for (const e of events) {
    if (!e.startTime) continue;
    const status = e.selection?.status;
    if (status !== "must-see" && status !== "intéressé") continue;
    days.add(toLocalYMD(e.startTime));
  }
  return days.size;
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

export interface VenueNameable {
  venue?: { id: string; name: string } | null;
}

export interface TopVenueResult {
  name: string;
  count: number;
}

/**
 * Returns the venue with the most events, or null when no events have a venue.
 * Ties are broken alphabetically by venue name.
 */
export function getTopProgrammeVenue<T extends VenueNameable>(
  events: T[],
): TopVenueResult | null {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.venue?.name) {
      counts.set(e.venue.name, (counts.get(e.venue.name) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return null;
  let top: TopVenueResult | null = null;
  for (const [name, count] of counts) {
    if (!top || count > top.count || (count === top.count && name < top.name)) {
      top = { name, count };
    }
  }
  return top;
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

export interface StatusFilterable {
  status?: string | null;
}

/**
 * Returns the count of events with status === "annulé".
 */
export function countCancelledEvents<T extends StatusFilterable>(events: T[]): number {
  return events.filter((e) => e.status === "annulé").length;
}

/**
 * Returns the count of events with status === "modifié".
 */
export function countModifiedEvents<T extends StatusFilterable>(events: T[]): number {
  return events.filter((e) => e.status === "modifié").length;
}

export interface AccessFilterable {
  access?: string | null;
}

/**
 * Returns the count of events that require a separate booking ("réservation_séparée").
 */
export function countReservationRequiredEvents<T extends AccessFilterable>(events: T[]): number {
  return events.filter((e) => e.access === "réservation_séparée").length;
}

export interface PeakHourFilterable {
  startTime?: string | null;
}

/**
 * Returns the local hour (0–23) with the most events starting in it,
 * or null when no events have a startTime.
 * Ties are broken by lowest hour value.
 */
export function getPeakEventHour<T extends PeakHourFilterable>(events: T[]): number | null {
  const counts = new Map<number, number>();
  for (const e of events) {
    if (!e.startTime) continue;
    const hour = new Date(e.startTime).getHours();
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  let peakHour: number | null = null;
  let max = 0;
  for (const [hour, count] of counts) {
    if (count > max || (count === max && peakHour !== null && hour < peakHour)) {
      max = count;
      peakHour = hour;
    }
  }
  return peakHour;
}

export interface ConfidenceFilterable {
  confidence?: string | null;
}

/**
 * Returns the number of events with confidence === "vérifié_humain".
 */
export function countVerifiedEvents<T extends ConfidenceFilterable>(events: T[]): number {
  return events.filter((e) => e.confidence === "vérifié_humain").length;
}

export interface TaggableEvent {
  tags?: string[] | null;
}

export interface TopTagResult {
  tag: string;
  count: number;
}

/**
 * Returns the most common tag across all events, or null when no tags are present.
 * Ties are broken alphabetically (lowest tag name wins).
 */
export function getTopProgrammeTag<T extends TaggableEvent>(
  events: T[],
): TopTagResult | null {
  const counts = new Map<string, number>();
  for (const e of events) {
    for (const tag of e.tags ?? []) {
      if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return null;
  let top: TopTagResult | null = null;
  for (const [tag, count] of counts) {
    if (!top || count > top.count || (count === top.count && tag < top.tag)) {
      top = { tag, count };
    }
  }
  return top;
}
