import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DeambuloireView } from "./_components/deambuloire-view";

type PageContext = { params: Promise<{ id: string }> };

export default async function ModeDeambuloirePage({ params }: PageContext) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const fe = await prisma.festEvent.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      festivalId: true,
      festival: {
        select: {
          programType: true,
        },
      },
    },
  });

  if (!fe) {
    redirect("/catalogue");
  }

  // Only accessible for déambulatoire or hybride festivals
  const programType = fe.festival.programType;
  if (programType !== "déambulatoire" && programType !== "hybride") {
    redirect(`/festevent/${id}/programme`);
  }

  return <DeambuloireView festEventId={fe.id} festivalId={fe.festivalId} />;
}
