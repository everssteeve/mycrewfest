import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CarteView, type VenueWithEvents, type CrewMemberPosition } from "./_components/carte-view";

type PageContext = { params: Promise<{ id: string }> };

async function fetchCarteData(
  festEventId: string,
  userId: string,
): Promise<{
  festivalName: string;
  mapImageUrl: string | null;
  venues: VenueWithEvents[];
  crewPositions: CrewMemberPosition[];
} | null> {
  const fe = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId },
    select: {
      festivalId: true,
      crewId: true,
      festival: {
        select: {
          name: true,
          mapImageUrl: true,
        },
      },
    },
  });

  if (!fe) return null;

  // Fetch venues with their events
  const venues = await prisma.venue.findMany({
    where: { festivalId: fe.festivalId },
    include: {
      events: {
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          artist: { select: { name: true } },
        },
      },
    },
  });

  const mappedVenues: VenueWithEvents[] = venues.map((v) => ({
    id: v.id,
    name: v.name,
    type: v.type,
    latitude: v.latitude ?? null,
    longitude: v.longitude ?? null,
    events: v.events.map((e) => ({
      id: e.id,
      title: e.title,
      startTime: e.startTime?.toISOString() ?? null,
      endTime: e.endTime?.toISOString() ?? null,
      artist: e.artist?.name ?? null,
    })),
  }));

  // Fetch crew member positions if in a crew
  let crewPositions: CrewMemberPosition[] = [];
  if (fe.crewId) {
    const crewMembers = await prisma.crewMember.findMany({
      where: {
        crewId: fe.crewId,
        geolocStatus: { in: ["active", "background"] },
        isPrivate: false,
        lastLat: { not: null },
        lastLng: { not: null },
        userId: { not: userId }, // Exclude self
      },
      include: {
        user: { select: { name: true, image: true, pseudo: true } },
      },
    });

    crewPositions = crewMembers
      .filter((m) => m.lastLat != null && m.lastLng != null)
      .map((m) => ({
        userId: m.userId,
        userName: m.user.pseudo ?? m.user.name ?? "Membre",
        userImage: m.user.image ?? null,
        lat: m.lastLat as number,
        lng: m.lastLng as number,
        lastSeenAt: m.lastSeenAt?.toISOString() ?? new Date().toISOString(),
      }));
  }

  return {
    festivalName: fe.festival.name,
    mapImageUrl: fe.festival.mapImageUrl ?? null,
    venues: mappedVenues,
    crewPositions,
  };
}

export default async function CartePage({ params }: PageContext) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await fetchCarteData(id, session.user.id);
  if (!data) {
    redirect("/catalogue");
  }

  return (
    <CarteView
      festivalName={data.festivalName}
      mapImageUrl={data.mapImageUrl}
      venues={data.venues}
      crewPositions={data.crewPositions}
    />
  );
}
