import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ crewId: string }> };

const positionSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * POST /api/crews/[crewId]/position
 * Update the current user's GPS position (opt-in geoloc).
 * Stored in CrewMember lastLat / lastLng / lastSeenAt.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const { crewId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = positionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  try {
    const member = await prisma.crewMember.findFirst({
      where: { crewId, userId: session.user.id },
    });

    if (!member) {
      return NextResponse.json({ error: "Vous n'êtes pas membre de ce crew." }, { status: 403 });
    }

    // Update geoloc fields — lastLat / lastLng / lastSeenAt added to schema
    await prisma.crewMember.update({
      where: { id: member.id },
      data: {
        lastLat: parsed.data.lat,
        lastLng: parsed.data.lng,
        lastSeenAt: new Date(),
        geolocStatus: "active",
      },
    });

    return NextResponse.json({ updated: true });
  } catch (err) {
    console.error("[POST /api/crews/[crewId]/position]", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la position." },
      { status: 500 },
    );
  }
}

/**
 * GET /api/crews/[crewId]/position
 * Get all crew member positions (non-private, active geoloc).
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const { crewId } = await params;

  try {
    const members = await prisma.crewMember.findMany({
      where: { crewId },
      select: {
        userId: true,
        geolocStatus: true,
        isPrivate: true,
        lastLat: true,
        lastLng: true,
        lastSeenAt: true,
      },
    });

    const isMember = members.some((m) => m.userId === session.user?.id);
    if (!isMember) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const positions: Record<string, { lat: number; lng: number; updatedAt: string }> = {};

    for (const m of members) {
      if (
        m.geolocStatus === "active" &&
        !m.isPrivate &&
        m.lastLat !== null &&
        m.lastLng !== null &&
        m.lastSeenAt !== null
      ) {
        positions[m.userId] = {
          lat: m.lastLat,
          lng: m.lastLng,
          updatedAt: m.lastSeenAt.toISOString(),
        };
      }
    }

    return NextResponse.json(positions);
  } catch (err) {
    console.error("[GET /api/crews/[crewId]/position]", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des positions." },
      { status: 500 },
    );
  }
}
