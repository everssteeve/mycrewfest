export type SortMode = "time" | "alpha" | "venue" | "random";

export interface SortableEvent {
  title: string;
  startTime?: string | null;
  venue?: { name: string } | null;
}

export function sortProgrammeEvents<T extends SortableEvent>(
  events: T[],
  mode: SortMode,
): T[] {
  const sorted = [...events];
  switch (mode) {
    case "time":
      return sorted.sort((a, b) => {
        if (!a.startTime && !b.startTime) return 0;
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      });

    case "alpha":
      return sorted.sort((a, b) =>
        a.title.localeCompare(b.title, "fr", { sensitivity: "base" }),
      );

    case "venue":
      return sorted.sort((a, b) => {
        const va = a.venue?.name ?? "";
        const vb = b.venue?.name ?? "";
        if (va !== vb) return va.localeCompare(vb, "fr", { sensitivity: "base" });
        if (!a.startTime && !b.startTime) return 0;
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      });

    case "random":
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      return sorted;

    default:
      return sorted;
  }
}

export const SORT_MODE_LABELS: Record<SortMode, string> = {
  time: "Horaire",
  alpha: "A→Z",
  venue: "Scène",
  random: "🎲",
};
