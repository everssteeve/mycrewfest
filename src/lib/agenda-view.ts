export interface AgendaEvent {
  id: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  status: "must-see" | "intéressé" | "vu";
  venue: string | null;
  artist: string | null;
}

export interface AgendaDay {
  dateKey: string; // "2026-07-16"
  label: string; // "Jeudi 16 juillet"
  events: AgendaEvent[];
}

export interface AgendaFestival {
  festEventId: string;
  festivalName: string;
  festivalSlug: string;
  startDate: string;
  endDate: string;
  days: AgendaDay[];
  mustSeeCount: number;
  intéresséCount: number;
}

const DAY_NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export function formatAgendaDayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00Z`);
  const dayName = DAY_NAMES[d.getUTCDay()];
  const dayNum = d.getUTCDate();
  const monthName = MONTH_NAMES[d.getUTCMonth()];
  return `${dayName} ${dayNum} ${monthName}`;
}

export function getDateKey(isoString: string): string {
  return isoString.slice(0, 10);
}

export function groupEventsByDay(events: AgendaEvent[]): AgendaDay[] {
  const map = new Map<string, AgendaEvent[]>();

  for (const ev of events) {
    const key = ev.startTime ? getDateKey(ev.startTime) : "sans-date";
    if (!map.has(key)) map.set(key, []);
    map.get(key)?.push(ev);
  }

  const days: AgendaDay[] = Array.from(map.entries()).map(([dateKey, dayEvents]) => ({
    dateKey,
    label: dateKey === "sans-date" ? "Date non définie" : formatAgendaDayLabel(dateKey),
    events: dayEvents.sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    }),
  }));

  return days.sort((a, b) => {
    if (a.dateKey === "sans-date") return 1;
    if (b.dateKey === "sans-date") return -1;
    return a.dateKey.localeCompare(b.dateKey);
  });
}

export function countByStatus(events: AgendaEvent[], status: AgendaEvent["status"]): number {
  return events.filter((e) => e.status === status).length;
}

export function buildAgendaFestival(
  festEventId: string,
  festivalName: string,
  festivalSlug: string,
  startDate: string,
  endDate: string,
  events: AgendaEvent[],
): AgendaFestival {
  const allEvents = events.filter((e) => e.status !== "vu");
  const days = groupEventsByDay(allEvents);
  return {
    festEventId,
    festivalName,
    festivalSlug,
    startDate,
    endDate,
    days,
    mustSeeCount: countByStatus(allEvents, "must-see"),
    intéresséCount: countByStatus(allEvents, "intéressé"),
  };
}

export function sortFestivalsByStartDate(festivals: AgendaFestival[]): AgendaFestival[] {
  return [...festivals].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getTotalEventCount(festivals: AgendaFestival[]): number {
  return festivals.reduce((sum, f) => sum + f.mustSeeCount + f.intéresséCount, 0);
}
