import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { parseJsonArray } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const festival = await prisma.festival.findUnique({
      where: { slug },
      include: {
        events: {
          include: {
            artist: true,
            venue: { select: { id: true, name: true, type: true, capacity: true, latitude: true, longitude: true } },
          },
          orderBy: { startTime: "asc" },
        },
        venues: { orderBy: { name: "asc" } },
        newsItems: {
          orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
          take: 10,
        },
        _count: { select: { events: true, followers: true } },
      },
    });

    if (!festival) {
      return NextResponse.json(
        { error: "Festival introuvable." },
        { status: 404 },
      );
    }

    let isFollowed = false;
    if (userId) {
      const follow = await prisma.userFollowsFestival.findUnique({
        where: { userId_festivalId: { userId, festivalId: festival.id } },
        select: { userId: true },
      });
      isFollowed = follow !== null;
    }

    const result = {
      id: festival.id,
      name: festival.name,
      slug: festival.slug,
      description: festival.description,
      startDate: festival.startDate.toISOString(),
      endDate: festival.endDate.toISOString(),
      city: festival.city,
      country: festival.country,
      latitude: festival.latitude,
      longitude: festival.longitude,
      address: festival.address,
      festivalType: festival.festivalType,
      programType: festival.programType,
      programStatus: festival.programStatus,
      confidenceLevel: festival.confidenceLevel,
      ingestionStatus: festival.ingestionStatus,
      capacity: festival.capacity,
      siteUrl: festival.siteUrl,
      instagramHandle: festival.instagramHandle,
      facebookPage: festival.facebookPage,
      xHandle: festival.xHandle,
      mapImageUrl: festival.mapImageUrl,
      _count: festival._count,
      isFollowed,
      venues: festival.venues.map((v) => ({
        id: v.id,
        name: v.name,
        type: v.type,
        capacity: v.capacity,
        latitude: v.latitude,
        longitude: v.longitude,
      })),
      events: festival.events.map((e) => ({
        id: e.id,
        title: e.title,
        eventType: e.eventType,
        startTime: e.startTime?.toISOString() ?? null,
        endTime: e.endTime?.toISOString() ?? null,
        durationMins: e.durationMins,
        access: e.access,
        status: e.status,
        tags: parseJsonArray(e.tags),
        venue: e.venue
          ? {
              id: e.venue.id,
              name: e.venue.name,
              type: e.venue.type,
              capacity: e.venue.capacity,
              latitude: e.venue.latitude,
              longitude: e.venue.longitude,
            }
          : null,
        artist: e.artist
          ? {
              id: e.artist.id,
              name: e.artist.name,
              description: e.artist.description,
              disciplines: parseJsonArray(e.artist.disciplines),
              countryCode: e.artist.countryCode,
              siteUrl: e.artist.siteUrl,
              instagram: e.artist.instagram,
            }
          : null,
      })),
      newsItems: festival.newsItems.map((n) => ({
        id: n.id,
        source: n.source,
        sourceUrl: n.sourceUrl,
        publishedAt: n.publishedAt.toISOString(),
        category: n.category,
        summary: n.summary,
        urgencyLevel: n.urgencyLevel,
        isPinned: n.isPinned,
      })),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/festivals/[slug]]", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du festival." },
      { status: 500 },
    );
  }
}
