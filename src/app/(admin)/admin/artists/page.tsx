import { revalidatePath } from "next/cache";
import {
  type AdminArtistRow,
  countArtistsMissingCountry,
  countArtistsMissingDisciplines,
  countOrphanArtists,
  sortAdminArtistsByName,
} from "@/lib/admin-artists";
import { parseJsonArray } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ArtistSearchTable } from "./_components/artist-search-table";

export const metadata = { title: "Admin — Artistes" };

async function getArtists(): Promise<AdminArtistRow[]> {
  const artists = await prisma.artist.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      disciplines: true,
      countryCode: true,
      instagram: true,
      siteUrl: true,
      _count: { select: { events: true } },
    },
  });

  return artists.map((a) => ({
    id: a.id,
    name: a.name,
    disciplines: parseJsonArray(a.disciplines),
    countryCode: a.countryCode,
    eventCount: a._count.events,
    instagram: a.instagram,
    siteUrl: a.siteUrl,
  }));
}

export default async function AdminArtistsPage() {
  const rawArtists = await getArtists();
  const artists = sortAdminArtistsByName(rawArtists);
  const missingCountry = countArtistsMissingCountry(artists);
  const missingDisciplines = countArtistsMissingDisciplines(artists);
  const orphanCount = countOrphanArtists(artists);

  async function updateArtistCountry(artistId: string, countryCode: string) {
    "use server";
    await prisma.artist.update({
      where: { id: artistId },
      data: { countryCode: countryCode.trim().toUpperCase() || null },
    });
    revalidatePath("/admin/artists");
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-lg)",
          flexWrap: "wrap",
          gap: "var(--space-md)",
        }}
      >
        <h1
          data-testid="admin-artists-title"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-2xl)",
            color: "var(--text-main)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          Artistes
        </h1>
        <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
          <span
            data-testid="admin-artists-total"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-dim)",
            }}
          >
            {artists.length} artiste{artists.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Data quality alerts */}
      {(missingCountry > 0 || missingDisciplines > 0 || orphanCount > 0) && (
        <div
          data-testid="admin-artists-quality-alert"
          style={{
            display: "flex",
            gap: "var(--space-md)",
            flexWrap: "wrap",
            marginBottom: "var(--space-lg)",
          }}
        >
          {missingCountry > 0 && (
            <div
              style={{
                padding: "var(--space-sm) var(--space-md)",
                background: "rgba(255,153,0,0.08)",
                border: "1px solid var(--warning-orange)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--warning-orange)",
              }}
            >
              ⚠ {missingCountry} artiste{missingCountry > 1 ? "s" : ""} sans pays
            </div>
          )}
          {missingDisciplines > 0 && (
            <div
              style={{
                padding: "var(--space-sm) var(--space-md)",
                background: "rgba(255,153,0,0.08)",
                border: "1px solid var(--warning-orange)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--warning-orange)",
              }}
            >
              ⚠ {missingDisciplines} artiste{missingDisciplines > 1 ? "s" : ""} sans discipline
            </div>
          )}
          {orphanCount > 0 && (
            <div
              data-testid="admin-artists-orphan-alert"
              style={{
                padding: "var(--space-sm) var(--space-md)",
                background: "rgba(255,51,85,0.08)",
                border: "1px solid var(--danger-red)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--danger-red)",
              }}
            >
              ⚠ {orphanCount} artiste{orphanCount > 1 ? "s" : ""} sans événement
            </div>
          )}
        </div>
      )}

      {/* Client-side searchable table */}
      <ArtistSearchTable artists={artists} updateArtistCountry={updateArtistCountry} />
    </div>
  );
}
