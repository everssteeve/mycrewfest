import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/festevents/[id]/souvenirs
 * List all souvenirs for a FestEvent, newest first.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id } = await params;

  const festEvent = await prisma.festEvent.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!festEvent) {
    return NextResponse.json({ error: "FestEvent introuvable." }, { status: 404 });
  }

  const souvenirs = await prisma.souvenir.findMany({
    where: { festEventId: festEvent.id, userId: session.user.id },
    orderBy: { timestamp: "desc" },
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

  const mapped = souvenirs.map((s) => ({
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

  return NextResponse.json(mapped);
}

/**
 * POST /api/festevents/[id]/souvenirs
 * Create a new souvenir for the authenticated user.
 * Body: { eventId?: string, freeText?: string, note?: string, photos?: string[], timestamp?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id } = await params;

  const festEvent = await prisma.festEvent.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!festEvent) {
    return NextResponse.json({ error: "FestEvent introuvable." }, { status: 404 });
  }

  let body: {
    eventId?: string;
    freeText?: string;
    note?: string;
    photos?: string[];
    timestamp?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (!body.eventId && !body.freeText) {
    return NextResponse.json(
      { error: "Fournir au moins eventId ou freeText." },
      { status: 400 },
    );
  }

  // Validate eventId if provided
  if (body.eventId) {
    const event = await prisma.event.findUnique({
      where: { id: body.eventId },
      select: { id: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Événement introuvable." }, { status: 400 });
    }
  }

  const souvenir = await prisma.souvenir.create({
    data: {
      userId: session.user.id,
      festEventId: festEvent.id,
      eventId: body.eventId ?? null,
      freeText: body.freeText ?? null,
      note: body.note ?? null,
      photos: body.photos?.length ? JSON.stringify(body.photos) : null,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
    },
  });

  return NextResponse.json(
    {
      id: souvenir.id,
      festEventId: souvenir.festEventId,
      eventId: souvenir.eventId,
      freeText: souvenir.freeText,
      note: souvenir.note,
      photos: parseJsonArray(souvenir.photos),
      timestamp: souvenir.timestamp.toISOString(),
      createdAt: souvenir.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
