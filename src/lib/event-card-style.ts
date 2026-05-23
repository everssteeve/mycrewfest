import type { SelectionStatus } from "@/types";

export interface EventCardVisualState {
  isVu: boolean;
  hasAccentBorder: boolean;
  opacity: number;
  backgroundTint: string;
}

/**
 * Computes the visual state of an EventCard based on selection status and other flags.
 */
export function getEventCardVisualState(
  selectionStatus: SelectionStatus | null,
  isCancelled: boolean,
  hasConflict: boolean,
): EventCardVisualState {
  const isVu = selectionStatus === "vu";
  const hasAccentBorder = isVu || hasConflict;

  const opacity = isCancelled ? 0.5 : isVu ? 0.8 : 1;
  const backgroundTint = isVu ? "rgba(0,255,102,0.04)" : "var(--bg-surface)";

  return { isVu, hasAccentBorder, opacity, backgroundTint };
}
