export interface BilantableEvent {
  title: string;
  durationMins?: number | null;
  selection?: { status: string } | null;
  venue?: { name: string } | null;
  tags?: string[] | null;
  startTime?: string | null;
}

export interface BilanStats {
  totalSeen: number;
  totalDurationMins: number;
  mustSeePending: number;
  intéresséPending: number;
  topVenue: string | null;
  uniqueVenues: number;
  topTag: string | null;
  avgStartHour: number | null;
  bestDay: { date: string; count: number } | null;
}

export function computeBilan<T extends BilantableEvent>(events: T[]): BilanStats {
  const seen = events.filter((e) => e.selection?.status === "vu");
  const mustSeePending = events.filter((e) => e.selection?.status === "must-see").length;
  const intéresséPending = events.filter((e) => e.selection?.status === "intéressé").length;

  const totalDurationMins = seen.reduce((acc, e) => acc + (e.durationMins ?? 0), 0);

  const venueCounts = new Map<string, number>();
  for (const e of seen) {
    if (e.venue?.name) {
      venueCounts.set(e.venue.name, (venueCounts.get(e.venue.name) ?? 0) + 1);
    }
  }

  let topVenue: string | null = null;
  let maxCount = 0;
  for (const [name, count] of venueCounts) {
    if (count > maxCount) {
      maxCount = count;
      topVenue = name;
    }
  }

  const tagCounts = new Map<string, number>();
  for (const e of seen) {
    for (const tag of e.tags ?? []) {
      if (tag) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  let topTag: string | null = null;
  let maxTagCount = 0;
  for (const [tag, count] of tagCounts) {
    if (count > maxTagCount) {
      maxTagCount = count;
      topTag = tag;
    }
  }

  const seenWithTime = seen.filter((e) => e.startTime);
  let avgStartHour: number | null = null;
  if (seenWithTime.length > 0) {
    const totalMins = seenWithTime.reduce((acc, e) => {
      const d = new Date(e.startTime as string);
      return acc + d.getHours() * 60 + d.getMinutes();
    }, 0);
    const avgMins = totalMins / seenWithTime.length;
    avgStartHour = Math.round(avgMins * 10) / 10;
  }

  const dayCounts = new Map<string, number>();
  for (const e of seen) {
    if (!e.startTime) continue;
    const d = new Date(e.startTime);
    const day = d.toLocaleDateString("sv-SE");
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }
  let bestDay: { date: string; count: number } | null = null;
  for (const [date, count] of dayCounts) {
    if (!bestDay || count > bestDay.count) {
      bestDay = { date, count };
    }
  }

  return {
    totalSeen: seen.length,
    totalDurationMins,
    mustSeePending,
    intéresséPending,
    topVenue,
    uniqueVenues: venueCounts.size,
    topTag,
    avgStartHour,
    bestDay,
  };
}

/**
 * Formats a fractional hour value (e.g. 21.5) as "21h30".
 * avgStartHour is stored in minutes-since-midnight / 1 (0..1440 range as float minutes).
 * Actually stored as fractional hours, so 21.5 = 21h30.
 */
export function formatAvgHour(avgMins: number): string {
  const h = Math.floor(avgMins / 60);
  const m = Math.round(avgMins % 60);
  return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, "0")}`;
}

export function formatBestDay(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatBilanDuration(mins: number): string {
  if (mins <= 0) return "0min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}
