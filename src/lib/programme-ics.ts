import { generateIcs, type IcsEvent } from "@/lib/ics";

export interface IcsConvertible {
  id: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  durationMins: number | null;
  venue: { name: string } | null;
  artist: { name: string } | null;
  selection: { status: string } | null;
}

export type IcsSelectionFilter = "selected" | "must-see" | "all-with-time";

export function isExportable(event: IcsConvertible, filter: IcsSelectionFilter): boolean {
  if (!event.startTime) return false;
  switch (filter) {
    case "must-see":
      return event.selection?.status === "must-see";
    case "selected":
      return event.selection?.status === "must-see" || event.selection?.status === "intéressant";
    case "all-with-time":
      return true;
  }
}

export function deriveEndIso(event: IcsConvertible): string {
  if (event.endTime) return event.endTime;
  if (event.startTime && event.durationMins) {
    const start = new Date(event.startTime).getTime();
    return new Date(start + event.durationMins * 60_000).toISOString();
  }
  // Default: 1 hour after start
  const start = new Date(event.startTime!).getTime();
  return new Date(start + 60 * 60_000).toISOString();
}

export function toIcsEvent(event: IcsConvertible): IcsEvent {
  const summary = event.artist
    ? `${event.artist.name} — ${event.title}`
    : event.title;

  return {
    uid: event.id,
    summary,
    location: event.venue?.name,
    startIso: event.startTime!,
    endIso: deriveEndIso(event),
  };
}

export function buildProgrammeIcs(
  events: IcsConvertible[],
  festivalName: string,
  filter: IcsSelectionFilter = "selected",
): string {
  const exportable = events
    .filter((e) => isExportable(e, filter))
    .map(toIcsEvent);

  return generateIcs(exportable, `${festivalName} — MyCrewFest`);
}

export function countExportableEvents(
  events: IcsConvertible[],
  filter: IcsSelectionFilter,
): number {
  return events.filter((e) => isExportable(e, filter)).length;
}
