import { computeBilan, formatBilanDuration, type BilantableEvent } from "./bilan";

/**
 * Generates a shareable text summary of the post-festival bilan.
 */
export function generateBilanText<T extends BilantableEvent>(
  events: T[],
  festivalName: string,
): string {
  const stats = computeBilan(events);
  const seenEvents = events.filter((e) => e.selection?.status === "vu");
  const missedMustSee = events.filter((e) => e.selection?.status === "must-see");

  const lines: string[] = [`🎪 Mon bilan — ${festivalName}`, ""];

  // Global stats
  lines.push(
    `✅ ${stats.totalSeen} event${stats.totalSeen !== 1 ? "s" : ""} vu${stats.totalSeen !== 1 ? "s" : ""}`,
  );
  if (stats.totalDurationMins > 0) {
    lines.push(`⏱ ${formatBilanDuration(stats.totalDurationMins)} de spectacles`);
  }
  if (stats.topVenue) {
    lines.push(`📍 Scène favorite : ${stats.topVenue}`);
  }
  if (stats.mustSeePending > 0) {
    lines.push(
      `⚠ ${stats.mustSeePending} must-see manqué${stats.mustSeePending !== 1 ? "s" : ""}`,
    );
  }

  // Seen events list
  if (seenEvents.length > 0) {
    lines.push("");
    lines.push("🎤 Events vus");
    for (const e of seenEvents) {
      const venue = e.venue?.name ? ` (${e.venue.name})` : "";
      lines.push(`• ${e.title}${venue}`);
    }
  }

  // Missed must-sees
  if (missedMustSee.length > 0) {
    lines.push("");
    lines.push("💔 Must-see manqués");
    for (const e of missedMustSee) {
      const venue = e.venue?.name ? ` (${e.venue.name})` : "";
      lines.push(`• ${e.title}${venue}`);
    }
  }

  if (stats.totalSeen === 0 && stats.mustSeePending === 0) {
    lines.push("Aucun événement sélectionné.");
  }

  return lines.join("\n").trimEnd();
}
