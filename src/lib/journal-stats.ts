export interface JournalStatsEntry {
  timestamp: string;
  photos?: string[];
  freeText?: string | null;
  note?: string | null;
}

export interface JournalStats {
  totalEntries: number;
  totalDays: number;
  entriesWithPhotos: number;
  totalWords: number;
  maxStreakDays: number;
  avgWordsPerEntry: number;
}

export interface MostActiveDay {
  date: string;
  count: number;
}

export interface PhotoDayEntry {
  timestamp: string;
  photos?: string[];
}

/**
 * Returns the total count of photos across all entries.
 * Entries with no photos array or an empty array contribute 0.
 */
export function countTotalJournalPhotos(entries: PhotoDayEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.photos?.length ?? 0), 0);
}

/**
 * Returns the number of distinct days that have at least one photo entry.
 */
export function countDaysWithPhotos(entries: PhotoDayEntry[]): number {
  const days = new Set<string>();
  for (const e of entries) {
    if (!e.photos || e.photos.length === 0) continue;
    const d = new Date(e.timestamp);
    if (!Number.isNaN(d.getTime())) {
      days.add(d.toLocaleDateString("sv-SE"));
    }
  }
  return days.size;
}

/**
 * Returns the date (YYYY-MM-DD) with the most journal entries, or null for empty input.
 * Ties are broken by earliest date.
 */
export function getMostActiveJournalDay(
  entries: Pick<JournalStatsEntry, "timestamp">[],
): MostActiveDay | null {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const d = new Date(e.timestamp);
    if (Number.isNaN(d.getTime())) continue;
    const ymd = d.toLocaleDateString("sv-SE");
    counts.set(ymd, (counts.get(ymd) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  let top: MostActiveDay | null = null;
  for (const [date, count] of counts) {
    if (!top || count > top.count || (count === top.count && date < top.date)) {
      top = { date, count };
    }
  }
  return top;
}

/**
 * Returns the average number of entries per active day, rounded to one decimal.
 * Returns null when there are no days (empty journal).
 */
export function computeAvgEntriesPerDay(totalEntries: number, totalDays: number): number | null {
  if (totalDays === 0) return null;
  return Math.round((totalEntries / totalDays) * 10) / 10;
}

export interface TimestampedEntry {
  timestamp: string;
}

/**
 * Returns the number of whole days since the most recent journal entry,
 * or null when there are no entries. Returns 0 when the last entry was today.
 */
export function getDaysSinceLastEntry(
  entries: TimestampedEntry[],
  now = new Date(),
): number | null {
  if (entries.length === 0) return null;
  let latestMs = -Infinity;
  for (const e of entries) {
    const ms = new Date(e.timestamp).getTime();
    if (!Number.isNaN(ms) && ms > latestMs) latestMs = ms;
  }
  if (latestMs === -Infinity) return null;
  const todayStart = new Date(now.toLocaleDateString("sv-SE")).getTime();
  const latestStart = new Date(new Date(latestMs).toLocaleDateString("sv-SE")).getTime();
  return Math.max(0, Math.round((todayStart - latestStart) / 86_400_000));
}

export function computeJournalStats(entries: JournalStatsEntry[]): JournalStats {
  const days = new Set<string>();
  let entriesWithPhotos = 0;

  for (const e of entries) {
    const d = new Date(e.timestamp);
    if (!Number.isNaN(d.getTime())) {
      days.add(d.toLocaleDateString("sv-SE"));
    }
    if (e.photos && e.photos.length > 0) {
      entriesWithPhotos++;
    }
  }

  let totalWords = 0;
  for (const e of entries) {
    const text = [e.freeText, e.note].filter(Boolean).join(" ");
    if (text.trim()) {
      totalWords += text.trim().split(/\s+/).length;
    }
  }

  const sortedDays = [...days].sort();
  let maxStreakDays = sortedDays.length > 0 ? 1 : 0;
  let currentStreak = sortedDays.length > 0 ? 1 : 0;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]).getTime();
    const curr = new Date(sortedDays[i]).getTime();
    if (curr - prev === 86_400_000) {
      currentStreak++;
      if (currentStreak > maxStreakDays) maxStreakDays = currentStreak;
    } else {
      currentStreak = 1;
    }
  }

  const avgWordsPerEntry = entries.length > 0 ? Math.round(totalWords / entries.length) : 0;

  return {
    totalEntries: entries.length,
    totalDays: days.size,
    entriesWithPhotos,
    totalWords,
    maxStreakDays,
    avgWordsPerEntry,
  };
}
