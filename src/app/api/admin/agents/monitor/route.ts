import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin") return null;
  return session;
}

const schema = z.object({
  festivalId: z.string().min(1, "festivalId requis."),
});

const MOCK_TWEETS = [
  "Annonce officielle : Artiste X rejoint le line-up ! 🎉",
  "BREAKING — Nouveau groupe confirmé pour la scène principale !!",
  "Mise à jour programme : 3 nouveaux artistes ajoutés ce soir",
  "Le line-up complet est maintenant disponible sur notre site",
  "Surprise ! Artiste invité secret pour la soirée de clôture",
];

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const { festivalId } = parsed.data;

  const festival = await prisma.festival.findUnique({ where: { id: festivalId } });
  if (!festival) {
    return NextResponse.json({ error: "Festival introuvable." }, { status: 404 });
  }

  try {
    const randomTweet = MOCK_TWEETS[Math.floor(Math.random() * MOCK_TWEETS.length)] ?? MOCK_TWEETS[0];

    const newsItem = await prisma.newsItem.create({
      data: {
        festivalId,
        source: "x",
        sourceUrl: `https://x.com/festival_${festival.slug}`,
        publishedAt: new Date(),
        category: "line-up",
        summary: randomTweet ?? "Nouvelle annonce festival.",
        urgencyLevel: "normal",
      },
    });

    return NextResponse.json({
      data: {
        agent: "Agent 3 — Monitoring social",
        festivalId,
        newsItemId: newsItem.id,
        newsItem: {
          id: newsItem.id,
          source: newsItem.source,
          category: newsItem.category,
          summary: newsItem.summary,
          publishedAt: newsItem.publishedAt,
        },
        note: "NewsItem créée en base depuis simulation monitoring X.",
      },
    });
  } catch (err) {
    console.error("[admin/agents/monitor]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
