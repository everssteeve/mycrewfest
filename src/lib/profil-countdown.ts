export interface CountdownFestEvent {
  id: string;
  festival: {
    name: string;
    slug: string;
    startDate: string;
    endDate: string;
    city: string;
  };
}

export function findNextFestEvent(festEvents: CountdownFestEvent[], now: Date = new Date()): CountdownFestEvent | null {
  const nowMs = now.getTime();
  const future = festEvents.filter(
    (fe) => new Date(fe.festival.endDate).getTime() > nowMs,
  );
  if (future.length === 0) return null;
  future.sort(
    (a, b) => new Date(a.festival.startDate).getTime() - new Date(b.festival.startDate).getTime(),
  );
  return future[0];
}

export function computeDaysUntilFestival(startDate: string, now: Date = new Date()): number {
  const start = new Date(startDate);
  const diffMs = start.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function isFestivalActive(startDate: string, endDate: string, now: Date = new Date()): boolean {
  const nowMs = now.getTime();
  return (
    new Date(startDate).getTime() <= nowMs &&
    new Date(endDate).getTime() >= nowMs
  );
}

export function formatCountdownLabel(days: number, isActive: boolean): string {
  if (isActive) return "En cours";
  if (days === 0) return "Demain";
  if (days === 1) return "Dans 1 jour";
  return `Dans ${days} jours`;
}

export function getCountdownUrgency(days: number, isActive: boolean): "active" | "imminent" | "soon" | "later" {
  if (isActive) return "active";
  if (days <= 3) return "imminent";
  if (days <= 14) return "soon";
  return "later";
}

export function getCountdownColor(urgency: ReturnType<typeof getCountdownUrgency>): string {
  switch (urgency) {
    case "active": return "var(--primary-neon)";
    case "imminent": return "var(--accent-pink)";
    case "soon": return "var(--warning-orange)";
    case "later": return "var(--secondary-cyan)";
  }
}
