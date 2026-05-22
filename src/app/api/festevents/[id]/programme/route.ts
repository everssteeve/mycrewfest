import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/api";
import type { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/festevents/[id]/programme
 * Get the festival events with filters + user selection status (auth required).
 *
 * Query params:
 *   q          – search in title
 *   venueId    – filter by venue
 *   eventType  – filter by type
 *   dateFrom   – ISO date
 *   dateTo     – ISO date
 *   status     – intéressé|must-see|vu|non-sélectionné
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Vous devez être connecté." },
      { status: 401 },
    );
  }

  const { id } = await params;

  // Verify the FestEvent belongs to the user
  const festEvent = await prisma.festEvent.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, festivalId: true },
  });

  if (!festEvent) {
    return NextResponse.json(
      { error: "FestEvent introuvable." },
      { status: 404 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const venueId = searchParams.get("venueId") ?? "";
  const eventType = searchParams.get("eventType") ?? "";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const selectionFilter = searchParams.get("status") ?? "";

  const where: Prisma.EventWhereInput = {
    festivalId: festEvent.festivalId,
    AND: [
      q ? { title: { contains: q } } : {},
      venueId ? { venueId } : {},
      eventType ? { eventType } : {},
      dateFrom ? { startTime: { gte: new Date(dateFrom) } } : {},
      dateTo ? { startTime: { lte: new Date(dateTo) } } : {},
    ],
  };

  try {
    const [events, userSelections] = await Promise.all([
      prisma.event.findMany({
        where,
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
        where: { festEventId: festEvent.id },
        select: { eventId: true, id: true, status: true },
      }),
    ]);

    const selectionMap = new Map(
      userSelections.map((s) => [s.eventId, { id: s.id, status: s.status }]),
    );

    let mapped = events.map((e) => ({
      id: e.id,
      title: e.title,
      eventType: e.eventType,
      startTime: e.startTime?.toISOString() ?? null,
      endTime: e.endTime?.toISOString() ?? null,
      durationMins: e.durationMins,
      access: e.access,
      status: e.status,
      tags: parseJsonArray(e.tags),
      venue: e.venue ?? null,
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

    // Optional filter: only events matching a selection status
    if (selectionFilter === "non-sélectionné") {
      mapped = mapped.filter((e) => e.selection === null);
    } else if (
      selectionFilter === "intéressé" ||
      selectionFilter === "must-see" ||
      selectionFilter === "vu"
    ) {
      mapped = mapped.filter((e) => e.selection?.status === selectionFilter);
    }

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("[GET /api/festevents/[id]/programme]", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du programme." },
      { status: 500 },
    );
  }
}
