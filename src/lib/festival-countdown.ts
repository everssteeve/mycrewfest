export type CountdownState = "upcoming" | "ongoing" | "past";
export type CountdownBadgeState =
  | "upcoming_urgent"
  | "upcoming_soon"
  | "upcoming"
  | "ongoing"
  | "past";

export interface CountdownInfo {
  state: CountdownState;
  daysRemaining: number | null; // null if ongoing or past
  label: string; // "J-37", "En cours", "Terminé"
  ariaLabel: string; // "Festival dans 37 jours", "Festival en cours", "Festival terminé"
}

/**
 * Returns the CountdownInfo for a festival based on its start and end dates.
 * `now` is injectable for testability — defaults to current time in production.
 *
 * Business rules:
 * - past    : now > endDate
 * - ongoing : startDate <= now <= endDate
 * - upcoming: now < startDate, daysRemaining = ceil((startDate - now) / 86400000)
 */
export function getFestivalCountdown(
  startDate: Date,
  endDate: Date,
  now: Date = new Date(),
): CountdownInfo {
  const nowMs = now.getTime();
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  if (nowMs > endMs) {
    return {
      state: "past",
      daysRemaining: null,
      label: "Terminé",
      ariaLabel: "Festival terminé",
    };
  }

  if (nowMs >= startMs) {
    return {
      state: "ongoing",
      daysRemaining: null,
      label: "En cours",
      ariaLabel: "Festival en cours",
    };
  }

  // upcoming
  const daysRemaining = Math.ceil((startMs - nowMs) / 86_400_000);
  return {
    state: "upcoming",
    daysRemaining,
    label: `J-${daysRemaining}`,
    ariaLabel: `Festival dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`,
  };
}

// ---------------------------------------------------------------------------
// Badge countdown (granular states for the festival detail page badge)
// ---------------------------------------------------------------------------

function daysUntilStartFromIso(startDateIso: string, now: Date): number {
  return Math.floor((new Date(startDateIso).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCountdownBadgeState(
  startDateIso: string,
  endDateIso: string,
  now: Date = new Date(),
): CountdownBadgeState {
  const start = new Date(startDateIso);
  const end = new Date(endDateIso);
  if (end < now) return "past";
  if (start <= now) return "ongoing";
  const days = daysUntilStartFromIso(startDateIso, now);
  if (days <= 3) return "upcoming_urgent";
  if (days <= 14) return "upcoming_soon";
  return "upcoming";
}

export function getCountdownBadgeLabel(
  startDateIso: string,
  endDateIso: string,
  now: Date = new Date(),
): string {
  const state = getCountdownBadgeState(startDateIso, endDateIso, now);
  switch (state) {
    case "ongoing":
      return "EN COURS";
    case "upcoming_urgent":
      return `J-${daysUntilStartFromIso(startDateIso, now)}`;
    case "upcoming_soon":
      return `DANS ${daysUntilStartFromIso(startDateIso, now)} JOURS`;
    default:
      return "";
  }
}

export function getCountdownBadgeColor(state: CountdownBadgeState): string {
  switch (state) {
    case "upcoming_urgent":
      return "#FF3355";
    case "upcoming_soon":
      return "#FF9900";
    case "ongoing":
      return "#00FF66";
    default:
      return "";
  }
}
