export interface DayScorableEvent {
  startTime?: string | null;
  endTime?: string | null;
  durationMins?: number | null;
  selection?: { status: string } | null;
}

export interface DayScore {
  day: string;
  mustSee: number;
  interested: number;
  total: number;
  durationMins: number;
}

const DEFAULT_DURATION_MS = 60 * 60_000;

function toLocalYMD(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE");
}

function resolveEndMs(event: DayScorableEvent): number | null {
  if (!event.startTime) return null;
  const startMs = new Date(event.startTime).getTime();
  if (event.endTime) return new Date(event.endTime).getTime();
  if (event.durationMins) return startMs + event.durationMins * 60_000;
  return startMs + DEFAULT_DURATION_MS;
}

export function computeDayScores<T extends DayScorableEvent>(
  events: T[],
  days: string[],
): DayScore[] {
  return days.map((day) => {
    const dayEvents = events.filter((e) => {
      if (!e.startTime) return false;
      return toLocalYMD(e.startTime) === day;
    });

    let mustSee = 0;
    let interested = 0;
    let durationMins = 0;

    for (const e of dayEvents) {
      const status = e.selection?.status;
      if (status === "must-see") mustSee++;
      else if (status === "intéressé") interested++;

      if (status === "must-see" || status === "intéressé") {
        const startMs = e.startTime ? new Date(e.startTime).getTime() : null;
        const endMs = resolveEndMs(e);
        if (startMs !== null && endMs !== null) {
          durationMins += Math.round((endMs - startMs) / 60_000);
        }
      }
    }

    return { day, mustSee, interested, total: mustSee + interested, durationMins };
  });
}

export function getMostLoadedDay(scores: DayScore[]): DayScore | null {
  if (scores.length === 0) return null;
  return scores.reduce((best, s) => (s.total > best.total ? s : best), scores[0]);
}

export function getDayLoadLevel(score: DayScore): "light" | "moderate" | "heavy" {
  if (score.total === 0) return "light";
  if (score.total <= 3) return "light";
  if (score.total <= 7) return "moderate";
  return "heavy";
}

export function getDayLoadColor(level: "light" | "moderate" | "heavy"): string {
  switch (level) {
    case "heavy": return "var(--accent-pink)";
    case "moderate": return "var(--warning-orange)";
    case "light": return "var(--text-dim)";
  }
}

export function formatDayDuration(durationMins: number): string {
  if (durationMins === 0) return "0h";
  const h = Math.floor(durationMins / 60);
  const m = durationMins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}
