"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function toggleFestivalFeatured(festivalId: string, currentValue: boolean) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") throw new Error("Unauthorized");

  await prisma.festival.update({
    where: { id: festivalId },
    data: { isFeatured: !currentValue },
  });
  revalidatePath("/admin/festivals");
  revalidatePath("/catalogue");
}
