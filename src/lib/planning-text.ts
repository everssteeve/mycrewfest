export interface PlanningTextEvent {
  title: string;
  startTime?: string | null;
  endTime?: string | null;
  venue?: { name: string } | null;
}

function formatTimeHHMM(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}h${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatDateHeader(iso: string, locale = "fr-FR"): string {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function toYMD(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE");
}

/**
 * Generates a human-readable planning text, grouped by day.
 * Events without startTime are placed in a trailing "Itinérant" section.
 */
export function generatePlanningText(events: PlanningTextEvent[], festivalName: string): string {
  if (events.length === 0) {
    return `🎪 Mon planning — ${festivalName}\n\nAucun événement sélectionné.`;
  }

  const withTime = events.filter((e) => e.startTime);
  const noTime = events.filter((e) => !e.startTime);

  // Group events by calendar day
  const byDay = new Map<string, PlanningTextEvent[]>();
  for (const e of withTime) {
    const day = toYMD(e.startTime as string);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)?.push(e);
  }

  // Sort days chronologically
  const sortedDays = Array.from(byDay.keys()).sort();

  const lines: string[] = [`🎪 Mon planning — ${festivalName}`, ""];

  for (const day of sortedDays) {
    const dayEvents = (byDay.get(day) ?? []).sort((a, b) =>
      (a.startTime as string).localeCompare(b.startTime as string),
    );
    const iso = `${day}T12:00:00`;
    lines.push(`📅 ${formatDateHeader(iso)}`);
    for (const e of dayEvents) {
      const time = formatTimeHHMM(e.startTime as string);
      const venue = e.venue?.name ? ` (${e.venue.name})` : "";
      lines.push(`• ${time} — ${e.title}${venue}`);
    }
    lines.push("");
  }

  if (noTime.length > 0) {
    lines.push("📍 Itinérant");
    for (const e of noTime) {
      const venue = e.venue?.name ? ` (${e.venue.name})` : "";
      lines.push(`• ${e.title}${venue}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
