import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ crewId: string }> };

/**
 * GET /api/crews/[crewId]/events
 * SSE endpoint — streams crew position + status updates.
 * Falls back to a single JSON snapshot for clients that don't support SSE.
 *
 * Strategy: Vercel serverless doesn't support persistent WebSockets.
 * We use ReadableStream with SSE headers + polling 10s on the client side.
 */
export async function GET(
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
        user: { select: { name: true } },
      },
    });

    const isMember = members.some((m) => m.userId === session.user?.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "Accès refusé." },
        { status: 403 },
      );
    }

    const positions: Record<
      string,
      { lat: number; lng: number; updatedAt: string }
    > = {};

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

    // SSE stream: send one snapshot and close (client polls every 10s)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const data = JSON.stringify({ type: "positions", positions });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[GET /api/crews/[crewId]/events]", err);
    return NextResponse.json(
      { error: "Erreur lors de l'ouverture du flux SSE." },
      { status: 500 },
    );
  }
}
