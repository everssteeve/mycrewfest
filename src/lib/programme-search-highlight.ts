export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

/**
 * Splits text into segments based on case-insensitive query match.
 * Returns [{text, highlighted}...] for rendering with highlights.
 * Returns [{text: original, highlighted: false}] when query is empty or no match.
 */
export function highlightTerms(text: string, query: string): HighlightSegment[] {
  const q = query.trim();
  if (!q) return [{ text, highlighted: false }];

  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");

  const parts = text.split(regex);
  const lower = q.toLowerCase();

  return parts
    .filter((p) => p.length > 0)
    .map((part) => ({
      text: part,
      highlighted: part.toLowerCase() === lower,
    }));
}

/**
 * Returns true if the query matches somewhere in text (case-insensitive).
 */
export function hasHighlightMatch(text: string, query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  return text.toLowerCase().includes(q.toLowerCase());
}

/**
 * CSS values for the highlight style.
 */
export function getHighlightStyle(): { background: string; color: string; borderRadius: string } {
  return {
    background: "rgba(0,255,102,0.2)",
    color: "var(--primary-neon)",
    borderRadius: "2px",
  };
}
