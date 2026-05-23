export interface FestEventWithDates {
  festival: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Returns the number of fest events whose festival has not yet started
 * (startDate is strictly in the future relative to `now`).
 * Uses date-only comparison.
 */
export function countUpcomingFestEvents<T extends FestEventWithDates>(
  festEvents: T[],
  now = new Date(),
): number {
  const today = now.toLocaleDateString("sv-SE");
  return festEvents.filter((fe) => fe.festival.startDate.slice(0, 10) > today).length;
}

/**
 * Returns the number of fest events whose festival is currently active:
 * startDate <= today <= endDate (date-only comparison).
 */
export function countActiveFestEvents<T extends FestEventWithDates>(
  festEvents: T[],
  now = new Date(),
): number {
  const today = now.toLocaleDateString("sv-SE");
  return festEvents.filter((fe) => {
    const start = fe.festival.startDate.slice(0, 10);
    const end = fe.festival.endDate.slice(0, 10);
    return start <= today && today <= end;
  }).length;
}

/**
 * Returns the number of fest events whose festival has already ended
 * (endDate is strictly in the past relative to `now`).
 * Uses date-only comparison.
 */
export function countPastFestEvents<T extends FestEventWithDates>(
  festEvents: T[],
  now = new Date(),
): number {
  const today = now.toLocaleDateString("sv-SE");
  return festEvents.filter((fe) => fe.festival.endDate.slice(0, 10) < today).length;
}
