import { Music2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TopHeader } from "@/components/ui";
import { parseJsonArray } from "@/lib/api";
import { prisma } from "@/lib/prisma";
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
      <TopHeader
        title="ARTISTES"
        right={
          <Link
            href="/mes-artistes"
            aria-label="Mes artistes"
            data-testid="artistes-mes-artistes-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-md)",
              color: "var(--secondary-cyan)",
              textDecoration: "none",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs, 11px)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <Music2 size={13} aria-hidden="true" />
            Mes artistes
          </Link>
        }
      />
      <div style={{ padding: "var(--space-md) var(--space-md) 80px" }}>
        <ArtistList initialArtists={artists} />
      </div>
    </>
  );
}
