export type TemporalStatus = "en_cours" | "imminent" | "upcoming" | "past";

const IMMINENT_DAYS = 7;

export function getFestivalTemporalStatus(
  startDate: string | Date,
  endDate: string | Date,
  now: Date = new Date()
): TemporalStatus {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Normalize to day boundaries (compare dates, not times)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (today > endDay) return "past";
  if (today >= startDay) return "en_cours";

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilStart = Math.round((startDay.getTime() - today.getTime()) / msPerDay);

  if (daysUntilStart <= IMMINENT_DAYS) return "imminent";
  return "upcoming";
}

export function getDaysUntilStart(
  startDate: string | Date,
  now: Date = new Date()
): number {
  const start = new Date(startDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((startDay.getTime() - today.getTime()) / msPerDay);
}

/**
 * Returns a short display label for a festival temporal badge, or null for "upcoming" (no badge).
 * - en_cours → "En cours"
 * - imminent + daysUntil=0 → "Demain"
 * - imminent + daysUntil>0 → "Dans N j"
 * - past → "Passé"
 * - upcoming → null (no badge needed)
 */
export function formatTemporalBadge(
  status: TemporalStatus,
  daysUntil: number,
): string | null {
  switch (status) {
    case "en_cours": return "En cours";
    case "imminent": return daysUntil <= 0 ? "Demain" : `Dans ${daysUntil} j`;
    case "past": return "Passé";
    case "upcoming": return null;
  }
}

const STATUS_ORDER: Record<TemporalStatus, number> = {
  en_cours: 0,
  imminent: 1,
  upcoming: 2,
  past: 3,
};

export function compareByTemporalRelevance(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string },
  now: Date = new Date()
): number {
  const statusA = getFestivalTemporalStatus(a.startDate, a.endDate, now);
  const statusB = getFestivalTemporalStatus(b.startDate, b.endDate, now);

  if (STATUS_ORDER[statusA] !== STATUS_ORDER[statusB]) {
    return STATUS_ORDER[statusA] - STATUS_ORDER[statusB];
  }

  // Within same status: sort ascending by startDate (except past: descending by endDate)
  if (statusA === "past") {
    return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
  }
  return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
}
