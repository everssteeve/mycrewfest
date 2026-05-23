export type AppearanceCountdownStatus = "today" | "imminent" | "upcoming" | "far" | null;

export function getAppearanceCountdownStatus(
  startDateIso: string,
  now = new Date(),
): AppearanceCountdownStatus {
  const start = new Date(startDateIso);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const diff = Math.round((startDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return null;
  if (diff === 0) return "today";
  if (diff <= 7) return "imminent";
  if (diff <= 30) return "upcoming";
  return "far";
}

export function formatAppearanceCountdownLabel(
  startDateIso: string,
  now = new Date(),
): string | null {
  const start = new Date(startDateIso);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const diff = Math.round((startDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return null;
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff <= 30) return `Dans ${diff} j`;
  return null;
}

export function getAppearanceCountdownColor(status: AppearanceCountdownStatus): string {
  switch (status) {
    case "today":
      return "var(--danger-red, #FF3355)";
    case "imminent":
      return "var(--warning-orange, #FF9900)";
    case "upcoming":
      return "var(--secondary-cyan, #00E5FF)";
    default:
      return "var(--text-dim, #666)";
  }
}
