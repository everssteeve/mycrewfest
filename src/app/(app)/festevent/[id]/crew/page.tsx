import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { parseJsonArray } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import type { CrewData, CrewMemberData, EventSummary } from "@/types";
import { CrewView } from "./_components/crew-view";

type PageContext = { params: Promise<{ id: string }> };

async function fetchCrewPageData(
  festEventId: string,
  userId: string,
): Promise<{
  crew: CrewData | null;
  mySelections: EventSummary[];
} | null> {
  const festEvent = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId },
    select: {
      id: true,
      festivalId: true,
      crewId: true,
    },
  });

  if (!festEvent) return null;

  // Fetch my selections for shared planning computation
  const selections = await prisma.selection.findMany({
    where: { festEventId },
    include: {
      event: {
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              type: true,
              capacity: true,
              latitude: true,
              longitude: true,
            },
          },
          artist: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const mySelections: EventSummary[] = selections.map((s) => ({
    id: s.event.id,
    title: s.event.title,
    eventType: s.event.eventType as EventSummary["eventType"],
    startTime: s.event.startTime?.toISOString() ?? undefined,
    endTime: s.event.endTime?.toISOString() ?? undefined,
    durationMins: s.event.durationMins ?? undefined,
    ageMin: s.event.ageMin ?? undefined,
    ageMax: s.event.ageMax ?? undefined,
    access: s.event.access as "inclus" | "réservation_séparée",
    status: s.event.status as "confirmé" | "annulé" | "modifié",
    confidence: (s.event.confidence ?? "auto") as "auto" | "vérifié_humain",
    tags: parseJsonArray(s.event.tags),
    selectionStatus: s.status as "intéressé" | "must-see" | "vu",
    venue: s.event.venue
      ? {
          id: s.event.venue.id,
          name: s.event.venue.name,
          type: s.event.venue.type,
          latitude: s.event.venue.latitude ?? undefined,
          longitude: s.event.venue.longitude ?? undefined,
        }
      : undefined,
    artist: s.event.artist
      ? {
          id: s.event.artist.id,
          name: s.event.artist.name,
          disciplines: parseJsonArray(s.event.artist.disciplines),
          countryCode: s.event.artist.countryCode ?? undefined,
        }
      : undefined,
  }));

  if (!festEvent.crewId) {
    return { crew: null, mySelections };
  }

  const crew = await prisma.crew.findUnique({
    where: { id: festEvent.crewId },
    include: {
      members: {
        include: { user: { select: { name: true, image: true } } },
      },
    },
  });

  if (!crew) return { crew: null, mySelections };

  const crewData: CrewData = {
    id: crew.id,
    name: crew.name ?? undefined,
    inviteCode: crew.inviteCode,
    rallyLatitude: crew.rallyLatitude ?? undefined,
    rallyLongitude: crew.rallyLongitude ?? undefined,
    rallyDescription: crew.rallyDescription ?? undefined,
    members: crew.members.map(
      (m): CrewMemberData => ({
        id: m.id,
        userId: m.userId,
        userName: m.user.name ?? undefined,
        userImage: m.user.image ?? undefined,
        role: m.role as "admin" | "membre",
        geolocStatus: m.geolocStatus as "off" | "active" | "background",
        isPrivate: m.isPrivate,
      }),
    ),
  };

  return { crew: crewData, mySelections };
}

export default async function CrewPage({ params }: PageContext) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await fetchCrewPageData(id, session.user.id);
  if (!data) {
    redirect("/catalogue");
  }

  return (
    <div
      style={{
        padding: "var(--space-md)",
        maxWidth: "var(--max-content)",
        margin: "0 auto",
      }}
    >
      <CrewView
        festEventId={id}
        myUserId={session.user.id}
        myUserName={session.user.name ?? null}
        initialCrew={data.crew}
        mySelections={data.mySelections}
      />
    </div>
  );
}
