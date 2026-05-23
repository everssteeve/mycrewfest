import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { parseJsonArray } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const createFestEventSchema = z.object({
  festivalSlug: z.string().min(1, "Le slug du festival est requis."),
  mode: z.enum(["solo", "crew"]).default("solo"),
  programTypeOverride: z.enum(["structuré", "déambulatoire", "hybride"]).optional(),
  presenceDates: z.array(z.string()).optional(),
  arrivalConstraint: z.string().datetime({ offset: true }).optional().nullable(),
  departureConstraint: z.string().datetime({ offset: true }).optional().nullable(),
  comfortMarginMins: z.number().int().min(0).max(120).default(15),
});

/**
 * GET /api/festevents
 * List the current user's FestEvents (auth required).
 */
export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  try {
    const festEvents = await prisma.festEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
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
        _count: { select: { selections: true } },
      },
    });

    const data = festEvents.map((fe) => ({
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
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/festevents]", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des FestEvents." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/festevents
 * Create a FestEvent from a festival (auth required).
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

  const parsed = createFestEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const {
    festivalSlug,
    mode,
    programTypeOverride,
    presenceDates,
    arrivalConstraint,
    departureConstraint,
    comfortMarginMins,
  } = parsed.data;

  const festival = await prisma.festival.findUnique({
    where: { slug: festivalSlug },
    select: { id: true },
  });

  if (!festival) {
    return NextResponse.json({ error: "Festival introuvable." }, { status: 404 });
  }

  // Check if a FestEvent already exists for this user+festival
  const existing = await prisma.festEvent.findFirst({
    where: { userId: session.user.id, festivalId: festival.id },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Vous avez déjà un FestEvent pour ce festival.", id: existing.id },
      { status: 409 },
    );
  }

  try {
    const festEvent = await prisma.festEvent.create({
      data: {
        userId: session.user.id,
        festivalId: festival.id,
        mode,
        programTypeOverride: programTypeOverride ?? null,
        presenceDates: presenceDates ? JSON.stringify(presenceDates) : null,
        arrivalConstraint: arrivalConstraint ? new Date(arrivalConstraint) : null,
        departureConstraint: departureConstraint ? new Date(departureConstraint) : null,
        comfortMarginMins,
      },
    });

    return NextResponse.json({ id: festEvent.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/festevents]", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du FestEvent." },
      { status: 500 },
    );
  }
}
