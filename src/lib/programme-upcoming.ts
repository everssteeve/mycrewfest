export interface UpcomingFilterable {
  startTime?: string | null;
  endTime?: string | null;
  durationMins?: number | null;
}

/**
 * Returns true if the event is happening now or starts within `windowMins` minutes.
 * Events with no startTime are excluded.
 */
export function isUpcomingOrOngoing<T extends UpcomingFilterable>(
  event: T,
  now: Date,
  windowMins = 120,
): boolean {
  if (!event.startTime) return false;

  const start = new Date(event.startTime);

  // Determine end: explicit endTime > derived from durationMins > startTime
  let end: Date;
  if (event.endTime) {
    end = new Date(event.endTime);
  } else if (event.durationMins) {
    end = new Date(start.getTime() + event.durationMins * 60_000);
  } else {
    // No end info — assume 1-hour event
    end = new Date(start.getTime() + 60 * 60_000);
  }

  // Ongoing: already started and not ended yet
  if (now >= start && now <= end) return true;

  // Upcoming: starts within the window and hasn't ended
  const windowMs = windowMins * 60_000;
  return start > now && start.getTime() - now.getTime() <= windowMs;
}

/**
 * Returns the count of events that have NOT yet started but will start within
 * `windowMins` minutes from `now`. Events already started are excluded.
 * Events without a startTime are excluded.
 */
export function countUpcomingEvents<T extends UpcomingFilterable>(
  events: T[],
  now: Date,
  windowMins = 120,
): number {
  return events.filter((e) => {
    if (!e.startTime) return false;
    const start = new Date(e.startTime);
    if (now >= start) return false; // already started (ongoing or past)
    const windowMs = windowMins * 60_000;
    return start.getTime() - now.getTime() <= windowMs;
  }).length;
}
