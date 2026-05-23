export interface BilantableEvent {
  title: string;
  durationMins?: number | null;
  selection?: { status: string } | null;
  venue?: { name: string } | null;
  tags?: string[] | null;
}

export interface BilanStats {
  totalSeen: number;
  totalDurationMins: number;
  mustSeePending: number;
  intéresséPending: number;
  topVenue: string | null;
  uniqueVenues: number;
  topTag: string | null;
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

  return {
    totalSeen: seen.length,
    totalDurationMins,
    mustSeePending,
    intéresséPending,
    topVenue,
    uniqueVenues: venueCounts.size,
    topTag,
  };
}

export function formatBilanDuration(mins: number): string {
  if (mins <= 0) return "0min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}
