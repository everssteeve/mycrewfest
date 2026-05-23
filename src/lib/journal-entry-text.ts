import type { SouvenirEntry } from "@/app/(app)/festevent/[id]/journal/_components/journal-view";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}h${d.getMinutes().toString().padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function formatDateLong(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function formatJournalEntryText(
  entry: Pick<SouvenirEntry, "freeText" | "note" | "timestamp" | "event">,
  festivalName: string,
): string {
  const lines: string[] = [];

  lines.push(`📔 ${festivalName}`);
  lines.push(`${formatTime(entry.timestamp)} — ${formatDateLong(entry.timestamp)}`);

  if (entry.event) {
    lines.push("");
    const parts = [entry.event.artist?.name, entry.event.venue?.name].filter(Boolean);
    lines.push(parts.length > 0 ? `🎤 ${parts.join(" · ")}` : `🎤 ${entry.event.title}`);
    if (parts.length > 0) lines.push(entry.event.title);
  }

  if (entry.freeText) {
    lines.push("");
    lines.push(entry.freeText);
  }

  if (entry.note) {
    lines.push("");
    lines.push(`Note : ${entry.note}`);
  }

  return lines.join("\n");
}
