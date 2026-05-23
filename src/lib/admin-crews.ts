export interface AdminCrewRow {
  id: string;
  name: string | null;
  inviteCode: string;
  memberCount: number;
  festEventCount: number;
  createdAt: Date;
}

export function resolveCrewDisplayName(name: string | null, id: string): string {
  return name?.trim() || `Crew #${id.slice(0, 6)}`;
}

export function getCrewSizeTier(memberCount: number): string {
  if (memberCount >= 10) return "Grand";
  if (memberCount >= 5) return "Moyen";
  if (memberCount >= 2) return "Petit";
  return "Solo";
}

export function getCrewSizeTierColor(tier: string): string {
  switch (tier) {
    case "Grand": return "var(--primary-neon)";
    case "Moyen": return "var(--secondary-cyan)";
    case "Petit": return "var(--text-main)";
    default: return "var(--text-dim)";
  }
}

export function sortCrewsBySize(crews: AdminCrewRow[]): AdminCrewRow[] {
  return [...crews].sort((a, b) => {
    if (b.memberCount !== a.memberCount) return b.memberCount - a.memberCount;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export function computeCrewStats(crews: AdminCrewRow[]): {
  total: number;
  totalMembers: number;
  avgSize: number;
  withFestEvent: number;
} {
  const total = crews.length;
  const totalMembers = crews.reduce((sum, c) => sum + c.memberCount, 0);
  const withFestEvent = crews.filter((c) => c.festEventCount > 0).length;
  return {
    total,
    totalMembers,
    avgSize: total > 0 ? Math.round((totalMembers / total) * 10) / 10 : 0,
    withFestEvent,
  };
}
