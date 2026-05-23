import type { ChecklistItemData } from "@/app/(app)/festevent/[id]/checklist/_components/checklist-view";

/**
 * Returns the IDs of items that are marked as done.
 */
export function getDoneItemIds(items: Pick<ChecklistItemData, "id" | "done">[]): string[] {
  return items.filter((i) => i.done).map((i) => i.id);
}

/**
 * Returns the items that are NOT done (to keep after clearing done items).
 */
export function filterPendingItems<T extends Pick<ChecklistItemData, "done">>(items: T[]): T[] {
  return items.filter((i) => !i.done);
}
