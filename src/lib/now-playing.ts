/**
 * Formats a "minutes until next event" value as a human-readable string.
 */
export function formatMinsUntil(mins: number): string {
  if (mins < 1) return "maintenant";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
