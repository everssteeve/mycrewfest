import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/api";
import { FestEventShell } from "./_components/fest-event-shell";

type LayoutContext = { params: Promise<{ id: string }> };

async function fetchFestEvent(id: string, userId: string) {
  const fe = await prisma.festEvent.findFirst({
    where: { id, userId },
    include: {
      festival: {
        select: {
          id: true,
          name: true,
          slug: true,
          startDate: true,
          endDate: true,
          city: true,
          country: true,
          festivalType: true,
          programType: true,
          programStatus: true,
          confidenceLevel: true,
          ingestionStatus: true,
          description: true,
          siteUrl: true,
          instagramHandle: true,
          capacity: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });
  return fe;
}

export default async function FestEventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
} & LayoutContext) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const fe = await fetchFestEvent(id, session.user.id);

  if (!fe) {
    redirect("/catalogue");
  }

  const presenceDates = parseJsonArray(fe.presenceDates);

  const festivalForShell = {
    ...fe.festival,
    startDate: fe.festival.startDate.toISOString(),
    endDate: fe.festival.endDate.toISOString(),
  };

  return (
    <FestEventShell
      festEventId={id}
      festival={festivalForShell}
      presenceDates={presenceDates}
    >
      {children}
    </FestEventShell>
  );
}
