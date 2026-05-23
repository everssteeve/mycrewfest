export interface JournalStatsEntry {
  timestamp: string;
  photos?: string[];
}

export interface JournalStats {
  totalEntries: number;
  totalDays: number;
  entriesWithPhotos: number;
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

  return {
    totalEntries: entries.length,
    totalDays: days.size,
    entriesWithPhotos,
  };
}
