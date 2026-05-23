export interface ShareableEvent {
  title: string;
  startTime?: string | null;
  venue?: { name: string } | null;
  selection?: { status: string } | null;
}

function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}h${d.getMinutes().toString().padStart(2, "0")}`;
}

const STATUS_EMOJI: Record<string, string> = {
  "must-see": "★",
  intéressé: "♥",
  vu: "✓",
};

/**
 * Generates a shareable text line for a single programme event.
 */
export function formatEventShareLine(event: ShareableEvent): string {
  const time = event.startTime ? formatHHMM(event.startTime) : "?";
  const venue = event.venue?.name ? ` · ${event.venue.name}` : "";
  const emoji = event.selection?.status ? (STATUS_EMOJI[event.selection.status] ?? "") : "";
  const prefix = emoji ? `${emoji} ` : "";
  return `${prefix}${time} — ${event.title}${venue}`;
}

/**
 * Generates a shareable text listing of selected events in the programme.
 * Events without startTime are placed at the end.
 */
export function generateProgrammeShareText(events: ShareableEvent[], festivalName: string): string {
  const selected = events.filter((e) => e.selection?.status != null);
  if (selected.length === 0) return "";

  const withTime = selected
    .filter((e) => e.startTime)
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  const withoutTime = selected.filter((e) => !e.startTime);

  const lines = [...withTime, ...withoutTime].map(formatEventShareLine);
  return `📅 ${festivalName}\n\n${lines.join("\n")}`;
}
