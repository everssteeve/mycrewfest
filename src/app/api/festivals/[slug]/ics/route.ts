import { type NextRequest, NextResponse } from "next/server";
import { buildFestivalIcs, festivalIcsFilename } from "@/lib/festival-ics";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const festival = await prisma.festival.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      startDate: true,
      endDate: true,
      city: true,
      country: true,
      description: true,
      siteUrl: true,
    },
  });

  if (!festival) {
    return NextResponse.json({ error: "Festival not found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const ics = buildFestivalIcs(
    {
      name: festival.name,
      slug: festival.slug,
      startDate: festival.startDate.toISOString(),
      endDate: festival.endDate.toISOString(),
      city: festival.city,
      country: festival.country,
      description: festival.description ?? undefined,
      siteUrl: festival.siteUrl ?? undefined,
    },
    baseUrl,
  );

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${festivalIcsFilename(slug)}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
