import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ signalId: string }> };

/**
 * PATCH /api/signals/[signalId]
 * Confirm or infirm a signal.
 * Body: { action: "confirm" | "infirm" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { signalId } = await params;

  const signal = await prisma.signal.findUnique({
    where: { id: signalId },
  });

  if (!signal) {
    return NextResponse.json({ error: "Signal introuvable." }, { status: 404 });
  }

  // Reject if expired
  if (signal.expiresAt < new Date()) {
    return NextResponse.json({ error: "Ce signal a expiré." }, { status: 400 });
  }

  let body: { action: "confirm" | "infirm" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (body.action !== "confirm" && body.action !== "infirm") {
    return NextResponse.json(
      { error: "action doit être 'confirm' ou 'infirm'." },
      { status: 400 },
    );
  }

  const updated = await prisma.signal.update({
    where: { id: signalId },
    data:
      body.action === "confirm"
        ? { confirmations: { increment: 1 } }
        : { infirmations: { increment: 1 } },
  });

  return NextResponse.json({
    id: updated.id,
    confirmations: updated.confirmations,
    infirmations: updated.infirmations,
    expiresAt: updated.expiresAt.toISOString(),
  });
}
