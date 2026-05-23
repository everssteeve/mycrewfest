export interface FollowFilterable {
  isFollowed?: boolean;
}

/** Returns the number of festivals marked as followed. */
export function countFollowedFestivals<T extends FollowFilterable>(festivals: T[]): number {
  return festivals.filter((f) => f.isFollowed === true).length;
}

/** Returns false only when `followedOnly` is true AND the event is not followed. */
export function matchesFollowFilter<T extends FollowFilterable>(
  festival: T,
  followedOnly: boolean,
): boolean {
  if (!followedOnly) return true;
  return festival.isFollowed === true;
}

export interface MonthFilterable {
  startDate: string;
  endDate: string;
}

/**
 * Returns true if the festival overlaps with the given month (1 = Jan, 12 = Dec).
 * A festival overlaps if it starts OR ends in that month, or spans across it.
 * Passing month = null always returns true.
 */
export function matchesMonthFilter<T extends MonthFilterable>(
  festival: T,
  month: number | null,
): boolean {
  if (month === null) return true;
  const start = new Date(festival.startDate);
  const end = new Date(festival.endDate);
  const startMonth = start.getMonth() + 1;
  const endMonth = end.getMonth() + 1;
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  if (startYear === endYear) {
    return startMonth <= month && month <= endMonth;
  }
  return startMonth <= month || month <= endMonth;
}

/**
 * Returns the set of months (1–12) that appear across the given festivals
 * (considering both start and end month), sorted ascending.
 */
export function getAvailableMonths<T extends MonthFilterable>(festivals: T[]): number[] {
  const months = new Set<number>();
  for (const f of festivals) {
    const start = new Date(f.startDate);
    const end = new Date(f.endDate);
    months.add(start.getMonth() + 1);
    months.add(end.getMonth() + 1);
  }
  return Array.from(months).sort((a, b) => a - b);
}

export interface TemporalFilterable {
  endDate: string;
}

/**
 * Returns false when `hidePast` is true and the festival's end date is strictly
 * before today (i.e. the festival has ended).
 * Always returns true when `hidePast` is false.
 */
export function matchesTemporalFilter<T extends TemporalFilterable>(
  festival: T,
  hidePast: boolean,
): boolean {
  if (!hidePast) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(festival.endDate);
  end.setHours(0, 0, 0, 0);
  return end >= today;
}

export interface ActiveFestFilterable {
  startDate: string;
  endDate: string;
}

/**
 * Returns the number of festivals currently in progress: today falls between
 * startDate and endDate (inclusive, date-only comparison).
 */
export function countActiveFestivals<T extends ActiveFestFilterable>(
  festivals: T[],
  now = new Date(),
): number {
  const today = now.toLocaleDateString("sv-SE");
  return festivals.filter((f) => {
    const start = f.startDate.slice(0, 10);
    const end = f.endDate.slice(0, 10);
    return start <= today && today <= end;
  }).length;
}

export const MONTH_NAMES_FR: Record<number, string> = {
  1: "Janv.",
  2: "Févr.",
  3: "Mars",
  4: "Avr.",
  5: "Mai",
  6: "Juin",
  7: "Juil.",
  8: "Août",
  9: "Sept.",
  10: "Oct.",
  11: "Nov.",
  12: "Déc.",
};
