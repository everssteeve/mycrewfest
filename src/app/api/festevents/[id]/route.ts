import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

const updateFestEventSchema = z.object({
  mode: z.enum(["solo", "crew"]).optional(),
  programTypeOverride: z
    .enum(["structuré", "déambulatoire", "hybride"])
    .nullable()
    .optional(),
  presenceDates: z.array(z.string()).optional(),
  arrivalConstraint: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional(),
  departureConstraint: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional(),
  comfortMarginMins: z.number().int().min(0).max(120).optional(),
});

async function resolveFestEvent(id: string, userId: string) {
  return prisma.festEvent.findFirst({
    where: { id, userId },
  });
}

/**
 * GET /api/festevents/[id]
 * Get the detail of a FestEvent (auth required).
 */
export async function GET(
  _request: NextRequest,
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

  try {
    const fe = await prisma.festEvent.findFirst({
      where: { id, userId: session.user.id },
      include: {
        festival: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            startDate: true,
            endDate: true,
            city: true,
            country: true,
            latitude: true,
            longitude: true,
            festivalType: true,
            programType: true,
            programStatus: true,
            ingestionStatus: true,
            confidenceLevel: true,
            capacity: true,
            siteUrl: true,
            instagramHandle: true,
          },
        },
        selections: {
          orderBy: { createdAt: "desc" },
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
        },
        _count: { select: { selections: true } },
      },
    });

    if (!fe) {
      return NextResponse.json(
        { error: "FestEvent introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: fe.id,
      mode: fe.mode,
      programTypeOverride: fe.programTypeOverride,
      presenceDates: parseJsonArray(fe.presenceDates),
      arrivalConstraint: fe.arrivalConstraint?.toISOString() ?? null,
      departureConstraint: fe.departureConstraint?.toISOString() ?? null,
      comfortMarginMins: fe.comfortMarginMins,
      shareToken: fe.shareToken,
      createdAt: fe.createdAt.toISOString(),
      updatedAt: fe.updatedAt.toISOString(),
      festival: {
        ...fe.festival,
        startDate: fe.festival.startDate.toISOString(),
        endDate: fe.festival.endDate.toISOString(),
      },
      _count: fe._count,
      selections: fe.selections.map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        event: {
          id: s.event.id,
          title: s.event.title,
          eventType: s.event.eventType,
          startTime: s.event.startTime?.toISOString() ?? null,
          endTime: s.event.endTime?.toISOString() ?? null,
          durationMins: s.event.durationMins,
          access: s.event.access,
          status: s.event.status,
          tags: parseJsonArray(s.event.tags),
          venue: s.event.venue ?? null,
          artist: s.event.artist
            ? {
                id: s.event.artist.id,
                name: s.event.artist.name,
                description: s.event.artist.description,
                disciplines: parseJsonArray(s.event.artist.disciplines),
                countryCode: s.event.artist.countryCode,
                siteUrl: s.event.artist.siteUrl,
                instagram: s.event.artist.instagram,
              }
            : null,
        },
      })),
    });
  } catch (err) {
    console.error("[GET /api/festevents/[id]]", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du FestEvent." },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/festevents/[id]
 * Update a FestEvent (auth required).
 */
export async function PUT(
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const parsed = updateFestEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const existing = await resolveFestEvent(id, session.user.id);
  if (!existing) {
    return NextResponse.json(
      { error: "FestEvent introuvable." },
      { status: 404 },
    );
  }

  const {
    mode,
    programTypeOverride,
    presenceDates,
    arrivalConstraint,
    departureConstraint,
    comfortMarginMins,
  } = parsed.data;

  try {
    const updated = await prisma.festEvent.update({
      where: { id },
      data: {
        ...(mode !== undefined && { mode }),
        ...(programTypeOverride !== undefined && { programTypeOverride }),
        ...(presenceDates !== undefined && {
          presenceDates: JSON.stringify(presenceDates),
        }),
        ...(arrivalConstraint !== undefined && {
          arrivalConstraint: arrivalConstraint ? new Date(arrivalConstraint) : null,
        }),
        ...(departureConstraint !== undefined && {
          departureConstraint: departureConstraint
            ? new Date(departureConstraint)
            : null,
        }),
        ...(comfortMarginMins !== undefined && { comfortMarginMins }),
      },
      select: { id: true, updatedAt: true },
    });

    return NextResponse.json({ id: updated.id, updatedAt: updated.updatedAt.toISOString() });
  } catch (err) {
    console.error("[PUT /api/festevents/[id]]", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du FestEvent." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/festevents/[id]
 * Delete a FestEvent (auth required).
 */
export async function DELETE(
  _request: NextRequest,
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

  const existing = await resolveFestEvent(id, session.user.id);
  if (!existing) {
    return NextResponse.json(
      { error: "FestEvent introuvable." },
      { status: 404 },
    );
  }

  try {
    await prisma.festEvent.delete({ where: { id } });
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/festevents/[id]]", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du FestEvent." },
      { status: 500 },
    );
  }
}
