import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildRecommendationScores, topRecommendations, hasEnoughData } from "@/lib/festival-recommendations";

const LIMIT = 5;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ data: [], reason: "unauthenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  const followedRows = await prisma.userFollowsFestival.findMany({
    where: { userId },
    select: {
      festival: {
        select: { id: true, slug: true, festivalType: true, country: true, startDate: true, endDate: true },
      },
    },
  });

  const followedFestivals = followedRows.map((r) => ({
    id: r.festival.id,
    slug: r.festival.slug,
    festivalType: r.festival.festivalType,
    country: r.festival.country,
    startDate: r.festival.startDate.toISOString(),
    endDate: r.festival.endDate.toISOString(),
  }));

  if (!hasEnoughData(followedFestivals.length)) {
    return NextResponse.json({ data: [], reason: "no_followed_festivals" });
  }

  const followedIds = new Set(followedFestivals.map((f) => f.id));

  const allFestivals = await prisma.festival.findMany({
    where: { startDate: { gte: new Date() } },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      country: true,
      festivalType: true,
      startDate: true,
      endDate: true,
    },
  });

  const candidates = allFestivals.map((f) => ({
    id: f.id,
    slug: f.slug,
    festivalType: f.festivalType,
    country: f.country,
    startDate: f.startDate.toISOString(),
    endDate: f.endDate.toISOString(),
  }));

  const scores = buildRecommendationScores(followedFestivals, candidates);
  const top = topRecommendations(scores, followedIds, LIMIT);

  const topIds = top.map((r) => r.id);
  const scoreById = new Map(top.map((r) => [r.id, r]));

  const enriched = allFestivals
    .filter((f) => topIds.includes(f.id))
    .map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      city: f.city,
      country: f.country,
      festivalType: f.festivalType,
      startDate: f.startDate.toISOString(),
      endDate: f.endDate.toISOString(),
      score: scoreById.get(f.id)?.totalScore ?? 0,
      matchCount: scoreById.get(f.id)?.matchCount ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ data: enriched });
}
