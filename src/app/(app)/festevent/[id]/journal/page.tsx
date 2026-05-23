import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { parseJsonArray } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { JournalView, type SouvenirEntry } from "./_components/journal-view";

type PageContext = { params: Promise<{ id: string }> };

async function fetchJournalData(
  festEventId: string,
  userId: string,
): Promise<{
  souvenirs: SouvenirEntry[];
  festivalName: string;
  userName: string;
  shareToken: string | null;
} | null> {
  const fe = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId },
    select: {
      id: true,
      shareToken: true,
      festival: { select: { name: true } },
      user: { select: { name: true, pseudo: true } },
    },
  });

  if (!fe) return null;

  const souvenirs = await prisma.souvenir.findMany({
    where: { festEventId, userId },
    orderBy: { timestamp: "asc" },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          eventType: true,
          startTime: true,
          venue: { select: { id: true, name: true, type: true } },
          artist: { select: { id: true, name: true } },
        },
      },
    },
  });

  const mapped: SouvenirEntry[] = souvenirs.map((s) => ({
    id: s.id,
    festEventId: s.festEventId,
    eventId: s.eventId,
    freeText: s.freeText,
    note: s.note,
    photos: parseJsonArray(s.photos),
    timestamp: s.timestamp.toISOString(),
    shareWithCrew: s.shareWithCrew,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    event: s.event
      ? {
          id: s.event.id,
          title: s.event.title,
          eventType: s.event.eventType,
          startTime: s.event.startTime?.toISOString() ?? null,
          venue: s.event.venue ?? null,
          artist: s.event.artist ?? null,
        }
      : null,
  }));

  return {
    souvenirs: mapped,
    festivalName: fe.festival.name,
    userName: fe.user.pseudo ?? fe.user.name ?? "Toi",
    shareToken: fe.shareToken,
  };
}

export default async function JournalPage({ params }: PageContext) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await fetchJournalData(id, session.user.id);
  if (!data) {
    redirect("/catalogue");
  }

  return (
    <JournalView
      festEventId={id}
      festivalName={data.festivalName}
      userName={data.userName}
      initialSouvenirs={data.souvenirs}
      shareToken={data.shareToken}
    />
  );
}
