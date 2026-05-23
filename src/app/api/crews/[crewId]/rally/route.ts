import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ crewId: string }> };

const rallySchema = z.object({
  lat: z.number(),
  lng: z.number(),
  description: z.string().max(120).optional(),
});

/**
 * PUT /api/crews/[crewId]/rally
 * Set or update the crew rally point (admin only).
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
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

  const parsed = rallySchema.safeParse(body);
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

    if (member.role !== "admin") {
      return NextResponse.json(
        { error: "Seul l'admin peut modifier le point de ralliement." },
        { status: 403 },
      );
    }

    const updated = await prisma.crew.update({
      where: { id: crewId },
      data: {
        rallyLatitude: parsed.data.lat,
        rallyLongitude: parsed.data.lng,
        rallyDescription: parsed.data.description ?? null,
      },
      select: {
        rallyLatitude: true,
        rallyLongitude: true,
        rallyDescription: true,
      },
    });

    return NextResponse.json({
      lat: updated.rallyLatitude,
      lng: updated.rallyLongitude,
      description: updated.rallyDescription,
    });
  } catch (err) {
    console.error("[PUT /api/crews/[crewId]/rally]", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du point de ralliement." },
      { status: 500 },
    );
  }
}
