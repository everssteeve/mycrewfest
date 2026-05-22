import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChecklistView, type ChecklistItemData } from "./_components/checklist-view";

type PageContext = { params: Promise<{ id: string }> };

async function fetchChecklistData(
  festEventId: string,
  userId: string,
): Promise<{ items: ChecklistItemData[]; festivalName: string } | null> {
  const fe = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId },
    select: {
      id: true,
      festival: { select: { name: true } },
    },
  });

  if (!fe) return null;

  const items = await prisma.checklistItem.findMany({
    where: { festEventId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      label: true,
      done: true,
      cost: true,
      assigneeName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    festivalName: fe.festival.name,
    items: items.map((item) => ({
      id: item.id,
      label: item.label,
      done: item.done,
      cost: item.cost ?? null,
      assigneeName: item.assigneeName ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
}

export default async function ChecklistPage({ params }: PageContext) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await fetchChecklistData(id, session.user.id);
  if (!data) {
    redirect("/catalogue");
  }

  return (
    <ChecklistView
      festEventId={id}
      initialItems={data.items}
      festivalName={data.festivalName}
    />
  );
}
