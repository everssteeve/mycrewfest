export interface NewsInput {
  festivalId: string;
  source: string;
  sourceUrl: string;
  category: string;
  summary: string;
  urgencyLevel: string;
  isPinned: boolean;
  publishedAt: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export const VALID_SOURCES = ["instagram", "facebook", "x", "site_officiel"] as const;
export const VALID_CATEGORIES = [
  "line-up",
  "logistique",
  "programme-change",
  "annulation",
  "urgence",
  "autre",
] as const;
export const VALID_URGENCY = ["normal", "critique"] as const;

export const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X / Twitter",
  site_officiel: "Site officiel",
};

export const CATEGORY_LABELS: Record<string, string> = {
  "line-up": "Line-up",
  logistique: "Logistique",
  "programme-change": "Changement programme",
  annulation: "Annulation",
  urgence: "Urgence",
  autre: "Autre",
};

export function validateNewsInput(input: Partial<NewsInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.festivalId?.trim()) {
    errors.push({ field: "festivalId", message: "Festival requis" });
  }

  if (!input.source || !(VALID_SOURCES as readonly string[]).includes(input.source)) {
    errors.push({ field: "source", message: "Source invalide" });
  }

  if (!input.category || !(VALID_CATEGORIES as readonly string[]).includes(input.category)) {
    errors.push({ field: "category", message: "Catégorie invalide" });
  }

  if (!input.summary?.trim()) {
    errors.push({ field: "summary", message: "Résumé requis" });
  } else if (input.summary.trim().length < 10) {
    errors.push({ field: "summary", message: "Résumé trop court (min 10 caractères)" });
  } else if (input.summary.trim().length > 500) {
    errors.push({ field: "summary", message: "Résumé trop long (max 500 caractères)" });
  }

  if (!input.urgencyLevel || !(VALID_URGENCY as readonly string[]).includes(input.urgencyLevel)) {
    errors.push({ field: "urgencyLevel", message: "Niveau d'urgence invalide" });
  }

  if (!input.publishedAt) {
    errors.push({ field: "publishedAt", message: "Date de publication requise" });
  }

  return errors;
}

export function isValidUrl(url: string): boolean {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
