export interface DayFilterable {
  startTime?: string | null;
}

function toLocalYMD(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE");
}

function todayYMD(): string {
  return new Date().toLocaleDateString("sv-SE");
}

/**
 * Extracts unique calendar days (YYYY-MM-DD) from event startTimes,
 * sorted chronologically. Events without startTime are excluded.
 */
export function extractEventDays<T extends DayFilterable>(events: T[]): string[] {
  const days = new Set<string>();
  for (const e of events) {
    if (e.startTime) days.add(toLocalYMD(e.startTime));
  }
  return Array.from(days).sort();
}

/**
 * Finds the best default day to show when loading the programme:
 * - If today is one of the available days, return today
 * - Otherwise return the first available day
 * - If no days are available, return null ("Tous" / all)
 */
export function getDefaultProgrammeDay(days: string[]): string | null {
  if (days.length === 0) return null;
  const today = todayYMD();
  return days.includes(today) ? today : days[0];
}

/**
 * Formats a YYYY-MM-DD string as a short French label (e.g. "sam. 15").
 * Falls back to the raw string on parse error.
 */
export function formatDayLabel(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
}
