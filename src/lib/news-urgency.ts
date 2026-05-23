export interface UrgentNewsItem {
  id: string;
  summary: string;
  category: string;
  publishedAt: string;
}

export function filterUrgentNews(
  items: Array<{ id: string; urgencyLevel: string; summary: string; category: string; publishedAt: string | Date }>
): UrgentNewsItem[] {
  return items
    .filter((item) => item.urgencyLevel === "critique")
    .map((item) => ({
      id: item.id,
      summary: item.summary,
      category: item.category,
      publishedAt:
        item.publishedAt instanceof Date
          ? item.publishedAt.toISOString()
          : item.publishedAt,
    }));
}

export function hasUrgentNews(items: UrgentNewsItem[]): boolean {
  return items.length > 0;
}

export function getUrgentBannerLabel(count: number): string {
  if (count === 1) return "1 alerte urgente";
  return `${count} alertes urgentes`;
}

export function getUrgentCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    billetterie: "Billetterie",
    programmation: "Programme",
    logistique: "Logistique",
    securite: "Sécurité",
    annulation: "Annulation",
    autre: "Info",
  };
  return labels[category] ?? "Info";
}
