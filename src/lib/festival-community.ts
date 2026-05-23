export function formatFollowerCount(count: number): string {
  if (count >= 10_000) return `${Math.floor(count / 1000)}k fans`;
  if (count >= 1_000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k fans`;
  return `${count} fan${count !== 1 ? "s" : ""}`;
}

export type FollowerTier = "Confidentiel" | "Émergent" | "Établi" | "Populaire" | "Culte";

export function getFollowerTier(count: number): FollowerTier {
  if (count >= 1000) return "Culte";
  if (count >= 100) return "Populaire";
  if (count >= 10) return "Établi";
  if (count >= 1) return "Émergent";
  return "Confidentiel";
}

export function getFollowerTierColor(tier: FollowerTier): string {
  switch (tier) {
    case "Culte":
      return "var(--accent-pink)";
    case "Populaire":
      return "var(--warning-orange)";
    case "Établi":
      return "var(--primary-neon)";
    case "Émergent":
      return "var(--secondary-cyan)";
    case "Confidentiel":
      return "var(--text-dim)";
  }
}

export function getFollowerTierBg(tier: FollowerTier): string {
  switch (tier) {
    case "Culte":
      return "rgba(255,0,122,0.1)";
    case "Populaire":
      return "var(--orange-soft)";
    case "Établi":
      return "var(--neon-soft)";
    case "Émergent":
      return "var(--cyan-soft)";
    case "Confidentiel":
      return "rgba(255,255,255,0.04)";
  }
}
