import type { SouvenirEntry } from "@/app/(app)/festevent/[id]/journal/_components/journal-view";

/**
 * Returns true if the journal entry matches the given search query.
 * Searches in: freeText, note, linked event title, linked artist name, linked venue name.
 */
export function matchesJournalQuery(
  entry: Pick<SouvenirEntry, "freeText" | "note" | "event">,
  query: string,
): boolean {
  if (!query.trim()) return true;

  const q = query.trim().toLowerCase();

  const fields = [
    entry.freeText,
    entry.note,
    entry.event?.title,
    entry.event?.artist?.name,
    entry.event?.venue?.name,
  ];

  return fields.some((f) => f?.toLowerCase().includes(q));
}

/**
 * Groups filtered entries by day (YYYY-MM-DD), preserving day order.
 */
export function filterAndGroupByDay(
  entries: SouvenirEntry[],
  query: string,
): Map<string, SouvenirEntry[]> {
  const matched = query.trim()
    ? entries.filter((e) => matchesJournalQuery(e, query))
    : entries;

  const map = new Map<string, SouvenirEntry[]>();
  for (const e of matched) {
    const day = e.timestamp.slice(0, 10);
    const list = map.get(day) ?? [];
    list.push(e);
    map.set(day, list);
  }
  return map;
}
