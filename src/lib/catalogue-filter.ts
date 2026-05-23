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

/**
 * Returns the number of festivals that start strictly after today and within
 * `daysAhead` days from now (exclusive end boundary).
 * Uses date-only comparison.
 */
export function countUpcomingFestivals<T extends ActiveFestFilterable>(
  festivals: T[],
  now = new Date(),
  daysAhead = 30,
): number {
  const today = now.toLocaleDateString("sv-SE");
  const cutoffMs = now.getTime() + daysAhead * 86_400_000;
  const cutoff = new Date(cutoffMs).toLocaleDateString("sv-SE");
  return festivals.filter((f) => {
    const start = f.startDate.slice(0, 10);
    return start > today && start <= cutoff;
  }).length;
}

export interface ProgramStatusFilterable {
  programStatus?: string | null;
}

/**
 * Returns the number of festivals whose programStatus is "complet".
 * Festivals with no programStatus are ignored.
 */
export function countFestivalsWithCompleteProgram<T extends ProgramStatusFilterable>(
  festivals: T[],
): number {
  return festivals.filter((f) => f.programStatus === "complet").length;
}

export interface ConfidenceLevelFilterable {
  confidenceLevel?: string | null;
}

/**
 * Returns the number of festivals with confidenceLevel === "vérifié_humain".
 * Festivals with no confidenceLevel are ignored.
 */
export function countVerifiedFestivals<T extends ConfidenceLevelFilterable>(
  festivals: T[],
): number {
  return festivals.filter((f) => f.confidenceLevel === "vérifié_humain").length;
}

export interface FestivalDurationComputable {
  startDate: string;
  endDate: string;
}

/**
 * Returns the duration in whole days (inclusive: endDate - startDate + 1).
 * Returns 1 for a same-day festival.
 * Returns null if either date is unparseable.
 */
export function computeFestivalDurationDays(startDate: string, endDate: string): number | null {
  const start = new Date(startDate.slice(0, 10));
  const end = new Date(endDate.slice(0, 10));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return days < 1 ? 1 : days;
}

/**
 * Returns the average duration in days (rounded to 1 decimal) across the given festivals.
 * Festivals with unparseable dates are ignored.
 * Returns null when the list is empty or all dates are invalid.
 */
export function computeAvgFestivalDurationDays<T extends FestivalDurationComputable>(
  festivals: T[],
): number | null {
  let total = 0;
  let count = 0;
  for (const f of festivals) {
    const d = computeFestivalDurationDays(f.startDate, f.endDate);
    if (d !== null) {
      total += d;
      count++;
    }
  }
  return count === 0 ? null : Math.round((total / count) * 10) / 10;
}

export interface TypeFilterable {
  festivalType: string;
}

/**
 * Returns a map from festivalType → count of festivals with that type.
 * Types with zero festivals are not included.
 */
export function countFestivalsByType<T extends TypeFilterable>(
  festivals: T[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const f of festivals) {
    counts.set(f.festivalType, (counts.get(f.festivalType) ?? 0) + 1);
  }
  return counts;
}

export interface CountryFilterable {
  country: string;
}

/**
 * Returns the sorted list of unique country codes present across the given festivals.
 */
export function getAvailableCountries<T extends CountryFilterable>(festivals: T[]): string[] {
  const set = new Set<string>();
  for (const f of festivals) {
    if (f.country) set.add(f.country);
  }
  return Array.from(set).sort();
}

/**
 * Returns false only when a country is selected and the festival's country does not match.
 */
export function matchesCountryFilter<T extends CountryFilterable>(
  festival: T,
  country: string | null,
): boolean {
  if (!country) return true;
  return festival.country === country;
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
