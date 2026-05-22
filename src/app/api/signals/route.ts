import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/signals?festivalId=xxx
 * Returns active (non-expired) signals for a festival, scoped to "communauté".
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const festivalId = searchParams.get("festivalId");

  if (!festivalId) {
    return NextResponse.json(
      { error: "festivalId est requis." },
      { status: 400 },
    );
  }

  const now = new Date();
  const signals = await prisma.signal.findMany({
    where: {
      festivalId,
      scope: "communauté",
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, pseudo: true, image: true } },
    },
  });

  return NextResponse.json(
    signals.map((s) => ({
      id: s.id,
      authorId: s.authorId,
      authorName: s.author.pseudo ?? s.author.name ?? "Anonyme",
      scope: s.scope,
      latitude: s.latitude,
      longitude: s.longitude,
      predefinedPhrase: s.predefinedPhrase ?? null,
      description: s.description ?? null,
      discoveryType: s.discoveryType ?? null,
      confirmations: s.confirmations,
      infirmations: s.infirmations,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
    })),
  );
}

/**
 * POST /api/signals
 * Create a discovery or situational signal.
 * Body: {
 *   scope: "crew" | "communauté",
 *   festivalId?: string,
 *   crewId?: string,
 *   latitude: number,
 *   longitude: number,
 *   description?: string,
 *   discoveryType?: string,
 *   predefinedPhrase?: string,
 *   expiresInMins?: number  (default 60)
 * }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  let body: {
    scope: "crew" | "communauté";
    festivalId?: string;
    crewId?: string;
    venueId?: string;
    eventId?: string;
    latitude: number;
    longitude: number;
    description?: string;
    discoveryType?: string;
    predefinedPhrase?: string;
    expiresInMins?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (!body.scope || body.latitude == null || body.longitude == null) {
    return NextResponse.json(
      { error: "scope, latitude et longitude sont requis." },
      { status: 400 },
    );
  }

  const expiresInMins = body.expiresInMins ?? 60;
  const expiresAt = new Date(Date.now() + expiresInMins * 60_000);

  const signal = await prisma.signal.create({
    data: {
      authorId: session.user.id,
      scope: body.scope,
      festivalId: body.festivalId ?? null,
      crewId: body.crewId ?? null,
      venueId: body.venueId ?? null,
      eventId: body.eventId ?? null,
      latitude: body.latitude,
      longitude: body.longitude,
      description: body.description ?? null,
      discoveryType: body.discoveryType ?? null,
      predefinedPhrase: body.predefinedPhrase ?? null,
      expiresAt,
    },
  });

  return NextResponse.json(
    {
      id: signal.id,
      scope: signal.scope,
      latitude: signal.latitude,
      longitude: signal.longitude,
      description: signal.description,
      discoveryType: signal.discoveryType,
      predefinedPhrase: signal.predefinedPhrase,
      confirmations: signal.confirmations,
      infirmations: signal.infirmations,
      createdAt: signal.createdAt.toISOString(),
      expiresAt: signal.expiresAt.toISOString(),
    },
    { status: 201 },
  );
}
