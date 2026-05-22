import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/api";
import type { EventSummary } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/festevents/[id]/now-playing
 * Returns the currently-playing event (or null) and the next must-see event
 * for the authenticated user, calculated from the current server time.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id } = await params;

  const festEvent = await prisma.festEvent.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, festivalId: true },
  });

  if (!festEvent) {
    return NextResponse.json({ error: "FestEvent introuvable." }, { status: 404 });
  }

  const now = new Date();

  // Fetch all must-see selections with their events
  const mustSeeSelections = await prisma.selection.findMany({
    where: {
      festEventId: festEvent.id,
      status: "must-see",
    },
    include: {
      event: {
        include: {
          venue: {
            select: { id: true, name: true, type: true, latitude: true, longitude: true },
          },
          artist: {
            select: { id: true, name: true, disciplines: true, countryCode: true },
          },
        },
      },
    },
    orderBy: {
      event: {
        startTime: "asc",
      },
    },
  });

  const toEventSummary = (
    e: (typeof mustSeeSelections)[0]["event"],
  ): EventSummary => ({
    id: e.id,
    title: e.title,
    eventType: e.eventType as EventSummary["eventType"],
    startTime: e.startTime?.toISOString() ?? undefined,
    endTime: e.endTime?.toISOString() ?? undefined,
    durationMins: e.durationMins ?? undefined,
    access: e.access as EventSummary["access"],
    status: e.status as EventSummary["status"],
    confidence: (e.confidence ?? "auto") as EventSummary["confidence"],
    tags: parseJsonArray(e.tags),
    venue: e.venue
      ? {
          id: e.venue.id,
          name: e.venue.name,
          type: e.venue.type,
          latitude: e.venue.latitude ?? undefined,
          longitude: e.venue.longitude ?? undefined,
        }
      : undefined,
    artist: e.artist
      ? {
          id: e.artist.id,
          name: e.artist.name,
          disciplines: parseJsonArray(e.artist.disciplines),
          countryCode: e.artist.countryCode ?? undefined,
        }
      : undefined,
    selectionStatus: "must-see",
  });

  // Find currently-playing event (startTime <= now <= endTime)
  const currentSel = mustSeeSelections.find((s) => {
    const start = s.event.startTime;
    const end = s.event.endTime;
    if (!start) return false;
    const afterStart = now >= start;
    const beforeEnd = end ? now <= end : true;
    return afterStart && beforeEnd;
  });

  const current: EventSummary | null = currentSel
    ? toEventSummary(currentSel.event)
    : null;

  // Find next must-see event (startTime > now)
  const nextSel = mustSeeSelections.find((s) => {
    const start = s.event.startTime;
    return start != null && start > now;
  });

  const next: EventSummary | null = nextSel
    ? toEventSummary(nextSel.event)
    : null;

  const minsUntilNext: number | null =
    nextSel?.event.startTime != null
      ? Math.round((nextSel.event.startTime.getTime() - now.getTime()) / 60_000)
      : null;

  return NextResponse.json({ current, next, minsUntilNext });
}
