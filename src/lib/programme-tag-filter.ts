/**
 * Utilities for extracting, filtering, and formatting programme event tags.
 * Zero React / Prisma imports — pure functions only.
 */

/**
 * Parses a raw tags field (JSON string or null) into a string array.
 * Returns [] on invalid JSON or null input.
 */
export function parseEventTags(tags?: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is string => typeof t === "string");
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Extracts unique tags from a list of events.
 * Accepts events with `tags` as string[] or JSON string or null.
 * Returns a sorted array of unique tag strings.
 */
export function extractEventTags(
  events: Array<{ tags?: string[] | string | null }>,
): string[] {
  const set = new Set<string>();
  for (const e of events) {
    const raw = e.tags;
    if (Array.isArray(raw)) {
      for (const t of raw) set.add(t);
    } else if (typeof raw === "string") {
      for (const t of parseEventTags(raw)) set.add(t);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
}

/**
 * Filters events by selected tags.
 * If selectedTags is empty, all events are returned.
 * An event matches if at least one of its tags is in selectedTags.
 */
export function filterEventsByTags<T extends { tags?: string[] | string | null }>(
  events: T[],
  selectedTags: string[],
): T[] {
  if (selectedTags.length === 0) return events;
  const tagSet = new Set(selectedTags);
  return events.filter((e) => {
    const raw = e.tags;
    if (Array.isArray(raw)) {
      return raw.some((t) => tagSet.has(t));
    }
    if (typeof raw === "string") {
      return parseEventTags(raw).some((t) => tagSet.has(t));
    }
    return false;
  });
}

/**
 * Formats a raw tag key for display.
 * Examples:
 *   "têtes_d_affiche" → "Têtes d'affiche"
 *   "hip-hop"         → "Hip-hop"
 *   "électronique"    → "Électronique"
 */
export function formatTagLabel(tag: string): string {
  // Replace underscores: "d_" becomes "d'" (elision), others become a space
  const withSpaces = tag.replace(/_d_/g, " d'").replace(/_l_/g, " l'").replace(/_/g, " ");
  // Capitalise first character
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}
