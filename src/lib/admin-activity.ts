export type ActivityType = "user_signup" | "signal_posted" | "submission_received" | "festival_detected";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  label: string;
  detail: string;
  occurredAt: Date;
}

export const ACTIVITY_TYPE_OPTIONS: { value: ActivityType | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "user_signup", label: "Inscriptions" },
  { value: "signal_posted", label: "Signaux" },
  { value: "submission_received", label: "Soumissions" },
  { value: "festival_detected", label: "Festivals" },
];

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  user_signup: "👤",
  signal_posted: "📡",
  submission_received: "📬",
  festival_detected: "🎪",
};

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  user_signup: "var(--secondary-cyan)",
  signal_posted: "var(--primary-neon)",
  submission_received: "var(--warning-orange)",
  festival_detected: "var(--accent-pink)",
};

export function filterActivityEntries(
  entries: ActivityEntry[],
  type: ActivityType | "all",
): ActivityEntry[] {
  if (type === "all") return entries;
  return entries.filter((e) => e.type === type);
}

export function sortActivityEntriesDesc(entries: ActivityEntry[]): ActivityEntry[] {
  return [...entries].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
}

export function formatActivityTimestamp(date: Date): string {
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function countActivityByType(
  entries: ActivityEntry[],
): Record<ActivityType, number> {
  const counts: Record<ActivityType, number> = {
    user_signup: 0,
    signal_posted: 0,
    submission_received: 0,
    festival_detected: 0,
  };
  for (const e of entries) {
    counts[e.type]++;
  }
  return counts;
}
