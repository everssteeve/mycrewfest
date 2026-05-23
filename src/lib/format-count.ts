export function formatCount(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 10_000) return `${(n / 1_000).toFixed(1).replace(".0", "")}k`;
  if (n < 1_000_000) return `${Math.floor(n / 1_000)}k`;
  return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
}

export function formatFestivalStats(count: { events: number; followers: number }): string {
  const parts: string[] = [];
  if (count.events > 0) {
    parts.push(`${formatCount(count.events)} événement${count.events > 1 ? "s" : ""}`);
  }
  if (count.followers > 0) {
    parts.push(`${formatCount(count.followers)} abonné${count.followers > 1 ? "s" : ""}`);
  }
  return parts.join(" · ");
}
