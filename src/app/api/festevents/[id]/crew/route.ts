import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const createCrewSchema = z.object({
  name: z.string().min(1).max(50),
});

/**
 * GET /api/festevents/[id]/crew
 * Return the crew linked to this FestEvent.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const festEvent = await prisma.festEvent.findFirst({
      where: { id, userId: session.user.id },
      select: { crewId: true },
    });

    if (!festEvent) {
      return NextResponse.json({ error: "FestEvent introuvable." }, { status: 404 });
    }

    if (!festEvent.crewId) {
      return NextResponse.json(null, { status: 200 });
    }

    const crew = await prisma.crew.findUnique({
      where: { id: festEvent.crewId },
      include: {
        members: {
          include: { user: { select: { name: true, image: true } } },
        },
      },
    });

    if (!crew) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json({
      id: crew.id,
      name: crew.name,
      inviteCode: crew.inviteCode,
      rallyLatitude: crew.rallyLatitude,
      rallyLongitude: crew.rallyLongitude,
      rallyDescription: crew.rallyDescription,
      members: crew.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        userName: m.user.name ?? undefined,
        userImage: m.user.image ?? undefined,
        role: m.role,
        geolocStatus: m.geolocStatus,
        isPrivate: m.isPrivate,
      })),
    });
  } catch (err) {
    console.error("[GET /api/festevents/[id]/crew]", err);
    return NextResponse.json({ error: "Erreur lors de la récupération du crew." }, { status: 500 });
  }
}

/**
 * POST /api/festevents/[id]/crew
 * Create a crew for this FestEvent.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = createCrewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const festEvent = await prisma.festEvent.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, crewId: true },
  });

  if (!festEvent) {
    return NextResponse.json({ error: "FestEvent introuvable." }, { status: 404 });
  }

  if (festEvent.crewId) {
    return NextResponse.json(
      { error: "Ce FestEvent est déjà lié à un crew.", crewId: festEvent.crewId },
      { status: 409 },
    );
  }

  try {
    const crew = await prisma.crew.create({
      data: {
        name: parsed.data.name,
        members: {
          create: {
            userId: session.user.id,
            role: "admin",
          },
        },
        festEvents: {
          connect: { id },
        },
      },
      include: {
        members: {
          include: { user: { select: { name: true, image: true } } },
        },
      },
    });

    await prisma.festEvent.update({
      where: { id },
      data: { mode: "crew" },
    });

    return NextResponse.json(
      {
        id: crew.id,
        name: crew.name,
        inviteCode: crew.inviteCode,
        members: crew.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          userName: m.user.name ?? undefined,
          userImage: m.user.image ?? undefined,
          role: m.role,
          geolocStatus: m.geolocStatus,
          isPrivate: m.isPrivate,
        })),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/festevents/[id]/crew]", err);
    return NextResponse.json({ error: "Erreur lors de la création du crew." }, { status: 500 });
  }
}
