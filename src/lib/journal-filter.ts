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

export interface CrewFilterable {
  shareWithCrew: boolean;
}

/**
 * Returns entries shared with crew when crewOnly is true; otherwise returns all.
 */
export function filterByCrew<T extends CrewFilterable>(
  entries: T[],
  crewOnly: boolean,
): T[] {
  if (!crewOnly) return entries;
  return entries.filter((e) => e.shareWithCrew);
}

export type JournalEntryTypeFilter = "tous" | "event" | "libre";

export interface EntryTypeFilterable {
  eventId: string | null;
}

/**
 * Filters journal entries by their type:
 * - "event"  : entries linked to a specific event (eventId is set)
 * - "libre"  : free-form entries not linked to any event
 * - "tous"   : returns all entries
 */
export function filterByEntryType<T extends EntryTypeFilterable>(
  entries: T[],
  type: JournalEntryTypeFilter,
): T[] {
  if (type === "tous") return entries;
  if (type === "event") return entries.filter((e) => e.eventId !== null);
  return entries.filter((e) => e.eventId === null);
}

/**
 * Groups filtered entries by day (YYYY-MM-DD), preserving day order.
 */
export function filterAndGroupByDay(
  entries: SouvenirEntry[],
  query: string,
  crewOnly = false,
  entryType: JournalEntryTypeFilter = "tous",
): Map<string, SouvenirEntry[]> {
  const crewFiltered = filterByCrew(entries, crewOnly);
  const typeFiltered = filterByEntryType(crewFiltered, entryType);
  const matched = query.trim()
    ? typeFiltered.filter((e) => matchesJournalQuery(e, query))
    : typeFiltered;

  const map = new Map<string, SouvenirEntry[]>();
  for (const e of matched) {
    const day = e.timestamp.slice(0, 10);
    const list = map.get(day) ?? [];
    list.push(e);
    map.set(day, list);
  }
  return map;
}
