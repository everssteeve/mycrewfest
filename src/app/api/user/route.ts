import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z.object({
  pseudo: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  photo: z.string().url().nullable().optional(),
});

/**
 * GET /api/user
 * Fetch the authenticated user's profile + stats.
 */
export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        pseudo: true,
        photo: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            festEvents: true,
            followedFestivals: true,
            souvenirs: true,
          },
        },
        festEvents: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            mode: true,
            createdAt: true,
            festival: {
              select: {
                id: true,
                name: true,
                slug: true,
                startDate: true,
                endDate: true,
                city: true,
                country: true,
              },
            },
          },
        },
        followedFestivals: {
          select: {
            festival: {
              select: {
                id: true,
                name: true,
                slug: true,
                startDate: true,
                endDate: true,
                city: true,
                country: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      pseudo: user.pseudo,
      photo: user.photo ?? user.image,
      createdAt: user.createdAt.toISOString(),
      stats: {
        festEventsCount: user._count.festEvents,
        followedFestivalsCount: user._count.followedFestivals,
        souvenirsCount: user._count.souvenirs,
      },
      festEvents: user.festEvents.map((fe) => ({
        id: fe.id,
        mode: fe.mode,
        createdAt: fe.createdAt.toISOString(),
        festival: {
          ...fe.festival,
          startDate: fe.festival.startDate.toISOString(),
          endDate: fe.festival.endDate.toISOString(),
        },
      })),
      followedFestivals: user.followedFestivals.map((uf) => ({
        ...uf.festival,
        startDate: uf.festival.startDate.toISOString(),
        endDate: uf.festival.endDate.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/user]", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du profil." },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/user
 * Update the authenticated user's profile.
 */
export async function PATCH(request: NextRequest) {
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

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const { pseudo, name, photo } = parsed.data;

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(pseudo !== undefined && { pseudo }),
        ...(name !== undefined && { name }),
        ...(photo !== undefined && { photo }),
      },
      select: { id: true, pseudo: true, name: true, photo: true, updatedAt: true },
    });

    return NextResponse.json({
      id: updated.id,
      pseudo: updated.pseudo,
      name: updated.name,
      photo: updated.photo,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("[PATCH /api/user]", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/user
 * Permanent RGPD account deletion.
 * Cascades to all related data via Prisma relations.
 */
export async function DELETE(_request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  try {
    // Hard delete — Prisma cascades handle related data cleanup
    await prisma.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/user]", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du compte." },
      { status: 500 },
    );
  }
}
