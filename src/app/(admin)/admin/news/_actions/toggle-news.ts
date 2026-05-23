"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function toggleNewsPin(id: string): Promise<{ success: boolean; isPinned: boolean }> {
  const item = await prisma.newsItem.findUnique({ where: { id }, select: { isPinned: true } });
  if (!item) return { success: false, isPinned: false };

  const updated = await prisma.newsItem.update({
    where: { id },
    data: { isPinned: !item.isPinned },
    select: { isPinned: true },
  });

  revalidatePath("/admin/news");
  return { success: true, isPinned: updated.isPinned };
}

export async function toggleNewsUrgency(
  id: string,
): Promise<{ success: boolean; urgencyLevel: string }> {
  const item = await prisma.newsItem.findUnique({ where: { id }, select: { urgencyLevel: true } });
  if (!item) return { success: false, urgencyLevel: "normal" };

  const next = item.urgencyLevel === "critique" ? "normal" : "critique";
  await prisma.newsItem.update({ where: { id }, data: { urgencyLevel: next } });

  revalidatePath("/admin/news");
  return { success: true, urgencyLevel: next };
}
