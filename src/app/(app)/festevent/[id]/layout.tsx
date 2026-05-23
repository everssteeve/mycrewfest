import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/api";
import type { FestivalType } from "@/lib/api";
import { FestEventShell } from "./_components/fest-event-shell";
import { UrgentNewsBanner } from "@/components/festevent/urgent-news-banner";
import { filterUrgentNews } from "@/lib/news-urgency";

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

async function fetchUrgentNews(festivalId: string) {
  const items = await prisma.newsItem.findMany({
    where: { festivalId, urgencyLevel: "critique" },
    orderBy: { publishedAt: "desc" },
    take: 5,
    select: { id: true, summary: true, category: true, publishedAt: true, urgencyLevel: true },
  });
  return filterUrgentNews(
    items.map((n) => ({ ...n, publishedAt: n.publishedAt.toISOString() }))
  );
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
    festivalType: fe.festival.festivalType as FestivalType,
    programType: fe.festival.programType as "structuré" | "déambulatoire" | "hybride",
  };

  const urgentNews = await fetchUrgentNews(fe.festival.id);

  return (
    <>
      <UrgentNewsBanner
        urgentNews={urgentNews}
        newsPageHref={`/festevent/${id}/news`}
      />
      <FestEventShell
        festEventId={id}
        festival={festivalForShell}
        presenceDates={presenceDates}
      >
        {children}
      </FestEventShell>
    </>
  );
}
