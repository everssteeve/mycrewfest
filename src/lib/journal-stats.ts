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
