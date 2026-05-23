const KEY = "mycrewfest:recently-viewed";
const MAX_ENTRIES = 5;

export interface RecentlyViewedEntry {
  slug: string;
  name: string;
  city: string;
  viewedAt: string;
}

export function loadRecentlyViewed(): RecentlyViewedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(
      (x): x is RecentlyViewedEntry =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as RecentlyViewedEntry).slug === "string" &&
        typeof (x as RecentlyViewedEntry).name === "string",
    );
  } catch {
    return [];
  }
}

export function addToRecentlyViewed(
  entry: Omit<RecentlyViewedEntry, "viewedAt">,
  current: RecentlyViewedEntry[],
): RecentlyViewedEntry[] {
  const deduped = current.filter((e) => e.slug !== entry.slug);
  return [{ ...entry, viewedAt: new Date().toISOString() }, ...deduped].slice(0, MAX_ENTRIES);
}

export function saveRecentlyViewed(entries: RecentlyViewedEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // silent — quota exceeded or unavailable
  }
}

export function clearRecentlyViewed(): RecentlyViewedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // silent
  }
  return [];
}
