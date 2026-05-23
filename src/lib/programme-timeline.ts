export interface TimelineEvent {
  id: string;
  startTime: string | null;
}

export type TimelineSlot<T extends TimelineEvent> =
  | { type: "separator"; hour: number; label: string }
  | { type: "event"; event: T };

export function formatHourSeparator(hour: number): string {
  const h = String(hour).padStart(2, "0");
  return `${h}:00`;
}

export function extractEventHour(startTime: string | null): number | null {
  if (!startTime) return null;
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCHours();
}

export function buildTimelineSlots<T extends TimelineEvent>(events: T[]): TimelineSlot<T>[] {
  const slots: TimelineSlot<T>[] = [];
  let lastHour: number | null = undefined as unknown as number | null;

  for (const event of events) {
    const hour = extractEventHour(event.startTime);

    if (hour !== null && hour !== lastHour) {
      slots.push({ type: "separator", hour, label: formatHourSeparator(hour) });
      lastHour = hour;
    } else if (hour === null && lastHour !== null) {
      // Events without time — no separator, lump at end
    }

    slots.push({ type: "event", event });
  }

  return slots;
}

export function countHourSeparators<T extends TimelineEvent>(events: T[]): number {
  const hours = new Set<number>();
  for (const e of events) {
    const h = extractEventHour(e.startTime);
    if (h !== null) hours.add(h);
  }
  return hours.size;
}
