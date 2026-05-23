import type { Metadata } from "next";
import { TopHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/api";
import { ArtistList } from "./_components/artist-list";

export const metadata: Metadata = {
  title: "Artistes",
  description: "Découvrez tous les artistes des festivals MyCrewFest.",
};

async function fetchArtists() {
  const artists = await prisma.artist.findMany({
    select: {
      id: true,
      name: true,
      disciplines: true,
      countryCode: true,
      _count: { select: { events: true } },
    },
    orderBy: { name: "asc" },
  });

  return artists.map((a) => ({
    id: a.id,
    name: a.name,
    disciplines: parseJsonArray(a.disciplines) as string[],
    countryCode: a.countryCode,
    festivalCount: a._count.events,
  }));
}

export default async function ArtistesPage() {
  const artists = await fetchArtists();

  return (
    <>
      <TopHeader title="ARTISTES" />
      <div style={{ padding: "var(--space-md) var(--space-md) 80px" }}>
        <ArtistList initialArtists={artists} />
      </div>
    </>
  );
}
