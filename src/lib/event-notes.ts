export const MAX_NOTE_LENGTH = 280;

export function validateEventNote(text: string): { valid: boolean; reason?: string } {
  if (text.length > MAX_NOTE_LENGTH) {
    return { valid: false, reason: `Max ${MAX_NOTE_LENGTH} caractères` };
  }
  return { valid: true };
}

export function formatNotePreview(text: string, maxLen: number = 60): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen).trimEnd() + "…";
}

export function parseNotesFromStorage(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const result: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string") result[k] = v;
      }
      return result;
    }
    return {};
  } catch {
    return {};
  }
}

export function serializeNotesToStorage(notes: Record<string, string>): string {
  return JSON.stringify(notes);
}

export function countNonEmptyNotes(notes: Record<string, string>): number {
  return Object.values(notes).filter((v) => v.trim().length > 0).length;
}

export function buildStorageKey(festEventId: string): string {
  return `mycrewfest:event-notes:${festEventId}`;
}
