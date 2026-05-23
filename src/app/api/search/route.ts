import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/api";
import { filterAndRankFestivals, filterAndRankArtists } from "@/lib/global-search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ festivals: [], artists: [], total: 0 });
  }

  const [festivals, artists] = await Promise.all([
    prisma.festival.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        country: true,
        startDate: true,
        endDate: true,
        festivalType: true,
        description: true,
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.artist.findMany({
      select: {
        id: true,
        name: true,
        disciplines: true,
        countryCode: true,
        _count: { select: { events: true } },
      },
    }),
  ]);

  const festivalResults = filterAndRankFestivals(
    festivals.map((f) => ({
      ...f,
      startDate: f.startDate.toISOString(),
      endDate: f.endDate.toISOString(),
    })),
    q,
    5,
  );

  const artistResults = filterAndRankArtists(
    artists.map((a) => ({
      id: a.id,
      name: a.name,
      disciplines: parseJsonArray(a.disciplines) as string[],
      countryCode: a.countryCode,
      festivalCount: a._count.events,
    })),
    q,
    5,
  );

  return NextResponse.json({
    festivals: festivalResults,
    artists: artistResults,
    total: festivalResults.length + artistResults.length,
  });
}
