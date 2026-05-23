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
 * Returns the number of distinct days that have at least one photo entry.
 */
export function countDaysWithPhotos(entries: PhotoDayEntry[]): number {
  const days = new Set<string>();
  for (const e of entries) {
    if (!e.photos || e.photos.length === 0) continue;
    const d = new Date(e.timestamp);
    if (!isNaN(d.getTime())) {
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
    if (isNaN(d.getTime())) continue;
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

export function computeJournalStats(entries: JournalStatsEntry[]): JournalStats {
  const days = new Set<string>();
  let entriesWithPhotos = 0;

  for (const e of entries) {
    const d = new Date(e.timestamp);
    if (!isNaN(d.getTime())) {
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
