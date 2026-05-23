const DEFAULT_EVENT_DURATION_MINS = 60;

export interface DensityEvent {
  startTime: string | null;
  endTime: string | null;
  durationMins: number | null;
  selection: { status: string } | null;
}

function resolveEventDuration(event: DensityEvent): number {
  if (event.durationMins != null && event.durationMins > 0) return event.durationMins;
  if (event.startTime && event.endTime) {
    const diff = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60_000;
    return diff > 0 ? diff : DEFAULT_EVENT_DURATION_MINS;
  }
  return DEFAULT_EVENT_DURATION_MINS;
}

export function computeTotalProgrammeDurationMins(events: DensityEvent[]): number {
  return events.reduce((sum, e) => sum + resolveEventDuration(e), 0);
}

export function computeSelectedDurationMins(events: DensityEvent[]): number {
  return events
    .filter((e) => e.selection?.status === "must-see" || e.selection?.status === "intéressant")
    .reduce((sum, e) => sum + resolveEventDuration(e), 0);
}

export function computeTimeCoveragePercent(selectedMins: number, totalMins: number): number {
  if (totalMins === 0) return 0;
  return Math.min(100, Math.round((selectedMins / totalMins) * 100));
}

export function getDensityLabel(percent: number): string {
  if (percent >= 80) return "Surchargé";
  if (percent >= 55) return "Dense";
  if (percent >= 30) return "Équilibré";
  if (percent >= 10) return "Léger";
  return "Vide";
}

export function getDensityColor(percent: number): string {
  if (percent >= 80) return "var(--danger-red)";
  if (percent >= 55) return "var(--warning-orange)";
  if (percent >= 30) return "var(--primary-neon)";
  if (percent >= 10) return "var(--secondary-cyan)";
  return "var(--text-dim)";
}

export function formatDensityBadge(percent: number, selectedMins: number): string {
  const h = Math.floor(selectedMins / 60);
  const m = Math.round(selectedMins % 60);
  const timeStr = h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}` : `${m}min`;
  return `◉ ${percent}% · ${timeStr} sélectionnés`;
}
