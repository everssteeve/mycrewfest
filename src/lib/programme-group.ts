export interface GroupableEvent {
  id: string;
  venue: { id: string; name: string } | null;
  startTime: string | null;
}

export interface VenueGroup<T extends GroupableEvent> {
  venueId: string | null;
  venueName: string;
  events: T[];
}

export function groupEventsByVenue<T extends GroupableEvent>(events: T[]): VenueGroup<T>[] {
  const map = new Map<string, VenueGroup<T>>();

  for (const event of events) {
    const key = event.venue?.id ?? "__no_venue__";
    if (!map.has(key)) {
      map.set(key, {
        venueId: event.venue?.id ?? null,
        venueName: event.venue?.name ?? "Scène inconnue",
        events: [],
      });
    }
    map.get(key)!.events.push(event);
  }

  return Array.from(map.values());
}

export function sortVenueGroups<T extends GroupableEvent>(groups: VenueGroup<T>[]): VenueGroup<T>[] {
  return [...groups].sort((a, b) => {
    // Groups with a real venue come before "unknown"
    if (a.venueId === null && b.venueId !== null) return 1;
    if (a.venueId !== null && b.venueId === null) return -1;
    // Sort by event count descending
    if (b.events.length !== a.events.length) return b.events.length - a.events.length;
    return a.venueName.localeCompare(b.venueName, "fr");
  });
}

export function sortEventsWithinGroup<T extends GroupableEvent>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    if (!a.startTime && !b.startTime) return 0;
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
  });
}

export function countEventsPerVenue(events: GroupableEvent[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const event of events) {
    const key = event.venue?.id ?? "__no_venue__";
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}
