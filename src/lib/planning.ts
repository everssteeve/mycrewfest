/**
 * Planning utilities — pure functions, no DB access.
 *
 * Conflict levels (from the PRD):
 *   overlap    — events overlap in time directly
 *   tight      — gap < travel time + comfort margin
 *   borderline — gap < 2 × comfort margin (but travel would fit)
 */

import type { ConflictInfo, ConflictLevel, EventSummary } from "@/types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Parse an ISO date string to epoch ms. Returns NaN on invalid input. */
function toMs(iso: string | undefined): number {
  if (!iso) return Number.NaN;
  return new Date(iso).getTime();
}

/** Build a lookup key for a venue pair (order-independent). */
function venueKey(a: string, b: string): string {
  return [a, b].sort().join("--");
}

// ---------------------------------------------------------------------------
// detectConflicts
// ---------------------------------------------------------------------------

/**
 * Detect conflicts between a list of events.
 *
 * Only events with a known `startTime` participate. `endTime` is derived from
 * `startTime + durationMins` when not explicitly set.
 *
 * @param events            Full list of events (typically the user's selection)
 * @param comfortMarginMins Minimum comfortable gap between two events (minutes)
 * @param travelTimes       Optional map of `venueId--venueId` → travel minutes
 */
export function detectConflicts(
  events: EventSummary[],
  comfortMarginMins: number,
  travelTimes?: Map<string, number>,
): ConflictInfo[] {
  const margin = comfortMarginMins * 60_000; // ms

  // Filter to events that have a start time and are not cancelled
  const active = events.filter(
    (e) => e.startTime && e.status !== "annulé" && !Number.isNaN(toMs(e.startTime)),
  );

  // Sort by start time for efficient pairwise comparison
  const sorted = [...active].sort(
    (a, b) => toMs(a.startTime) - toMs(b.startTime),
  );

  const conflicts: ConflictInfo[] = [];

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];

      const aStart = toMs(a.startTime);
      const aEnd = a.endTime
        ? toMs(a.endTime)
        : a.durationMins
          ? aStart + a.durationMins * 60_000
          : Number.NaN;

      const bStart = toMs(b.startTime);

      // Once b starts after a ends by more than 2× margin, no further
      // conflicts are possible in the sorted order
      if (!Number.isNaN(aEnd) && bStart - aEnd > 2 * margin) break;

      // Travel time between venues (default 0 if same venue or unknown)
      const travelMs =
        a.venue && b.venue && a.venue.id !== b.venue.id && travelTimes
          ? (travelTimes.get(venueKey(a.venue.id, b.venue.id)) ?? 0) * 60_000
          : 0;

      let level: ConflictLevel | null = null;
      let overlapMins: number | undefined;
      const travelTimeMins = travelMs > 0 ? travelMs / 60_000 : undefined;

      if (!Number.isNaN(aEnd) && bStart < aEnd) {
        // Direct temporal overlap
        level = "overlap";
        overlapMins = Math.round((aEnd - bStart) / 60_000);
      } else {
        // Gap between end of A and start of B
        const gapMs = Number.isNaN(aEnd) ? 0 : bStart - aEnd;

        if (gapMs < travelMs + margin) {
          // Not enough time to travel + have the comfort buffer
          level = "tight";
        } else if (gapMs < 2 * margin) {
          // Enough for travel but less than twice the comfort margin
          level = "borderline";
        }
      }

      if (level !== null) {
        conflicts.push({
          level,
          eventA: a,
          eventB: b,
          overlapMins,
          travelTimeMins,
        });
      }
    }
  }

  return conflicts;
}

// ---------------------------------------------------------------------------
// sortEventsByTime
// ---------------------------------------------------------------------------

/**
 * Return events sorted by startTime ascending. Events without a startTime are
 * placed at the end, sorted by title.
 */
export function sortEventsByTime(events: EventSummary[]): EventSummary[] {
  return [...events].sort((a, b) => {
    const aMs = toMs(a.startTime);
    const bMs = toMs(b.startTime);

    if (Number.isNaN(aMs) && Number.isNaN(bMs)) {
      return a.title.localeCompare(b.title, "fr");
    }
    if (Number.isNaN(aMs)) return 1;
    if (Number.isNaN(bMs)) return -1;
    return aMs - bMs;
  });
}

// ---------------------------------------------------------------------------
// filterEventsByDay
// ---------------------------------------------------------------------------

/**
 * Return events whose startTime falls on the given date (yyyy-MM-dd).
 * Events without a startTime are excluded.
 */
export function filterEventsByDay(
  events: EventSummary[],
  date: string,
): EventSummary[] {
  return events.filter((e) => {
    if (!e.startTime) return false;
    // Compare the date portion of the ISO string in local time
    const d = new Date(e.startTime);
    if (Number.isNaN(d.getTime())) return false;
    const eventDate = d.toLocaleDateString("sv-SE"); // sv-SE gives yyyy-MM-dd
    return eventDate === date;
  });
}

// ---------------------------------------------------------------------------
// optimizePlanning  (F03-OPT — greedy algorithm)
// ---------------------------------------------------------------------------

interface OptimizeConfig {
  startHour?: number; // default 0
  endHour?: number; // default 24
  preferEvenings?: boolean; // sort preference within equally-scored slots
  comfortMarginMins: number;
}

export interface OptimizeResult {
  /** Events the algorithm kept in the schedule */
  kept: EventSummary[];
  /** Events that conflict with kept ones and need manual arbitration */
  toArbitrate: EventSummary[];
  /** Events the algorithm dropped automatically (e.g. outside time window) */
  dropped: EventSummary[];
  /** Events that were already cancelled — returned for display purposes */
  cancelled: EventSummary[];
}

/**
 * Greedy scheduling optimiser.
 *
 * Strategy:
 *   1. Separate `must-see` (pinned) events from the rest.
 *   2. Anchor the schedule with must-sees (they are never dropped).
 *   3. Greedily fill remaining slots with remaining events, skipping those
 *      that create a `tight` or `overlap` conflict.
 *   4. Events that could not be fitted without conflict go to `toArbitrate`.
 *   5. Events outside the [startHour, endHour] window go to `dropped`.
 *   6. Cancelled events are collected separately.
 *
 * @param events   All events available for scheduling
 * @param selected Event IDs that are "must-see" (highest priority)
 * @param config   Scheduling constraints
 */
export function optimizePlanning(
  events: EventSummary[],
  selected: string[],
  config: OptimizeConfig,
): OptimizeResult {
  const {
    startHour = 0,
    endHour = 24,
    preferEvenings = false,
    comfortMarginMins,
  } = config;

  const margin = comfortMarginMins * 60_000;
  const mustSeeSet = new Set(selected);

  const cancelled: EventSummary[] = [];
  const dropped: EventSummary[] = [];
  const active: EventSummary[] = [];

  // Step 1 — partition
  for (const event of events) {
    if (event.status === "annulé") {
      cancelled.push(event);
      continue;
    }

    if (event.startTime) {
      const h = new Date(event.startTime).getHours();
      if (h < startHour || h >= endHour) {
        dropped.push(event);
        continue;
      }
    }

    active.push(event);
  }

  // Step 2 — sort: must-sees first, then by start time
  // Within must-sees and non-must-sees, later (evening) events come first when
  // preferEvenings is set.
  const sorted = [...active].sort((a, b) => {
    const aPin = mustSeeSet.has(a.id) ? 0 : 1;
    const bPin = mustSeeSet.has(b.id) ? 0 : 1;
    if (aPin !== bPin) return aPin - bPin;

    const aMs = toMs(a.startTime);
    const bMs = toMs(b.startTime);
    if (Number.isNaN(aMs) && Number.isNaN(bMs)) return 0;
    if (Number.isNaN(aMs)) return 1;
    if (Number.isNaN(bMs)) return -1;

    return preferEvenings ? bMs - aMs : aMs - bMs;
  });

  // Step 3 — greedy fit
  const kept: EventSummary[] = [];
  const toArbitrate: EventSummary[] = [];

  for (const candidate of sorted) {
    const conflicts = detectConflicts(
      [...kept, candidate],
      comfortMarginMins,
    ).filter(
      (c) => c.eventA.id === candidate.id || c.eventB.id === candidate.id,
    );

    const hasHardConflict = conflicts.some(
      (c) => c.level === "overlap" || c.level === "tight",
    );

    if (!hasHardConflict) {
      kept.push(candidate);
    } else if (mustSeeSet.has(candidate.id)) {
      // Must-see: force-keep it and flag the conflicting kept events instead
      const conflictingKeptIds = new Set(
        conflicts.flatMap((c) => [c.eventA.id, c.eventB.id]),
      );
      conflictingKeptIds.delete(candidate.id);

      for (const id of conflictingKeptIds) {
        const idx = kept.findIndex((e) => e.id === id);
        if (idx !== -1 && !mustSeeSet.has(id)) {
          toArbitrate.push(...kept.splice(idx, 1));
        }
      }

      kept.push(candidate);
    } else {
      toArbitrate.push(candidate);
    }
  }

  return { kept, toArbitrate, dropped, cancelled };
}

// ---------------------------------------------------------------------------
// computeDayFreeTime
// ---------------------------------------------------------------------------

export interface FreeTimeEvent {
  startTime?: string | null;
  endTime?: string | null;
  durationMins?: number | null;
}

export interface DayCoverageResult {
  coveredMins: number;
  spanMins: number;
  percent: number;
}

/**
 * Computes how much of the day's time window is "covered" by events.
 *
 * coveredMins: total event time after merging overlapping intervals
 * spanMins: from first event start to last event end
 * percent: coveredMins / spanMins × 100 (0 when span is 0)
 *
 * Events without startTime are ignored.
 */
export function computeDayCoverage(events: FreeTimeEvent[]): DayCoverageResult {
  const withTime = events
    .filter((e) => !!e.startTime)
    .map((e) => {
      const start = new Date(e.startTime!).getTime();
      let end: number;
      if (e.endTime) {
        end = new Date(e.endTime).getTime();
      } else if (e.durationMins) {
        end = start + e.durationMins * 60_000;
      } else {
        end = start + 60 * 60_000;
      }
      return { start, end };
    })
    .sort((a, b) => a.start - b.start);

  if (withTime.length === 0) return { coveredMins: 0, spanMins: 0, percent: 0 };

  const spanStart = withTime[0].start;
  const spanEnd = Math.max(...withTime.map((e) => e.end));
  const spanMins = Math.round((spanEnd - spanStart) / 60_000);

  // Merge overlapping intervals
  let coveredMs = 0;
  let mergeStart = withTime[0].start;
  let mergeEnd = withTime[0].end;
  for (let i = 1; i < withTime.length; i++) {
    const { start, end } = withTime[i];
    if (start <= mergeEnd) {
      mergeEnd = Math.max(mergeEnd, end);
    } else {
      coveredMs += mergeEnd - mergeStart;
      mergeStart = start;
      mergeEnd = end;
    }
  }
  coveredMs += mergeEnd - mergeStart;

  const coveredMins = Math.round(coveredMs / 60_000);
  const percent = spanMins > 0 ? Math.round((coveredMins / spanMins) * 100) : 0;

  return { coveredMins, spanMins, percent };
}

/**
 * Computes the total gap time (in minutes) between consecutive events in a day.
 * Only positive gaps are counted — overlapping events contribute 0.
 * Returns 0 if fewer than 2 events have a startTime.
 */
export function computeDayFreeTime(events: FreeTimeEvent[]): number {
  const withTime = events
    .filter((e) => !!e.startTime)
    .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());

  if (withTime.length < 2) return 0;

  let freeTime = 0;
  for (let i = 0; i < withTime.length - 1; i++) {
    const current = withTime[i];
    const next = withTime[i + 1];

    const currentStart = new Date(current.startTime!).getTime();
    let currentEnd: number;
    if (current.endTime) {
      currentEnd = new Date(current.endTime).getTime();
    } else if (current.durationMins) {
      currentEnd = currentStart + current.durationMins * 60_000;
    } else {
      currentEnd = currentStart + 60 * 60_000;
    }

    const nextStart = new Date(next.startTime!).getTime();
    const gapMins = (nextStart - currentEnd) / 60_000;
    if (gapMins > 0) freeTime += gapMins;
  }

  return Math.round(freeTime);
}

// ---------------------------------------------------------------------------
// countMustSeeEvents
// ---------------------------------------------------------------------------

/**
 * Returns the number of events with selectionStatus === "must-see".
 * Events without a selectionStatus are ignored.
 */
export function countMustSeeEvents(events: EventSummary[]): number {
  return events.filter((e) => e.selectionStatus === "must-see").length;
}

/**
 * Returns the number of events with selectionStatus === "intéressé".
 * Events without a selectionStatus are ignored.
 */
export function countIntéresséPlanningEvents(events: EventSummary[]): number {
  return events.filter((e) => e.selectionStatus === "intéressé").length;
}
