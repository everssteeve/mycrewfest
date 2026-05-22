import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
