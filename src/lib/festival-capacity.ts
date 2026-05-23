export type CapacityTier = "Intime" | "Petit" | "Moyen" | "Grand" | "Méga";

export function getCapacityTier(capacity: number): CapacityTier {
  if (capacity >= 50_000) return "Méga";
  if (capacity >= 20_000) return "Grand";
  if (capacity >= 5_000) return "Moyen";
  if (capacity >= 1_000) return "Petit";
  return "Intime";
}

export function getCapacityTierColor(tier: CapacityTier): string {
  switch (tier) {
    case "Méga":
      return "var(--accent-pink)";
    case "Grand":
      return "var(--warning-orange)";
    case "Moyen":
      return "var(--primary-neon)";
    case "Petit":
      return "var(--secondary-cyan)";
    case "Intime":
      return "var(--text-dim)";
  }
}

export function getCapacityTierBg(tier: CapacityTier): string {
  switch (tier) {
    case "Méga":
      return "rgba(255,0,122,0.08)";
    case "Grand":
      return "var(--orange-soft)";
    case "Moyen":
      return "var(--neon-soft)";
    case "Petit":
      return "var(--cyan-soft)";
    case "Intime":
      return "rgba(255,255,255,0.04)";
  }
}

export function formatCapacityLabel(capacity: number): string {
  if (capacity >= 1_000) {
    const k = capacity / 1_000;
    const rounded = Number.isInteger(k) ? k : Math.round(k * 10) / 10;
    return `${rounded}k`;
  }
  return String(capacity);
}

export function buildCapacityAriaLabel(capacity: number, tier: CapacityTier): string {
  return `Capacité : ${formatCapacityLabel(capacity)} personnes (${tier})`;
}
