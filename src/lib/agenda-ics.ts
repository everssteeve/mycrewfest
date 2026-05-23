import type { IcsEvent } from "@/lib/ics";

export interface AgendaIcsEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string | null;
  durationMins: number | null;
  venue: string | null;
  artist: string | null;
  festivalName: string;
  status: string;
}

export function deriveAgendaEndIso(event: AgendaIcsEvent): string {
  if (event.endTime) return event.endTime;
  if (event.durationMins) {
    const end = new Date(
      new Date(event.startTime).getTime() + event.durationMins * 60_000,
    );
    return end.toISOString();
  }
  // Default: 1 hour
  const end = new Date(new Date(event.startTime).getTime() + 60 * 60_000);
  return end.toISOString();
}

export function buildAgendaIcsEvent(event: AgendaIcsEvent): IcsEvent {
  const parts: string[] = [];
  if (event.artist) parts.push(event.artist);
  parts.push(event.title);
  const summary = parts.join(" — ");

  const descParts: string[] = [`Festival: ${event.festivalName}`];
  if (event.status === "must-see") descParts.push("★ Must-see");
  else if (event.status === "intéressé") descParts.push("♡ Intéressé");

  return {
    uid: event.id,
    summary,
    location: event.venue ?? undefined,
    description: descParts.join("\\n"),
    startIso: event.startTime,
    endIso: deriveAgendaEndIso(event),
  };
}

export function buildAgendaIcsEvents(events: AgendaIcsEvent[]): IcsEvent[] {
  return events
    .filter((e) => !!e.startTime)
    .map(buildAgendaIcsEvent);
}
