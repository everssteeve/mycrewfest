"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PROGRAM_STATUS_VALUES, type ProgramStatus } from "@/lib/admin-programme";

export async function updateProgramStatus(festivalId: string, status: string) {
  if (!(PROGRAM_STATUS_VALUES as string[]).includes(status)) {
    throw new Error(`Invalid program status: ${status}`);
  }
  await prisma.festival.update({
    where: { id: festivalId },
    data: { programStatus: status as ProgramStatus },
  });
  revalidatePath("/admin/festivals/programme");
  revalidatePath("/catalogue");
}
