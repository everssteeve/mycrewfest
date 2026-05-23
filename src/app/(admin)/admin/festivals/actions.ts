"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function verifyFestival(slug: string) {
  await prisma.festival.update({
    where: { slug },
    data: { ingestionStatus: "vérifié" },
  });
  revalidatePath("/admin/festivals");
}

export async function deleteFestival(slug: string) {
  await prisma.festival.delete({ where: { slug } });
  revalidatePath("/admin/festivals");
}
