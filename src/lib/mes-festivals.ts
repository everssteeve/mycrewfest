import type { FestivalSummary } from "@/types";

export function sortFollowedByDate(festivals: FestivalSummary[]): FestivalSummary[] {
  return [...festivals].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
}

export function getDaysUntil(startDateIso: string, now: Date = new Date()): number {
  const start = new Date(startDateIso);
  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const nowDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((startDay - nowDay) / 86_400_000);
}

export function formatDaysUntilLabel(startDateIso: string, now?: Date): string {
  const d = getDaysUntil(startDateIso, now);
  if (d < 0) return `J+${Math.abs(d)}`;
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return "Demain";
  return `Dans ${d} j`;
}

export function getDaysUntilColor(days: number): string {
  if (days < 0) return "#666";
  if (days <= 3) return "#FF3355";
  if (days <= 7) return "#FF9900";
  if (days <= 30) return "#00FF66";
  return "#666";
}
