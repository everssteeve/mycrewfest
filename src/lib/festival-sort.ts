export function sortWithFeaturedFirst<T extends { isFeatured: boolean; name: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return a.name.localeCompare(b.name);
  });
}
