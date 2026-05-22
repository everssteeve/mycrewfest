import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/api";
import { JournalView, type SouvenirEntry } from "@/app/(app)/festevent/[id]/journal/_components/journal-view";

type PageContext = { params: Promise<{ token: string }> };

async function fetchPublicJournal(token: string) {
  const fe = await prisma.festEvent.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      shareToken: true,
      festival: { select: { name: true } },
      user: { select: { name: true, pseudo: true } },
      souvenirs: {
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
      },
    },
  });

  if (!fe) return null;

  const souvenirs: SouvenirEntry[] = fe.souvenirs.map((s) => ({
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
    souvenirs,
    festivalName: fe.festival.name,
    userName: fe.user.pseudo ?? fe.user.name ?? "Un festivalier",
    festEventId: fe.id,
  };
}

export async function generateMetadata({
  params,
}: PageContext): Promise<Metadata> {
  const { token } = await params;
  const data = await fetchPublicJournal(token);
  if (!data) return { title: "Journal introuvable" };

  return {
    title: `Le journal de ${data.userName} à ${data.festivalName}`,
    description: `${data.souvenirs.length} souvenirs partagés`,
  };
}

export default async function PublicJournalPage({ params }: PageContext) {
  const { token } = await params;
  const data = await fetchPublicJournal(token);

  if (!data) {
    notFound();
  }

  return (
    <div
      style={{
        backgroundColor: "var(--bg-darker)",
        minHeight: "100dvh",
        paddingBottom: "var(--space-3xl)",
      }}
    >
      {/* Simplified header */}
      <header
        style={{
          borderBottom: "1px solid var(--border-color)",
          padding: "var(--space-md)",
          background: "rgba(13, 14, 18, 0.92)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "var(--max-content)",
            margin: "0 auto",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: "0 0 2px",
            }}
          >
            MyCrewFest
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-md)",
              color: "var(--text-main)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: 0,
              lineHeight: "1.2",
            }}
          >
            Le journal de {data.userName} à {data.festivalName}
          </h1>
        </div>
      </header>

      {/* Journal content — read-only */}
      <main
        style={{
          maxWidth: "var(--max-content)",
          margin: "0 auto",
          padding: "var(--space-md)",
        }}
      >
        <JournalView
          festEventId={data.festEventId}
          festivalName={data.festivalName}
          userName={data.userName}
          initialSouvenirs={data.souvenirs}
          shareToken={null}
          readOnly
        />
      </main>
    </div>
  );
}
