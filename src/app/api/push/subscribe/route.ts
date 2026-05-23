import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string(),
  auth: z.string(),
  festEventId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const { endpoint, p256dh, auth: authKey, festEventId } = parsed.data;

  try {
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh,
        auth: authKey,
        festEventId: festEventId ?? null,
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh,
        auth: authKey,
        festEventId: festEventId ?? null,
      },
    });

    return NextResponse.json({ id: subscription.id }, { status: 201 });
  } catch (err) {
    console.error("[push/subscribe]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
