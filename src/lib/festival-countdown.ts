export type CountdownState = "upcoming" | "ongoing" | "past";

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
  now: Date = new Date()
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
