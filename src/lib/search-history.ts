const KEY = "mycrewfest:search-history";
const MAX_ENTRIES = 5;

export function loadSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function addToSearchHistory(query: string, current: string[]): string[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return current;
  const deduped = current.filter((q) => q !== trimmed);
  return [trimmed, ...deduped].slice(0, MAX_ENTRIES);
}

export function removeFromSearchHistory(query: string, current: string[]): string[] {
  return current.filter((q) => q !== query);
}

export function saveSearchHistory(history: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(history));
  } catch {
    // localStorage quota exceeded or unavailable — silent fail
  }
}

export function clearSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // silent
  }
  return [];
}
