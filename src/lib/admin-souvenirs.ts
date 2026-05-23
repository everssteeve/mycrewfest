export interface AdminSouvenirRow {
  id: string;
  userId: string;
  userName: string;
  festivalName: string;
  festivalSlug: string;
  freeText: string | null;
  note: string | null;
  hasPhotos: boolean;
  shareWithCrew: boolean;
  createdAt: string;
}

export interface SouvenirStats {
  total: number;
  withText: number;
  withPhotos: number;
  sharedWithCrew: number;
}

export function computeSouvenirStats(souvenirs: AdminSouvenirRow[]): SouvenirStats {
  return {
    total: souvenirs.length,
    withText: souvenirs.filter((s) => s.freeText || s.note).length,
    withPhotos: souvenirs.filter((s) => s.hasPhotos).length,
    sharedWithCrew: souvenirs.filter((s) => s.shareWithCrew).length,
  };
}

export function sortSouvenirsByDate(souvenirs: AdminSouvenirRow[]): AdminSouvenirRow[] {
  return [...souvenirs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function filterSouvenirs(souvenirs: AdminSouvenirRow[], query: string): AdminSouvenirRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return souvenirs;
  return souvenirs.filter(
    (s) =>
      s.userName.toLowerCase().includes(q) ||
      s.festivalName.toLowerCase().includes(q) ||
      (s.freeText?.toLowerCase() ?? "").includes(q) ||
      (s.note?.toLowerCase() ?? "").includes(q),
  );
}

export function countRecentSouvenirs(
  souvenirs: AdminSouvenirRow[],
  now = new Date(),
  daysBack = 7,
): number {
  const cutoff = new Date(now.getTime() - daysBack * 86_400_000).toISOString();
  return souvenirs.filter((s) => s.createdAt >= cutoff).length;
}

export function topContributors(
  souvenirs: AdminSouvenirRow[],
  limit = 5,
): Array<{ userId: string; userName: string; count: number }> {
  const map = new Map<string, { userId: string; userName: string; count: number }>();
  for (const s of souvenirs) {
    const entry = map.get(s.userId) ?? { userId: s.userId, userName: s.userName, count: 0 };
    entry.count++;
    map.set(s.userId, entry);
  }
  return [...map.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
