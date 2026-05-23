import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ crewId: string }> };

/**
 * GET /api/crews/[crewId]
 * Return crew detail + members + active signals.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const { crewId } = await params;

  try {
    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
      include: {
        members: {
          include: { user: { select: { name: true, image: true } } },
        },
        signals: {
          where: {
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!crew) {
      return NextResponse.json({ error: "Crew introuvable." }, { status: 404 });
    }

    // Check the user is a member
    const isMember = crew.members.some((m) => m.userId === session.user?.id);
    if (!isMember) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
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
      signals: crew.signals.map((s) => ({
        id: s.id,
        authorId: s.authorId,
        scope: s.scope,
        latitude: s.latitude,
        longitude: s.longitude,
        description: s.description,
        discoveryType: s.discoveryType,
        predefinedPhrase: s.predefinedPhrase,
        confirmations: s.confirmations,
        infirmations: s.infirmations,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/crews/[crewId]]", err);
    return NextResponse.json({ error: "Erreur lors de la récupération du crew." }, { status: 500 });
  }
}
