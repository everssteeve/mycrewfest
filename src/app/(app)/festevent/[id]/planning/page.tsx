import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/api";
import type { EventWithSelectionAndConfidence } from "@/components/festevent/event-card";
import { PlanningView } from "./_components/planning-view";

type PageContext = { params: Promise<{ id: string }> };

async function fetchPlanningData(
  festEventId: string,
  userId: string,
): Promise<{
  presenceDates: string[];
  events: EventWithSelectionAndConfidence[];
} | null> {
  const fe = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId },
    select: {
      id: true,
      festivalId: true,
      presenceDates: true,
    },
  });

  if (!fe) return null;

  // Only fetch events that are selected (must-see, intéressé, vu)
  const [selectedEvents, userSelections] = await Promise.all([
    prisma.event.findMany({
      where: {
        festivalId: fe.festivalId,
        selections: { some: { festEventId: fe.id } },
      },
      orderBy: { startTime: "asc" },
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
    }),
    prisma.selection.findMany({
      where: { festEventId: fe.id },
      select: { id: true, eventId: true, status: true },
    }),
  ]);

  const selectionMap = new Map(
    userSelections.map((s) => [
      s.eventId,
      {
        id: s.id,
        status: s.status as "intéressé" | "must-see" | "vu",
      },
    ]),
  );

  const events: EventWithSelectionAndConfidence[] = selectedEvents.map((e) => ({
    id: e.id,
    title: e.title,
    eventType: e.eventType as EventWithSelectionAndConfidence["eventType"],
    startTime: e.startTime?.toISOString() ?? null,
    endTime: e.endTime?.toISOString() ?? null,
    durationMins: e.durationMins,
    access: e.access,
    status: e.status,
    confidence: (e.confidence ?? "auto") as "auto" | "vérifié_humain",
    tags: parseJsonArray(e.tags),
    venue: e.venue
      ? {
          id: e.venue.id,
          name: e.venue.name,
          type: e.venue.type,
          capacity: e.venue.capacity,
          latitude: e.venue.latitude,
          longitude: e.venue.longitude,
        }
      : null,
    artist: e.artist
      ? {
          id: e.artist.id,
          name: e.artist.name,
          description: e.artist.description,
          disciplines: parseJsonArray(e.artist.disciplines),
          countryCode: e.artist.countryCode,
          siteUrl: e.artist.siteUrl,
          instagram: e.artist.instagram,
        }
      : null,
    selection: selectionMap.get(e.id) ?? null,
  }));

  return {
    presenceDates: parseJsonArray(fe.presenceDates),
    events,
  };
}

export default async function PlanningPage({ params }: PageContext) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await fetchPlanningData(id, session.user.id);
  if (!data) {
    redirect("/catalogue");
  }

  return (
    <PlanningView
      festEventId={id}
      presenceDates={data.presenceDates}
      initialEvents={data.events}
    />
  );
}
