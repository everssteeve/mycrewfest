/** "1h30", "45min", "2h" */
export function formatEventDuration(durationMins: number): string {
  if (durationMins <= 0) return "";
  const h = Math.floor(durationMins / 60);
  const m = durationMins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

/** null when no restriction applies; "+7", "6–12 ans", "Tout public" etc. */
export function formatAgeRestriction(
  ageMin?: number | null,
  ageMax?: number | null,
): string | null {
  const hasMin = ageMin != null && ageMin > 0;
  const hasMax = ageMax != null && ageMax > 0;
  if (!hasMin && !hasMax) return null;
  if (hasMin && hasMax) return `${ageMin}–${ageMax} ans`;
  if (hasMin) return `+${ageMin}`;
  if (hasMax) return `−${ageMax} ans`;
  return null;
}

/** Returns a label for the access type, or null if "inclus" (default, no badge needed). */
export function getAccessLabel(
  access: "inclus" | "réservation_séparée",
): string | null {
  return access === "réservation_séparée" ? "Réservation" : null;
}
