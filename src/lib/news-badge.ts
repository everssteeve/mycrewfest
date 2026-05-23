export type NewsBadgeStatus = "urgent" | "normal" | null;

const RECENT_DAYS = 7;

export function computeNewsStatus(
  recentNewsCount: number,
  hasUrgentNews: boolean,
): NewsBadgeStatus {
  if (recentNewsCount <= 0) return null;
  return hasUrgentNews ? "urgent" : "normal";
}

export function isRecentPublishDate(publishedAt: string, now = new Date()): boolean {
  const diff = now.getTime() - new Date(publishedAt).getTime();
  return diff >= 0 && diff <= RECENT_DAYS * 24 * 60 * 60 * 1000;
}

export function getNewsBadgeLabel(status: NewsBadgeStatus): string {
  if (status === "urgent") return "⚠ Alerte";
  if (status === "normal") return "Nouveau";
  return "";
}

export function getNewsBadgeColor(status: NewsBadgeStatus): string {
  if (status === "urgent") return "var(--danger-red, #FF3355)";
  if (status === "normal") return "var(--warning-orange, #FF9900)";
  return "transparent";
}
