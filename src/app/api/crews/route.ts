import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createCrewSchema = z.object({
  name: z.string().min(1).max(50),
  festEventId: z.string().min(1),
});

function serializeCrew(crew: {
  id: string;
  name: string | null;
  inviteCode: string;
  rallyLatitude: number | null;
  rallyLongitude: number | null;
  rallyDescription: string | null;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    geolocStatus: string;
    isPrivate: boolean;
    user: { name: string | null; image: string | null };
  }>;
}) {
  return {
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
      role: m.role as "admin" | "membre",
      geolocStatus: m.geolocStatus as "off" | "active" | "background",
      isPrivate: m.isPrivate,
    })),
  };
}

/**
 * GET /api/crews
 * Return the crew linked to the current user's active FestEvent (query: ?festEventId=...)
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const festEventId = request.nextUrl.searchParams.get("festEventId");
  if (!festEventId) {
    return NextResponse.json({ error: "festEventId est requis." }, { status: 400 });
  }

  try {
    const festEvent = await prisma.festEvent.findFirst({
      where: { id: festEventId, userId: session.user.id },
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

    return NextResponse.json(serializeCrew(crew));
  } catch (err) {
    console.error("[GET /api/crews]", err);
    return NextResponse.json({ error: "Erreur lors de la récupération du crew." }, { status: 500 });
  }
}

/**
 * POST /api/crews
 * Create a crew and link it to a FestEvent.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

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

  const { name, festEventId } = parsed.data;

  const festEvent = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId: session.user.id },
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
        name,
        members: {
          create: {
            userId: session.user.id,
            role: "admin",
          },
        },
        festEvents: {
          connect: { id: festEventId },
        },
      },
      include: {
        members: {
          include: { user: { select: { name: true, image: true } } },
        },
      },
    });

    // Also update mode to "crew"
    await prisma.festEvent.update({
      where: { id: festEventId },
      data: { mode: "crew" },
    });

    return NextResponse.json(serializeCrew(crew), { status: 201 });
  } catch (err) {
    console.error("[POST /api/crews]", err);
    return NextResponse.json({ error: "Erreur lors de la création du crew." }, { status: 500 });
  }
}
