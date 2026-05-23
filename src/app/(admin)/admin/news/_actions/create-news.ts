"use server";

import { revalidatePath } from "next/cache";
import { isValidUrl, validateNewsInput } from "@/lib/news-admin";
import { prisma } from "@/lib/prisma";

export interface CreateNewsResult {
  success: boolean;
  error?: string;
}

export async function createNewsItem(formData: FormData): Promise<CreateNewsResult> {
  const raw = {
    festivalId: formData.get("festivalId") as string,
    source: formData.get("source") as string,
    sourceUrl: (formData.get("sourceUrl") as string) ?? "",
    category: formData.get("category") as string,
    summary: formData.get("summary") as string,
    urgencyLevel: formData.get("urgencyLevel") as string,
    isPinned: formData.get("isPinned") === "on",
    publishedAt: formData.get("publishedAt") as string,
  };

  const errors = validateNewsInput(raw);
  if (errors.length > 0) {
    return { success: false, error: errors[0].message };
  }

  if (raw.sourceUrl && !isValidUrl(raw.sourceUrl)) {
    return { success: false, error: "URL source invalide" };
  }

  try {
    await prisma.newsItem.create({
      data: {
        festivalId: raw.festivalId,
        source: raw.source,
        sourceUrl: raw.sourceUrl || null,
        category: raw.category,
        summary: raw.summary.trim(),
        urgencyLevel: raw.urgencyLevel,
        isPinned: raw.isPinned,
        publishedAt: new Date(raw.publishedAt),
      },
    });
    revalidatePath("/admin/news");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la création" };
  }
}
