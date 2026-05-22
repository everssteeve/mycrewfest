import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ crewId: string }> };

const quickStatusSchema = z.object({
  status: z.enum(["fosse", "nourriture", "ralliement", "rentre"]),
});

/**
 * POST /api/crews/[crewId]/status
 * Broadcast a quick status to the crew.
 * For now: validate membership and return the status; in production store in Redis.
 */
export async function POST(
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

  const { crewId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const parsed = quickStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  try {
    const member = await prisma.crewMember.findFirst({
      where: { crewId, userId: session.user.id },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre de ce crew." },
        { status: 403 },
      );
    }

    // TODO: store in Redis for ephemeral real-time. For now, just echo back.
    return NextResponse.json({
      userId: session.user.id,
      status: parsed.data.status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/crews/[crewId]/status]", err);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du statut." },
      { status: 500 },
    );
  }
}
